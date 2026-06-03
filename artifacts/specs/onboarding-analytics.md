# 阶段 6.5+7：数据埋点基线 & Tour 向导式新手引导

> **版本**：v1.0 | **日期**：2026-06-03 | **状态**：已实现
> **关联分支**：阶段 6.5（埋点）+ 阶段 7（Tour）

---

## 1. 概述

### 1.1 功能定位

- **阶段 6.5（数据埋点基线）**：在关键用户行为节点上报事件到 Supabase 原生 `analytics_events` 表，不引入第三方 SDK
- **阶段 7（Tour 向导式新手引导）**：引入 `react-joyride` 库，新用户首次进入 Dashboard 时自动触发逐步高亮引导，完成后持久化记录，不再弹出

### 1.2 业务背景

- 当前 `/guide` 路由的 OnboardingPage 是静态引导卡片，需用户手动访问
- 缺少用户行为数据采集，无法分析激活漏斗
- 新用户面临功能空态，缺乏"手把手"引导

### 1.3 设计原则

- 埋点：fire-and-forget（不阻塞主流程、失败静默丢弃）
- Tour：仅首次触发、允许跳过/关闭、全部文案接入 i18n
- 两个阶段共享 `profiles.introduce_completed_at` 字段：Tour 完成后写入，埋点不依赖此字段

---

## 2. 数据契约

### 2.1 新建 analytics_events 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | `PK DEFAULT gen_random_uuid()` | 事件主键 |
| `user_id` | `uuid` | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` | 关联用户 |
| `event_name` | `text` | `NOT NULL` | 事件名（枚举值见 2.3） |
| `metadata` | `jsonb` | `DEFAULT '{}'::jsonb` | 事件附加数据 |
| `created_at` | `timestamptz` | `DEFAULT now()` | 事件触发时间 |

**RLS 策略**：
- `INSERT`：仅允许 `auth.uid() = user_id`
- `SELECT`：仅允许 `auth.uid() = user_id`（若将来需要查询自己埋点数据）

**索引**：
- `(user_id, event_name)` 联合索引（用于首条判断查询）
- `(created_at)` 索引（用于时间范围查询）

### 2.2 profiles 表新增列

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `introduce_completed_at` | `timestamptz` | `DEFAULT NULL` | Tour 完成时间戳。NULL = 未完成/未触发 |

**现有列不变**：`id, display_name, avatar_url, created_at`

**RLS**：沿用 profiles 表现有策略（`SELECT` 允许所有认证用户，`UPDATE` 仅允许 `auth.uid() = id`）

**database.ts 类型变更**：
- `profiles.Row` 新增 `introduce_completed_at: string | null`
- `profiles.Insert` 新增 `introduce_completed_at?: string | null`
- `profiles.Update` 新增 `introduce_completed_at?: string | null`

### 2.3 埋点事件定义

#### 事件枚举

| 事件名 | 触发点 | 触发时机 | metadata 结构 | 首条判断 |
|--------|--------|----------|---------------|----------|
| `register` | `authStore.signUp` 返回 `AUTH_SIGN_UP_SUCCESS` | signUp 成功后（含邮箱验证绕过场景） | `{ provider?: "email" \| "google" \| "github" }` | 无需（注册只能一次） |
| `first_content_create` | `entries.createEntry` 返回 `ApiResult<EntryRow>` 且 `error === null` 后 | entry 创建成功后 | `{ entry_id: string }` | 是：先查 `analytics_events` 表中当前 user_id 是否已有 `first_content_create` 记录，存在则跳过上报 |
| `first_review_complete` | `reviews.completeReview` 返回 `ApiResult<ReviewRow>` 且 `error === null` 后 | review 评分提交成功后 | `{ review_id: string, entry_id: string, rating: number }` | 是：先查 `analytics_events` 表中当前 user_id 是否已有 `first_review_complete` 记录，存在则跳过上报 |

**约束**：
- 埋点调用不抛异常：所有 `trackEvent()` 调用包裹 `try/catch`，失败仅 `console.warn`，不阻塞主流程
- `first_content_create` / `first_review_complete` 首条判断在同一事务内完成「查询 → 判断 → 插入」或依赖唯一约束防止 race，此处取"先查后插"模式（并发概率极低，可接受）
- metadata JSON 中不使用 undefined，统一用 `null` 或省略

---

## 3. 前端契约

### 3.1 新增文件清单

| 文件路径 | 职责 |
|----------|------|
| `src/lib/api/analytics.ts` | trackEvent() 函数封装：插入 analytics_events 行 |
| `src/hooks/useTour.ts` | Tour 状态管理：是否触发、steps 定义、完成回调、持久化 introduce_completed_at |
| `src/components/tour/TourGuide.tsx` | react-joyride 封装组件：接收 steps & 回调，渲染 JoyRide |

### 3.2 修改文件清单

| 文件路径 | 修改内容 |
|----------|----------|
| `src/types/database.ts` | profiles Row/Insert/Update 新增 `introduce_completed_at`；新增 `analytics_events` 表类型 | 
| `src/lib/api/profiles.ts` | ProfileUpdate 类型会自动包含 `introduce_completed_at`（无需手动改 Omit）——实际上需确认 `introduce_completed_at` 是否应从 Update 中排除（用户不应自由修改），当前 Omit<..., "id"> 不排除它，因此需要在 `updateProfile` 调用处约束或用 Pick 限制 |
| `src/stores/authStore.ts` | signUp `AUTH_SIGN_UP_SUCCESS` 分支后调用 trackEvent("register") |
| `src/lib/api/entries.ts` | createEntry 成功后调用 trackEvent("first_content_create") |
| `src/lib/api/reviews.ts` | completeReview 成功后调用 trackEvent("first_review_complete") |
| `src/pages/Dashboard.tsx` | 用户登录后检测 `introduce_completed_at`，若为 null 则渲染 TourGuide 组件 |
| `src/App.tsx` | 无需修改路由；Tour 作为 Dashboard 内嵌组件 |
| `src/lib/i18n/messages.ts` | 新增 onboarding/tour 相关键（见 3.6） |

### 3.3 analytics API 接口签名

```typescript
// src/lib/api/analytics.ts

export type AnalyticsEventName = 
  | "register"
  | "first_content_create"
  | "first_review_complete";

export type AnalyticsEventMetadata = Record<string, unknown>;

/** 
 * 上报单个埋点事件（fire-and-forget）。
 * - first_content_create / first_review_complete 会在插入前做首条查重
 * - 方法内 try/catch，失败仅 console.warn，永远不抛异常
 * - 不阻塞调用方：调用方无需 await 或处理返回值
 */
export function trackEvent(
  userId: string,
  eventName: AnalyticsEventName,
  metadata?: AnalyticsEventMetadata
): void;
```

**实现要点**：
- 使用 `getSupabaseClient().from("analytics_events").insert({ user_id, event_name, metadata })`
- `first_content_create` / `first_review_complete` 先 `.select("id").eq("user_id", userId).eq("event_name", eventName).maybeSingle()`，有结果则跳过
- 不返回 ApiResult，不设置 loading/error 状态

### 3.4 Tour 相关 API 设计

#### useTour Hook

```typescript
// src/hooks/useTour.ts

export interface TourStep {
  target: string;        // CSS selector，如 "[data-tour='dashboard-today']"
  title: string;         // i18n 标题
  content: string;       // i18n 内容
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

export interface UseTourReturn {
  /** 是否需要启动 Tour（profiles.introduce_completed_at === null） */
  shouldRun: boolean;
  /** Tour 步骤定义 */
  steps: TourStep[];
  /** 当前用户的 introduce_completed_at 值 */
  introduceCompletedAt: string | null;
  /** Tour 是否正在加载（正在获取 profile） */
  loading: boolean;
  /** Tour 完成回调：写入 profiles.introduce_completed_at，后续不再触发 */
  completeTour: () => Promise<void>;
  /** Tour 跳过/关闭回调：同样写入 introduce_completed_at（当前时间），不再弹出 */
  skipTour: () => Promise<void>;
}
```

#### Tour 步骤定义与 DOM 锚点

| 步骤 | CSS Selector | 标题 | 内容 | placement |
|------|-------------|------|------|-----------|
| 1 | `[data-tour="dashboard-section-today"]` | 今日任务区 | 这是你的每日复习任务列表，点击卡片评分即可更新记忆曲线 | bottom |
| 2 | `[data-tour="nav-add-entry"]` | 新增条目按钮 | 点击这里添加新的学习内容，系统会自动生成第一条复习 | top |
| 3 | `[data-tour="dashboard-review-card"]` | 复习评分操作 | 完成复习后选择"重来/困难/良好/简单"，FSRS 自动安排下次复习 | top |
| 4 | `[data-tour="dashboard-done"]` | 引导完成 | 你已经了解了基本流程！现在可以开始你的记忆曲线之旅了 🎉 | `center` |

#### 触发逻辑

1. Dashboard 组件 mount 且 `user` 非 null
2. 调用 `getProfile(user.id)` 获取 profile
3. 检查 `introduce_completed_at`：为 `null` → `shouldRun = true` → 渲染 `<TourGuide>`
4. 用户完成或跳过 → 调用 `updateProfile(user.id, { introduce_completed_at: new Date().toISOString() })`
5. 后续 Dashboard mount 时 `introduce_completed_at` 非 null，`shouldRun = false`

**注意**：`ProfileUpdate` 类型排除 `id` 但不排除 `introduce_completed_at`，因此 `updateProfile` 可接受 `{ introduce_completed_at: string }`。但需确认业务意图：用户不应自行修改此字段。可在 profiles API 层不做额外限制（依赖 RLS + 客户端仅在 Tour 完成时调用一次）。

#### TourGuide 组件

```typescript
// src/components/tour/TourGuide.tsx

export interface TourGuideProps {
  steps: TourStep[];
  run: boolean;
  onFinish: () => void;  // 触发 completeTour
  onSkip: () => void;    // 用户点击 skip/关闭 触发 skipTour
}
```

**内部行为**：
- 使用 `<Joyride>` 渲染（`react-joyride`）
- `run={run}` 控制启动/停止
- `continuous={true}`
- `showSkipButton={true}`
- `locale` 为 i18n 适配的下一个/跳过/结束等按钮文案
- `styles` 覆盖确保与 shadcn/ui 风格一致（圆角、阴影、主色调）
- `callback` 中：
  - `status === "finished"` → `onFinish()`
  - `status === "skipped"` → `onSkip()`
  - `action === "close"` → `onSkip()`

### 3.5 Dashboard 集成点

Dashboard.tsx 需新增：
1. `useTour()` hook 调用
2. `data-tour` 属性挂载到关键 DOM 节点：
   - 今日任务区容器：`data-tour="dashboard-section-today"`
   - 首个 ReviewCard 外层容器：`data-tour="dashboard-review-card"`（仅当 todayReviews.length > 0 时）
   - 完成引导占位（可选）：`data-tour="dashboard-done"`（可放在页面底部或用一个不可见占位 div）
3. 条件渲染 `<TourGuide>`：
   ```tsx
   const { shouldRun, steps, completeTour, skipTour, loading } = useTour();
   // ...
   {shouldRun && <TourGuide steps={steps} run={true} onFinish={completeTour} onSkip={skipTour} />}
   ```
4. 新增条目按钮需 `data-tour="nav-add-entry"`。该按钮位于 AppLayout.tsx 的 NavLink 中：
   - AppLayout 已有 navItems 数组，`/add` 对应的 NavLink 需添加 `data-tour="nav-add-entry"` 属性
   - 可通过给 NavLink 组件传递自定义 props 或在渲染时根据 `to === "/add"` 条件添加 `data-tour` 属性

### 3.6 i18n 新增键

在 `src/lib/i18n/messages.ts` 的 `zh-CN` 和 `en-US` 下新增以下键：

```
tourStepTodayTitle: "今日任务区"
tourStepTodayContent: "这是你的每日复习任务列表，点击卡片评分即可更新记忆曲线"
tourStepAddEntryTitle: "新增条目"
tourStepAddEntryContent: "点击这里添加新的学习内容，系统会自动生成第一条复习任务"
tourStepReviewTitle: "复习评分"
tourStepReviewContent: "完成复习后选择评分，FSRS 算法会自动安排下次复习时间"
tourStepDoneTitle: "准备就绪"
tourStepDoneContent: "你已经了解了基本流程！现在可以开始你的记忆曲线之旅了"
tourButtonNext: "下一步"
tourButtonBack: "上一步"
tourButtonSkip: "跳过"
tourButtonLast: "完成"
tourButtonClose: "关闭"
```

英文对应值（略，以 spec 实现阶段按需翻译）。

### 3.7 依赖变更

`package.json` 新增：
- `react-joyride`: `^2.9.3` 或最新稳定版（具体版本由实现阶段确定）
- `@types/react-joyride`（如需要）

---

## 4. 交互流程

### 4.1 新用户注册到 Tour 启动的完整时序

```
1. 用户在 /auth/signup 注册
2. authStore.signUp → Supabase auth.signUp → 成功后返回 AUTH_SIGN_UP_SUCCESS
3. authStore.signUp 检测到 AUTH_SIGN_UP_SUCCESS → 调用 trackEvent("register", { provider: "email" })
4. trackEvent 异步插入 analytics_events（fire-and-forget，用户无感知）
5. 用户被路由到 Dashboard（由 AuthGuard/AuthLayout 控制）
6. Dashboard mount → useTour hook 初始化
7. useTour → getProfile(user.id) → 获取 profile（此时 introduce_completed_at 为 null）
8. shouldRun = true → Dashboard 渲染 TourGuide
9. TourGuide Joyride 逐步展示（Today → 新增条目 → 评分 → 完成）
10. 用户完成 → completeTour() → updateProfile(user.id, { introduce_completed_at: now() })
11. 下次 Dashboard mount → introduce_completed_at 非 null → shouldRun = false → 不再弹出
```

**跳过路径**：
- 步骤 9 中用户点击「跳过」按钮或关闭遮罩 → `callback({ action: "close" | status: "skipped" })` → `skipTour()`
- `skipTour` 同样写入 `introduce_completed_at`（当前时间），效果与 `completeTour` 一致

**异常路径**：
- 步骤 7 `getProfile` 失败 → `shouldRun = false`（不阻塞 Dashboard 正常使用），error 记录到 console
- 步骤 10 `updateProfile` 失败 → `shouldRun` 下次仍为 true（Tour 会再次弹出），error 记录到 console

### 4.2 埋点触发时序（与主流程解耦）

```
新增条目成功（entries.ts createEntry）
  → completeReview 返回成功
  → 调用 trackEvent("first_content_create", { entry_id })
  → trackEvent 内部：查重 → 插入 or 跳过
  → 用户看到成功提示，埋点在后台静默完成

完成复习成功（reviews.ts completeReview）
  → completeReview 返回成功
  → 调用 trackEvent("first_review_complete", { review_id, entry_id, rating })
  → trackEvent 内部：查重 → 插入 or 跳过
  → store 刷新 Dashboard，埋点在后台静默完成
```

---

## 5. 验收标准

### 5.1 数据库

- [ ] `analytics_events` 表创建成功，RLS 仅允许 `user_id = auth.uid()` 的 INSERT/SELECT
- [ ] `profiles` 表 `introduce_completed_at` 列存在，默认 NULL
- [ ] `database.ts` 类型同步更新

### 5.2 埋点

- [ ] 新用户注册后 `analytics_events` 中存在 `event_name = 'register'` 的记录
- [ ] 用户创建第一条 entry 后 `analytics_events` 中存在 `event_name = 'first_content_create'` 的记录
- [ ] 用户完成第一条 review 后 `analytics_events` 中存在 `event_name = 'first_review_complete'` 的记录，含 rating 值
- [ ] `first_content_create` 防重复：同一用户多次创建 entry，仅第一条触发上报
- [ ] `first_review_complete` 防重复：同一用户多次完成 review，仅第一条触发上报
- [ ] 埋点失败不阻塞业务：Supabase 不可用时，Dashboard/条目创建/复习提交仍然正常
- [ ] `register` 事件在 `AUTH_SIGN_UP_SUCCESS` 后触发，`AUTH_SIGN_UP_EMAIL_VERIFICATION_REQUIRED` 不触发

### 5.3 Tour 引导

- [ ] 新用户（`introduce_completed_at === null`）首次进入 Dashboard 时自动弹出 Tour 遮罩
- [ ] Tour 按顺序展示 4 步：今日任务区 → 新增条目 → 评分操作 → 完成
- [ ] 第一步高亮今日任务区容器
- [ ] 第二步高亮底部导航/顶部栏的「新增条目」按钮
- [ ] 第三步高亮第一条 ReviewCard（todayReviews 为空时此步骤应跳过或替换为提示）
- [ ] Tour 允许用户点击「跳过」退出且不再弹出
- [ ] Tour 允许用户按右上角 × 关闭且不再弹出
- [ ] Tour 完成后 `profiles.introduce_completed_at` 被写入当前时间戳
- [ ] 已完成的用户（`introduce_completed_at !== null`）不会再次看到 Tour
- [ ] 切换语言后 Tour 文案跟随 i18n 变化
- [ ] 暗色模式下 Tour 遮罩与高亮样式可读

### 5.4 边界与异常

- [ ] `getProfile` 失败时 Dashboard 正常渲染，不弹出 Tour，不白屏
- [ ] `updateProfile` 失败时用户可继续使用 Dashboard，下次进入仍会尝试弹出 Tour
- [ ] 用户已登出再登入后，若 `introduce_completed_at` 已存在则不弹出 Tour
- [ ] `todayReviews` 为空时（新用户首登），Tour 第 3 步（ReviewCard 评分）应显示兜底文案或跳过
- [ ] Tour 弹出期间 Dashboard 下层的交互不受影响（Joyride 默认行为：高亮元素可交互，周围遮罩不可交互）

---

## 6. 风险与注意事项

### 6.1 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 埋点查重依赖两次请求（先查后插），极端并发下可能插入两条 `first_content_create` | 轻微数据污染 | 可接受；后续分析时取第一条记录即可。生产级方案可改为 DB unique constraint `(user_id, event_name)` |
| `react-joyride` 不兼容 React 19 | Tour 不可用 | 实现前先验证 react-joyride 的 React 19 兼容性；不兼容则换用手动实现（Portal + 定位）或 `@floating-ui/react` + 自定义遮罩 |
| `react-joyride` 在移动端体验差 | 引导步骤可能超出视口 | 指定 `placement` 为 `top`/`bottom`，配合 `spotlightClicks`，必要时在移动设备上禁用 Tour（检测 `window.innerWidth`） |
| 第 3 步锚点 `[data-tour="dashboard-review-card"]` 在 todayReviews 为空时无效 | Joyride 卡住或跳转异常 | useTour hook 中动态判断：若 `todayReviews.length === 0`，从 steps 数组中移除该步或替换为提示步骤 |

### 6.2 注意事项

1. **埋点调用方不 await**：`trackEvent()` 返回 `void`，调用方不应做 `await trackEvent(...)`，确保埋点异步执行
2. **数据库迁移**：需在 Supabase SQL Editor 中执行 migration SQL（创建表、新增列、RLS 策略）。SQL 脚本应作为独立文件提供（如 `context/migration-v6.5.sql`）
3. **ProfileUpdate 类型**：当前 `Omit<TablesUpdate<"profiles">, "id">` 允许 `introduce_completed_at` 传入。虽然业务上仅 Tour 完成时调用一次，但类型上无法阻止误用。可在 profiles.ts 中显式限制 update 的字段集（用 Pick 替代 Omit），或不做限制依赖约定
4. **react-joyride 安装**：安装前需确认许可证、包大小及 React 19 兼容性。如使用 `@types/react-joyride`，版本需匹配
5. **i18n 键仅限 Tour**：埋点事件不涉及 i18n（事件名是英文常量），Tour 相关的所有用户可见文案全部用 i18n 键
6. **测试覆盖**：建议增加：
   - `trackEvent` 单元测试（查重逻辑、异常静默）
   - `useTour` 单元测试（shouldRun 各分支）
   - Dashboard + Tour 集成测试（Playwright）（可选，由 test-planner 决策）
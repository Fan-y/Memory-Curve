# UX 优化：14 项审计问题修复

> **版本**：v1.0 | **日期**：2026-06-03 | **状态**：待实现
> **关联范围**：Dashboard / History / Calendar / Stats / AddEntry / AppLayout / Onboarding / 全局路由

---

## 1. 概述

### 1.1 背景

基于 UX 审计发现 14 个用户体验问题，按优先级分三批实现。所有问题均不改变现有业务逻辑，仅涉及 UI 层优化。

### 1.2 设计原则

- **不引入新动画库**：所有过渡动画使用 Tailwind CSS 原生 utility（transition/animate）
- **不修改 Supabase 数据模型**：本次所有改动均为纯前端
- **不破坏现有 Playwright 测试**：所有 DOM 结构变化需保持现有 role/aria-label 兼容
- **i18n 全覆盖**：所有新增用户可见文案需同时提供 zh-CN 和 en-US

### 1.3 分批复现策略

| 批次 | 优先级 | 问题编号 | 说明 |
|------|--------|---------|------|
| 第 1 批 | 高 | #1, #2, #3, #4 | 核心任务完成率相关 |
| 第 2 批 | 中 | #5, #6, #7, #8, #9 | 效率与认知负荷 |
| 第 3 批 | 低 | #10, #11, #12, #13, #14 | 锦上添花 |

---

## 2. 数据契约

本次 UX 优化**不涉及数据库变更**，无新增表/列/RLS 策略。

---

## 3. 前端契约

### 3.1 新增文件清单

| 文件路径 | 职责 | 批次 |
|----------|------|------|
| `src/components/ConfirmDialog.tsx` | 内联确认弹窗组件 | #1 |
| `src/stores/toastStore.ts` | Toast 全局 Zustand store | #2 |
| `src/components/Toast.tsx` | 非阻塞微提示组件 | #2 |
| `src/hooks/useToast.ts` | Toast 消费 hook（桥接 toastStore） | #2 |
| `src/components/sparklines/MiniSparkline.tsx` | 迷你趋势折线图 SVG | #2 |

### 3.2 修改文件清单

| 文件路径 | 修改内容 | 批次 |
|----------|----------|------|
| `src/components/ReviewCard.tsx` | #1 内容预览、#2 评分动画、#10 图标 | #1, #3 |
| `src/pages/Dashboard.tsx` | #1 加载 entry 完整内容、#2 动画包裹、#9 对比数据 | #1, #2 |
| `src/pages/History.tsx` | #3 ConfirmDialog 替换 window.confirm、#11 内联编辑 | #1, #3 |
| `src/pages/Calendar.tsx` | #4 选中反馈、#13 移除"无"文案 | #1, #3 |
| `src/pages/AddEntry.tsx` | #5 Toast、#6 查看更多链接 | #2 |
| `src/pages/Stats.tsx` | #7 SVG 轴线标签 | #2 |
| `src/components/layout/AppLayout.tsx` | #8 顶栏精简 | #2 |
| `src/pages/Onboarding.tsx` | #12 与 Tour 定位区分 | #3 |
| `src/App.tsx` | #14 route 过渡动画 | #3 |
| `src/lib/i18n/messages.ts` | 新增 i18n 键 | #1, #2, #3 |

### 3.3 新增组件接口签名

#### ConfirmDialog

```typescript
// src/components/ConfirmDialog.tsx
export interface ConfirmDialogProps {
  open: boolean;
  title: string;                     // 弹窗标题（i18n）
  message: string;                   // 弹窗正文
  confirmLabel?: string;             // 确认按钮文案，默认使用 i18n 键
  cancelLabel?: string;              // 取消按钮文案
  variant?: "danger" | "default";    // 确认按钮颜色：danger=红色, default=primary
  onConfirm: () => void;
  onCancel: () => void;
}
```

行为：
- `open=false` 时不渲染任何 DOM（不是 display:none）
- 背景遮罩 `fixed inset-0 bg-background/80 z-50`
- 弹窗居中：`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50`
- 按 Escape 触发 `onCancel`
- 点击遮罩外部不关闭（防止误触）
- 确认按钮在 `variant=danger` 时使用 `bg-red-600`

#### ToastStore（Zustand 全局状态）

```typescript
// src/stores/toastStore.ts
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}
```

**`useToast` hook** 从 `toastStore` 消费，各页面通过 `addToast(message, type?)` 触发 toast，无需每页单独传递 props。

**`ToastContainer` 组件** 在 AppLayout 中挂载一次，订阅 `toastStore.toasts` 渲染所有活跃 toast。各页面无需手动引入 ToastContainer。

**`ToastContainerProps`**（仅接收，由内部订阅 store）：
```typescript
// src/components/Toast.tsx
export interface ToastContainerProps {
  // 组件内部直接订阅 toastStore，无需外部传入 props
}
```

行为：
- toast 自动 2.5s 后消失（`addToast` 内部通过 `setTimeout` 调用 `removeToast(id)`，或使用 store 内建的延迟移除）
- 定位在页面底部居中：`fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- 入场动画：`animate-[slideUpFadeIn_0.25s_ease-out]`（Tailwind 配置需声明自定义 keyframes）
- 退出动画：`animate-[slideDownFadeOut_0.2s_ease-in]`
- toast 列表最大显示 3 条，超出时移除最早一条

#### MiniSparkline

```typescript
// src/components/sparklines/MiniSparkline.tsx
export interface MiniSparklineProps {
  data: number[];                    // y 值数组，长度 >= 2
  width?: number;                    // 默认 60
  height?: number;                   // 默认 20
  className?: string;
}
```

行为：
- 纯 SVG 实现，不依赖外部库
- 将 data 映射为 polyline 的 points
- y 轴翻转（data 最大值对应 SVG 顶部）
- 线条颜色使用 `stroke="hsl(var(--primary))"`
- 无填充区域

---

## 4. 交互流程

本 spec 不涉及跨页面的长交互流程（如注册→登录→Dashboard 级联），所有改动为单一页面的 UI 行为优化。

---

## 5. 各问题详细方案

### 🔴 第 1 批（高优先级）

#### 问题 #1：ReviewCard 缺少内容预览

**当前行为**：Dashboard 加载 `entryTitles` 时只存储 `title`，ReviewCard 仅显示标题+ID+时间。

**新行为**：Dashboard 在 `load` 函数中将 `content_md` 也存入一个 `Record<string, string>`（`entryContents`），传入 ReviewCard。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Dashboard.tsx` | `load()` 中新建 `contentById` 映射 `entry.id → entry.content_md`；state 新增 `entryContents: Record<string, string>`；传入 ReviewCard |
| `ReviewCard.tsx` | Props 新增 `entryContent?: string`；卡片内新增可展开区域 |

**DOM 变化**（ReviewCard 内部）：

```
现有结构：
  article
    div.space-y-1         ← 标题+ID+时间
    div.mt-4.grid         ← 评分按钮

新增结构：
  article
    div.space-y-1
      h3 (title)
      p (entry ID)
      p (scheduled time)
      button                     ← 展开/折叠按钮（仅当有内容时出现）
        "展开预览" / "收起"
    div.content-preview          ← 折叠区域，初始 hidden
      p.line-clamp-3             ← 前 ~180 字符，whitespace-pre-wrap
    div.mt-4.grid                ← 评分按钮（位置不变）
```

**展开/折叠行为**：
- 使用本地 state `expanded: boolean`
- 折叠区域用 Tailwind：`transition-all duration-200 overflow-hidden`，`expanded` 时 `max-h-40`，未展开时 `max-h-0`
- 切换按钮文案：新增 i18n 键 `reviewCardExpandPreview` / `reviewCardCollapsePreview`

#### 问题 #2：评分无反馈动画

**当前行为**：`onRate` 被调用后 `submitReview` 立即刷新 store，ReviewCard 直接从 DOM 移除。

**新行为**：在 `submitReview` 完成前添加视觉过渡。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `ReviewCard.tsx` | 新增 `leaving` state；评分按钮 loading 态 |
| `Dashboard.tsx` | `onRate` 改为先设置 `leavingReviewId`，等待动画完成后刷新 |

**实现方案（时序说明）**：

> **关键时序**：`submitReview` 内部会调用 `get().refresh(userId)`，这会重新拉取 `todayReviews`。如果在动画完成前调用 refresh，卡片可能在 CSS 动画播放前就被 reconciliation 移除。因此必须先在 DOM 上标记载出状态，播放完 300ms 动画后再执行 submit。

`onRate` 流程（Dashboard.tsx）：
```
用户点击评分 → setLeavingReviewId(reviewId)    // 立即标记，ReviewCard 收到 leaving=true
              ↓
           等待 300ms                           // 期间 CSS transition 播放 opacity 1→0
              ↓
           调用 submitReview()                  // 内部 refresh → todayReviews 更新 → 卡片从列表移除
              ↓
           setLeavingReviewId(null)             // 清理状态
```

具体代码：
```typescript
const [leavingReviewId, setLeavingReviewId] = useState<string | null>(null);

const onRate = async (reviewId: string, rating: ReviewRating) => {
  if (!user) return;
  setLeavingReviewId(reviewId);
  await new Promise(resolve => setTimeout(resolve, 300)); // CSS opacity 过渡完成
  await submitReview(reviewId, user.id, rating, 0);       // 内部 refresh() 后 todayReviews 变化
  setLeavingReviewId(null);
};
```

ReviewCard 新增 Props：
```typescript
leaving?: boolean;    // 是否正在离开（触发淡出动画）
```

ReviewCard 渲染规则：
- `leaving=true` 时 article 添加 `transition-opacity duration-300 opacity-0` 类（**注意：使用原生 transition 属性，不使用 animate-[fadeOut]_...**，因为 leaving 是由 props 驱动的状态切换，transition 能在 leaving 变为 true 时自动触发 opacity 1→0 过渡）
- 评分按钮在 `leaving=true` 时替换为 `<Loader2 className="animate-spin">`（lucide-react 图标）
- 已在评分的卡片：`disabled` 属性扩展到所有按钮 + 当前按钮显示 spinner

**不再需要 `fadeOut` 自定义 keyframe**（使用 transition 属性替代），从 Tailwind 配置变更列表中移除该条。

#### 问题 #3：删除无可见确认弹窗

**当前行为**：History 页 `onDelete` 调用 `window.confirm()`。

**新行为**：使用 `ConfirmDialog` 组件替换。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `History.tsx` | 移除 `window.confirm`；新增 `deleteTarget` state（EntryRow\|null）；渲染 `<ConfirmDialog>` |
| `ConfirmDialog.tsx` | 新建 |

**实现**：
- `onDelete` 不再直接删除，改为 `setDeleteTarget(entry)`
- `ConfirmDialog` 渲染 condition：`deleteTarget !== null`
- `onConfirm` → 执行删除逻辑 → `setDeleteTarget(null)`
- `onCancel` → `setDeleteTarget(null)`
- `variant="danger"`（红色确认按钮）

**i18n 新增键**：
- `confirmDialogCancel`：取消
- `confirmDialogConfirm`：确认删除
- `confirmDialogTitle`：删除确认

替换前流程：
```
onDelete(entry) → window.confirm("确认删除条目"{title}"吗?") → 是 → 删除
```

替换后流程：
```
onDelete(entry) → setDeleteTarget(entry) → ConfirmDialog 弹出 → 用户点击[确认删除] → 执行删除
```

#### 问题 #4：Calendar 点击日期无选中反馈

**当前行为**：`isSelected` 时格子 `border-primary ring-2 ring-primary/40`，该样式随 state 切换立即生效。

**新行为**：点击瞬间添加短暂的 pulse 动画作为视觉反馈。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Calendar.tsx` | 新增 `pulsingKey` state；点击时设置后 400ms 清除 |

**实现**：
- 新增 state：`const [pulsingKey, setPulsingKey] = useState<string | null>(null);`
- 点击按钮的 onClick 中：
  ```typescript
  onClick={() => {
    setSelectedDateKey(cell.key);
    setPulsingKey(cell.key);
    setTimeout(() => setPulsingKey(null), 400);
  }}
  ```
- 格子的 className 新增条件：`pulsingKey === cell.key && 'animate-pulse'`
- Tailwind 内置 `animate-pulse` 即可（1 秒周期，视觉够用）

**不改变现有 isSelected 样式**，pulse 叠加在已有 ring 之上。

---

### 🟡 第 2 批（中优先级）

#### 问题 #5：AddEntry 标签创建无视觉反馈

**当前行为**：`onCreateTag` 成功后标签直接出现在列表，无提示。

**新行为**：创建成功后在页面底部显示 toast 微提示。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `AddEntry.tsx` | 引入 `useToast`；`onCreateTag` 成功后调用 `addToast("✓ 标签已创建")` |
| `hooks/useToast.ts` | 新建 |
| `components/Toast.tsx` | 新建 |
| `AppLayout.tsx` | `main` 区域下方渲染 `<ToastContainer>`（全局挂载，所有页面共用） |

**Toast 挂载位置**：AppLayout.tsx 的 `<main>` 内底部，或在 `</main>` 之后独立渲染。推荐在 AppLayout 中统一挂载，避免每个页面重复引入。

**实现要点**：
- `toastStore` 是 Zustand store（`src/stores/toastStore.ts`），维护 `toasts: Toast[]` 状态
- `addToast(message, type?)` 内部生成 uuid，push 到 toasts 数组，并设置 2.5s 后自动 `removeToast(id)`
- `removeToast(id)` 从数组中过滤掉对应 toast
- `useToast` hook 从 `toastStore` 消费，返回 `{ toasts, addToast, removeToast }`
- `ToastContainer` 渲染在 AppLayout 中，直接订阅 `toastStore.toasts`，不在各页面单独引入
- Tailwind 自定义 keyframe（需在 `tailwind.config.ts` 声明）：
  ```typescript
  slideUpFadeIn: {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  slideDownFadeOut: {
    '0%': { opacity: '1', transform: 'translateY(0)' },
    '100%': { opacity: '0', transform: 'translateY(8px)' },
  },
  ```
- Toast 条目使用 `animate-[slideUpFadeIn_0.25s_ease-out]`

**i18n 新增键**：
- `tagCreatedToast`：标签已创建✓

#### 问题 #6：AddEntry 最近条目分页

**当前行为**：`entries.slice(0, 8)` 硬编码。

**新行为**：底部加「查看更多」链接跳转 History 页。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `AddEntry.tsx` | 最近条目区域底部新增 `<Link to="/history">` |

**DOM 新增**（在 `entries.length > 8` 时渲染）：
```
<div class="space-y-2">
  {entries.slice(0,8).map(...)}        ← 不变
  {entries.length > 8 && (
    <div className="text-center pt-2">
      <Link to="/history" className="text-sm text-primary hover:underline">
        查看全部 {entries.length} 条 →
      </Link>
    </div>
  )}
</div>
```

**i18n 新增键**：
- `addEntryViewAll`：查看全部 {count} 条 →
- 英文：`View all {count} entries →`

#### 问题 #7：Stats 遗忘曲线 SVG 轴线标签

**当前行为**：SVG 仅绘制曲线和网格线，无轴标签。

**新行为**：添加 x 轴刻度标签（0d/3d/7d/10d/14d）和 y 轴百分比标签（100%/50%/0%）。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Stats.tsx` | SVG viewBox 高度增加；添加 `<text>` 标签 |

**实现**：
- viewBox 改为 `0 0 100 115`（底部留出 15 单位给 x 轴标签）
- 曲线和网格线坐标不变（仍在 y=0~100 范围内）
- 新增 x 轴标签（y=108）：
  ```svg
  <text x="0" y="108" class="fill-muted-foreground text-[2.5px]">0d</text>
  <text x="21" y="108" class="fill-muted-foreground text-[2.5px]">3d</text>
  <text x="50" y="108" class="fill-muted-foreground text-[2.5px]">7d</text>
  <text x="71" y="108" class="fill-muted-foreground text-[2.5px]">10d</text>
  <text x="97" y="108" class="fill-muted-foreground text-[2.5px]">14d</text>
  ```
- 新增 y 轴标签（x=-2, text-anchor="end"）：
  ```svg
  <text x="-1" y="13" class="fill-muted-foreground text-[2.5px]" text-anchor="end">100%</text>
  <text x="-1" y="53" class="fill-muted-foreground text-[2.5px]" text-anchor="end">50%</text>
  <text x="-1" y="92" class="fill-muted-foreground text-[2.5px]" text-anchor="end">0%</text>
  ```
- `class` 属性在 SVG `<text>` 中对应 Tailwind 的 `fill` 颜色，需确保全局 CSS 中存在对应变量

**不修改**：曲线计算逻辑、现有网格线位置。

#### 问题 #8：AppLayout 顶栏信息密度低

**当前行为**：顶栏包含 appName + 副标题 + 用户邮箱 + 语言选择 + 主题选择 + 登出按钮，占据多行。

**新行为**：将语言/主题移入弹出菜单，顶栏精简为单行。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `AppLayout.tsx` | 语言/主题 select 移入下拉菜单；顶栏高度减半 |

**实现方案**（推荐：悬停下拉菜单，纯 CSS，不引入 popover 库）：

```
精简前顶栏布局（移动端视角）：
┌────────────────────────────┐
│ Memory Curve                │
│ Stage 6 全功能已落地         │
│ [邮箱] [语言▼] [主题▼] [退出] │
│ [nav items...]              │
└────────────────────────────┘

精简后顶栏布局（桌面端和移动端不同）：
桌面端：
┌────────────────────────────┐
│ Memory Curve [user@xx.com] [⚙] [退出] │
│ [nav items...]             │
└────────────────────────────┘

移动端（仅显示用户 icon，无邮箱文字）：
┌────────────────────────────┐
│ Memory Curve  [👤] [⚙] [退出] │
│ [nav items...]             │
└────────────────────────────┘
```

**具体修改**：

1. 副标题移除：`stageMvpInProgress` 文字删除
2. 语言/主题 select 替换为单个「设置」按钮（gear icon），hover/click 时展开 dropdown：
   - 桌面端：hover 触发 `group-hover:block`
   - 移动端：click 触发（通过 `useState` 控制 `open` 状态，`onClick` 切换），因移动端无 hover 能力
   ```tsx
   <div className="relative group">
     <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(!open)}>
       <SettingsIcon className="h-4 w-4" />
       <span className="sr-only">设置</span>
     </Button>
     <div className="absolute right-0 top-full mt-1 rounded-lg border bg-card p-2 shadow-md z-40 w-44 space-y-2
                     hidden group-hover:block md:group-hover:block
                     {open ? 'block' : 'hidden md:hidden'}">
       {/* 语言选择 */}
       {/* 主题选择 */}
     </div>
   </div>
   ```
3. 用户邮箱/icon 显示策略：
   - 桌面端：显示邮箱文字，缩短为 `@` 前部分 + `...`（如 `user123@example.com` → `user123...`），`max-w-[120px] truncate`
   - 移动端：隐藏邮箱文字，仅显示用户 icon（`UserCircle` 图标），`md:inline hidden`

**i18n 无需新增键**（复用现有 `navSettingsLocale` / `navSettingsTheme`）。

**Playwright 影响**：
- 现有测试中使用 `getByRole("heading", { name: "Dashboard" })` 定位，顶栏 title 未变，不受影响
- 如果测试依赖语言/主题 select 可见性，需更新为先 hover 设置按钮再交互

**TourGuide 兼容性**（见下方）。

#### TourGuide 兼容性评估

| TourGuide 步骤 | target 选择器 | 依赖顶栏元素？ | 影响 |
|---------------|--------------|-------------|------|
| 步骤 1 | Dashboard 主内容区 | ❌ 不依赖顶栏 | 不受影响 |
| 步骤 2 | `[data-tour="nav-add-entry"]`（NavLink 上） | ❌ 不依赖顶栏 | 不受影响 |
| 后续步骤 | 页面内元素 | ❌ 不依赖顶栏 | 不受影响 |

**结论**：TourGuide 所有 target 选择器均不依赖被移除的顶栏元素（副标题、语言/主题 select、邮箱完整显示）。顶栏精简不需要调整 TourGuide 配置。

#### 问题 #9：Dashboard 指标卡无对比基准

**当前行为**：4 个指标卡仅展示数字。

**新行为**：在「今日任务」和「已完成」卡片下增加昨日对比变化值；同时在每个指标卡底部 helper 区展示 7 天趋势 mini sparkline。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Dashboard.tsx` | `load()` 中额外加载昨日统计数据 + 近 7 天每日完成数，计算变化值 |
| `sparklines/MiniSparkline.tsx` | 新建（已在 #2 批中列为新增文件） |

**数据来源**：
- 当前已有 `stats`（来自 `useReviewStore`），包含 `completed` 和 `total`
- 需额外查询昨日完成的 review 数量：调用 `getCompletedReviewsByRange(user.id, yesterdayStart, yesterdayEnd)`
- 对比值计算：`todayCount - yesterdayCount`
- **7 天趋势数据**：复用 Stats 页已有数据源 `recentDayMetrics`（近 7 天每日完成的 review 数量），传入 MiniSparkline 的 `data` prop

**DOM 变化**：
```
<div class="rounded-xl border bg-card p-4 shadow-sm">
  <p class="text-xs text-muted-foreground">今日任务</p>
  <p class="mt-2 text-2xl font-semibold">{counts.today}</p>
  <p class="mt-1 text-xs text-muted-foreground">
    较昨日 {change >= 0 ? '+' : ''}{change}
  </p>
  <div class="mt-2">                          ← 新增 helper 区
    <MiniSparkline data={recentDayMetrics} width={80} height={24} />
  </div>
</div>
```

**MiniSparkline 使用范围**：4 个指标卡全部添加 sparkline（今日任务、已完成、逾期任务、总复习数），数据源统一使用 `recentDayMetrics`（复用 Stats 页的 7 天趋势数据）。

**仅对比 2 个指标**（今日任务、已完成），不对「逾期任务」和「总复习数」做文本对比。但 sparkline 可展示在全部 4 个卡片上。

**loading/空态处理**：数据未加载时变化值显示 `—`；昨日无数据时显示「暂无对比」。

**i18n 新增键**：
- `dashboardChangeYesterday`：较昨日 {change}
- `dashboardChangeNoData`：暂无对比

---

### 🟢 第 3 批（低优先级）

#### 问题 #10：ReviewCard 评分按钮图标辅助

**当前行为**：4 个按钮纯文字（重来/困难/良好/简单），靠颜色区分。

**新行为**：每个按钮增加 lucide-react 图标。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `ReviewCard.tsx` | ratingActions 数组新增 icon 字段 |

**图标映射**：
| 评分 | 颜色 | 图标 (lucide-react) |
|------|------|---------------------|
| Again (重来) | rose-600 | `RotateCcw` |
| Hard (困难) | amber-600 | `TrendingDown` |
| Good (良好) | sky-600 | `Check` |
| Easy (简单) | emerald-600 | `Zap` |

**按钮结构调整**：
```
<Button>
  <RotateCcw className="h-3.5 w-3.5" />
  <span>重来</span>
</Button>
```

**import 新增**：`import { RotateCcw, TrendingDown, Check, Zap } from "lucide-react";`

**无 i18n 影响**。

#### 问题 #11：History 编辑表单弹出位置优化

**当前行为**：编辑表单出现在筛选区下方、列表上方，视线跳跃大。

**新行为**：编辑表单在当前条目卡片内 inline 展开。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `History.tsx` | 移除顶部统一编辑表单；每个条目卡片下方新增可展开的 inline 编辑区 |

**DOM 变化**（每个条目 article 内部）：

```
现有：
  article
    div (标题+元数据+编辑/删除按钮)
    p (内容预览)

新：
  article
    div (标题+元数据+编辑/删除按钮)
    {isEditingThisEntry ? (
      form.inline-edit    ← 内联编辑表单（替换内容预览）
    ) : (
      p (内容预览)
    )}
```

**状态管理变化**：
- 移除 `editingEntry: EntryRow | null`（单一）
- 改为 `expandedEditEntryId: string | null`（只允许一个条目同时编辑）
- `startEdit(entry)` → `setExpandedEditEntryId(entry.id)`，同时填充表单字段
- 取消/保存后 → `setExpandedEditEntryId(null)`

**与 #3 交互**：编辑表单和 ConfirmDialog 可同时存在但不同条目（ConfirmDialog 的 `deleteTarget` 和 `expandedEditEntryId` 可指向不同条目）。

**无 i18n 新增键**（复用现有编辑相关键）。

#### 问题 #12：Onboarding 静态引导页与 Tour 定位重叠

**当前行为**：`/guide` 的 OnboardingPage 和 Dashboard 的 TourGuide (react-joyride) 内容相似，但相互独立存在。

**新行为**：明确两者定位差异。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Onboarding.tsx` | 顶部新增说明文字，区分于 Tour；强调「可随时回来查看的参考页」 |

**不需要合并**，但需在 OnboardingPage 顶部增加说明：
- 「这是完整的使用参考，您可以随时回来查阅。首次进入仪表盘时会自动弹出逐步引导。」

**i18n 新增键**：
- `guidePageHint`：这是完整的使用参考，您可以随时回来查阅。首次进入仪表盘时会自动弹出逐步引导。
- 英文：`This is the full reference guide. You can revisit anytime. A step-by-step tour will pop up automatically on your first visit to Dashboard.`

**不需要修改 Tour 逻辑**。

#### 问题 #13：Calendar 空白日期的「无」文案冗余

**当前行为**：`count === 0` 时显示 `<span>{t("calendarNoTask")}</span>`（即「无」/「None」）。

**新行为**：`count === 0` 时不渲染此 span，只显示日期数字。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `Calendar.tsx` | 将 `count > 0 ? <badge> : <calendarNoTask>` 改为 `count > 0 ? <badge> : null` |

**无 i18n 影响**（不删除 `calendarNoTask` 键，仅不再使用）。保留键避免未来需要恢复。

#### 问题 #14：页面间路由过渡动画

**当前行为**：route 切换无过渡动画。

**新行为**：添加 opacity fade 过渡。

**修改文件**：

| 文件 | 变更 |
|------|------|
| `App.tsx` | 用 `<AnimatePresence>` 包裹 `<Outlet>` 或 `<Routes>` |

**实现**（最小方案，不引入 framer-motion）：

方案：在 App.tsx 主内容区域使用 CSS transition + key。

```tsx
// 需要 react-router useLocation
import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"; // 最小引入
```

**注意**：`framer-motion` 依赖可能较大。更轻量备选：

```tsx
// 纯 CSS 方案：不使用 framer-motion
// 在 AppLayout 的 <main> 上添加 key={location.pathname}
const location = useLocation();
// ...
<main key={location.pathname} className="animate-[pageEnter_0.2s_ease-out]">
  <Outlet />
</main>
```

**Tailwind 自定义 keyframe**：
```typescript
pageEnter: {
  '0%': { opacity: '0', transform: 'translateY(4px)' },
  '100%': { opacity: '1', transform: 'translateY(0)' },
}
```

**推荐纯 CSS 方案**（不引入 framer-motion）：
- AppLayout.tsx 的 `<main>` 添加 `key={location.pathname}`
- 动画类：`animate-[pageEnter_0.2s_ease-out]`

**无 i18n 影响**。

---

## 6. i18n 新增键汇总

### 第 1 批新增

| 键名 | zh-CN | en-US |
|------|-------|-------|
| `reviewCardExpandPreview` | 展开预览 | Expand preview |
| `reviewCardCollapsePreview` | 收起 | Collapse |
| `confirmDialogCancel` | 取消 | Cancel |
| `confirmDialogConfirm` | 确认删除 | Confirm Delete |
| `confirmDialogTitle` | 删除确认 | Delete Confirmation |

### 第 2 批新增

| 键名 | zh-CN | en-US |
|------|-------|-------|
| `tagCreatedToast` | 标签已创建✓ | Tag created ✓ |
| `addEntryViewAll` | 查看全部 {count} 条 → | View all {count} entries → |
| `dashboardChangeYesterday` | 较昨日 {change} | {change} vs yesterday |
| `dashboardChangeNoData` | 暂无对比 | No comparison data |

### 第 3 批新增

| 键名 | zh-CN | en-US |
|------|-------|-------|
| `guidePageHint` | 这是完整的使用参考，您可以随时回来查阅。首次进入仪表盘时会自动弹出逐步引导。 | This is the full reference guide. You can revisit anytime. A step-by-step tour will pop up automatically on your first visit to Dashboard. |

---

## 7. Tailwind 配置变更

在 `tailwind.config.ts` 的 `theme.extend.keyframes` 中新增：

```typescript
keyframes: {
  // 已有...（不查看，保守合并）
  slideUpFadeIn: {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  slideDownFadeOut: {
    '0%': { opacity: '1', transform: 'translateY(0)' },
    '100%': { opacity: '0', transform: 'translateY(8px)' },
  },
  pageEnter: {
    '0%': { opacity: '0', transform: 'translateY(4px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
```
> **注意**：`fadeOut` keyframe 已移除。#2 使用 `transition-opacity duration-300 opacity-0` 替代，不再需要自定义 keyframe。

**注意**：必须先读取现有 `tailwind.config.ts` 确认是否有自定义 keyframes，再合并而非覆盖。

---

## 8. Playwright 测试兼容性

### 现有测试清单（tests/ui-acceptance.spec.ts）

| 测试 | 断言依赖 | 受影响？ |
|------|---------|---------|
| desktop en-US auth pages | `getByRole("heading", { name: "Welcome back" })` 等 | ❌ 不涉及 |
| desktop zh-CN setup/404 | `getByRole("heading", { name: "需要先完成 Supabase 配置" })` | ❌ 不涉及 |
| mobile en-US auth layout | `getByRole("button", { name: "Sign In" })` 等 | ❌ 不涉及 |
| optional authenticated desktop shell | `getByRole("heading", { name: "Dashboard" })` | ⚠️ 顶栏精简后 appName 样式不变，heading 层级不变，不受影响 |

### 潜在影响分析

| 改动 | 风险 | 处理 |
|------|------|------|
| #8 顶栏精简移除副标题 | 如果有测试依赖 `"Stage 6 feature-complete"` 文本 | 现有测试无此依赖 |
| #8 语言/主题 select 移入 dropdown | 如果测试依赖 select 可见性 | 现有测试无此依赖 |
| #2 评分后延迟 300ms 刷新 | 如果测试立即检查 ReviewCard 是否消失 | 现有测试无 Dashboard 交互测试 |
| #3 window.confirm → ConfirmDialog | `page.on("dialog")` 相关测试 | 现有测试无此逻辑 |
| #10 按钮增加图标 | 按钮 role 和 name 不变 | 按钮文本不变，`getByRole("button", { name: "Again" })` 仍然有效 |

**结论**：14 项改动中无一项破坏现有 Playwright 测试。

---

## 9. 验收标准

### 第 1 批

- [ ] #1：Dashboard 中 ReviewCard 显示条目内容预览（前 1-2 句），可展开/折叠
- [ ] #2：点击评分后 ReviewCard 有 300ms 淡出动画，按钮显示 loading spinner
- [ ] #3：History 删除弹出 ConfirmDialog（非原生 window.confirm），支持取消和确认
- [ ] #4：Calendar 点击日期格子有短暂 pulse 动画（约 0.4s）

### 第 2 批

- [ ] #5：AddEntry 创建标签后底部出现 toast "标签已创建✓"，2.5s 后消失
- [ ] #6：AddEntry 最近条目超过 8 条时底部出现「查看全部 N 条 →」链接
- [ ] #7：Stats 遗忘曲线 SVG 图有 x 轴（0d/3d/7d/10d/14d）和 y 轴%（100/50/0）标签
- [ ] #8：顶栏精简为单行（设置按钮收纳语言/主题），副标题移除
- [ ] #9：Dashboard 指标卡中「今日任务」「已完成」显示较昨日变化值；所有 4 个指标卡底部展示 MiniSparkline（7 日趋势）

### 第 3 批

- [ ] #10：ReviewCard 评分按钮包含图标（RotateCcw/TrendingDown/Check/Zap）
- [ ] #11：History 编辑表单在当前条目卡片内 inline 展开
- [ ] #12：OnboardingPage 顶部新增定位说明文字
- [ ] #13：Calendar 空白格子仅显示日期数字，无「无」文案
- [ ] #14：页面路由切换有 opacity + translateY 过渡动画

---

## 10. 风险与注意事项

### 10.1 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| #1 Dashboard 加载所有 entry 的 `content_md` 可能增加数据传输量 | 条目数大时 Dashboard 初始加载变慢 | 当前 `getUserEntries` 返回全部字段，已包含 `content_md`，仅增加内存中映射，无额外网络开销 |
| #2 `submitReview` 内部 `refresh()` 可能在 CSS 动画完成前触发 reconciliation | ReviewCard 在 DOM 淡出前被移除，用户看不到动画 | `onRate` 先设 `leavingReviewId` → 等 300ms（CSS transition 完成）→ 再调 `submitReview`（触发 refresh）→ `setLeavingReviewId(null)`。ReviewCard 使用 `transition-opacity duration-300` 而非自定义 keyframe
| #8 顶栏精简后桌面端设置入口变深 | 用户可能找不到语言/主题设置 | 设置按钮使用 gear 图标（通用认知），hover 即时展开无需点击 |
| #14 route 动画依赖 `key={location.pathname}` | 如果 AppLayout 的 main 有其他内部状态可能被重置 | 当前所有页面状态在各自组件内部，不受影响 |

### 10.2 注意事项

1. **Toast 全局挂载**：Toast 通过 Zustand store（`src/stores/toastStore.ts`）实现全局共享。`useToast` hook 从 store 消费，各页面调用 `addToast(message, type?)` 触发；`ToastContainer` 在 AppLayout 中挂载一次，订阅 `toastStore.toasts`。无需通过 props 传递。
2. **自定义 keyframe 动画**：使用 Tailwind `animate-[keyframeName_duration_easing]` 语法引用自定义 keyframe，无需额外 CSS 文件。
3. **lucide-react 图标**：若未安装 `lucide-react`，执行 `pnpm add lucide-react` 安装。现有依赖链可能尚未包含此包。
4. **#1 内容预览展开/折叠**：使用 `max-h` transition 而非 `height: auto` transition（后者 CSS 不支持动画），`max-h-40` 足够显示 3 行内容。
5. **#9 昨日数据查询**：Dashboard 已调用 `getUserEntries` 和 `refresh(store)`，额外一次查询影响很小（`getCompletedReviewsByRange` 单日期范围查询）。
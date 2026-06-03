# 实施计划

## 目标
将 Memory Curve 从 MUI + Dexie + 固定艾宾浩斯 重构为 Tailwind/shadcn + Supabase + Zustand + TanStack Query + FSRS v5 的现代化全栈应用。

---

## 红态映射（Phase 1 - 预估，待 Phase 2 精确更新）
*暂无测试计划，此表将在 test-plan.md 和 red-failure-details.md 生成后填充。*

---

## 步骤（含风险）

### 阶段一：项目基础设施（可部分并行）

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 1 | 安装 Tailwind CSS + shadcn/ui | `package.json`, `src/index.css`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js` | 1) 运行 `pnpm dlx shadcn@latest init` 初始化 shadcn（选择 CSS variables 模式）<br>2) 确保 `tailwind.config.ts` 中 `darkMode: 'class'`<br>3) vite.config.ts 添加 `resolve.alias['@'] = path.resolve(__dirname, './src')` <br>4) tsconfig.app.json 添加 `baseUrl: '.'` 和 `paths: { '@/*': ['./src/*'] }` <br>5) 创建 `src/lib/utils.ts`（cn 工具函数）<br>6) 在 `src/index.css` 写入 `@tailwind base/components/utilities` 及 CSS 变量 | `vite.config.ts`, `tsconfig.app.json`, 全局样式 | node_modules 变更需用户确认后执行安装；shadcn init 可能覆盖已有文件需备份 | 2,3 |
| 2 | 安装核心依赖（Supabase/Zustand/TanStack/i18n/FSRS/TipTap/Recharts） | `package.json` | 安装：`@supabase/supabase-js`, `zustand`, `@tanstack/react-query`, `react-i18next`, `i18next`, `i18next-browser-languagedetector`, `ts-fsrs`, `@tiptap/react`, `@tiptap/starter-kit`, `recharts`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | `package.json`, `node_modules` | 依赖版本兼容性；需用户确认后执行；TypeScript 6 兼容性需验证 | 1,3 |
| 3 | 添加 shadcn/ui 核心组件 | `src/components/ui/` | 通过 `pnpm dlx shadcn@latest add` 添加：`button`, `input`, `card`, `dialog`, `badge`, `tabs`, `progress`, `select`, `popover`, `command`, `sheet`, `separator`, `accordion`, `avatar`, `dropdown-menu`, `toast`, `sonner` | `src/components/ui/` (新增 15+ 文件), `src/lib/utils.ts` | 部分组件可能不兼容 React 19 / TS 6，需逐个验证 | 2 |

### 阶段二：Supabase 配置

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 4 | 创建 Supabase Client | `src/lib/supabase.ts`, `.env` | 1) 创建 `.env` 文件含 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`<br>2) 创建 `src/lib/supabase.ts`，导出 `createClient(url, key)` 实例 | `.env`, `vite-env.d.ts`（类型声明） | `.env` 为敏感文件不提交 `VITE_` 前缀变量在浏览器可见 | - |
| 5 | 生成数据库类型 | `src/types/database.ts` | 1) 根据 SQL schema 手动编写 Supabase `Database` 类型定义（含 profiles, entries, tags, entry_tags, reviews 表及视图）<br>2) 导出 `Tables`, `Enums` 等辅助类型 | `src/types/` | SQL schema 与类型需严格一致，后续 schema 变更需同步更新 | - |
| 6 | 在 Supabase 控制台执行 SQL | N/A（外部操作） | 运行 SQL 创建：profiles 表、entries 表、tags 表、entry_tags 表、reviews 表、触发器（自动创建 profiles）、GIN 索引、RLS 策略 | N/A | RLS 策略配置错误会导致数据泄漏或权限拒绝；需在 Supabase 控制台配置 Auth Providers（Email + OAuth）；此为外部操作，不在代码仓库内完成 | - |

### 阶段三：重构类型与数据层

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 7 | 重写类型定义 | `src/types/index.ts` | 1) 删除旧的 Tag, Entry, Review 接口和 REVIEW_INTERVALS 常量<br>2) 新增 `Profile` 接口：id, display_name, avatar_url, created_at<br>3) 新增 `Entry` 接口：基于 Supabase entries 表字段（id: string UUID, user_id, title, content_md, source, created_at, updated_at）<br>4) 新增 `Tag` 接口：id: string UUID, user_id, name, color<br>5) 新增 `EntryTag` 接口：entry_id, tag_id<br>6) 新增 `Review` 接口：基于 Supabase reviews 表字段（id: string UUID, entry_id, user_id, state, scheduled_date, stability, difficulty, elapsed_days, reps, lapses, last_rating, completed_at, duration_ms, created_at）<br>7) 新增 FSRS 相关枚举：`ReviewRating` (1=Again, 2=Hard, 3=Good, 4=Easy)<br>8) 新增 `ReviewState` (0=New, 1=Learning, 2=Review, 3=Relearning)<br>9) 新增 `EntryWithRelations` 类型（含 tags, reviews）<br>10) 移除 `src/utils/memoryCurve.ts`（旧艾宾浩斯算法） | 全局类型引用，所有使用旧类型的文件 | 旧类型删除后项目会大量报错，需与后续步骤紧密衔接 | - |
| 8 | 删除 Dexie 数据库 | `src/db/db.ts` | 删除整个 `src/db/` 目录，移除 package.json 中 `dexie` 依赖 | 所有引用 `db` 的页面/组件：Dashboard, AddEntry, History, Calendar, Stats | 旧页面将全部报错，需在后续步骤中重写；可选方案：先注释引用再逐步替换 | 7 |
| 9 | 创建 Supabase 数据访问层 | `src/lib/api/entries.ts`, `src/lib/api/reviews.ts`, `src/lib/api/tags.ts`, `src/lib/api/profiles.ts` | 1) `src/lib/api/entries.ts`：createEntry(userId, title, contentMd, source), getEntry(id), updateEntry(id, data), deleteEntry(id), getUserEntries(userId), searchEntries(userId, query)<br>2) `src/lib/api/reviews.ts`：createReview(entryId, userId, state, scheduledDate, fsrsData), getTodayReviews(userId), getOverdueReviews(userId), completeReview(id, rating, durationMs, fsrsNextState), getReviewStats(userId)<br>3) `src/lib/api/tags.ts`：createTag(userId, name, color), getUserTags(userId), deleteTag(id), setEntryTags(entryId, tagIds), getEntryTags(entryId)<br>4) `src/lib/api/profiles.ts`：getProfile(userId), updateProfile(userId, data) | 无，新增文件 | 需在 Supabase 配置完成后验证 API 路径 | - |

### 阶段四：Auth 模块

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 10 | 创建 Auth Store | `src/stores/authStore.ts` | 使用 Zustand 创建 authStore：1) `user: User \| null`, `session: Session \| null`, `loading: boolean`<br>2) `initialize()` 监听 `supabase.auth.onAuthStateChange` 并更新状态<br>3) `signUp(email, password, displayName?)`<br>4) `signIn(email, password)`<br>5) `signInWithOAuth(provider)`<br>6) `signOut()`<br>7) `resetPassword(email)` | 无（新文件） | - | - |
| 11 | 创建 AuthGuard 组件 | `src/components/AuthGuard.tsx` | 1) 检查 authStore.user 是否存在<br>2) 若 loading 为 true，显示 Loading 状态<br>3) 若 user 为 null，重定向到 `/auth/login`<br>4) 否则渲染 `<Outlet />` | 无（新文件，将在 App.tsx 中引用） | - | - |
| 12 | 创建 Auth 页面 | `src/pages/Auth/LoginPage.tsx`, `src/pages/Auth/SignUpPage.tsx`, `src/pages/Auth/ResetPasswordPage.tsx` | 1) LoginPage：邮箱+密码表单，OAuth 按钮（Google/GitHub），"忘记密码"链接，"去注册"链接<br>2) SignUpPage：邮箱+密码+显示名表单，"去登录"链接<br>3) ResetPasswordPage：邮箱输入表单，发送重置邮件<br>所有页面均使用 shadcn/ui 组件（Card + Input + Button） | 无（新文件） | 需先安装 shadcn 组件（步骤3）；OAuth 需 Supabase 控制台配置 provider callback | - |
| 13 | 创建 Auth Layout + 路由 | `src/components/AuthLayout.tsx` | 1) 居中布局，卡片样式，App Logo<br>2) 渲染 `<Outlet />` 作为子路由<br>3) 若已登录则重定向到 `/` | 无（新文件） | - | - |

### 阶段五：FSRS 调度引擎

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 14 | 实现 FSRS 调度服务 | `src/lib/fsrs.ts` | 1) 导入 `ts-fsrs`，创建 `createEmptyCard()` 辅助<br>2) 提供 `initScheduler(userParams?)` 初始化 FSRS 实例（可选自定义参数）<br>3) `scheduleReview(card, rating)` 调用 `fsrs.next(card, now, rating)`，返回 `{ nextState, nextCard, nextScheduledDate }`<br>4) `getNextReviewDate(nextCard)` 返回 ISO 日期字符串<br>5) `cardToReviewState(card)` 映射 FSRS state 到 ReviewState<br>6) 导出 `FsrsScheduler` 类封装上述逻辑 | 无（新文件），依赖 `ts-fsrs` 库 | FSRS 算法需理解 4 级评分语义；ts-fsrs 的 API 可能有版本差异 | - |
| 15 | 创建复习 Store | `src/stores/reviewStore.ts` | 使用 Zustand + TanStack Query（可选）创建 reviewStore：1) `todayReviews: Review[]`<br>2) `loadTodayReviews(userId)` 调用 API<br>3) `submitReview(reviewId, rating, durationMs)` → 调用 FSRS 调度 → 更新 reviews 表 → 刷新列表<br>4) `overdueReviews` 状态管理<br>5) `stats` 计算 | 无（新文件） | 依赖步骤9（API 层）和步骤14（FSRS 引擎） | - |

### 阶段六：页面重写（可部分并行）

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 16 | 重写 Dashboard 页面 | `src/pages/Dashboard.tsx` | 1) 删除所有 MUI 导入<br>2) 使用 shadcn Card/Button/Badge/Progress<br>3) 统计卡片使用 Tailwind grid<br>4) 今日复习 + 逾期列表使用 FSRS ReviewCard 组件<br>5) 每个复习项支持 4 级评分按钮（Again/Hard/Good/Easy）<br>6) 调用 reviewStore 获取数据<br>7) 空状态使用 shadcn 组件展示 | `src/components/ReviewCard.tsx`（需同步重写） | ReviewCard 需从简单的"完成/未完成"改为 FSRS 4 级评分模式，交互复杂度提升 | - |
| 17 | 重写 ReviewCard 组件 | `src/components/ReviewCard.tsx` | 1) 删除 MUI 依赖<br>2) Props 改为 FSRS 模式：`review: Review & { entry: Entry }`, `onRate: (reviewId, rating: ReviewRating) => void`<br>3) 展开显示 entry.title、content_md 预览、tags（shadcn Badge）<br>4) 底部 4 个评分按钮（Again=红色/Hard=橙色/Good=蓝色/Easy=绿色）<br>5) 显示下次复习时间预估 | `Dashboard.tsx`（步骤16） | 按钮交互需与 FSRS 调度联动，评分后应立即更新 UI | 16 |
| 18 | 重写 AddEntry 页面 | `src/pages/AddEntry.tsx` | 1) 删除 MUI 依赖<br>2) 使用 shadcn 的 Card/Input/Button<br>3) 集成 TipTap 编辑器替代原 TextField（content_md 字段）<br>4) 创建 `src/components/TipTapEditor.tsx`：基础 TipTap 配置（bold, italic, heading, list, code block）<br>5) 保留来源输入<br>6) TagSelector 重写为 shadcn Command 组件<br>7) 提交后调用 entries API + 首次 FSRS 调度创建复习记录 | `src/components/TipTapEditor.tsx`（新文件）, `src/components/TagSelector.tsx`（需重写） | TipTap 集成复杂度中等，需安装 `@tiptap/react` + `@tiptap/starter-kit` | - |
| 19 | 重写 History 页面 | `src/pages/History.tsx` | 1) 删除 MUI 依赖<br>2) 使用 shadcn Accordion + Table 或 Card 列表<br>3) 添加全文搜索输入框（搜索 title/content_md）<br>4) 添加筛选：标签（多选）+ 来源（下拉）+ 状态（已/未完成）+ 日期范围<br>5) 每项展开显示 content_md（渲染为 HTML）和复习历史<br>6) 支持编辑和删除操作 | `src/lib/api/entries.ts`（需补充 search/sort 逻辑） | 搜索需 Supabase 端支持，可能需要 `ilike` 查询或 pg_trgm | - |
| 20 | 重写 Calendar 页面 | `src/pages/Calendar.tsx` | 1) 删除 MUI 依赖<br>2) 使用 Tailwind Grid 绘制日历（保留 `getMonthWeeks` 逻辑）<br>3) 日期方块用不同颜色密度表示复习任务量<br>4) 点击日期弹出 shadcn Dialog 显示当日复习详情<br>5) 按月加载 reviews API 数据 | `src/utils/dates.ts`（保留，微调） | 日历 UI 从 MUI Box 改为纯 Tailwind，样式需重新实现 | - |
| 21 | 重写 Stats 页面 + 图表 | `src/pages/Stats.tsx` | 1) 删除 MUI 依赖<br>2) 统计卡片使用 Tailwind + shadcn Card<br>3) 添加 Recharts 图表：<br>  a) 热力图（按月/周复习分布）<br>  b) 遗忘曲线（FSRS stability 变化）<br>  c) 完成率趋势折线图<br>4) 复习时长统计（`duration_ms` 汇总）<br>5) 创建 `src/components/charts/HeatmapChart.tsx`, `ForgettingCurve.tsx`, `CompletionTrend.tsx` | `src/components/charts/`（新目录） | Recharts 数据格式适配；热力图实现较复杂可能需要自定义 | - |

### 阶段七：搜索 & 筛选 & 标签管理

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 22 | 实现搜索筛选 Hook | `src/hooks/useSearch.ts` | 1) `useSearch(userId)` 返回 `{ query, setQuery, results, loading }`<br>2) 调用 Supabase `entries` 表 `ilike` 查询 title + content_md<br>3) 支持 debounce 防抖 | 无（新文件） | Supabase 需要 pg_trgm 扩展支持 GIN 索引；如未启用需回退到 `ilike` | - |
| 23 | 重写 TagSelector 组件 | `src/components/TagSelector.tsx` | 1) 删除 MUI Autocomplete/Chip/Dialog<br>2) 使用 shadcn Command（下拉搜索） + Badge（已选标签）<br>3) 支持创建新标签（弹出 Dialog 输入名称+选颜色）<br>4) 标签颜色预览圆点 | `AddEntry.tsx`（步骤18） | - | 18 |

### 阶段八：导入导出模块

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 24 | 实现导入导出功能 | `src/lib/export.ts`, `src/lib/import.ts`, `src/components/ImportExportDialog.tsx` | 1) `export.ts`：`exportJSON(entries)` 导出所有数据为 JSON；`exportCSV(entries)` 导出 CSV（title, content_md, source, tags, reviews）<br>2) `import.ts`：`importJSON(file)` 解析 JSON 批量导入；`importAnki(file)` 解析 Anki .apkg 或 CSV 格式<br>3) `ImportExportDialog.tsx`：shadcn Dialog，导出格式选择，文件上传<br>4) 在 Dashboard 或 History 页面添加入口按钮 | 相关页面 | Anki .apkg 解析需要第三方库（如 `jszip`），需额外依赖 | - |

### 阶段九：i18n + 暗色模式

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 25 | i18n 配置 + 翻译 | `src/i18n/index.ts`, `src/i18n/locales/zh.json`, `src/i18n/locales/en.json`, `src/i18n/LanguageSwitcher.tsx` | 1) 创建 `src/i18n/index.ts`：初始化 i18next + react-i18next + LanguageDetector<br>2) `zh.json`：所有中文文案（导航、表单、提示、图表标签）<br>3) `en.json`：对应英文翻译<br>4) `LanguageSwitcher.tsx`：放在 Layout 顶部或设置菜单中<br>5) 修改所有页面的硬编码文案为 `useTranslation()` 的 `t()` 调用 | 所有页面文件（Dashboard/AddEntry/History/Calendar/Stats/Auth 页面） | 文案量大，可能遗漏；建议先完成核心页面再逐步覆盖 | 26 |
| 26 | 暗色模式 | `tailwind.config.ts`, `src/components/ThemeToggle.tsx`, `src/lib/theme.ts` | 1) 确保 tailwind.config.ts `darkMode: 'class'`<br>2) `src/lib/theme.ts`：创建 Zustand Store `useThemeStore`，存储 `theme: 'light' \| 'dark' \| 'system'`，`toggleTheme()`<br>3) 在 `<html>` 节点动态添加/移除 `dark` class<br>4) `ThemeToggle.tsx`：shadcn DropdownMenu 选择 light/dark/system<br>5) 验证所有 shadcn 组件在 dark mode 下显示正确 | `main.tsx`（需初始化主题） | Tailwind dark: 前缀需在每个组件手动适配；shadcn 组件自带支持 | 25 |

### 阶段十：应用入口 + 路由重组

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 27 | 重写 App.tsx（路由重组） | `src/App.tsx` | 1) 删除 MUI ThemeProvider/CssBaseline 导入<br>2) 包裹 TanStack Query Provider<br>3) 包裹 `I18nextProvider`<br>4) 包裹 Sonner Toaster<br>5) 路由结构：<br>  - `/auth` (AuthLayout) → login, signup, reset-password<br>  - `/` (AuthGuard + MainLayout) → dashboard, add, history, calendar, stats, settings<br>6) 在顶层 `useEffect` 中调用 `authStore.initialize()` 和 `useThemeStore` 恢复 | `src/main.tsx` | 旧路由全部改变，确保无死链接 | - |
| 28 | 重写 Layout 组件 | `src/components/Layout.tsx` | 1) 删除 MUI 全部导入<br>2) 侧边栏用 Tailwind 重写（固定宽度 240px）<br>3) 保留 5 个导航项，图标改用 lucide-react（shadcn 默认图标库）<br>4) 添加用户头像+下拉菜单（DropdownMenu）：显示名、设置、主题切换、语言切换、退出登录<br>5) 移动端适配：底部 Tab Bar 或 Sheet 侧边栏 | 无（依赖步骤27 App.tsx） | lucide-react 需额外安装 | - |
| 29 | 重写 main.tsx | `src/main.tsx` | 1) 移除 StrictMode（可选保留）<br>2) 导入全局 `src/index.css`（含 Tailwind）<br>3) 导入 `src/i18n/index.ts`（初始化 i18n）<br>4) 渲染 App | 无 | - | - |

### 阶段十一：清理 MUI + 测试

| # | 步骤 | 涉及文件 | 具体修改 | 影响范围 | 关联风险 | 并行 |
|---|------|---------|---------|---------|---------|------|
| 30 | 移除 MUI 依赖 + 清理残留 | `package.json`, `src/theme.ts` | 1) 卸载 `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`<br>2) 删除 `src/theme.ts`<br>3) 全局搜索 `@mui` 引用，确保无残留<br>4) 删除 `src/db/` 目录<br>5) 删除 `src/utils/memoryCurve.ts` | 全部文件 | 确认无遗漏后执行卸载；此步骤依赖前面所有页面重写完成 | - |
| 31 | 编写核心单元测试 | `src/__tests__/fsrs.test.ts`, `src/__tests__/authStore.test.ts`, `src/__tests__/dates.test.ts`, `src/__tests__/export.test.ts` | 1) `fsrs.test.ts`：测试 FSRS 调度逻辑，验证评分后 nextDate 合理性，state 转换正确性<br>2) `authStore.test.ts`：测试 signIn/signOut 状态变化<br>3) `dates.test.ts`：测试 getMonthWeeks、today、formatDate 等工具函数<br>4) `export.test.ts`：测试 JSON/CSV 导出格式正确<br>5) 配置 `vitest.config.ts`：`jsdom` 环境 | `vitest.config.ts`（新增）, `package.json` 添加 test 脚本 | - | - |

---

## 待修改文件
- `package.json` — 安装/卸载依赖（步骤1,2,30）
- `vite.config.ts` — 添加 `@` alias（步骤1）
- `tsconfig.app.json` — 添加 baseUrl + paths（步骤1）
- `src/main.tsx` — 移除 MUI，加入 Tailwind + i18n 初始化（步骤29）
- `src/App.tsx` — 路由全面重组（步骤27）
- `src/types/index.ts` — 重写全部类型定义（步骤7）
- `src/components/Layout.tsx` — MUI→Tailwind 重写（步骤28）
- `src/components/ReviewCard.tsx` — 固定进度→FSRS 4级评分（步骤17）
- `src/components/StatsCard.tsx` — MUI→Tailwind 重写（或在步骤16中内联替代）
- `src/components/TagSelector.tsx` — MUI→shadcn 重写（步骤23）
- `src/pages/Dashboard.tsx` — 重写（步骤16）
- `src/pages/AddEntry.tsx` — 重写 + TipTap（步骤18）
- `src/pages/History.tsx` — 重写 + 搜索筛选（步骤19）
- `src/pages/Calendar.tsx` — 重写（步骤20）
- `src/pages/Stats.tsx` — 重写 + Recharts 图表（步骤21）
- `src/utils/dates.ts` — 保留，微调（步骤20）

## 新增文件
- `src/index.css` — Tailwind 入口（步骤1）
- `tailwind.config.ts` — Tailwind 配置（步骤1）
- `postcss.config.js` — PostCSS 配置（步骤1）
- `src/lib/utils.ts` — cn() 工具函数（步骤1）
- `src/components/ui/*` — 15+ shadcn 组件（步骤3）
- `src/lib/supabase.ts` — Supabase client（步骤4）
- `src/lib/api/entries.ts` — Entries API 层（步骤9）
- `src/lib/api/reviews.ts` — Reviews API 层（步骤9）
- `src/lib/api/tags.ts` — Tags API 层（步骤9）
- `src/lib/api/profiles.ts` — Profiles API 层（步骤9）
- `src/lib/fsrs.ts` — FSRS 调度引擎（步骤14）
- `src/lib/export.ts` — 导出逻辑（步骤24）
- `src/lib/import.ts` — 导入逻辑（步骤24）
- `src/lib/theme.ts` — 主题 Store（步骤26）
- `src/stores/authStore.ts` — Auth 状态管理（步骤10）
- `src/stores/reviewStore.ts` — 复习状态管理（步骤15）
- `src/hooks/useSearch.ts` — 搜索筛选 Hook（步骤22）
- `src/components/AuthGuard.tsx` — 鉴权路由守卫（步骤11）
- `src/components/AuthLayout.tsx` — Auth 页面布局（步骤13）
- `src/components/ThemeToggle.tsx` — 主题切换按钮（步骤26）
- `src/components/TipTapEditor.tsx` — Markdown 编辑器（步骤18）
- `src/components/ImportExportDialog.tsx` — 导入导出弹窗（步骤24）
- `src/components/charts/HeatmapChart.tsx` — 热力图（步骤21）
- `src/components/charts/ForgettingCurve.tsx` — 遗忘曲线（步骤21）
- `src/components/charts/CompletionTrend.tsx` — 完成率趋势（步骤21）
- `src/pages/Auth/LoginPage.tsx` — 登录页（步骤12）
- `src/pages/Auth/SignUpPage.tsx` — 注册页（步骤12）
- `src/pages/Auth/ResetPasswordPage.tsx` — 密码重置页（步骤12）
- `src/types/database.ts` — Supabase 数据库类型（步骤5）
- `src/i18n/index.ts` — i18n 初始化（步骤25）
- `src/i18n/locales/zh.json` — 中文翻译（步骤25）
- `src/i18n/locales/en.json` — 英文翻译（步骤25）
- `src/i18n/LanguageSwitcher.tsx` — 语言切换组件（步骤25）
- `src/__tests__/fsrs.test.ts` — FSRS 单测（步骤31）
- `src/__tests__/authStore.test.ts` — Auth Store 单测（步骤31）
- `src/__tests__/dates.test.ts` — 日期工具单测（步骤31）
- `src/__tests__/export.test.ts` — 导出单测（步骤31）
- `vitest.config.ts` — Vitest 配置（步骤31）

## 删除文件
- `src/theme.ts` — MUI 主题（步骤30）
- `src/db/db.ts` — Dexie 数据库（步骤8）
- `src/db/` — 整个目录（步骤8）
- `src/utils/memoryCurve.ts` — 旧算法（步骤7/30）

## 全局风险（无特定步骤归属，影响多步骤）
1. **Supabase Auth 依赖外部配置**：步骤6的 SQL 执行和 OAuth 配置需在 Supabase 控制台手动完成，不在代码仓库内；步骤12的 Auth 页面依赖此配置就绪
2. **RLS 策略安全**：需为 entries/tags/reviews 表配置行级安全策略，确保用户只能访问自己的数据；配置错误会导致数据互串或无法写入
3. **迁移策略**：旧用户本地的 IndexedDB 数据无法自动迁移到 Supabase，需通过导入导出功能（步骤24）手动完成
4. **TypeScript 6 + React 19 兼容性**：shadcn/ui、ts-fsrs、TipTap 等第三方库可能尚未完全支持 TS6/React19，安装时需关注 peer dependencies 警告
5. **步骤依赖链**：`类型定义(7) → API层(9) → Store(10,15) → 页面(16-21)` 为强依赖链，前一步未完成则后续无法编译
6. **大爆炸式重构风险**：旧代码一次性删除后新代码未全部就绪时期无法运行；建议采用"增量式"策略：先建新文件、再切换引用、最后删旧文件
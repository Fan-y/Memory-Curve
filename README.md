# Memory Curve

Memory Curve 是一个基于 FSRS 的记忆复习应用。
你可以把知识条目放进来，然后按系统给出的节奏复习，降低遗忘、提升长期记忆。

## 这个应用能做什么

- 创建知识条目：标题、内容、来源、标签
- 自动生成首条复习任务，形成“创建 -> 复习”闭环
- Dashboard 查看今日任务和逾期任务，并快速评分
- History 做关键词搜索（防抖）、筛选、编辑、删除
- JSON/CSV 导出，JSON 导入（支持批量迁移）
- Calendar 按日期查看复习任务与明细
- Stats 查看趋势、热力图和遗忘曲线估算
- 支持中英文和浅色/深色/跟随系统主题

## 3 分钟上手

### 1) 安装依赖

```bash
pnpm install
```

### 2) 创建环境变量

```bash
cp .env.example .env
```

然后在 .env 中填写：

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

可选兼容项：

- VITE_SUPABASE_ANON_KEY

### 3) 启动

```bash
pnpm run dev
```

浏览器打开：http://localhost:5173

## 首次使用流程（给普通用户）

1. 注册/登录账号
2. 在 Add Entry 新建一条知识内容
3. 回到 Dashboard 对待复习卡片评分
4. 在 History 回看和检索条目
5. 在 Calendar 看每天任务分布
6. 在 Stats 看阶段性复习效果

## 页面功能对照

| 页面 | 作用 |
| --- | --- |
| Dashboard | 今日/逾期任务、快速评分 |
| Add Entry | 新建条目与标签 |
| History | 搜索、筛选、编辑、删除、导入导出 |
| Calendar | 按天查看任务量与任务明细 |
| Stats | 完成率、趋势、热力图、遗忘曲线 |

## 环境变量

| 变量名 | 必填 | 用途 |
| --- | --- | --- |
| VITE_SUPABASE_URL | 是 | Supabase 项目地址 |
| VITE_SUPABASE_PUBLISHABLE_KEY | 是 | Supabase publishable key |
| VITE_SUPABASE_ANON_KEY | 否 | 旧版兼容 key（上项为空时回退） |
| SMOKE_TEST_EMAIL | 否 | 串测账号邮箱 |
| SMOKE_TEST_PASSWORD | 否 | 串测账号密码 |

## Supabase 配置提示

1. 开启 Email 登录。
2. 配置业务表和 RLS（常用表：profiles、entries、tags、entry_tags、reviews）。
3. 前后端字段建议对照 src/types/database.ts 保持一致。

## 命令速查

```bash
# 本地开发
pnpm run dev

# 严格类型检查（app + node）
pnpm run typecheck

# 单元测试
pnpm run test

# 生产构建
pnpm run build

# 本地预览构建产物
pnpm run preview

# 串测核心流程
pnpm run smoke:workflow
```

## 串测说明（可选）

- 脚本会验证主流程：创建条目 -> 创建复习 -> 完成评分 -> 搜索/编辑/删除。
- 若未设置 SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD，会尝试临时注册。
- 若遇到邮箱确认或注册限流，建议配置固定测试账号再运行。

## 常见问题

### 页面提示缺少 Supabase 环境变量

确认 .env 已包含 VITE_SUPABASE_URL 与 VITE_SUPABASE_PUBLISHABLE_KEY，并重启 pnpm run dev。

### 串测失败，提示没有 session

通常与邮箱确认策略有关。建议先在 .env 中配置 SMOKE_TEST_EMAIL 与 SMOKE_TEST_PASSWORD。

### 启动后是空白或跳到 setup 页面

通常是环境变量为空或 Supabase 连接失败。先检查 .env 配置与 key 是否正确。

## 目录概览

```text
.
├─ scripts/            # 自动化脚本（如 smoke-workflow）
├─ src/
│  ├─ components/      # UI 与布局组件
│  ├─ hooks/           # 自定义 hooks
│  ├─ lib/             # API、FSRS 与工具函数
│  ├─ pages/           # 页面
│  ├─ stores/          # Zustand 状态管理
│  └─ types/           # TypeScript 类型
└─ context/plan.md     # 阶段计划与执行状态
```

## 当前状态

项目已完成阶段化 MVP 与增强能力，具备继续扩展为完整产品的基础。
# Memory Curve · 记忆曲线复习计划

基于艾宾浩斯遗忘曲线的学习复习工具。添加学习内容，系统自动按照 1、2、4、7、15、30 天安排 6 次复习。

## 技术栈

React 18 · TypeScript · Vite · Material UI 5 · Dexie.js (IndexedDB) · dayjs · react-router-dom

## 功能

- **添加记录** — 记录学习内容、来源、标签
- **自动排期** — 根据艾宾浩斯曲线生成复习计划
- **仪表盘** — 今日待复习、逾期提醒、完成进度
- **日历** — 按月查看复习分布
- **历史** — 所有条目及复习完成状态
- **统计** — 完成率、总览数据

## 本地运行

```bash
npm install
npm run dev
```

## 部署 (Cloudflare Pages)

项目根目录已包含 `public/_redirects`，确保 SPA 路由正常工作。

| 配置 | 值 |
|------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |

## 许可证

MIT

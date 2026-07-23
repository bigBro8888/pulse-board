# 轻量化项目管理

轻量项目管理工作台 — 基于 React + Vite，数据云端同步到 Cloudflare KV，并在浏览器本地缓存。

## 功能

- 访问密码登录门禁
- Cloudflare KV 跨浏览器项目同步
- 项目创建、编辑、删除
- 进度与状态管理（进行中 / 已暂停 / 已完成）
- 截止日期临近提醒（2 天浅红、1 天深红）
- 搜索、筛选、排序
- 概览 Dashboard

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 http://localhost:5173  
默认访问密码：`tony1234`

本地开发时 `/api/projects` 默认不可用，数据会先保存在本机；部署到 Cloudflare Pages 并绑定 KV 后即可跨浏览器同步。

## 构建

```bash
npm run build
```

## Cloudflare 部署与 KV 绑定

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. 进入 **KV** → **Create namespace**，名称建议：`lpm-projects`
3. 打开你的 **Pages 项目** → **Settings → Bindings → Add → KV namespace**
   - **Variable name**：`PROJECTS_KV`（必须与代码一致）
   - **KV namespace**：选择 `lpm-projects`
4. 可选：把 `wrangler.toml` 里的 `id` / `preview_id` 换成该 KV 的 Namespace ID
5. **重新部署** Pages 项目，绑定才会生效

接口：

- `GET /api/projects`：读取项目列表
- `PUT /api/projects`：整表保存
- 请求头：`Authorization: Bearer tony1234`

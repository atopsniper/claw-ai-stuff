# claw-ai-stuff

基于 Cloudflare Workers / Pages 的 VLESS + Trojan 节点面板，目标是：

- **部署更傻瓜**：一键脚本 / 最少操作完成 Workers / Pages 部署
- **管理更清晰**：多用户、多节点、订阅结构简单直观

> 本项目当前处于设计与搭建阶段，下文为预期结构草案。

## 功能概览

- 支持 VLESS + Trojan
- 多用户管理，每个用户独立订阅链接
- 多节点配置，支持按用户分配可见/可用节点
- Cloudflare Workers / Pages 一键部署脚本
- 简洁后台：左侧菜单 + 几个基础页面（用户 / 节点 / 订阅 / 系统设置）

## 文档与架构说明

- `docs-arch.md`：基于 edgetunnel `_worker.js` 拆出来的整体架构草案，帮助你看懂请求流程、KV 结构、订阅 & 代理逻辑。

后续会继续补充：
- Cloudflare Workers 部署文档（命令 + 截图占位）
- 与上游 `_worker.js` 协作 / 更新说明

## 部署方式（Workers 最小可跑版本）

### 1. 使用 Cloudflare Workers 部署

> 适合已经安装好 `wrangler` 并熟悉命令行的用户。

大致步骤（最小可跑）：

1. Fork 本仓库或下载源码
2. 本地安装 `wrangler`（或者用 `deploy-worker.sh` 脚本自动安装）
3. 在 `worker/wrangler.toml` 里：
   - 修改 `name` 为你在 Cloudflare 上想要的 Worker 名
   - 在 Cloudflare Dashboard 创建 KV 命名空间，并把 `id` 填到 `[[kv_namespaces]]` 里
   - 修改 `ADMIN` / `KEY` 为你自己的密码 / 密钥
4. 在项目根目录执行：

   ```bash
   ./deploy-worker.sh
   ```

   首次部署会：
   - 检查是否安装 `wrangler`
   - 在 `worker/` 目录下执行 `wrangler deploy`

5. 在 Cloudflare Dashboard 里给这个 Worker 绑定自定义域名（可选）

> 当前 `_worker.js` 只是一个占位版本：返回简单的“worker is running” 文本，用于验证部署链路是否正常。后续会逐步替换为基于 edgetunnel 的完整逻辑。

### 2. 使用 Cloudflare Pages 部署

> 适合希望尽量少敲命令、主要在网页界面操作的用户。

大致步骤：

1. 在 Cloudflare Pages 新建项目
2. 上传打包好的 ZIP 或连接 GitHub 仓库
3. 配置环境变量和 KV 绑定
4. 绑定 CNAME 自定义域

同样会提供图文步骤和截图占位。

## 目录结构（草案）

```text
claw-ai-stuff/
  README.md
  LICENSE (待添加，默认 MIT)
  .gitignore (待添加)
  worker/
    _worker.js        # Workers 版本入口（基于 edgetunnel 精简改造）
    wrangler.toml     # Workers 配置
    deploy-worker.sh  # 一键部署脚本（规划）
  pages/
    ...               # Pages 部署相关文件
  panel/
    ...               # 前端管理面板（简化版）
```

## 计划

1. 梳理并精简 edgetunnel 核心逻辑，提炼为更小巧的核心
2. 设计并实现简化后台（用户 / 节点 / 订阅 / 系统设置）
3. 完成 Workers 部署链路（代码 + 一键脚本 + 图文教程）
4. 完成 Pages 部署链路
5. 补充常见问题与排错章节

---

当前仓库内容仍在快速变化中，请暂时不要用于生产环境。
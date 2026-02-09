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

## 部署方式（Workers 第一版草稿）

### 1. 使用 Cloudflare Workers 部署

> 适合已经安装好 `wrangler` 并熟悉命令行的用户。

大致步骤：

1. Fork 本仓库或下载源码
2. 在 Cloudflare 创建 Worker 项目
3. 配置环境变量（ADMIN、KEY 等）
4. 绑定 KV 命名空间
5. 部署并绑定自定义域

详细命令与截图教程会在完成后补充到这里。

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
# 部署教程（人人能照做）

这份教程面向**不懂代码**的人：照着点、照着填就能部署。

本仓库做了两件事：

1. **Worker 端逻辑**（基于上游 `cmliu/edgetunnel`）：在 `third_party/edgetunnel/_worker.js`
2. **更漂亮的后台静态页面**：在 `docs/*`（通过 GitHub Pages 托管）

部署目标：
- 登录页：`https://<你的域名>/login`
- 后台：`https://<你的域名>/admin`

---

## 0. 你需要准备什么

- 一个 Cloudflare 账号（免费即可）
- （可选）一个你自己的域名（不买也能先用 `*.workers.dev`）
- 本仓库已经 fork / 可访问

---

## 1. 先发布后台页面（GitHub Pages）

Worker 的 `/admin`、`/login` 页面是从一个静态站点拉取的。

本仓库已经把静态站点放在 `docs/`，你只需要开启 GitHub Pages。

### 操作步骤

1) 打开你的 GitHub 仓库页面 → **Settings**

2) 左侧找到 **Pages**

3) 在 **Build and deployment** 里：
- **Source**：选择 `Deploy from a branch`
- **Branch**：选择 `main`
- **Folder**：选择 `/docs`

4) 点保存，等待 1~3 分钟

### 你会得到一个 Pages 地址

通常形如：

- `https://<你的用户名>.github.io/<仓库名>`

例如本仓库示例：

- `https://atopsniper.github.io/claw-ai-stuff`

> 注意：如果你 fork 了仓库，请把下面 Worker 里 `Pages静态页面` 的地址改成你自己的 Pages 地址。

---

## 2. 部署 Cloudflare Worker（网页方式，最简单）

### 2.1 创建 Worker

1) 登录 Cloudflare → 进入 **Workers & Pages**

2) 点击 **Create** → 选择 **Worker**

3) 给 Worker 起一个名字（随便，例：`edgetunnel-ui`）

4) 进入 Worker 编辑器

### 2.2 粘贴 Worker 代码

把下面这个文件的内容**整段复制**，粘贴进 Cloudflare Worker 编辑器里覆盖原内容：

- `third_party/edgetunnel/_worker.js`

然后点 **Deploy**。

---

## 3. 配置必填项：ADMIN 和 KV

这个项目最容易卡住的点就是：**忘了设置 ADMIN 或忘了绑定 KV**。

### 3.1 设置环境变量 ADMIN

在 Cloudflare Worker 页面：

- Settings → Variables → **Add variable**

添加：
- Name：`ADMIN`
- Value：你自己的后台登录密码（建议 16 位以上，随机）

（可选）
- Name：`KEY`
- Value：订阅路径密钥（不填也能先跑）

保存后，**重新部署一次**（让变量生效）。

### 3.2 绑定 KV Namespace

在 Cloudflare Worker 页面：

- Settings → Bindings → **Add binding** → KV Namespace

要求：
- Variable name：必须是 `KV`
- KV namespace：选择一个已有 KV 或创建一个新的

保存后，**重新部署一次**。

---

## 4. 访问登录与后台

部署完成后：

- 打开：`https://<你的域名或 workers.dev>/login`
- 输入你设置的 `ADMIN` 密码
- 登录后会跳转到：`/admin`

后台页面包含：
- 直接编辑并保存 `config.json`
- 保存 TG 配置 `tg.json`
- 保存本地优选 IP `ADD.txt`

---

## 5. （可选）绑定你自己的域名

Cloudflare Worker 页面：

- Triggers / Custom Domains（不同 UI 版本名称略有差别）

绑定一个域名后，你就可以用：
- `https://<你的域名>/login`
- `https://<你的域名>/admin`

---

## 6. 常见错误排查

### 6.1 打开 /admin 显示“未设置 ADMIN”

说明：你没设置环境变量 `ADMIN`。

解决：
- Worker Settings → Variables → 添加 `ADMIN`
- 然后重新部署

### 6.2 打开 /admin 显示“未绑定 KV”

说明：你没绑定 KV 或变量名不是 `KV`。

解决：
- Worker Settings → Bindings → KV Namespace → Variable name 必须叫 `KV`
- 然后重新部署

### 6.3 /admin 或 /login 还是旧页面、不漂亮

说明：GitHub Pages 还没生效，或者 Worker 指向的静态站地址不是你的 Pages。

检查：
- 仓库是否开启 Pages：`main` + `/docs`
- `_worker.js` 顶部的：`Pages静态页面` 是否是你的 Pages 地址

---

## 7. 免责声明

本项目用于个人学习与自用。请遵守所在地法律法规与 Cloudflare/GitHub 服务条款。

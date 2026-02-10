# claw-ai-stuff 架构草案（基于 edgetunnel _worker.js 拆解）

> 说明：这一版是帮助你“看懂上游 Worker 在干嘛”的草图，方便后面迭代和精简。

## 1. 整体请求流程（高层）

入口是 Cloudflare Worker 的 `fetch(request, env, ctx)`：

1. **解析基础信息**
   - 从 `request.url` 拿 `hostname / pathname / searchParams`
   - 从 `env` 里拿：`ADMIN / KEY / UUID / HOST / PATH / PROXYIP / GO2SOCKS5 / URL / KV`
   - 计算：
     - 管理员密码：`管理员密码 = env.ADMIN || env.PASSWORD || env.TOKEN || env.KEY ...`
     - 加密密钥：`加密秘钥 = env.KEY || 默认字符串`
     - 用户 UUID：如果 `env.UUID` 合法就用它，否则用 (管理员密码 + KEY) 的 MD5 派生
   - 处理伪装域名列表：`hosts = env.HOST || [当前 Host]`

2. **根据是否是 WebSocket 请求分流**
   - 如果 `Upgrade != websocket` → 当作普通 HTTP 请求处理
   - 如果是 WebSocket 且有管理员密码 → 走 WS 转发逻辑（VLESS / Trojan）

3. **普通 HTTP 请求分支**
   - 如果协议是 http → 301 跳 https
   - 如果没有设置 `ADMIN` → 返回一个“未配置管理员密码”的静态提示页
   - 如果绑定了 `KV`，按路径做进一步路由：
     - `/login`：登录页 + 登录提交（设置 `auth` cookie）
     - `/admin`：管理面板入口（带 `auth` 校验）
     - `/admin/...`：
       - `admin/config.json`：读取 / 写入 main 配置
       - `admin/cf.json`：读取 / 写入 Cloudflare API 配置
       - `admin/tg.json`：读取 / 写入 Telegram 推送配置
       - `admin/ADD.txt`：读取 / 写入本地优选 IP 列表
       - `admin/log.json`：读取访问日志
       - `admin/init`：重置配置为默认
       - `admin/getCloudflareUsage`：查询 CF 使用量
       - `admin/getADDAPI`：测试优选 API 是否可用
       - `admin/check`：测试 SOCKS5 / HTTP 代理连通性
     - `/sub`：生成订阅（混合 / Clash / Sing-box / Surge / Quantumult / Loon 等）
     - `/logout` 或 `/某个 uuid`：清除 cookie 并跳转登录
     - `/locations`：反代 `https://speed.cloudflare.com/locations`
     - `/robots.txt`：返回禁止抓取
   - 如果没有 KV 且没有指定 UUID：返回“没有 KV 配置”的静态提示页

4. **伪装页面（非管理 / 非订阅请求）**
   - 从 `env.URL` 读取伪装地址：
     - `nginx`：返回一个内置 Nginx 风格页面
     - `1101`：返回一个 Cloudflare 1101 风格 HTML
     - 其他 URL：当作反代源站，对文本类响应做 Host 替换

5. **WebSocket 分支（VLESS / Trojan 转发）**
   - 入口：`处理WS请求(request, yourUUID)`
   - 建立 `WebSocketPair`，接受客户端连接
   - 对首个数据包做协议判断：
     - Trojan：固定结构 + SHA224(password)
     - VLESS：检查版本、UUID、指令、地址类型
   - 根据解析结果：
     - 如果是 UDP 且端口 53：走 `forwardataudp`（DNS 转发到 8.8.4.4）
     - 其它：走 `forwardataTCP`，根据是否配置了 ProxyIP / SOCKS5 / HTTP 来决定：
       - 直连目标 host:port
       - 经过 SOCKS5 / HTTP 代理
       - 经过 ProxyIP 链式反代

---

## 2. KV / 配置结构（简化视角）

Worker 通过 `env.KV` 持久化几类数据：

- `config.json`：主配置
  - `HOST / HOSTS / UUID / PATH`
  - 协议与传输：`协议类型 (vless/trojan)`、`传输协议 (ws)`、`TLS分片`、`Fingerprint`、`ECH` 等
  - 订阅生成：
    - 本地 IP 库 / 随机 IP 数量 / 指定端口
    - 订阅名称 `SUBNAME`、更新间隔 `SUBUpdateTime`、订阅转换后端 `SUBAPI`、配置模板 `SUBCONFIG`
  - 反代配置：`PROXYIP`、SOCKS5 账号、白名单等
  - Telegram 推送开关
  - Cloudflare 用量统计配置

- `cf.json`：Cloudflare API 相关配置
  - `Email / GlobalAPIKey`
  - 或 `AccountID / APIToken`
  - 或直接 `UsageAPI`（预先构造的用量 API 地址）

- `tg.json`：Telegram 机器人配置
  - `BotToken`
  - `ChatID`

- `ADD.txt`：本地优选 IP 列表
  - 按行存储：`IP:PORT#备注`

- `log.json`：访问日志
  - 数组形式，每条大致包含：
    - `TYPE`：请求类型（Get_SUB / Save_Config / Admin_Login 等）
    - `IP / ASN / CC`：访问来源
    - `URL / UA / TIME`

在请求 `/admin`、`/sub` 等路径时，会先调用 `读取config_JSON`：
- 如果 `config.json` 不存在 → 写入一份默认配置
- 然后基于 `env` 和当前 host 衍生：
  - `完整节点路径`、`LINK`（标准 VLESS/Trojan 链接）、订阅 token 等

---

## 3. 订阅生成（/sub 路由）

核心思路：

1. 校验 token：
   - `token = MD5MD5(host + userID)`
   - URL 里的 `token` 必须匹配才返回订阅

2. 根据 UA / query 判断订阅输出类型：
   - `mixed`：原始节点列表（vless/trojan link）或 base64 版
   - `clash`：YAML 格式
   - `singbox`：JSON 格式
   - `surge/quanx/loon` 等：按相应语法拼接

3. 优选 IP 来源有两条路：
   - A. 本地生成：从 `ADD.txt` 或内置 CIDR 列表生成 IP:PORT
   - B. 订阅生成器：访问一个远端订阅，将其中含 `example.com` 的节点解析成 IP 列表

4. 生成节点时统一使用占位符：
   - 例如 `example.com`、`00000000-0000-4000-8000-000000000000` 等
   - 最后再用：
     - `批量替换域名` → 用配置中的 HOSTS 替换成真实伪装域名
     - 替换 UUID → 用 config_JSON.UUID

5. 对 Clash / Sing-box / Surge 等再做一层“热补丁”：
   - 添加 ECH 配置、utls 指纹、DNS 配置等

---

## 4. 反代 / 代理链逻辑（简化）

主要有几种方式：

1. **直接反代 IP**
   - 通过 `env.PROXYIP` 或 URL 参数指定 IP 列表
   - 在 `forwardataTCP` 中解析为 `[地址, 端口]` 数组，尝试连接，如果失败可以回退直连

2. **SOCKS5 / HTTP 代理**
   - 从 PATH / query 中解析：
     - `/socks5=...`、`/s5=...`、`/gs5=...`、`/http=...` 等
   - 把账号信息解析成：`username / password / hostname / port`
   - 分别用 `socks5Connect` / `httpConnect` 建立代理连接

3. **域名白名单**
   - `GO2SOCKS5` 环境变量可以设定哪些域名强制走 SOCKS5
   - 其他的则尝试直连 + 失败时再走代理

---

## 5. 我们在 claw-ai-stuff 里要做的事

在 `claw-ai-stuff` 这个项目里，目标不是重写所有逻辑，而是：

1. 提供 **清晰的结构说明**（如本文件）
2. 给出 **精简的配置结构 & 默认模板**，方便你自己扩展
3. 提供 **Cloudflare Workers 部署文档**：
   - 怎么创建 Worker
   - 怎么配置 `wrangler.toml`
   - 怎么在 CF 控制台里绑定 KV、填环境变量
4. 说明 **如何与上游 _worker.js 协作**：
   - 在本项目中保留 `_worker.js` 占位 + 配置
   - 当上游更新时，如何安全地替换 / 合并改动

后续可以把本文件拆成多篇更细的文档（比如：订阅生成详解、WS 转发详解等），目前先作为一个“总览草案”。

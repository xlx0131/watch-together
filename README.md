# 一起看 · Watch Together Web

一个可部署到 Cloudflare Pages 的「一起看」网站：选片 → 建房间 → 分享链接 → 多人同步观影 + 弹幕。访客**零配置**（Supabase 已烘焙进网站），打开链接即可加入。

## 功能

- **选片**：maccms10 资源站（`/api/video/proxy`），搜索 + 分类 + 翻页 + 多数据源切换。
- **播放**：DPlayer + hls.js（m3u8）；非 m3u/mp4 源用 iframe 兜底。
- **一起看房间**：建房（房主）→ 复制邀请链接 → 对方打开即入房（观众）。
- **同步**：房主控制播放/暂停/进度/切集/切源并广播；观众跟随；新入房者自动对齐进度。
- **弹幕**：DPlayer 内置弹幕输入，房间内实时互见。
- **在线成员**：Presence 显示昵称 + 房主/观众角色。

## 目录结构

```
watch-together-web/
├── functions/api/video/
│   ├── proxy.js        # 代理 maccms10 列表/详情（解决 CORS）
│   └── play.js         # 解析/代理视频流（可选，v1 前端未用，预留给后续）
├── src/
│   ├── config.ts       # ★ 填 Supabase URL / anon key
│   ├── api/mac.ts      # 数据源客户端
│   ├── lib/parse.ts    # vod_play_url 解析
│   ├── lib/room.ts     # Supabase Realtime 房间（channel + presence + broadcast）
│   ├── lib/types.ts    # 类型
│   ├── components/     # Catalog / Detail / Watch
│   └── App.tsx         # 编排（房间状态机 + 同步）
├── package.json / vite.config.ts / tsconfig.json / index.html
└── wrangler.toml
```

## 一、配置 Supabase（一次性，约 3 分钟）

1. 打开 [supabase.com](https://supabase.com) → 注册/登录 → **New project**（免费档即可）。
2. 建好后进 **Project Settings → API**。
3. 复制两个值：
   - **Project URL**（形如 `https://xxxx.supabase.co`）
   - **anon / public** key（注意是 anon，**不是** `service_role`）
4. 填入 `src/config.ts`：

```ts
export const SUPABASE_URL = "https://xxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi..."; // anon key
```

> 不需要建表、不需要 SQL、不需要配 RLS——只用 Realtime 的 channel 广播 + Presence（默认开启）。anon key 本就是公开设计。

## 二、本地运行（可选验证）

```bash
npm install
npm run dev        # 本地开发（functions 需用 wrangler 才能同源代理，纯前端预览可先用 dev）
npm run build      # 产物在 dist/
```

## 三、部署到 Cloudflare Pages

项目已含 `functions/`（视频反代）与 `wrangler.toml`，直接部署即可同时上线前端 + 反代接口。

**方式 A：wrangler CLI**

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name=watch-together
```

**方式 B：Cloudflare 控制台**

1. 本地先 `npm run build`。
2. Cloudflare 控制台 → Workers & Pages → Create → Pages → **Direct Upload**。
3. 上传 `dist/` 目录。
4. 关键：**Functions 目录也要一起部署**——Direct Upload 上传 `dist` 后，再在项目 Settings → Functions 里绑定本仓库的 `functions/`（或用 wrangler CLI 方式更省事，`wrangler pages deploy` 会自动带上 `functions/`）。

> 建议用 **方式 A**，`wrangler pages deploy` 会自动把 `functions/` 作为 Pages Functions 一起部署。

## 四、使用

1. 打开网站 → 选片 → 点某部片 →「开始一起看」→ 自动建房（你是房主）。
2. 点右侧「复制邀请链接」，发给对方。
3. 对方打开链接（`https://<域名>/?room=xxxx`）→ 自动以观众身份入房并跟随你的进度。
4. 双方在播放器底部弹幕框发弹幕，实时互见；右侧可见在线成员。

## 已知限制

- **网页播放源（非 m3u/mp4）走 iframe**，无法同步进度、无法发弹幕（会提示）。
- **昵称为随机生成**（v1 未做登录/改名），如需显示固定昵称，可在 `App.tsx` 的 `randomNickname()` 换成 `prompt` 或自定义输入。
- 房间为**纯内存**（不持久化），房主退出后房间失效。
- 观众手动拖动进度会被房主下一次操作覆盖（严格跟随）。
- `functions/api/video/play.js` 已保留但 v1 前端未使用，后续可用于把网页播放源统一转成可控 m3u8，实现全源同步。

## 说明

本网站逻辑源自 `dsh-plugin-watch-together` 插件（同款房间协议与解析器），但完全独立：**插件保持可用，网站独立部署**，两者互不影响。

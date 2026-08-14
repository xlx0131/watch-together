// ─────────────────────────────────────────────────────────────────────────────
// 站点配置：部署前把下面两个 Supabase 值填好，访客即可零配置使用。
//   Project Settings → API → Project URL 与 anon public key
// ─────────────────────────────────────────────────────────────────────────────
export const SUPABASE_URL = "https://eqhbypnwqeszoefcyveu.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_59_-gXiUd3NNxW5Tthws9g_nd49i_Qe"; // 新版可发布密钥（publishable key，等价旧版 anon key，客户端安全）

// 视频数据源反代地址：复用你已在 Cloudflare 部署的 /api/video 反代（带 CORS）
export const VIDEO_PROXY_BASE = "https://xn--rtzp06a6qg.site";

// 视频数据源（对应 functions/api/video/proxy.js 里的 SOURCES key）
export interface VideoSource {
  key: string;
  name: string;
}

export const SOURCES: VideoSource[] = [
  { key: "modu", name: "魔都云（直链·推荐）" },
  { key: "subo", name: "速播" },
  { key: "ffzy", name: "非凡云" },
  { key: "ikun", name: "非凡云(ikun)" },
  { key: "subocaiji", name: "速播云" },
  { key: "youzhi", name: "优质云" },
];

export const DEFAULT_SOURCE = "modu";

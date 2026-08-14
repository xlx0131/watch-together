import { VIDEO_PROXY_BASE } from "../config";

/**
 * 把 maccms10 的原始播放地址解析成「可控、可同步、可弹幕」的地址：
 *  - m3u8 / mp4 等直链 → 原样返回（m3u8 用 hls.js，mp4 用原生）
 *  - 网页源(html 播放页) → 走 /api/video/play 归一化成 m3u8（分片重写到反代上，跨域也解决）
 */
export function resolvePlayUrl(rawUrl: string): string {
  if (/\.(m3u8|m3u|mp4|webm|m4v|mov)(\?|$)/i.test(rawUrl)) return rawUrl;
  return `${VIDEO_PROXY_BASE}/api/video/play?url=${encodeURIComponent(rawUrl)}`;
}

/** 该播放地址是否需要 hls.js（m3u8 或经 play.js 归一化后的不透明地址） */
export function isHlsUrl(url: string): boolean {
  return /\.m3u8?(\?|$)/i.test(url) || /\/api\/video\/play\?/i.test(url);
}

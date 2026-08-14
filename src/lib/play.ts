/**
 * 播放地址解析。
 * 说明：ffzy 等源给出的是「分享页」(如 vip.ffzy-play*.com/share/...)，这些页面被 CDN
 * 做了反爬（Cloudflare 边缘节点抓取会被挡、返回的不是含 const url="..." 的真实 HTML），
 * 所以无法用 /api/video/play 归一化成 m3u8。故 v1 采用：
 *   - m3u8 直链 → hls.js（可同步、可弹幕）
 *   - mp4/webm 直链 → 原生（可同步、可弹幕）
 *   - 其它（分享页/网页源）→ iframe 兜底（能播，但不可同步、无弹幕）
 */
export function resolvePlayUrl(rawUrl: string): string {
  return rawUrl;
}

/** 该播放地址是否用 hls.js 播放 */
export function isHlsUrl(url: string): boolean {
  return /\.m3u8?(\?|$)/i.test(url);
}

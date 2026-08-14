import type { PlayTree } from "./types";

/**
 * 解析 maccms10 的 vod_play_url：
 *   集名$URL  为一集；# 分隔多集；$$$ 分隔多个播放来源；vod_play_from 用 , 对齐来源名。
 */
export function parsePlayUrl(vodPlayUrl?: string, vodPlayFrom?: string): PlayTree {
  const tree: PlayTree = { sources: [] };
  if (!vodPlayUrl || typeof vodPlayUrl !== "string") return tree;
  const names = (vodPlayFrom || "").split(",").map((s) => s.trim()).filter(Boolean);
  const groups = vodPlayUrl.split("$$$");
  groups.forEach((g, gi) => {
    const episodes: PlayTree["sources"][number]["episodes"] = [];
    g.split("#").forEach((seg) => {
      const dollar = seg.indexOf("$");
      if (dollar < 0) return;
      const label = seg.slice(0, dollar).trim();
      const url = seg.slice(dollar + 1).trim();
      if (!url) return;
      episodes.push({ label: label || `第${episodes.length + 1}集`, url });
    });
    if (episodes.length === 0) return;
    tree.sources.push({ name: names[gi] || `来源${gi + 1}`, episodes });
  });
  return tree;
}

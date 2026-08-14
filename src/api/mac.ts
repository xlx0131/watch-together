import type { MacListResponse } from "../lib/types";

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const data = await r.json();
  if (data && data.success === false) throw new Error(data.error || "资源站错误");
  if (data && data.success === true && data.data) return data.data;
  return data;
}

function macUrl(params: Record<string, string | number | undefined>, sourceKey: string): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  return `/api/video/proxy?source=${encodeURIComponent(sourceKey)}&${sp.toString()}`;
}

export async function macList(
  sourceKey: string,
  opts: { wd?: string; t?: string; pg?: number; pagesize?: number },
): Promise<MacListResponse> {
  return fetchJson(
    macUrl({ ac: "videolist", wd: opts.wd, t: opts.t, pg: opts.pg ?? 1, pagesize: opts.pagesize ?? 24 }, sourceKey),
  );
}

export async function macDetail(sourceKey: string, ids: string): Promise<MacListResponse> {
  return fetchJson(macUrl({ ac: "detail", ids }, sourceKey));
}

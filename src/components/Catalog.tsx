import { useState } from "react";
import type { MacVod } from "../lib/types";
import { SOURCES } from "../config";

interface CatalogProps {
  sourceKey: string;
  list: MacVod[];
  loading: boolean;
  error: string;
  page: number;
  pagecount: number;
  onSourceChange: (key: string) => void;
  onSearch: (wd: string) => void;
  onPage: (pg: number) => void;
  onOpenDetail: (vod: MacVod) => void;
}

export default function Catalog(props: CatalogProps) {
  const [kw, setKw] = useState("");
  return (
    <>
      <div className="topbar">
        <span className="title">一起看</span>
        <select className="select" value={props.sourceKey} onChange={(e) => props.onSourceChange(e.target.value)}>
          {SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="搜索片名…"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSearch(kw);
          }}
        />
        <button className="btn primary" onClick={() => props.onSearch(kw)}>
          搜索
        </button>
      </div>
      {props.error ? <div className="error">{props.error}</div> : null}
      <div className="scroll">
        <div className="grid">
          {props.list.map((v) => (
            <div className="card" key={v.vod_id} onClick={() => props.onOpenDetail(v)}>
              <div className="card-pic" style={v.vod_pic ? { backgroundImage: `url(${v.vod_pic})` } : undefined}>
                {v.vod_pic ? null : "🎬"}
              </div>
              <div className="card-name">{v.vod_name}</div>
              <div className="card-meta">{(v.vod_remarks || "") + (v.type_name ? " · " + v.type_name : "")}</div>
            </div>
          ))}
        </div>
        {props.loading ? <div className="empty">加载中…</div> : null}
        {!props.loading && props.list.length === 0 && !props.error ? <div className="empty">暂无结果，换个关键词或数据源试试</div> : null}
      </div>
      <div className="pager">
        <button className="btn" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)}>
          ‹ 上一页
        </button>
        <span>
          {props.page} / {Math.max(props.pagecount, 1)}
        </span>
        <button className="btn" disabled={props.page >= props.pagecount} onClick={() => props.onPage(props.page + 1)}>
          下一页 ›
        </button>
      </div>
    </>
  );
}

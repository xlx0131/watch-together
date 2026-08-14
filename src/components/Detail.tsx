import type { MacVod, PlayTree } from "../lib/types";

interface DetailProps {
  vod: MacVod;
  tree: PlayTree;
  selSource: number;
  selEp: number;
  loading: boolean;
  error: string;
  onBack: () => void;
  onSelectSource: (i: number) => void;
  onSelectEp: (i: number) => void;
  onStartWatch: () => void;
}

export default function Detail(props: DetailProps) {
  const src = props.tree.sources[props.selSource];
  const episodes = src ? src.episodes : [];
  return (
    <>
      <div className="topbar">
        <button className="btn ghost" onClick={props.onBack}>
          ‹ 返回
        </button>
        <span className="title">{props.vod.vod_name}</span>
      </div>
      {props.error ? <div className="error">{props.error}</div> : null}
      <div className="detail">
        <div className="detail-poster" style={props.vod.vod_pic ? { backgroundImage: `url(${props.vod.vod_pic})` } : undefined} />
        <div className="detail-main">
          <div className="detail-name">{props.vod.vod_name}</div>
          <div className="detail-meta">
            {[props.vod.vod_year, props.vod.vod_area, props.vod.vod_lang, props.vod.vod_remarks].filter(Boolean).join(" · ")}
          </div>
          {props.vod.vod_actor ? <div className="detail-meta">主演：{props.vod.vod_actor}</div> : null}
          {props.vod.vod_director ? <div className="detail-meta">导演：{props.vod.vod_director}</div> : null}
          {props.vod.vod_content ? <div className="detail-content">{props.vod.vod_content}</div> : null}
          {props.loading ? <div className="empty">加载中…</div> : null}
          {props.tree.sources.length > 1 ? (
            <div className="source-tabs">
              {props.tree.sources.map((s, i) => (
                <span key={i} className={"source-tab" + (i === props.selSource ? " active" : "")} onClick={() => props.onSelectSource(i)}>
                  {s.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="ep-list">
            {episodes.map((ep, i) => (
              <span key={i} className={"ep" + (i === props.selEp ? " active" : "")} onClick={() => props.onSelectEp(i)}>
                {ep.label}
              </span>
            ))}
          </div>
          <div className="detail-actions">
            <button className="btn primary" disabled={episodes.length === 0} onClick={props.onStartWatch}>
              开始一起看
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

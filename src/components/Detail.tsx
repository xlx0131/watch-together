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
  const tags = [props.vod.vod_year, props.vod.vod_area, props.vod.vod_lang, props.vod.type_name, props.vod.vod_remarks].filter(Boolean) as string[];

  return (
    <>
      <div className="topbar">
        <button className="btn ghost" onClick={props.onBack}>
          ‹ 返回
        </button>
      </div>
      {props.error ? <div className="error">{props.error}</div> : null}
      <div className="detail">
        {props.vod.vod_pic ? (
          <img className="detail-poster" src={props.vod.vod_pic} alt={props.vod.vod_name} />
        ) : (
          <div className="detail-poster detail-poster-empty">🎬</div>
        )}
        <div className="detail-main">
          <div className="detail-name">{props.vod.vod_name}</div>

          {tags.length > 0 ? (
            <div className="detail-tags">
              {tags.map((tg, i) => (
                <span key={i} className="detail-tag">
                  {tg}
                </span>
              ))}
            </div>
          ) : null}

          {props.vod.vod_actor ? (
            <div className="detail-line">
              <span className="detail-label">主演</span>
              {props.vod.vod_actor}
            </div>
          ) : null}
          {props.vod.vod_director ? (
            <div className="detail-line">
              <span className="detail-label">导演</span>
              {props.vod.vod_director}
            </div>
          ) : null}

          {props.vod.vod_content ? (
            <div className="detail-content">
              <span className="detail-label">简介</span>
              <div className="detail-content-text">{props.vod.vod_content}</div>
            </div>
          ) : null}

          {props.loading ? <div className="empty">加载中…</div> : null}

          {props.tree.sources.length > 1 ? (
            <div className="detail-section">
              <span className="detail-label">播放源</span>
              <div className="source-tabs">
                {props.tree.sources.map((s, i) => (
                  <span
                    key={i}
                    className={"source-tab" + (i === props.selSource ? " active" : "")}
                    onClick={() => props.onSelectSource(i)}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="detail-section">
            <span className="detail-label">选集</span>
            <div className="ep-list">
              {episodes.map((ep, i) => (
                <span key={i} className={"ep" + (i === props.selEp ? " active" : "")} onClick={() => props.onSelectEp(i)}>
                  {ep.label}
                </span>
              ))}
            </div>
          </div>

          <button className="btn primary detail-play" disabled={episodes.length === 0} onClick={props.onStartWatch}>
            ▶ 开始一起看
          </button>
        </div>
      </div>
    </>
  );
}

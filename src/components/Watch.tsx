import { useEffect, useRef } from "react";
import DPlayer from "dplayer";
import Hls from "hls.js";
import { isHlsUrl } from "../lib/play";
import type { Member, PlaySource } from "../lib/types";

interface WatchProps {
  vodName: string;
  playUrl: string;
  role: "host" | "guest";
  solo: boolean;
  members: Member[];
  sources: PlaySource[];
  selSource: number;
  selEp: number;
  notice: string;
  onPlayerReady: (dp: any | null) => void;
  onEvent: (type: "play" | "pause" | "seek", t: number) => void;
  onDanmaku: (text: string, color: string, type: string) => void;
  onSwitchSource: (i: number) => void;
  onSwitchEp: (i: number) => void;
  onShare: () => void;
  onLeave: () => void;
  pendingSync: () => { t: number; playing: boolean } | null;
}

export default function Watch(props: WatchProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const playUrl = props.playUrl;
    const isHls = isHlsUrl(playUrl);
    const isDirectVideo = /\.(mp4|webm|m4v|mov)(\?|$)/i.test(playUrl);

    // 防御兜底：既不是 hls 也不是直链视频（理论上已被 resolvePlayUrl 归一化，不会走到）
    if (!isHls && !isDirectVideo) {
      container.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.className = "iframe-full";
      iframe.src = playUrl;
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("allow", "autoplay; fullscreen; encrypted-media; picture-in-picture");
      container.appendChild(iframe);
      props.onPlayerReady(null);
      return () => {
        container.innerHTML = "";
      };
    }

    const dp: any = new DPlayer({
      container,
      autoplay: false,
      theme: "#3b82f6",
      lang: "zh-cn",
      screenshot: false,
      hotkey: true,
      video: isHls
        ? {
            url: playUrl,
            type: "customHls",
            customType: {
              customHls: (video: HTMLVideoElement) => {
                const hls = new Hls();
                let fellBack = false;
                hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
                  if (data && data.fatal && !fellBack) {
                    fellBack = true;
                    try {
                      hls.destroy();
                    } catch {
                      /* noop */
                    }
                    // 兜底：若 play.js 实际返回的是 mp4（非 m3u8），改原生播放
                    video.src = playUrl;
                  }
                });
                hls.loadSource(playUrl);
                hls.attachMedia(video);
              },
            },
          }
        : { url: playUrl, type: "normal" },
      danmaku: { id: "wt-" + Date.now(), api: "", addition: [] },
    } as any);

    props.onPlayerReady(dp);
    dp.on("play", () => props.onEvent("play", dp.video?.currentTime || 0));
    dp.on("pause", () => props.onEvent("pause", dp.video?.currentTime || 0));
    dp.on("seeked", () => props.onEvent("seek", dp.video?.currentTime || 0));
    dp.on("danmaku_send", (d: any) => props.onDanmaku(d.text, d.color, d.type));

    // 应用待同步状态（入房对齐 / 收到 sync-state）
    const sync = props.pendingSync();
    if (sync) {
      if (Number.isFinite(sync.t) && sync.t > 0) {
        try {
          dp.seek(sync.t);
        } catch {
          /* noop */
        }
      }
      if (sync.playing) {
        try {
          dp.play();
        } catch {
          /* noop */
        }
      }
    }

    return () => {
      props.onPlayerReady(null);
      try {
        dp.destroy();
      } catch {
        /* noop */
      }
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.playUrl]);

  const canControl = props.solo || props.role === "host";
  const showRoom = !props.solo;

  return (
    <div className="watch">
      <div className="watch-stage">
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div className="watch-side">
        <div className="side-head">
          <span className="side-title">{props.vodName}</span>
          <span className="role-tag">{props.solo ? "单人" : props.role === "host" ? "房主" : "观众"}</span>
        </div>
        {props.notice ? <div className="notice">{props.notice}</div> : null}
        {canControl ? (
          <div className="ctrl">
            {props.sources.length > 1 ? (
              <>
                <label>播放源</label>
                <select className="select" value={props.selSource} onChange={(e) => props.onSwitchSource(Number(e.target.value))}>
                  {props.sources.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <label>选集</label>
            <select className="select" value={props.selEp} onChange={(e) => props.onSwitchEp(Number(e.target.value))}>
              {(props.sources[props.selSource]?.episodes || []).map((ep, i) => (
                <option key={i} value={i}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {showRoom ? (
          <>
            <div className="side-head" style={{ borderTop: "1px solid var(--border)" }}>
              <span>在线成员（{props.members.length}）</span>
            </div>
            <div className="members">
              {props.members.length === 0 ? (
                <div className="empty">暂无成员</div>
              ) : (
                props.members.map((m) => (
                  <div className="member" key={m.key}>
                    <span className="member-dot" style={{ background: m.color || "#3b82f6" }} />
                    <span className="member-name">{m.nickname || "匿名"}</span>
                    <span className="member-role">{m.role === "host" ? "房主" : "观众"}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
        <div className="side-foot">
          {!props.solo && props.role === "host" ? (
            <button className="btn primary" onClick={props.onShare}>
              复制邀请链接
            </button>
          ) : null}
          <button className="btn" onClick={props.onLeave}>
            退出
          </button>
        </div>
      </div>
    </div>
  );
}

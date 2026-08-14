import { useCallback, useEffect, useRef, useState } from "react";
import "./app.css";
import { DEFAULT_SOURCE } from "./config";
import { macDetail, macList } from "./api/mac";
import { parsePlayUrl } from "./lib/parse";
import { resolvePlayUrl } from "./lib/play";
import { WatchRoom, genRoomId, isSupabaseConfigured } from "./lib/room";
import type { MacVod, Member, PlayTree, RoomMsg } from "./lib/types";
import Catalog from "./components/Catalog";
import Detail from "./components/Detail";
import Watch from "./components/Watch";

type Screen = "catalog" | "detail" | "watch";

interface MediaState {
  vodId: string;
  vodName: string;
  source: string;
  ep: number;
  playUrl: string;
}

const RANDOM_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];

function randomNickname(): string {
  return "观众" + Math.floor(1000 + Math.random() * 9000);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("catalog");
  const [sourceKey, setSourceKey] = useState(DEFAULT_SOURCE);
  const [wd, setWd] = useState("");
  const [list, setList] = useState<MacVod[]>([]);
  const [page, setPage] = useState(1);
  const [pagecount, setPagecount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [detail, setDetail] = useState<MacVod | null>(null);
  const [tree, setTree] = useState<PlayTree>({ sources: [] });
  const [selSource, setSelSource] = useState(0);
  const [selEp, setSelEp] = useState(0);

  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [role, setRole] = useState<"host" | "guest">("guest");
  const [solo, setSolo] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [media, setMedia] = useState<MediaState | null>(null);

  const [nickname] = useState(randomNickname);
  const [nicknameColor] = useState(() => RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]);

  const playerRef = useRef<any>(null);
  const roomRef = useRef<WatchRoom | null>(null);
  const roleRef = useRef<"host" | "guest">("guest");
  const mediaRef = useRef<MediaState | null>(null);
  const pendingSyncRef = useRef<{ t: number; playing: boolean } | null>(null);

  roomRef.current = room;
  roleRef.current = role;
  mediaRef.current = media;

  const syncState = useCallback(() => {
    const r = mediaRef.current;
    const dp = playerRef.current;
    if (!r || !roomRef.current) return;
    roomRef.current.send({
      kind: "sync-state",
      state: {
        vodId: r.vodId,
        vodName: r.vodName,
        source: r.source,
        ep: r.ep,
        playUrl: r.playUrl,
        playing: !!(dp && (dp as any).video && !(dp as any).video.paused),
        t: dp && (dp as any).video ? (dp as any).video.currentTime : 0,
      },
    });
  }, []);

  const handleMessage = useCallback(
    (msg: RoomMsg) => {
      if (msg.kind === "media") {
        setMedia({ vodId: msg.vodId, vodName: msg.vodName, source: msg.source, ep: msg.ep, playUrl: msg.playUrl });
      } else if (msg.kind === "play") {
        playerRef.current?.play();
      } else if (msg.kind === "pause") {
        playerRef.current?.pause();
      } else if (msg.kind === "seek") {
        try {
          playerRef.current?.seek(msg.t);
        } catch {
          /* noop */
        }
      } else if (msg.kind === "danmaku") {
        try {
          playerRef.current?.danmaku?.draw({ text: msg.text, color: msg.color, type: msg.type });
        } catch {
          /* noop */
        }
      } else if (msg.kind === "sync-request") {
        if (roleRef.current === "host") syncState();
      } else if (msg.kind === "sync-state") {
        const st = msg.state;
        if (!st) return;
        setMedia({ vodId: st.vodId, vodName: st.vodName, source: st.source, ep: st.ep, playUrl: st.playUrl });
        pendingSyncRef.current = { t: st.t, playing: st.playing };
      }
    },
    [syncState],
  );

  const createRoom = useCallback(
    (roomId: string, r: "host" | "guest") => {
      const rm = new WatchRoom(roomId, r, { onMessage: handleMessage, onMembers: setMembers });
      setRoom(rm);
      setRole(r);
      setMembers([]);
      return rm;
    },
    [handleMessage],
  );

  // 深链加入：?room=<id>
  useEffect(() => {
    const roomId = new URLSearchParams(window.location.search).get("room");
    if (!roomId) return;
    if (!isSupabaseConfigured()) {
      setError("Supabase 未配置（请在 src/config.ts 填写 URL 与 anon key）");
      return;
    }
    (async () => {
      try {
        const rm = createRoom(roomId, "guest");
        await rm.join({ nickname, color: nicknameColor });
        rm.send({ kind: "sync-request" });
        setScreen("watch");
      } catch (e) {
        setError(String((e as Error).message || e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadList = useCallback(
    async (pg: number, search?: string) => {
      setLoading(true);
      setError("");
      try {
        const data = await macList(sourceKey, { wd: search || undefined, pg });
        setList(data.list || []);
        setPage(data.page || 1);
        setPagecount(data.pagecount || 1);
      } catch (e) {
        setError(String((e as Error).message || e));
      } finally {
        setLoading(false);
      }
    },
    [sourceKey],
  );

  useEffect(() => {
    if (screen === "catalog") loadList(1);
  }, [screen, sourceKey, loadList]);

  const openDetail = useCallback(
    async (vod: MacVod) => {
      setDetail(vod);
      setTree({ sources: [] });
      setSelSource(0);
      setSelEp(0);
      setError("");
      setScreen("detail");
      try {
        const data = await macDetail(sourceKey, String(vod.vod_id));
        const item = (data.list && data.list[0]) || vod;
        setDetail(item);
        const t = parsePlayUrl(item.vod_play_url, item.vod_play_from);
        setTree(t);
        if (t.sources.length === 0) {
          setError("未解析出播放地址。vod_play_url=" + String(item.vod_play_url || "(空)").slice(0, 200));
        }
      } catch (e) {
        setError(String((e as Error).message || e));
        setTree(parsePlayUrl(vod.vod_play_url, vod.vod_play_from));
      }
    },
    [sourceKey],
  );

  const startWatch = useCallback(async () => {
    if (!detail) return;
    const src = tree.sources[selSource];
    if (!src || !src.episodes[selEp]) {
      setError("该片暂无可用播放源");
      return;
    }
    const ep = src.episodes[selEp];

    let rm: WatchRoom | null = null;
    let isSolo = false;
    if (isSupabaseConfigured()) {
      try {
        rm = createRoom(genRoomId(), "host");
        await rm.join({ nickname, color: nicknameColor });
      } catch (e) {
        setNotice("建房失败（" + String((e as Error).message || e) + "），当前为单人观看");
        rm = null;
        isSolo = true;
      }
    } else {
      isSolo = true;
      setNotice("未配置 Supabase，当前为单人观看（无法邀请他人）");
    }
    setSolo(isSolo);

    const m: MediaState = {
      vodId: String(detail.vod_id),
      vodName: detail.vod_name,
      source: src.name,
      ep: selEp,
      playUrl: resolvePlayUrl(ep.url),
    };
    setMedia(m);
    setScreen("watch");
    if (rm) {
      rm.send({ kind: "media", vodId: m.vodId, vodName: m.vodName, source: m.source, ep: m.ep, playUrl: m.playUrl });
      rm.send({ kind: "seek", t: 0 });
    }
  }, [detail, tree, selSource, selEp, nickname, nicknameColor, createRoom]);

  const onPlayerEvent = useCallback((type: "play" | "pause" | "seek", t: number) => {
    if (roleRef.current === "host" && roomRef.current) {
      roomRef.current.send({ kind: type, t });
    }
  }, []);

  const onDanmaku = useCallback(
    (text: string, color: string, type: string) => {
      const dp = playerRef.current;
      if (roomRef.current) {
        roomRef.current.send({
          kind: "danmaku",
          id: Date.now().toString(36),
          text,
          color,
          type: type as any,
          videoTime: dp && (dp as any).video ? (dp as any).video.currentTime : 0,
          author: nickname,
          ts: Date.now(),
        });
      }
    },
    [nickname],
  );

  const onSwitchEp = useCallback(
    (i: number) => {
      const src = tree.sources[selSource];
      const ep = src?.episodes[i];
      if (!ep) return;
      setSelEp(i);
      const m: MediaState = {
        vodId: media?.vodId || String(detail?.vod_id || ""),
        vodName: media?.vodName || detail?.vod_name || "",
        source: media?.source || src?.name || "",
        ep: i,
        playUrl: resolvePlayUrl(ep.url),
      };
      setMedia(m);
      if (roleRef.current === "host" && roomRef.current) {
        roomRef.current.send({ kind: "media", vodId: m.vodId, vodName: m.vodName, source: m.source, ep: i, playUrl: m.playUrl });
        roomRef.current.send({ kind: "seek", t: 0 });
      }
    },
    [tree, selSource, media, detail],
  );

  const onSwitchSource = useCallback(
    (i: number) => {
      const src = tree.sources[i];
      const ep = src?.episodes[0];
      if (!src || !ep) return;
      setSelSource(i);
      setSelEp(0);
      const m: MediaState = {
        vodId: media?.vodId || String(detail?.vod_id || ""),
        vodName: media?.vodName || detail?.vod_name || "",
        source: src.name,
        ep: 0,
        playUrl: resolvePlayUrl(ep.url),
      };
      setMedia(m);
      if (roleRef.current === "host" && roomRef.current) {
        roomRef.current.send({ kind: "media", vodId: m.vodId, vodName: m.vodName, source: src.name, ep: 0, playUrl: m.playUrl });
        roomRef.current.send({ kind: "seek", t: 0 });
      }
    },
    [tree, media, detail],
  );

  const onShare = useCallback(() => {
    const roomId = roomRef.current?.roomId;
    if (!roomId) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("room", roomId);
    const text = url.toString();
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => setNotice("邀请链接已复制，发给对方即可加入"))
        .catch(() => setNotice(text));
    } else {
      setNotice(text);
    }
  }, []);

  const onLeave = useCallback(() => {
    roomRef.current?.leave();
    setRoom(null);
    setMembers([]);
    setMedia(null);
    setSolo(false);
    setNotice("");
    setScreen("catalog");
  }, []);

  return (
    <div className="app">
      {screen === "catalog" ? (
        <Catalog
          sourceKey={sourceKey}
          list={list}
          loading={loading}
          error={error}
          page={page}
          pagecount={pagecount}
          onSourceChange={(k) => {
            setSourceKey(k);
            setWd("");
            setPage(1);
          }}
          onSearch={(kw) => {
            setWd(kw);
            loadList(1, kw);
          }}
          onPage={(pg) => loadList(pg, wd)}
          onOpenDetail={openDetail}
        />
      ) : screen === "detail" && detail ? (
        <Detail
          vod={detail}
          tree={tree}
          selSource={selSource}
          selEp={selEp}
          loading={false}
          error={error}
          onBack={() => setScreen("catalog")}
          onSelectSource={setSelSource}
          onSelectEp={setSelEp}
          onStartWatch={startWatch}
        />
      ) : media ? (
        <Watch
          vodName={media.vodName || "一起看"}
          playUrl={media.playUrl}
          role={role}
          solo={solo}
          members={members}
          sources={tree.sources}
          selSource={selSource}
          selEp={selEp}
          notice={notice}
          onPlayerReady={(dp) => {
            playerRef.current = dp;
          }}
          onEvent={onPlayerEvent}
          onDanmaku={onDanmaku}
          onSwitchSource={onSwitchSource}
          onSwitchEp={onSwitchEp}
          onShare={onShare}
          onLeave={onLeave}
          pendingSync={() => {
            const s = pendingSyncRef.current;
            pendingSyncRef.current = null;
            return s;
          }}
        />
      ) : null}
    </div>
  );
}

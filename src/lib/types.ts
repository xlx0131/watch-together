// maccms10 视频条目（字段对齐 maccms10 规范）
export interface MacVod {
  vod_id: number;
  vod_name: string;
  type_id?: number;
  type_name?: string;
  vod_en?: string;
  vod_time?: string;
  vod_remarks?: string;
  vod_play_from?: string;
  vod_pic?: string;
  vod_area?: string;
  vod_lang?: string;
  vod_year?: string;
  vod_actor?: string;
  vod_director?: string;
  vod_content?: string;
  vod_serial?: string;
  vod_play_url?: string;
}

export interface MacListResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: MacVod[];
}

export interface PlayEpisode {
  label: string;
  url: string;
}
export interface PlaySource {
  name: string;
  episodes: PlayEpisode[];
}
export interface PlayTree {
  sources: PlaySource[];
}

export type OutgoingMsg =
  | { kind: "media"; vodId: string; vodName: string; source: string; ep: number; playUrl: string }
  | { kind: "play"; t: number }
  | { kind: "pause"; t: number }
  | { kind: "seek"; t: number }
  | { kind: "danmaku"; id: string; text: string; color: string; type: "right" | "top" | "bottom"; videoTime: number; author: string; ts: number }
  | { kind: "sync-request" }
  | { kind: "sync-state"; state: RoomState };

export type RoomMsg = OutgoingMsg & { from: string };

export interface RoomState {
  vodId: string;
  vodName: string;
  source: string;
  ep: number;
  playUrl: string;
  playing: boolean;
  t: number;
}

export interface Member {
  key: string;
  nickname: string;
  color: string;
  role: "host" | "guest";
  joinedAt: number;
}

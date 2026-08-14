import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import type { Member, OutgoingMsg, RoomMsg } from "./types";

type Channel = ReturnType<SupabaseClient["channel"]>;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getClient(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured()) throw new Error("Supabase 未配置（请在 src/config.ts 填写 URL 与 anon key）");
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export function genRoomId(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(36)).join("").slice(0, 10);
}

function genUid(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface RoomHandlers {
  onMessage: (msg: RoomMsg) => void;
  onMembers: (members: Member[]) => void;
}

export class WatchRoom {
  readonly roomId: string;
  readonly role: "host" | "guest";
  readonly uid: string;
  private channel: Channel | null;

  constructor(roomId: string, role: "host" | "guest", handlers: RoomHandlers) {
    this.roomId = roomId;
    this.role = role;
    this.uid = genUid();
    const c = getClient();
    const channel = c.channel("watch:" + roomId, { config: { presence: { key: this.uid } } });
    this.channel = channel;

    channel.on("broadcast", { event: "*" }, ({ payload }: { payload: RoomMsg }) => {
      if (payload && payload.from !== this.uid) handlers.onMessage(payload);
    });

    const refresh = () => {
      if (!channel) return;
      const state = channel.presenceState() as Record<string, any[]>;
      const members: Member[] = [];
      Object.keys(state).forEach((key) => {
        const list = state[key];
        if (list && list.length) {
          const p = list[0];
          members.push({ key, nickname: p.nickname, color: p.color, role: p.role, joinedAt: p.joinedAt });
        }
      });
      members.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      handlers.onMembers(members);
    };
    channel.on("presence", { event: "sync" }, refresh);
    channel.on("presence", { event: "join" }, refresh);
    channel.on("presence", { event: "leave" }, refresh);
  }

  join(presence: { nickname: string; color: string }): Promise<void> {
    const channel = this.channel;
    if (!channel) return Promise.reject(new Error("频道未初始化"));
    return new Promise((resolve, reject) => {
      channel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ ...presence, role: this.role, joinedAt: Date.now() });
          } catch {
            /* presence 失败不阻断入房 */
          }
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error("连接房间失败: " + status));
        }
      });
    });
  }

  send(msg: OutgoingMsg) {
    if (!this.channel) return;
    const full = { ...msg, from: this.uid } as RoomMsg;
    this.channel.send({ type: "broadcast", event: full.kind, payload: full });
  }

  leave() {
    if (this.channel) {
      try {
        this.channel.untrack();
      } catch {
        /* noop */
      }
      if (client) {
        try {
          client.removeChannel(this.channel);
        } catch {
          /* noop */
        }
      }
      this.channel = null;
    }
  }
}

import { create } from "zustand";
import type {
  Difficulty,
  MissionCommand,
  MissionConfig,
  MissionView,
  ModuleId,
  ResourceKey,
} from "@lunar-ops/contracts";

export type Page = "overview" | "station" | "crew" | "journal";
export type Dialog =
  | { type: "help" }
  | { type: "restart" }
  | { type: "resource"; resource: ResourceKey }
  | { type: "crew"; crewId: string }
  | { type: "module"; moduleId: ModuleId }
  | null;
const sessionKey = "lunar-ops-session-v1";
class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Нет связи с центром управления. Проверьте, что API запущен, и повторите подключение.",
    );
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new ApiError(
      typeof error?.message === "string"
        ? error.message
        : "Сервер недоступен. Повторите подключение.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Не удалось выполнить запрос.";
function savedSession(): string | null {
  try {
    return localStorage.getItem(sessionKey);
  } catch {
    return null;
  }
}
function remember(id: string): void {
  try {
    localStorage.setItem(sessionKey, id);
  } catch {
    /* Session remains usable without storage. */
  }
}

interface MissionStore {
  config: MissionConfig | null;
  mission: MissionView | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  page: Page;
  dialog: Dialog;
  initialize: () => Promise<void>;
  start: (difficulty: Difficulty) => Promise<void>;
  send: (command: MissionCommand) => Promise<void>;
  navigate: (page: Page) => void;
  openDialog: (dialog: Dialog) => void;
  clearNotice: () => void;
}

export const useMission = create<MissionStore>((set, get) => ({
  config: null,
  mission: null,
  busy: false,
  error: null,
  notice: null,
  page: "overview",
  dialog: null,
  navigate: (page) => set({ page }),
  openDialog: (dialog) => set({ dialog }),
  clearNotice: () => set({ notice: null }),
  initialize: async () => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      const config = await request<MissionConfig>("/config");
      const id = savedSession();
      let mission: MissionView;
      if (id) {
        try {
          mission = await request<MissionView>(
            `/sessions/${encodeURIComponent(id)}`,
          );
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
          mission = await request<MissionView>("/sessions", {
            difficulty: "cadet",
          });
          set({
            notice:
              "Предыдущая сессия завершилась на сервере. Создана новая миссия.",
          });
        }
      } else
        mission = await request<MissionView>("/sessions", {
          difficulty: "cadet",
        });
      remember(mission.id);
      set({ config, mission });
    } catch (error) {
      set({ error: message(error) });
    } finally {
      set({ busy: false });
    }
  },
  start: async (difficulty) => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      const mission = await request<MissionView>("/sessions", { difficulty });
      remember(mission.id);
      set({
        mission,
        page: "overview",
        dialog: null,
        notice: "Новая экспедиция готова. Добро пожаловать на Луну.",
      });
    } catch (error) {
      set({ error: message(error) });
    } finally {
      set({ busy: false });
    }
  },
  send: async (command) => {
    const { mission, busy } = get();
    if (!mission || busy) return;
    set({ busy: true, error: null });
    try {
      const next = await request<MissionView>(
        `/sessions/${mission.id}/commands`,
        { revision: mission.revision, command },
      );
      set({
        mission: next,
        notice: next.log.at(-1)?.message ?? "Команда выполнена.",
      });
    } catch (error) {
      set({ error: message(error) });
      // A lost response may still have committed the command; reconcile without replaying it.
      try {
        set({ mission: await request<MissionView>(`/sessions/${mission.id}`) });
      } catch {
        /* Preserve the last confirmed state and error. */
      }
    } finally {
      set({ busy: false });
    }
  },
}));

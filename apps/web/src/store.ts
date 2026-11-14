import { create } from "zustand";
import { ApiError, request } from "./api";
import { currentPage, navigateTo, type Page } from "./navigation";
export type { Page } from "./navigation";
import type {
  Difficulty,
  MissionCommand,
  MissionConfig,
  MissionView,
  ModuleId,
  ResourceKey,
} from "@lunar-ops/contracts";

export type Dialog =
  | { type: "help" }
  | { type: "restart" }
  | { type: "resource"; resource: ResourceKey }
  | { type: "crew"; crewId: string }
  | { type: "module"; moduleId: ModuleId }
  | null;
const sessionKey = "lunar-ops-session-v1";
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Не вдалося виконати запит.";
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
  connection: "online" | "offline";
  error: string | null;
  notice: string | null;
  page: Page;
  dialog: Dialog;
  initialize: () => Promise<void>;
  start: (difficulty: Difficulty) => Promise<void>;
  send: (command: MissionCommand) => Promise<void>;
  navigate: (page: Page) => void;
  restorePage: () => void;
  openDialog: (dialog: Dialog) => void;
  clearNotice: () => void;
  clearError: () => void;
}

export const useMission = create<MissionStore>((set, get) => ({
  config: null,
  mission: null,
  busy: false,
  connection: "offline",
  error: null,
  notice: null,
  page: currentPage(),
  dialog: null,
  navigate: (page) => {
    navigateTo(page);
    set({ page, dialog: null });
  },
  restorePage: () => set({ page: currentPage(), dialog: null }),
  openDialog: (dialog) => set({ dialog }),
  clearNotice: () => set({ notice: null }),
  clearError: () => set({ error: null }),
  initialize: async () => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      const config = await request<MissionConfig>("/config");
      // Keep the active session even when browser storage is unavailable.
      const id = get().mission?.id ?? savedSession();
      let mission: MissionView;
      if (id) {
        try {
          mission = await request<MissionView>(
            `/sessions/${encodeURIComponent(id)}`,
          );
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
          mission = await request<MissionView>("/sessions", {
            difficulty: get().mission?.difficulty ?? "cadet",
          });
          set({
            notice:
              "Попередня сесія завершилася на сервері. Створено нову місію.",
          });
        }
      } else
        mission = await request<MissionView>("/sessions", {
          difficulty: "cadet",
        });
      remember(mission.id);
      set({ config, mission, connection: "online" });
    } catch (error) {
      set({ error: message(error), connection: "offline" });
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
      navigateTo("overview");
      set({
        mission,
        connection: "online",
        page: "overview",
        dialog: null,
        notice: "Нова експедиція готова. Вітаємо на Місяці.",
      });
    } catch (error) {
      set({ error: message(error), connection: "offline" });
    } finally {
      set({ busy: false });
    }
  },
  send: async (command) => {
    const { mission, busy, connection } = get();
    if (!mission || busy || connection !== "online") return;
    set({ busy: true, error: null, notice: null });
    try {
      const next = await request<MissionView>(
        `/sessions/${mission.id}/commands`,
        { revision: mission.revision, command },
      );
      set({
        mission: next,
        connection: "online",
        notice: next.log.at(-1)?.message ?? "Команду виконано.",
      });
    } catch (error) {
      set({ error: message(error), connection: "offline" });
      // A lost response may still have committed the command; reconcile without replaying it.
      try {
        const latest = await request<MissionView>(`/sessions/${mission.id}`);
        const uncertainResponse =
          !(error instanceof ApiError) || error.status >= 500;
        set({
          mission: latest,
          connection: "online",
          ...(uncertainResponse && latest.revision > mission.revision
            ? {
                error: null,
                notice:
                  "Зв’язок відновлено. Стан місії оновлено — результат доступний у журналі.",
              }
            : {}),
        });
      } catch {
        /* Preserve the last confirmed state and error. */
      }
    } finally {
      set({ busy: false });
    }
  },
}));

export const commandsBlocked = (state: MissionStore): boolean =>
  state.busy || state.connection !== "online";

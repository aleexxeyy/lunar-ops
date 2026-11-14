import { z } from "zod";

export const resourceKeys = ["energy", "oxygen", "water", "morale"] as const;
export type ResourceKey = (typeof resourceKeys)[number];
export type Resources = Record<ResourceKey, number>;
export const difficultySchema = z.enum(["cadet", "commander"]);
export type Difficulty = z.infer<typeof difficultySchema>;
export const actionIdSchema = z.enum(["research", "oxygen", "water", "rest"]);
export type ActionId = z.infer<typeof actionIdSchema>;
export const moduleIdSchema = z.enum([
  "solar",
  "recycler",
  "greenhouse",
  "laboratory",
]);
export type ModuleId = z.infer<typeof moduleIdSchema>;
export const roleSchema = z.enum(["engineer", "scientist", "medic"]);
export type CrewRole = z.infer<typeof roleSchema>;

export const createSessionSchema = z
  .object({ difficulty: difficultySchema })
  .strict();
export const commandSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    command: z.discriminatedUnion("type", [
      z.object({ type: z.literal("advance") }).strict(),
      z
        .object({ type: z.literal("action"), actionId: actionIdSchema })
        .strict(),
      z
        .object({ type: z.literal("upgrade"), moduleId: moduleIdSchema })
        .strict(),
      z
        .object({
          type: z.literal("assign"),
          crewId: z.string().min(1).max(40),
          role: roleSchema,
        })
        .strict(),
      z
        .object({
          type: z.literal("resolve"),
          choiceId: z.string().min(1).max(40),
        })
        .strict(),
    ]),
  })
  .strict();
export type CommandRequest = z.infer<typeof commandSchema>;
export type MissionCommand = CommandRequest["command"];
export interface Effect {
  resources?: Partial<Resources>;
  science?: number;
  parts?: number;
  health?: number;
}
export interface ActionDefinition {
  id: ActionId;
  name: string;
  description: string;
  effect: Effect;
}
export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  code: string;
  description: string;
  production: Partial<Resources>;
  science: number;
}
export interface EventChoice {
  id: string;
  label: string;
  explanation: string;
  effect: Effect;
}
export interface MissionEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  lesson: string;
  choices: EventChoice[];
}
export interface CrewMember {
  id: string;
  name: string;
  callsign: string;
  role: CrewRole;
  health: number;
}
export interface LogEntry {
  id: number;
  day: number;
  kind: "system" | "action" | "event";
  message: string;
}
export interface TelemetryPoint extends Resources {
  day: number;
  science: number;
}
export interface MissionState {
  id: string;
  revision: number;
  difficulty: Difficulty;
  day: number;
  completedDays: number;
  status: "active" | "won" | "lost";
  outcome: string | null;
  resources: Resources;
  science: number;
  parts: number;
  actionsRemaining: number;
  usedActions: ActionId[];
  modules: Record<ModuleId, number>;
  crew: CrewMember[];
  pendingEvent: MissionEvent | null;
  history: TelemetryPoint[];
  log: LogEntry[];
}
export interface Availability {
  available: boolean;
  reason: string | null;
}
export interface MissionView extends MissionState {
  actionEffects: Record<ActionId, Effect>;
  availableActions: Record<ActionId, Availability>;
  upgrades: Record<ModuleId, Availability & { cost: number }>;
  eventChoices: Record<string, Availability>;
  canAdvance: Availability;
  canAssign: Availability;
  forecast: Resources;
}
export interface MissionConfig {
  duration: number;
  scienceTarget: number;
  actionsPerDay: number;
  resourceCap: number;
  initialResources: Resources;
  initialParts: number;
  initialHealth: number;
  dailyConsumption: Resources;
  difficulties: Record<
    Difficulty,
    { name: string; description: string; consumptionMultiplier: number }
  >;
  actions: ActionDefinition[];
  modules: ModuleDefinition[];
  roles: Record<
    CrewRole,
    { name: string; description: string; effect: Effect }
  >;
  crew: Omit<CrewMember, "health">[];
  events: MissionEvent[];
  upgrade: {
    baseCost: number;
    costPerLevel: number;
    energyCost: number;
    maxLevel: number;
  };
  criticalThreshold: number;
  criticalHealthLoss: number;
  researchBonusPerLabLevel: number;
}

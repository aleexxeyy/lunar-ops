import { resourceKeys } from "@lunar-ops/contracts";
import type {
  Availability,
  Difficulty,
  Effect,
  MissionCommand,
  MissionState,
  MissionView,
  ModuleId,
  Resources,
} from "@lunar-ops/contracts";
import { missionConfig as config } from "@lunar-ops/game-config";

export class MissionError extends Error {}
const clamp = (value: number) =>
  Math.max(0, Math.min(config.resourceCap, value));
const allowed: Availability = { available: true, reason: null };
const denied = (reason: string): Availability => ({ available: false, reason });

export function createMission(
  id: string,
  difficulty: Difficulty,
): MissionState {
  return {
    id,
    revision: 0,
    difficulty,
    day: 1,
    completedDays: 0,
    status: "active",
    outcome: null,
    resources: { ...config.initialResources },
    science: 0,
    parts: config.initialParts,
    actionsRemaining: config.actionsPerDay,
    usedActions: [],
    modules: { solar: 1, recycler: 1, greenhouse: 1, laboratory: 1 },
    crew: config.crew.map((member) => ({
      ...member,
      health: config.initialHealth,
    })),
    pendingEvent: null,
    history: [{ day: 0, ...config.initialResources, science: 0 }],
    log: [
      {
        id: 1,
        day: 1,
        kind: "system",
        message:
          "Посадка выполнена. База «Горизонт» в сети. Командование передано вам.",
      },
    ],
  };
}

function operational(state: MissionState): Availability {
  if (state.status !== "active")
    return denied("Миссия завершена. Начните новую экспедицию.");
  if (state.pendingEvent)
    return denied("Сначала примите решение по текущему событию.");
  return allowed;
}

function affordable(state: MissionState, effect: Effect): Availability {
  if (effect.parts && state.parts + effect.parts < 0)
    return denied("Недостаточно запасных деталей.");
  for (const key of resourceKeys) {
    const change = effect.resources?.[key] ?? 0;
    if (change < 0 && state.resources[key] + change <= 0)
      return denied("Недостаточно ресурсов для безопасного выполнения.");
  }
  return allowed;
}

function actionSlot(state: MissionState): Availability {
  const ready = operational(state);
  if (!ready.available) return ready;
  return state.actionsRemaining > 0
    ? allowed
    : denied("Все операции на сегодня выполнены. Завершите день.");
}

function upgradeCost(state: MissionState, id: ModuleId): number {
  return (
    config.upgrade.baseCost +
    (state.modules[id] - 1) * config.upgrade.costPerLevel
  );
}

export function dailyForecast(state: MissionState): Resources {
  const multiplier =
    config.difficulties[state.difficulty].consumptionMultiplier;
  const delta: Resources = { energy: 0, oxygen: 0, water: 0, morale: 0 };
  for (const key of resourceKeys) {
    delta[key] = -Math.ceil(config.dailyConsumption[key] * multiplier);
    for (const module of config.modules)
      delta[key] += (module.production[key] ?? 0) * state.modules[module.id];
    for (const crew of state.crew)
      delta[key] += config.roles[crew.role].effect.resources?.[key] ?? 0;
  }
  return delta;
}

export function getMissionView(state: MissionState): MissionView {
  const slot = actionSlot(state);
  const availableActions = Object.fromEntries(
    config.actions.map((action) => [
      action.id,
      !slot.available
        ? slot
        : state.usedActions.includes(action.id)
          ? denied("Эта операция уже выполнена сегодня.")
          : affordable(state, action.effect),
    ]),
  ) as MissionView["availableActions"];
  const upgrades = Object.fromEntries(
    config.modules.map(({ id }) => {
      const cost = upgradeCost(state, id);
      const availability = !slot.available
        ? slot
        : state.modules[id] >= config.upgrade.maxLevel
          ? denied("Достигнут максимальный уровень.")
          : affordable(state, {
              parts: -cost,
              resources: { energy: -config.upgrade.energyCost },
            });
      return [id, { ...availability, cost }];
    }),
  ) as MissionView["upgrades"];
  return {
    ...state,
    availableActions,
    upgrades,
    actionEffects: Object.fromEntries(
      config.actions.map((action) => [
        action.id,
        {
          ...action.effect,
          ...(action.id === "research"
            ? {
                science:
                  (action.effect.science ?? 0) +
                  (state.modules.laboratory - 1) *
                    config.researchBonusPerLabLevel,
              }
            : {}),
        },
      ]),
    ) as MissionView["actionEffects"],
    eventChoices: Object.fromEntries(
      (state.pendingEvent?.choices ?? []).map((choice) => [
        choice.id,
        affordable(state, choice.effect),
      ]),
    ),
    canAdvance: operational(state),
    canAssign: operational(state),
    forecast: dailyForecast(state),
  };
}

function applyEffect(state: MissionState, effect: Effect): void {
  for (const key of resourceKeys)
    state.resources[key] = clamp(
      state.resources[key] + (effect.resources?.[key] ?? 0),
    );
  state.science = Math.max(0, state.science + (effect.science ?? 0));
  state.parts = Math.max(0, state.parts + (effect.parts ?? 0));
  for (const crew of state.crew)
    crew.health = clamp(crew.health + (effect.health ?? 0));
}

function log(
  state: MissionState,
  kind: MissionState["log"][number]["kind"],
  message: string,
): void {
  state.log.push({
    id: (state.log.at(-1)?.id ?? 0) + 1,
    day: state.day,
    kind,
    message,
  });
}

function requireAvailable(availability: Availability): void {
  if (!availability.available)
    throw new MissionError(availability.reason ?? "Команда недоступна.");
}

function finishIfNeeded(state: MissionState): void {
  if (
    resourceKeys.some((key) => state.resources[key] <= 0) ||
    state.crew.some((crew) => crew.health <= 0)
  ) {
    state.status = "lost";
    state.outcome =
      "Критический запас или здоровье экипажа исчерпаны. Экспедиция досрочно эвакуирована.";
  } else if (state.completedDays >= config.duration) {
    state.status = state.science >= config.scienceTarget ? "won" : "lost";
    state.outcome =
      state.status === "won"
        ? "Экипаж в безопасности, научная программа выполнена. Отличная работа, командир!"
        : "Экипаж вернулся на Землю, но научная цель не достигнута. В следующем полёте выделите больше времени исследованиям.";
  }
  if (state.status !== "active") {
    state.pendingEvent = null;
    log(state, "system", state.outcome!);
  }
}

export function executeCommand(
  previous: MissionState,
  command: MissionCommand,
): MissionState {
  const view = getMissionView(previous);
  const state: MissionState = {
    ...previous,
    resources: { ...previous.resources },
    modules: { ...previous.modules },
    crew: previous.crew.map((member) => ({ ...member })),
    usedActions: [...previous.usedActions],
    history: [...previous.history],
    log: [...previous.log],
  };
  switch (command.type) {
    case "action": {
      requireAvailable(view.availableActions[command.actionId]);
      const action = config.actions.find(({ id }) => id === command.actionId)!;
      applyEffect(state, view.actionEffects[action.id]);
      state.usedActions.push(action.id);
      state.actionsRemaining -= 1;
      log(state, "action", `Операция выполнена: ${action.name}.`);
      break;
    }
    case "upgrade": {
      requireAvailable(view.upgrades[command.moduleId]);
      applyEffect(state, {
        parts: -view.upgrades[command.moduleId].cost,
        resources: { energy: -config.upgrade.energyCost },
      });
      state.modules[command.moduleId] += 1;
      state.actionsRemaining -= 1;
      log(
        state,
        "action",
        `${config.modules.find(({ id }) => id === command.moduleId)!.name}: уровень ${state.modules[command.moduleId]}.`,
      );
      break;
    }
    case "assign": {
      requireAvailable(view.canAssign);
      const member = state.crew.find(({ id }) => id === command.crewId);
      if (!member) throw new MissionError("Участник экипажа не найден.");
      if (member.role === command.role)
        throw new MissionError("Эта роль уже назначена.");
      member.role = command.role;
      log(
        state,
        "action",
        `${member.callsign}: назначение «${config.roles[command.role].name}».`,
      );
      break;
    }
    case "resolve": {
      if (state.status !== "active" || !state.pendingEvent)
        throw new MissionError("Нет активного события.");
      const event = state.pendingEvent;
      const choice = event.choices.find(({ id }) => id === command.choiceId);
      if (!choice) throw new MissionError("Неизвестное решение.");
      requireAvailable(affordable(state, choice.effect));
      applyEffect(state, choice.effect);
      state.pendingEvent = null;
      log(state, "event", `${event.title}: ${choice.label}. ${event.lesson}`);
      break;
    }
    case "advance": {
      requireAvailable(view.canAdvance);
      applyEffect(state, { resources: dailyForecast(state) });
      for (const module of config.modules)
        state.science += module.science * state.modules[module.id];
      for (const crew of state.crew) {
        const effect = config.roles[crew.role].effect;
        applyEffect(state, {
          science: effect.science ?? 0,
          health: effect.health ?? 0,
        });
      }
      if (
        resourceKeys.some(
          (key) => state.resources[key] < config.criticalThreshold,
        )
      )
        applyEffect(state, { health: -config.criticalHealthLoss });
      state.completedDays += 1;
      state.history.push({
        day: state.completedDays,
        ...state.resources,
        science: state.science,
      });
      log(
        state,
        "system",
        `День ${state.day} завершён. Телеметрия сохранена, научные данные: ${state.science}.`,
      );
      finishIfNeeded(state);
      if (state.status === "active") {
        state.day += 1;
        state.actionsRemaining = config.actionsPerDay;
        state.usedActions = [];
        state.pendingEvent =
          config.events.find((event) => event.day === state.day) ?? null;
        if (state.pendingEvent)
          log(
            state,
            "event",
            `Требуется решение: ${state.pendingEvent.title}.`,
          );
      }
      break;
    }
  }
  state.revision += 1;
  return state;
}

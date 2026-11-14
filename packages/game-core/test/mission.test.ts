import { describe, expect, it } from "vitest";
import { missionConfig as config } from "@lunar-ops/game-config";
import {
  createMission,
  dailyForecast,
  executeCommand,
  getMissionView,
} from "../src/index.js";
import type { MissionState } from "@lunar-ops/contracts";

const fresh = () => createMission("test", "cadet");
const advance = (state: MissionState) =>
  executeCommand(state, { type: "advance" });
describe("mission simulation", () => {
  it("rejects resource operations that cannot restore anything", () => {
    const state = fresh();
    state.resources.water = 100;
    const snapshot = JSON.stringify(state);
    expect(getMissionView(state).availableActions.water.available).toBe(false);
    expect(() =>
      executeCommand(state, { type: "action", actionId: "water" }),
    ).toThrow("Відновлення не потрібне");
    expect(JSON.stringify(state)).toBe(snapshot);
  });
  it("allows rest with full morale when a crew member still needs healing", () => {
    const state = fresh();
    state.resources.morale = 100;
    expect(getMissionView(state).availableActions.rest.available).toBe(false);
    state.crew[0]!.health = 50;
    expect(getMissionView(state).availableActions.rest.available).toBe(true);
    expect(
      executeCommand(state, { type: "action", actionId: "rest" }).crew[0]!
        .health,
    ).toBe(62);
  });
  it.each(config.modules)(
    "upgrades $id and updates its production",
    (module) => {
      const state = fresh();
      const next = executeCommand(state, {
        type: "upgrade",
        moduleId: module.id,
      });
      expect(next.modules[module.id]).toBe(2);
      expect(next.parts).toBe(state.parts - config.upgrade.baseCost);
      for (const [key, amount] of Object.entries(module.production)) {
        expect(next.resources).toBeDefined();
        expect(
          dailyForecast(next)[key as keyof typeof next.resources] -
            dailyForecast(state)[key as keyof typeof state.resources],
        ).toBe(amount);
      }
    },
  );
  it.each(
    config.events.flatMap((event) =>
      event.choices.map((choice) => ({ event, choice })),
    ),
  )("resolves $event.id / $choice.id exactly once", ({ event, choice }) => {
    const state = fresh();
    state.pendingEvent = event;
    state.day = event.day;
    state.science = 40;
    const next = executeCommand(state, {
      type: "resolve",
      choiceId: choice.id,
    });
    expect(next.science).toBe(40 + (choice.effect.science ?? 0));
    expect(next.parts).toBe(state.parts + (choice.effect.parts ?? 0));
    for (const [key, change] of Object.entries(choice.effect.resources ?? {})) {
      const resource = key as keyof typeof state.resources;
      expect(next.resources[resource]).toBe(
        Math.min(config.resourceCap, state.resources[resource] + change),
      );
    }
    expect(next.pendingEvent).toBeNull();
    expect(next.actionsRemaining).toBe(state.actionsRemaining);
    expect(() =>
      executeCommand(next, { type: "resolve", choiceId: choice.id }),
    ).toThrow("Немає активної події");
  });
  it("is deterministic and does not mutate the previous state", () => {
    const initial = fresh();
    const snapshot = JSON.stringify(initial);
    const command = { type: "action", actionId: "research" } as const;
    expect(executeCommand(initial, command)).toEqual(
      executeCommand(initial, command),
    );
    expect(JSON.stringify(initial)).toBe(snapshot);
    expect(executeCommand(initial, command).science).toBe(18);
  });
  it("keeps independent sessions isolated", () => {
    const a = fresh();
    const b = fresh();
    a.resources.energy = 1;
    a.crew[0]!.health = 1;
    expect(b.resources.energy).toBe(90);
    expect(b.crew[0]!.health).toBe(100);
  });
  it("enforces the daily operation budget and once-per-day action rule", () => {
    const one = executeCommand(fresh(), { type: "action", actionId: "water" });
    expect(() =>
      executeCommand(one, { type: "action", actionId: "water" }),
    ).toThrow("вже виконано");
    const two = executeCommand(one, { type: "action", actionId: "rest" });
    expect(() =>
      executeCommand(two, { type: "upgrade", moduleId: "solar" }),
    ).toThrow("Усі операції");
  });
  it("prevents overspending resources and parts", () => {
    const state = fresh();
    state.resources.energy = 12;
    expect(() =>
      executeCommand(state, { type: "action", actionId: "research" }),
    ).toThrow("Недостатньо");
    state.parts = 0;
    expect(() =>
      executeCommand(state, { type: "upgrade", moduleId: "solar" }),
    ).toThrow("деталей");
  });
  it("caps replenishment at 100", () => {
    expect(
      executeCommand(fresh(), { type: "action", actionId: "water" }).resources
        .water,
    ).toBe(100);
  });
  it("shows and applies the laboratory research bonus consistently", () => {
    const state = executeCommand(fresh(), {
      type: "upgrade",
      moduleId: "laboratory",
    });
    expect(getMissionView(state).actionEffects.research.science).toBe(24);
    expect(
      executeCommand(state, { type: "action", actionId: "research" }).science,
    ).toBe(24);
  });
  it("charges upgrades and reflects production in the forecast", () => {
    const initial = fresh();
    const upgraded = executeCommand(initial, {
      type: "upgrade",
      moduleId: "solar",
    });
    expect(upgraded.parts).toBe(52);
    expect(upgraded.resources.energy).toBe(85);
    expect(dailyForecast(upgraded).energy - dailyForecast(initial).energy).toBe(
      9,
    );
    const max = executeCommand(upgraded, {
      type: "upgrade",
      moduleId: "solar",
    });
    expect(max.modules.solar).toBe(3);
    max.actionsRemaining = 2;
    expect(getMissionView(max).upgrades.solar.available).toBe(false);
  });
  it("requires an event decision before any ordinary command", () => {
    const state = advance(fresh());
    expect(state.pendingEvent?.id).toBe("solar-storm");
    expect(() => advance(state)).toThrow("Спочатку");
    expect(() =>
      executeCommand(state, { type: "action", actionId: "rest" }),
    ).toThrow("Спочатку");
    expect(() =>
      executeCommand(state, { type: "assign", crewId: "nova", role: "medic" }),
    ).toThrow("Спочатку");
    const resolved = executeCommand(state, {
      type: "resolve",
      choiceId: "shelter",
    });
    expect(resolved.pendingEvent).toBeNull();
    expect(resolved.log.at(-1)?.message).toContain("магнітного поля");
    expect(() =>
      executeCommand(resolved, { type: "resolve", choiceId: "shelter" }),
    ).toThrow("Немає активної");
  });
  it("rejects unknown crew and event choices", () => {
    expect(() =>
      executeCommand(fresh(), {
        type: "assign",
        crewId: "unknown",
        role: "medic",
      }),
    ).toThrow("не знайдено");
    expect(() =>
      executeCommand(advance(fresh()), {
        type: "resolve",
        choiceId: "unknown",
      }),
    ).toThrow("Невідоме");
  });
  it("applies crew role bonuses only at the end of a day", () => {
    const initial = fresh();
    const assigned = executeCommand(initial, {
      type: "assign",
      crewId: "nova",
      role: "scientist",
    });
    expect(assigned.actionsRemaining).toBe(config.actionsPerDay);
    expect(assigned.science).toBe(0);
    expect(advance(assigned).science).toBe(8);
  });
  it("increases consumption for commander difficulty", () => {
    expect(
      dailyForecast(createMission("hard", "commander")).water,
    ).toBeLessThan(dailyForecast(fresh()).water);
  });
  it("records daily snapshots and resets action availability", () => {
    const next = advance(
      executeCommand(fresh(), { type: "action", actionId: "research" }),
    );
    expect(next.history).toHaveLength(2);
    expect(next.history[1]?.energy).toBe(next.resources.energy);
    expect(next.usedActions).toEqual([]);
    expect(next.actionsRemaining).toBe(config.actionsPerDay);
  });
  it("evacuates the crew on depleted resources and locks further commands", () => {
    const state = fresh();
    state.resources.oxygen = 1;
    const lost = advance(state);
    expect(lost.status).toBe("lost");
    expect(lost.pendingEvent).toBeNull();
    expect(() => advance(lost)).toThrow("Місію завершено");
  });
  it("damages crew health when resources are critical", () => {
    const state = fresh();
    state.resources.oxygen = 25;
    const next = advance(state);
    expect(next.resources.oxygen).toBe(16);
    expect(next.crew.every((member) => member.health === 85)).toBe(true);
  });
  it("supports a complete winning expedition without altering game state directly", () => {
    let state = executeCommand(fresh(), { type: "upgrade", moduleId: "solar" });
    state = executeCommand(state, { type: "action", actionId: "research" });
    while (state.status === "active") {
      if (state.pendingEvent)
        state = executeCommand(state, {
          type: "resolve",
          choiceId: state.pendingEvent.choices.at(-1)!.id,
        });
      if (
        state.resources.water < 60 &&
        getMissionView(state).availableActions.water.available
      )
        state = executeCommand(state, { type: "action", actionId: "water" });
      if (
        state.resources.oxygen < 60 &&
        getMissionView(state).availableActions.oxygen.available
      )
        state = executeCommand(state, { type: "action", actionId: "oxygen" });
      if (
        state.science < config.scienceTarget &&
        getMissionView(state).availableActions.research.available
      )
        state = executeCommand(state, { type: "action", actionId: "research" });
      state = advance(state);
    }
    expect(state.status).toBe("won");
    expect(state.completedDays).toBe(config.duration);
    expect(state.history).toHaveLength(config.duration + 1);
    expect(state.crew.every((member) => member.health > 0)).toBe(true);
  });
  it("does not award a victory with insufficient science", () => {
    let state = fresh();
    state.completedDays = config.duration - 1;
    state.day = config.duration;
    expect(advance(state).status).toBe("lost");
  });
});

import { useState } from "react";
import type { Effect, ResourceKey } from "@lunar-ops/contracts";
import { commandsBlocked, useMission } from "../store";
import { Icon, type IconName } from "./Icon";
import { resourceLabels } from "./Telemetry";

export function EffectBadges({ effect }: { effect: Effect }) {
  return (
    <span className="effect-badges">
      {Object.entries(effect.resources ?? {}).map(([key, value]) => (
        <span className={value < 0 ? "cost" : "gain"} key={key}>
          <Icon name={key as ResourceKey} size={12} />
          {value > 0 ? "+" : ""}
          {value}
        </span>
      ))}
      {effect.science !== undefined && (
        <span className={effect.science > 0 ? "gain" : "cost"}>
          <Icon name="science" size={12} />
          {effect.science > 0 ? "+" : ""}
          {effect.science}
        </span>
      )}
      {effect.parts !== undefined && (
        <span className="cost">
          <Icon name="parts" size={12} />
          {effect.parts}
        </span>
      )}
      {effect.health !== undefined && (
        <span className="gain">ОЗ +{effect.health}</span>
      )}
    </span>
  );
}
export function ResourceCards() {
  const { mission, config, openDialog } = useMission();
  if (!mission || !config) return null;
  return (
    <div className="resource-grid">
      {(Object.keys(resourceLabels) as ResourceKey[]).map((key) => {
        const meta = resourceLabels[key];
        const critical = mission.resources[key] < config.criticalThreshold;
        return (
          <button
            key={key}
            className={`resource-card ${critical ? "critical" : ""}`}
            onClick={() => openDialog({ type: "resource", resource: key })}
            aria-label={`${meta.name}: ${mission.resources[key]}%. Відкрити телеметрію`}
          >
            <div className="resource-title">
              <span>
                <Icon name={key} style={{ color: meta.color }} />
                {meta.name}
              </span>
              <span className="micro">
                {meta.code}
                <Icon name="arrowUp" size={12} />
              </span>
            </div>
            <div className="resource-value">
              {mission.resources[key]}
              <span>%</span>
              <small className={critical ? "text-danger" : ""}>
                {critical ? "КРИТИЧНО" : "ЗАПАС"}
              </small>
            </div>
            <div className="meter">
              <span
                style={{
                  width: `${mission.resources[key]}%`,
                  background: meta.color,
                }}
              />
            </div>
            <div className="resource-bottom">
              <span>
                {mission.forecast[key] > 0 ? "+" : ""}
                {mission.forecast[key]} / день
              </span>
              <span>
                {critical ? "Потребує уваги" : "Телеметрія"}
                <Icon name="chevron" size={12} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
export function MissionBrief() {
  const { mission, config, send } = useMission();
  const blocked = useMission(commandsBlocked);
  if (!mission || !config) return null;
  const event = mission.pendingEvent;
  return (
    <section className={`panel brief-panel ${event ? "event-panel" : ""}`}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {event ? "ТЕРМІНОВЕ ПОВІДОМЛЕННЯ" : "ПРОТОКОЛ МІСІЇ"}
          </span>
          <h2>{event ? "Вхідний сигнал" : "Завдання експедиції"}</h2>
        </div>
        <Icon name={event ? "warning" : "target"} size={23} />
      </div>
      {event ? (
        <div className="event-content">
          <span className="event-label">
            ПОТРІБНЕ РІШЕННЯ · ДЕНЬ {mission.day}
          </span>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <div className="event-choices">
            {event.choices.map((choice) => (
              <button
                className="event-choice"
                disabled={
                  blocked || !mission.eventChoices[choice.id]?.available
                }
                onClick={() =>
                  void send({ type: "resolve", choiceId: choice.id })
                }
                key={choice.id}
              >
                <strong>
                  {choice.label}
                  <Icon name="arrow" size={16} />
                </strong>
                <span>{choice.explanation}</span>
                <EffectBadges effect={choice.effect} />
                {!mission.eventChoices[choice.id]?.available && (
                  <small>{mission.eventChoices[choice.id]?.reason}</small>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="brief-title">
            <span className="mission-number">
              01<span>/ МІСЯЧНА ЕКСПЕДИЦІЯ</span>
            </span>
            <h3>
              Побудувати майбутнє.
              <br />
              <span>Зберегти екіпаж.</span>
            </h3>
            <p>
              Протримайтеся {config.duration} днів на Місяці та здобудьте{" "}
              {config.scienceTarget} наукових балів. Ресурси обмежені. Рішення —
              за вами.
            </p>
          </div>
          <div className="objective">
            <div>
              <span>
                <Icon name="science" size={16} />
                Наукові дані
              </span>
              <strong>
                {mission.science}
                <small> / {config.scienceTarget}</small>
              </strong>
            </div>
            <div className="meter">
              <span
                style={{
                  width: `${Math.min(100, (mission.science / config.scienceTarget) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="objective">
            <div>
              <span>
                <Icon name="clock" size={16} />
                Минуло днів
              </span>
              <strong>
                {mission.completedDays}
                <small> / {config.duration}</small>
              </strong>
            </div>
            <div className="day-segments">
              {Array.from({ length: config.duration }, (_, i) => (
                <span
                  key={i}
                  className={i < mission.completedDays ? "done" : ""}
                />
              ))}
            </div>
          </div>
          <div className="brief-note">
            <Icon name="signal" size={16} />
            <span>Стежте за прогнозом споживання перед завершенням дня.</span>
          </div>
        </>
      )}
    </section>
  );
}
const actionIcons: Record<string, IconName> = {
  research: "science",
  oxygen: "repair",
  water: "water",
  rest: "moon",
};
export function Operations() {
  const { mission, config, send } = useMission();
  const blocked = useMission(commandsBlocked);
  if (!mission || !config) return null;
  return (
    <section className="panel operations-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ЧЕРГА КОМАНД</span>
          <h2>Операції</h2>
        </div>
        <span className="count-badge">
          {mission.actionsRemaining} / {config.actionsPerDay} ДОСТУПНО
        </span>
      </div>
      <div className="operations-grid">
        {config.actions.map((action) => (
          <button
            key={action.id}
            disabled={blocked || !mission.availableActions[action.id].available}
            className="operation"
            onClick={() => void send({ type: "action", actionId: action.id })}
            title={
              mission.availableActions[action.id].reason ?? action.description
            }
          >
            <span className="operation-icon">
              <Icon name={actionIcons[action.id] ?? "science"} size={22} />
            </span>
            <span className="operation-copy">
              <strong>{action.name}</strong>
              <EffectBadges effect={mission.actionEffects[action.id]} />
              <small>
                {mission.availableActions[action.id].reason ??
                  "1 операція · виконати"}
              </small>
            </span>
            <Icon
              name={
                mission.usedActions.includes(action.id) ? "check" : "arrowUp"
              }
              size={17}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
export function ModuleList() {
  const { mission, config, send } = useMission();
  const blocked = useMission(commandsBlocked);
  if (!mission || !config) return null;
  const icons: Record<string, IconName> = {
    solar: "energy",
    recycler: "oxygen",
    greenhouse: "water",
    laboratory: "science",
  };
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">СИСТЕМИ БАЗИ</span>
          <h2>Модулі станції</h2>
        </div>
        <span className="count-badge">
          <Icon name="parts" size={14} />
          {mission.parts} ДЕТАЛЕЙ
        </span>
      </div>
      <div className="module-list">
        {config.modules.map((module) => (
          <article className="module-row" key={module.id}>
            <div className="module-icon">
              <Icon name={icons[module.id] ?? "station"} size={25} />
            </div>
            <div className="module-copy">
              <span className="micro">
                {module.code} / РІВЕНЬ {mission.modules[module.id]}
              </span>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <div className="level-indicators">
                {Array.from({ length: config.upgrade.maxLevel }, (_, index) => (
                  <i
                    key={index}
                    className={
                      index < mission.modules[module.id] ? "filled" : ""
                    }
                  />
                ))}
              </div>
            </div>
            <div className="module-upgrade">
              <button
                className="button secondary"
                disabled={blocked || !mission.upgrades[module.id].available}
                onClick={() =>
                  void send({ type: "upgrade", moduleId: module.id })
                }
              >
                Поліпшити
                <Icon name="arrowUp" size={16} />
              </button>
              <small>
                {mission.upgrades[module.id].reason ??
                  `${mission.upgrades[module.id].cost} деталей · ${config.upgrade.energyCost} енергії · 1 операція`}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function CrewList({ compact = false }: { compact?: boolean }) {
  const { mission, config, openDialog, navigate } = useMission();
  if (!mission || !config) return null;
  return (
    <section className={`panel ${compact ? "compact-crew" : ""}`}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ЕКІПАЖ СТАНЦІЇ</span>
          <h2>Екіпаж</h2>
        </div>
        {compact ? (
          <button className="text-button" onClick={() => navigate("crew")}>
            Керування
            <Icon name="arrow" size={15} />
          </button>
        ) : (
          <span className="count-badge">{mission.crew.length} НА БОРТУ</span>
        )}
      </div>
      <div className="crew-list">
        {mission.crew.map((member, index) => (
          <article className="crew-row" key={member.id}>
            <div className={`crew-avatar avatar-${index}`}>
              <svg viewBox="0 0 64 72" fill="none" aria-hidden="true">
                <path
                  d="M10 70V57c0-10 10-17 22-17s22 7 22 17v13"
                  fill="currentColor"
                  opacity=".18"
                  stroke="currentColor"
                />
                <rect
                  x="13"
                  y="7"
                  width="38"
                  height="42"
                  rx="18"
                  stroke="currentColor"
                />
                <rect
                  x="18"
                  y="17"
                  width="28"
                  height="19"
                  rx="8"
                  fill="currentColor"
                  opacity=".3"
                />
                <path
                  d="M21 25h22M26 48v8h12v-8M8 24h6m36 0h6M27 64h10"
                  stroke="currentColor"
                />
              </svg>
            </div>
            <div className="crew-copy">
              <span className="micro">{member.callsign}</span>
              <h3>{member.name}</h3>
              <span>{config.roles[member.role].name}</span>
              {!compact && <p>{config.roles[member.role].description}</p>}
            </div>
            <div className="crew-health">
              <span
                className={
                  member.health < config.criticalThreshold ? "text-danger" : ""
                }
              >
                {member.health}
                <small> ОЗ</small>
              </span>
              <div className="meter">
                <span style={{ width: `${member.health}%` }} />
              </div>
              {!compact && (
                <button
                  className="text-button"
                  disabled={!mission.canAssign.available}
                  onClick={() =>
                    openDialog({ type: "crew", crewId: member.id })
                  }
                >
                  Призначити роль
                  <Icon name="arrowUp" size={14} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Journal({ compact = false }: { compact?: boolean }) {
  const { mission, navigate } = useMission();
  const [filter, setFilter] = useState<"all" | "event" | "action">("all");
  if (!mission) return null;
  const entries = [...mission.log]
    .reverse()
    .filter((entry) => filter === "all" || entry.kind === filter);
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(mission, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lunar-ops-day-${mission!.day}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="panel journal-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ЖУРНАЛ МІСІЇ</span>
          <h2>{compact ? "Останні повідомлення" : "Журнал місії"}</h2>
        </div>
        {compact ? (
          <button className="text-button" onClick={() => navigate("journal")}>
            Усі записи
            <Icon name="arrow" size={15} />
          </button>
        ) : (
          <button className="button secondary" onClick={download}>
            <Icon name="download" size={16} />
            Експорт JSON
          </button>
        )}
      </div>
      {!compact && (
        <div className="journal-filters">
          {(["all", "event", "action"] as const).map((key) => (
            <button
              key={key}
              className={filter === key ? "selected" : ""}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              {{ all: "Усі записи", event: "Події", action: "Операції" }[key]}
            </button>
          ))}
        </div>
      )}
      <div className="log-list">
        {(compact ? entries.slice(0, 3) : entries).map((entry) => (
          <div className={`log-entry log-${entry.kind}`} key={entry.id}>
            <span className="log-time">
              Д{entry.day.toString().padStart(2, "0")}
              <small>#{entry.id.toString().padStart(3, "0")}</small>
            </span>
            <i />
            <p>{entry.message}</p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="empty-message">
            Записів поки немає. Виконуйте операції та просувайтеся місією.
          </p>
        )}
      </div>
    </section>
  );
}

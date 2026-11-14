import { useEffect, useRef, useState } from "react";
import type { CrewRole, Difficulty } from "@lunar-ops/contracts";
import { commandsBlocked, useMission } from "../store";
import { Icon } from "./Icon";
import { ResourceChart, resourceLabels } from "./Telemetry";
import { ResourceActions } from "./ResourceActions";

export function Dialogs() {
  const {
    dialog,
    openDialog,
    mission,
    config,
    busy,
    start,
    send,
    error,
    connection,
    initialize,
    clearError,
  } = useMission();
  const blocked = useMission(commandsBlocked);
  const ref = useRef<HTMLDialogElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("cadet");
  useEffect(() => {
    if (dialog) ref.current?.showModal();
    else ref.current?.close();
  }, [dialog]);
  useEffect(() => {
    if (dialog?.type === "restart")
      setDifficulty(mission?.difficulty ?? "cadet");
  }, [dialog?.type, mission?.difficulty]);
  if (!mission || !config) return null;
  const member =
    dialog?.type === "crew"
      ? mission.crew.find((crew) => crew.id === dialog.crewId)
      : null;
  const module =
    dialog?.type === "module"
      ? config.modules.find((item) => item.id === dialog.moduleId)
      : null;
  const title =
    dialog?.type === "help"
      ? "Протокол командира"
      : dialog?.type === "restart"
        ? "Нова експедиція"
        : dialog?.type === "resource"
          ? resourceLabels[dialog.resource].name
          : module
            ? module.name
            : `Призначення / ${member?.callsign ?? ""}`;
  return (
    <dialog
      ref={ref}
      className="mission-dialog"
      onCancel={() => openDialog(null)}
      onClose={() => openDialog(null)}
      onClick={(event) => {
        if (event.target === event.currentTarget) openDialog(null);
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-content">
        <div className="dialog-heading">
          <span className="eyebrow">LUNAR OPS / ТЕРМІНАЛ</span>
          <button
            className="icon-button"
            aria-label="Закрити діалог"
            onClick={() => openDialog(null)}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="dialog-title">{title}</h2>
        {dialog?.type === "help" && (
          <div className="help-content">
            <p>
              Ви командуєте навчальною базою біля південного полюса Місяця. Мета
              — зберегти екіпаж протягом {config.duration} днів і набрати
              щонайменше {config.scienceTarget} наукових балів.
            </p>
            <ol>
              <li>
                <strong>Виберіть операції.</strong> На день доступні{" "}
                {config.actionsPerDay} операції. Дослідження дають наукові бали,
                обслуговування поповнює ресурси, а відпочинок відновлює екіпаж.
              </li>
              <li>
                <strong>Розвивайте базу.</strong> Поліпшення модулів витрачають
                деталі, енергію та одну операцію. Ролі екіпажу визначають
                щоденні бонуси.
              </li>
              <li>
                <strong>Завершіть день.</strong> Система розрахує споживання та
                виробництво. Прогноз під кожним ресурсом уже враховує модулі,
                ролі та складність.
              </li>
              <li>
                <strong>Ухвалюйте рішення.</strong> Подія блокує звичайні
                команди, доки ви не виберете відповідь. Наслідки та пояснення
                з’являться в журналі.
              </li>
            </ol>
            <div className="info-box">
              Запас нижче {config.criticalThreshold}% знижує здоров’я екіпажу на{" "}
              {config.criticalHealthLoss} наприкінці дня. Якщо будь-який ресурс
              або здоров’я вичерпано, екіпаж евакуюють.
            </div>
            <p className="muted">
              Це умовна навчальна модель. Події та телеметрія симулюються, а
              ігрові дні не відповідають тривалості справжньої місячної доби.
              Сесія зберігається в пам’яті сервера й доступна після оновлення
              сторінки до перезапуску API.
            </p>
            <button className="button primary" onClick={() => openDialog(null)}>
              Прийняти командування
              <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
        {dialog?.type === "restart" && (
          <>
            <p>
              Поточну місію буде замінено новою. Виберіть рівень підготовки.
            </p>
            <div className="difficulty-options">
              {(["cadet", "commander"] as const).map((key) => (
                <button
                  className={difficulty === key ? "selected" : ""}
                  key={key}
                  onClick={() => setDifficulty(key)}
                  aria-pressed={difficulty === key}
                  disabled={busy}
                >
                  <span>
                    <strong>{config.difficulties[key].name}</strong>
                    {difficulty === key && <Icon name="check" size={18} />}
                  </span>
                  <small>{config.difficulties[key].description}</small>
                </button>
              ))}
            </div>
            <button
              className="button primary full-width"
              disabled={busy}
              onClick={() => void start(difficulty)}
            >
              {busy ? "Підготовка…" : "Розпочати експедицію"}
              <Icon name="arrow" size={17} />
            </button>
          </>
        )}
        {dialog?.type === "resource" && (
          <>
            <p>{resourceLabels[dialog.resource].description}</p>
            <div className="resource-detail">
              <strong style={{ color: resourceLabels[dialog.resource].color }}>
                {mission.resources[dialog.resource]}
                <small>%</small>
              </strong>
              <span>
                Прогноз за день
                <strong>
                  {mission.forecast[dialog.resource] > 0 ? "+" : ""}
                  {mission.forecast[dialog.resource]}
                </strong>
              </span>
            </div>
            <ResourceChart resource={dialog.resource} />
            <p className="muted">
              Графік показує запас під час посадки та наприкінці кожного
              завершеного дня.
            </p>
            <ResourceActions resource={dialog.resource} />
          </>
        )}
        {dialog?.type === "crew" && member && (
          <>
            <p>
              Роль визначає внесок учасника наприкінці дня. Зміна ролі не
              витрачає операції.
            </p>
            <div className="difficulty-options">
              {(Object.keys(config.roles) as CrewRole[]).map((role) => (
                <button
                  key={role}
                  className={member.role === role ? "selected" : ""}
                  disabled={
                    blocked ||
                    !mission.canAssign.available ||
                    member.role === role
                  }
                  onClick={() =>
                    void send({ type: "assign", crewId: member.id, role })
                  }
                >
                  <span>
                    <strong>{config.roles[role].name}</strong>
                    {member.role === role && <Icon name="check" size={18} />}
                  </span>
                  <small>{config.roles[role].description}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {dialog?.type === "module" && module && (
          <>
            <span className="eyebrow">
              {module.code} / РІВЕНЬ {mission.modules[module.id]}
            </span>
            <p>{module.description}</p>
            <p>
              Поліпшення: {mission.upgrades[module.id].cost} деталей,{" "}
              {config.upgrade.energyCost} енергії та одна операція.
            </p>
            <button
              className="button primary full-width"
              disabled={blocked || !mission.upgrades[module.id].available}
              onClick={() =>
                void send({ type: "upgrade", moduleId: module.id })
              }
            >
              Поліпшити модуль
              <Icon name="arrowUp" size={16} />
            </button>
            {mission.upgrades[module.id].reason && (
              <p>{mission.upgrades[module.id].reason}</p>
            )}
          </>
        )}
        {error && (
          <div className="dialog-error" role="alert">
            <p>{error}</p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                connection === "offline" ? void initialize() : clearError()
              }
            >
              {connection === "offline" ? "Підключитися знову" : "Зрозуміло"}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

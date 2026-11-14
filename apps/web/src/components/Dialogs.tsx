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
        ? "Новая экспедиция"
        : dialog?.type === "resource"
          ? resourceLabels[dialog.resource].name
          : module
            ? module.name
            : `Назначение / ${member?.callsign ?? ""}`;
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
          <span className="eyebrow">LUNAR OPS / TERMINAL</span>
          <button
            className="icon-button"
            aria-label="Закрыть диалог"
            onClick={() => openDialog(null)}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="dialog-title">{title}</h2>
        {dialog?.type === "help" && (
          <div className="help-content">
            <p>
              Вы командуете учебной базой у южного полюса Луны. Цель — сохранить
              экипаж на протяжении {config.duration} дней и накопить минимум{" "}
              {config.scienceTarget} научных данных.
            </p>
            <ol>
              <li>
                <strong>Выберите операции.</strong> На день доступны{" "}
                {config.actionsPerDay} операции. Исследование приносит науку,
                обслуживание пополняет ресурсы, отдых восстанавливает экипаж.
              </li>
              <li>
                <strong>Развивайте базу.</strong> Улучшения модулей расходуют
                детали, энергию и одну операцию. Назначения экипажа определяют
                ежедневные бонусы.
              </li>
              <li>
                <strong>Завершите день.</strong> Сервер рассчитает потребление и
                производство. Прогноз под каждым ресурсом уже учитывает модули,
                роли и сложность.
              </li>
              <li>
                <strong>Принимайте решения.</strong> Событие блокирует обычные
                команды, пока вы не выберете ответ. Последствия и объяснения
                попадут в журнал.
              </li>
            </ol>
            <div className="info-box">
              Запас ниже {config.criticalThreshold}% снижает здоровье экипажа на{" "}
              {config.criticalHealthLoss} в конце дня. Нулевой ресурс или
              здоровье приводят к эвакуации.
            </div>
            <p className="muted">
              Это условная учебная модель. События и телеметрия симулируются, а
              игровые дни не соответствуют длительности реальных лунных суток.
              Сессия хранится в памяти сервера и доступна после обновления
              страницы до перезапуска API.
            </p>
            <button className="button primary" onClick={() => openDialog(null)}>
              Принять командование
              <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
        {dialog?.type === "restart" && (
          <>
            <p>
              Текущая миссия будет заменена новой. Выберите уровень подготовки.
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
              {busy ? "Подготовка…" : "Запустить экспедицию"}
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
              График показывает запас при посадке и на конец каждого
              завершённого дня.
            </p>
            <ResourceActions resource={dialog.resource} />
          </>
        )}
        {dialog?.type === "crew" && member && (
          <>
            <p>
              Роль определяет вклад участника в конце дня. Переназначение не
              расходует операции.
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
              {module.code} / УРОВЕНЬ {mission.modules[module.id]}
            </span>
            <p>{module.description}</p>
            <p>
              Улучшение: {mission.upgrades[module.id].cost} деталей,{" "}
              {config.upgrade.energyCost} энергии и одна операция.
            </p>
            <button
              className="button primary full-width"
              disabled={blocked || !mission.upgrades[module.id].available}
              onClick={() =>
                void send({ type: "upgrade", moduleId: module.id })
              }
            >
              Улучшить модуль
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
              {connection === "offline" ? "Переподключить" : "Понятно"}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

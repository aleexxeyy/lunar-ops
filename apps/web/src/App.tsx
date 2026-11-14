import { useEffect } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useMission, type Page } from "./store";
import { Icon, type IconName } from "./components/Icon";
import { StationScene } from "./components/StationScene";
import { Telemetry } from "./components/Telemetry";
import {
  CrewList,
  Journal,
  MissionBrief,
  ModuleList,
  Operations,
  ResourceCards,
} from "./components/MissionPanels";
import { Dialogs } from "./components/Dialogs";

const pages: {
  id: Page;
  name: string;
  icon: IconName;
  code: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "overview",
    name: "Командный центр",
    icon: "overview",
    code: "01",
    title: "Командный центр",
    subtitle: "Ваш мир за пределами Земли. Каждое решение имеет значение.",
  },
  {
    id: "station",
    name: "Лунная база",
    icon: "station",
    code: "02",
    title: "Системы станции",
    subtitle: "Превратите хрупкий форпост в автономную лунную базу.",
  },
  {
    id: "crew",
    name: "Экипаж",
    icon: "crew",
    code: "03",
    title: "Люди за миссией",
    subtitle:
      "Три специалиста. Одна команда. Назначайте роли и берегите здоровье.",
  },
  {
    id: "journal",
    name: "Журнал миссии",
    icon: "journal",
    code: "04",
    title: "Хроника экспедиции",
    subtitle: "Каждое решение, событие и открытие — в истории вашей миссии.",
  },
];
function App() {
  const {
    mission,
    config,
    page,
    navigate,
    openDialog,
    initialize,
    busy,
    error,
    notice,
    clearNotice,
    send,
  } = useMission();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(clearNotice, 6000);
    return () => clearTimeout(timeout);
  }, [notice, clearNotice]);
  const activePage = pages.find((item) => item.id === page)!;
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          К содержимому
        </a>
        <aside className="sidebar">
          <button
            className="brand"
            onClick={() => navigate("overview")}
            aria-label="Lunar Ops — командный центр"
          >
            <span className="brand-mark">
              <Icon name="moon" size={26} />
            </span>
            <span>
              LUNAR<span className="brand-light">OPS</span>
              <small>MISSION CONTROL SYSTEM</small>
            </span>
            <span className="brand-pixel" />
          </button>
          <div className="workspace-label">
            <span className="status-dot" />
            ЭКСПЕДИЦИЯ / HORIZON-01
          </div>
          <span className="nav-label">НАВИГАЦИЯ</span>
          <nav aria-label="Основная навигация">
            {pages.map((item) => (
              <button
                className={`nav-item ${page === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => navigate(item.id)}
                aria-label={item.name}
                aria-current={page === item.id ? "page" : undefined}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.name}</span>
                <small>{item.code}</small>
                {item.id === "overview" && mission?.pendingEvent && (
                  <i className="nav-alert" />
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="cadet-card">
              <span className="micro">JUNIOR ASTRONAUT PROGRAM</span>
              <div className="orbit-emblem">
                <Icon name="globe" size={38} />
                <span>✦</span>
              </div>
              <strong>Земля — только начало.</strong>
              <p>Исследуй. Решай. Выживай.</p>
              <span className="program-label">SPACE APPS CHALLENGE 2026</span>
            </div>
            <button
              className="sidebar-help"
              onClick={() => openDialog({ type: "help" })}
              disabled={!mission}
            >
              <Icon name="help" size={18} />
              Протокол командира
              <Icon name="arrowUp" size={15} />
            </button>
            <div className="sidebar-version">
              <span>LUNAR OS v.1.0</span>
              <span>● SIMULATION</span>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              ЦЕНТР УПРАВЛЕНИЯ<span>/</span>
              <strong>{activePage.name}</strong>
            </div>
            <div className="topbar-right">
              <span className={`connection ${error ? "offline" : ""}`}>
                <i />
                {busy
                  ? "СИНХРОНИЗАЦИЯ"
                  : error
                    ? "ПРОВЕРЬТЕ СВЯЗЬ"
                    : mission
                      ? "КАНАЛ АКТИВЕН"
                      : "ПОДКЛЮЧЕНИЕ"}
              </span>
              <span className="topbar-divider" />
              <button
                className="icon-button"
                onClick={() => openDialog({ type: "help" })}
                aria-label="Как играть"
                disabled={!mission}
              >
                <Icon name="help" size={19} />
              </button>
              <span className="commander-avatar">
                C<span />
              </span>
              <div className="commander-label">
                <strong>Командир</strong>
                <span>
                  {config && mission
                    ? config.difficulties[mission.difficulty].name
                    : "LUNAR OPS"}
                </span>
              </div>
            </div>
          </header>
          <main id="main-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="accent">LUNAR OPERATIONS</span>
                  <span className="slash">//</span>MISSION DASHBOARD
                </div>
                <h1>
                  {activePage.title}
                  <span className="heading-square" />
                </h1>
                <p>{activePage.subtitle}</p>
              </div>
              <button
                className="button secondary restart-button"
                onClick={() => openDialog({ type: "restart" })}
                disabled={!mission || busy}
              >
                <Icon name="restart" size={16} />
                Новая миссия
              </button>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                <Icon name="warning" />
                <span>{error}</span>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void initialize()}
                >
                  Переподключить
                </button>
              </div>
            )}
            {!mission || !config ? (
              <div className="loading-panel">
                <div className={`loading-orbit ${error ? "paused" : ""}`}>
                  <Icon name="moon" size={40} />
                </div>
                <span className="eyebrow">ESTABLISHING UPLINK</span>
                <h2>
                  {error
                    ? "Ожидаем связь с базой"
                    : "Подключение к «Горизонту»"}
                </h2>
                <p>
                  {error
                    ? "Запустите frontend и API командой pnpm dev, затем повторите подключение."
                    : "Получаем состояние станции и проверяем канал управления…"}
                </p>
              </div>
            ) : (
              <>
                <div className="mission-strip">
                  <div className="mission-identity">
                    <span className="mission-symbol">
                      <Icon name="globe" size={23} />
                    </span>
                    <div>
                      <span className="micro">АКТИВНАЯ ЭКСПЕДИЦИЯ</span>
                      <strong>
                        HORIZON<span>—</span>01
                      </strong>
                    </div>
                    <span
                      className={`status-pill ${mission.status === "lost" ? "failed" : ""}`}
                    >
                      <i />
                      {mission.status === "active"
                        ? "МИССИЯ В ПРОЦЕССЕ"
                        : mission.status === "won"
                          ? "ЦЕЛЬ ДОСТИГНУТА"
                          : "МИССИЯ ЗАВЕРШЕНА"}
                    </span>
                  </div>
                  <div className="day-control">
                    <span className="day-display">
                      ДЕНЬ{" "}
                      <strong>{mission.day.toString().padStart(2, "0")}</strong>
                      <span>
                        / {config.duration.toString().padStart(2, "0")}
                      </span>
                    </span>
                    <button
                      className="button primary"
                      disabled={busy || !mission.canAdvance.available}
                      title={
                        mission.canAdvance.reason ??
                        `Завершить день. Осталось операций: ${mission.actionsRemaining}`
                      }
                      onClick={() => void send({ type: "advance" })}
                    >
                      {busy ? "Обработка…" : "Завершить день"}
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                </div>
                {mission.status !== "active" && (
                  <div
                    className={`outcome-banner ${mission.status}`}
                    role="status"
                  >
                    <Icon
                      name={mission.status === "won" ? "check" : "warning"}
                      size={28}
                    />
                    <div>
                      <h2>
                        {mission.status === "won"
                          ? "Миссия выполнена, командир."
                          : "Экспедиция завершена."}
                      </h2>
                      <p>{mission.outcome}</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => openDialog({ type: "restart" })}
                    >
                      Следующий полёт
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                )}
                {mission.pendingEvent && page !== "overview" && (
                  <button
                    className="event-alert"
                    onClick={() => navigate("overview")}
                  >
                    <Icon name="warning" size={18} />
                    Требуется решение: {mission.pendingEvent.title}
                    <span>
                      Открыть сигнал
                      <Icon name="arrow" size={16} />
                    </span>
                  </button>
                )}
                <ResourceCards />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={page}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                  >
                    {page === "overview" && (
                      <div className="dashboard-grid">
                        <StationScene />
                        <MissionBrief />
                        <Operations />
                        <Telemetry />
                        <CrewList compact />
                        <Journal compact />
                      </div>
                    )}
                    {page === "station" && (
                      <div className="station-page">
                        <StationScene />
                        <ModuleList />
                      </div>
                    )}
                    {page === "crew" && (
                      <div className="crew-page">
                        <CrewList />
                        <section className="panel crew-guidance">
                          <span className="eyebrow">CREW WELLBEING</span>
                          <h2>Команда — главный ресурс.</h2>
                          <p>
                            Назначайте роли по потребностям базы. Эффекты
                            нескольких специалистов одной роли складываются.
                          </p>
                          {Object.entries(config.roles).map(([key, role]) => (
                            <div className="role-guide" key={key}>
                              <Icon
                                name={
                                  key === "engineer"
                                    ? "repair"
                                    : key === "scientist"
                                      ? "science"
                                      : "morale"
                                }
                              />
                              <span>
                                <strong>{role.name}</strong>
                                <small>{role.description}</small>
                              </span>
                            </div>
                          ))}
                          <p>
                            Низкие запасы снижают здоровье. Используйте отдых
                            экипажа и помощь медика.
                          </p>
                          <button
                            className="button secondary"
                            onClick={() => navigate("overview")}
                          >
                            Перейти к операциям
                            <Icon name="arrow" size={16} />
                          </button>
                        </section>
                      </div>
                    )}
                    {page === "journal" && <Journal />}
                  </motion.div>
                </AnimatePresence>
                <footer className="page-footer">
                  <span>
                    <Icon name="signal" size={13} />
                    УЧЕБНАЯ СИМУЛЯЦИЯ · НЕ ОПЕРАТИВНЫЕ ДАННЫЕ NASA
                  </span>
                  <span>
                    AD ASTRA, ONE DECISION AT A TIME.
                    <i />
                  </span>
                </footer>
              </>
            )}
          </main>
        </div>
        <AnimatePresence>
          {notice && (
            <motion.div
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <Icon name="check" size={18} />
              <span>{notice}</span>
              <button
                className="icon-button"
                aria-label="Закрыть уведомление"
                onClick={clearNotice}
              >
                <Icon name="close" size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <Dialogs />
      </div>
    </MotionConfig>
  );
}
export default App;

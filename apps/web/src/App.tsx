import { useEffect } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { commandsBlocked, useMission, type Page } from "./store";
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
    name: "Командний центр",
    icon: "overview",
    code: "01",
    title: "Командний центр",
    subtitle: "Ваш світ за межами Землі. Кожне рішення має значення.",
  },
  {
    id: "station",
    name: "Місячна база",
    icon: "station",
    code: "02",
    title: "Системи станції",
    subtitle: "Перетворіть крихкий форпост на автономну місячну базу.",
  },
  {
    id: "crew",
    name: "Екіпаж",
    icon: "crew",
    code: "03",
    title: "Команда місії",
    subtitle:
      "Троє фахівців. Одна команда. Призначайте ролі та бережіть здоров’я.",
  },
  {
    id: "journal",
    name: "Журнал місії",
    icon: "journal",
    code: "04",
    title: "Хроніка експедиції",
    subtitle: "Кожне рішення, подія та відкриття — в історії вашої місії.",
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
    connection,
    clearError,
    restorePage,
  } = useMission();
  const blocked = useMission(commandsBlocked);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    window.addEventListener("popstate", restorePage);
    window.addEventListener("hashchange", restorePage);
    return () => {
      window.removeEventListener("popstate", restorePage);
      window.removeEventListener("hashchange", restorePage);
    };
  }, [restorePage]);
  useEffect(() => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(clearNotice, 6000);
    return () => clearTimeout(timeout);
  }, [notice, clearNotice]);
  const activePage = pages.find((item) => item.id === page)!;
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          До вмісту
        </a>
        <aside className="sidebar">
          <button
            className="brand"
            onClick={() => navigate("overview")}
            aria-label="Lunar Ops — командний центр"
          >
            <span className="brand-mark">
              <Icon name="moon" size={26} />
            </span>
            <span>
              LUNAR<span className="brand-light">OPS</span>
              <small>СИСТЕМА КЕРУВАННЯ МІСІЄЮ</small>
            </span>
            <span className="brand-pixel" />
          </button>
          <div className="workspace-label">
            <span className="status-dot" />
            ЕКСПЕДИЦІЯ / HORIZON-01
          </div>
          <span className="nav-label">НАВІГАЦІЯ</span>
          <nav aria-label="Основна навігація">
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
              <span className="micro">ПРОГРАМА ЮНИХ АСТРОНАВТІВ</span>
              <div className="orbit-emblem">
                <Icon name="globe" size={38} />
                <span>✦</span>
              </div>
              <strong>Земля — лише початок.</strong>
              <p>Досліджуй. Вирішуй. Виживай.</p>
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
              <span>● СИМУЛЯЦІЯ</span>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              ЦЕНТР КЕРУВАННЯ<span>/</span>
              <strong>{activePage.name}</strong>
            </div>
            <div className="topbar-right">
              <span
                className={`connection ${connection === "offline" ? "offline" : ""}`}
              >
                <i />
                {busy
                  ? "СИНХРОНІЗАЦІЯ"
                  : connection === "offline"
                    ? "ПЕРЕВІРТЕ ЗВ’ЯЗОК"
                    : mission
                      ? "КАНАЛ АКТИВНИЙ"
                      : "ПІДКЛЮЧЕННЯ"}
              </span>
              <span className="topbar-divider" />
              <button
                className="icon-button"
                onClick={() => openDialog({ type: "help" })}
                aria-label="Як грати"
                disabled={!mission}
              >
                <Icon name="help" size={19} />
              </button>
              <span className="commander-avatar">
                К<span />
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
          <main id="main-content" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="accent">МІСЯЧНІ ОПЕРАЦІЇ</span>
                  <span className="slash">//</span>ПАНЕЛЬ МІСІЇ
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
                Нова місія
              </button>
            </div>
            {error && (
              <div className="error-banner" role="alert">
                <Icon name="warning" />
                <span>{error}</span>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    connection === "offline" ? void initialize() : clearError()
                  }
                >
                  {connection === "offline"
                    ? "Підключитися знову"
                    : "Зрозуміло"}
                </button>
              </div>
            )}
            {!mission || !config ? (
              <div className="loading-panel">
                <div className={`loading-orbit ${error ? "paused" : ""}`}>
                  <Icon name="moon" size={40} />
                </div>
                <span className="eyebrow">ВСТАНОВЛЕННЯ ЗВ’ЯЗКУ</span>
                <h2>
                  {error
                    ? "Очікуємо на зв’язок із базою"
                    : "Підключення до «Горизонту»"}
                </h2>
                <p>
                  {error
                    ? "Зв’язок із центром керування перервано. Спробуйте підключитися знову за кілька секунд."
                    : "Отримуємо стан станції та перевіряємо канал керування…"}
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
                      <span className="micro">АКТИВНА ЕКСПЕДИЦІЯ</span>
                      <strong>
                        HORIZON<span>—</span>01
                      </strong>
                    </div>
                    <span
                      className={`status-pill ${mission.status === "lost" ? "failed" : ""}`}
                    >
                      <i />
                      {mission.status === "active"
                        ? "МІСІЯ ТРИВАЄ"
                        : mission.status === "won"
                          ? "МЕТИ ДОСЯГНУТО"
                          : "МІСІЮ ЗАВЕРШЕНО"}
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
                      disabled={blocked || !mission.canAdvance.available}
                      title={
                        mission.canAdvance.reason ??
                        `Завершити день. Залишилося операцій: ${mission.actionsRemaining}`
                      }
                      onClick={() => void send({ type: "advance" })}
                    >
                      {busy ? "Обробка…" : "Завершити день"}
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
                          ? "Місію виконано, командире."
                          : "Експедицію завершено."}
                      </h2>
                      <p>{mission.outcome}</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => openDialog({ type: "restart" })}
                    >
                      Наступний політ
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
                    Потрібне рішення: {mission.pendingEvent.title}
                    <span>
                      Відкрити сигнал
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
                          <span className="eyebrow">СТАН ЕКІПАЖУ</span>
                          <h2>Команда — головний ресурс.</h2>
                          <p>
                            Призначайте ролі відповідно до потреб бази. Ефекти
                            кількох фахівців з однаковою роллю додаються.
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
                            Низькі запаси погіршують здоров’я. Використовуйте
                            відпочинок екіпажу та допомогу медика.
                          </p>
                          <button
                            className="button secondary"
                            onClick={() => navigate("overview")}
                          >
                            Перейти до операцій
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
                    НАВЧАЛЬНА СИМУЛЯЦІЯ · НЕ ОПЕРАТИВНІ ДАНІ NASA
                  </span>
                  <span>
                    ДО ЗІРОК — РІШЕННЯ ЗА РІШЕННЯМ.
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
                aria-label="Закрити сповіщення"
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

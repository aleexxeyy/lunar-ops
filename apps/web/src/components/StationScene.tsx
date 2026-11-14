import { useState } from "react";
import { useMission } from "../store";
import { Icon } from "./Icon";

export function StationScene() {
  const [mode, setMode] = useState<"surface" | "orbit">("surface");
  const mission = useMission((s) => s.mission)!;
  const config = useMission((s) => s.config)!;
  const connection = useMission((s) => s.connection);
  const openDialog = useMission((s) => s.openDialog);
  return (
    <section className="panel scene-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">LIVE FEED / SECTOR 07</span>
          <h2>База «Горизонт»</h2>
        </div>
        <span className="live-badge">
          <i />
          {connection === "online" ? "В СЕТИ" : "НЕТ СВЯЗИ"}
        </span>
      </div>
      <div className="scene-tabs" aria-label="Вид базы">
        <button
          className={mode === "surface" ? "selected" : ""}
          onClick={() => setMode("surface")}
          aria-pressed={mode === "surface"}
        >
          <Icon name="station" size={14} />
          Поверхность
        </button>
        <button
          className={mode === "orbit" ? "selected" : ""}
          onClick={() => setMode("orbit")}
          aria-pressed={mode === "orbit"}
        >
          <Icon name="globe" size={14} />
          Орбита
        </button>
      </div>
      <div className={`station-visual ${mode}`}>
        <svg
          className="station-art"
          viewBox="0 0 760 410"
          role="img"
          aria-label={
            mode === "surface"
              ? "Изометрическая схема лунной базы и её модулей"
              : "Орбитальная схема Луны и положение базы у южного полюса"
          }
        >
          <defs>
            <pattern
              id="grid"
              width="48"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 14 24 0 48 14 24 28Z"
                fill="none"
                stroke="#72c9bc"
                strokeWidth=".5"
                opacity=".18"
              />
            </pattern>
            <linearGradient id="ground" x2="0" y2="1">
              <stop stopColor="#173c39" stopOpacity=".35" />
              <stop offset="1" stopColor="#071517" stopOpacity=".2" />
            </linearGradient>
            <linearGradient id="dome" x2=".4" y2="1">
              <stop stopColor="#76dfc3" stopOpacity=".5" />
              <stop offset="1" stopColor="#133238" stopOpacity=".8" />
            </linearGradient>
            <radialGradient id="moon">
              <stop stopColor="#435f60" />
              <stop offset=".72" stopColor="#253b40" />
              <stop offset="1" stopColor="#101e26" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {mode === "surface" ? (
            <>
              <path d="M30 260 370 62 736 260 393 449Z" fill="url(#ground)" />
              <path d="M30 260 370 62 736 260 393 449Z" fill="url(#grid)" />
              <g fill="none" stroke="#34494b" strokeWidth="1">
                <path d="m15 287 70-42 44 5 40-35 45 1 M515 126l48-3 42 26 48 4 77 52 M543 343l49-26 52 1 45-24" />
                <ellipse cx="192" cy="312" rx="43" ry="19" />
                <ellipse cx="192" cy="309" rx="32" ry="12" />
                <ellipse cx="579" cy="200" rx="28" ry="13" />
              </g>
              <g fill="none" stroke="#88f2d0" strokeWidth="2" opacity=".6">
                <path
                  d="m236 210 113 65 157-90 M353 198l-4 77 105 61"
                  strokeDasharray="5 5"
                />
              </g>
              <g transform="translate(332 203)">
                <path
                  d="m-80 22 82-45 110 62-82 47Z"
                  fill="#142b30"
                  stroke="#63b6ae"
                />
                <path
                  d="m-80 22 110 63v27L-80 49Z"
                  fill="#172d33"
                  stroke="#508b88"
                />
                <path
                  d="m30 85 82-46v27l-82 46Z"
                  fill="#0c1d25"
                  stroke="#508b88"
                />
                <path
                  d="M-65 28c0-92 146-92 146 0l-73 42Z"
                  fill="url(#dome)"
                  stroke="#88dbc7"
                  strokeWidth="1.5"
                />
                <path
                  d="M-65 28Q8 68 81 28 M-55 0Q8 36 71 0 M-36-22Q8 3 52-22 M8-41V69 M8-41Q-38 12 8 69 M8-41Q54 12 8 69"
                  fill="none"
                  stroke="#8ae4cd"
                  opacity=".55"
                />
                <path
                  d="m-65 56 23 13m6 4 23 13m6 4 23 13 M43 84l17-10m8-4 17-10m8-5 12-7"
                  stroke="#aafa83"
                  strokeWidth="3"
                />
              </g>
              <g transform="translate(175 149)">
                <path d="M0 18v70m89-23v68" stroke="#638788" strokeWidth="5" />
                <path
                  d="m-26 9 70-39L157 33 86 73Z"
                  fill="#132839"
                  stroke="#6abcc9"
                  strokeWidth="2"
                />
                <path
                  d="m-7-2 112 64 M10-12l113 64 M27-20l113 64 M2 25l71-40 M30 42l71-40 M58 57l71-40"
                  fill="none"
                  stroke="#4a8c9f"
                />
                <path d="m-26 9 112 64v7L-26 16Z" fill="#25414c" />
              </g>
              <g transform="translate(469 114)">
                <path
                  d="m-13 45 47-27 70 40-48 28Z"
                  fill="#4b7271"
                  stroke="#8cc7bd"
                />
                <path
                  d="m-13 45 69 40v39l-69-40Z"
                  fill="#254448"
                  stroke="#6ca7a2"
                />
                <path
                  d="m56 85 48-27v39l-48 27Z"
                  fill="#142c32"
                  stroke="#6ca7a2"
                />
                <path
                  d="m-2 60 46 27v16L-2 76Z"
                  fill="#81d6bb"
                  fillOpacity=".4"
                />
                <path d="m65 85 27-16v9L65 94Z" fill="#aafa83" />
                <path
                  d="M33 19v-54m-12 8 24 14m-29-1 34 20"
                  stroke="#80a5a3"
                  strokeWidth="2"
                />
                <circle cx="33" cy="-35" r="4" fill="#dba6ff" />
                <circle
                  cx="33"
                  cy="-35"
                  r="10"
                  fill="#dba6ff"
                  opacity=".4"
                  filter="url(#glow)"
                />
              </g>
              <g transform="translate(452 282)">
                <path
                  d="m-23 20 41-24 75 43-42 24Z"
                  fill="#305853"
                  stroke="#78bd9e"
                />
                <path
                  d="m-23 20 74 43v27l-74-43Z"
                  fill="#1b373b"
                  stroke="#528b79"
                />
                <path
                  d="m51 63 42-24v27L51 90Z"
                  fill="#14292e"
                  stroke="#528b79"
                />
                <path
                  d="m-12 19 30-17 63 36-31 17Z"
                  fill="#aafa83"
                  opacity=".3"
                />
                <path
                  d="m1 14 62 36 M16 5l62 36 M8 32l30-18m-13 28 30-18"
                  stroke="#aafa83"
                  opacity=".65"
                />
              </g>
              <g fill="#b3ff86">
                <circle cx="358" cy="243" r="4" />
                <circle cx="258" cy="182" r="3" />
                <circle cx="523" cy="197" r="3" />
                <circle cx="497" cy="332" r="3" />
              </g>
              <g fill="#8baba7" fontFamily="monospace" fontSize="10">
                <text x="75" y="371">
                  89°54′ S / 00°00′ E
                </text>
                <text x="578" y="371">
                  ALT +1,420 M
                </text>
              </g>
            </>
          ) : (
            <>
              <ellipse
                cx="380"
                cy="203"
                rx="273"
                ry="106"
                transform="rotate(-20 380 203)"
                fill="none"
                stroke="#4c8f93"
                strokeDasharray="5 7"
              />
              <circle
                cx="380"
                cy="203"
                r="128"
                fill="url(#moon)"
                stroke="#527b78"
              />
              <g fill="#132b31" stroke="#49625f" opacity=".65">
                <ellipse cx="321" cy="154" rx="26" ry="22" />
                <circle cx="417" cy="224" r="36" />
                <circle cx="346" cy="260" r="17" />
                <circle cx="423" cy="130" r="12" />
                <circle cx="374" cy="188" r="9" />
              </g>
              <ellipse
                cx="380"
                cy="203"
                rx="125"
                ry="40"
                fill="none"
                stroke="#709c94"
                opacity=".4"
              />
              <ellipse
                cx="380"
                cy="203"
                rx="55"
                ry="128"
                fill="none"
                stroke="#709c94"
                opacity=".4"
              />
              <path d="m380 320 104 30h107" fill="none" stroke="#b3ff86" />
              <circle cx="380" cy="320" r="6" fill="#b3ff86" />
              <circle cx="380" cy="320" r="13" fill="none" stroke="#b3ff86" />
              <text
                x="490"
                y="340"
                fontFamily="monospace"
                fontSize="11"
                fill="#b3ff86"
              >
                HORIZON / SOUTH POLE
              </text>
              <g
                transform="translate(598 119) rotate(-20)"
                fill="#75b8be"
                stroke="#9adbd7"
              >
                <path d="M-8-7H8V7H-8Z M-33-10h20v20h-20Z M13-10h20v20H13Z" />
                <path d="M-13 0h26M0-7v-10" />
              </g>
            </>
          )}
        </svg>
        {mode === "surface" && (
          <>
            <button
              className="map-label solar-label"
              onClick={() => openDialog({ type: "module", moduleId: "solar" })}
              aria-label="Солнечный массив: детали модуля"
            >
              <i />
              PWR-01 <span>LVL {mission.modules.solar}</span>
              <Icon name="arrowUp" size={12} />
            </button>
            <button
              className="map-label lab-label"
              onClick={() =>
                openDialog({ type: "module", moduleId: "laboratory" })
              }
              aria-label="Научная лаборатория: детали модуля"
            >
              <i />
              SCI-04 <span>LVL {mission.modules.laboratory}</span>
              <Icon name="arrowUp" size={12} />
            </button>
            <button
              className="map-label recycler-label"
              onClick={() =>
                openDialog({ type: "module", moduleId: "recycler" })
              }
              aria-label="Система жизнеобеспечения: детали модуля"
            >
              <i />
              LSS-02 <span>LVL {mission.modules.recycler}</span>
              <Icon name="arrowUp" size={12} />
            </button>
            <button
              className="map-label greenhouse-label"
              onClick={() =>
                openDialog({ type: "module", moduleId: "greenhouse" })
              }
              aria-label="Гидропонный отсек: детали модуля"
            >
              <i />
              BIO-03 <span>LVL {mission.modules.greenhouse}</span>
              <Icon name="arrowUp" size={12} />
            </button>
          </>
        )}
        <div className="scene-corner top-left" />
        <div className="scene-corner bottom-right" />
      </div>
      <div className="scene-footer">
        <span>
          <i className="status-dot" />
          Модулей на базе: {config.modules.length}
        </span>
        <span>
          ЮЖНЫЙ ПОЛЮС <Icon name="target" size={14} />
        </span>
      </div>
    </section>
  );
}

import type { CSSProperties } from "react";

const paths = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  station: "M3 20V10l9-7 9 7v10H3z M9 20v-7h6v7 M3 10h18",
  crew: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  journal: "M5 3h14v18H5z M9 7h6 M9 11h6 M9 15h4",
  energy: "M13 2 4 14h7l-1 8 10-13h-8l1-7Z",
  oxygen:
    "M8 3c0 5-4 7-4 12a5 5 0 0 0 8 4 5 5 0 0 0 8-4c0-5-4-7-4-12 M12 4v15 M4 14h4 M16 14h4",
  water: "M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14Z M8 16a4 4 0 0 0 4 4",
  morale:
    "M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z M5 12h4l2-4 3 8 2-4h3",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  arrowUp: "M7 17 17 7 M7 7h10v10",
  chevron: "m9 5 7 7-7 7",
  help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  restart: "M3 10a9 9 0 1 1 2 8 M3 3v7h7",
  signal: "M4 20v-4 M9 20v-8 M14 20V8 M19 20V4",
  target:
    "M22 12H2 M12 2v20 M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  science:
    "M9 3h6 M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3 M8 14h8 M10 17h.01 M14 18h.01",
  repair:
    "m14 6 4 4 4-4a7 7 0 0 1-9 9l-6 6a3 3 0 0 1-4-4l6-6a7 7 0 0 1 9-9l-4 4Z",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  close: "m6 6 12 12 M6 18 18 6",
  check: "m5 12 4 4L19 6",
  warning: "M12 3 2 21h20L12 3Z M12 9v5 M12 17h.01",
  download: "M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  clock: "M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  parts: "m12 2 9 5v10l-9 5-9-5V7l9-5Z M3 7l9 5 9-5 M12 12v10 M7 4l10 6",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  style,
  className = "",
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}

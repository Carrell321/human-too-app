import type { IconName } from "../lib/types";

const PATHS: Record<IconName, string> = {
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
  same: '<g transform="translate(1.2 3.8) scale(.1)"><path vector-effect="non-scaling-stroke" d="M52 8C76 8 92 26 92 50C92 90 66 124 26 142L20 132C42 118 54 100 57 88C54 89 51 90 48 90C26 90 8 72 8 49C8 26 27 8 52 8Z"/></g><g transform="translate(11.6 2.6) rotate(-14 5 5) scale(.1)"><path vector-effect="non-scaling-stroke" style="stroke:var(--accent)" d="M52 8C76 8 92 26 92 50C92 90 66 124 26 142L20 132C42 118 54 100 57 88C54 89 51 90 48 90C26 90 8 72 8 49C8 26 27 8 52 8Z"/></g>',
  support: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/><path d="M12 11v4.5M9.8 13.2h4.4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"/>',
  circles: '<circle cx="8.5" cy="12" r="5.5"/><circle cx="15.5" cy="12" r="5.5"/><path d="M12 7.757A5.5 5.5 0 0 1 12 16.243A5.5 5.5 0 0 1 12 7.757Z" stroke="none" style="fill:var(--accent)"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.4-3.8 4.3-5.6 7.5-5.6s6.1 1.8 7.5 5.6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.8 3.3 2.8 13.7 0 17M12 3.5c-2.8 3.3-2.8 13.7 0 17"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3.5 19c1-3.4 3.2-5 5.5-5s4.5 1.6 5.5 5M15.5 14.6c2.2.1 4 1.4 5 4"/>',
  ring: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  anon: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="2.6 2.6"/><circle cx="12" cy="10" r="2.8"/><path d="M7.6 17.6c1.1-1.9 2.6-2.8 4.4-2.8s3.3.9 4.4 2.8"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  more: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4A7.5 7.5 0 1 1 20 11.5z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  flag: '<path d="M6 21V4h11l-2.2 4L17 12H6"/>',
  alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16h.01"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  sunrise: '<path d="M4 17h16M7 17a5 5 0 0 1 10 0M12 6v3M5.5 10.5l2 1.5M18.5 10.5l-2 1.5"/>',
  rejection: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/><path d="M12 8l-1.5 3 3 2-1.5 3"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 5-4 1 2-5z"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M6 20c1-3.5 3.5-5 6-5s5 1.5 6 5"/>',
  rel: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  house: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
  candle: '<path d="M9 11h6v9H9z"/><path d="M12 4c1.5 1.8 1.5 3.5 0 4.5-1.5-1-1.5-2.7 0-4.5z"/>',
  identity: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="2.5"/><path d="M8 16c1-2 2.4-3 4-3s3 1 4 3"/>',
  faith: '<path d="M12 4c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6z"/><path d="M4 12c2.5 0 4.5 2 8 2s5.5-2 8-2"/><path d="M5 12v3c0 2.5 3.2 5 7 5s7-2.5 7-5v-3"/>',
  case: '<rect x="3.5" y="8" width="17" height="11" rx="2.5"/><path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 13h17"/>',
  star: '<path d="M12 4l2.4 5 5.4.7-4 3.7 1 5.4L12 16.3 7.2 18.8l1-5.4-4-3.7 5.4-.7z"/>',
  waves: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
  battery: '<rect x="3" y="8" width="16" height="9" rx="2.5"/><path d="M21 11v3M6.5 11v3"/>',
  belong: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  heal: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/><path d="M12 11v4.5M9.8 13.2h4.4"/>',
  growth: '<path d="M4 19h16M6.5 19v-4M11.5 19v-8M16.5 19V6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  grounded: '<path d="M4 16h16M8 12h8M11 8h2"/>',
  drop: '<path d="M12 4c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z"/>',
};

export const COMMA_PATH = "M52 8C76 8 92 26 92 50C92 90 66 124 26 142L20 132C42 118 54 100 57 88C54 89 51 90 48 90C26 90 8 72 8 49C8 26 27 8 52 8Z";

export const H_PATH = "M14 15H30V85H14Z M70 15H86V85H70Z M30 47H70V51H30Z M8 12H36V15H8Z M8 85H36V88H8Z M64 12H92V15H64Z M64 85H92V88H64Z M14 15Q14 19 10.5 15Z M30 15Q30 19 33.5 15Z M14 85Q14 81 10.5 85Z M30 85Q30 81 33.5 85Z M70 15Q70 19 66.5 15Z M86 15Q86 19 89.5 15Z M70 85Q70 81 66.5 85Z M86 85Q86 81 89.5 85Z";

/** The HUMAN, TOO app icon: serif H with a clay comma on ivory (approved 2026-09-27). */
export function HTile({ className = "", size }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true">
      <rect x="4" y="4" width="1016" height="1016" rx="228" fill="#FAF7F4" stroke="#E6E0DA" strokeWidth="8" />
      <g transform="translate(226.8 206.2) scale(4.4)"><path fill="#1E2F27" d={H_PATH} /></g>
      <g transform="translate(645.8 584.7) scale(1.27)"><path fill="#B4553A" d={COMMA_PATH} /></g>
    </svg>
  );
}

export function Icon({ name, size = 22, filled = false, strokeWidth = 1.7 }: { name: IconName; size?: number; filled?: boolean; strokeWidth?: number }) {
  return (
    <svg
      className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

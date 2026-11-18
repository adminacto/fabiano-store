import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

type P = SVGProps<SVGSVGElement>;

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></svg>
);
export const HeartIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 8h17M3.5 16h17" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}><path d="m5.5 5.5 13 13M18.5 5.5l-13 13" /></svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 12h16M14 6l6 6-6 6" /></svg>
);

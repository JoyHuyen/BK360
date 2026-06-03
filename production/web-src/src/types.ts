export type Lang = 'vi' | 'en';

export type MediaKind = 'PANO360' | 'OLD' | 'NOW' | 'AUDIO' | 'MODEL3D' | 'MAPBG';

export interface Vr360Config {
  autorotate?: boolean;
  speed?: number; // độ/giây
  startSlug?: string | null;
}
export interface Project {
  id?: string;
  slug: string;
  name: string;
  mapBg?: string | null;
  theme?: any;
  vr360?: Vr360Config | null;
}
export interface LocSettings {
  vrExclude?: boolean; // ẩn riêng khỏi VR360
  vrYaw?: number; // góc nhìn ban đầu (độ)
}

export interface Hotspot {
  id: string;
  yaw: number; // độ, ngang
  pitch: number; // độ, dọc
  to: string; // slug scene đích
  label?: string;
}
export interface Scene {
  id: string;
  slug: string;
  title: Record<string, string>;
  pano?: string | null;
  yaw?: number | null;
  order: number;
  enabled: boolean;
  hotspots: Hotspot[];
  locationId?: string | null;
}
export interface Media {
  id: string;
  kind: MediaKind;
  url: string;
  lang?: string | null;
}

export interface LocI18n {
  name?: string;
  short?: string;
  year?: string;
  description?: string;
  voiceText?: string;
}
export interface HistoryItem {
  year: string;
  content: string;
}
export interface Palette {
  sky: string;
  ground: string;
  bld: string;
}
export interface Shape {
  type: 'rect' | 'arch' | 'stadium';
  w?: number;
  h?: number;
  rx?: number;
  ry?: number;
}
export interface Location {
  id: string;
  slug: string;
  type: 'SPOT' | 'EVENT';
  mapX: number;
  mapY: number;
  shape?: Shape | null;
  palette?: Palette | null;
  i18n: Record<string, LocI18n>;
  history: HistoryItem[];
  isHidden: boolean;
  order: number;
  media?: Media[];
  links?: { old?: string; now?: string; pano360?: string; audio?: string } | null;
  settings?: { vrExclude?: boolean; vrYaw?: number } | null;
}

export interface ScheduleItem {
  time: string;
  loc: string;
  live: boolean;
  title: Record<string, string>;
}
export interface Campaign {
  id: string;
  slug: string;
  icon: string;
  enabled: boolean;
  i18n: Record<string, { name?: string; description?: string }>;
  schedule: ScheduleItem[];
  order: number;
}

export interface User {
  id?: string;
  sub?: string;
  email: string;
  role: string;
  name?: string;
}

export type Screen = 'welcome' | 'map2d' | 'vr360' | 'event' | 'admin';

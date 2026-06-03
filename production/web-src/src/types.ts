export type Lang = 'vi' | 'en';

export type MediaKind = 'PANO360' | 'OLD' | 'NOW' | 'AUDIO' | 'MODEL3D';
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

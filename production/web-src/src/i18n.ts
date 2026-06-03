import type { Lang } from './types';

/** Lấy field đa ngữ với fallback về tiếng Việt. */
export function tx(
  i18n: Record<string, any> | undefined,
  lang: Lang,
  field: string,
  fallback: Lang = 'vi',
): string {
  return i18n?.[lang]?.[field] ?? i18n?.[fallback]?.[field] ?? '';
}

type Dict = Record<string, { vi: string; en: string }>;
const UI: Dict = {
  appTag: { vi: 'Hành trình 70 năm', en: '70-Year Journey' },
  subtitle: {
    vi: 'Khám phá Đại học Bách khoa Hà Nội — chọn cách bạn muốn tham quan.',
    en: 'Explore Hanoi University of Science and Technology — choose how to visit.',
  },
  map2d: { vi: 'Bản đồ 2D', en: '2D Map' },
  map2dDesc: {
    vi: 'Chạm vào từng toà nhà để xem quá trình hình thành & ảnh Xưa / Nay.',
    en: 'Tap each building to see its history & Then/Now photos.',
  },
  vr360: { vi: 'VR360 Campus Tour', en: 'VR360 Campus Tour' },
  vr360Desc: {
    vi: 'Dạo quanh khuôn viên bằng ảnh 360°.',
    en: 'Walk around the campus in 360° photos.',
  },
  events: { vi: 'Sự kiện', en: 'Events' },
  eventsDesc: {
    vi: 'Lịch trình & toà nhà phát tín hiệu khi đang diễn ra.',
    en: 'Schedule & buildings signaling live activities.',
  },
  tapBuilding: { vi: '👆 Chạm vào toà nhà bất kỳ', en: '👆 Tap any building' },
  schedule: { vi: 'Lịch trình', en: 'Schedule' },
  live: { vi: 'ĐANG DIỄN RA', en: 'LIVE NOW' },
  soon: { vi: 'Sắp diễn ra', en: 'Upcoming' },
  thenNow: { vi: 'Xưa & Nay', en: 'Then & Now' },
  timeline: { vi: 'Dòng thời gian', en: 'Timeline' },
  listen: { vi: '🎧 Nghe thuyết minh', en: '🎧 Listen' },
  dragCompare: { vi: 'Kéo thanh trắng để so sánh', en: 'Drag the bar to compare' },
  eventsHere: { vi: 'Sự kiện tại đây', en: 'Events here' },
  admin: { vi: 'Quản trị', en: 'Admin' },
  login: { vi: 'Đăng nhập', en: 'Login' },
};
export function t(key: keyof typeof UI, lang: Lang): string {
  return UI[key]?.[lang] ?? key;
}

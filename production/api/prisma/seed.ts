import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ---- Dữ liệu port từ prototype (HUST) ----
const locations: any[] = [
  {
    slug: 'parabol', type: 'SPOT', mapX: 165, mapY: 170, order: 0,
    shape: { type: 'arch' }, palette: { sky: '#7fb2e8', ground: '#6f7d54', bld: '#9e1b32' },
    i18n: {
      vi: {
        name: 'Cổng Parabol', short: 'Biểu tượng', year: 'Biểu tượng từ thập niên 1960',
        description: 'Cổng Parabol với mái vòm cong đặc trưng là biểu tượng gắn liền với Bách Khoa Hà Nội, điểm check-in của bao thế hệ sinh viên trên đường Đại Cồ Việt.',
        voiceText: 'Cổng Parabol là biểu tượng gắn liền với hình ảnh Bách Khoa Hà Nội.',
      },
      en: { name: 'Parabol Gate', short: 'Landmark', year: 'Icon since the 1960s' },
    },
    history: [
      { year: '1956', content: 'Trường Đại học Bách khoa Hà Nội thành lập (06/3/1956) – trường đại học kỹ thuật đầu tiên của Việt Nam.' },
      { year: '1960s', content: 'Cổng Parabol trên đường Đại Cồ Việt hình thành, trở thành biểu tượng kiến trúc của trường.' },
      { year: '2016', content: 'Cổng Parabol được tu bổ nhân kỷ niệm 60 năm.' },
    ],
  },
  {
    slug: 'c1', type: 'SPOT', mapX: 202, mapY: 395, order: 1,
    shape: { type: 'rect', w: 165, h: 130 }, palette: { sky: '#9cc4ec', ground: '#8a8170', bld: '#0a3d62' },
    i18n: {
      vi: {
        name: 'Tòa nhà C1', short: 'Nhà điều hành', year: 'Khu trung tâm lịch sử',
        description: 'Khu nhà C1 thuộc trung tâm khuôn viên, gắn với hoạt động điều hành và giảng dạy, lưu giữ nhiều dấu ấn lịch sử của nhà trường.',
        voiceText: 'Tòa nhà C1 là khu trung tâm lịch sử của Bách Khoa Hà Nội.',
      },
      en: { name: 'Building C1', short: 'Admin block', year: 'Historic central area' },
    },
    history: [
      { year: '1956', content: 'Khu nhà học đầu tiên phục vụ khóa sinh viên kỹ thuật đầu tiên của cả nước.' },
      { year: '1965', content: 'Trong chiến tranh, trường vẫn duy trì giảng dạy, không gián đoạn đào tạo.' },
      { year: '2022', content: 'Chuyển thành Đại học Bách khoa Hà Nội (mô hình đại học có trường thành viên).' },
    ],
  },
  {
    slug: 'library', type: 'SPOT', mapX: 485, mapY: 207, order: 2,
    shape: { type: 'rect', w: 170, h: 175 }, palette: { sky: '#aacdf0', ground: '#7d8a6a', bld: '#1565c0' },
    i18n: {
      vi: {
        name: 'Thư viện Tạ Quang Bửu', short: 'Thư viện', year: 'Khánh thành 2006',
        description: 'Thư viện Tạ Quang Bửu là tòa nhà 10 tầng nổi bật giữa khuôn viên, trung tâm tri thức với hàng trăm nghìn đầu sách và không gian học tập hiện đại.',
        voiceText: 'Chào mừng đến Thư viện Tạ Quang Bửu, trái tim tri thức của Bách Khoa.',
      },
      en: { name: 'Ta Quang Buu Library', short: 'Library', year: 'Opened 2006' },
    },
    history: [
      { year: '1956', content: 'Tủ sách kỹ thuật phục vụ giảng dạy được hình thành từ những ngày đầu.' },
      { year: '2006', content: 'Tòa thư viện hiện đại khánh thành, mang tên GS. Tạ Quang Bửu.' },
      { year: '2020', content: 'Số hóa kho học liệu, phát triển không gian học tập sáng tạo.' },
    ],
  },
  {
    slug: 'c2', type: 'SPOT', mapX: 232, mapY: 657, order: 3,
    shape: { type: 'rect', w: 185, h: 115 }, palette: { sky: '#bcd4ef', ground: '#7f8568', bld: '#37474f' },
    i18n: {
      vi: {
        name: 'Hội trường C2', short: 'Hội trường', year: 'Nơi tổ chức sự kiện',
        description: 'Hội trường C2 là nơi tổ chức các sự kiện lớn của trường: lễ tốt nghiệp, hội nghị, hội thảo khoa học và hoạt động sinh viên.',
        voiceText: 'Hội trường C2 là nơi tổ chức các sự kiện lớn của nhà trường.',
      },
      en: { name: 'C2 Hall', short: 'Hall', year: 'Events venue' },
    },
    history: [
      { year: '1956', content: 'Các buổi lễ và sinh hoạt học thuật lớn được tổ chức tại khu trung tâm.' },
      { year: '2000s', content: 'Hội trường C2 trở thành nơi diễn ra lễ tốt nghiệp, hội nghị khoa học.' },
    ],
  },
  {
    slug: 'stadium', type: 'EVENT', mapX: 500, mapY: 520, order: 4,
    shape: { type: 'stadium', rx: 140, ry: 92 }, palette: { sky: '#ffd27f', ground: '#9a7b4f', bld: '#7a3cc8' },
    i18n: {
      vi: {
        name: 'Sân vận động & Sân khấu lễ 70 năm', short: 'Sự kiện 70 năm', year: 'Sự kiện 2026',
        description: 'Sân vận động Bách Khoa được dựng sân khấu lớn cho lễ kỷ niệm 70 năm (1956–2026), kèm khu triển lãm ảnh và gian hàng truyền thống.',
        voiceText: 'Sân vận động là nơi diễn ra lễ kỷ niệm 70 năm thành lập trường.',
      },
      en: { name: 'Stadium & 70th Anniversary Stage', short: '70th event', year: 'Event 2026' },
    },
    history: [
      { year: '2026', content: 'Lễ kỷ niệm 70 năm: sân khấu chính, triển lãm "Xưa & Nay", gian hàng các trường/khoa.' },
      { year: '2026', content: 'Đêm gala hội ngộ các thế hệ cán bộ, giảng viên, sinh viên.' },
    ],
  },
];

const campaigns: any[] = [
  {
    slug: 'anniv70', icon: '⭐', enabled: true, order: 0,
    i18n: { vi: { name: 'Sự kiện 70 năm' }, en: { name: '70th Anniversary' } },
    schedule: [
      { time: '08:00', loc: 'stadium', live: true, title: { vi: 'Lễ khai mạc 70 năm' } },
      { time: '09:30', loc: 'library', live: true, title: { vi: 'Triển lãm "Xưa & Nay"' } },
      { time: '10:30', loc: 'c2', live: false, title: { vi: 'Tọa đàm cựu sinh viên' } },
      { time: '14:00', loc: 'c1', live: false, title: { vi: 'Tham quan phòng truyền thống' } },
      { time: '16:00', loc: 'parabol', live: false, title: { vi: 'Check-in Cổng Parabol' } },
      { time: '19:30', loc: 'stadium', live: false, title: { vi: 'Đêm Gala hội ngộ' } },
    ],
  },
  {
    slug: 'homecoming', icon: '🎓', enabled: false, order: 1,
    i18n: { vi: { name: 'BK – Ngày trở về' }, en: { name: 'BK Homecoming' } },
    schedule: [
      { time: '08:30', loc: 'parabol', live: false, title: { vi: 'Đón tiếp cựu sinh viên' } },
      { time: '10:00', loc: 'c2', live: false, title: { vi: 'Gặp mặt theo khoá tại Hội trường' } },
      { time: '15:00', loc: 'library', live: false, title: { vi: 'Tham quan thư viện mới' } },
    ],
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@bk360.local';
  const password = process.env.ADMIN_PASSWORD ?? 'change_me_admin_pass';
  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: process.env.ADMIN_NAME ?? 'Quản trị viên', role: Role.SUPERADMIN },
  });
  console.log(`✔ Superadmin: ${email}`);

  // project mặc định (multi-project sẵn sàng)
  const project = await prisma.project.upsert({
    where: { slug: process.env.DEFAULT_PROJECT_SLUG ?? 'bk360' },
    update: {},
    create: { slug: process.env.DEFAULT_PROJECT_SLUG ?? 'bk360', name: 'BK360 – Hành trình 70 năm', enabled: true, order: 0 },
  });
  console.log(`✔ Project: ${project.slug}`);

  for (const l of locations) {
    const data = { ...l, projectId: project.id };
    await prisma.location.upsert({ where: { slug: l.slug }, update: data, create: data });
  }
  console.log(`✔ ${locations.length} địa điểm`);

  for (const c of campaigns) {
    const data = { ...c, projectId: project.id };
    await prisma.campaign.upsert({ where: { slug: c.slug }, update: data, create: data });
  }
  console.log(`✔ ${campaigns.length} sự kiện`);
  console.log('Seed hoàn tất.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

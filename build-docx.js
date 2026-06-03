const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, TableOfContents, PageBreak, Header, Footer, PageNumber
} = require("docx");

const RED = "9E1B32", BLUE = "0A3D62", GOLD = "F5B301", GREY = "CCCCCC";
const CW = 9360; // content width US Letter, 1" margins

const border = { style: BorderStyle.SINGLE, size: 1, color: GREY };
const borders = { top: border, bottom: border, left: border, right: border };

// ---- helpers ----
function h1(t){return new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun(t)]});}
function h2(t){return new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun(t)]});}
function p(text,opts={}){return new Paragraph({spacing:{after:120},children:[new TextRun({text,...opts})]});}
function bullet(text){return new Paragraph({numbering:{reference:"bullets",level:0},spacing:{after:40},children:[new TextRun(text)]});}
function num(text){return new Paragraph({numbering:{reference:"nums",level:0},spacing:{after:40},children:[new TextRun(text)]});}

function cell(text,{w,fill,bold,color,head}={}){
  const runs = Array.isArray(text)? text : [new TextRun({text:String(text),bold:bold||head,color:head?"FFFFFF":(color||"222222")})];
  return new TableCell({
    borders, width:{size:w,type:WidthType.DXA},
    shading:fill?{fill,type:ShadingType.CLEAR}:undefined,
    margins:{top:80,bottom:80,left:120,right:120},
    children:[new Paragraph({children:runs})]
  });
}
function table(widths,rows){
  return new Table({
    width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},
    columnWidths:widths,
    rows:rows.map((cells,ri)=>new TableRow({children:cells.map((c,ci)=>
      cell(c,{w:widths[ci],fill:ri===0?BLUE:undefined,head:ri===0})
    )}))
  });
}

const children = [];

// ---- Cover ----
children.push(
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:1400,after:80},
    children:[new TextRun({text:"BK360 – HÀNH TRÌNH 70 NĂM",bold:true,size:48,color:RED,font:"Arial"})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},
    children:[new TextRun({text:"Ứng dụng tham quan ảo 360° – Đại học Bách khoa Hà Nội",size:26,color:BLUE})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:300},
    children:[new TextRun({text:"Kỷ niệm 70 năm thành lập trường · 1956 – 2026",size:22,italics:true,color:"555555"})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:1000},
    children:[new TextRun({text:"TÀI LIỆU TRIỂN KHAI KỸ THUẬT",bold:true,size:28,color:"333333"})]}),
  new Paragraph({alignment:AlignmentType.CENTER,
    children:[new TextRun({text:"Phiên bản prototype · index.html",size:20,color:"777777"})]}),
  new Paragraph({children:[new PageBreak()]})
);

// ---- TOC ----
children.push(
  new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun("Mục lục")]}),
  new TableOfContents("Mục lục",{hyperlink:true,headingStyleRange:"1-2"}),
  new Paragraph({children:[new PageBreak()]})
);

// ---- 1 ----
children.push(h1("1. Tổng quan"));
children.push(p("Ứng dụng cho phép khách tham quan “dạo” khắp khuôn viên Bách khoa Hà Nội qua ảnh 360°, kết hợp bản đồ campus, thông tin lịch sử từng địa điểm và các điểm tổ chức sự kiện 70 năm. Prototype là một file index.html chạy trực tiếp trên trình duyệt, không cần build."));
children.push(p("So sánh hiện trạng prototype và mục tiêu sản phẩm thật:",{bold:true}));
children.push(table([3000,3180,3180],[
  ["Hạng mục","Hiện trạng (prototype)","Mục tiêu sản phẩm"],
  ["Panorama 360°","Ảnh mô phỏng sinh bằng canvas","Ảnh 360° thật (equirectangular)"],
  ["Ảnh Xưa & Nay","Mô phỏng đen-trắng / màu","Ảnh tư liệu cũ + ảnh hiện tại"],
  ["Dữ liệu địa điểm","5 điểm mẫu HUST","Bổ sung/điều chỉnh thực tế"],
  ["Nội dung lịch sử","Tóm tắt sơ bộ","Xác minh với Phòng Truyền thống"],
  ["Nền tảng","Web (PWA-ready)","Deploy lên domain trường"],
]));
children.push(p(""));
children.push(p("Công nghệ: HTML/CSS/JS thuần · Three.js (cầu panorama) · qrcodejs (mã QR), nạp qua CDN."));
children.push(p("Tính năng đã có:",{bold:true}));
["Xoay nhìn 360° bằng chuột / cảm ứng","Chế độ con quay hồi chuyển (gyroscope) trên điện thoại","Hotspot di chuyển giữa các điểm + hotspot xem lịch sử","Bản đồ campus và danh sách điểm","Dòng thời gian lịch sử từng địa điểm","Slider so sánh “Xưa & Nay”","Thuyết minh giọng nói (Web Speech API)","Mã QR từng điểm + in bảng QR toàn bộ","Định tuyến theo #id (mỗi điểm một đường dẫn riêng)"
].forEach(t=>children.push(bullet(t)));

// ---- 2 ----
children.push(h1("2. Cấu trúc file index.html"));
children.push(table([2600,2200,4560],[
  ["Vùng","Vị trí","Vai trò"],
  ["<style>","đầu file","Giao diện, mobile-first + @media print"],
  ["LOCATIONS","đầu <script>","Dữ liệu địa điểm – sửa ở đây là chính"],
  ["makePano()","","Sinh panorama mô phỏng → thay bằng ảnh thật"],
  ["makeFacade()","","Sinh ảnh Xưa/Nay mô phỏng → thay bằng ảnh thật"],
  ["initThree / animate","","Dựng và render cầu 360°"],
  ["toggleGyro / onOrient","","Chế độ xoay điện thoại"],
  ["buildHotspots / openInfo","","Hotspot và panel lịch sử + Xưa&Nay"],
  ["openQR / printSheet","","Mã QR và bảng in"],
]));

// ---- 3 ----
children.push(h1("3. Chỉnh sửa dữ liệu địa điểm"));
children.push(p("Mỗi điểm là một object trong mảng LOCATIONS. Các trường chính:"));
children.push(table([2400,7] && [2400,6960],[
  ["Trường","Ý nghĩa"],
  ["id","Mã duy nhất, dùng cho URL #id và QR"],
  ["name / short","Tên hiển thị / nhãn ngắn trên bản đồ"],
  ["year","Dòng phụ (năm, sự kiện)"],
  ["map","Toạ độ pin trên bản đồ (viewBox 320×200)"],
  ["type","“spot” hoặc “event” (điểm sự kiện, màu tím)"],
  ["palette","Màu panorama mô phỏng (sky/ground/bld)"],
  ["links","Các điểm tới được (hotspot di chuyển)"],
  ["pano / before / after","Đường dẫn ảnh thật (thêm khi có – mục 4, 5)"],
  ["history","Mảng mốc thời gian {y, t}"],
  ["desc","Mô tả, dùng cho thuyết minh giọng nói"],
]));
children.push(p(""));
children.push(p("Thêm điểm mới: copy một object, đổi id, đặt toạ độ map, khai báo links. Pin và danh sách tự sinh.",{italics:true}));

// ---- 4 ----
children.push(h1("4. Thay panorama mô phỏng bằng ảnh 360° thật"));
[
  "Đặt ảnh equirectangular (tỉ lệ 2:1, ví dụ 4096×2048) vào thư mục images/360/.",
  "Thêm trường pano: “images/360/<id>.jpg” cho mỗi điểm trong LOCATIONS.",
  "Sửa hàm loadLocation() – đoạn nạp texture theo mẫu dưới đây.",
].forEach(t=>children.push(num(t)));
children.push(new Paragraph({shading:{fill:"F2F4F8",type:ShadingType.CLEAR},spacing:{before:80,after:80},
  children:[new TextRun({text:
    "if (loc.pano) {\n  new THREE.TextureLoader().load(loc.pano, tex => {\n    sphere.material.map = tex; sphere.material.needsUpdate = true;\n  });\n} else {\n  sphere.material.map = makePano(loc); sphere.material.needsUpdate = true;\n}",
    font:"Courier New",size:18})]}));
children.push(p("Giữ lại makePano() làm phương án dự phòng cho điểm chưa có ảnh.",{italics:true}));

// ---- 5 ----
children.push(h1("5. Thay ảnh Xưa & Nay thật"));
children.push(p("Trong hàm openInfo(), đổi 2 dòng <img> của khối .cmp để ưu tiên ảnh thật, fallback ảnh mô phỏng:"));
children.push(new Paragraph({shading:{fill:"F2F4F8",type:ShadingType.CLEAR},spacing:{before:80,after:80},
  children:[new TextRun({text:
    "<img class=\"before\" src=\"${loc.before || makeFacade(loc,'xua')}\">\n<img class=\"after\" id=\"cmpAfter\" src=\"${loc.after || makeFacade(loc,'nay')}\">",
    font:"Courier New",size:18})]}));
children.push(p("Khai báo before / after trong LOCATIONS. Mẹo: chụp ảnh xưa và nay cùng khung hình, cùng góc để slider so sánh ăn khớp."));

// ---- 6 ----
children.push(h1("6. Hướng dẫn chụp ảnh 360°"));
[
  "Thiết bị: Insta360 ONE X2/X3, GoPro MAX, hoặc DSLR + đầu panorama. Xuất định dạng equirectangular 2:1.",
  "Thời điểm: sáng sớm / chiều muộn, trời quang, ít người qua lại.",
  "Đặt máy: chân máy cao ~1.6 m (tầm mắt), giữa không gian, cân bằng (level).",
  "Hậu kỳ: che chân máy (nadir patch), cân sáng, nén còn ~1–3 MB/ảnh để tải nhanh.",
  "Đặt tên theo id: parabol.jpg, c1.jpg, library.jpg…",
  "Các điểm liền kề nên có góc nhìn thấy nhau để hotspot di chuyển hợp lý.",
].forEach(t=>children.push(bullet(t)));

// ---- 7 ----
children.push(h1("7. Mã QR và triển khai tại sự kiện"));
[
  "Nút ⊞ hiển thị QR điểm hiện tại; nút “In bảng tất cả điểm” sinh trang in 2 cột để dán tại trường.",
  "QR mã hoá URL …/index.html#<id> → quét vào thẳng điểm đó.",
  "Khi deploy lên domain thật, QR tự dùng domain mới (không cần sửa code).",
  "Hãy in QR SAU KHI đã có domain chính thức để tránh in lại.",
].forEach(t=>children.push(bullet(t)));

// ---- 8 ----
children.push(h1("8. Deploy"));
children.push(p("Vì là web tĩnh, chọn một trong các cách:"));
children.push(table([2600,3380,3380],[
  ["Cách","Phù hợp","Ghi chú"],
  ["Hosting trường (Apache/Nginx)","Chính thức","Upload thư mục, trỏ subdomain bk360.hust.edu.vn"],
  ["GitHub Pages / Netlify / Vercel","Nhanh, miễn phí","Kéo-thả thư mục, có HTTPS sẵn"],
  ["Cloudflare Pages","Tải nhanh, CDN","Tốt cho lượng truy cập lớn dịp lễ"],
]));
children.push(p(""));
children.push(p("Yêu cầu quan trọng:",{bold:true,color:RED}));
[
  "HTTPS bắt buộc – chế độ con quay (gyroscope) và thuyết minh chỉ chạy trên HTTPS.",
  "Nên tải Three.js và qrcodejs về cùng thư mục (thay link CDN) để không phụ thuộc mạng ngoài khi sự kiện đông.",
  "Thêm manifest.json + service worker để cài như app (PWA) – tuỳ chọn ở Phase 3.",
].forEach(t=>children.push(bullet(t)));

// ---- 9 ----
children.push(h1("9. Lộ trình đề xuất"));
children.push(table([1500,7860],[
  ["Giai đoạn","Nội dung"],
  ["Phase 1 – MVP","5–10 điểm ảnh 360° thật + lịch sử đã xác minh + QR. Khung đã sẵn sàng."],
  ["Phase 2","Thuyết minh thu âm thật, ảnh Xưa & Nay tư liệu, lịch sự kiện theo giờ, song ngữ Việt/Anh."],
  ["Phase 3","1–2 mô hình 3D điểm nhấn (glTF), kính VR Cardboard, PWA cài đặt offline."],
]));

// ---- 10 ----
children.push(h1("10. Việc cần chuẩn bị (ngoài kỹ thuật)"));
[
  "Chốt danh sách điểm quan trọng nhất (5–10).",
  "Xin tư liệu lịch sử & ảnh cũ từ Phòng Truyền thống / cựu sinh viên (xác minh mốc thời gian).",
  "Lịch chụp ảnh 360° (mượn/thuê thiết bị, chọn ngày trời đẹp).",
  "Đăng ký subdomain & SSL với phòng CNTT của trường.",
  "Bản quyền ảnh/nhạc thuyết minh nếu dùng nội dung bên ngoài.",
].forEach(t=>children.push(num(t)));

// ---- Document ----
const doc = new Document({
  creator:"BK360",
  styles:{
    default:{document:{run:{font:"Arial",size:22}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:30,bold:true,font:"Arial",color:RED},
        paragraph:{spacing:{before:280,after:160},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:25,bold:true,font:"Arial",color:BLUE},
        paragraph:{spacing:{before:200,after:120},outlineLevel:1}},
    ]
  },
  numbering:{config:[
    {reference:"bullets",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
    {reference:"nums",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:560,hanging:280}}}}]},
  ]},
  sections:[{
    properties:{page:{size:{width:12240,height:15840},margin:{top:1440,right:1440,bottom:1440,left:1440}}},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,
      children:[new TextRun({text:"BK360 – Hành trình 70 năm  ·  Trang ",size:16,color:"888888"}),
                new TextRun({children:[PageNumber.CURRENT],size:16,color:"888888"})]})]})},
    children
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync("BK360-Tai-lieu-trien-khai.docx",buf);
  console.log("WROTE BK360-Tai-lieu-trien-khai.docx");
});

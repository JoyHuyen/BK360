const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.33, height: 7.5 });
p.layout = "W";

const RED="9E1B32", RED2="C8102E", NAVY="0A3D62", INK="14233A", GOLD="F5B301",
      PAPER="F5F7FB", GREY="6B7686", LINE="DDE3EE", WHITE="FFFFFF";
const HF="Georgia", BF="Calibri";

// ---- phone mockup helper ----
function phone(s, x, y, h, screenImg, opts={}){
  const w = h*0.4865; // 375/812
  const r = 0.18;
  s.addShape(p.ShapeType.roundRect,{x:x-0.06,y:y-0.06,w:w+0.12,h:h+0.12,rectRadius:r+0.05,fill:{color:"1B2533"},line:{color:"000000",width:0.5},shadow:{type:"outer",blur:14,offset:4,angle:90,color:"000000",opacity:0.45}});
  if(screenImg) s.addImage({path:screenImg,x,y,w,h,rounding:true,sizing:{type:"cover",w,h}});
  else s.addShape(p.ShapeType.roundRect,{x,y,w,h,rectRadius:r,fill:{color:opts.bg||"0B1726"}});
  return {x,y,w,h};
}
function pill(s,x,y,w,txt,fill,col){
  s.addShape(p.ShapeType.roundRect,{x,y,w,h:0.34,rectRadius:0.17,fill:{color:fill},line:{type:"none"}});
  s.addText(txt,{x,y,w,h:0.34,align:"center",valign:"middle",fontFace:BF,fontSize:9.5,bold:true,color:col});
}

// =========================================================
// SLIDE 1 — TITLE
// =========================================================
let s = p.addSlide();
s.background = { color: NAVY };
s.addShape(p.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:NAVY}});
s.addImage({path:"pano-parabol.jpg",x:7.2,y:0,w:6.13,h:7.5,sizing:{type:"cover",w:6.13,h:7.5},transparency:35});
s.addShape(p.ShapeType.rect,{x:7.2,y:0,w:6.13,h:7.5,fill:{type:"solid",color:NAVY,transparency:35}});
s.addShape(p.ShapeType.roundRect,{x:0.7,y:1.0,w:3.0,h:0.5,rectRadius:0.25,fill:{color:GOLD},line:{type:"none"}});
s.addText("★ 1956 – 2026 · 70 NĂM",{x:0.7,y:1.0,w:3.0,h:0.5,align:"center",valign:"middle",fontFace:BF,fontSize:13,bold:true,color:"3A2B00"});
s.addText("BK360",{x:0.66,y:1.9,w:8,h:1.3,fontFace:HF,fontSize:84,bold:true,color:WHITE});
s.addText("Hành trình 70 năm",{x:0.7,y:3.15,w:9,h:0.9,fontFace:HF,fontSize:40,italic:true,color:GOLD});
s.addText("Ứng dụng tham quan ảo 360° – Đại học Bách khoa Hà Nội",{x:0.72,y:4.15,w:7.5,h:0.6,fontFace:BF,fontSize:18,color:"CADCFC"});
s.addText("Đề xuất ý tưởng & bản demo  ·  Tháng 5/2026",{x:0.72,y:6.55,w:8,h:0.4,fontFace:BF,fontSize:13,color:"8FA7C4"});

// =========================================================
// SLIDE 2 — BỐI CẢNH & CƠ HỘI
// =========================================================
s = p.addSlide(); s.background={color:WHITE};
s.addText("Bối cảnh & cơ hội",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
s.addText("Năm 2026 – tròn 70 năm thành lập trường (1956–2026). Một dịp hiếm để kể câu chuyện Bách Khoa với hàng vạn cựu sinh viên, học sinh và khách tham quan.",
  {x:0.7,y:1.35,w:12,h:0.9,fontFace:BF,fontSize:16,color:INK,lineSpacingMultiple:1.2});
const cards=[
  ["🎓","Cựu sinh viên ở xa","Nhiều thế hệ không thể về trường dịp lễ — cần một cách “trở lại” campus từ bất cứ đâu."],
  ["🏛️","Di sản cần lưu giữ","Cổng Parabol, các tòa nhà, ảnh tư liệu… chưa được số hóa và kể chuyện một cách hệ thống."],
  ["📱","Khách tham quan tại chỗ","Khách dự lễ cần định hướng, biết nơi diễn ra sự kiện và hiểu lịch sử từng địa điểm."],
];
cards.forEach((c,i)=>{
  const x=0.7+i*4.07;
  s.addShape(p.ShapeType.roundRect,{x,y:2.5,w:3.8,h:3.9,rectRadius:0.12,fill:{color:PAPER},line:{color:LINE,width:1}});
  s.addShape(p.ShapeType.ellipse,{x:x+0.35,y:2.9,w:0.95,h:0.95,fill:{color:RED}});
  s.addText(c[0],{x:x+0.35,y:2.9,w:0.95,h:0.95,align:"center",valign:"middle",fontSize:26});
  s.addText(c[1],{x:x+0.3,y:4.05,w:3.2,h:0.7,fontFace:HF,fontSize:18,bold:true,color:NAVY});
  s.addText(c[2],{x:x+0.3,y:4.8,w:3.25,h:1.5,fontFace:BF,fontSize:13.5,color:"42506A",lineSpacingMultiple:1.15});
});

// =========================================================
// SLIDE 3 — GIẢI PHÁP: BK360
// =========================================================
s = p.addSlide(); s.background={color:NAVY};
s.addText("Giải pháp: BK360",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:WHITE});
s.addText("Một web-app duy nhất — quét QR là vào, không cần cài đặt — đưa khách đi khắp campus qua ảnh 360°, kèm bản đồ và câu chuyện lịch sử của từng điểm.",
  {x:0.7,y:1.35,w:8.0,h:1.2,fontFace:BF,fontSize:16,color:"CADCFC",lineSpacingMultiple:1.25});
const vals=[
  ["360°","Đắm chìm trong không gian thật của trường"],
  ["5+","Địa điểm biểu tượng trong tour mở đầu"],
  ["1 chạm","Quét QR mở thẳng điểm tham quan"],
];
vals.forEach((v,i)=>{
  const y=2.9+i*1.35;
  s.addText(v[0],{x:0.7,y,w:2.1,h:1.1,fontFace:HF,fontSize:40,bold:true,color:GOLD,align:"left",valign:"middle"});
  s.addText(v[1],{x:2.9,y,w:5.8,h:1.1,fontFace:BF,fontSize:16,color:WHITE,valign:"middle"});
});
phone(s,9.7,1.0,5.5,"pano-parabol.jpg");

// =========================================================
// SLIDE 4 — TRẢI NGHIỆM 360°
// =========================================================
s = p.addSlide(); s.background={color:WHITE};
s.addText("Trải nghiệm tham quan 360°",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
// phone with panorama + recreated HUD
const ph=phone(s,0.9,1.4,5.6,"pano-library.jpg");
s.addShape(p.ShapeType.roundRect,{x:ph.x+0.12,y:ph.y+0.15,w:1.7,h:0.42,rectRadius:0.1,fill:{type:"solid",color:"081628",transparency:25}});
s.addText("☰  Bản đồ",{x:ph.x+0.12,y:ph.y+0.15,w:1.7,h:0.42,align:"center",valign:"middle",fontFace:BF,fontSize:9,color:WHITE});
s.addText("Thư viện Tạ Quang Bửu",{x:ph.x+0.12,y:ph.y+0.65,w:2.5,h:0.4,fontFace:BF,fontSize:11,bold:true,color:WHITE});
pill(s,ph.x+0.12,ph.y+ph.h-0.55,0.95,"🧭 Xoay",  "081628",WHITE);
pill(s,ph.x+1.12,ph.y+ph.h-0.55,1.0,"🎧 Thuyết minh","081628",WHITE);
const feats=[
  ["Kéo / vuốt để nhìn quanh","Xoay 360° mượt mà bằng chuột hoặc cảm ứng trên điện thoại."],
  ["Xoay điện thoại (gyroscope)","Nghiêng máy để nhìn quanh như đang đứng giữa sân trường."],
  ["Hotspot di chuyển","Chạm vòng tròn la bàn để “bước” sang địa điểm kế tiếp."],
  ["Thuyết minh giọng nói","Nghe giới thiệu từng điểm — rảnh tay, thân thiện cho mọi lứa tuổi."],
];
feats.forEach((f,i)=>{
  const y=1.7+i*1.28;
  s.addShape(p.ShapeType.ellipse,{x:4.4,y:y+0.05,w:0.5,h:0.5,fill:{color:GOLD}});
  s.addText(String(i+1),{x:4.4,y:y+0.05,w:0.5,h:0.5,align:"center",valign:"middle",fontFace:HF,fontSize:16,bold:true,color:"3A2B00"});
  s.addText(f[0],{x:5.05,y,w:7.5,h:0.5,fontFace:HF,fontSize:18,bold:true,color:NAVY});
  s.addText(f[1],{x:5.05,y:0.5+y,w:7.7,h:0.7,fontFace:BF,fontSize:13.5,color:"42506A",lineSpacingMultiple:1.1});
});

// =========================================================
// SLIDE 5 — TÍNH NĂNG CHÍNH (grid)
// =========================================================
s = p.addSlide(); s.background={color:PAPER};
s.addText("Tính năng chính",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
const grid=[
  ["🗺️","Bản đồ campus","Pin từng tòa nhà, chạm để tới thẳng điểm tham quan."],
  ["🕰️","Dòng thời gian","Mốc lịch sử từ 1956 đến nay cho mỗi địa điểm."],
  ["🖼️","Xưa & Nay","Kéo so sánh ảnh tư liệu cũ và hình ảnh hiện tại."],
  ["⭐","Điểm sự kiện 70 năm","Đánh dấu sân khấu, triển lãm, khu gian hàng dịp lễ."],
  ["📲","Mã QR mỗi điểm","Dán tại trường — quét vào thẳng panorama tương ứng."],
  ["🌐","Web, không cài đặt","Chạy trên mọi điện thoại; sẵn sàng song ngữ Việt/Anh."],
];
grid.forEach((g,i)=>{
  const col=i%3, row=Math.floor(i/3);
  const x=0.7+col*4.07, y=1.6+row*2.65;
  s.addShape(p.ShapeType.roundRect,{x,y,w:3.8,h:2.4,rectRadius:0.12,fill:{color:WHITE},line:{color:LINE,width:1}});
  s.addShape(p.ShapeType.ellipse,{x:x+0.3,y:y+0.32,w:0.85,h:0.85,fill:{color:i%2?NAVY:RED}});
  s.addText(g[0],{x:x+0.3,y:y+0.32,w:0.85,h:0.85,align:"center",valign:"middle",fontSize:22});
  s.addText(g[1],{x:x+1.3,y:y+0.35,w:2.35,h:0.8,fontFace:HF,fontSize:16.5,bold:true,color:NAVY,valign:"middle"});
  s.addText(g[2],{x:x+0.32,y:y+1.35,w:3.3,h:0.9,fontFace:BF,fontSize:12.5,color:"42506A",lineSpacingMultiple:1.1});
});

// =========================================================
// SLIDE 6 — LỊCH SỬ & XƯA/NAY
// =========================================================
s = p.addSlide(); s.background={color:WHITE};
s.addText("Kể chuyện 70 năm: Xưa & Nay",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
phone(s,9.5,0.95,5.7,null,{bg:"0B1726"});
const ph6=phone(s,9.5,0.95,5.7,null,{bg:"222"});
s.addImage({path:"pano-library.jpg",x:ph6.x,y:ph6.y,w:ph6.w,h:ph6.h*0.35,sizing:{type:"cover",w:ph6.w,h:ph6.h*0.35}});
s.addImage({path:"ui-info.png",x:ph6.x,y:ph6.y+0.55,w:ph6.w,h:ph6.h-0.55,sizing:{type:"contain",w:ph6.w,h:ph6.h-0.55}});
const story=[
  ["Mỗi địa điểm là một lát cắt lịch sử","Bấm biểu tượng ℹ️ để mở panel: mô tả, dòng thời gian các mốc quan trọng và slider so sánh ảnh."],
  ["Slider “Xưa & Nay”","Kéo thanh trắng để thấy cùng một góc trường thay đổi qua 70 năm — chạm vào cảm xúc của cựu sinh viên."],
  ["Tư liệu sống","Kết hợp ảnh từ Phòng Truyền thống và đóng góp của cựu sinh viên để làm giàu nội dung theo thời gian."],
];
story.forEach((t,i)=>{
  const y=1.7+i*1.55;
  s.addText(t[0],{x:0.7,y,w:8.3,h:0.5,fontFace:HF,fontSize:19,bold:true,color:NAVY});
  s.addText(t[1],{x:0.7,y:y+0.5,w:8.5,h:1.0,fontFace:BF,fontSize:14,color:"42506A",lineSpacingMultiple:1.2});
});

// =========================================================
// SLIDE 7 — BẢN ĐỒ & QR TẠI SỰ KIỆN
// =========================================================
s = p.addSlide(); s.background={color:PAPER};
s.addText("Bản đồ & mã QR tại sự kiện",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
const ph7=phone(s,0.9,0.95,5.7,null,{bg:"F5F7FB"});
s.addImage({path:"ui-drawer.png",x:ph7.x,y:ph7.y+0.15,w:ph7.w,h:ph7.h-0.2,sizing:{type:"contain",w:ph7.w,h:ph7.h-0.2}});
const qr=[
  ["Bản đồ campus tương tác","Khách thấy ngay mình có thể đi đâu, điểm nào đang diễn ra sự kiện 70 năm (pin tím)."],
  ["QR cho từng địa điểm","Mỗi tòa nhà một mã QR riêng → quét là mở thẳng panorama điểm đó, không cần dò tìm."],
  ["In bảng QR cho ban tổ chức","Một thao tác in ra bảng QR tất cả điểm, dán tại trường trong ngày lễ."],
  ["Sẵn sàng cho lượng truy cập lớn","Web tĩnh + CDN, chịu tải tốt khi hàng nghìn khách cùng quét."],
];
qr.forEach((t,i)=>{
  const y=1.55+i*1.32;
  s.addShape(p.ShapeType.ellipse,{x:7.0,y:y+0.05,w:0.45,h:0.45,fill:{color:RED}});
  s.addText("✓",{x:7.0,y:y+0.05,w:0.45,h:0.45,align:"center",valign:"middle",fontFace:BF,fontSize:14,bold:true,color:WHITE});
  s.addText(t[0],{x:7.6,y,w:5.4,h:0.5,fontFace:HF,fontSize:17.5,bold:true,color:NAVY});
  s.addText(t[1],{x:7.6,y:y+0.48,w:5.5,h:0.8,fontFace:BF,fontSize:13,color:"42506A",lineSpacingMultiple:1.12});
});

// =========================================================
// SLIDE 8 — CÔNG NGHỆ
// =========================================================
s = p.addSlide(); s.background={color:WHITE};
s.addText("Công nghệ & nền tảng",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
const tech=[
  ["VR360","Three.js dựng hình cầu panorama — sẵn sàng thay ảnh 360° thật."],
  ["3D điểm nhấn","glTF / model-viewer cho 1–2 biểu tượng (Cổng Parabol) ở giai đoạn sau."],
  ["Bản đồ 2D","SVG nhẹ, pin tương tác, dễ mở rộng thêm điểm."],
  ["Web / PWA","Chạy mọi thiết bị, cài như app, hoạt động cả khi mạng yếu."],
];
tech.forEach((t,i)=>{
  const col=i%2,row=Math.floor(i/2);
  const x=0.7+col*6.1,y=1.7+row*1.55;
  s.addShape(p.ShapeType.roundRect,{x,y,w:5.8,h:1.3,rectRadius:0.1,fill:{color:PAPER},line:{color:LINE,width:1}});
  s.addText(t[0],{x:x+0.25,y:y+0.15,w:2.0,h:1.0,fontFace:HF,fontSize:20,bold:true,color:RED,valign:"middle"});
  s.addText(t[1],{x:x+2.2,y:y+0.15,w:3.45,h:1.0,fontFace:BF,fontSize:13,color:"33425A",valign:"middle",lineSpacingMultiple:1.1});
});
s.addShape(p.ShapeType.roundRect,{x:0.7,y:4.95,w:11.9,h:1.7,rectRadius:0.1,fill:{color:NAVY}});
s.addText([
  {text:"Vì sao chọn Web?  ",options:{bold:true,color:GOLD,fontFace:HF,fontSize:17}},
  {text:"Khách chỉ cần quét QR là dùng ngay — không qua App Store, không chiếm dung lượng máy. Một bản chạy trên cả iOS, Android, máy tính. Lý tưởng cho sự kiện ngắn ngày, đông người.",options:{color:"E6EEF8",fontFace:BF,fontSize:14}}
],{x:1.0,y:5.1,w:11.3,h:1.4,valign:"middle",lineSpacingMultiple:1.2});

// =========================================================
// SLIDE 9 — LỘ TRÌNH
// =========================================================
s = p.addSlide(); s.background={color:NAVY};
s.addText("Lộ trình triển khai",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:WHITE});
const phases=[
  ["Phase 1","MVP — kịp lễ 70 năm","5–10 điểm ảnh 360° thật · lịch sử đã xác minh · bản đồ · mã QR. Khung phần mềm đã sẵn sàng.",GOLD,"3A2B00"],
  ["Phase 2","Làm giàu nội dung","Thuyết minh thu âm thật · ảnh Xưa & Nay tư liệu · lịch sự kiện theo giờ · song ngữ Việt/Anh.","CADCFC",NAVY],
  ["Phase 3","Nâng cao","Mô hình 3D điểm nhấn · kính VR Cardboard · PWA cài đặt & dùng offline.","97BC62","1B3A1B"],
];
phases.forEach((ph,i)=>{
  const x=0.7+i*4.07;
  s.addShape(p.ShapeType.roundRect,{x,y:1.7,w:3.8,h:4.6,rectRadius:0.12,fill:{color:"12324F"},line:{color:"1E466F",width:1}});
  s.addShape(p.ShapeType.roundRect,{x,y:1.7,w:3.8,h:0.95,rectRadius:0.12,fill:{color:ph[3]}});
  s.addText(ph[0],{x:x+0.3,y:1.78,w:3.2,h:0.8,fontFace:HF,fontSize:24,bold:true,color:ph[4],valign:"middle"});
  s.addText(ph[1],{x:x+0.3,y:2.85,w:3.2,h:0.8,fontFace:HF,fontSize:18,bold:true,color:WHITE});
  s.addText(ph[2],{x:x+0.3,y:3.7,w:3.25,h:2.4,fontFace:BF,fontSize:14,color:"CADCFC",lineSpacingMultiple:1.25});
});

// =========================================================
// SLIDE 10 — KINH PHÍ (minh hoạ)
// =========================================================
s = p.addSlide(); s.background={color:WHITE};
s.addText("Kinh phí dự kiến",{x:0.7,y:0.5,w:12,h:0.8,fontFace:HF,fontSize:34,bold:true,color:RED});
s.addText("Ước tính minh hoạ cho Phase 1–2 (cần khảo sát thực tế). Đơn vị: triệu đồng.",
  {x:0.7,y:1.3,w:12,h:0.5,fontFace:BF,fontSize:14,italic:true,color:GREY});
const rows=[
  ["Hạng mục","Phạm vi","Ước tính"],
  ["Thiết bị chụp 360° (thuê hoặc mua)","Insta360 / GoPro MAX","15 – 30"],
  ["Chụp & hậu kỳ ảnh 360° + tư liệu","~10 địa điểm","10 – 20"],
  ["Hoàn thiện & kiểm thử web-app","Phase 1–2","40 – 80"],
  ["Thu âm thuyết minh song ngữ","Việt + Anh","5 – 12"],
  ["Hosting, tên miền, vận hành 1 năm","HTTPS + CDN","3 – 6"],
  ["Dự phòng (~10%)","","8 – 15"],
  ["TỔNG (minh hoạ)","","~ 80 – 160"],
];
const colW=[6.0,3.4,2.5];
let ty=1.95;
rows.forEach((r,ri)=>{
  const head=ri===0, total=r[0].startsWith("TỔNG");
  const fill=head?NAVY:(total?GOLD:(ri%2?PAPER:WHITE));
  let cx=0.7;
  r.forEach((cellTxt,ci)=>{
    s.addShape(p.ShapeType.rect,{x:cx,y:ty,w:colW[ci],h:0.6,fill:{color:fill},line:{color:LINE,width:0.5}});
    s.addText(cellTxt,{x:cx+0.15,y:ty,w:colW[ci]-0.3,h:0.6,valign:"middle",align:ci===2?"right":"left",
      fontFace:head||total?HF:BF,fontSize:head?14:13.5,bold:head||total,
      color:head?WHITE:(total?"3A2B00":INK)});
    cx+=colW[ci];
  });
  ty+=0.6;
});

// =========================================================
// SLIDE 11 — KÊU GỌI
// =========================================================
s = p.addSlide(); s.background={color:RED};
s.addImage({path:"pano-stadium.jpg",x:0,y:0,w:13.33,h:7.5,sizing:{type:"cover",w:13.33,h:7.5},transparency:55});
s.addShape(p.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{type:"solid",color:RED,transparency:30}});
s.addText("Cùng đưa Bách Khoa\nbước vào không gian số",{x:0.9,y:1.6,w:11.5,h:2.2,fontFace:HF,fontSize:46,bold:true,color:WHITE,lineSpacingMultiple:1.05});
s.addText("Một món quà 70 năm cho mọi thế hệ sinh viên — chạm tay là về lại mái trường.",
  {x:0.95,y:3.95,w:10.5,h:0.8,fontFace:BF,fontSize:18,italic:true,color:"FFE9C7"});
const steps=["Chốt 5–10 địa điểm đầu tiên","Phối hợp Phòng Truyền thống xin tư liệu","Lên lịch chụp ảnh 360°"];
steps.forEach((t,i)=>{
  const x=0.95+i*4.05;
  s.addShape(p.ShapeType.roundRect,{x,y:5.1,w:3.7,h:1.2,rectRadius:0.1,fill:{type:"solid",color:"FFFFFF",transparency:12}});
  s.addText("0"+(i+1),{x:x+0.2,y:5.2,w:1,h:0.5,fontFace:HF,fontSize:22,bold:true,color:GOLD});
  s.addText(t,{x:x+0.2,y:5.62,w:3.35,h:0.6,fontFace:BF,fontSize:12.5,bold:true,color:WHITE,valign:"top"});
});

p.writeFile({ fileName: "BK360-Gioi-thieu.pptx" }).then(f=>console.log("WROTE", f));

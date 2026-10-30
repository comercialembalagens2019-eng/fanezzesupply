// Renders the PNG assets the order e-mail uses (e-mail clients do not load SVG icons
// or web fonts reliably): white logo for the navy footer, lucide icons, the hero photo
// with a handwritten note, and the sign-off note. Output: public/email/*.png at 2x.
// Usage: node scripts/build-email-assets.mjs
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as icons from "lucide-react";
import { chromium } from "@playwright/test";

const OUT = path.resolve("public/email");
const NAVY = "#1B2845";
const GREEN = "#15803D";
const AMBER = "#B45309";
mkdirSync(OUT, { recursive: true });

const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`;
const logo = dataUri("src/assets/fnz-logo.png", "image/png");
const svg = (name, color, size, strokeWidth = 2) =>
  renderToStaticMarkup(createElement(icons[name], { color, size, strokeWidth }));

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Manrope:wght@600;800&display=swap" rel="stylesheet">`;

// [file, width, height, html]
const assets = [
  ["icon-check-badge.png", 48, 48, `<div style="width:48px;height:48px;border-radius:24px;background:${GREEN};display:grid;place-items:center">${svg("Check", "#fff", 28, 3)}</div>`],
  ["icon-check-small.png", 18, 18, `<div style="width:18px;height:18px;border-radius:9px;background:${GREEN};display:grid;place-items:center">${svg("Check", "#fff", 12, 3.5)}</div>`],
  ["icon-order.png", 40, 40, `<div style="width:40px;height:40px;border-radius:12px;background:#EEF0F4;display:grid;place-items:center">${svg("Package", NAVY, 22)}</div>`],
  ["icon-confirmed.png", 28, 28, svg("CalendarCheck", NAVY, 28, 1.75)],
  ["icon-truck.png", 28, 28, svg("Truck", NAVY, 28, 1.75)],
  ["icon-headset.png", 28, 28, svg("Headset", NAVY, 28, 1.75)],
  ["icon-package.png", 28, 28, svg("Package", NAVY, 28, 1.75)],
  ["icon-truck-amber.png", 36, 36, `<div style="width:36px;height:36px;border-radius:18px;background:#FDE7B0;display:grid;place-items:center">${svg("Truck", AMBER, 20)}</div>`],
  ["icon-quality.png", 44, 44, `<div style="width:44px;height:44px;border-radius:22px;background:#FACC15;display:grid;place-items:center">${svg("Boxes", NAVY, 24)}</div>`],
  ["icon-whatsapp-white.png", 22, 22, svg("MessageCircle", "#fff", 22)],
  ["icon-globe-white.png", 22, 22, svg("Globe", "#fff", 22)],
  ["fnz-logo-white.png", 104, 44, `<canvas id="c" width="208" height="88" style="width:104px;height:44px"></canvas>
    <script>const i=new Image();i.onload=()=>{const c=document.getElementById('c').getContext('2d');c.drawImage(i,0,0,208,88);
    const d=c.getImageData(0,0,208,88);for(let p=0;p<d.data.length;p+=4){const[r,g,b]=[d.data[p],d.data[p+1],d.data[p+2]];
    if(!(r>150&&g>110&&b<110)){d.data[p]=255;d.data[p+1]=255;d.data[p+2]=255;}}c.putImageData(d,0,0);document.body.dataset.ready=1};i.src='${logo}'</script>`],
  // Product scene: a branded box with the envelope leaning on it, fading into the white card on the left.
  // Spans the whole header card, so the tagline is part of the picture.
  ["hero.png", 260, 400, `<div style="position:relative;width:260px;height:400px;overflow:hidden;
      -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 14%);mask-image:linear-gradient(90deg,transparent 0,#000 14%);
      background:radial-gradient(130% 70% at 85% 10%,#FFFFFF 0%,#F6F2EC 55%,#EDE5D8 100%)">
    <div style="position:absolute;right:28px;top:26px;font:600 13px/1.4 Manrope,sans-serif;color:#5B6478;text-align:right">Qualidade em<br>cada embalagem.</div>
    <div style="position:absolute;left:0;top:100px;width:260px;height:300px;font-family:Caveat,cursive">
    <div style="position:absolute;left:0;right:0;bottom:0;height:96px;background:linear-gradient(180deg,#E8DCC9,#DDCDB5)"></div>
    <div style="position:absolute;right:22px;top:40px;width:30px;height:28px;background:#E7E2DA;border-radius:4px 4px 8px 8px;box-shadow:inset 0 -6px 0 #D6CFC4"></div>
    ${[[-38, 30, "#5E8C4F"], [-12, 18, "#6E9D5C"], [14, 26, "#4F7D44"], [40, 20, "#6E9D5C"], [-60, 14, "#7DAA69"]]
      .map(([deg, h, c]) => `<div style="position:absolute;right:${32 - deg / 6}px;top:${8 + (40 - h) / 2}px;width:12px;height:${h + 14}px;background:${c};border-radius:50% 50% 50% 50%/60% 60% 40% 40%;transform-origin:bottom center;transform:rotate(${deg}deg)"></div>`)
      .join("")}
    <div style="position:absolute;right:-6px;top:62px;width:150px;height:26px;background:#D7A56C;transform:skewX(-35deg);transform-origin:bottom left"></div>
    <div style="position:absolute;right:46px;top:62px;width:16px;height:26px;background:rgba(255,255,255,.35);transform:skewX(-35deg);transform-origin:bottom left"></div>
    <div style="position:absolute;right:-24px;top:88px;width:150px;height:116px;background:linear-gradient(180deg,#C8935A,#B57F48);box-shadow:0 14px 18px -10px rgba(60,40,20,.45)">
      <img src="${logo}" style="position:absolute;left:22px;top:30px;width:80px">
    </div>
    ${[[30, 70, -5], [46, 82, -13]]
      .map(([left, top, deg]) => `<div style="position:absolute;left:${left}px;top:${top}px;width:98px;height:124px;transform:rotate(${deg}deg);border-radius:5px;
        background:linear-gradient(155deg,#FFFFFF 0%,#F1F3F6 45%,#E3E6EB 75%,#F6F7F9 100%);box-shadow:0 12px 16px -8px rgba(30,30,40,.35),inset 0 0 0 1px rgba(0,0,0,.05)">
        <div style="height:13px;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#2A2A2E,#141416)"></div>
        <div style="height:3px;background:linear-gradient(90deg,#9AA0A8,#E6E8EB,#9AA0A8)"></div>
        <img src="${logo}" style="position:absolute;right:10px;top:26px;width:30px;opacity:.85">
        <div style="position:absolute;left:10px;right:10px;bottom:14px;height:28px;border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.7),rgba(255,255,255,0))"></div>
      </div>`)
      .join("")}
    <div style="position:absolute;right:14px;bottom:10px;transform:rotate(-8deg);color:${NAVY};font-size:23px;line-height:1.02;text-align:right;font-weight:700">
      Obrigado<br>por confiar<br>na FNZ Supply!<div style="font-size:20px;line-height:.8">⟶</div></div></div>
</div>`],
  ["note-signoff.png", 170, 64, `<div style="width:170px;height:64px;font-family:Caveat,cursive;color:${NAVY};font-size:24px;font-weight:700;line-height:1.05;text-align:right;transform:rotate(-6deg);padding-top:6px">
    Conte sempre com<br>a FNZ Supply! ♡</div>`],
];

const browser = await chromium.launch(
  process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {},
);
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [file, width, height, html] of assets) {
  await page.setViewportSize({ width, height });
  page.removeAllListeners("pageerror"); page.on("pageerror", (e) => console.error(file, e.message));
  await page.setContent(`<!doctype html><html><head>${FONTS}<style>html,body{margin:0;background:transparent}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  if (html.includes("<canvas")) await page.waitForSelector("body[data-ready]");
  await page.screenshot({ path: path.join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width, height } });
  console.log("wrote", file);
}
await browser.close();

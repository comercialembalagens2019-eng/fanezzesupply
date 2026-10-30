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
const envelope = dataUri("src/assets/envelope.webp", "image/webp");
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
  ["hero.png", 220, 260, `<div style="position:relative;width:220px;height:260px;font-family:Caveat,cursive">
    <img src="${envelope}" style="position:absolute;top:0;left:0;width:220px;height:176px;object-fit:cover;border-radius:18px">
    <div style="position:absolute;right:6px;bottom:6px;transform:rotate(-7deg);color:${NAVY};font-size:24px;line-height:1.05;text-align:right;font-weight:700">
      Obrigado por confiar<br>na FNZ Supply!<div style="margin-top:2px;font-size:22px">⟶</div></div></div>`],
  ["note-signoff.png", 170, 64, `<div style="width:170px;height:64px;font-family:Caveat,cursive;color:${NAVY};font-size:24px;font-weight:700;line-height:1.05;text-align:right;transform:rotate(-6deg);padding-top:6px">
    Conte sempre com<br>a FNZ Supply! ♡</div>`],
];

const browser = await chromium.launch(
  process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {},
);
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [file, width, height, html] of assets) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><head>${FONTS}<style>html,body{margin:0;background:transparent}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  if (html.includes("<canvas")) await page.waitForSelector("body[data-ready]");
  await page.screenshot({ path: path.join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width, height } });
  console.log("wrote", file);
}
await browser.close();

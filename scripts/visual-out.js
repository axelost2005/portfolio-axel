const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SP = process.argv[2];
const SEL = process.argv[3];
const NAME = process.argv[4];

async function grab(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(1500);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await sleep(2500);
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), SEL);
  await sleep(900);
  const el = await p.$(SEL);
  const png = await el.screenshot({ type: "png" });
  await b.close();
  return png;
}

(async () => {
  const a = await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const b = await grab("http://localhost:3457/");
  const ma = await sharp(a).metadata();
  const w = ma.width,
    h = Math.min(ma.height, (await sharp(b).metadata()).height);
  const crop = { left: 0, top: 0, width: w, height: h };
  const ra = await sharp(a).extract(crop).removeAlpha().raw().toBuffer();
  const rb = await sharp(b).extract(crop).removeAlpha().raw().toBuffer();

  // mapa de diferencia amplificado
  const out = Buffer.alloc(ra.length);
  for (let i = 0; i < ra.length; i++) {
    out[i] = Math.min(255, Math.abs(ra[i] - rb[i]) * 6);
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .resize({ width: 900 })
    .png()
    .toFile(`${SP}/diff-${NAME}.png`);
  await sharp(a).resize({ width: 900 }).png().toFile(`${SP}/exp-${NAME}.png`);
  await sharp(b).resize({ width: 900 }).png().toFile(`${SP}/nxt-${NAME}.png`);
  console.log(`escrito diff-${NAME}.png (${w}x${h}, diferencia x6)`);
})();

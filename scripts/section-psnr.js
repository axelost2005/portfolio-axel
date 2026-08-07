const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SECTIONS = [
  ["hero", "section"],
  ["stack", "#stack"],
  ["about", "#about"],
  ["services", "#services"],
  ["projects", "#projects"],
  ["footer", "#contact"],
];

async function grab(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(1500);

  // 1) recorre toda la pagina para disparar y terminar TODOS los fades
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await sleep(2500);

  // 2) deja el parrafo animado completamente iluminado y quieto
  await p.evaluate(() => {
    const el = document.querySelector("[data-animtext]");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4;
    window.scrollTo(0, y);
  });
  await sleep(1200);

  const shots = {};
  for (const [name, sel] of SECTIONS) {
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), sel);
    await sleep(900);
    const el = await p.$(sel);
    shots[name] = await el.screenshot({ type: "png" });
  }
  await b.close();
  return shots;
}

async function psnr(a, b) {
  const ma = await sharp(a).metadata();
  const mb = await sharp(b).metadata();
  const w = Math.min(ma.width, mb.width),
    h = Math.min(ma.height, mb.height);
  const crop = { left: 0, top: 0, width: w, height: h };
  const ra = await sharp(a).extract(crop).removeAlpha().raw().toBuffer();
  const rb = await sharp(b).extract(crop).removeAlpha().raw().toBuffer();
  let se = 0,
    maxd = 0,
    diff = 0;
  for (let i = 0; i < ra.length; i++) {
    const d = Math.abs(ra[i] - rb[i]);
    if (d > 2) diff++;
    if (d > maxd) maxd = d;
    se += d * d;
  }
  const mse = se / ra.length;
  return {
    dims: `${ma.width}x${ma.height} vs ${mb.width}x${mb.height}`,
    psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
    pctDistinto: ((diff / ra.length) * 100).toFixed(2),
    maxDelta: maxd,
  };
}

(async () => {
  const ex = await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await grab("http://localhost:3457/");
  console.log("seccion     dimensiones                PSNR      subpix>2  delta max");
  for (const [name] of SECTIONS) {
    const r = await psnr(ex[name], nx[name]);
    console.log(
      `  ${name.padEnd(10)} ${r.dims.padEnd(24)} ${(r.psnr === Infinity ? "identico" : r.psnr.toFixed(2) + " dB").padEnd(10)} ${(r.pctDistinto + "%").padEnd(9)} ${r.maxDelta}`,
    );
  }
})();

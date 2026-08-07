const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SECTION = process.argv[2] || "#about";
const NAME = process.argv[3] || "about";

async function shot(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), SECTION);
  await sleep(1500);
  const el = await p.$(SECTION);
  const png = await el.screenshot({ type: "png" });
  // además, la caja de cada elemento hijo directo, para poder nombrar la zona
  const boxes = await p.evaluate((s) => {
    const sec = document.querySelector(s);
    const top = sec.getBoundingClientRect().top;
    const out = [];
    const walk = (el, depth) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        if (r.width > 20 && r.height > 10) {
          out.push({
            tag: c.tagName.toLowerCase() + (c.className ? "." + String(c.className).split(" ")[0] : ""),
            txt: (c.textContent || "").trim().slice(0, 18),
            x: Math.round(r.left),
            y: Math.round(r.top - top),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
        if (depth < 2) walk(c, depth + 1);
      }
    };
    walk(sec, 0);
    return out;
  }, SECTION);
  await b.close();
  return { png, boxes };
}

(async () => {
  const ex = await shot("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await shot("http://localhost:3457/");

  const ma = await sharp(ex.png).metadata();
  const mb = await sharp(nx.png).metadata();
  const W = Math.min(ma.width, mb.width),
    H = Math.min(ma.height, mb.height);
  const crop = { left: 0, top: 0, width: W, height: H };
  const a = await sharp(ex.png).extract(crop).removeAlpha().raw().toBuffer();
  const b = await sharp(nx.png).extract(crop).removeAlpha().raw().toBuffer();

  const COLS = 12,
    ROWS = Math.max(6, Math.round((H / W) * COLS * 1.2));
  const cw = Math.floor(W / COLS),
    ch = Math.floor(H / ROWS);
  const cells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      let se = 0,
        n = 0;
      for (let y = r * ch; y < (r + 1) * ch; y++)
        for (let x = c * cw; x < (c + 1) * cw; x++) {
          const i = (y * W + x) * 3;
          for (let k = 0; k < 3; k++) {
            const d = a[i + k] - b[i + k];
            se += d * d;
            n++;
          }
        }
      const mse = se / n;
      cells.push({
        c,
        r,
        x: c * cw,
        y: r * ch,
        psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
      });
    }

  cells.sort((p, q) => p.psnr - q.psnr);
  console.log(`### ${NAME}: ${W}x${H}, celdas de ${cw}x${ch}`);
  console.log("\nlas 8 zonas con mas diferencia:");
  for (const z of cells.slice(0, 8)) {
    const near = ex.boxes
      .filter((bx) => z.x < bx.x + bx.w && z.x + cw > bx.x && z.y < bx.y + bx.h && z.y + ch > bx.y)
      .slice(0, 2)
      .map((bx) => `${bx.tag}"${bx.txt}"`)
      .join(", ");
    console.log(
      `  (${String(z.x).padStart(4)},${String(z.y).padStart(4)})  ${z.psnr.toFixed(1)} dB   ${near || "(fondo)"}`,
    );
  }
  const good = cells.filter((z) => z.psnr > 40).length;
  console.log(`\n${good} de ${cells.length} celdas por encima de 40 dB`);
})();

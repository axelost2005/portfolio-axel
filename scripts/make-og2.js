const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ROOT = require("path").resolve(__dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const W = 1200,
  H = 630,
  DPR = 2;

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "language", { get: () => "es-AR" });
    try {
      localStorage.setItem("axel-lang", "es");
    } catch {}
  });
  await page.goto("http://localhost:3457/", { waitUntil: "networkidle2" });
  await sleep(3500);

  // 1) fondo + textos, con el retrato oculto
  await page.evaluate(() => {
    const img = document.querySelector('img[alt*="etrato"], img[alt*="ortrait"]');
    img.dataset.ogHidden = "1";
    img.style.visibility = "hidden";
  });
  await sleep(300);
  const base = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: W, height: H },
  });

  // 2) el retrato solo, con alpha
  await page.evaluate(() => {
    const img = document.querySelector("img[data-og-hidden]");
    img.style.visibility = "visible";
    // anula el magnet/sway para que no salga desplazado
    img.style.transform = "none";
    const sway = img.closest("div[style*='animation']");
    if (sway) sway.style.animation = "none";
  });
  await sleep(400);
  const portraitEl = await page.$('img[alt*="etrato"], img[alt*="ortrait"]');
  const portrait = await portraitEl.screenshot({ type: "png", omitBackground: true });

  await browser.close();

  // 3) composición: cara completa, con aire abajo
  const pm = await sharp(portrait).metadata();
  const targetH = Math.round(350 * DPR); // alto del retrato en el lienzo 2x
  const targetW = Math.round((pm.width / pm.height) * targetH);
  const resized = await sharp(portrait).resize(targetW, targetH).png().toBuffer();

  // sharp aplica resize ANTES que composite, así que van en dos pasadas.
  const composed = await sharp(base)
    .composite([
      {
        input: resized,
        left: Math.round((W * DPR - targetW) / 2),
        top: Math.round(H * DPR - targetH - 44 * DPR), // 44px de aire contra el borde
      },
    ])
    .png()
    .toBuffer();

  const out = await sharp(composed)
    .resize(W, H, { kernel: "lanczos3" })
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(`${ROOT}/public/og.jpg`);

  console.log(`og.jpg ${out.width}x${out.height}  ${(out.size / 1024).toFixed(1)} KB`);
})();

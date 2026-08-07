const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Posiciones de scroll relativas al párrafo, para barrer la animación. */
const STOPS = [
  ["parrafo entrando por abajo", 0.85],
  ["parrafo a 60% de la pantalla", 0.6],
  ["parrafo centrado", 0.5],
  ["parrafo a 35%", 0.35],
];

async function run(url) {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);

  const res = [];
  for (const [name, frac] of STOPS) {
    await page.evaluate((frac) => {
      const p = document.querySelector("[data-animtext]");
      const y = p.getBoundingClientRect().top + window.scrollY - window.innerHeight * frac;
      window.scrollTo(0, y);
    }, frac);
    await sleep(900); // deja terminar la transicion de 0.25s

    const s = await page.evaluate(() => {
      const chars = [...document.querySelectorAll("[data-animtext] span span")];
      const ops = chars.map((c) => parseFloat(getComputedStyle(c).opacity));
      const full = ops.filter((o) => o >= 0.995).length;
      return {
        n: ops.length,
        primera: ops[0].toFixed(2),
        ultima: ops[ops.length - 1].toFixed(2),
        min: Math.min(...ops).toFixed(2),
        enOpacidad1: full,
        pctCompleto: Math.round((full / ops.length) * 100) + "%",
      };
    });
    res.push([name, s]);
  }
  await browser.close();
  return res;
}

(async () => {
  const ex = await run("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await run("http://localhost:3457/");
  let bad = 0;
  for (let i = 0; i < ex.length; i++) {
    const [name, a] = ex[i];
    const b = nx[i][1];
    const match = a.ultima === b.ultima && a.pctCompleto === b.pctCompleto;
    if (!match) bad++;
    console.log(`\n${match ? "OK  " : "FALLA"} ${name}`);
    console.log("   export:", JSON.stringify(a));
    console.log("   next  :", JSON.stringify(b));
  }
  console.log(`\n===== ${ex.length - bad} coinciden, ${bad} fallan =====`);
})();

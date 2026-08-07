const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ITEMS = [
  ["h2 services", "#services h2"],
  ["numero servicio", "[data-svc-row] > span"],
  ["titulo servicio", "[data-svc-row] h3"],
  ["h2 about", "#about h2"],
  ["h2 projects", "#projects h2"],
  ["h2 footer", "#contact h2"],
  ["tagline hero", "section p"],
];

async function grab(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(1000);
  // recorre toda la pagina para disparar y terminar todos los fades
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await sleep(3000);
  const out = await p.evaluate((ITEMS) => {
    const res = {};
    for (const [n, sel] of ITEMS) {
      const el = document.querySelector(sel);
      if (!el) {
        res[n] = "FALTA";
        continue;
      }
      const cs = getComputedStyle(el);
      res[n] = {
        transform: cs.transform,
        willChange: cs.willChange,
        opacity: cs.opacity,
        inlineTransform: el.style.transform || "(vacio)",
      };
    }
    return res;
  }, ITEMS);
  await b.close();
  return out;
}

(async () => {
  const ex = await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await grab("http://localhost:3457/");
  let bad = 0;
  for (const [n] of ITEMS) {
    const a = ex[n],
      b = nx[n];
    const same = JSON.stringify(a) === JSON.stringify(b);
    if (!same) bad++;
    console.log(`${same ? "OK   " : "DIF  "} ${n}`);
    if (!same) {
      console.log("   export:", JSON.stringify(a));
      console.log("   next  :", JSON.stringify(b));
    }
  }
  console.log(`\n${ITEMS.length - bad} iguales, ${bad} distintos`);
})();

/**
 * Chequeos alrededor del hero que no cubre hero-timeline.js:
 * reduced motion, cambio de idioma, resize y alturas del resto de la pagina.
 *
 *   node scripts/hero-regress.js [url]
 */
const puppeteer = require("puppeteer-core");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.argv[2] || "http://localhost:3457/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const geom = () => {
  const h1 = document.querySelector("h1");
  const gap = document.querySelector("[data-hero-gap]");
  const por = document.querySelector("[data-hero-portrait]");
  const sec = document.querySelector("section");
  const cs = getComputedStyle(sec);
  return {
    fs: Math.round(parseFloat(getComputedStyle(h1).fontSize) * 100) / 100,
    gap: gap.offsetHeight,
    porTop: por.offsetTop,
    h1Top: h1.offsetTop,
    vis: cs.visibility,
    op: Math.round(parseFloat(getComputedStyle(h1).opacity) * 1000) / 1000,
    secH: Math.round(sec.getBoundingClientRect().height),
  };
};

const sections = () =>
  ["#stack", "#about", "#services", "#projects", "#contact"].map((s) => {
    const el = document.querySelector(s);
    return [s, el ? Math.round(el.getBoundingClientRect().height) : null];
  });

async function open(browser, { reduced = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(URL, { waitUntil: "networkidle2" });
  return page;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--window-size=1440,900"],
  });

  console.log("### reduced motion: el hero tiene que verse desde el primer frame");
  {
    const page = await open(browser, { reduced: true });
    const early = await page.evaluate(geom);
    await sleep(2500);
    const late = await page.evaluate(geom);
    console.log(`  al cargar : visibility=${early.vis} opacidad=${early.op}`);
    console.log(`  a los 2.5s: visibility=${late.vis} opacidad=${late.op}`);
    console.log(
      `  ${early.vis === "visible" && early.op === 1 ? "OK" : "FALLA"}  ` +
        `final fs=${late.fs} gap=${late.gap} retrato=${late.porTop}`,
    );
    await page.close();
  }

  console.log("\n### idioma: al togglear cambia el texto del h1 y hay que remedir");
  {
    const page = await open(browser);
    await sleep(2500);
    const es = await page.evaluate(geom);
    const esTxt = await page.evaluate(() => document.querySelector("h1").textContent.trim());
    await page.evaluate(() => document.querySelector("nav button").click());
    await sleep(1500);
    const en = await page.evaluate(geom);
    const enTxt = await page.evaluate(() => document.querySelector("h1").textContent.trim());
    console.log(`  es "${esTxt}"  fs=${es.fs} gap=${es.gap} retrato=${es.porTop} vis=${es.vis}`);
    console.log(`  en "${enTxt}"  fs=${en.fs} gap=${en.gap} retrato=${en.porTop} vis=${en.vis}`);
    console.log(
      `  ${esTxt !== enTxt && en.vis === "visible" && en.gap > 0 ? "OK" : "FALLA"}` +
        `  (el h1 se reajusta al texto nuevo)`,
    );
    await page.close();
  }

  console.log("\n### resize: tiene que volver a medir");
  {
    const page = await open(browser);
    await sleep(2500);
    const a = await page.evaluate(geom);
    await page.setViewport({ width: 1100, height: 900 });
    await sleep(900);
    const b = await page.evaluate(geom);
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(900);
    const c = await page.evaluate(geom);
    console.log(`  1440: fs=${a.fs} gap=${a.gap}`);
    console.log(`  1100: fs=${b.fs} gap=${b.gap}`);
    console.log(`  1440: fs=${c.fs} gap=${c.gap}`);
    console.log(
      `  ${b.fs !== a.fs && c.fs === a.fs && c.gap === a.gap ? "OK" : "FALLA"}` +
        `  (vuelve al mismo valor)`,
    );
    await page.close();
  }

  console.log("\n### resto de la pagina: alturas de seccion");
  {
    const page = await open(browser);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
    });
    await sleep(2500);
    const rows = await page.evaluate(sections);
    const hero = await page.evaluate(geom);
    console.log(`  hero      ${hero.secH}`);
    for (const [s, h] of rows) console.log(`  ${s.padEnd(10)}${h}`);
    await page.close();
  }

  await browser.close();
})();

const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:3457/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Se instala antes de cualquier script de la página. */
async function instrument(page, navLang) {
  await page.evaluateOnNewDocument((lang) => {
    Object.defineProperty(navigator, "language", { get: () => lang });
    Object.defineProperty(navigator, "languages", { get: () => [lang] });
    window.__timeline = [];
    window.__fcp = null;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === "first-contentful-paint") window.__fcp = Math.round(e.startTime);
      }
    }).observe({ type: "paint", buffered: true });
    const record = () => {
      const h1 = document.querySelector("h1");
      if (!h1) return;
      const t = h1.textContent.trim();
      const last = window.__timeline[window.__timeline.length - 1];
      if (!last || last.text !== t) {
        window.__timeline.push({ text: t, at: Math.round(performance.now()) });
      }
    };
    new MutationObserver(record).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    document.addEventListener("DOMContentLoaded", record);
  }, navLang);
}

const state = () =>
  ({
    htmlLang: document.documentElement.lang,
    h1: document.querySelector("h1").textContent.trim(),
    stored: localStorage.getItem("axel-lang"),
    wa: decodeURIComponent(
      document.querySelector('a[href*="wa.me"]').getAttribute("href"),
    ).split("text=")[1],
    alt: document.querySelector('img[alt*="etrato"], img[alt*="ortrait"]').alt,
    aria: document.querySelector("nav button").getAttribute("aria-label"),
  });

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });

  for (const navLang of ["en-US", "es-AR"]) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await instrument(page, navLang);
    await page.goto(URL, { waitUntil: "networkidle2" });
    await sleep(1500);
    const s = await page.evaluate(state);
    const tl = await page.evaluate(() => ({ fcp: window.__fcp, tl: window.__timeline }));
    console.log(`\n### primera visita, navigator.language = ${navLang}`);
    console.log(`  html lang = "${s.htmlLang}"   h1 = "${s.h1}"   localStorage = ${s.stored}`);
    console.log(`  FCP a los ${tl.fcp}ms | timeline del h1: ${JSON.stringify(tl.tl)}`);
    await ctx.close();
  }

  // Persistencia: toggle, recarga, y que el guardado le gane a navigator.language
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await instrument(page, "es-AR");
  await page.goto(URL, { waitUntil: "networkidle2" });
  await sleep(1000);
  console.log("\n### persistencia (navigator.language = es-AR siempre)");
  console.log("  inicial   :", JSON.stringify(await page.evaluate(state), null, 0));
  await page.evaluate(() => document.querySelector("nav button").click());
  await sleep(600);
  console.log("  tras toggle:", JSON.stringify(await page.evaluate(state), null, 0));

  await page.reload({ waitUntil: "networkidle2" });
  await sleep(1500);
  const after = await page.evaluate(state);
  const tl = await page.evaluate(() => ({ fcp: window.__fcp, tl: window.__timeline }));
  console.log("  tras recargar:", JSON.stringify(after, null, 0));
  console.log(`  FCP a los ${tl.fcp}ms | timeline del h1: ${JSON.stringify(tl.tl)}`);
  await ctx.close();

  await browser.close();
})();

/**
 * Timeline del hero en recarga en frio con cache deshabilitada, que es cuando la
 * fuente tarda mas. Muestrea la geometria del h1, del gap y del retrato desde el
 * primer frame, y acumula CLS.
 *
 * Un salto se ve como un cambio de `h1.top` (o de `gap`) DESPUES del primer frame.
 * Con el hero ya resuelto antes de animar, las columnas tienen que quedar planas.
 *
 *   node scripts/hero-timeline.js [url]
 */
const puppeteer = require("puppeteer-core");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.argv[2] || "http://localhost:3457/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Frena la fuente para exagerar la ventana entre el primer paint y fonts.ready.
const FONT_DELAY_MS = Number(process.env.FONT_DELAY_MS || 0);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);

  if (FONT_DELAY_MS) {
    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      if (/\.woff2?(\?|$)/.test(req.url())) {
        await sleep(FONT_DELAY_MS);
      }
      req.continue().catch(() => {});
    });
  }

  await page.evaluateOnNewDocument(() => {
    window.__cls = 0;
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        window.__shifts.push({ t: Math.round(e.startTime), v: Number(e.value.toFixed(5)) });
      }
    }).observe({ type: "layout-shift", buffered: true });

    window.__samples = [];
    const snap = () => {
      const h1 = document.querySelector("h1");
      const gap = document.querySelector("[data-hero-gap]");
      const por = document.querySelector("[data-hero-portrait]");
      if (!h1) return;
      const r = h1.getBoundingClientRect();
      window.__samples.push({
        t: Math.round(performance.now()),
        // offsetTop/offsetHeight ignoran el transform de la animacion de entrada:
        // asi se ve el layout real y no la posicion visual a mitad del fade.
        top: h1.offsetTop,
        h: h1.offsetHeight,
        fs: Math.round(parseFloat(getComputedStyle(h1).fontSize) * 100) / 100,
        gap: gap ? gap.offsetHeight : null,
        por: por ? por.offsetTop : null,
        vis: Math.round(r.top * 100) / 100,
        op: Math.round(parseFloat(getComputedStyle(h1).opacity) * 1000) / 1000,
        font: document.fonts ? document.fonts.status : "?",
      });
      requestAnimationFrame(snap);
    };
    requestAnimationFrame(snap);
  });

  await page.goto(URL, { waitUntil: "networkidle2" });
  await sleep(3500);

  const { samples, cls, shifts } = await page.evaluate(() => ({
    samples: window.__samples,
    cls: window.__cls,
    shifts: window.__shifts,
  }));

  // colapsa frames identicos: solo interesan los cambios
  const keyOf = (s) => `${s.top}|${s.h}|${s.fs}|${s.gap}|${s.por}`;
  const changes = [];
  let prev = null;
  for (const s of samples) {
    if (!prev || keyOf(s) !== keyOf(prev)) changes.push(s);
    prev = s;
  }

  console.log(`### ${URL}   ${samples.length} frames en ${samples.at(-1).t} ms`);
  if (FONT_DELAY_MS) console.log(`    fuente retrasada ${FONT_DELAY_MS} ms a proposito`);
  console.log("");
  console.log("  t(ms)  h1.top  h1.alto  fontSize   gap  retrato.top  opacidad  fuentes");
  for (const s of changes) {
    console.log(
      `  ${String(s.t).padStart(5)}  ${String(s.top).padStart(6)}  ${String(s.h).padStart(7)}` +
        `  ${String(s.fs).padStart(8)}  ${String(s.gap).padStart(4)}  ${String(s.por).padStart(11)}` +
        `  ${String(s.op).padStart(8)}  ${s.font}`,
    );
  }

  const last = samples.at(-1);
  const settled = changes.at(-1).t;
  const fadeStart = samples.find((s) => s.op > 0);
  console.log("");
  console.log(`  cambios de layout: ${changes.length - 1} despues del primer frame`);
  console.log(`  ultimo cambio a los ${settled} ms`);
  if (fadeStart) {
    const margen = fadeStart.t - settled;
    console.log(
      `  el fade arranca a los ${fadeStart.t} ms  ->  ${margen >= 0 ? "OK" : "SALTO VISIBLE"}` +
        `, layout resuelto ${margen} ms antes`,
    );
  } else {
    console.log("  el fade nunca arranco");
  }
  console.log(`  final: h1.top=${last.top} fontSize=${last.fs} gap=${last.gap} retrato.top=${last.por}`);
  console.log(`  CLS: ${cls.toFixed(5)}   ${shifts.length} shifts ${JSON.stringify(shifts)}`);

  await browser.close();
})();

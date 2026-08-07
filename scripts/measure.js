const puppeteer = require("puppeteer-core");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const url = process.argv[2];
const label = process.argv[3];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--window-size=1440,900", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(2500); // deja pasar el setTimeout(1200) de measure()

  // Resize opcional: valida que measure() se recalcule.
  const resizeTo = process.argv[4];
  if (resizeTo) {
    const [w, h] = resizeTo.split("x").map(Number);
    await page.setViewport({ width: w, height: h });
    await sleep(1200);
  }

  const geom = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-project-card]")];
    if (!cards.length) return { error: "no cards" };
    const container = cards[0].parentElement;
    const spacer = document.querySelector("[data-project-spacer]");
    const cs = (el) => getComputedStyle(el);
    return {
      vh: innerHeight,
      docHeight: document.documentElement.scrollHeight,
      maxScroll: document.documentElement.scrollHeight - innerHeight,
      containerTop: Math.round(container.getBoundingClientRect().top + scrollY),
      containerHeight: Math.round(container.getBoundingClientRect().height),
      footerHeight: Math.round(
        document.querySelector("#contact")?.getBoundingClientRect().height ?? 0,
      ),
      cards: cards.map((c) => ({
        top: cs(c).top,
        marginBottom: cs(c).marginBottom,
        height: Math.round(c.getBoundingClientRect().height),
        gridHeight: Math.round(
          c.querySelector("[data-shots]")?.getBoundingClientRect().height ?? 0,
        ),
      })),
      spacerHeight: spacer ? cs(spacer).height : null,
    };
  });

  // Barrido de scroll: mínimo `top` renderizado, px de scroll pegada arriba y escala.
  const scan = await page.evaluate(async () => {
    const cards = [...document.querySelectorAll("[data-project-card]")];
    const stickyTop = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
    const mins = cards.map(() => Infinity);
    const pinnedPx = cards.map(() => 0);
    const minScale = cards.map(() => 1);
    const STEP = 25;
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max; y += STEP) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      cards.forEach((c, i) => {
        const t = c.getBoundingClientRect().top;
        if (t < mins[i]) mins[i] = Math.round(t);
        if (Math.abs(t - stickyTop[i]) < 1) pinnedPx[i] += STEP;
        const m = new DOMMatrixReadOnly(getComputedStyle(c).transform);
        if (m.a < minScale[i]) minScale[i] = Math.round(m.a * 1000) / 1000;
      });
    }
    window.scrollTo(0, 0);
    return { stickyTop, minRenderedTop: mins, pinnedPx, minScale };
  });

  await sleep(2500); // deja que arranque el video y terminen las lazy
  const weight = await page.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const by = {};
    let total = 0;
    for (const r of res) {
      const bytes = r.transferSize || r.encodedBodySize || 0;
      const kind = /\.(webp|png|jpe?g|svg)/.test(r.name)
        ? "img"
        : /\.(mp4|webm)/.test(r.name)
          ? "video"
          : /\.(woff2?|ttf)/.test(r.name)
            ? "font"
            : /\.js/.test(r.name)
              ? "js"
              : /\.css/.test(r.name)
                ? "css"
                : "otros";
      by[kind] = (by[kind] || 0) + bytes;
      total += bytes;
    }
    const nav = performance.getEntriesByType("navigation")[0];
    const html = nav ? nav.transferSize || nav.encodedBodySize || 0 : 0;
    by.html = html;
    total += html;
    const kb = (n) => Math.round(n / 1024) + " KB";
    return {
      total: kb(total),
      ...Object.fromEntries(Object.entries(by).map(([k, v]) => [k, kb(v)])),
    };
  });

  console.log(
    JSON.stringify({ label, geom, scan, weight, errors: errors.slice(0, 12) }, null, 2),
  );
  await browser.close();
})();

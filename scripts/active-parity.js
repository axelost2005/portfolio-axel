const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGETS = [
  ["L69  CTA hero  :active", 'a[style*="linear-gradient"]', 0],
  ["L124 CTA about :active", 'a[style*="linear-gradient"]', 1],
];

async function run(url) {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);

  const out = [];
  for (const [name, sel, idx] of TARGETS) {
    const point = await page.evaluate(
      async (sel, idx) => {
        const el = document.querySelectorAll(sel)[idx];
        el.scrollIntoView({ block: "center" });
        await new Promise((r) => setTimeout(r, 1500));
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      },
      sel,
      idx,
    );
    const read = () =>
      page.evaluate(
        (sel, idx) => getComputedStyle(document.querySelectorAll(sel)[idx]).transform,
        sel,
        idx,
      );

    await page.mouse.move(point.x, point.y);
    await sleep(400);
    const reposo = await read();
    await page.mouse.down();
    await sleep(500); // transicion de 200ms
    const presionado = await read();
    await page.mouse.up();
    await page.mouse.move(5, 5);
    await sleep(300);
    out.push([name, { reposo, presionado }]);
  }
  await browser.close();
  return out;
}

(async () => {
  const ex = await run("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await run("http://localhost:3457/");
  let bad = 0;
  for (let i = 0; i < ex.length; i++) {
    const [name, a] = ex[i];
    const b = nx[i][1];
    const match = a.presionado === b.presionado && a.reposo === b.reposo;
    if (!match) bad++;
    console.log(`\n${match ? "OK  " : "FALLA"} ${name}`);
    console.log("   export:", JSON.stringify(a));
    console.log("   next  :", JSON.stringify(b));
  }
  console.log(`\n===== ${ex.length - bad} coinciden, ${bad} fallan =====`);
})();

const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Selectores que existen igual en el export y en Next. */
const TARGETS = [
  ["L46  nav link", 'nav a', 0],
  ["L69  CTA hero (gradiente)", 'a[style*="linear-gradient"]', 0],
  ["L124 CTA about (gradiente)", 'a[style*="linear-gradient"]', 1],
  ["L133 fila de servicios", "[data-svc-row]", 0],
  ["L167 link ver proyecto", "[data-project-card] a", 0],
  ["L189 boton WhatsApp footer", "#contact a", 0],
  ["L195 link de email", "#contact a", 1],
  ["L198 social github", "#contact a", 2],
  ["L201 social linkedin", "#contact a", 3],
  ["L204 social mail", "#contact a", 4],
];

const PROPS = [
  "opacity",
  "filter",
  "color",
  "backgroundColor",
  "backgroundImage",
  "paddingLeft",
  "textDecorationLine",
  "transform",
];

async function probe(page, sel, idx, active) {
  return page.evaluate(
    async (sel, idx, active, PROPS) => {
      const el = document.querySelectorAll(sel)[idx];
      if (!el) return { missing: true };
      el.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 1500));
      const read = () => {
        const cs = getComputedStyle(el);
        const o = {};
        for (const p of PROPS) o[p] = cs[p];
        return o;
      };
      const before = read();
      const r = el.getBoundingClientRect();
      window.__hoverPoint = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      return { before, point: window.__hoverPoint };
    },
    sel,
    idx,
    active,
    PROPS,
  );
}

async function afterHover(page, sel, idx) {
  return page.evaluate(
    (sel, idx, PROPS) => {
      const el = document.querySelectorAll(sel)[idx];
      const cs = getComputedStyle(el);
      const o = {};
      for (const p of PROPS) o[p] = cs[p];
      return o;
    },
    sel,
    idx,
    PROPS,
  );
}

async function run(url) {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);

  const out = {};
  for (const [name, sel, idx] of TARGETS) {
    const p = await probe(page, sel, idx);
    if (p.missing) {
      out[name] = "ELEMENTO NO ENCONTRADO";
      continue;
    }
    await page.mouse.move(p.point.x, p.point.y);
    await sleep(700); // deja terminar la transicion
    const after = await afterHover(page, sel, idx);
    const diff = {};
    for (const k of Object.keys(p.before)) {
      if (p.before[k] !== after[k]) diff[k] = `${p.before[k]}  ->  ${after[k]}`;
    }
    out[name] = diff;
    await page.mouse.move(5, 5);
    await sleep(300);
  }
  await browser.close();
  return out;
}

(async () => {
  const ex = await run("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await run("http://localhost:3457/", "next");

  let ok = 0,
    bad = 0;
  for (const [name] of TARGETS) {
    const a = ex[name],
      b = nx[name];
    const keysA = typeof a === "string" ? [] : Object.keys(a);
    const keysB = typeof b === "string" ? [] : Object.keys(b);
    const match =
      JSON.stringify(a) === JSON.stringify(b) ||
      (keysA.length && keysA.every((k) => b[k] === a[k]) && keysA.length === keysB.length);
    console.log(`\n${match ? "OK  " : "FALLA"}  ${name}`);
    console.log(
      "   export:",
      typeof a === "string" ? a : keysA.length ? JSON.stringify(a) : "SIN CAMBIO",
    );
    console.log(
      "   next  :",
      typeof b === "string" ? b : keysB.length ? JSON.stringify(b) : "SIN CAMBIO",
    );
    if (match) ok++;
    else bad++;
  }
  console.log(`\n===== ${ok} coinciden, ${bad} fallan =====`);
})();

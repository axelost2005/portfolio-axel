const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ITEMS = [
  ["h1 hero", "h1"],
  ["h2 about", "#about h2"],
  ["parrafo animado", "[data-animtext]"],
  ["h2 services", "#services h2"],
  ["fila servicio 1", "[data-svc-row]"],
  ["h2 projects", "#projects h2"],
  ["h2 footer", "#contact h2"],
];

async function grab(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(3500);
  const out = await p.evaluate((ITEMS) => {
    const res = { cajas: {}, fuente: {} };
    for (const [n, sel] of ITEMS) {
      const el = document.querySelector(sel);
      if (!el) {
        res.cajas[n] = "FALTA";
        continue;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      res.cajas[n] = {
        x: +r.left.toFixed(2),
        y: +(r.top + window.scrollY).toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
      };
    }
    // ancho real de un texto de referencia con la fuente de la pagina
    const probe = document.createElement("span");
    probe.textContent = "Hamburguesa 0123 ÁÉÍÓÚ";
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-weight:500;";
    document.body.appendChild(probe);
    const w500 = probe.getBoundingClientRect().width;
    probe.style.fontWeight = "900";
    const w900 = probe.getBoundingClientRect().width;
    res.fuente = {
      anchoTexto500: +w500.toFixed(2),
      anchoTexto900: +w900.toFixed(2),
      familiaBody: getComputedStyle(document.body).fontFamily,
    };
    probe.remove();
    return res;
  }, ITEMS);
  await b.close();
  return out;
}

(async () => {
  const ex = await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await grab("http://localhost:3457/");
  console.log("== cajas (posicion absoluta en el documento) ==");
  for (const [n] of ITEMS) {
    const a = ex.cajas[n],
      b = nx.cajas[n];
    if (typeof a === "string" || typeof b === "string") {
      console.log(`  ${n.padEnd(18)} export=${a} next=${b}`);
      continue;
    }
    const d = ["x", "y", "w", "h"].map((k) => +(b[k] - a[k]).toFixed(2));
    const same = d.every((v) => Math.abs(v) < 0.6);
    console.log(
      `  ${same ? "OK   " : "DIF  "} ${n.padEnd(18)} dx=${d[0]} dy=${d[1]} dw=${d[2]} dh=${d[3]}   (fs ${a.fontSize}/${b.fontSize}, lh ${a.lineHeight}/${b.lineHeight})`,
    );
  }
  console.log("\n== metricas de fuente ==");
  console.log("  export:", JSON.stringify(ex.fuente));
  console.log("  next  :", JSON.stringify(nx.fuente));
  console.log(
    "  ancho de texto identico:",
    ex.fuente.anchoTexto500 === nx.fuente.anchoTexto500 &&
      ex.fuente.anchoTexto900 === nx.fuente.anchoTexto900,
  );
})();

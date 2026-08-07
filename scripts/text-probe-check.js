const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SECTIONS = [
  ["hero", "section"],
  ["stack", "#stack"],
  ["about", "#about"],
  ["services", "#services"],
  ["projects", "#projects"],
  ["footer", "#contact"],
];

async function grab(url) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);
  const out = await p.evaluate((SECTIONS) => {
    const strip = (s) => (s || "").replace(/\s+/g, "").trim();
    const res = { textos: {}, spans: [] };
    for (const [n, sel] of SECTIONS) {
      const el = document.querySelector(sel);
      res.textos[n] = el ? strip(el.textContent) : "FALTA";
    }
    // los primeros 8 spans de la primera card, con su texto, para alinear el probe
    const card = document.querySelector("[data-project-card]");
    res.spans = [...card.querySelectorAll("span")]
      .slice(0, 8)
      .map((s, i) => `${i}: "${(s.textContent || "").trim().slice(0, 22)}"`);
    return res;
  }, SECTIONS);
  await b.close();
  return out;
}

(async () => {
  const ex = await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html");
  const nx = await grab("http://localhost:3457/");

  console.log("== texto sin espacios en blanco ==");
  for (const [n] of SECTIONS) {
    const same = ex.textos[n] === nx.textos[n];
    console.log(`  ${n.padEnd(10)} ${same ? "IDENTICO" : "DIFIERE DE VERDAD"}`);
    if (!same) {
      const a = ex.textos[n],
        b = nx.textos[n];
      let i = 0;
      while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
      console.log(`     export: ...${a.slice(Math.max(0, i - 30), i + 50)}`);
      console.log(`     next  : ...${b.slice(Math.max(0, i - 30), i + 50)}`);
    }
  }

  console.log("\n== spans de la primera card de proyecto (para alinear el probe) ==");
  const n = Math.max(ex.spans.length, nx.spans.length);
  for (let i = 0; i < n; i++) {
    console.log(`  export ${ex.spans[i] || "-"}`);
    console.log(`  next   ${nx.spans[i] || "-"}`);
  }
})();

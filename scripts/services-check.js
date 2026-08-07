const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  for (const [n, u] of [
    ["export", "http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html"],
    ["next", "http://localhost:3457/"],
  ]) {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(u, { waitUntil: "networkidle2" });
    await sleep(2500);
    const s = await p.evaluate(() => {
      const sec = document.querySelector("#services");
      const rows = [...document.querySelectorAll("[data-svc-row]")];
      return {
        seccion: Math.round(sec.getBoundingClientRect().height),
        filas: rows.length,
        altoFilas: rows.map((r) => Math.round(r.getBoundingClientRect().height)),
      };
    });
    console.log(n.padEnd(7), JSON.stringify(s));
    await p.close();
  }
  await b.close();
})();

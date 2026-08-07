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
    const pg = await b.newPage();
    await pg.setViewport({ width: 1440, height: 900 });
    await pg.goto(u, { waitUntil: "networkidle2" });
    await sleep(2500);
    const s = await pg.evaluate(() => {
      const i = document.querySelector('img[alt*="etrato"], img[alt*="ortrait"]');
      return {
        h1: document.querySelector("h1").textContent.trim(),
        fuente: i ? i.naturalWidth + "x" + i.naturalHeight : "FALTA",
        anchoCss: i ? Math.round(i.getBoundingClientRect().width) : 0,
        archivo: i ? decodeURIComponent(i.currentSrc).split("/").pop() : "",
      };
    });
    console.log(n.padEnd(7), JSON.stringify(s));
    await pg.close();
  }
  await b.close();
})();

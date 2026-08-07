const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function grab(url, label) {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const p = await b.newPage();
  const fonts = [];
  p.on("response", (r) => {
    if (/\.(woff2?|ttf|otf)(\?|$)/.test(r.url()))
      fonts.push({
        url: r.url().replace(/^https?:\/\//, "").slice(0, 78),
        bytes: Number(r.headers()["content-length"] || 0),
      });
  });
  await p.goto(url, { waitUntil: "networkidle2" });
  await sleep(2500);
  const smooth = await p.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return {
      webkitFontSmoothing: cs.webkitFontSmoothing || cs["-webkit-font-smoothing"],
      textRendering: cs.textRendering,
      fontFamily: cs.fontFamily,
    };
  });
  await b.close();
  console.log(`\n### ${label}`);
  console.log("  body:", JSON.stringify(smooth));
  console.log(`  archivos de fuente cargados: ${fonts.length}`);
  for (const f of fonts.slice(0, 6))
    console.log(`    ${f.url}  ${f.bytes ? Math.round(f.bytes / 1024) + " KB" : ""}`);
}

(async () => {
  await grab("http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html", "EXPORT");
  await grab("http://localhost:3457/", "NEXT");
})();

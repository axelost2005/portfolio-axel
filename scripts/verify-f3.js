const puppeteer = require("puppeteer-core");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:3457/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waLinks = () =>
  [...document.querySelectorAll('a[href*="wa.me"], a[href*="w.app"]')].map(
    (a) => decodeURIComponent(a.getAttribute("href")),
  );

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  for (const dpr of [1, 2]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: dpr });
    const external = new Set();
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith("http://localhost") && !u.startsWith("data:")) external.add(u);
    });
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(2000);

    const portrait = await page.evaluate(() => {
      const img = document.querySelector('img[alt*="etrato"], img[alt*="ortrait"]');
      const e = performance
        .getEntriesByType("resource")
        .find((r) => r.name === img.currentSrc);
      return {
        currentSrc: decodeURIComponent(img.currentSrc.split("?").slice(1).join("?")),
        renderedCss: Math.round(img.getBoundingClientRect().width),
        bytes: e ? Math.round((e.transferSize || e.encodedBodySize) / 1024) + " KB" : "?",
      };
    });

    if (dpr === 1) {
      const es = await page.evaluate(waLinks);
      const socialsEs = await page.evaluate(() =>
        [...document.querySelectorAll("#contact a[aria-label]")].map((a) => ({
          label: a.getAttribute("aria-label"),
          href: a.getAttribute("href"),
        })),
      );
      await page.evaluate(() => document.querySelector("nav button").click());
      await sleep(600);
      const en = await page.evaluate(waLinks);
      const socialsEn = await page.evaluate(() =>
        [...document.querySelectorAll("#contact a[aria-label]")].map((a) =>
          a.getAttribute("aria-label"),
        ),
      );
      const logos = await page.evaluate(() =>
        [...document.querySelectorAll("#stack img")]
          .slice(0, 3)
          .map((i) => i.getAttribute("src") + " ok=" + (i.naturalWidth > 0)),
      );

      console.log("WhatsApp ES (" + es.length + " botones):");
      [...new Set(es)].forEach((h) => console.log("  " + h));
      console.log("WhatsApp EN (" + en.length + " botones):");
      [...new Set(en)].forEach((h) => console.log("  " + h));
      console.log("\nSocials renderizados (" + socialsEs.length + "):");
      socialsEs.forEach((s, i) =>
        console.log("  " + s.label + "  ->  " + s.href + "   [EN: " + socialsEn[i] + "]"),
      );
      console.log("\nLogos del marquee (muestra):");
      logos.forEach((l) => console.log("  " + l));
      console.log(
        "\nPedidos externos: " + (external.size ? [...external].join(", ") : "ninguno"),
      );
    }

    const weight = await page.evaluate(() => {
      const r = performance.getEntriesByType("resource");
      const nav = performance.getEntriesByType("navigation")[0];
      let t = nav ? nav.transferSize || 0 : 0;
      for (const x of r) t += x.transferSize || x.encodedBodySize || 0;
      return Math.round(t / 1024) + " KB";
    });
    console.log(
      `\nDPR${dpr}: retrato ${portrait.renderedCss}px CSS -> ${portrait.currentSrc} = ${portrait.bytes} | carga inicial ${weight}`,
    );
    await page.close();
  }
  await browser.close();
})();

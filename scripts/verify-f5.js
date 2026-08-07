const puppeteer = require("puppeteer-core");
const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = "http://localhost:3457";

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  const bad = [];
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(r.status() + " " + r.url().replace(BASE, ""));
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle2" });

  const head = await page.evaluate(() => {
    const pick = (sel, attr) =>
      [...document.querySelectorAll(sel)].map((e) => e.getAttribute(attr));
    const meta = (p, k) =>
      [...document.querySelectorAll(`meta[${p}]`)]
        .filter((m) => m.getAttribute(p).startsWith(k))
        .map((m) => m.getAttribute(p) + " = " + m.getAttribute("content"));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      og: meta("property", "og:"),
      twitter: meta("name", "twitter:"),
      robots: document.querySelector('meta[name="robots"]')?.content,
      icons: pick('link[rel*="icon"]', "href"),
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (s) => s.textContent,
      ),
    };
  });

  console.log("title      :", head.title);
  console.log("html lang  :", head.lang);
  console.log("description:", head.description);
  console.log("canonical  :", head.canonical);
  console.log("robots     :", head.robots);
  console.log("\nOpen Graph:");
  head.og.forEach((x) => console.log("  " + x));
  console.log("\nTwitter:");
  head.twitter.forEach((x) => console.log("  " + x));
  console.log("\nIconos:");
  head.icons.forEach((x) => console.log("  " + x));

  console.log("\nJSON-LD (" + head.jsonld.length + " bloque/s):");
  for (const raw of head.jsonld) {
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      console.log("  JSON INVALIDO: " + e.message);
      continue;
    }
    console.log("  parsea OK, @type = " + obj["@type"]);
    for (const k of ["name", "jobTitle", "email", "sameAs", "url", "image"]) {
      console.log("    " + k.padEnd(9) + ": " + JSON.stringify(obj[k]));
    }
  }

  // recursos de metadata
  for (const path of ["/og.jpg", "/sitemap.xml", "/robots.txt", "/favicon.ico", "/icon.png"]) {
    const res = await fetch(BASE + path);
    console.log(
      `\n${path.padEnd(14)} ${res.status} ${res.headers.get("content-type") || ""}` +
        ` ${res.headers.get("content-length") ? Math.round(res.headers.get("content-length") / 1024) + " KB" : ""}`,
    );
  }
  console.log("\nRespuestas >=400 al cargar la home:", bad.length ? bad.join(", ") : "ninguna");
  await browser.close();
})();

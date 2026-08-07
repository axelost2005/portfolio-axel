const puppeteer = require("puppeteer-core");
const sharp = require("sharp");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const EXPORT = "http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html";
const NEXT = "http://localhost:3457/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SECTIONS = [
  ["hero", "section"],
  ["stack", "#stack"],
  ["about", "#about"],
  ["services", "#services"],
  ["projects", "#projects"],
  ["footer", "#contact"],
];

const STYLE_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "color",
  "backgroundColor",
  "opacity",
  "borderRadius",
  "paddingTop",
  "paddingLeft",
  "marginTop",
  "textAlign",
];

const PROBES = [
  ["nav link 1", "nav a", 0],
  ["h1 hero", "h1", 0],
  ["tagline hero", "section p", 0],
  ["h2 about", "#about h2", 0],
  ["parrafo animado", "[data-animtext]", 0],
  ["h2 services", "#services h2", 0],
  ["numero servicio", "[data-svc-row] span", 1],
  ["titulo servicio", "[data-svc-row] h3", 0],
  ["desc servicio", "[data-svc-row] p", 0],
  ["h2 projects", "#projects h2", 0],
  ["titulo proyecto", "[data-project-card] h3", 0],
  ["desc proyecto", "[data-project-card] p", 0],
  ["tag de stack", "[data-project-card] span", 4],
  ["h2 footer", "#contact h2", 0],
  ["email footer", "#contact a", 1],
  ["copyright", "#contact p", 0],
];

async function fingerprint(page) {
  return page.evaluate(
    (SECTIONS, PROBES, STYLE_PROPS) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const out = { secciones: {}, estilos: {}, textos: {}, links: [], imagenes: [] };

      for (const [name, sel] of SECTIONS) {
        const el = document.querySelector(sel);
        if (!el) {
          out.secciones[name] = "FALTA";
          continue;
        }
        const r = el.getBoundingClientRect();
        out.secciones[name] = Math.round(r.height);
        out.textos[name] = norm(el.textContent).slice(0, 4000);
      }

      for (const [name, sel, idx] of PROBES) {
        const el = document.querySelectorAll(sel)[idx];
        if (!el) {
          out.estilos[name] = "FALTA";
          continue;
        }
        const cs = getComputedStyle(el);
        const o = {};
        for (const p of STYLE_PROPS) o[p] = cs[p];
        // la familia varía por el nombre generado de next/font: solo interesa que sea Kanit
        o.fontFamily = /kanit/i.test(o.fontFamily) ? "Kanit" : o.fontFamily;
        out.estilos[name] = o;
      }

      for (const a of document.querySelectorAll("a")) {
        out.links.push({
          texto: norm(a.textContent).slice(0, 40),
          href: a.getAttribute("href"),
          aria: a.getAttribute("aria-label"),
          target: a.getAttribute("target"),
          rel: a.getAttribute("rel"),
        });
      }

      for (const img of document.querySelectorAll("img")) {
        const r = img.getBoundingClientRect();
        out.imagenes.push({
          alt: img.getAttribute("alt"),
          w: Math.round(r.width),
          h: Math.round(r.height),
          loading: img.getAttribute("loading"),
        });
      }
      return out;
    },
    SECTIONS,
    PROBES,
    STYLE_PROPS,
  );
}

async function grab(url, lang) {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument((l) => {
    Object.defineProperty(navigator, "language", { get: () => (l === "es" ? "es-AR" : "en-US") });
    try {
      localStorage.setItem("axel-lang", l);
    } catch {}
  }, lang);
  await page.goto(url, { waitUntil: "networkidle2" });
  await sleep(3000);

  // el export arranca en es; si pedimos en, hay que togglear
  const cur = await page.evaluate(() => document.querySelector("h1").textContent.trim());
  const wantEn = lang === "en";
  const isEn = /Hi, I'm/.test(cur);
  if (wantEn !== isEn) {
    await page.evaluate(() => document.querySelector("nav button").click());
    await sleep(1200);
  }

  const fp = await fingerprint(page);

  const shots = {};
  if (lang === "es") {
    for (const [name, sel] of SECTIONS) {
      const el = await page.$(sel);
      if (!el) continue;
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "start" }), sel);
      await sleep(1200);
      try {
        shots[name] = await el.screenshot({ type: "png" });
      } catch {
        shots[name] = null;
      }
    }
  }
  await browser.close();
  return { fp, shots };
}

function diffObj(a, b, path = "") {
  const out = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const va = a?.[k],
      vb = b?.[k];
    const p = path ? `${path}.${k}` : k;
    if (typeof va === "object" && va && typeof vb === "object" && vb) {
      out.push(...diffObj(va, vb, p));
    } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
      out.push(`${p}: export=${JSON.stringify(va)}  next=${JSON.stringify(vb)}`);
    }
  }
  return out;
}

async function psnr(a, b) {
  if (!a || !b) return null;
  const ma = await sharp(a).metadata();
  const mb = await sharp(b).metadata();
  const w = Math.min(ma.width, mb.width),
    h = Math.min(ma.height, mb.height);
  const crop = { left: 0, top: 0, width: w, height: h };
  const ra = await sharp(a).extract(crop).removeAlpha().raw().toBuffer();
  const rb = await sharp(b).extract(crop).removeAlpha().raw().toBuffer();
  let se = 0;
  for (let i = 0; i < ra.length; i++) {
    const d = ra[i] - rb[i];
    se += d * d;
  }
  const mse = se / ra.length;
  return {
    dims: `${ma.width}x${ma.height} vs ${mb.width}x${mb.height}`,
    psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
  };
}

(async () => {
  for (const lang of ["es", "en"]) {
    const ex = await grab(EXPORT, lang);
    const nx = await grab(NEXT, lang);

    console.log(`\n############ IDIOMA ${lang.toUpperCase()} ############`);

    console.log("\n-- alturas de seccion --");
    for (const [name] of SECTIONS) {
      const a = ex.fp.secciones[name],
        b = nx.fp.secciones[name];
      console.log(
        `  ${name.padEnd(10)} export=${String(a).padStart(6)}  next=${String(b).padStart(6)}  ${a === b ? "OK" : "DIFIERE (" + (b - a) + "px)"}`,
      );
    }

    console.log("\n-- texto por seccion --");
    for (const [name] of SECTIONS) {
      const same = ex.fp.textos[name] === nx.fp.textos[name];
      console.log(`  ${name.padEnd(10)} ${same ? "identico" : "DIFIERE"}`);
      if (!same) {
        const a = ex.fp.textos[name] || "",
          b = nx.fp.textos[name] || "";
        let i = 0;
        while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
        console.log(`     primer desvio en char ${i}:`);
        console.log(`     export: ...${a.slice(Math.max(0, i - 40), i + 60)}`);
        console.log(`     next  : ...${b.slice(Math.max(0, i - 40), i + 60)}`);
      }
    }

    console.log("\n-- estilos computados --");
    const sd = diffObj(ex.fp.estilos, nx.fp.estilos);
    console.log(sd.length ? sd.map((x) => "  " + x).join("\n") : "  todo identico");

    console.log("\n-- links --");
    const la = ex.fp.links,
      lb = nx.fp.links;
    console.log(`  cantidad: export=${la.length} next=${lb.length}`);
    const ld = diffObj(la, lb);
    console.log(ld.length ? ld.map((x) => "  " + x).join("\n") : "  todo identico");

    console.log("\n-- imagenes --");
    console.log(`  cantidad: export=${ex.fp.imagenes.length} next=${nx.fp.imagenes.length}`);
    const id = diffObj(ex.fp.imagenes, nx.fp.imagenes);
    console.log(id.length ? id.map((x) => "  " + x).join("\n") : "  todo identico");

    if (lang === "es") {
      console.log("\n-- PSNR por seccion (captura contra captura) --");
      for (const [name] of SECTIONS) {
        const r = await psnr(ex.shots[name], nx.shots[name]);
        if (!r) {
          console.log(`  ${name.padEnd(10)} sin captura`);
          continue;
        }
        console.log(
          `  ${name.padEnd(10)} ${r.dims.padEnd(24)} ${r.psnr === Infinity ? "identico" : r.psnr.toFixed(2) + " dB"}`,
        );
      }
    }
  }
})();

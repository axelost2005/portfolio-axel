/**
 * Genera el og.jpg (1200x630) con la composicion del hero.
 *
 * No es una captura del sitio recortada. El hero es vertical y el og apaisado, asi
 * que recortarlo deja un primer plano de la cara sin titulo. Aca se recompone: se
 * arma un lienzo aparte con la tipografia y los colores reales del sitio, que se
 * consiguen inyectando el layout sobre la pagina ya cargada.
 *
 * OJO con el retrato: el PNG original ya viene cortado al menton (la ultima fila
 * con contenido de assets/portrait-raw.png es la 1090 de 1254). No hay menton que
 * recuperar. Por eso va pegado al borde de abajo, igual que en el sitio: asi el
 * corte coincide con el borde del cuadro y lee como una cabeza que asoma.
 *
 * Dos composiciones. Importa porque LinkedIn recorta al centro en algunos lugares,
 * y ahi solo sobrevive lo que cae dentro de los 630px centrales (x 285..915):
 *
 *   apilado  titulo arriba a todo el ancho, retrato al centro. Se ve mejor entero,
 *            pero el recorte cuadrado se come el titulo.
 *   lado     titulo a la izquierda, retrato a la derecha.
 *
 *   node scripts/make-og.js                          # apilado -> public/og.jpg
 *   node scripts/make-og.js --variante=lado          # lado    -> public/og.jpg
 *   node scripts/make-og.js --variante=lado --out=/tmp/x.jpg --cuadrado
 *
 * --cuadrado escribe ademas el recorte central 1:1 al lado del archivo, para ver
 * como aguanta. Necesita el sitio en :3457.
 */
const puppeteer = require("puppeteer-core");
const sharp = require("sharp");
const path = require("path");

const EDGE =
  process.env.EDGE_PATH ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ROOT = path.resolve(__dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const arg = (n, d) => {
  const m = process.argv.find((a) => a.startsWith(`--${n}=`));
  return m ? m.slice(n.length + 3) : d;
};
const VARIANTE = arg("variante", "apilado");
const OUT = arg("out", `${ROOT}/public/og.jpg`);
const CUADRADO = process.argv.includes("--cuadrado");

const W = 1200;
const H = 630;
const DPR = 2;

const TITULO = "Hola, soy Axel";
const TAGLINE =
  "creo sitios web que se ven bien, cargan rápido y hacen crecer tu negocio";

function layout({ variante, titulo, tagline, w, h }) {
  const wrap = document.createElement("div");
  wrap.id = "og";
  wrap.innerHTML = `<div id="og-t" class="hero-heading"></div>
    <img id="og-r" src="/portrait/axel-portrait.webp" alt="">
    <p id="og-p"></p>`;
  Object.assign(wrap.style, {
    position: "fixed",
    inset: "0",
    width: w + "px",
    height: h + "px",
    background: "#0C0C0C",
    zIndex: "2147483647",
    overflow: "hidden",
  });
  document.body.appendChild(wrap);

  const t = wrap.querySelector("#og-t");
  const img = wrap.querySelector("#og-r");
  const p = wrap.querySelector("#og-p");

  const baseTitulo = {
    position: "absolute",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "-0.03em",
    lineHeight: "0.86",
  };
  const baseTagline = {
    position: "absolute",
    margin: "0",
    fontWeight: "300",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    lineHeight: "1.4",
    color: "#D7E2EA",
  };
  const baseImg = {
    position: "absolute",
    bottom: "0px", // el menton cortado coincide con el borde
    width: "auto",
    display: "block",
  };

  // Agranda hasta llenar el ancho util, como fitHeadings().
  const ajustar = (el, disponible) => {
    let size = 220;
    el.style.fontSize = size + "px";
    for (let i = 0; i < 6; i++) {
      let ancho = 0;
      for (const linea of el.children.length ? [...el.children] : [el]) {
        const r = document.createRange();
        r.selectNodeContents(linea);
        ancho = Math.max(ancho, r.getBoundingClientRect().width);
      }
      if (!ancho) break;
      size = size * (disponible / ancho);
      el.style.fontSize = size.toFixed(2) + "px";
    }
    return size;
  };

  if (variante === "lado") {
    // Titulo en dos lineas sobre la mitad izquierda, retrato a la derecha.
    t.innerHTML = `<div>Hola,</div><div>soy Axel</div>`;
    Object.assign(t.style, baseTitulo, {
      left: "64px",
      top: "96px",
      width: "520px",
      textAlign: "left",
      whiteSpace: "nowrap",
    });
    ajustar(t, 520);

    Object.assign(p.style, baseTagline, {
      left: "64px",
      bottom: "62px",
      maxWidth: "460px",
      fontSize: "22px",
    });

    Object.assign(img.style, baseImg, {
      height: "560px",
      right: "40px",
      left: "auto",
    });
  } else {
    // Titulo arriba a todo el ancho, retrato al centro.
    t.textContent = titulo;
    Object.assign(t.style, baseTitulo, {
      left: "64px",
      right: "64px",
      top: "46px",
      textAlign: "center",
      whiteSpace: "nowrap",
    });
    ajustar(t, w - 128);

    Object.assign(p.style, baseTagline, {
      left: "64px",
      bottom: "54px",
      maxWidth: "300px",
      fontSize: "21px",
    });

    Object.assign(img.style, baseImg, {
      height: "415px",
      left: "50%",
      transform: "translateX(-50%)",
    });
  }

  p.textContent = tagline;
  return { t, img, p };
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  await page.goto("http://localhost:3457/", { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);

  const medido = await page.evaluate(
    async (fn, opts) => {
      const { t, img, p } = new Function("return " + fn)()(opts);
      // sin esto se mide el <img> todavia sin cargar y sale ancho 0
      if (!img.complete) {
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
      }
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.left),
          y: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height),
          r: Math.round(r.right),
          b: Math.round(r.bottom),
        };
      };
      return {
        fontSize: Math.round(parseFloat(t.style.fontSize) * 100) / 100,
        titulo: box(t),
        retrato: box(img),
        tagline: box(p),
      };
    },
    layout.toString(),
    { variante: VARIANTE, titulo: TITULO, tagline: TAGLINE, w: W, h: H },
  );

  await sleep(400);
  const png = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: W, height: H },
  });
  await browser.close();

  const jpeg = { quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true };
  const out = await sharp(png).resize(W, H, { kernel: "lanczos3" }).jpeg(jpeg).toFile(OUT);

  // zona que sobrevive a un recorte central 1:1
  const seguro = { x0: (W - H) / 2, x1: (W + H) / 2 };
  const dentro = (b) => b.x >= seguro.x0 && b.r <= seguro.x1;

  console.log(`${OUT.replace(ROOT + "/", "")}  ${out.width}x${out.height}  ${(out.size / 1024).toFixed(1)} KB  [${VARIANTE}]`);
  console.log(`  titulo   ${medido.fontSize}px  x ${medido.titulo.x}..${medido.titulo.r}  y ${medido.titulo.y}..${medido.titulo.b}`);
  console.log(`  retrato  ${medido.retrato.w}x${medido.retrato.h}  x ${medido.retrato.x}..${medido.retrato.r}`);
  console.log(`  tagline  x ${medido.tagline.x}..${medido.tagline.r}  y ${medido.tagline.y}..${medido.tagline.b}`);
  console.log(`  zona segura del recorte 1:1  x ${seguro.x0}..${seguro.x1}`);
  console.log(`    titulo  ${dentro(medido.titulo) ? "entra entero" : "SE CORTA"}`);
  console.log(`    retrato ${dentro(medido.retrato) ? "entra entero" : "SE CORTA"}`);
  console.log(`    tagline ${dentro(medido.tagline) ? "entra entero" : "SE CORTA"}`);

  if (CUADRADO) {
    const sq = OUT.replace(/\.jpg$/, "-1x1.jpg");
    await sharp(png)
      .extract({ left: seguro.x0 * DPR, top: 0, width: H * DPR, height: H * DPR })
      .resize(H, H, { kernel: "lanczos3" })
      .jpeg(jpeg)
      .toFile(sq);
    console.log(`  recorte 1:1 -> ${sq.replace(ROOT + "/", "")}`);
  }
})();

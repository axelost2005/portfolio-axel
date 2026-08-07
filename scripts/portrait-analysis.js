const sharp = require("sharp");
const fs = require("fs");

const ROOT = require("path").resolve(__dirname, "..");
const BG = { r: 0, g: 0, b: 0 }; // el raw trae fondo negro puro: hay que igualarlo

// cajas de contenido, ya verificadas idénticas en tamaño
const RAW_BOX = { left: 126, top: 0, width: 990, height: 1091 };
const CUT_BOX = { left: 3, top: 0, width: 990, height: 1091 };

/** Gaussiano separable 11x11 sigma 1.5, como el paper de SSIM. */
function gauss1d() {
  const s = 1.5,
    r = 5,
    k = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * s * s));
    k.push(v);
    sum += v;
  }
  return k.map((v) => v / sum);
}
const K = gauss1d();

function blur(src, w, h) {
  const tmp = new Float64Array(w * h);
  const out = new Float64Array(w * h);
  const r = 5;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const xx = Math.min(w - 1, Math.max(0, x + i));
        acc += src[y * w + xx] * K[i + r];
      }
      tmp[y * w + x] = acc;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const yy = Math.min(h - 1, Math.max(0, y + i));
        acc += tmp[yy * w + x] * K[i + r];
      }
      out[y * w + x] = acc;
    }
  return out;
}

function ssim(a, b, w, h) {
  const C1 = (0.01 * 255) ** 2,
    C2 = (0.03 * 255) ** 2;
  const ma = blur(a, w, h),
    mb = blur(b, w, h);
  const aa = new Float64Array(w * h),
    bb = new Float64Array(w * h),
    ab = new Float64Array(w * h);
  for (let i = 0; i < a.length; i++) {
    aa[i] = a[i] * a[i];
    bb[i] = b[i] * b[i];
    ab[i] = a[i] * b[i];
  }
  const saa = blur(aa, w, h),
    sbb = blur(bb, w, h),
    sab = blur(ab, w, h);
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const va = saa[i] - ma[i] * ma[i];
    const vb = sbb[i] - mb[i] * mb[i];
    const vab = sab[i] - ma[i] * mb[i];
    sum +=
      (((2 * ma[i] * mb[i] + C1) * (2 * vab + C2)) /
        ((ma[i] * ma[i] + mb[i] * mb[i] + C1) * (va + vb + C2)));
  }
  return sum / a.length;
}

const psnr = (a, b) => {
  let se = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    se += d * d;
  }
  const mse = se / a.length;
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
};

/** Devuelve {rgb, gray} de una imagen compuesta sobre el fondo y llevada a `width`. */
async function prepare(input, box, width) {
  let img = sharp(input);
  if (box) img = img.extract(box);
  const buf = await img
    .resize({ width, kernel: "lanczos3" })
    .flatten({ background: BG })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const gray = new Float64Array(buf.info.width * buf.info.height);
  for (let i = 0, p = 0; i < buf.data.length; i += 3, p++) {
    gray[p] = 0.299 * buf.data[i] + 0.587 * buf.data[i + 1] + 0.114 * buf.data[i + 2];
  }
  return { rgb: buf.data, gray, w: buf.info.width, h: buf.info.height };
}

/** Escala la caja de contenido a un lienzo de otro ancho. */
const scaleBox = (box, fromW, toW) => {
  const k = toW / fromW;
  return {
    left: Math.round(box.left * k),
    top: Math.round(box.top * k),
    width: Math.min(Math.round(box.width * k), toW - Math.round(box.left * k)),
    height: Math.round(box.height * k),
  };
};

async function main() {
  const kb = (f) =>
    (Buffer.isBuffer(f) ? f.length : fs.statSync(f).size) / 1024;

  // ¿son idénticos los píxeles opacos de raw y del recorte del export?
  const a = await sharp(`${ROOT}/assets/portrait-raw.png`)
    .extract(RAW_BOX)
    .removeAlpha()
    .raw()
    .toBuffer();
  const b = await sharp(`${ROOT}/assets/axel-portrait.png`)
    .extract(CUT_BOX)
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .removeAlpha()
    .raw()
    .toBuffer();
  let diff = 0,
    maxd = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (d) diff++;
    if (d > maxd) maxd = d;
  }
  console.log(
    `raw vs recorte-del-export (ambos sobre negro, alineados):\n` +
      `  subpíxeles distintos: ${diff} de ${a.length} (${((diff / a.length) * 100).toFixed(3)}%)  ` +
      `diferencia máxima: ${maxd}/255  PSNR ${psnr(a, b).toFixed(2)} dB\n`,
  );

  const candidates = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

  for (const width of [519, 1038]) {
    const ref = await prepare(`${ROOT}/assets/portrait-raw.png`, RAW_BOX, width);
    console.log(`\n===== render ${width}px de ancho (contenido) =====`);
    console.log("  " + "candidato".padEnd(46) + "peso".padStart(9) + "  PSNR     SSIM");
    for (const c of candidates) {
      const box = c.canvasWidth ? scaleBox(CUT_BOX, 996, c.canvasWidth) : CUT_BOX;
      const t = await prepare(c.file, box, width);
      const p = psnr(ref.rgb, t.rgb);
      const s = ssim(ref.gray, t.gray, ref.w, ref.h);
      console.log(
        `  ${c.label.padEnd(46)}${kb(c.file).toFixed(1).padStart(7)} KB  ` +
          `${p.toFixed(2)} dB  ${s.toFixed(4)}`,
      );
    }
  }
}

main();

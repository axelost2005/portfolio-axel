const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");

const ROOT = require("path").resolve(__dirname, "..");

// Las capturas van a q90: son texto de UI y a q82 se ensuciaban los bordes.
// Las decorativas son ilustraciones difusas y aguantan q82 sin que se note.
const Q_SHOTS = 90;
const Q_DECOR = 82;

const DECOR_BASE =
  "https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7";
const DECOR = [
  ["moon_icon.11395d36.png", "moon"],
  ["p59_1.4659672e.png", "object"],
  ["lego_icon-1.703bb594.png", "lego"],
  ["Group_134-1.2e04f3ce.png", "group"],
];

const SHOTS = [
  "ap-hero",
  "ap-presupuesto",
  "cm-hero",
  "cm-problemas",
  "cm-trabajos",
  "cp-home",
  "cp-productos",
  "cp-vet",
];

const kb = (n) => (n / 1024).toFixed(1) + " KB";

async function encode(input, out, { maxWidth, quality } = {}) {
  let img = sharp(input);
  const meta = await img.metadata();
  if (maxWidth && meta.width > maxWidth) img = img.resize({ width: maxWidth });
  const info = await img.webp({ quality, effort: 6 }).toFile(out);
  const src = Buffer.isBuffer(input) ? input.length : (await fs.stat(input)).size;
  return {
    file: path.basename(out),
    from: src,
    to: info.size,
    width: info.width,
    height: info.height,
    alpha: meta.hasAlpha,
  };
}

(async () => {
  const rows = [];

  for (const name of SHOTS) {
    rows.push(
      await encode(
        `${ROOT}/assets/projects/${name}.png`,
        `${ROOT}/public/projects/${name}.webp`,
        { quality: Q_SHOTS },
      ),
    );
  }

  // El retrato NO se genera acá: usa near-lossless, no q82. Ver regen-portrait.js.

  for (const [remote, name] of DECOR) {
    const res = await fetch(`${DECOR_BASE}/${remote}`);
    if (!res.ok) throw new Error(`${remote}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    rows.push(
      await encode(buf, `${ROOT}/public/decor/${name}.webp`, {
        maxWidth: 640,
        quality: Q_DECOR,
      }),
    );
  }

  let from = 0;
  let to = 0;
  for (const r of rows) {
    from += r.from;
    to += r.to;
    console.log(
      `${r.file.padEnd(26)} ${String(r.width).padStart(4)}x${String(r.height).padEnd(5)}` +
        ` alpha=${r.alpha ? "sí" : "no "}  ${kb(r.from).padStart(10)} -> ${kb(r.to).padStart(9)}`,
    );
  }
  console.log("-".repeat(78));
  console.log(`TOTAL${" ".repeat(43)}${kb(from).padStart(10)} -> ${kb(to).padStart(9)}`);
  console.log(
    "\nDIMS " +
      JSON.stringify(
        Object.fromEntries(rows.map((r) => [r.file, [r.width, r.height]])),
        null,
        0,
      ),
  );
})();

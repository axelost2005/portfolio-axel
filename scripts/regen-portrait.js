/**
 * Regenera public/portrait/axel-portrait.webp desde los masters de assets/.
 * Es la receta documentada en assets/README.md, ejecutable.
 *
 * Verificado: reproduce el archivo servido byte a byte (sha256 c91ac9ea12e42c7f...).
 * Si tocás algún parámetro, actualizá también assets/README.md.
 */
const sharp = require("sharp");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = `${ROOT}/public/portrait/axel-portrait.webp`;

// Caja de contenido dentro del PNG original de 1254x1254 (el resto es fondo negro).
const BOX = { left: 126, top: 0, width: 990, height: 1091 };

(async () => {
  const alpha = await sharp(`${ROOT}/assets/portrait-alpha.png`).toBuffer();
  const rgb = await sharp(`${ROOT}/assets/portrait-raw.png`).extract(BOX).toBuffer();

  await sharp(rgb)
    .joinChannel(alpha)
    // 3px de aire a los lados y abajo: es el encuadre del export.
    .extend({ top: 0, bottom: 3, left: 3, right: 3, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ nearLossless: true, quality: 60, effort: 6, alphaQuality: 100 })
    .toFile(OUT);

  const buf = fs.readFileSync(OUT);
  const meta = await sharp(buf).metadata();
  console.log(`${OUT.replace(ROOT + "/", "")}`);
  console.log(`  ${meta.width}x${meta.height}  alpha=${meta.hasAlpha ? "sí" : "no"}`);
  console.log(`  ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`  sha256 ${crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16)}`);
})();

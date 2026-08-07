# assets/ — masters, no se publican

Esta carpeta **no se sirve**: está fuera de `public/`, así que Next nunca la expone.
Son los originales que hacen falta para poder regenerar los assets optimizados.

## Archivos

| archivo | qué es |
|---|---|
| `portrait-raw.png` | **Master del retrato 3D.** 1254×1254, RGB sin alpha, fondo negro puro. Es el PNG original sin procesar. |
| `portrait-alpha.png` | Máscara de recorte del retrato, 990×1091 en escala de grises. Sale del recorte que hizo el export de Design; es lo que separa la cabeza del fondo negro. |
| `projects/*.png` | **Masters de las 8 capturas de proyectos.** Son los PNG originales, de 3,6 MB en total. |

Lo que se sirve sale de acá: `public/portrait/axel-portrait.webp` (996×1094, 521 KB)
y `public/projects/*.webp` (8 archivos, 608 KB en total).

## Cómo se regenera todo

Los dos scripts de `scripts/` reproducen los archivos servidos **byte a byte**.
Si cambiás algún parámetro, actualizá también esta tabla.

```bash
npm i -D sharp            # sharp entra igual como dependencia opcional de next
node scripts/regen-portrait.js    # assets/portrait-*.png -> public/portrait/
node scripts/convert-images.js    # assets/projects/*.png -> public/projects/
```

| salida | origen | parámetros |
|---|---|---|
| `public/portrait/axel-portrait.webp` | `portrait-raw.png` + `portrait-alpha.png` | WebP `nearLossless`, `quality: 60`, `effort: 6`, `alphaQuality: 100` |
| `public/projects/*.webp` | `assets/projects/*.png` | WebP `quality: 90`, `effort: 6`, sin reescalar |
| `public/decor/*.webp` | se descargan de `shrug-person-78902957.figma.site` | WebP `quality: 82`, `effort: 6`, ancho máximo 640 |

Ojo con las decorativas: **no hay master local**, el script las baja del dominio de
Figma cada vez. Si ese dominio muere, las WebP de `public/decor/` pasan a ser las
únicas copias.

## Cómo se regenera el WebP del retrato

El RGB sale del master y el alpha de la máscara. Las dos cajas están alineadas 1:1,
así que no hay ningún reescalado: el contenido mide 990×1091 en ambos.

Es lo que hace `scripts/regen-portrait.js`, escrito acá para que quede legible:

```js
const sharp = require("sharp");

const alpha = await sharp("assets/portrait-alpha.png").toBuffer();
const rgb = await sharp("assets/portrait-raw.png")
  .extract({ left: 126, top: 0, width: 990, height: 1091 })
  .toBuffer();

await sharp(rgb)
  .joinChannel(alpha)
  // devuelve el lienzo a 996×1094, que es lo que espera el layout
  .extend({ top: 0, bottom: 3, left: 3, right: 3, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ nearLossless: true, quality: 60, effort: 6, alphaQuality: 100 })
  .toFile("public/portrait/axel-portrait.webp");
```

Verificado: el `sha256` del resultado empieza en `c91ac9ea12e42c7f`, igual que el
archivo que está commiteado.

### Por qué estos parámetros

Medido contra `portrait-raw.png` como referencia, a 1038px de render (retina):

| opción | peso | PSNR | SSIM |
|---|---|---|---|
| WebP q95 | 281 KB | 40,88 dB | 0,9896 |
| WebP q100 | 371 KB | 41,26 dB | 0,9917 |
| PNG con paleta | 405 KB | 41,93 dB | 0,9875 |
| **WebP near-lossless q60** | **521 KB** | **47,85 dB** | **0,9921** |
| WebP lossless | 849 KB | 51,82 dB | 0,9941 |
| PNG sin pérdida | 1809 KB | 51,82 dB | 0,9941 |

`near-lossless q60` es lo mejor que entra en el presupuesto de 600 KB del retrato.

El `<Image>` del hero lleva **`unoptimized`** a propósito: si Next reencodea este
archivo a su q90 por defecto, se pierden 3,1 dB. Al no optimizar, se sirve tal cual.
Como contrapartida, todos los dispositivos bajan los mismos 521 KB.

## Lo que no está acá

**El master del video.** `ap-demo.mp4` original pesaba 13,3 MB y no se guardó en el
árbol; lo que se sirve es la versión recomprimida en `public/projects/ap-demo.mp4`
(H.264 CRF 28, sin audio, ancho máximo 1000, `+faststart`). Volver a comprimirlo desde
ahí sería una segunda pérdida, así que si hace falta otra calidad hay que sacar el
original del commit `70b24f9`.

**El export de Claude Design.** `.dc.html`, `support.js` y `data/*.js` también viven
sólo en `70b24f9`. Hacen falta para correr los scripts de comparación de `scripts/`:

```bash
git checkout 70b24f9 -- "Axel Ostrovsky Portfolio.dc.html" support.js data assets/projects/ap-demo.mp4
```

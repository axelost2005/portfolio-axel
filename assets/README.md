# assets/ — masters, no se publican

Esta carpeta **no se sirve**: está fuera de `public/`, así que Next nunca la expone.
Son los originales que hacen falta para poder regenerar los assets optimizados.

## Archivos

| archivo | qué es |
|---|---|
| `portrait-raw.png` | **Master del retrato 3D.** 1254×1254, RGB sin alpha, fondo negro puro. Es el PNG original sin procesar. |
| `portrait-alpha.png` | Máscara de recorte del retrato, 990×1091 en escala de grises. Sale del recorte que hizo el export de Design; es lo que separa la cabeza del fondo negro. |

El retrato que se sirve es `public/portrait/axel-portrait.webp` (996×1094, 521 KB).

## Cómo se regenera el WebP del retrato

El RGB sale del master y el alpha de la máscara. Las dos cajas están alineadas 1:1,
así que no hay ningún reescalado: el contenido mide 990×1091 en ambos.

```js
// node -e "..." desde la raíz del proyecto, con sharp ya instalado
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

Estos parámetros exactos reproducen el archivo servido **byte a byte**
(`sha256` de los primeros 16 hex: `c91ac9ea12e42c7f`).

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

Los PNG originales de las capturas de proyectos se borraron: las versiones WebP de
`public/projects/` son ahora las únicas copias. Si hace falta volver a los originales,
están en el commit `70b24f9` ("Estado inicial"), junto con el export completo de
Claude Design (`.dc.html`, `support.js` y `data/*.js`).

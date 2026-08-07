# scripts/ — verificación y regeneración de assets

Son los scripts con los que se verificó que la migración a Next quedara idéntica al
export de Claude Design. No corren en CI ni forman parte del build: están acá para que,
si en el futuro se toca el CSS o una animación, se pueda **volver a medir** en vez de
reconstruir el instrumental desde cero.

Ninguno de estos scripts se compila con el proyecto: `tsconfig.json` no los incluye y
ESLint sólo mira `src/`.

## Qué hace falta para correrlos

```bash
npm i -D puppeteer-core sharp
```

Las dos se sacaron del `package.json` a propósito: son herramientas de medición y no
tienen por qué vivir en el árbol de dependencias del sitio. (`sharp` suele entrar igual
como dependencia opcional de Next, pero no conviene depender de eso.)

Manejan el Edge del sistema. La ruta por defecto es la de Windows; si está en otro lado:

```bash
EDGE_PATH="/ruta/a/msedge" node scripts/metrics.js
```

## Los dos servidores

Casi todos comparan **dos páginas en paralelo**: la de Next en `:3457` y la del export
en `:3458`. Hay que levantar las dos antes de medir.

```bash
# Next, en produccion (medir sobre `next dev` da numeros distintos)
npm run build && npx next start -p 3457

# El export. Ojo: ya no esta en el arbol, hay que sacarlo del commit inicial.
git checkout 70b24f9 -- "Axel Ostrovsky Portfolio.dc.html" support.js data
node scripts/serve.js . 3458
```

El export queda en `http://localhost:3458/Axel%20Ostrovsky%20Portfolio.dc.html`, que es
la URL que los scripts traen hardcodeada.

## Comparación contra el export

| script | qué mide |
|---|---|
| `final-diff.js` | La pasada completa: altura de cada sección, cajas de los elementos clave, textos en ES y EN, links e imágenes. Es el que conviene correr primero. |
| `metrics.js` | Caja de 7 elementos de referencia (`dx`, `dy`, `dw`, `dh`) más el ancho de un texto patrón, para detectar corrimientos de fuente. |
| `section-psnr.js` | PSNR por sección. Recorre toda la página antes de capturar para que los fades estén terminados; si no, mide animaciones a medio camino y da falsos negativos. |
| `visual-out.js <dir> <sel> <nombre>` | Escribe `exp-`, `nxt-` y `diff-` de un selector. El mapa de diferencia va **amplificado ×6**, así que un contorno tenue en el diff es antialiasing, no un corrimiento. |
| `where-diff.js [sel] [nombre]` | Parte la sección en una grilla y lista las 8 celdas con más diferencia, nombrando qué elemento cae en cada una. Sirve para pasar de "esta sección difiere" a "difiere en este título". |
| `text-probe-check.js` | Texto de cada sección en los dos. Compara sin normalizar espacios: las diferencias de whitespace vienen del formateo del HTML y son ruido. |
| `font-files.js` | Qué archivos de fuente baja cada página y cuánto pesan. El export toma Kanit del CDN de Google (19 KB por peso) y Next sirve un subset latin (10 KB): es la causa de la única diferencia visual que quedó. |
| `transform-check.js` | `transform` calculado de los títulos, para confirmar que las animaciones terminan en la misma posición. |

## Interacción y animación

| script | qué mide |
|---|---|
| `hover-parity.js` | Los 10 `style-hover` del export contra su equivalente en CSS. `style-hover` es un atributo propio del formato de Design y no tiene equivalente en React, así que cada uno se reimplementó a mano: esto verifica que ninguno se haya perdido. |
| `active-parity.js` | Lo mismo para los 2 `style-active`. |
| `animtext-parity.js` | Barre el párrafo animado de About en 4 posiciones de scroll y compara la opacidad de cada carácter. |
| `services-check.js` | Las filas de Servicios, que son las que llevan el hover de `padding-left`. |
| `measure.js <url> <label>` | La geometría del apilado de cards de Proyectos: `top`, altura, escala y posición final de cada una. Es el script con el que se resolvió que ambas versiones convergen a H=765. |

## Verificación del sitio, sin el export

Estos sólo necesitan `:3457`.

| script | qué verifica |
|---|---|
| `verify-f3.js` | Los links de WhatsApp (que el mensaje siga al idioma activo) y que no queden socials con URL vacía. |
| `verify-f4.js` | El idioma: detección por `navigator.language` en la primera visita, persistencia en `localStorage`, y que no haya flash de idioma incorrecto antes del primer paint. Instrumenta `navigator` antes de que corra cualquier script de la página. |
| `verify-f5.js` | SEO: contenido del `<head>`, JSON-LD, y que `/og.jpg`, `/sitemap.xml`, `/robots.txt` y los iconos devuelvan 200. |
| `smoke.js` | Errores de consola. |
| `hero-timeline.js` | Geometría del hero frame por frame en recarga en frío con caché deshabilitada, más CLS acumulado. Colapsa los frames iguales, así que cada fila es un cambio de layout real. Compara cuándo se resuelve el layout contra cuándo arranca el fade: si el fade va primero, hay salto visible. `FONT_DELAY_MS=600` retrasa la fuente a propósito para abrir la ventana entre el primer paint y `fonts.ready`. |
| `hero-regress.js` | Lo que el timeline no cubre: que con `prefers-reduced-motion` el hero se vea desde el primer frame, que al cambiar de idioma el h1 se reajuste al texto nuevo, que el resize vuelva a medir, y las alturas del resto de la página. |

## Regeneración de assets

| script | qué hace |
|---|---|
| `regen-portrait.js` | Rehace `public/portrait/axel-portrait.webp` desde los masters de `assets/`. |
| `convert-images.js` | Rehace las 8 capturas de `public/projects/` desde `assets/projects/*.png` y baja las 4 decorativas. |
| `portrait-analysis.js` | PSNR y SSIM del retrato contra `assets/portrait-raw.png`. El SSIM está implementado a mano (gaussiano 11×11, sigma 1,5). |

Los dos primeros reproducen los archivos commiteados **byte a byte**; los parámetros y
el porqué están en [`assets/README.md`](../assets/README.md).

Una advertencia de `portrait-analysis.js`, porque costó encontrarla: el master tiene
fondo **negro puro y sin alpha**. Si se compone un candidato sobre `#0C0C0C` en vez de
sobre negro, el offset de 12 niveles en todo el fondo domina la métrica y da resultados
imposibles, como que un archivo sin pérdida puntúe peor que uno comprimido.

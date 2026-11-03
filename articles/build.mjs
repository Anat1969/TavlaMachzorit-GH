// Builds every article as an A4 magazine page (HTML), then PDF (Playwright) and Word (python-docx).
// Usage: node articles/build.mjs <app> <outDir> <baseUrl>
//   app: tavla | biomatic. outDir: the public/articles folder of that app.
//   baseUrl: where outDir is served while printing, e.g. http://localhost:4175/articles
// Design: Anat's article standard ("one equation, six landscapes"): greys only, colour images,
// pages from light to dark with one sharp jump, image width = golden section of the page width.
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { ARTICLES, META } from './content.mjs'

const [, , app, outDir, baseUrl] = process.argv
const list = ARTICLES.filter((a) => a.app === app)
mkdirSync(outDir, { recursive: true })

const PAGES = [
  { bg: '#ffffff', fg: '#111111', soft: '#707070', rule: '#d0d0d0' },
  { bg: '#f3f3f3', fg: '#111111', soft: '#707070', rule: '#cfcfcf' },
  { bg: '#3e3e3e', fg: '#f2f2f2', soft: '#a3a3a3', rule: '#5a5a5a' },
  { bg: '#131313', fg: '#f2f2f2', soft: '#a3a3a3', rule: '#333333' },
]
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const APP_NAME = { tavla: 'טבלה מחזורית כרשת', biomatic: 'BIOMATIC · מהטבע אל הבניין' }
const APP_URL = { tavla: 'https://tavla-machzorit.vercel.app', biomatic: 'https://biomatic-weld.vercel.app' }

const css = `
@page { size: 210mm 297mm; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; padding: 0; background: #888 }
body { font-family: 'Heebo', Arial, sans-serif; font-weight: 300; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; margin: 0 auto 8mm; page-break-after: always; break-after: page; padding: 12mm; display: flex; flex-direction: column; gap: 5mm }
.page:last-child { page-break-after: auto; break-after: auto }
@media print { html, body { background: none } .page { margin: 0 } }
@media screen and (max-width: 820px) { .page { zoom: 0.45 } }
.run { position: absolute; bottom: 7mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; font-family: 'Heebo'; font-weight: 300; font-size: 6.5pt; letter-spacing: .25em; text-transform: uppercase }
.cover-img { margin: -12mm -12mm 0; width: 210mm; height: 183.6mm; position: relative; flex: 0 0 auto }
.cover-img img, .sq img { width: 100%; height: 100%; object-fit: cover; display: block }
.tag { position: absolute; bottom: 5mm; right: 6mm; color: #fff; font-size: 7pt; letter-spacing: .12em; text-shadow: 0 1px 3px rgba(0,0,0,.65) }
.kicker { font-size: 7pt; letter-spacing: .3em; margin-top: 3mm }
h1 { font-family: 'Frank Ruhl Libre', serif; margin: 0; line-height: 1.02; font-size: 40pt }
h1 .thin { font-weight: 300; display: block } h1 .bold { font-weight: 500; display: block }
.dek { width: 129.8mm; font-size: 12pt; line-height: 1.55; margin: 0 }
.byline { font-size: 8pt; letter-spacing: .15em; margin-top: auto; margin-bottom: 8mm }
.ch { display: grid; grid-template-columns: 22mm 1fr; gap: 0 5mm }
.num { font-family: 'Heebo'; font-weight: 100; font-size: 38pt; line-height: .9 }
.ch h2 { font-family: 'Frank Ruhl Libre', serif; font-weight: 500; font-size: 20pt; margin: 0 0 3mm }
.ch p { margin: 0 0 2.5mm; font-size: 10.5pt; line-height: 1.65 }
.insight { font-family: 'Frank Ruhl Libre', serif; font-weight: 500; font-size: 14pt; padding-top: 2mm; margin-top: 2mm; border-top: .3mm solid }
.quote { font-family: 'Frank Ruhl Libre', serif; font-size: 19pt; line-height: 1.35; padding: 4mm 0; border-top: .3mm solid; border-bottom: .3mm solid }
.quote cite { display: block; font-family: 'Heebo'; font-style: normal; font-size: 7.5pt; letter-spacing: .08em; margin-top: 2mm }
.row2 { display: grid; grid-template-columns: 1fr 129.8mm; gap: 6mm; margin-left: -12mm; align-items: start }
.sq { width: 129.8mm; height: 129.8mm; position: relative }
.nums { display: flex; flex-direction: column; gap: 3mm }
.nums div { border-top: .3mm solid; padding-top: 1.5mm }
.nums span { display: block; font-size: 7pt; letter-spacing: .15em }
.nums b { font-family: 'Frank Ruhl Libre', serif; font-weight: 500; font-size: 15pt }
.label { font-size: 7pt; letter-spacing: .3em; margin-bottom: 1.5mm }
.not { font-size: 10.5pt; line-height: 1.6; border-top: .3mm solid; padding-top: 2mm }
ol.steps { margin: 0; padding: 0 6mm 0 0; font-size: 12pt; line-height: 1.65 }
ol.steps li { margin-bottom: 1.5mm }
.question { font-family: 'Frank Ruhl Libre', serif; font-weight: 500; font-size: 22pt; line-height: 1.3; padding: 4mm 0 }
.haiku { font-family: 'Frank Ruhl Libre', serif; font-weight: 300; font-size: 19pt; line-height: 1.6 }
.strip { display: flex; gap: 2mm; height: 48mm; margin-top: auto; margin-bottom: 14mm }
.strip img { height: 100%; aspect-ratio: 1; object-fit: cover }
.sources { font-size: 7.5pt; line-height: 1.7 }
.colophon { font-size: 6.5pt; line-height: 1.5 }
.p2fig { display: grid; grid-template-columns: 1fr 86mm; gap: 6mm; margin-left: -12mm; margin-top: auto; margin-bottom: 10mm; align-items: end }
.p2fig .sq { width: 86mm; height: 86mm }
.p2fig p { font-size: 8pt; line-height: 1.6; margin: 0 }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm }
`

function page(i, inner, a) {
  const p = PAGES[i]
  return `<section class="page" style="background:${p.bg};color:${p.fg};--soft:${p.soft}">
${inner}
<div class="run" style="color:${p.soft}"><span>${esc(APP_NAME[a.app])} · ${esc(a.title.join(' '))}</span><span>${i + 1}</span></div></section>`
}
const soft = (i) => `color:${PAGES[i].soft}`
const ruleC = (i) => `border-color:${PAGES[i].rule}`
const chapter = (c, n, i) => `<div class="ch"><div class="num">0${n}</div><div><h2>${esc(c.h)}</h2>${c.body.map((b) => `<p>${esc(b)}</p>`).join('')}<div class="insight" style="${ruleC(i)}">${esc(c.insight)}</div></div></div>`

function html(a) {
  const img = (src) => esc(src)
  const p1 = `<div class="cover-img"><img src="${img(a.cover.img)}" alt="${esc(a.cover.caption)}"><span class="tag">${esc(a.cover.kind)} · ${esc(a.cover.caption)}</span></div>
<div class="kicker" style="${soft(0)}">${esc(a.kicker)}</div>
<h1><span class="thin">${esc(a.title[0])}</span><span class="bold">${esc(a.title[1])}</span></h1>
<p class="dek">${esc(a.dek)}</p>
<div class="byline" style="${soft(0)}">${esc(META.BYLINE)} · ${esc(META.MACHINE)}</div>`
  const p2 = `${chapter(a.chapters[0], 1, 1)}${chapter(a.chapters[1], 2, 1)}
<blockquote class="quote" style="${ruleC(1)};margin:0">${esc(a.quote.text)}<cite style="${soft(1)}">${esc(a.quote.src)}</cite></blockquote>
<div class="p2fig"><p style="${soft(1)}">${esc(a.strip[1].startsWith('img/render') ? 'הדמיה מספר החוקים של טבלה מחזורית כרשת.' : 'היישום בבנייה, מתוך BIOMATIC.')}</p><div class="sq"><img src="${img(a.strip[1])}" alt=""><span class="tag">הדמיה</span></div></div>`
  const p3 = `${chapter(a.chapters[2], 3, 2)}
<div class="row2"><div class="sq"><img src="${img(a.strip[2])}" alt=""><span class="tag">${a.strip[2].startsWith('img/render') ? 'הדמיה' : 'להשלמת קרדיט'}</span></div>
<div class="nums">${a.numbers.map(([k, v]) => `<div style="${ruleC(2)}"><span style="${soft(2)}">${esc(k)}</span><b><bdi>${esc(v)}</bdi></b></div>`).join('')}</div></div>
<div class="not" style="${ruleC(2)}"><div class="label" style="${soft(2)}">מה זה לא</div>${esc(a.notIs)}</div>`
  const p4 = `<div class="label" style="${soft(3)}">מה זה אומר לתכנון</div>
<ol class="steps">${a.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<div class="question">${esc(a.question)}</div>
<div class="cols2"><div><div class="label" style="${soft(3)}">הייקו</div><div class="haiku">${a.haiku.map(esc).join('<br>')}</div></div>
<div><div class="label" style="${soft(3)}">מקורות</div><div class="sources" style="${soft(3)}">${a.sources.map(esc).join('<br>')}</div></div></div>
<div class="strip">${a.strip.map((s) => `<img src="${img(s)}" alt="">`).join('')}</div>
<div class="colophon" style="${soft(3)}">התמונות שמסומנות "הדמיה" הן איורים תלת־ממדיים מספר החוקים של טבלה מחזורית כרשת. כל מספר בכתבה חושב במנועי האפליקציה, ונבדק מול מאגר התרכובות ומול חישובי Materials Project.<br>
הגוונים יורדים מבהיר לכהה בקפיצה אחת באמצע, כמו המעבר מטבע לחומר. רוחב התמונה הוא חתך הזהב של רוחב הדף.<br>
${esc(a.link ?? `${APP_URL.tavla}/#/nature?ch=${a.ch}`)}</div>`
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.title.join(' '))}</title><meta name="description" content="${esc(a.dek)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;500&family=Heebo:wght@100;300;500&display=swap" rel="stylesheet">
<style>${css}</style></head><body>
${page(0, p1, a)}${page(1, p2, a)}${page(2, p3, a)}${page(3, p4, a)}
</body></html>`
}

for (const a of list) writeFileSync(join(outDir, `${a.id}.html`), html(a))
writeFileSync(join(outDir, 'index.json'), JSON.stringify(list.map(({ id, no, kicker, title, dek, cover, path, ch }) => ({ id, no, kicker, title, dek, cover, path, ch })), null, 1))
console.log('html', list.length)

// PDF through the served folder, so relative images resolve exactly as on the site
const { createRequire } = await import('node:module')
const { chromium } = createRequire(import.meta.url)('playwright')
const browser = await chromium.launch()
for (const a of list) {
  const p = await browser.newPage()
  await p.goto(`${baseUrl}/${a.id}.html`, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.pdf({ path: join(outDir, `${a.id}.pdf`), width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true })
  await p.close()
}
await browser.close()
console.log('pdf', list.length)

// Word: one section per page, page-size background image, RTL, David and Arial
writeFileSync(join(outDir, '.docx-input.json'), JSON.stringify({ pages: PAGES, meta: META, appName: APP_NAME[app], list }))
execFileSync('python3', [new URL('./docx_build.py', import.meta.url).pathname, join(outDir, '.docx-input.json'), outDir], { stdio: 'inherit' })

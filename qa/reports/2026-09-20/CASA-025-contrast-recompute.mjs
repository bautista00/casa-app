const lum = ([r,g,b]) => {
  const f = c => { c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4) }
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)
}
const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05) }
const over = (fg, alpha, bg) => fg.map((c,i) => Math.round(alpha*c + (1-alpha)*bg[i]))

// sRGB values read back from the compiled stylesheet in Chromium on 2026-09-14
// (qa/reports/2026-09-14/VERIFY-a11y-remeasure.txt) — recomputed here by the
// WCAG 2.1 relative-luminance formula as an independent second reproduction.
const T = {
  background:  [242,245,252],
  card:        [250,252,255],
  accent:      [243,130,29],
  destructive: [231,0,11],
}
const rows = [
  ['CASA-025  callback:65  MailWarning 32px  accent on bg-accent/10 over BACKGROUND',
    T.accent, over(T.accent, 0.10, T.background), 3.0],
  ['          (same icon if the tint sat on a CARD, for comparison)',
    T.accent, over(T.accent, 0.10, T.card), 3.0],
  ['CORRECTION error-state.tsx:31 AlertCircle 32px destructive on bg-destructive/10 over BACKGROUND',
    T.destructive, over(T.destructive, 0.10, T.background), 3.0],
  ['          error-state.tsx:31 as previously recorded (over CARD) — surface was mis-assigned',
    T.destructive, over(T.destructive, 0.10, T.card), 3.0],
]
for (const [label, fg, bg, need] of rows) {
  const r = ratio(fg, bg)
  console.log(`${r >= need ? 'PASS' : 'FAIL'}  ${r.toFixed(2)} (need ${need})  fg=rgb(${fg}) bg=rgb(${bg})\n      ${label}`)
}

console.log('\n--- candidate fixes for CASA-025 (icon colour on bg-accent/10 over background) ---')
const bg = over(T.accent, 0.10, T.background)
const cands = {
  'text-accent-ink  rgb(161,82,0)  (existing token from CASA-020)': [161,82,0],
  'text-accent      rgb(243,130,29) (current)': T.accent,
}
for (const [name, fg] of Object.entries(cands)) {
  const r = ratio(fg, bg)
  console.log(`  ${r >= 3 ? 'PASS' : 'FAIL'}  ${r.toFixed(2)} (need 3.0)  ${name}`)
}

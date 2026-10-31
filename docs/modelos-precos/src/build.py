# Gera os modelos da seção "tamanhos e preços" da home, com os preços reais
# de supabase/functions/_shared/catalog.ts. Páginas separadas, não publicadas.
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..")
BUY = "https://fanezzesupply.com.br/produtos?produto="

# (id, nome, foto, mínimo, descrição, [(tamanho, até 999, a partir de 1.000)])
MATS = [
    ("envelope", "Envelope", "assets/envelope-p.webp", 2000, "Preto ou branco, para e-commerce e logística.",
     [("20x30", 8, None), ("20x36", 8, None), ("32x40", 8, None), ("40x60", 8, None), ("30x70", 8, None)]),
    ("envelope-coex", "Envelope COEX", "assets/envelope-p.webp", 500, "Branco por fora, cinza por dentro.",
     [("19x25", 27, 24), ("32x20", 36, 31), ("30x40", 66, 56), ("40x60", 136, 117), ("50x70", 171, 146)]),
    ("envelope-cinza", "Envelope Cinza", "assets/envelope-cinza-p.webp", 500, "Privacidade no envio e impermeável.",
     [("20x30", 16, 14), ("26x36", 26, 20), ("32x40", 36, 26), ("40x50", 55, 46), ("40x60", 64, 55),
      ("50x70", 105, 77), ("70x60", 120, 87), ("50x90", 140, 102)]),
]

def brl(c):
    return "R$ " + f"{c / 100:.2f}".replace(".", ",")

def thousands(n):
    return f"{n:,}".replace(",", ".")

def save(c, low):
    return round((low - c) / low * 100)

ROWS = [{"mat": m[0], "name": m[1], "img": m[2], "min": m[3], "size": s, "w": int(s.split("x")[0]), "h": int(s.split("x")[1]),
         "low": lo, "best": be} for m in MATS for (s, lo, be) in m[5]]

CSS = """
:root { --navy: #1b2845; --navy-2: #2c3e66; --beige: #f5e6d3; --beige-2: #fbf4ea; --bg: #f3f4f6; --tile: #fff;
  --line: #e5e7eb; --muted: #5b6475; --green: #15803d; --green-bg: #e9f7ee; --r: 24px; --ease: cubic-bezier(.22,1,.36,1); }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; overflow-x: clip; }
body { font-family: Manrope, system-ui, sans-serif; background: var(--bg); color: var(--navy); font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
h1, h2, h3, p { margin: 0; }
a { color: inherit; }
button, select { font: inherit; color: inherit; }
img { display: block; max-width: 100%; height: auto; }
:focus-visible { outline: 3px solid var(--navy-2); outline-offset: 2px; }
.wrap { width: min(1440px, 100% - 48px); margin: 0 auto; padding: 56px 0 80px; }
.model { font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 20px; }
.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 20px 32px; margin-bottom: 28px; }
.head h2 { font-size: clamp(28px, 2.6vw, 38px); font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
.head p { color: var(--muted); margin-top: 6px; font-size: 17px; }
.tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.tab { min-height: 44px; padding: 0 18px; border-radius: 14px; border: 1px solid var(--line); background: var(--tile); font-weight: 600; cursor: pointer; transition: background-color .2s, color .2s, border-color .2s; }
.tab:hover { border-color: #c9ced8; }
.tab[aria-pressed="true"] { background: var(--navy); color: #fff; border-color: var(--navy); }
.price { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.best { color: var(--green); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pill { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 999px; background: var(--green-bg); color: var(--green); font-size: 12.5px; font-weight: 700; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 18px; border-radius: 14px; background: var(--navy); color: #fff; font-weight: 700; font-size: 15px; text-decoration: none; transition: background-color .2s, transform .2s var(--ease); }
.btn:hover { background: var(--navy-2); }
.btn:active { transform: scale(.97); }
.btn.ghost { background: transparent; color: var(--navy); border: 1.5px solid var(--navy); }
.btn.ghost:hover { background: var(--navy); color: #fff; }
.note { margin-top: 18px; font-size: 14px; color: var(--muted); }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
"""

FILTER_JS = """
document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const f = b.dataset.filter;
  document.querySelectorAll('[data-mat]').forEach((el) => { el.hidden = f !== 'all' && el.dataset.mat !== f; });
}));
"""

def tabs():
    t = '<button type="button" class="tab" data-filter="all" aria-pressed="true">Todos</button>'
    for m in MATS:
        t += f'<button type="button" class="tab" data-filter="{m[0]}" aria-pressed="false">{m[1]}</button>'
    return f'<div class="tabs" role="group" aria-label="Filtrar por material">{t}</div>'

def page(title, label, css, body, js=""):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Tabela de preços FNZ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{CSS}{css}</style>
</head>
<body>
<main class="wrap">
<p class="model">{label}</p>
{body}
</main>
<script>{js}</script>
</body>
</html>
"""

# ---------- Modelo 1: tabela comparativa ----------
def m1():
    css = """
.table { background: var(--tile); border-radius: var(--r); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
thead th { position: sticky; top: 0; background: var(--beige-2); text-align: left; font-size: 13px; font-weight: 700; color: var(--muted); padding: 14px 20px; }
thead th.num, td.num { text-align: right; }
tbody td { padding: 14px 20px; border-top: 1px solid var(--line); vertical-align: middle; }
tbody tr { transition: background-color .15s; }
tbody tr:hover { background: #fafbfc; }
.prod { display: flex; align-items: center; gap: 14px; }
.prod img { width: 56px; height: 42px; object-fit: cover; border-radius: 10px; background: #eee; }
.prod small { display: block; color: var(--muted); font-size: 13px; }
.size { font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
td .pill { margin-left: 8px; }
.min { color: var(--muted); white-space: nowrap; }
.sort { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
.sort select { height: 44px; border-radius: 14px; border: 1px solid var(--line); background: var(--tile); padding: 0 14px; font-weight: 600; cursor: pointer; }
.tools { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
@media (max-width: 860px) {
  thead { display: none; }
  table, tbody, tr, td { display: block; }
  tbody tr { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 16px; border-top: 1px solid var(--line); }
  tbody td { border: 0; padding: 0; }
  td.num { text-align: left; }
  td[data-l]::before { content: attr(data-l) ": "; color: var(--muted); font-weight: 500; }
  td.act { grid-column: 1 / -1; margin-top: 8px; }
  td.act .btn { width: 100%; }
}
"""
    rows = ""
    for r in ROWS:
        best = (f'<span class="best">{brl(r["best"])}</span><span class="pill">−{save(r["best"], r["low"])}%</span>'
                if r["best"] else '<span class="min">mesmo preço</span>')
        rows += (f'<tr data-mat="{r["mat"]}" data-area="{r["w"] * r["h"]}" data-price="{r["best"] or r["low"]}">'
                 f'<td><div class="prod"><img src="{r["img"]}" alt="" width="240" height="180" loading="lazy"><div><span class="size">{r["size"]}</span><small>{r["name"]}</small></div></div></td>'
                 f'<td class="num" data-l="Até 999 un."><span class="price">{brl(r["low"])}</span></td>'
                 f'<td class="num" data-l="1.000 ou mais">{best}</td>'
                 f'<td class="num min" data-l="Mínimo">{thousands(r["min"])} un.</td>'
                 f'<td class="num act"><a class="btn ghost" href="{BUY}{r["mat"]}">Comprar</a></td></tr>')
    body = f"""
<div class="head"><div><h2>Encontre o tamanho ideal para sua operação</h2><p>Preço por unidade nas duas faixas de quantidade e o pedido mínimo de cada tamanho.</p></div>
<div class="tools">{tabs()}<label class="sort">Ordenar<select id="sort"><option value="cat">Material</option><option value="area">Tamanho</option><option value="price">Menor preço</option></select></label></div></div>
<div class="table"><table><thead><tr><th>Tamanho (cm)</th><th class="num">Até 999 un.</th><th class="num">1.000 ou mais</th><th class="num">Mínimo</th><th></th></tr></thead><tbody id="rows">{rows}</tbody></table></div>
<p class="note">Preço por unidade. Frete grátis em Joinville/SC; demais cidades R$ 19,90 por pedido.</p>"""
    js = FILTER_JS + """
const tbody = document.getElementById('rows'), orig = [...tbody.children];
document.getElementById('sort').addEventListener('change', (e) => {
  const k = e.target.value, list = k === 'cat' ? orig : [...orig].sort((a, b) => Number(a.dataset[k]) - Number(b.dataset[k]));
  list.forEach((r) => tbody.append(r));
});"""
    return page("Modelo 1 · Tabela comparativa", "Modelo 1 · Tabela comparativa", css, body, js)

# ---------- Modelo 2: cardápio por material ----------
def m2():
    css = """
.cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: start; }
.menu { background: var(--tile); border-radius: var(--r); padding: 24px; }
.menu header { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 16px; align-items: center; padding-bottom: 18px; border-bottom: 2px solid var(--navy); }
.menu header img { width: 88px; height: 66px; object-fit: cover; border-radius: 14px; background: #eee; }
.menu h3 { font-size: 22px; font-weight: 800; letter-spacing: -.02em; }
.menu header p { color: var(--muted); font-size: 14px; }
.legend { display: grid; grid-template-columns: minmax(0, 1fr) 80px 80px; gap: 8px; font-size: 12.5px; font-weight: 700; color: var(--muted); padding: 14px 0 6px; text-align: right; }
.legend span:first-child { text-align: left; }
.item { display: grid; grid-template-columns: auto minmax(0, 1fr) 80px 80px; gap: 8px; align-items: baseline; padding: 11px 0; }
.item b { font-size: 19px; font-weight: 800; letter-spacing: -.02em; }
.item i { border-bottom: 2px dotted #cfd4dc; transform: translateY(-4px); }
.item .price, .item .best { text-align: right; font-size: 16px; }
.single .legend, .single .item { grid-template-columns: minmax(0, 1fr) 100px; }
.single .item { grid-template-columns: auto minmax(0, 1fr) 100px; }
.foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 14px; color: var(--muted); }
@media (max-width: 1100px) { .cols { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px) { .cols { grid-template-columns: 1fr; } .wrap { width: calc(100% - 32px); } }
"""
    cols = ""
    for mid, name, img, mn, desc, sizes in MATS:
        single = all(b is None for _, _, b in sizes)
        legend = ('<div class="legend"><span>Tamanho (cm)</span><span>por unidade</span></div>' if single else
                  '<div class="legend"><span>Tamanho (cm)</span><span>até 999</span><span>1.000+</span></div>')
        items = ""
        for s, lo, be in sizes:
            items += (f'<div class="item"><b>{s}</b><i></i><span class="price">{brl(lo)}</span></div>' if single else
                      f'<div class="item"><b>{s}</b><i></i><span class="price">{brl(lo)}</span><span class="best">{brl(be)}</span></div>')
        cols += (f'<article class="menu{" single" if single else ""}" data-mat="{mid}"><header><img src="{img}" alt="" width="240" height="180" loading="lazy">'
                 f'<div><h3>{name}</h3><p>{desc}</p></div></header>{legend}{items}'
                 f'<div class="foot"><span>Mínimo {thousands(mn)} un. por tamanho</span><a class="btn" href="{BUY}{mid}">Comprar</a></div></article>')
    body = f"""
<div class="head"><div><h2>Encontre o tamanho ideal para sua operação</h2><p>Um cardápio por material: escolha a coluna e leia o preço de cada tamanho.</p></div>{tabs()}</div>
<div class="cols">{cols}</div>
<p class="note">Preço por unidade. A partir de 1.000 unidades do mesmo tamanho vale o preço em verde.</p>"""
    return page("Modelo 2 · Cardápio por material", "Modelo 2 · Cardápio por material", css, body, FILTER_JS)

# ---------- Modelo 3: preço pela quantidade ----------
def m3():
    css = """
.panel { background: var(--tile); border-radius: var(--r); padding: 28px; }
.ctrl { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; justify-content: space-between; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
.ctrl h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 16px; background: var(--bg); }
.seg button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 12px; background: transparent; font-weight: 700; cursor: pointer; transition: background-color .2s, color .2s; font-variant-numeric: tabular-nums; }
.seg button[aria-pressed="true"] { background: var(--navy); color: #fff; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin-top: 22px; }
.card { border: 1px solid var(--line); border-radius: 18px; padding: 16px 18px; display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 4px 14px; transition: border-color .2s, opacity .2s; }
.card img { grid-row: span 3; width: 52px; height: 52px; object-fit: cover; border-radius: 12px; background: #eee; }
.card .t { display: flex; flex-direction: column; }
.card b { font-size: 19px; font-weight: 800; line-height: 1.2; }
.card small { color: var(--muted); font-size: 13px; }
.card .total { font-size: 22px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.card .unit { font-size: 13.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.card .unit .best { font-size: 13.5px; }
.card.off { opacity: .45; }
.card.off .total { font-size: 15px; font-weight: 700; }
@media (max-width: 640px) { .wrap { width: calc(100% - 32px); } .panel { padding: 18px; } }
"""
    data = json.dumps([{k: r[k] for k in ("mat", "name", "img", "min", "size", "low", "best")} for r in ROWS], ensure_ascii=False)
    body = f"""
<div class="head"><div><h2>Quanto custa o seu pedido?</h2><p>Escolha a quantidade e veja o total de cada tamanho, já com o preço da faixa.</p></div>{tabs()}</div>
<div class="panel">
  <div class="ctrl"><div><h3 id="q-l">Quantidade por tamanho</h3><div class="seg" role="group" aria-labelledby="q-l" id="qty"></div></div>
  <p class="note" style="margin:0">Total sem frete. Joinville/SC: frete grátis; demais cidades R$ 19,90.</p></div>
  <div class="grid" id="grid" aria-live="polite"></div>
</div>"""
    js = f"""
const ROWS = {data};
const brl = (c) => (c / 100).toLocaleString('pt-BR', {{ style: 'currency', currency: 'BRL' }});
let qty = 1000, mat = 'all';
const seg = document.getElementById('qty');
[500, 1000, 2000, 5000, 10000].forEach((q) => {{
  const b = document.createElement('button'); b.type = 'button'; b.textContent = q.toLocaleString('pt-BR');
  b.setAttribute('aria-pressed', String(q === qty));
  b.onclick = () => {{ qty = q; seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }};
  seg.append(b);
}});
function draw() {{
  document.getElementById('grid').innerHTML = ROWS.filter((r) => mat === 'all' || r.mat === mat).map((r) => {{
    const ok = qty >= r.min, unit = qty >= 1000 && r.best ? r.best : r.low;
    return `<article class="card${{ok ? '' : ' off'}}"><img src="${{r.img}}" alt="" width="240" height="180" loading="lazy">
      <div class="t"><b>${{r.size}}</b><small>${{r.name}}</small></div>
      <div class="total" style="margin-top:6px">${{ok ? brl(unit * qty) : 'mínimo ' + r.min.toLocaleString('pt-BR') + ' un.'}}</div>
      <div class="unit">${{brl(unit)}}/un.${{r.best && qty < 1000 ? ` · <span class="best">${{brl(r.best)}} a partir de 1.000</span>` : ''}}</div></article>`;
  }}).join('');
}}
document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {{
  document.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  mat = b.dataset.filter; draw();
}}));
draw();"""
    return page("Modelo 3 · Preço pela quantidade", "Modelo 3 · Preço pela quantidade", css, body, js)

# ---------- Modelo 4: tamanhos em escala ----------
def m4():
    css = """
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.tile { background: var(--tile); border: 2px solid transparent; border-radius: 20px; padding: 14px; cursor: pointer; text-align: left; display: grid; gap: 8px; transition: border-color .2s, transform .2s var(--ease); }
.tile:hover { transform: translateY(-2px); }
.tile[aria-pressed="true"] { border-color: var(--navy); }
.box { height: 110px; display: flex; align-items: flex-end; justify-content: center; }
.env { border-radius: 3px; background: #fff; outline: 1.5px solid #c9ced8; position: relative; }
.env::before { content: ""; position: absolute; inset: 0 0 auto; height: 10%; background: var(--strip); border-radius: 3px 3px 0 0; }
.env.cinza { background: #7b7e83; outline-color: #666; }
.tile b { font-size: 18px; font-weight: 800; }
.tile small { display: block; color: var(--muted); font-size: 12.5px; }
.tile .price { font-size: 15px; }
.side { position: sticky; top: 24px; background: var(--navy); color: #fff; border-radius: var(--r); padding: 26px; display: grid; gap: 16px; }
.side h3 { font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
.side .sub { color: #c9d2e6; font-size: 14px; }
.cmp { background: #fff; border-radius: 16px; height: 240px; display: flex; align-items: flex-end; justify-content: center; gap: 20px; padding: 16px; }
.cmp .a4 { background: #e9ebef; display: grid; place-items: center; color: var(--muted); font-size: 12px; font-weight: 700; }
.cmp div { transition: width .3s var(--ease), height .3s var(--ease); }
.rows { display: grid; gap: 6px; font-size: 15px; }
.rows div { display: flex; justify-content: space-between; gap: 12px; }
.rows .best { color: #86efac; }
.side .btn { background: var(--beige); color: var(--navy); }
.side .btn:hover { background: #fff; }
@media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } .side { position: static; order: -1; } }
@media (max-width: 640px) { .wrap { width: calc(100% - 32px); } .tiles { grid-template-columns: 1fr 1fr; } }
"""
    biggest = max(max(r["w"], r["h"]) for r in ROWS)
    tiles = ""
    for i, r in enumerate(ROWS):
        k = 104 / biggest
        cls = "env cinza" if r["mat"] == "envelope-cinza" else "env"
        strip = "#2b2b2b" if r["mat"] != "envelope-cinza" else "#55585c"
        d = json.dumps(r, ensure_ascii=False).replace('"', "&quot;")
        tiles += (f'<button type="button" class="tile" data-mat="{r["mat"]}" data-r="{d}" aria-pressed="{"true" if i == 0 else "false"}">'
                  f'<div class="box" aria-hidden="true"><div class="{cls}" style="width:{r["w"] * k:.0f}px;height:{r["h"] * k:.0f}px;--strip:{strip}"></div></div>'
                  f'<div><b>{r["size"]}</b><small>{r["name"]}</small></div><span class="price">{brl(r["best"] or r["low"])}<small style="display:inline;font-weight:500"> /un.</small></span></button>')
    body = f"""
<div class="head"><div><h2>Veja o tamanho antes de comprar</h2><p>Cada envelope desenhado na mesma escala. Toque em um para comparar com uma folha A4.</p></div>{tabs()}</div>
<div class="layout"><div class="tiles">{tiles}</div>
<aside class="side" aria-live="polite">
  <div><h3 id="s-t">19x25</h3><p class="sub" id="s-n">Envelope COEX</p></div>
  <div class="cmp" aria-hidden="true"><div class="a4" id="s-a4">A4</div><div class="env" id="s-env"></div></div>
  <div class="rows"><div><span>Até 999 un.</span><b id="s-lo"></b></div><div><span>1.000 ou mais</span><b class="best" id="s-be"></b></div><div><span>Mínimo</span><b id="s-mn"></b></div></div>
  <a class="btn" id="s-buy" href="{BUY}envelope-coex">Comprar este tamanho</a>
</aside></div>
<p class="note">Medidas em centímetros (largura x altura). Preços por unidade.</p>"""
    js = FILTER_JS + """
const brl = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);
function show(r) {
  const cm = 200 / Math.max(29.7, r.h, (21 + r.w) * 0.75);
  $('s-a4').style.width = 21 * cm + 'px'; $('s-a4').style.height = 29.7 * cm + 'px';
  const env = $('s-env'); env.style.width = r.w * cm + 'px'; env.style.height = r.h * cm + 'px';
  env.className = r.mat === 'envelope-cinza' ? 'env cinza' : 'env';
  env.style.setProperty('--strip', r.mat === 'envelope-cinza' ? '#55585c' : '#2b2b2b');
  $('s-t').textContent = r.size + ' cm'; $('s-n').textContent = r.name;
  $('s-lo').textContent = brl(r.low) + '/un.'; $('s-be').textContent = r.best ? brl(r.best) + '/un.' : 'mesmo preço';
  $('s-mn').textContent = r.min.toLocaleString('pt-BR') + ' un.'; $('s-buy').href = '""" + BUY + """' + r.mat;
}
document.querySelectorAll('.tile').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tile').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
  show(JSON.parse(t.dataset.r));
}));
show(JSON.parse(document.querySelector('.tile').dataset.r));"""
    return page("Modelo 4 · Tamanhos em escala", "Modelo 4 · Tamanhos em escala", css, body, js)

for name, fn in [("1-tabela", m1), ("2-cardapio", m2), ("3-quantidade", m3), ("4-escala", m4)]:
    open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8").write(fn())
    print("wrote", name)

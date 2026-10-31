# Builds docs/modelos-home/D-taste-skill/index.html from the real FNZ catalogue.
# Direction: tasteskill v2, "The specimen catalogue" (seed 835721478).
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "index.html")
WA = "https://wa.me/5547991490027"
SITE = "https://fanezzesupply.com.br"

def brl(c):
    return "R$ " + f"{c/100:.2f}".replace(".", ",")

# Same values as supabase/functions/_shared/catalog.ts
COEX = [("19x25", 27, 24), ("32x20", 36, 31), ("30x40", 66, 56), ("40x60", 136, 117), ("50x70", 171, 146)]
CINZA = [("20x30", 16, 14), ("26x36", 26, 20), ("32x40", 36, 26), ("40x50", 55, 46), ("40x60", 64, 55), ("50x70", 105, 77), ("70x60", 120, 87), ("50x90", 140, 102)]
ENV = [("20x30", 8, None), ("20x36", 8, None), ("32x40", 8, None), ("40x60", 8, None), ("30x70", 8, None)]
CATS = [
    ("coex", "Envelope COEX", "assets/envelope-branco.png", 500, COEX, "#ffffff", "#bdbdbd"),
    ("cinza", "Envelope Cinza", "assets/envelope-cinza.png", 500, CINZA, "#7b7d80", "#5e6063"),
    ("envelope", "Envelope preto ou branco", "assets/envelope-branco.png", 2000, ENV, "#ffffff", "#1a1a1a"),
]

sizes = []
for cid, name, img, mn, rows, body, strip in CATS:
    for s, p, best in rows:
        w, h = (int(v) for v in s.split("x"))
        sizes.append({"id": f"{cid}-{s}", "cat": name, "size": s, "w": w, "h": h, "price": brl(p),
                      "best": brl(best) if best else None, "min": mn, "body": body, "strip": strip, "img": img})

# Hero wall: brickwork of specimen tiles, three rotating fields, the two real envelopes.
fields = ["f1", "f2", "f3", "f4"]
wall = []
for r in range(9):
    tiles = []
    for c in range(16):
        k = (r * 5 + c * 3) % 7
        field = fields[(r + c) % 3] if k else "f4"
        img = "assets/envelope-cinza.png" if (r + c) % 2 else "assets/envelope-branco.png"
        tiles.append(f'<span class="tile {field}"><img src="{img}" alt="" width="200" height="250"></span>')
    wall.append(f'<div class="wall__row{" is-offset" if r % 2 else ""}">{"".join(tiles)}</div>')

materials = [
    ("coex", "COEX", "assets/envelope-branco.png", "f1", "Branco por fora, cinza por dentro. A partir de R$ 0,24 a unidade, mínimo de 500 por tamanho."),
    ("cinza", "Cinza", "assets/envelope-cinza.png", "f3", "Privacidade no envio e impermeável. A partir de R$ 0,14 a unidade, mínimo de 500 por tamanho."),
    ("envelope", "Preto ou branco", "assets/envelope-branco.png", "f2", "Para e-commerce e logística. R$ 0,08 a unidade em todos os tamanhos, mínimo de 2.000."),
    ("personalizado", "Com a sua marca", "assets/envelope-branco.png", "f4", "Envelope com a sua logomarca, sob orçamento. Produção em 30 dias, a partir de 2.000 unidades."),
]
mat_names = "".join(
    f'<li><button type="button" class="pick" data-img="{img}" data-field="{f}" data-fact="{html.escape(fact)}" aria-pressed="{"true" if i == 0 else "false"}">{n}</button></li>'
    for i, (_id, n, img, f, fact) in enumerate(materials))

def thousands(n):
    return f"{n:,}".replace(",", ".")

def row(s):
    note = f'<span class="row__note">{s["best"]} a partir de 1.000</span>' if s["best"] else '<span class="row__note">Mesmo preço em todos os tamanhos</span>'
    data = html.escape(json.dumps(s, ensure_ascii=False))
    return (f'<li><button type="button" class="row" data-size="{data}">'
            f'<img src="{s["img"]}" alt="" width="64" height="80" loading="lazy">'
            f'<span class="row__text"><span class="row__top"><b>{s["size"]}</b><span>{s["price"]}<small> /un.</small></span></span>'
            f'{note}<span class="row__min">Mínimo de {thousands(s["min"])} unidades</span></span></button></li>')

lists = []
for cid, name, img, mn, rows, *_ in CATS:
    items = [s for s in sizes if s["cat"] == name]
    lists.append(f'<div class="cat"><div class="cat__head"><h3>{name}</h3><span>{len(items)} tamanhos</span></div>'
                 f'<ul class="cat__rows">{"".join(row(s) for s in items)}</ul></div>')

faq = [
    ("Mínimo", "Qual a quantidade mínima?", "COEX e Cinza: 500 unidades por tamanho. Envelope preto ou branco e envelope personalizado: 2.000 unidades."),
    ("Preço", "Como funciona o preço por quantidade?", "No COEX e no Cinza, cada tamanho tem duas faixas: a partir de 1.000 unidades a unidade fica mais barata. O envelope preto ou branco tem preço único."),
    ("Frete", "Quanto custa o frete?", "Grátis para Joinville/SC. Para as demais localidades, R$ 19,90 por pedido."),
    ("NF-e", "Os pedidos têm nota fiscal?", "Sim. Todo pedido sai com NF-e emitida para o CNPJ da sua empresa."),
    ("Pagamento", "Como posso pagar?", "Pix, boleto (vence em 3 dias) ou cartão de crédito à vista."),
    ("Prazo", "Qual o prazo de entrega?", "Depende do endereço. Fale no WhatsApp para saber o prazo da sua cidade. O personalizado tem produção de 30 dias."),
]
cards = "".join(
    f'<details class="card c{i % 3}" style="--i:{i}"{" open" if i == 0 else ""}><summary><span class="card__tab">{t}</span><span class="card__q">{q}</span></summary><p>{a}</p></details>'
    for i, (t, q, a) in enumerate(faq))

tpl = open(os.path.join(HERE, "page.html"), encoding="utf-8").read()
page = (tpl.replace("{{WALL}}", "\n".join(wall)).replace("{{MATERIALS}}", mat_names)
        .replace("{{MAT0_IMG}}", materials[0][2]).replace("{{MAT0_FACT}}", materials[0][4])
        .replace("{{LISTS}}", "\n".join(lists)).replace("{{FAQ}}", cards)
        .replace("{{FIRST}}", html.escape(json.dumps(sizes[0], ensure_ascii=False)))
        .replace("{{WA}}", WA).replace("{{SITE}}", SITE))
open(OUT, "w", encoding="utf-8").write(page)
print("wrote", OUT, len(page) // 1024, "KB,", len(sizes), "sizes")

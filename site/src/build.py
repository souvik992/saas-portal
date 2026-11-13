"""Builds posinext.com into site/public as static HTML (no JavaScript). Run: python site/src/build.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from kit import (PORTAL, EMAIL, SITE, UPDATED, esc, ico, img, page, check_list, ticks, btns, sec_head, cards,
                 faq_section, cta_band, crumbs, software)
from products import P, BY_SLUG
import pages
import posts

OUT = Path(__file__).resolve().parent.parent / "public"
BUILT = []  # (path, priority)


def write(path, doc, priority="0.7"):
    f = OUT / path.strip("/") / "index.html" if path.endswith("/") else OUT / path
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(doc, encoding="utf-8")
    if not path.endswith(".html") or path == "/":
        BUILT.append((path, priority))


# ---------------- shared pieces ----------------
def feature_block(p, home=True):
    """The zig-zag product block of the home page."""
    rv = " rv" if p["side"] == "l" else ""
    tone = f' {p["tone"]}' if p["tone"] else ""
    dot = tone
    side = "fs-r" if p["side"] == "r" else "fs-l"
    head = f'<h3>{p["name"]}</h3>'
    return (f'<article id="{p["slug"]}" class="ft-a{rv}"><div class="rel"><div class="fr">{img(p["img"], p["alt"])}</div>'
            f'<div class="fl fs {side}"><span class="dot{dot}"></span><div><b>{p["stat"]}</b><small>{p["statl"]}</small></div></div></div>'
            f'<div class="rel"><div class="tg"><span class="ti{tone}">{ico(p["icon"], "i5")}</span>'
            f'<span class="tl">{p["num"]} · {p["group"]}</span></div>{head}<p class="d">{p["home"]}</p>'
            f'{check_list(p["bullets"])}<a class="ln" href="/{p["slug"]}/">Explore {p["name"]} {ico("arrow")}</a></div></article>')


def platform_strip():
    lis = "".join(f'<li><a href="/{p["slug"]}/"><span class="pi">{ico(p["icon"], "i6")}</span><span>{p["name"]}</span></a></li>' for p in P)
    return f'<div class="pl"><ul>{lis}</ul></div>'


# ---------------- home ----------------
HOME_FAQ = [
    ("What is POSINEXT?", "POSINEXT is restaurant POS software made for India: billing, KOTs, table management, Table QR ordering, a captain app, kitchen display, online ordering (website, app, Swiggy and Zomato) and reports, for fine dine restaurants, QSRs, cafés and cloud kitchens."),
    ("Does POSINEXT work without internet?", "Yes. The POS runs on your outlet's Windows PC, so billing, KOTs, the captain app and kitchen screens keep working on your local network when the internet is down. Online orders and backups catch up when it is back."),
    ("How much does POSINEXT cost?", 'Plans are ₹10,800, ₹18,000 and ₹27,000 per outlet per year plus GST, with a 30-day free trial. See <a href="/pricing/">pricing</a>.'),
    ("Is there a free trial?", f'Yes, 30 days, with no card. <a href="{PORTAL}/register">Create an account</a>, download the POS and start billing.'),
    ("Does POSINEXT integrate with Swiggy and Zomato?", 'Yes. Swiggy and Zomato orders arrive in the POS, are accepted automatically and print as KOTs. See <a href="/swiggy-zomato-integration/">Swiggy &amp; Zomato integration</a>.'),
    ("What hardware do I need?", 'A Windows 10 or 11 PC and a 58 or 80 mm thermal printer. Captains use Android phones; kitchen screens can be any PC or screen on the network. See the <a href="/docs/">documentation</a>.'),
]


def home():
    hero = (f'<section class="hero"><div class="w"><div class="rel"><span class="ey ey-h">Restaurant POS software</span>'
            f'<h1>The POS built for <span class="pc">modern restaurants</span></h1>'
            f'<p class="lead">From dine-in to delivery, POSINEXT connects every touchpoint — POS, Table QR, Captain App, Cloud Kitchen and your own delivery channels — in one unified platform.</p>'
            + btns(("Book a Demo", "/book-a-demo/"), ("Explore products", "#products"))
            + ticks(["No setup fees", "Free onboarding", "24/7 support"])
            + f'</div><div class="rel"><div class="fr"><div class="dots"><i></i><i></i><i></i></div>'
            f'{img("core-pos", "POSINEXT restaurant POS dashboard showing live tables and an open order", eager=True)}</div>'
            f'<div class="fl fl-h"><span class="ib">{ico("trend")}</span><div><small>Revenue today</small><b>₹1,84,250 <em>↑ 18%</em></b></div></div></div></div></section>')
    stats = ('<section class="st"><div class="w">' + "".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in [
        ("500+", "Restaurants"), ("9", "Integrated products"), ("99.9%", "Uptime SLA"), ("2M+", "Orders processed")]) + "</div></section>")
    chips = '<nav class="chips" aria-label="Products">' + "".join(
        f'<a class="chip" href="#{p["slug"]}">{ico(p["icon"])}{p["name"]}</a>' for p in P) + "</nav>"
    products = (f'<section id="products" class="big"><div class="w">'
                + sec_head("The full ecosystem", "Every product your restaurant needs",
                           "Mix and match add-ons to build the exact stack your operation demands — all in sync.")
                + chips + '<div class="fts">' + "".join(feature_block(p) for p in P) + "</div></div></section>")
    analytics = (f'<section id="analytics" class="ink ink-g big"><div class="w"><div class="rel"><p class="ey">Data-driven decisions</p>'
                 f'<h2 class="t">Analytics that actually drive revenue</h2><p class="lead mt5">From item-level profitability to peak-hour heatmaps, POSINEXT surfaces the numbers that matter. Export reports, set targets, and watch margins improve week over week.</p>'
                 f'<dl><div><dt>40+</dt><dd>Ready-made reports</dd></div><div><dt>Live</dt><dd>Sales &amp; stock</dd></div><div><dt>8%</dt><dd>Avg. margin lift</dd></div></dl>'
                 f'<a class="btn btn-w mt10" href="/features/#reports">See analytics in action {ico("arrow")}</a></div>'
                 f'<div class="fr">{img("analytics", "POSINEXT analytics dashboard with a revenue chart and a peak-hours heatmap")}</div></div></section>')
    platform = (f'<section id="platform" class="big bs"><div class="w">'
                + sec_head("Platform architecture", "One platform. Everything connected.",
                           "Every product shares a single data layer — orders, menus, inventory and analytics stay in perfect sync.")
                + platform_strip() + '<div class="m16">'
                + cards([("shield", "Secure by design", "Staff PINs and roles, manager approval for sensitive actions, paired devices only and a full audit log of every change.", "/security/"),
                         ("zap", "Sub-second performance", "Optimised for high-volume peak hours — handles 1,000+ orders per hour without slowing down.", "/features/"),
                         ("activity", "Real-time everywhere", "Every screen and every device updates live — no refresh, no lag, no double entry.", "/features/")])
                + "</div></div></section>")
    fq, fq_schema = faq_section(HOME_FAQ, "Restaurant POS questions, answered")
    body = hero + stats + products + analytics + platform + fq + cta_band(cls="big")
    desc = "Restaurant POS & billing software for fine dine, QSR, cafés and cloud kitchens in India. KOT, Table QR, captain app, Swiggy & Zomato. Works offline. Free trial."
    schema = [software("POSINEXT Restaurant POS", desc, SITE + "/",
                       ["GST billing", "KOT printing by kitchen station", "Table management", "Table QR ordering", "Captain app",
                        "Kitchen display", "Swiggy and Zomato integration", "Online ordering website", "Inventory and recipes",
                        "Reports", "Offline mode", "Automatic backups"]), fq_schema,
              {"@type": "ItemList", "name": "POSINEXT products", "itemListElement": [
                  {"@type": "ListItem", "position": i + 1, "name": p["name"].replace("&amp;", "&"), "url": f'{SITE}/{p["slug"]}/'} for i, p in enumerate(P)]}]
    write("/", page("/", "Restaurant POS Software & Billing System in India | POSINEXT", desc, body, schema, preload="core-pos"), "1.0")


# ---------------- product pages ----------------
def product(p):
    bc, bc_schema = crumbs([("Products", "/features/"), (p["name"], f'/{p["slug"]}/')])
    hero = (f'{bc}<section class="hero sm"><div class="w"><div class="rel"><span class="ey ey-h">{p["num"]} · {p["group"]}</span>'
            f'<h1>{p["h1"]}</h1><p class="lead">{p["lead"]}</p>'
            + btns(("Book a Demo", "/book-a-demo/"), ("Start free trial", PORTAL + "/register"))
            + ticks(["30-day free trial", "Works offline", "Made for India"])
            + f'</div><div class="rel"><div class="fr">{img(p["img"], p["alt"], eager=True)}</div>'
            f'<div class="fl fs fs-l"><span class="dot"></span><div><b>{p["stat"]}</b><small>{p["statl"]}</small></div></div></div></div></section>')
    feats = (f'<section class="sec bs"><div class="w">' + sec_head("What you get", f'{p["name"]} features')
             + '<div class="mt14">' + cards(p["features"]) + "</div></div></section>")
    steps = (f'<section class="sec"><div class="w">' + sec_head("How it works", f'Up and running in four steps')
             + '<div class="mt14">' + cards([(None, f"{i + 1}. {t}", d) for i, (t, d) in enumerate(p["steps"])], "cards c2") + "</div></div></section>")
    rel = [BY_SLUG[s] for s in p["related"]]
    related = (f'<section class="sec bs"><div class="w">' + sec_head("Works together", "Pairs well with")
               + '<div class="mt14">' + cards([(r["icon"], r["name"], r["home"], f'/{r["slug"]}/') for r in rel]) + "</div>"
               + f'<p class="c mt10"><a class="ln" href="/pricing/">Compare plans and prices {ico("arrow")}</a></p></div></section>')
    fq, fq_schema = faq_section(p["faqs"], f'{p["name"]} FAQ')
    body = hero + feats + steps + related + fq + cta_band()
    sw = software(f'POSINEXT {p["name"].replace("&amp;", "&")}', p["desc"], f'{SITE}/{p["slug"]}/', [f[1] for f in p["features"]])
    write(f'/{p["slug"]}/', page(f'/{p["slug"]}/', p["title"], p["desc"], body, [bc_schema, sw, fq_schema], preload=p["img"]), "0.9")


def simple(path, title, desc, eyebrow, h1, lead, inner, trail, schema=(), priority="0.7", cta=True, ctas=None, noindex=False):
    """A text page: breadcrumbs, header block, content, CTA band."""
    bc, bc_schema = crumbs(trail) if trail else ("", None)
    c = btns(*ctas) if ctas else ""
    body = (f'{bc}<section class="ph"><div class="w"><span class="ey ey-h">{eyebrow}</span><h1>{h1}</h1>'
            f'<p class="lead">{lead}</p>{c}</div></section>{inner}' + (cta_band() if cta else ""))
    sch = ([bc_schema] if bc_schema else []) + list(schema)
    write(path, page(path, title, desc, body, sch, noindex=noindex), priority)


def images():
    """src/images/<key>.(jpg|png) -> public/img/<key>-<480|800|1200>.webp (only when missing or older), and img/og.jpg."""
    from PIL import Image
    src = Path(__file__).parent / "images"
    (OUT / "img").mkdir(exist_ok=True)
    for f in sorted(src.iterdir()):
        key = f.stem
        if key == "og":
            o = OUT / "img" / "og.jpg"
            if not o.exists() or o.stat().st_mtime < f.stat().st_mtime:
                Image.open(f).convert("RGB").resize((1200, 675), Image.LANCZOS).save(o, "JPEG", quality=80, optimize=True, progressive=True)
            continue
        im = None
        for w in (480, 800, 1200):
            o = OUT / "img" / f"{key}-{w}.webp"
            if o.exists() and o.stat().st_mtime >= f.stat().st_mtime:
                continue
            im = im or Image.open(f).convert("RGB")
            im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(o, "WEBP", quality=68 if w > 480 else 62, method=6)


def main():
    images()
    home()
    for p in P:
        product(p)
    pages.build(simple, write)
    posts.build(simple, write)
    pages.extras(write, BUILT)
    check_font_coverage()
    print(f"built {len(BUILT)} pages into {OUT}")


def check_font_coverage():
    """Warns when a page shows a character the subset fonts lack (add it to FONT_TEXT in kit.py)."""
    import html as h
    import re
    from kit import FONT_TEXT
    seen = set()
    for f in OUT.rglob("*.html"):
        s = re.sub(r"<(script|style|svg)[^>]*>.*?</\1>", "", f.read_text(encoding="utf-8"), flags=re.S)
        seen |= set(h.unescape(re.sub(r"<[^>]+>", " ", s)))
    missing = sorted(c for c in seen - set(FONT_TEXT) if not c.isspace())
    if missing:
        print("WARNING: characters not in the fonts (add to FONT_TEXT in kit.py):", "".join(missing))


if __name__ == "__main__":
    main()

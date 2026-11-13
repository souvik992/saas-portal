"""Reusable building blocks for posinext.com: the page shell (head, header, footer), icons and section components.
Everything is rendered at build time into plain HTML; pages ship no JavaScript."""
import html
import json
import re
from pathlib import Path

SITE = "https://posinext.com"
PORTAL = "https://portal.posinext.com"
EMAIL = "support@posinext.com"
WA = "917872735817"
UPDATED = "2026-11-13"
CSS = (Path(__file__).parent / "site.css").read_text(encoding="utf-8")


def esc(s):
    return html.escape(s, quote=True)


def minify_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)
    return css.replace(";}", "}").strip()


CSS_MIN = minify_css(CSS)

# ---- icons (Lucide, ISC licence): one <symbol> per icon, only the ones a page uses are inlined ----
ICONS = {
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "utensils": '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3M19 5l-7 7"/>',
    "qr": '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01"/>',
    "phone": '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    "chef": '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    "bike": '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    "bag": '<path d="M16 10a4 4 0 0 1-8 0M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
    "printer": '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "trend": '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    "activity": '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    "menu": '<path d="M4 5h16M4 12h16M4 19h16"/>',
    "chart": '<path d="M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3"/>',
    "wifioff": '<path d="M12 20h.01M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 5.17-2.69M19 12.859a10 10 0 0 0-2.007-1.523M2 8.82a15 15 0 0 1 4.177-2.643M22 8.82a15 15 0 0 0-11.288-3.764M2 2l20 20"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "chat": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "book": '<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "buoy": '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
    "calendar": '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "receipt": '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
    "package": '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12M3.3 7l7.703 4.734a2 2 0 0 0 1.994 0L20.7 7M7.5 4.27l9 5.15"/>',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "download": '<path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5"/>',
    "bell": '<path d="M10.268 21a2 2 0 0 0 3.464 0M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
}


def ico(name, cls=""):
    return f'<svg class="i{" " + cls if cls else ""}" aria-hidden="true"><use href="#i-{name}"/></svg>'


def sprite(body):
    used = sorted(set(re.findall(r'href="#i-([a-z]+)"', body)))
    if not used:
        return ""
    syms = "".join(f'<symbol id="i-{n}" viewBox="0 0 24 24">{ICONS[n]}</symbol>' for n in used)
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">{syms}</svg>'


LOGO = ('<span class="logo"><svg viewBox="0 0 32 24" aria-hidden="true"><path class="a" d="M2 2 L12 12 L2 22 H8 L18 12 L8 2 Z"/>'
        '<path class="b" d="M14 2 L24 12 L14 22 H20 L30 12 L20 2 Z"/></svg>POSINEXT</span>')

# ---- images: WebP at 480/800/1200 px (img/<key>-<w>.webp), made by build.py from the originals ----
WIDE = {"qsr-billing", "ods-online-orders"}


def img(key, alt, eager=False, sizes="(min-width:1024px) 600px, calc(100vw - 2.5rem)"):
    h = 406 if key in WIDE else 504
    cls = ' class="wide"' if key in WIDE else ""
    srcset = ", ".join(f"/img/{key}-{w}.webp {w}w" for w in (480, 800, 1200))
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img src="/img/{key}-800.webp" srcset="{srcset}" sizes="{sizes}" width="800" height="{h}" '
            f'alt="{esc(alt)}"{cls} {load} decoding="async">')


# ---- navigation and footer ----
NAV = [("Products", "/#products"), ("Features", "/features/"), ("Pricing", "/pricing/"), ("Blog", "/blog/")]
FOOTER = [
    ("Product", [("Fine Dine", "/fine-dine-pos/"), ("QSR", "/qsr-pos/"), ("Features", "/features/"), ("Pricing", "/pricing/"),
                 ("Changelog", "/changelog/"), ("Compare", "/compare/petpooja-alternative/")]),
    ("Add-ons", [("Table QR", "/table-qr-ordering/"), ("Captain App", "/captain-app/"), ("Cloud Kitchen", "/cloud-kitchen-software/"),
                 ("Food Delivery App", "/food-delivery-app/"), ("Website Ordering", "/online-ordering-website/"),
                 ("App Ordering", "/app-ordering/"), ("Swiggy &amp; Zomato", "/swiggy-zomato-integration/")]),
    ("Company", [("About", "/about/"), ("Blog", "/blog/"), ("Careers", "/careers/"), ("Contact", "/contact/")]),
    ("Support", [("Documentation", "/docs/"), ("Help Center", "/help/"), ("Book a Demo", "/book-a-demo/"), ("Status", "/status/")]),
]


def header(path):
    links = "".join(f'<a href="{h}"{" aria-current=page" if h == path else ""}>{t}</a>' for t, h in NAV)
    mob = "".join(f'<a href="{h}">{t}</a>' for t, h in NAV + [("Contact", "/contact/"), ("Sign in", PORTAL + "/login")])
    return (f'<header class="hd"><div class="w"><a href="/" aria-label="POSINEXT home">{LOGO}</a>'
            f'<nav class="nv" aria-label="Main">{links}</nav>'
            f'<div class="hb"><a class="btn btn-sm btn-gh" href="{PORTAL}/login">Sign in</a>'
            f'<a class="btn btn-sm btn-p" href="/book-a-demo/">Book a Demo</a></div>'
            f'<details class="mn"><summary aria-label="Menu">{ico("menu")}</summary><nav class="mp" aria-label="Mobile">{mob}'
            f'<a class="btn btn-p" href="/book-a-demo/">Book a Demo</a></nav></details></div></header>')


def footer():
    cols = "".join(
        f'<div><h2>{title}</h2><ul>' + "".join(f'<li><a href="{h}">{t}</a></li>' for t, h in links) + "</ul></div>"
        for title, links in FOOTER)
    return (f'<footer class="ft"><div class="w"><div class="fg"><div class="fb">{LOGO}'
            f'<p>The complete restaurant operating system. One platform, every touchpoint. Restaurant POS software made for India.</p>'
            f'<p><a href="mailto:{EMAIL}">{EMAIL}</a></p></div>{cols}</div>'
            f'<div class="fbt"><p>&copy; 2026 POSINEXT. All rights reserved.</p><div><a href="/privacy/">Privacy</a>'
            f'<a href="/terms/">Terms</a><a href="/security/">Security</a><a href="/sitemap.xml">Sitemap</a></div></div></div></footer>')


# ---- components ----
def check_list(items, cls="ck"):
    return f'<ul class="{cls}">' + "".join(
        f'<li><span>{ico("check", "i3")}</span><span>{t}</span></li>' for t in items) + "</ul>"


def ticks(items):
    return '<ul class="tk">' + "".join(f'<li>{ico("check")}{t}</li>' for t in items) + "</ul>"


def btns(*pairs, light=False):
    out = []
    for i, (t, h) in enumerate(pairs):
        cls = ("btn-w" if i == 0 else "btn-l") if light else ("btn-p" if i == 0 else "btn-o")
        arrow = " " + ico("arrow") if i == 0 and not light else ""
        out.append(f'<a class="btn {cls}" href="{h}">{t}{arrow}</a>')
    return '<div class="ctas">' + "".join(out) + "</div>"


def sec_head(eyebrow, title, lead=None, tag="h2"):
    l = f'<p class="lead">{lead}</p>' if lead else ""
    return f'<div class="sh"><p class="ey">{eyebrow}</p><{tag} class="t">{title}</{tag}>{l}</div>'


def cards(items, cls="cards"):
    """items: (icon, title, text[, href])"""
    out = []
    for it in items:
        icon, t, p = it[:3]
        href = it[3] if len(it) > 3 else None
        inner = (f'<span class="ti">{ico(icon, "i5")}</span>' if icon else "") + f"<h3>{t}</h3><p>{p}</p>"
        out.append(f'<a class="cd" href="{href}">{inner}</a>' if href else f'<div class="cd">{inner}</div>')
    return f'<div class="{cls}">' + "".join(out) + "</div>"


def faq(items):
    """Visible FAQ (<details>, no JS) plus its FAQPage schema."""
    h = '<div class="fq">' + "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in items) + "</div>"
    strip = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s))
    schema = {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in items]}
    return h, schema


def faq_section(items, title="Frequently asked questions", eyebrow="FAQ", bg=""):
    h, schema = faq(items)
    return f'<section class="sec{bg}" id="faq"><div class="w">{sec_head(eyebrow, title)}{h}</div></section>', schema


def cta_band(title="Ready to modernise your restaurant?",
             text="Join 500+ restaurants already running on POSINEXT. Get set up in a day, not a week."):
    return (f'<section class="cta sec-s"><div class="w"><div class="bx"><h2>{title}</h2><p>{text}</p>'
            + btns(("Start your free trial", PORTAL + "/register"), ("Book a demo", "/book-a-demo/"), light=True)
            + "</div></div></section>")


def crumbs(trail):
    """trail: [(name, path), ...] after Home. Returns (html, schema)."""
    full = [("Home", "/")] + trail
    lis = "".join(
        (f'<li><a href="{p}">{n}</a></li>' if i < len(full) - 1 else f'<li aria-current="page">{n}</li>')
        for i, (n, p) in enumerate(full))
    schema = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": html.unescape(n), "item": SITE + p} for i, (n, p) in enumerate(full)]}
    return f'<nav class="bc w" aria-label="Breadcrumb"><ol>{lis}</ol></nav>', schema


ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "POSINEXT", "url": SITE + "/",
       "logo": {"@type": "ImageObject", "url": SITE + "/favicon.svg"}, "email": EMAIL,
       "description": "Restaurant POS software for fine dine restaurants, quick service restaurants and cloud kitchens in India.",
       "areaServed": {"@type": "Country", "name": "India"},
       "contactPoint": [{"@type": "ContactPoint", "contactType": "customer support", "email": EMAIL,
                         "areaServed": "IN", "availableLanguage": ["English", "Hindi"]},
                        {"@type": "ContactPoint", "contactType": "sales", "url": SITE + "/book-a-demo/", "areaServed": "IN"}]}
WEBSITE = {"@type": "WebSite", "@id": SITE + "/#website", "name": "POSINEXT", "url": SITE + "/",
           "inLanguage": "en-IN", "publisher": {"@id": SITE + "/#org"}}
OFFERS = {"@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": "10800", "highPrice": "27000", "offerCount": "3",
          "url": SITE + "/pricing/"}


def software(name, desc, url, extra=None):
    d = {"@type": "SoftwareApplication", "name": name, "url": url, "description": desc,
         "applicationCategory": "BusinessApplication", "applicationSubCategory": "Restaurant POS",
         "operatingSystem": "Windows 10, Windows 11, Android", "offers": OFFERS, "publisher": {"@id": SITE + "/#org"},
         "featureList": extra or []}
    if not extra:
        del d["featureList"]
    return d


def page(path, title, desc, body, schema=(), og_type="website", og_img="/img/og.jpg", preload=None, noindex=False, modified=None):
    """The full HTML document. path: '/x/' (canonical). schema: extra JSON-LD nodes."""
    url = SITE + path
    graph = [ORG, WEBSITE, {"@type": "WebPage", "@id": url + "#page", "url": url, "name": title, "description": desc,
                            "inLanguage": "en-IN", "isPartOf": {"@id": SITE + "/#website"},
                            "dateModified": modified or UPDATED}] + list(schema)
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    pre = ""
    if preload:
        key = preload
        srcset = ", ".join(f"/img/{key}-{w}.webp {w}w" for w in (480, 800, 1200))
        pre = (f'<link rel="preload" as="image" type="image/webp" imagesrcset="{srcset}" '
               f'imagesizes="(min-width:1024px) 600px, calc(100vw - 2.5rem)" fetchpriority="high">')
    robots = "noindex,follow" if noindex else "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    head = (f'<!doctype html><html lang="en-IN"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f"<title>{esc(title)}</title><meta name=\"description\" content=\"{esc(desc)}\">"
            f'<link rel="canonical" href="{url}"><meta name="robots" content="{robots}">'
            f'<style>{CSS_MIN}</style>{pre}'
            f'<link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#f15b00">'
            f'<link rel="alternate" hreflang="en-IN" href="{url}"><link rel="alternate" hreflang="x-default" href="{url}">'
            f'<meta name="author" content="POSINEXT"><meta name="geo.region" content="IN">'
            f'<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="POSINEXT">'
            f'<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">'
            f'<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{og_img}">'
            f'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="675">'
            f'<meta property="og:locale" content="en_IN"><meta name="twitter:card" content="summary_large_image">'
            f'<meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(desc)}">'
            f'<meta name="twitter:image" content="{SITE}{og_img}">'
            f'<link rel="alternate" type="text/plain" title="POSINEXT for AI assistants" href="/llms.txt">'
            f'<script type="application/ld+json">{ld}</script></head>')
    main = f'<a class="skip" href="#main">Skip to content</a>{header(path)}<main id="main">{body}</main>{footer()}'
    doc = f"{head}<body>{sprite(main)}{main}</body></html>"
    return re.sub(r">\s+<", "><", doc)

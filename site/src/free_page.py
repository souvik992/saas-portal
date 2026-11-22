"""/free-restaurant-pos/: the Free plan's landing page, written for people searching for a free restaurant POS or free
restaurant billing software in India. The Free plan (2026-11-22): every feature on one billing PC per product, no
limits on bills, menu items or sales, for as long as the shop uses it; every account moves to it after the 30-day trial
(posinext-cloud hub/src/licences.ts sweepFree). Keep the claims here true to that."""
from kit import PORTAL, SITE, EMAIL, ico, img, btns, ticks, sec_head, cards, check_list, faq_section, crumbs, page

PATH = "/free-restaurant-pos/"
SIGNUP = PORTAL + "/register"
TITLE = "Free Restaurant POS Software India, Free Forever | POSINEXT"
DESC = ("Free restaurant POS & billing software for India: GST bills, KOT, Table QR, captain app, Swiggy & Zomato. "
        "Works offline, no bill limits. Sign up free.")

INCLUDED = [
    ("receipt", "Free GST billing software", "GST bills with CGST and SGST, inclusive or exclusive prices, UPI QR on the bill, cash, card and split payments, held bills and discounts."),
    ("printer", "Free KOT printing", "Kitchen order tickets go to the right station's printer by themselves, with change and cancel slips. 58 and 80 mm thermal printers."),
    ("chef", "Free kitchen display (KDS)", "Tickets on a kitchen screen with New, Ready and All-day views; late tickets turn amber, then red, with a chime for new orders."),
    ("qr", "Free Table QR ordering", "Guests scan the QR on the table, see your menu with photos and order. Orders reach the POS and the kitchen at once."),
    ("phone", "Free captain app", "Waiters take orders at the table on an Android phone and send KOTs to the kitchen without walking to the counter."),
    ("bike", "Swiggy &amp; Zomato in the POS", "Online orders from Swiggy, Zomato, your website and your app on one screen, accepted with a tap and printed as KOTs."),
    ("package", "Free inventory and recipes", "Raw materials, purchases and recipes that use up stock as you sell, with low-stock alerts and wastage."),
    ("chart", "40+ free restaurant reports", "Daily sales, item-wise and category-wise sales, GST by rate, payment modes, cash register and day-end Z-report. Export to CSV."),
    ("wifioff", "Free offline billing", "Billing runs on your own PC, so the internet going down never stops a bill. Backups every 15 minutes and at day end."),
]

WHO = [
    ("utensils", "Restaurants and dine-in", "Floor plan, tables, captain app, split bills and KOTs by station: the free fine dine POS.", "/fine-dine-pos/"),
    ("zap", "Cafés and QSRs", "Fast counter billing with a photo menu, tokens and held bills: the free QSR and café POS.", "/qsr-pos/"),
    ("layers", "Cloud kitchens", "Swiggy, Zomato and your own website orders on one screen: a free cloud kitchen POS.", "/cloud-kitchen-software/"),
    ("bag", "Bakeries, sweet shops and tiffin centres", "Quick billing by item or weight, GST bills and stock: free billing software for food shops.", "/qsr-pos/"),
    ("pin", "Dhabas and family restaurants", "Simple table billing, KOTs and day-end reports on one PC, offline when the internet is not.", "/fine-dine-pos/"),
    ("globe", "Food trucks and kiosks", "One PC or laptop, a thermal printer and UPI: a free POS that keeps working without the internet.", "/qsr-pos/"),
]

STEPS = [
    ("1. Sign up free", f'Create your account in a minute at <a class="pc" href="{SIGNUP}">portal.posinext.com</a> with your email and mobile. No card, no payment.'),
    ("2. Download the POS", "Download POSINEXT for Windows 10 or 11 from your account: Fine Dine for table service, QSR for counters, cafés and cloud kitchens."),
    ("3. Start billing", "Sign in inside the app, add your menu (or upload it from a spreadsheet), connect your printer and print your first GST bill."),
]

FAQ = [
    ("Is POSINEXT really a free restaurant POS?",
     "Yes. The Free plan costs ₹0 and has no end date: every feature on one billing PC per outlet, with no limit on bills, menu items or sales. "
     "You start with a 30-day trial and then stay on the Free plan by yourself; nothing locks and you never enter a card."),
    ("What is the catch with the free POS?",
     "There is no catch in the software: billing, KOT, kitchen display, Table QR, captain app, Swiggy and Zomato, stock and reports are all included. "
     "The Free plan is for one billing PC (plus one captain phone and one kitchen screen) and self-service setup with help-centre and email support. "
     f'Paid plans add more PCs, installation and training visits and priority support. See <a href="/pricing/">pricing</a>.'),
    ("Which is the best free restaurant POS software in India?",
     "Look for a free POS that prints GST-compliant bills, sends KOTs to the kitchen, keeps billing when the internet is down and does not cap your bills, "
     "menu or turnover. POSINEXT's Free plan does all four, and adds Table QR ordering, a captain app and Swiggy and Zomato orders."),
    ("Is there free restaurant billing software with GST?",
     "Yes. POSINEXT prints GST bills with CGST and SGST (or IGST), your GSTIN and FSSAI number, gap-free bill numbers per financial year and GST-by-rate reports, on the Free plan."),
    ("Can I download a free POS for Windows?",
     f'Yes. <a href="{SIGNUP}">Sign up free</a>, then download POSINEXT for Windows 10 or 11 from your account. It installs like any Windows app and works offline.'),
    ("Does the free POS work without internet?",
     "Yes. Billing, KOTs and reports run on your own PC, so bills keep printing when the internet is down. Online orders and online backups catch up when it is back."),
    ("Is it free for cafés, QSRs and cloud kitchens too?",
     'Yes. Choose QSR (quickPOS) for counters, cafés, bakeries and cloud kitchens, or Fine Dine (DinePOS) for table service. Both are on the Free plan, and you can use both.'),
    ("What hardware do I need?",
     "A Windows 10 or 11 PC or laptop and a 58 mm or 80 mm thermal receipt printer (USB, LAN, Wi-Fi or Bluetooth). An Android phone for the captain app and any screen for the kitchen display are optional."),
    ("What happens after the 30-day trial?",
     "Nothing stops. Your POS moves to the Free plan by itself, with every feature on one PC, and keeps renewing while the PC goes online now and then. You only pay if you choose a plan for more PCs or support."),
    ("Is POSINEXT a free alternative to Petpooja?",
     'POSINEXT has a free plan with every feature on one PC, and its paid plans are priced 10% below Petpooja\'s published rates. '
     'See <a href="/compare/petpooja-alternative/">POSINEXT vs Petpooja</a>.'),
]

COMPARE = [  # (what, POSINEXT Free, what free POS apps often do)
    ("Price", "₹0, no end date", "Free for a few weeks, then paid"),
    ("Bills, menu items and turnover", "No limits", "Capped bills, items or yearly sales"),
    ("KOT and kitchen display", "Included", "Paid add-on"),
    ("Table QR, captain app", "Included", "Paid add-on or missing"),
    ("Swiggy and Zomato orders", "Included", "Paid add-on"),
    ("Works without internet", "Yes, bills on your own PC", "Often online only"),
    ("Card needed to start", "No", "Often yes"),
]


def build(write):
    bc, bc_schema = crumbs([("Pricing", "/pricing/"), ("Free restaurant POS", PATH)])
    price_card = ('<div class="fz-card" aria-label="The Free plan"><div class="fz-top"><span class="fz-tag">Free plan</span>'
                  '<span class="fz-forever">forever</span></div>'
                  '<p class="fz-price">₹0<small> / outlet / year</small></p><p class="fz-sub">Every feature on one billing PC</p>'
                  + check_list(["GST billing, KOT &amp; UPI QR", "Kitchen display &amp; captain app", "Table QR, Swiggy &amp; Zomato",
                                "Stock, recipes &amp; 40+ reports", "Unlimited bills &amp; menu items"])
                  + f'<a class="btn btn-p" href="{SIGNUP}">Sign up free {ico("arrow")}</a>'
                  '<p class="fz-fine">No card. 30-day trial first, then free for good.</p></div>')
    hero = (f'{bc}<section class="hero sm fz-hero"><div class="w"><div class="rel"><span class="ey ey-h">Free restaurant POS software · India</span>'
            '<h1>The <span class="pc">free restaurant POS</span> with every feature included</h1>'
            '<p class="lead">GST billing, KOT, kitchen display, Table QR, captain app and Swiggy &amp; Zomato orders, free on one PC. '
            'No limits on bills or menu items, no card, and it keeps billing when the internet is down.</p>'
            + btns(("Sign up free", SIGNUP), ("Download for Windows", SIGNUP))
            + ticks(["₹0 forever on 1 PC", "No card needed", "Works offline", "GST ready"])
            + f'</div><div class="rel fz-vis"><div class="fr">{img("core-pos", "POSINEXT free restaurant POS showing tables and an open order", eager=True)}</div>'
            + price_card + "</div></div></section>")
    stats = ('<section class="st"><div class="w">' + "".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in [
        ("₹0", "Free forever on one PC"), ("0", "Limits on bills or menu items"), ("9", "Modules included free"), ("2", "Products: Fine Dine and QSR")]) + "</div></section>")
    included = (f'<section class="sec" id="features"><div class="w">'
                + sec_head("Everything included", "A free POS that is not a demo",
                           "Most free restaurant billing software stops at the bill. POSINEXT's Free plan includes the whole restaurant: counter, kitchen, tables and online orders.")
                + '<div class="mt14">' + cards(INCLUDED) + "</div></div></section>")
    who = (f'<section class="sec bs" id="who"><div class="w">'
           + sec_head("Made for every food business", "Free POS for restaurants, cafés and cloud kitchens",
                      "One free POS for every format, with a version made for table service and one made for the counter.")
           + '<div class="mt14">' + cards(WHO) + "</div></div></section>")
    steps = (f'<section class="sec" id="start"><div class="w">' + sec_head("Sign up and download", "Free POS in three steps", "Sign up, download and print your first GST bill the same day.")
             + '<ol class="fz-steps mt14">' + "".join(f'<li><h3>{t}</h3><p>{d}</p></li>' for t, d in STEPS) + "</ol>"
             + '<div class="ctas fz-c mt10">' + f'<a class="btn btn-p" href="{SIGNUP}">Sign up free {ico("arrow")}</a>'
             + f'<a class="btn btn-o" href="{SIGNUP}">{ico("download")} Download for Windows</a></div>'
             + '<p class="c mc mt4 fz-small">Windows 10 or 11 · 58/80 mm thermal printer · Android phone optional for the captain app</p></div></section>')
    table = ('<div class="tb fz-tb"><table><thead><tr><th>What you get</th><th>POSINEXT Free</th><th>Many “free” POS apps</th></tr></thead><tbody>'
             + "".join(f'<tr><td>{a}</td><td><b class="fz-yes">{ico("check")}{b}</b></td><td class="mc">{c}</td></tr>' for a, b, c in COMPARE)
             + "</tbody></table></div>")
    compare = (f'<section class="sec bs" id="compare"><div class="w">'
               + sec_head("No catch", "Free means free, not a trial that locks", "Compare what you get with the usual free POS offer.")
               + table + "</div></section>")
    plans = ('<section class="sec" id="plans"><div class="w">'
             + sec_head("When you grow", "Stay free, or add more PCs", "The Free plan is complete for one billing PC. Add PCs, visits and support only when you need them.")
             + '<div class="fz-two mt14"><div class="cd"><span class="ti g">' + ico("check", "i5") + '</span><h3>Free · ₹0</h3>'
             + check_list(["Every feature on one billing PC", "1 captain phone and 1 kitchen screen (Fine Dine)", "Unlimited bills, menu items and sales", "Help centre and email support"])
             + f'</div><div class="cd"><span class="ti">{ico("trend", "i5")}</span><h3>Paid plans · from ₹10,800 / year</h3>'
             + check_list(["More billing PCs, captain phones and kitchen screens", "Installation and training, online or on site", "Ticket and priority support", "Priced 10% below Petpooja's published rates"])
             + f'<a class="ln mt6" href="/pricing/">Compare plans {ico("arrow")}</a></div></div></div></section>')
    fq, fq_schema = faq_section(FAQ, "Free restaurant POS: questions, answered", bg=" bs")
    band = ('<section class="cta big"><div class="w"><div class="bx"><h2>Start billing free today</h2>'
            '<p>Sign up free, download POSINEXT for Windows and print your first GST bill in minutes. No card, no limits on bills.</p>'
            + btns(("Sign up free", SIGNUP), ("Book a free demo", "/book-a-demo/"), light=True) + "</div></div></section>")
    body = hero + stats + included + who + steps + compare + plans + fq + band

    software = {"@type": "SoftwareApplication", "name": "POSINEXT Free Restaurant POS", "url": SITE + PATH, "description": DESC,
                "applicationCategory": "BusinessApplication", "applicationSubCategory": "Restaurant POS",
                "operatingSystem": "Windows 10, Windows 11, Android", "publisher": {"@id": SITE + "/#org"},
                "downloadUrl": SIGNUP, "isAccessibleForFree": True,
                "offers": {"@type": "Offer", "name": "Free plan", "price": "0", "priceCurrency": "INR", "url": SITE + PATH,
                           "availability": "https://schema.org/InStock", "category": "free"},
                "featureList": [t.replace("&amp;", "&") for _, t, _ in INCLUDED]}
    write(PATH, page(PATH, TITLE, DESC, body, [bc_schema, software, fq_schema], preload="core-pos"), "0.9")

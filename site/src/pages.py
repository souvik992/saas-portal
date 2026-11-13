"""Footer pages: Product (features, pricing, changelog, compare), Company, Support and policies; plus sitemap, robots, llms."""
import json
from urllib.parse import quote
from kit import PORTAL, EMAIL, SITE, demo_form, UPDATED, ico, check_list, cards, faq_section, sec_head, btns, page, crumbs
from products import P

PLANS = [
    ("Base", 10800, "Billing, menu, stock and reports for one outlet.", False, None,
     ["Fine Dine (DinePOS) or QSR (Tiffin POS)", "Billing with GST and UPI, works offline", "Menu management, stock and recipes",
      "Reports and automatic backups", "Online installation and training", "Support by ticket and email"]),
    ("Growth", 18000, "Add-ons for busier floors and kitchens.", True, "Base",
     ["Captain app for waiters' phones", "Kitchen display", "Table QR ordering and waiter calling",
      "ODS: website, app, Swiggy and Zomato orders on one screen", "Installation and training: 1 visit"]),
    ("Scale", 27000, "For high-volume outlets that want us on site.", False, "Growth",
     ["Installation and training: 2 visits", "Priority support"]),
]
def rupees(n):
    s = str(n)
    if len(s) <= 3:
        return "₹" + s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return "₹" + ",".join(parts) + "," + tail


def W(inner, cls="sec-s"):
    return f'<section class="{cls}"><div class="w">{inner}</div></section>'


def prose(html_):
    return W(f'<div class="pr">{html_}</div>')


def build(simple, write):
    # ---------- Features ----------
    groups = [
        ("receipt", "Billing and payments", "billing", ["GST bills, inclusive or exclusive, with GST by rate in reports", "Cash, UPI, card and split payments, with change", "UPI QR code printed on the bill", "Held bills, discounts within role limits and service charge", "Split bills equally, by item or by share", "Void, reprint and credit notes with reasons", "Bill design with logo for 58 and 80 mm printers", "Day end with Z-report; financial-year bill numbers without gaps"]),
        ("monitor", "Tables and floor", "floor", ["Floor plan by area with drag-and-drop layout", "Table status: running, cooking, food ready, served, bill printed", "Move and merge tables, transfer items", "Reservations that hold tables, and a waitlist", "Captain sections and table assignment", "Guest count and per-cover sales"]),
        ("chef", "Kitchen", "kitchen", ["KOTs routed to each kitchen station's printer", "Change and cancel slips; exact KOT reprints", "Kitchen display with New, Ready and All-day views", "Ticket ages turn amber and red when late; chime on new tickets", "Print queue that never loses a ticket, with a print alarm", "Kitchen speed, dish prep times and kitchen-by-hour reports"]),
        ("layers", "Online orders", "online", ["Swiggy and Zomato orders straight into the POS", "Own website and app ordering, commission-free", "Automatic or staff accepting; chime until handled", "KOTs printed automatically, with the customer's note", "Delivery areas, charges and a store map", "Orders wait in the cloud if the shop's internet drops"]),
        ("package", "Stock and menu", "stock", ["Raw materials, purchases, wastage and stock counts", "Recipes per dish, size and add-on that use up stock as you sell", "Low-stock badge and usage report", "Menu and recipe bulk upload from CSV", "Dish photos, add-on groups, sizes and area prices", "Mark dishes sold out in a tap"]),
        ("chart", "Reports and analytics", "reports", ["Daily sales, item-wise, category-wise and area-wise", "GST by rate, payment modes and cash register", "Discounts, voids and cancellations, KOT changes and reprints", "Table turnover and captain performance", "Kitchen speed and prep times", "Export any report to CSV"]),
        ("shield", "Staff and security", "security", ["Name and PIN sign-in with lockout", "Roles with rights; manager PIN for sensitive actions", "Only paired devices can connect; revoke one at once", "Audit log of every change", "Leakage dashboard: who did what, when and why", "Encrypted HTTPS connections to PosiNext Cloud"]),
        ("database", "Reliability", "reliability", ["Works offline on your outlet's PC", "Backups every 15 minutes and at day end", "Copy backups to a USB drive or folder", "Online backups to PosiNext Cloud", "Restore with the owner's PIN, keeping a safety copy", "Devices find the main PC again if its address changes"]),
    ]
    inner = W('<div class="cards">' + "".join(
        f'<div class="cd" id="{a}"><span class="ti">{ico(i, "i5")}</span><h2 class="h3" style="margin-top:1.25rem;font-size:1.125rem;font-weight:600">{t}</h2>{check_list(items)}</div>'
        for i, t, a, items in groups) + "</div>", "sec-s")
    inner += W(sec_head("Products", "Every POSINEXT product") + '<div class="mt14">' + cards([(p["icon"], p["name"], p["home"], f'/{p["slug"]}/') for p in P]) + "</div>", "sec bs")
    inner += W(sec_head("Hardware", "What you need to run POSINEXT") + '<div class="mt14">' + cards([
        ("monitor", "A Windows PC", "Windows 10 or 11 at the counter. In Fine Dine, one PC is the outlet's main PC and other terminals connect to it."),
        ("printer", "Thermal printers", "58 mm or 80 mm ESC/POS receipt printers by USB, LAN or Wi-Fi; one per kitchen station if you like."),
        ("phone", "Phones and screens", "Android phones for captains; any PC or screen on the network as a kitchen display.")]) + "</div>", "sec")
    simple("/features/", "Restaurant POS Features: Billing, KOT, Inventory, Reports | POSINEXT",
           "Every POSINEXT POS feature: GST billing, KOTs by station, floor plan, kitchen display, Swiggy & Zomato, inventory, 40+ reports, offline mode and backups.",
           "Features", "Every feature a restaurant runs on", "Billing, kitchen, tables, online orders, stock, reports and security, built to keep working when the internet does not.",
           inner, [("Features", "/features/")], ctas=[("Book a Demo", "/book-a-demo/"), ("See pricing", "/pricing/")], priority="0.9")

    # ---------- Pricing ----------
    cardsh = ""
    for name, price, about, pop, prev, feats in PLANS:
        lead_ = [f"<strong>Everything in {prev}, plus:</strong>"] if prev else []
        cardsh += (f'<div class="pp{" pop" if pop else ""}">' + ('<span class="bdg">Most popular</span>' if pop else "")
                   + f'<h3>{name}</h3><p class="mc mt2">{about}</p><p class="pr-a">{rupees(price)} <small>/ outlet / year + GST</small></p>'
                   + check_list(lead_ + feats) + f'<a class="btn {"btn-p" if pop else "btn-o"}" href="{PORTAL}/register">Start 30-day free trial</a></div>')
    rows = [("Fine Dine or QSR POS, works offline", "✓", "✓", "✓"), ("GST billing, UPI, stock, recipes, reports", "✓", "✓", "✓"),
            ("Automatic and online backups", "✓", "✓", "✓"), ("Captain app", "—", "✓", "✓"), ("Kitchen display", "—", "✓", "✓"),
            ("Table QR ordering and waiter calling", "—", "✓", "✓"), ("ODS: website, app, Swiggy and Zomato orders", "—", "✓", "✓"),
            ("Installation and training", "Online", "1 visit", "2 visits"), ("Support", "Ticket and email", "Ticket and email", "Priority")]
    table = ('<div class="tb"><table><thead><tr><th>What is included</th><th>Base</th><th>Growth</th><th>Scale</th></tr></thead><tbody>'
             + "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in rows) + "</tbody></table></div>")
    pfaq = [("Is there a free trial?", f'Yes. Every plan starts with a 30-day free trial, no card needed. <a href="{PORTAL}/register">Create an account</a>, download the POS and start billing.'),
            ("Is the price per outlet?", "Yes. Prices are per outlet, per year, before GST."),
            ("Are there setup fees?", "No setup fees. Online installation and training are included in every plan; Growth and Scale include visits."),
            ("Can I change plans later?", f'Yes. Write to <a href="mailto:{EMAIL}">{EMAIL}</a> or open a ticket in the customer portal.'),
            ("How does POSINEXT pricing compare with Petpooja?", 'Our yearly prices are set 10% below Petpooja\'s published rate card. See <a href="/compare/petpooja-alternative/">POSINEXT vs Petpooja</a>.'),
            ("What do the own app and website cost?", 'The ordering website and branded app are quoted for your setup. <a href="/book-a-demo/">Book a demo</a> for a written quote.')]
    fq, fq_schema = faq_section(pfaq, "Pricing FAQ")
    offers = {"@type": "Product", "name": "POSINEXT Restaurant POS", "brand": {"@type": "Brand", "name": "POSINEXT"},
              "description": "Restaurant POS software for fine dine, QSR and cloud kitchens in India.", "image": SITE + "/img/og.jpg",
              "offers": [{"@type": "Offer", "name": n, "price": str(pr), "priceCurrency": "INR", "url": SITE + "/pricing/",
                          "availability": "https://schema.org/InStock",
                          "priceSpecification": {"@type": "UnitPriceSpecification", "price": str(pr), "priceCurrency": "INR",
                                                 "unitText": "outlet per year", "valueAddedTaxIncluded": False}} for n, pr, *_ in PLANS]}
    simple("/pricing/", "Restaurant POS Pricing in India: Plans from ₹10,800/year | POSINEXT",
           "POSINEXT restaurant POS pricing: Base ₹10,800, Growth ₹18,000 and Scale ₹27,000 per outlet per year plus GST. No setup fees, 30-day free trial, 10% below Petpooja.",
           "Pricing", "Simple pricing, per outlet, per year", "Three plans, no setup fees and a 30-day free trial. Prices are set 10% below Petpooja's published rate card.",
           W(f'<div class="pg">{cardsh}</div><p class="c mc mt8">Prices in Indian rupees, per outlet per year, before GST.</p>')
           + W(sec_head("Compare plans", "What each plan includes") + table, "sec bs") + fq,
           [("Pricing", "/pricing/")], [offers, fq_schema], priority="0.9")

    # ---------- Changelog ----------
    log = [
        ("2026-11-12", "PosiNext Cloud", ["DinePOS Cloud and the Tiffin order hub merged into one service, PosiNext Cloud, for both products."]),
        ("2026-11-10", "Never miss an online order", ["The online-order chime now repeats every 3 seconds on every screen until no order is waiting.", "The customer's order note prints on the KOT.", "Preparation clock and late alarm on accepted online orders.", "Print alarm on every screen when a ticket could not print, with retry.", "Captain app for Android available as a download in the customer portal.", "DinePOS Server starts quietly in the tray."]),
        ("2026-11-09", "Portal and kitchen display", ["Kitchen display (DinePOS Kitchen) offered as a Fine Dine add-on download.", "Portal sign-ins stay while used; signed-in devices are listed and can be signed out.", "Book a Demo requests from posinext.com reach the team by email."]),
        ("2026-11-08", "Accounts, trials and support", ["30-day free trials for Fine Dine and QSR from the customer portal.", "Customer portal: downloads, licences per PC, support tickets with replies, announcements, knowledge base and service status.", "Licence keys renewed automatically every hour."]),
        ("2026-11-07", "Online ordering grows up", ["Brand website: one ordering website for several outlets, sending each delivery to the nearest outlet that can take it.", "Swiggy and Zomato orders in DinePOS.", "Map on delivery orders, and a store map with delivery bands in Settings.", "Channel badge on each online order: Swiggy, Zomato, website or app.", "Hosted outlets: PosiNext Cloud can run an outlet's server, with no main PC."]),
        ("2026-11-06", "Devices from anywhere", ["Captain phones, kitchen screens and terminals can reach the outlet from anywhere through the cloud.", "Print agents print tickets for printers the server cannot reach.", "Captain app for Android.", "Table QR works for guests on mobile data."]),
        ("2026-11-05", "Kitchen status on the floor", ["Table tiles show what is cooking and what is ready, from the kitchen screens.", "New table states: Food ready and Served.", "Printer status checked every 30 seconds, so a printer that is off shows red before the next ticket.", "Table QR add-on: guest ordering, waiter calling, bill request and UPI."]),
        ("2026-11-04", "Photos and recipes", ["Dish photos with a photo view on the billing screen.", "Recipe bulk upload from CSV.", "Cash on delivery taken with the order's delivery."]),
        ("2026-11-03", "Captain app, kitchen display, reports", ["Captain phone app with order taking, courses and an offline outbox.", "Kitchen display with station views and late colours.", "Reports: daily sales, item-wise, GST by rate, payment modes, voids and more.", "Leakage dashboard and audit log.", "Bookings and waitlist; backups every 15 minutes with restore."]),
    ]
    items = "".join(f'<article><time datetime="{d}">{d}</time><h2>{t}</h2><ul>' + "".join(f"<li>{x}</li>" for x in xs) + "</ul></article>" for d, t, xs in log)
    simple("/changelog/", "Changelog: What's New in POSINEXT Restaurant POS",
           "New features and improvements in POSINEXT Fine Dine, QSR, the captain app, kitchen display, online ordering and PosiNext Cloud.",
           "Changelog", "What's new in POSINEXT", "New features and fixes, newest first. Updates reach your outlet automatically.",
           W(f'<div class="cl">{items}</div>'), [("Changelog", "/changelog/")])

    # ---------- Compare: Petpooja alternative ----------
    ptable = ('<div class="tb"><table><thead><tr><th>Plan level</th><th>Petpooja (published yearly price)</th><th>POSINEXT</th><th>You save</th></tr></thead><tbody>'
              + "".join(f"<tr><td>{n}</td><td>{rupees(a)}</td><td><strong>{rupees(b)}</strong></td><td>{rupees(a - b)}</td></tr>"
                        for n, a, b in [("Core / Base", 12000, 10800), ("Growth", 20000, 18000), ("Scale", 30000, 27000)])
              + "</tbody></table></div>")
    cmp_html = (f"<h2>Prices side by side</h2><p>Per outlet, per year, before GST. Petpooja's prices are from its published rate card (petpooja.com/pricing, November 2026); check their site for current prices.</p>{ptable}"
                "<h2>What you get with POSINEXT</h2><ul>"
                "<li><strong>Offline-first.</strong> The POS runs on your outlet's Windows PC, so billing, KOTs, captain phones and kitchen screens keep working without the internet.</li>"
                "<li><strong>Two products made for their job.</strong> Fine Dine (DinePOS) for table service and QSR (Tiffin POS) for counters, cafés and cloud kitchens.</li>"
                "<li><strong>Swiggy and Zomato built in.</strong> Orders accepted automatically and KOTs printed, with statuses going back to the platforms.</li>"
                "<li><strong>Own channels without commission.</strong> Ordering website with a website builder, app ordering and Table QR.</li>"
                "<li><strong>Leakage control.</strong> A dashboard of cancellations after KOT, voids, reprints and cash out, with who, when and why.</li>"
                "<li><strong>No setup fees, 30-day free trial.</strong> Online installation and training in every plan.</li></ul>"
                "<h2>Switching from another POS</h2><ol><li>Export your menu from your current POS as a spreadsheet.</li>"
                "<li>Upload it to POSINEXT with the CSV menu template (recipes too).</li><li>Run POSINEXT alongside your old POS during the free trial.</li>"
                "<li>Connect Swiggy and Zomato and switch over on a quiet day.</li></ol>"
                '<p class="note">Petpooja is a trademark of its owner. POSINEXT is not affiliated with Petpooja. This page compares published prices only; confirm features that matter to you with each vendor.</p>')
    cfaq = [("Is POSINEXT cheaper than Petpooja?", "Yes. POSINEXT's yearly prices are 10% below Petpooja's published rate card at each plan level: ₹10,800, ₹18,000 and ₹27,000 per outlet per year plus GST."),
            ("Can I move my menu from Petpooja to POSINEXT?", "Yes. Export your menu as a spreadsheet, fit it to the POSINEXT CSV template and upload it; we help during onboarding."),
            ("Does POSINEXT work offline like a desktop POS?", "Yes. The POS runs on your Windows PC and bills without the internet; online orders and backups catch up when the connection returns.")]
    fq, fq_schema = faq_section(cfaq, "Switching FAQ")
    simple("/compare/petpooja-alternative/", "Petpooja Alternative: POSINEXT Restaurant POS, 10% Lower Price",
           "Looking for a Petpooja alternative? POSINEXT costs 10% less than Petpooja's published prices, works offline and has Swiggy & Zomato built in. Free trial.",
           "Compare", "A Petpooja alternative that costs 10% less", "POSINEXT gives Indian restaurants offline-first billing, KOTs, Table QR, a captain app and Swiggy &amp; Zomato orders at prices set 10% below Petpooja's published rate card.",
           prose(cmp_html) + fq, [("Compare", "/compare/petpooja-alternative/"), ("Petpooja alternative", "/compare/petpooja-alternative/")],
           [fq_schema], ctas=[("Start free trial", PORTAL + "/register"), ("Book a Demo", "/book-a-demo/")], priority="0.8")

    # ---------- About ----------
    about = ("<h2>What POSINEXT is</h2><p>POSINEXT is restaurant software made for how restaurants in India work: GST bills, UPI at the counter, KOTs to busy kitchens, captains on the floor, and Swiggy, Zomato and direct orders arriving all at once.</p>"
             "<p>It comes as two POS products, each built for its job: <a href=\"/fine-dine-pos/\">Fine Dine</a> for table service and <a href=\"/qsr-pos/\">QSR</a> for counter service, cafés and cloud kitchens. Add-ons such as <a href=\"/table-qr-ordering/\">Table QR</a>, the <a href=\"/captain-app/\">captain app</a>, a kitchen display and <a href=\"/online-ordering-website/\">online ordering</a> work with both, through PosiNext Cloud.</p>"
             "<h2>What we believe</h2><ul><li><strong>The restaurant never stops for the internet.</strong> The POS runs on the outlet's own PC; the cloud adds online orders, backups and remote access, but billing never waits for it.</li>"
             "<li><strong>No order, ticket or rupee gets lost.</strong> Print queues that never drop a KOT, phones that keep orders through Wi-Fi drops, and a leakage dashboard that shows every cancellation and void.</li>"
             "<li><strong>Fair, published prices.</strong> Per outlet, per year, no setup fees, and a 30-day free trial to prove it.</li>"
             "<li><strong>Direct orders belong to the restaurant.</strong> Your own website, app and Table QR, without commission on each order.</li></ul>"
             f'<h2>Talk to us</h2><p>Write to <a href="mailto:{EMAIL}">{EMAIL}</a>, <a href="/book-a-demo/">book a demo</a> or start a <a href="{PORTAL}/register">free trial</a>.</p>')
    simple("/about/", "About POSINEXT: Restaurant POS Software Made for India",
           "POSINEXT makes offline-first restaurant POS software for fine dine restaurants, QSRs, cafés and cloud kitchens in India, with online ordering, Table QR and a captain app.",
           "About", "Restaurant software that never stops", "We build POS software for Indian restaurants that keeps billing through internet outages, rush hours and everything in between.",
           prose(about), [("About", "/about/")], [{"@type": "AboutPage", "url": SITE + "/about/", "about": {"@id": SITE + "/#org"}}])

    # ---------- Careers ----------
    careers = ("<h2>Working on POSINEXT</h2><p>We build software that restaurants run their whole day on, so we care about reliability, speed at the counter and plain, honest product design.</p>"
               "<p>We do not have open positions listed right now. We are always glad to hear from people who know restaurants or build reliable software, especially in these areas:</p>"
               "<ul><li>Restaurant onboarding and training (installation visits, menu set-up, staff training)</li><li>Customer support for restaurant owners and staff</li><li>Sales for restaurants, cafés and cloud kitchens</li><li>Software engineering (TypeScript, Windows desktop, Android)</li></ul>"
               f'<h2>How to apply</h2><p>Email <a href="mailto:{EMAIL}?subject={quote("Careers at POSINEXT")}">{EMAIL}</a> with the subject “Careers at POSINEXT”, the kind of work you want to do, your city and a link to your CV or work. Please do not send ID documents or bank details.</p>')
    simple("/careers/", "Careers at POSINEXT: Jobs in Restaurant Technology",
           "Work on POSINEXT restaurant POS software: onboarding, support, sales and engineering roles in restaurant technology in India. How to apply.",
           "Careers", "Build what restaurants run on", "Help restaurants across India bill faster, cook on time and own their customers.",
           prose(careers), [("Careers", "/careers/")])

    # ---------- Contact ----------
    contact = W(cards([
        ("mail", "Email", f'Questions, quotes and support: <a class="pc" href="mailto:{EMAIL}">{EMAIL}</a>'),
        ("calendar", "Book a demo", 'See POSINEXT live for your restaurant: <a class="pc" href="/book-a-demo/">book a free demo</a>'),
        ("buoy", "Customers", f'Open a support ticket in the <a class="pc" href="{PORTAL}/login">customer portal</a>, where replies are kept with your account.'),
        ("book", "Documentation", 'Set-up guides for the POS, printers and devices: <a class="pc" href="/docs/">read the docs</a>'),
        ("shield", "Security", 'Report a security concern: <a class="pc" href="/security/">how to report</a>'),
    ]))
    simple("/contact/", "Contact POSINEXT: Sales, Support and Demo",
           "Contact POSINEXT restaurant POS: email support@posinext.com, book a free demo or open a support ticket in the customer portal.",
           "Contact", "Talk to the POSINEXT team", "Sales questions, a quote for your outlets or help with your POS: pick whatever is easiest.",
           contact, [("Contact", "/contact/")], [{"@type": "ContactPage", "url": SITE + "/contact/"}])

    # ---------- Book a demo: the same form as the dialog on every other page (kit.demo_form) ----------
    form = ('<div class="box"><h2 class="t" style="margin-top:0;font-size:1.5rem">Book a free demo</h2>'
            "<p class=\"mc\" style=\"margin-bottom:1.25rem\">Tell us about your restaurant and we'll show you POSINEXT live.</p>"
            + demo_form("d") + "</div>")
    why = ('<div class="rel"><h2 class="t" style="margin-top:0">What happens in the demo</h2>'
           + check_list(["We show POSINEXT live, set up like your restaurant: Fine Dine, QSR, café or cloud kitchen",
                         "Billing, KOTs, captain app, kitchen display and online orders, end to end",
                         "Your questions on printers, hardware, Swiggy and Zomato, and moving from your current POS",
                         "A written quote for your outlets"])
           + f'<p class="lead mt8">Prefer to try it yourself? <a class="pc" href="{PORTAL}/register">Start the 30-day free trial</a>, no card needed.</p></div>')
    simple("/book-a-demo/", "Book a Free Demo of POSINEXT Restaurant POS",
           "Book a free live demo of POSINEXT restaurant POS: billing, KOT, Table QR, captain app, kitchen display and Swiggy & Zomato orders, set up like your restaurant.",
           "Book a Demo", "See POSINEXT live for your restaurant", "Tell us about your restaurant and we will show you POSINEXT, set up the way you work.",
           W(f'<div class="two">{why}{form}</div>'), [("Book a Demo", "/book-a-demo/")], cta=False, priority="0.9")

    # ---------- Documentation ----------
    toc = [("requirements", "What you need"), ("account", "Create an account and start the trial"), ("install", "Install the POS"),
           ("menu", "Set up your menu"), ("printers", "Add printers"), ("staff", "Staff, roles and PINs"), ("devices", "Captain phones and kitchen screens"),
           ("online", "Online orders"), ("backups", "Backups and restore"), ("licence", "Licence and renewal"), ("dayend", "Day end and reports")]
    docs = ('<nav aria-label="Contents" class="note"><strong>Contents</strong><ol style="margin-top:.5rem;padding-left:1.25rem;list-style:decimal">'
            + "".join(f'<li><a href="#{a}">{t}</a></li>' for a, t in toc) + "</ol></nav>"
            '<h2 id="requirements">1. What you need</h2><ul><li>A PC with <strong>Windows 10 or 11</strong> at the counter. In Fine Dine, this is the outlet\'s main PC; other billing terminals connect to it over your network.</li>'
            "<li>A <strong>58 mm or 80 mm thermal printer</strong> (ESC/POS) for bills, and one for each kitchen station if you want KOTs printed there. USB, LAN or Wi-Fi.</li>"
            "<li>Optional: <strong>Android phones</strong> for captains, and any PC or screen for a kitchen display.</li><li>Internet is needed to activate the licence and for online orders and online backups, not for billing.</li></ul>"
            f'<h2 id="account">2. Create an account and start the trial</h2><ol><li>Go to the <a href="{PORTAL}/register">customer portal</a> and create an account with your email.</li><li>Enter the code we email you.</li><li>Choose your product: <strong>Fine Dine</strong> (table service) or <strong>QSR</strong> (counter service, cafés, cloud kitchens). You can have both.</li><li>Your 30-day free trial starts when you activate the POS on your PC.</li></ol>'
            "<h2 id=\"install\">3. Install the POS</h2><ol><li>In the portal, open <strong>Downloads</strong> and download the installer for your product.</li><li>Run it on the counter PC. Fine Dine asks whether this PC is the main PC.</li><li>Open the POS, sign in with your portal account to start the trial, and create the owner's PIN.</li></ol>"
            "<h2 id=\"menu\">4. Set up your menu</h2><p>Add categories and dishes in <strong>Settings › Menu</strong>, with sizes, add-on groups and photos. For a large menu, download the CSV template, fill it in a spreadsheet and upload it: every row is checked, and nothing is saved until all rows are correct. Recipes can be uploaded the same way.</p>"
            "<h2 id=\"printers\">5. Add printers</h2><p>In <strong>Settings › Kitchen &amp; printers</strong>, add the bill printer and a printer for each kitchen station, then send a test page. Network printers are found by scanning; a USB printer can be set up from the billing screen in one tap. Choose 58 or 80 mm and design the bill with your logo in <strong>Bill design</strong>.</p>"
            "<h2 id=\"staff\">6. Staff, roles and PINs</h2><p>Add staff in <strong>Settings › Staff &amp; roles</strong>. Each person signs in with their name and PIN. Roles decide what they can do; actions like voids and large discounts ask for a manager's PIN.</p>"
            "<h2 id=\"devices\">7. Captain phones and kitchen screens</h2><p>Install the captain app on an Android phone (from the portal's downloads) or open the address shown on the POS. Enter the 6-digit pairing code; a manager approves it with their PIN. Kitchen screens pair the same way and then pick their station.</p>"
            "<h2 id=\"online\">8. Online orders</h2><p>Connect the POS to PosiNext Cloud in <strong>Settings › Online orders</strong>, set your store location, delivery areas and charges, and choose automatic or staff accepting. Swiggy and Zomato are connected by our team for your outlet.</p>"
            "<h2 id=\"backups\">9. Backups and restore</h2><p>The POS backs up every 15 minutes and at day end. In <strong>Settings › Backups</strong> you can choose a USB drive or folder for copies, turn on online backups, back up now, or restore (with the owner's PIN; the current data is kept aside first).</p>"
            "<h2 id=\"licence\">10. Licence and renewal</h2><p>The licence is renewed automatically while the PC is online. The POS warns before a licence ends; a business day already in progress is never stopped. See your licences in the customer portal.</p>"
            "<h2 id=\"dayend\">11. Day end and reports</h2><p>Close the day with <strong>Day end</strong> to print the Z-report. Reports cover sales, items, categories, GST by rate, payment modes, discounts, voids, staff and kitchen speed, and export to CSV.</p>"
            f'<p class="note">Need help with a step? Open a ticket in the <a href="{PORTAL}/login">customer portal</a> or write to <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>')
    howto = {"@type": "HowTo", "name": "Set up POSINEXT restaurant POS", "totalTime": "PT1H",
             "step": [{"@type": "HowToStep", "name": t, "url": f"{SITE}/docs/#{a}"} for a, t in toc]}
    simple("/docs/", "POSINEXT Documentation: Restaurant POS Setup Guide",
           "Set up POSINEXT restaurant POS: system requirements, trial, installation, menu CSV upload, printers, staff PINs, captain app pairing, online orders, backups and day end.",
           "Documentation", "Set up POSINEXT, step by step", "Everything you need to go from download to your first bill.",
           prose(docs), [("Documentation", "/docs/")], [howto, {"@type": "TechArticle", "headline": "POSINEXT restaurant POS setup guide",
                                                             "author": {"@id": SITE + "/#org"}, "dateModified": UPDATED, "url": SITE + "/docs/"}])

    # ---------- Help Center ----------
    hfaq = [("The internet is down. Can I still bill?", "Yes. The POS runs on your PC and keeps billing, printing KOTs and serving captain phones and kitchen screens on your local network. Online orders and backups catch up when the internet returns."),
            ("A KOT did not print. What should I do?", "Check the printer is on, has paper and is connected. The ticket waits in the print queue; every screen shows a print alarm with a retry. Printer status is checked every 30 seconds."),
            ("How do I add a new captain phone or kitchen screen?", 'Open the app on the device, enter the 6-digit pairing code and have a manager approve it with their PIN. See <a href="/docs/#devices">pairing devices</a>.'),
            ("How do I restore a backup?", 'Settings › Backups › Restore, with the owner\'s PIN. The current data is kept aside first. See <a href="/docs/#backups">backups</a>.'),
            ("My trial or licence is ending. How do I renew?", f'Sign in to the <a href="{PORTAL}/login">customer portal</a> to see your licences, or write to <a href="mailto:{EMAIL}">{EMAIL}</a>.'),
            ("Where do I download the POS and add-ons?", f'In the <a href="{PORTAL}/login">customer portal</a> under Downloads.')]
    fq, fq_schema = faq_section(hfaq, "Common questions", "Quick answers")
    helpc = W(cards([
        ("buoy", "Support tickets", "Open a ticket and follow replies in the customer portal; answers are emailed to you too.", PORTAL + "/login"),
        ("book", "Documentation", "Step-by-step set-up for the POS, printers, devices and online orders.", "/docs/"),
        ("file", "Knowledge base", "How-to articles from the team, in the customer portal.", PORTAL + "/login"),
        ("activity", "Service status", "Is PosiNext Cloud working? Check the status page.", "/status/"),
        ("mail", "Email support", f"Write to {EMAIL}.", f"mailto:{EMAIL}"),
        ("calendar", "Book a demo", "New to POSINEXT? See it live first.", "/book-a-demo/")]))
    simple("/help/", "POSINEXT Help Center: Restaurant POS Support",
           "Get help with POSINEXT restaurant POS: support tickets, documentation, knowledge base, service status and answers to common billing, printer and backup questions.",
           "Help Center", "How can we help?", "Find an answer, read the set-up guide or open a ticket with the team.",
           helpc + fq, [("Help Center", "/help/")], [fq_schema])

    # ---------- Status ----------
    svc = [("Restaurant POS at your outlet", "Runs on your own PC; keeps billing even if the cloud is unreachable"),
           ("Customer portal", "Sign in, downloads, licences and support tickets"), ("Licence activation and renewal", "Trials and automatic renewals"),
           ("Online orders relay", "Website, app, Swiggy and Zomato orders to your POS"), ("Online backups", "Copies of your POS data in PosiNext Cloud")]
    stat = ('<ul class="sv">' + "".join(f"<li><div><strong>{a}</strong><br><span>{b}</span></div></li>" for a, b in svc) + "</ul>"
            f'<div class="pr"><h2>Live status</h2><p>Live status of each service is shown in the <a href="{PORTAL}/login">customer portal</a>, and as data at <a href="{PORTAL}/v1/status">{PORTAL.replace("https://", "")}/v1/status</a>.</p>'
            "<h2>If a cloud service is down</h2><ul><li>Billing, KOTs, captain phones and kitchen screens keep working at the outlet.</li><li>Online orders placed meanwhile wait in the cloud and reach the POS when it reconnects.</li><li>Backups continue on the PC and copy online later.</li></ul>"
            f'<p>Something not working? Open a ticket in the portal or write to <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></div>')
    simple("/status/", "POSINEXT Service Status", "Status of POSINEXT services: customer portal, licence activation, online orders relay and online backups, and what keeps working at your outlet if one is down.",
           "Status", "Service status", "Which POSINEXT services run in the cloud, where to see their live status, and what keeps working if one is down.",
           W(stat), [("Status", "/status/")], priority="0.5")

    # ---------- Policies (owner drafts, unchanged wording) ----------
    draft = f'<p class="note">Draft for owner review · Prepared 6 November 2026. This draft is provided by POSINEXT for review. It is not a finalized policy or service agreement. Contact <a href="mailto:{EMAIL}">{EMAIL}</a> with questions.</p>'
    pol = {
        "privacy": ("Privacy Notice | POSINEXT", "POSINEXT's draft website privacy notice: what a demo enquiry contains, how it is handled and how to contact us about privacy.",
                    "Privacy notice", "Information about enquiries made through the POSINEXT website.", [
            ("1. Scope of this notice", "This draft covers the public POSINEXT website and its demo request options. It does not describe how a restaurant processes its guests' information or establish the privacy terms of a purchased POSINEXT service."),
            ("2. Information in a demo request", "A demo request asks for your name, phone number and restaurant name. You can also provide your email, city, number of outlets and a message. Please avoid including payment details, passwords or personal information about restaurant guests in your enquiry."),
            ("3. Enquiry handling", "Demo requests reach the POSINEXT team so we can respond to your enquiry. Sending a request asks for contact about POSINEXT; it is not a purchase or subscription."),
            ("4. How a request is sent", "The demo form sends your details securely to the POSINEXT customer portal (portal.posinext.com), which passes them to the team. If you write to us by email instead, review your email provider's privacy information. This website loads no analytics, advertising or tracking scripts and sets no cookies."),
            ("5. Privacy questions and requests", f"For questions about an enquiry, or to ask about access, correction or deletion of information you submitted, email {EMAIL}. Include enough detail to identify your enquiry, but do not send passwords or sensitive documents. This draft does not promise a response deadline or a particular outcome."),
            ("6. Details awaiting confirmation", "The site owner needs to confirm the legal business identity, applicable privacy requirements, retention periods and provider arrangements before adopting a final notice. No retention period, legal compliance status or data-sharing guarantee is stated here.")]),
        "terms": ("Website Terms | POSINEXT", "Draft POSINEXT website terms covering enquiries, product information and service agreements.",
                  "Website terms", "A draft guide to using the POSINEXT website and making a product enquiry.", [
            ("1. Website and service scope", "This website presents POSINEXT restaurant software and provides a way to request a demo. These draft website terms are not a finalized customer contract and do not establish subscription, billing or software licence conditions."),
            ("2. Demo and sales enquiries", "A demo, trial or sales enquiry lets you discuss your restaurant's needs with the team. Sending an enquiry does not complete a purchase or activate a subscription. Ask the team to confirm trial availability and any conditions before proceeding."),
            ("3. Product information", "Confirm features, device compatibility, integrations, availability and performance expectations for your specific operation before ordering. Website examples and screenshots should not be treated as a signed specification or service-level agreement."),
            ("4. Responsible use", "Please provide accurate contact details, submit only information you are authorized to share, and do not use the enquiry options for spam or harmful content. Do not attempt to access another person's information or disrupt the website."),
            ("5. Pricing and commercial arrangements", "Request a written proposal identifying the products, add-ons, onboarding arrangements and support included. Payment, renewal, cancellation, refund and service commitments need to be agreed separately; this draft does not set those conditions."),
            ("6. External links", "External services linked from this website have their own terms. Review those terms when you use their services."),
            ("7. Questions and final agreement", f"Contact {EMAIL} for product or agreement questions. The owner must confirm the contracting business, applicable law and final legal terms before adopting this draft. It does not impose liability limits, a dispute process or a governing jurisdiction.")]),
        "security": ("Security | POSINEXT", "How to report a security concern to POSINEXT, what to include, and how POSINEXT protects restaurant data.",
                     "Security", "Contact and reporting guidance for security concerns involving POSINEXT.", [
            ("1. Report a concern", f"To raise a suspected security issue, email {EMAIL} with the subject “POSINEXT security concern”. This is the general POSINEXT contact, not a dedicated emergency channel."),
            ("2. What to include", "Describe the affected page or product, what you observed, when it happened and the steps needed to reproduce it. If you include screenshots, remove personal details, passwords, tokens and payment information first. Do not send another person's data as evidence."),
            ("3. Keep reporting safe", "Do not access, download or alter someone else's information. Do not disrupt services or continue an investigation that risks harm. This page does not authorize security testing, establish a bug bounty or grant legal safe harbor."),
            ("4. Protect your own information", "Never share passwords, payment credentials or one-time codes in a demo request or an unsolicited message. If a message claiming to be from POSINEXT looks suspicious, contact the team separately before following its instructions."),
            ("5. How the POS protects your data", "Staff sign in with their own PIN; roles limit what each person can do and sensitive actions need a manager's PIN. Only devices paired with a manager's approval can connect, and a device can be cut off at once. Every change is written to an audit log, and connections to PosiNext Cloud use HTTPS."),
            ("6. Scope and review", "This owner-authored draft is not independent verification or a security guarantee, and does not attest to any certification, audit result or regulatory compliance status. Reporting procedures and any response commitments require confirmation by the site owner.")]),
    }
    for slug, (title, desc, h1, lead, secs) in pol.items():
        html_ = draft + "".join(f"<h2>{h}</h2><p>{t}</p>" for h, t in secs)
        simple(f"/{slug}/", title, desc, "POSINEXT policies", h1, lead, prose(html_), [(h1, f"/{slug}/")], cta=False, priority="0.3")


def extras(write, built):
    """404, sitemap.xml, robots.txt, llms.txt, llms-full.txt, ard.json."""
    from pathlib import Path
    from posts import POSTS
    OUT = Path(__file__).resolve().parent.parent / "public"
    # 404
    body = ('<section class="ph"><div class="w c"><span class="ey ey-h">404</span><h1>This page is not on the menu</h1>'
            '<p class="lead" style="margin-left:auto;margin-right:auto">The page you asked for does not exist or has moved.</p>'
            + btns(("Go to the home page", "/"), ("See all features", "/features/")).replace('class="ctas"', 'class="ctas" style="justify-content:center"')
            + "</div></section>")
    (OUT / "404.html").write_text(page("/404.html", "Page not found | POSINEXT", "This page does not exist.", body, noindex=True), encoding="utf-8")
    # sitemap
    urls = "".join(f"<url><loc>{SITE}{p}</loc><lastmod>{UPDATED}</lastmod><priority>{pr}</priority></url>" for p, pr in built)
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                                     + urls + "</urlset>\n", encoding="utf-8")
    # robots: every search engine and AI assistant is welcome
    bots = ["Googlebot", "Bingbot", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
            "anthropic-ai", "PerplexityBot", "Perplexity-User", "Applebot", "Applebot-Extended", "CCBot", "DuckDuckBot", "YandexBot",
            "meta-externalagent", "Amazonbot", "cohere-ai", "Bytespider", "Twitterbot", "facebookexternalhit", "LinkedInBot", "WhatsApp"]
    robots = "".join(f"User-agent: {b}\nAllow: /\n\n" for b in bots) + "User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: https://posinext.com/sitemap.xml\n"
    (OUT / "robots.txt").write_text(robots, encoding="utf-8")
    # llms.txt (index) and llms-full.txt (everything an assistant needs to answer about POSINEXT)
    plain = lambda s: s.replace("&amp;", "&").replace("&lt;", "<")
    import re
    strip = lambda s: plain(re.sub(r"<[^>]+>", "", s))
    lines = ["# POSINEXT", "",
             "> POSINEXT is restaurant POS software for fine dine restaurants, quick service restaurants (QSR), cafés and cloud kitchens in India: GST billing, KOTs, table management, Table QR ordering, a captain app, kitchen display, online ordering website, app ordering, Swiggy and Zomato integration, inventory and reports. It runs on Windows at the outlet and works offline.", "",
             "Prices: Base ₹10,800, Growth ₹18,000, Scale ₹27,000 per outlet per year plus GST (10% below Petpooja's published prices). 30-day free trial, no setup fees.", "",
             "## Products", ""] + [f'- [{plain(p["name"])}]({SITE}/{p["slug"]}/): {strip(p["lead"])}' for p in P] + [
             "", "## Pages", "",
             f"- [Features]({SITE}/features/)", f"- [Pricing]({SITE}/pricing/)", f"- [POSINEXT vs Petpooja]({SITE}/compare/petpooja-alternative/)",
             f"- [Documentation]({SITE}/docs/)", f"- [Help Center]({SITE}/help/)", f"- [Changelog]({SITE}/changelog/)", f"- [Book a demo]({SITE}/book-a-demo/)",
             f"- [Customer portal (sign in, free trial)]({PORTAL}/register)", f"- [Full details for language models]({SITE}/llms-full.txt)",
             "", "## Guides", ""] + [f'- [{t}]({SITE}/blog/{s}/): {d}' for s, t, d, *_ in POSTS] + [
             "", "## Contact", "", f"- Email: {EMAIL}", f"- Book a demo: {SITE}/book-a-demo/", "",
             "## Policies", "", f"- [Privacy]({SITE}/privacy/)", f"- [Terms]({SITE}/terms/)", f"- [Security]({SITE}/security/)", ""]
    (OUT / "llms.txt").write_text("\n".join(lines), encoding="utf-8")
    full = ["# POSINEXT: full product details", "", lines[2], "", lines[4], ""]
    for p in P:
        full += [f'## {plain(p["name"])} — {SITE}/{p["slug"]}/', "", strip(p["lead"]), ""]
        full += [f"- {t}: {strip(d)}" for _, t, d in p["features"]] + [""]
        full += [f"Q: {strip(q)}\nA: {strip(a)}\n" for q, a in p["faqs"]]
    full += ["## Plans", ""] + [f"- {n}: ₹{pr:,} per outlet per year plus GST. {a} Includes: {'; '.join(f)}." for n, pr, a, _, _, f in PLANS] + [""]
    (OUT / "llms-full.txt").write_text("\n".join(full), encoding="utf-8")
    # agent resource descriptor
    ard = {"specVersion": "0.9", "publisher": {"name": "POSINEXT", "url": SITE + "/"}, "entries": [
        {"identifier": "urn:air:posinext.com:site:llms", "displayName": "POSINEXT overview for language models", "type": "text/markdown",
         "url": SITE + "/llms.txt", "representativeQueries": ["What is POSINEXT?", "Restaurant POS software for fine dine and QSR in India"]},
        {"identifier": "urn:air:posinext.com:site:llms-full", "displayName": "POSINEXT full product details", "type": "text/markdown",
         "url": SITE + "/llms-full.txt", "representativeQueries": ["POSINEXT features", "Does POSINEXT work offline?"]},
        {"identifier": "urn:air:posinext.com:site:pricing", "displayName": "POSINEXT pricing", "type": "text/html", "url": SITE + "/pricing/",
         "representativeQueries": ["How much does POSINEXT cost?", "Restaurant POS price India", "Petpooja alternative cheaper"]},
        {"identifier": "urn:air:posinext.com:site:home", "displayName": "POSINEXT restaurant POS software", "type": "text/html", "url": SITE + "/",
         "representativeQueries": ["Book a demo of POSINEXT", "POS with Table QR ordering", "Swiggy Zomato POS integration"]},
        {"identifier": "urn:air:posinext.com:portal:register", "displayName": "POSINEXT free trial", "type": "text/html", "url": PORTAL + "/register",
         "representativeQueries": ["Start a POSINEXT free trial", "Download POSINEXT for Windows"]},
        {"identifier": "urn:air:posinext.com:site:sitemap", "displayName": "POSINEXT sitemap", "type": "application/xml", "url": SITE + "/sitemap.xml",
         "representativeQueries": ["POSINEXT pages"]}]}
    (OUT / ".well-known").mkdir(exist_ok=True)
    (OUT / ".well-known" / "ard.json").write_text(json.dumps(ard, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

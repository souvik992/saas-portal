"""Blog: guides for restaurant owners. Each post: (slug, title, description, date, body html, faqs)."""
from kit import PORTAL, EMAIL, SITE, cards, faq, ico

D = "2026-11-13"

POSTS = [
    ("how-to-choose-restaurant-pos-software-india",
     "How to Choose Restaurant POS Software in India (2026 Checklist)",
     "A practical checklist for choosing restaurant POS software in India: offline billing, GST, KOTs, Swiggy and Zomato, captain app, inventory, pricing and support.",
     D,
     """<p>The POS is the one system your restaurant cannot run a single shift without. Picking the wrong one costs you in slow billing, missed KOTs, lost online orders and money that quietly leaks out of the till. This checklist covers what to test before you sign up, whether you run a fine dine restaurant, a QSR, a café or a cloud kitchen.</p>
<h2>1. Does it keep billing when the internet goes down?</h2>
<p>Internet outages in a busy service are not rare. A browser-only POS stops when the connection does. Ask whether billing, KOT printing, the captain app and the kitchen display keep working on the local network, and what happens to online orders placed while you are offline. Then test it: unplug the router during the trial and keep billing.</p>
<h2>2. GST bills done right</h2>
<p>Your bills need your GSTIN, the right tax rate, inclusive or exclusive pricing, and bill numbers that run without gaps through the financial year. Check that reports show GST by rate, so filing is not a monthly scramble. Our <a href="/blog/gst-on-restaurant-bills-india/">guide to GST on restaurant bills</a> explains the rates.</p>
<h2>3. KOTs that reach the right station, every time</h2>
<ul><li>Can each dish go to its own kitchen station (tandoor, Chinese, bar)?</li><li>Do changes and cancellations print as change slips, so the kitchen knows?</li><li>If a printer is off or out of paper, is the ticket queued and retried, or lost?</li><li>Is there a kitchen display option for busy kitchens?</li></ul>
<h2>4. Built for your service style</h2>
<p><strong>Fine dine</strong> needs a live floor plan, table moves and merges, course firing, split bills and a <a href="/captain-app/">captain app</a>. <strong>QSR and cafés</strong> need a fast photo menu, held bills and one-panel payments. <strong>Cloud kitchens</strong> need every channel on one screen with automatic accepting. A POS that tries to be one screen for all three usually slows down at least one of them.</p>
<h2>5. Swiggy, Zomato and your own channels</h2>
<p>Re-keying aggregator orders from tablets is slow and causes mistakes. Look for <a href="/swiggy-zomato-integration/">Swiggy and Zomato integration</a> that accepts orders automatically, prints KOTs and sends status updates back. Then look at commission-free channels you own: an <a href="/online-ordering-website/">ordering website</a>, <a href="/app-ordering/">app ordering</a> and <a href="/table-qr-ordering/">Table QR</a>.</p>
<h2>6. Stopping revenue leakage</h2>
<p>Ask to see who cancelled what after the KOT, who voided a bill, who reprinted one and why. Sensitive actions should need a manager's PIN and land in an audit log. See <a href="/blog/reduce-restaurant-revenue-leakage/">how to reduce revenue leakage</a>.</p>
<h2>7. Stock, recipes and reports</h2>
<p>Recipe-based stock tells you what you should have used versus what you bought. Reports should cover item-wise sales, payment modes, discounts, voids and staff performance, and export to a spreadsheet.</p>
<h2>8. Backups you can actually restore</h2>
<p>Ask how often the POS backs up, where copies go (a USB drive, the cloud) and how a restore works. A backup that has never been restored is a hope, not a backup.</p>
<h2>9. Clear pricing</h2>
<p>Get the price per outlet per year in writing, plus what is extra: setup, add-ons, training visits, hardware. Many vendors do not publish prices; <a href="/pricing/">POSINEXT does</a>.</p>
<h2>10. Try it on your own counter</h2>
<p>A demo shows you the best case. A free trial on your own PC and printer, with your own menu, shows you the real one. Run it alongside your current POS for a few days before switching.</p>
<h2>Quick checklist</h2>
<div class="tb"><table><thead><tr><th>Question</th><th>Why it matters</th></tr></thead><tbody>
<tr><td>Bills offline?</td><td>Service never stops for the internet</td></tr><tr><td>GST by rate in reports?</td><td>Faster filing</td></tr>
<tr><td>Station-wise KOTs with a print queue?</td><td>No lost tickets</td></tr><tr><td>Swiggy and Zomato auto-accept?</td><td>No tablets, no re-keying</td></tr>
<tr><td>Manager PIN and audit log?</td><td>Less leakage</td></tr><tr><td>Published price per outlet?</td><td>No surprises</td></tr>
<tr><td>Free trial on your hardware?</td><td>Proof before you pay</td></tr></tbody></table></div>""",
     [("What is the best restaurant POS software in India?", "The best POS is the one that fits your service style and keeps billing offline. Test offline billing, GST bills, station-wise KOTs, Swiggy and Zomato integration, leakage controls and pricing on your own counter during a free trial."),
      ("How much does restaurant POS software cost in India?", "Yearly plans for established restaurant POS software in India commonly cost ₹10,000 to ₹30,000 per outlet. POSINEXT plans are ₹10,800, ₹18,000 and ₹27,000 per outlet per year plus GST."),
      ("Do I need a cloud POS or a desktop POS?", "The safest choice is a POS that bills on the outlet's own PC (works offline) and uses the cloud for online orders, backups and remote access.")]),

    ("gst-on-restaurant-bills-india",
     "GST on Restaurant Bills in India: Rates, Rules and Billing Guide",
     "GST on restaurant bills explained: the 5% and 18% rates, composition scheme, Swiggy and Zomato orders, service charge, and what a GST bill must show.",
     D,
     """<p>GST on food is one of the most common questions restaurant owners ask. This guide covers the rates and the billing rules most restaurants deal with day to day. It is general information, not tax advice: rules change, so confirm your situation with your chartered accountant.</p>
<h2>GST rates for restaurants</h2>
<div class="tb"><table><thead><tr><th>Type of restaurant service</th><th>GST rate</th><th>Input tax credit</th></tr></thead><tbody>
<tr><td>Standalone restaurant (dine-in, takeaway or delivery), including cloud kitchens</td><td>5% (2.5% CGST + 2.5% SGST)</td><td>Not available</td></tr>
<tr><td>Restaurant inside a hotel where any room's tariff is above ₹7,500 a day</td><td>18%</td><td>Available</td></tr>
<tr><td>Restaurant under the composition scheme</td><td>5% of turnover, paid by the restaurant</td><td>Not available; GST not charged to customers</td></tr></tbody></table></div>
<p>The 5% rate applies to most restaurants, cafés and QSRs. Because input tax credit is not available at 5%, GST paid on rent, equipment and supplies cannot be set off against the GST you collect.</p>
<h2>Swiggy and Zomato orders</h2>
<p>Since 1 January 2022, food delivery platforms collect and pay the 5% GST on restaurant orders placed through them (section 9(5) of the CGST Act). The restaurant does not pay GST again on those orders, but they still count in your turnover and must be reported correctly. Your POS should keep aggregator orders separate in reports, so your accountant can see what GST the platform paid.</p>
<h2>Composition scheme</h2>
<p>Restaurants with turnover up to ₹1.5 crore (₹75 lakh in some special category states) can opt for the composition scheme. They pay a flat 5% on turnover, cannot charge GST on the bill and issue a <em>bill of supply</em> instead of a tax invoice.</p>
<h2>Service charge</h2>
<p>Under consumer protection guidelines issued by the Central Consumer Protection Authority in July 2022, a restaurant cannot add a service charge automatically or by default; it must be voluntary for the guest. If a service charge is collected, GST applies to it as part of the bill value. Configure your POS so service charge can be removed from a bill when a guest asks.</p>
<h2>What a GST bill should show</h2>
<ul><li>Restaurant name, address and GSTIN</li><li>A serial bill number, unique for the financial year</li><li>Date of issue</li><li>Item description, quantity and value</li><li>Taxable value and the rate and amount of CGST and SGST (or IGST)</li><li>SAC code for restaurant services (9963)</li><li>Total amount</li></ul>
<h2>Inclusive or exclusive pricing</h2>
<p>Menu prices can include GST (the bill shows the tax portion inside the price) or exclude it (GST is added on top). Either is fine; be consistent, and make sure the POS rounds correctly so totals match to the rupee.</p>
<h2>How POSINEXT helps</h2>
<ul><li>GST inclusive or exclusive, per item and per outlet</li><li>Bill numbers without gaps through the financial year</li><li>A <strong>GST by rate</strong> report from printed bills, with CSV export for your accountant</li><li>Service charge that can be removed from a bill, with the change recorded</li><li>Online orders kept separate by channel</li></ul>
<p class="note">This article is general information about GST for restaurants in India as of November 2026, not legal or tax advice. Confirm current rates and your obligations with a chartered accountant.</p>""",
     [("What is the GST rate on restaurant food in India?", "Most restaurants, including standalone restaurants, cafés, QSRs and cloud kitchens, charge 5% GST (2.5% CGST + 2.5% SGST) without input tax credit. Restaurants in hotels where any room's tariff is above ₹7,500 a day charge 18% with input tax credit."),
      ("Do restaurants pay GST on Swiggy and Zomato orders?", "Since 1 January 2022 the platforms collect and pay the 5% GST on orders placed through them, so the restaurant does not pay it again on those orders."),
      ("Is service charge mandatory in restaurants?", "No. Under CCPA guidelines from July 2022, service charge cannot be added automatically or by default; it is voluntary for the guest. GST applies to service charge when it is collected.")]),

    ("swiggy-zomato-pos-integration-guide",
     "Swiggy and Zomato POS Integration: How It Works and What to Ask",
     "How Swiggy and Zomato POS integration works: orders into the POS, auto-accept, KOT printing, menu publishing and status updates. What to check first.",
     D,
     """<p>For many restaurants, Swiggy and Zomato bring a large share of orders, and a lot of counter chaos: two tablets beeping, orders typed into the POS by hand, KOTs written out, and mistakes when it is busy. A POS integration fixes that. Here is how it works and what to check.</p>
<h2>What a POS integration does</h2>
<ol><li><strong>Orders arrive in the POS.</strong> Items, add-ons, the customer's notes, charges, discounts and the platform's order number come in automatically.</li>
<li><strong>Accepting.</strong> Orders are accepted automatically the moment they arrive, or a staff member accepts each from the POS screen.</li>
<li><strong>KOTs print.</strong> Each dish's KOT goes to the right kitchen printer, with the customer's note.</li>
<li><strong>Status goes back.</strong> Accepted (with preparation time), food ready, dispatched, completed or cancelled with a reason: updates go from the POS to the platform.</li>
<li><strong>Rider details come in.</strong> The rider's name, phone and progress show on the order.</li>
<li><strong>The menu is published from the POS,</strong> so names and items match.</li></ol>
<h2>Why it matters</h2>
<ul><li><strong>Speed.</strong> No typing, so the kitchen starts sooner.</li><li><strong>Accuracy.</strong> No re-keying mistakes; notes reach the kitchen.</li><li><strong>One view.</strong> Swiggy, Zomato, website and app orders together, each with its channel badge.</li><li><strong>Clean reports.</strong> Sales by channel, matching the platforms' payouts.</li></ul>
<h2>Questions to ask a POS vendor</h2>
<ul><li>Can orders be accepted automatically, and is there an alert that repeats until an order is handled?</li><li>What happens if the same order is sent twice? (It should make one order.)</li><li>What happens if the platform cancels after you accepted? (The bill should be flagged for cancelling.)</li><li>Are orders billed at the channel's price, separate from dine-in prices?</li><li>If your internet drops, what happens to new orders?</li><li>Does it work with both your fine dine and QSR outlets?</li></ul>
<h2>What you need to get started</h2>
<p>Your restaurant needs its own Swiggy and/or Zomato listing. The POS vendor then links your outlet and publishes your menu. With POSINEXT, our team sets this up for your outlet, and orders appear on the ODS screen alongside your own website and app orders. See <a href="/swiggy-zomato-integration/">Swiggy &amp; Zomato integration</a>.</p>""",
     [("How do I integrate Swiggy and Zomato with my POS?", "Your restaurant needs its own Swiggy and/or Zomato listing; your POS vendor then links the outlet and publishes your POS menu. Orders then arrive in the POS, are accepted and print as KOTs."),
      ("Can Swiggy and Zomato orders be accepted automatically?", "Yes, with POSINEXT orders can be accepted the moment they arrive and their KOTs print straight away. You can switch to staff accepting at any time."),
      ("Will I still need the Swiggy and Zomato tablets?", "With the integration, nobody needs to watch the tablets during service: orders are accepted and printed from the POS.")]),

    ("reduce-restaurant-revenue-leakage",
     "How to Reduce Revenue Leakage in Your Restaurant: 8 Controls",
     "Revenue leakage in restaurants: cancelled items after KOT, voids, reprints, unbilled food and cash out. Eight POS controls that stop money slipping away.",
     D,
     """<p>Most restaurants lose money not through one big theft but through many small leaks: an item cancelled after it was cooked, a bill voided and re-rung lower, food that left the kitchen and never reached a bill. The fix is not suspicion; it is a POS that makes every sensitive action visible.</p>
<h2>Where leakage happens</h2>
<ul><li><strong>Cancelled after KOT.</strong> A dish is fired to the kitchen, then removed from the order.</li><li><strong>Voids and re-billing.</strong> A printed bill is voided and the table billed again for less.</li><li><strong>Reprints.</strong> A bill printed twice, one copy paid and one quietly settled.</li><li><strong>Discounts and complimentary items</strong> beyond what was approved.</li><li><strong>Cash out of the drawer</strong> without a reason.</li><li><strong>Food made, never paid.</strong> KOTs with no matching bill.</li><li><strong>Stock that does not add up</strong> against recipes.</li></ul>
<h2>8 controls that stop it</h2>
<ol><li><strong>Personal PINs for everyone.</strong> No shared logins, so every action has a name.</li>
<li><strong>Manager PIN for sensitive actions.</strong> Voids, cancellations after KOT, reprints and discounts above a role's limit need approval.</li>
<li><strong>Reasons on every change.</strong> Picked from a list, so they can be counted.</li>
<li><strong>Change slips to the kitchen.</strong> When an item is reduced or cancelled, the station gets a slip, so the kitchen knows and can push back.</li>
<li><strong>A leakage dashboard.</strong> Counts and amounts of each kind of leak, with a drill-down to who, when and why.</li>
<li><strong>An audit log you cannot edit.</strong> Every change kept, with paging and search.</li>
<li><strong>Recipe-based stock.</strong> Compare what recipes say you used with what you bought.</li>
<li><strong>Day-end checks.</strong> Cash counted against the Z-report, with the difference shown.</li></ol>
<h2>How POSINEXT does it</h2>
<p>POSINEXT Fine Dine has a <strong>leakage dashboard</strong> with cards for items cancelled or reduced after KOT, voids, discounts above limit, reprints, table moves, complimentary items, cash out and drawer opens, day-end difference, and food made but never paid, each with a drill-down to who, when and why. Sensitive actions need a manager's PIN, and everything is in the audit log. See <a href="/fine-dine-pos/">Fine Dine POS</a> and <a href="/features/#security">staff and security features</a>.</p>""",
     [("What is revenue leakage in a restaurant?", "Money lost through small gaps: items cancelled after KOT, voided or reprinted bills, unapproved discounts, cash taken out of the drawer and food that was made but never billed."),
      ("How can a POS reduce leakage?", "By giving every staff member their own PIN, requiring a manager's PIN for sensitive actions, recording reasons, printing change slips to the kitchen and showing it all on a leakage dashboard and audit log.")]),
]


def build(simple, write):
    lst = cards([("file", t, d, f"/blog/{s}/") for s, t, d, *_ in POSTS], "cards c2")
    simple("/blog/", "Restaurant POS Blog: Guides for Restaurant Owners | POSINEXT",
           "Practical guides for restaurant owners in India: choosing a POS, GST on restaurant bills, Swiggy and Zomato integration and reducing revenue leakage.",
           "Blog", "Guides for restaurant owners", "Practical, no-fluff guides on billing, GST, online orders and running a tighter restaurant.",
           f'<section class="sec-s"><div class="w">{lst}</div></section>', [("Blog", "/blog/")],
           [{"@type": "Blog", "name": "POSINEXT Blog", "url": SITE + "/blog/", "publisher": {"@id": SITE + "/#org"},
             "blogPost": [{"@type": "BlogPosting", "headline": t, "url": f"{SITE}/blog/{s}/", "datePublished": d} for s, t, _, d, *_ in POSTS]}],
           priority="0.8")
    for slug, title, desc, date, body, faqs in POSTS:
        fh, fschema = faq(faqs)
        others = [p for p in POSTS if p[0] != slug][:3]
        more = ('<h2>More guides</h2><ul>' + "".join(f'<li><a href="/blog/{s}/">{t}</a></li>' for s, t, *_ in others) + "</ul>")
        fh = fh.replace('<div class="fq">', '<div class="fq" style="margin-left:0;max-width:46rem">', 1)
        inner = (f'<section class="sec-s"><div class="w"><article class="pr"><p class="meta">By the POSINEXT team · '
                 f'<time datetime="{date}">13 November 2026</time></p>{body}<h2>Frequently asked questions</h2></article>'
                 f'{fh}<div class="pr">{more}</div></div></section>')
        art = {"@type": "BlogPosting", "headline": title, "description": desc, "datePublished": date, "dateModified": date,
               "author": {"@type": "Organization", "name": "POSINEXT", "url": SITE + "/"}, "publisher": {"@id": SITE + "/#org"},
               "image": SITE + "/img/og.jpg", "mainEntityOfPage": f"{SITE}/blog/{slug}/", "inLanguage": "en-IN"}
        simple(f"/blog/{slug}/", title, desc, "Guide", title.split(":")[0] if ":" in title and len(title) > 70 else title, desc,
               inner, [("Blog", "/blog/"), (title.split(":")[0], f"/blog/{slug}/")], [art, fschema], priority="0.7")

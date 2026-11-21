"""Blog: guides for restaurant owners. Each post: (slug, title, description, date, body html, faqs).
Categories, cover-image prompts and the byline are in blog_meta.py; AI covers are made by site/tools/blog_images.py."""
import html as _html
import json
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from kit import PORTAL, EMAIL, SITE, faq, ico, esc, page, crumbs, cta_band
from cms import load_managed_posts
from blog_meta import AUTHOR, CODE_POSTS, IMAGE_STYLE

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

    ("restaurant-inventory-management-india",
     "Restaurant Inventory Management in India: A Practical Guide to Stock, Waste and Food Cost",
     "Learn how Indian restaurants can control inventory with recipe costing, purchase records, FIFO, wastage logs and weekly stock variance checks—with practical examples.",
     "2026-11-19",
     """<p>A restaurant can have a full dining room and still struggle to understand where its money went. Sales reports show what guests bought; purchase bills show what the kitchen ordered. The missing link is what those sales should have consumed, what was actually used, and what happened to the difference.</p>
<p>That is the purpose of restaurant inventory management. It is not just counting bags of rice or checking how much paneer is left. It is a repeatable operating process that connects purchasing, receiving, recipes, kitchen usage, wastage and sales.</p>
<h2>What restaurant inventory management should tell you</h2>
<p>At a minimum, a useful system should answer five questions:</p>
<ul><li>What ingredients and finished goods are in stock right now?</li><li>What did we receive, from which supplier, at what quantity and price?</li><li>How much stock should each dish have consumed based on the orders sold?</li><li>What was wasted, returned, transferred or used for staff meals?</li><li>Where does actual stock differ from expected stock, and what explains the gap?</li></ul>
<p>A spreadsheet can be a perfectly sensible starting point for a single outlet. Software becomes more useful when purchases, recipes, sales and counts are connected, especially across multiple shifts or outlets.</p>
<h2>1. Build a clean ingredient and unit master</h2>
<p>Start with the ingredients that matter financially and operationally: paneer, chicken, fish, cooking oil, dairy, rice, flour, packaging and high-value beverages. Give each ingredient one standard base unit—grams, millilitres or pieces—and define how supplier units convert into it.</p>
<p>For example, if a supplier invoice records a 5 kg bag of rice but your recipe uses 180 g per portion, the system must understand that one bag equals 5,000 g. Avoid creating separate stock items such as “paneer”, “paneer 1 kg” and “paneer block” when they represent the same ingredient and can be converted consistently.</p>
<h2>2. Record what actually arrives—not just what was ordered</h2>
<p>A purchase order is a request; it is not proof that the full quantity arrived. At receiving time, compare the supplier bill or delivery challan with the physical quantity and quality. Record short deliveries, damaged packs, substitutions and returns before the invoice is treated as received stock.</p>
<p>Keep the supplier, invoice number, date, item, unit, quantity, rate and tax details together. This gives the owner a trail when a price changes or the stock count does not match the books.</p>
<h2>3. Cost recipes using measured portions</h2>
<p>Recipe mapping connects a dish sold at the POS to the ingredients it consumes. Weigh a standard serving rather than relying on “one ladle” or “a handful”. Include sauces, garnishes and packaging where relevant, and define how variants and add-ons change the recipe.</p>
<p><strong>Worked example:</strong> suppose one serving of paneer curry uses 180 g of paneer. If the latest recorded purchase cost is ₹360 per kg, the paneer component costs ₹64.80 before gravy, spices, oil, garnish, cooking loss and packaging. The full recipe cost must include those other components too; ₹64.80 is not the dish's total food cost.</p>
<p>When a recipe changes, update the recipe card and effective date. Otherwise, theoretical consumption will be wrong even when the kitchen follows the new portion correctly.</p>
<h2>4. Use FIFO and sensible storage routines</h2>
<p>First In, First Out (FIFO) means using older stock before newer stock. Label opened and prepped containers with the received or preparation date, store ingredients in their designated locations, and follow appropriate food-safety temperature and handling requirements. FIFO helps reduce avoidable spoilage, but it does not replace food-safety checks or local compliance requirements.</p>
<h2>5. Log wastage and non-sale usage honestly</h2>
<p>Stock can leave the kitchen without appearing in a customer bill: trimming, spoilage, overproduction, staff meals, complimentary dishes, tasting, spills or returns. Record the quantity, reason, time and person responsible. Do not label every unexplained difference as theft; first check portion sizes, recipe versions, receiving errors, unit conversions and missed entries.</p>
<h2>6. Compare theoretical usage with actual usage</h2>
<p>This is the step that turns a stock register into inventory control. For each ingredient, calculate what the recipes say should have been consumed from the dishes sold, then compare that figure with stock movement.</p>
<div class="tb"><table><thead><tr><th>Paneer example for one week</th><th>Quantity</th></tr></thead><tbody>
<tr><td>Opening stock</td><td>8 kg</td></tr><tr><td>Purchases received</td><td>20 kg</td></tr><tr><td>Closing physical stock</td><td>9 kg</td></tr><tr><td>Actual usage (8 + 20 − 9)</td><td><strong>19 kg</strong></td></tr><tr><td>Expected usage from POS sales and recipes</td><td>17.5 kg</td></tr><tr><td>Unexplained variance before investigation</td><td><strong>1.5 kg</strong></td></tr></tbody></table></div>
<p>At ₹360 per kg, the 1.5 kg difference is ₹540 for the week. It is a prompt to investigate—not proof of loss. Check whether the receiving weight was correct, whether the recipe is up to date, whether staff meals and wastage were recorded, and whether portions are consistent.</p>
<h2>7. Set par levels to prevent both stockouts and over-ordering</h2>
<p>A par level is the quantity you aim to have available to cover expected use until the next delivery, plus a reasonable buffer. Base it on recent consumption, supplier lead time, delivery days, storage capacity and demand variation—not a fixed guess made once.</p>
<p>For example, if average paneer usage is 2.5 kg per day and the next reliable delivery is in two days, expected demand is about 5 kg before that delivery. Add a buffer based on demand swings and supplier reliability, then adjust after reviewing actual stockouts and leftovers. The right buffer differs by ingredient and outlet.</p>
<h2>8. Run a small, repeatable stock review</h2>
<p>Do not start by trying to count every ingredient every night. Make the routine achievable:</p>
<ul><li><strong>Every delivery:</strong> check quantities, quality, price and invoice details.</li><li><strong>Every shift:</strong> record wastage, staff meals, complimentary items and transfers.</li><li><strong>Daily:</strong> count critical or high-value ingredients and investigate unusual movement.</li><li><strong>Weekly:</strong> compare theoretical and actual usage for priority ingredients and review supplier price changes.</li><li><strong>Monthly:</strong> complete a broader physical count and reconcile it with purchase and accounting records.</li></ul>
<h2>9. Choose inventory software by testing the workflow</h2>
<p>When evaluating restaurant inventory software in India, do not stop at a stock-on-hand screen. Ask the vendor to demonstrate a complete example using your menu:</p>
<ul><li>Can a purchase entry record actual received quantity and supplier rate?</li><li>Can you define recipes with grams, millilitres, pieces, yields and add-ons?</li><li>Does a POS sale deduct the mapped ingredients as configured?</li><li>Can the team record wastage, staff meals, complimentary items and stock transfers?</li><li>Can you compare expected consumption with physical stock and drill into the variance?</li><li>Can managers review item-wise sales, purchases and stock movement by outlet and date?</li><li>Can you export the records needed by your accountant?</li></ul>
<p>Test a real shift or sample menu during the trial. A long feature list matters less than whether kitchen staff can enter purchases and wastage consistently when service is busy.</p>
<h2>How POSINEXT fits into the workflow</h2>
<p>POSINEXT is designed as a restaurant operating platform spanning POS billing, orders, outlets and reporting. Review the <a href="/features/">platform features</a> and <a href="/pricing/">published plans</a>, then use a <a href="/book-a-demo/">guided demo</a> to confirm the inventory, recipe and reporting workflows you need are available for your restaurant configuration. Ask the team to demonstrate your own purchase-to-sale scenario before deciding.</p>
<h2>A simple weekly inventory review template</h2>
<div class="tb"><table><thead><tr><th>Ingredient</th><th>Expected use</th><th>Actual use</th><th>Variance</th><th>Next action</th></tr></thead><tbody>
<tr><td>Paneer</td><td>17.5 kg</td><td>19 kg</td><td>+1.5 kg</td><td>Check portions, waste and receiving</td></tr>
<tr><td>Cooking oil</td><td>Based on recipes</td><td>From stock count</td><td>Calculate</td><td>Check frying, spills and recipe units</td></tr>
<tr><td>Chicken</td><td>Based on dishes sold</td><td>From stock count</td><td>Calculate</td><td>Check yield, trimming and portion size</td></tr></tbody></table></div>
<p>Assign one owner to each follow-up and review whether the variance improves next week. Consistent small checks are more valuable than a perfect stock sheet that nobody updates.</p>
<p class="note">The numbers in the paneer example are illustrative calculations, not an industry benchmark or a claim about typical restaurant performance. Food-cost targets depend on cuisine, recipe, format, location, supplier prices and accounting treatment. This guide is operational information, not food-safety, accounting or tax advice.</p>
<h2>Further reading</h2>
<ul><li><a href="https://nchm.gov.in/sites/default/files/2026-05/E%20book%20Advance%20Food%20%26%20Beverage%20Management%20II.pdf">National Council for Hotel Management: Advance Food &amp; Beverage Management</a> (inventory and POS operational flow)</li><li><a href="https://www.cbic.gov.in/">CBIC</a> for current GST and official tax guidance relevant to your business</li></ul>""",
     [("What is restaurant inventory management?", "It is the process of tracking ingredients and supplies from purchasing and receiving through storage, recipe usage, wastage and sales, then comparing expected usage with physical stock."),
      ("How do you calculate actual food usage?", "Opening stock plus purchases received minus closing physical stock equals actual usage for the period. Record transfers and non-sale usage separately so the comparison is meaningful."),
      ("What is theoretical food consumption?", "It is the quantity of ingredients that should have been used based on POS sales multiplied by the standard recipe quantity for each dish."),
      ("How often should a restaurant count inventory?", "Count high-value or perishable ingredients frequently, review priority ingredient variance weekly, and complete a broader physical count monthly. Adjust the schedule to your outlet's risk and volume."),
      ("Does restaurant POS software automatically manage inventory?", "Only when the product supports the required recipe mapping, units, purchase and wastage workflows and stock deduction rules. Ask for an end-to-end demonstration using your own menu.")]),

]


ALL = []        # every post on the site (code + CMS), newest first, as (slug, title, desc, date, ...); for llms.txt
LASTMOD = {}    # '/blog/<slug>/' -> last-modified date, for sitemap.xml

IMAGES = Path(__file__).parent / "images"
COVERS = IMAGES / "blog-covers.json"   # written by tools/blog_images.py: the covers that are AI-generated
ICON = {"Restaurant Marketing": "users", "Restaurant Operations": "chart", "Online Orders": "bike",
        "GST & Compliance": "receipt", "Restaurant Technology": "monitor"}
COVER_SIZES = "(min-width:1280px) 1232px, calc(100vw - 2.5rem)"


def nice(d):
    return datetime.strptime(d, "%Y-%m-%d").strftime("%d %B %Y").lstrip("0")


def short(d):
    return datetime.strptime(d, "%Y-%m-%d").strftime("%d %b %Y").lstrip("0")


def minutes(body):
    return max(1, round(len(re.sub(r"<[^>]+>", " ", body).split()) / 200))


def anchor(text):
    return re.sub(r"[^a-z0-9]+", "-", _html.unescape(re.sub(r"<[^>]+>", "", text)).lower()).strip("-")[:60] or "part"


def with_ids(body):
    """Gives each <h2> an id for the contents list; returns (body, [(id, heading text)])."""
    toc, seen = [], set()

    def one(m):
        a = base = anchor(m.group(1))
        n = 2
        while a in seen:
            a, n = f"{base}-{n}", n + 1
        seen.add(a)
        toc.append((a, re.sub(r"<[^>]+>", "", m.group(1))))
        return f'<h2 id="{a}">{m.group(1)}</h2>'
    return re.sub(r"<h2>(.*?)</h2>", one, body, flags=re.S), toc


def normalise(t, ai):
    slug, title, desc, date, body, faqs, *rest = t
    updated = rest[0] if rest and rest[0] else ""
    extra = rest[1] if len(rest) > 1 and isinstance(rest[1], dict) else {}
    code = CODE_POSTS.get(slug)
    image = next((f"blog-{slug}" for ext in (".jpg", ".png", ".webp") if (IMAGES / f"blog-{slug}{ext}").exists()), None)
    return {"slug": slug, "title": title, "desc": desc, "date": date, "updated": updated if updated != date else "",
            "body": body, "faqs": faqs, "category": extra.get("category") or (code[0] if code else "") or "Guides",
            "alt": extra.get("image_alt") or (code[2] if code else "") or title, "image": image, "ai": slug in ai,
            "author": extra.get("author") or AUTHOR, "minutes": minutes(body)}


def cover(p, eager=False, sizes="(min-width:1024px) 400px, (min-width:768px) 50vw, calc(100vw - 2.5rem)"):
    """The post's cover (WebP at 480/800/1200 from src/images/blog-<slug>.*), or a designed placeholder until there is one."""
    if p["image"]:
        key = p["image"]
        srcset = ", ".join(f"/img/{key}-{w}.webp {w}w" for w in (480, 800, 1200))
        load = 'fetchpriority="high"' if eager else 'loading="lazy"'
        return (f'<img class="cv" src="/img/{key}-800.webp" srcset="{srcset}" sizes="{sizes}" width="1200" height="675" '
                f'alt="{esc(p["alt"])}" {load} decoding="async">')
    t = sum(map(ord, p["category"])) % 4
    return f'<div class="cv cv{t}" aria-hidden="true">{ico(ICON.get(p["category"], "book"))}</div>'


def avatar(a):
    if a is AUTHOR:  # the team: the logo mark
        return ('<span class="av"><svg viewBox="0 0 32 24" aria-hidden="true"><path class="a" d="M2 2 L12 12 L2 22 H8 L18 12 L8 2 Z"/>'
                '<path class="b" d="M14 2 L24 12 L14 22 H20 L30 12 L20 2 Z"/></svg></span>')
    return f'<span class="av av-t" aria-hidden="true">{esc("".join(w[0] for w in a["name"].split()[:2]).upper())}</span>'


def byline(p):
    upd = f' · Updated <time datetime="{p["updated"]}">{nice(p["updated"])}</time>' if p["updated"] else ""
    return (f'<div class="by">{avatar(p["author"])}<div><b>{esc(p["author"]["name"])}</b><span><time datetime="{p["date"]}">'
            f'{nice(p["date"])}</time>{upd} · {p["minutes"]} min read</span></div></div>')


def card(p, featured=False):
    img = cover(p, eager=True, sizes="(min-width:1024px) 680px, calc(100vw - 2.5rem)") if featured else cover(p)
    h = "h2" if featured else "h3"
    meta = f'<p class="bm"><time datetime="{p["date"]}">{short(p["date"])}</time> · {p["minutes"]} min read</p>'
    return (f'<a class="{"bl-f" if featured else "bcard"}" href="/blog/{p["slug"]}/">{img}<div class="bl-t">'
            f'<span class="cat">{esc(p["category"])}</span><{h}>{p["title"]}</{h}><p>{p["desc"]}</p>{meta}</div></a>')


def share(p):
    u = quote(f"{SITE}/blog/{p['slug']}/", safe="")
    t = quote(_html.unescape(p["title"]), safe="")
    links = [("WhatsApp", f"https://wa.me/?text={t}%20{u}"), ("LinkedIn", f"https://www.linkedin.com/sharing/share-offsite/?url={u}"),
             ("X", f"https://twitter.com/intent/tweet?url={u}&amp;text={t}"), ("Facebook", f"https://www.facebook.com/sharer/sharer.php?u={u}")]
    return ('<div class="share"><span>Share this guide</span>'
            + "".join(f'<a href="{h}" target="_blank" rel="noopener">{n}</a>' for n, h in links) + "</div>")


def author_box(p):
    a = p["author"]
    return (f'<div class="abox">{avatar(a)}<div><span class="ey">Written by</span><b>{esc(a["name"])}</b>'
            f'<p>{esc(a.get("bio") or a.get("role") or "")}</p></div></div>')


def build(simple, write):
    # CMS posts live as JSON in content/posts (repo root). Drafts stay private; scheduled posts
    # enter the static site on the first build on/after their publish date.
    all_posts = list(POSTS)
    existing_slugs = {p[0] for p in all_posts}
    all_posts.extend(load_managed_posts(existing_slugs))
    all_posts.sort(key=lambda p: p[3], reverse=True)
    ALL[:] = all_posts
    try:
        ai = set(json.loads(COVERS.read_text(encoding="utf-8")))
    except (OSError, ValueError):
        ai = set()
    posts = [normalise(t, ai) for t in all_posts]
    for p in posts:
        LASTMOD[f"/blog/{p['slug']}/"] = p["updated"] or p["date"]
    if posts:
        LASTMOD["/blog/"] = max(LASTMOD.values())

    # ---- the blog page: the newest post large, the topics, then the rest in a grid
    cats = sorted({p["category"] for p in posts})
    lst = ""
    if posts:
        lst = card(posts[0], featured=True)
        if len(cats) > 1:
            lst += '<div class="bl-c"><span>Topics</span>' + "".join(f'<span class="cat">{esc(c)}</span>' for c in cats) + "</div>"
        if len(posts) > 1:
            lst += '<div class="bl-g">' + "".join(card(p) for p in posts[1:]) + "</div>"
    # a compact header: the breadcrumb already says "Blog", so no eyebrow, and less space before the posts
    bc, bc_schema = crumbs([("Blog", "/blog/")])
    index = (f'{bc}<section class="ph ph-c"><div class="w"><h1>Guides for restaurant owners</h1>'
             '<p class="lead">Practical, no-fluff guides on billing, GST, inventory, food cost, online orders and running a tighter restaurant.</p>'
             f'</div></section><section class="sec-s"><div class="w">{lst}</div></section>{cta_band()}')
    write("/blog/", page("/blog/", "Restaurant POS Blog: Guides for Restaurant Owners | POSINEXT",
           "Practical restaurant management guides for India: POS software, GST billing, inventory, food cost, online orders and operational control.",
           index, [bc_schema, {"@type": "Blog", "name": "POSINEXT Blog", "url": SITE + "/blog/", "publisher": {"@id": SITE + "/#org"},
             "blogPost": [{"@type": "BlogPosting", "headline": _html.unescape(p["title"]), "url": f"{SITE}/blog/{p['slug']}/",
                           "datePublished": p["date"], **({"image": f"{SITE}/img/{p['image']}-og.jpg"} if p["image"] else {})}
                          for p in posts]}], modified=LASTMOD.get("/blog/")), "0.8")

    # ---- each article
    for p in posts:
        slug, title, desc, body, faqs = p["slug"], p["title"], p["desc"], p["body"], p["faqs"]
        if "<table>" in body and '<div class="tb">' not in body:  # CMS tables: scroll sideways on phones
            body = body.replace("<table>", '<div class="tb"><table>').replace("</table>", "</table></div>")
        body, toc = with_ids(body)
        fh, fschema = faq(faqs) if faqs else ("", None)
        if faqs:
            fh = '<h2 id="faq">Frequently asked questions</h2>' + fh.replace('<div class="fq">', '<div class="fq" style="margin-left:0;max-width:46rem">', 1)
            toc.append(("faq", "Frequently asked questions"))
        others = [q for q in posts if q["slug"] != slug]   # newest first
        related = ([q for q in others if q["category"] == p["category"]] + [q for q in others if q["category"] != p["category"]])[:3]
        toc_html = ('<aside class="toc" aria-label="On this page"><b>On this page</b><ol>'
                    + "".join(f'<li><a href="#{a}">{t}</a></li>' for a, t in toc) + "</ol></aside>") if len(toc) >= 3 else ""
        caption = "<figcaption>AI-generated illustration</figcaption>" if p["image"] and p["ai"] else ""
        bc, bc_schema = crumbs([("Blog", "/blog/"), (title.split(":")[0], f"/blog/{slug}/")])
        art = (f'{bc}<article class="bp"><header class="w bp-h"><div class="bp-hi"><span class="cat">{esc(p["category"])}</span>'
               f'<h1>{title}</h1><p class="lead">{desc}</p>{byline(p)}</div></header>'
               f'<figure class="w bp-cover">{cover(p, eager=True, sizes=COVER_SIZES)}{caption}</figure>'
               f'<div class="w bp-g"><div class="pr bp-body">{body}{fh}{share(p)}{author_box(p)}</div>{toc_html}</div></article>')
        if related:
            art += ('<section class="sec-s bs"><div class="w"><span class="ey">Keep reading</span>'
                    '<h2 class="bl-h">More guides for restaurant owners</h2><div class="bl-g">'
                    + "".join(card(q) for q in related) + "</div></div></section>")
        art += cta_band()
        a = p["author"]
        author = ({"@type": "Organization", "name": a["name"], "url": SITE + "/about/"} if a is AUTHOR
                  else {"@type": "Person", "name": a["name"], **({"jobTitle": a["role"]} if a.get("role") else {})})
        og = f"/img/{p['image']}-og.jpg" if p["image"] else "/img/og.jpg"
        schema = {"@type": "BlogPosting", "headline": _html.unescape(title), "description": _html.unescape(desc),
                  "datePublished": p["date"], "dateModified": p["updated"] or p["date"], "author": author,
                  "publisher": {"@id": SITE + "/#org"}, "image": SITE + og, "articleSection": p["category"],
                  "mainEntityOfPage": f"{SITE}/blog/{slug}/", "inLanguage": "en-IN"}
        doc = page(f"/blog/{slug}/", title, desc, art, [bc_schema, schema] + ([fschema] if fschema else []), og_type="article",
                   og_img=og, preload=p["image"], preload_sizes=COVER_SIZES, modified=p["updated"] or p["date"])
        doc = doc.replace('<meta property="og:locale"', f'<meta property="article:published_time" content="{p["date"]}">'
                          f'<meta property="article:section" content="{esc(p["category"])}"><meta property="og:locale"', 1)
        write(f"/blog/{slug}/", doc, "0.7")

    # ---- for the /admin/ cover panel: every published post (code and CMS), its cover prompt and whether it has a cover
    out = Path(__file__).resolve().parent.parent / "public" / "admin"
    out.mkdir(parents=True, exist_ok=True)
    managed = {}
    for f in (Path(__file__).resolve().parents[2] / "content" / "posts").glob("*.json"):
        try:
            managed[f.stem] = json.loads(f.read_text(encoding="utf-8")).get("image_prompt") or ""
        except (OSError, ValueError):
            pass
    listing = [{"slug": p["slug"], "title": _html.unescape(p["title"]), "category": p["category"], "date": p["date"],
                "prompt": (CODE_POSTS[p["slug"]][1] if p["slug"] in CODE_POSTS else managed.get(p["slug"], "")),
                "cover": f"/img/{p['image']}-800.webp" if p["image"] else None, "ai": p["ai"], "cms": p["slug"] not in CODE_POSTS}
               for p in posts]
    (out / "posts.json").write_text(json.dumps({"style": IMAGE_STYLE, "posts": listing}, ensure_ascii=False), encoding="utf-8")

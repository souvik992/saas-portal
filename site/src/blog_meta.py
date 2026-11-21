"""Blog post details that are not part of the article text: the author byline, categories, and the prompts used to make
each post's AI cover image (tools/blog_images.py). Kept free of heavy imports so the image tool can read it.

CMS posts (content/posts/<slug>.json) carry the same things in their own JSON: "category", "image_prompt",
"image_alt" and, optionally, "author" ({"name": ..., "role": ...}) when a real person wrote the post.
"""

AUTHOR = {
    "name": "POSINEXT Editorial Team",
    "role": "Practical guides for restaurant owners in India",
    "bio": "We write practical, sourced guides on billing, GST, online orders, marketing and running a tighter "
           "restaurant, from the team that builds POSINEXT's POS and ordering software.",
}

# The house style added to every cover prompt, so all covers look like one blog.
IMAGE_STYLE = ("Editorial photograph for a restaurant business blog cover. Realistic, natural light, shallow depth of "
               "field, 35mm lens, set in India with Indian people where people appear, warm tones with a subtle orange "
               "accent, calm uncluttered composition. Absolutely no text, letters, numbers, signage, logos, brand names, "
               "app screens with readable content, or watermarks. Wide landscape 16:9 framing.")

# Posts written in posts.py (code). slug -> (category, image prompt subject, image alt text)
CODE_POSTS = {
    "how-to-choose-restaurant-pos-software-india": (
        "Restaurant Technology",
        "A restaurant owner standing at the billing counter of a busy Indian casual-dining restaurant, touching a "
        "modern POS touchscreen terminal beside a small receipt printer, warm evening light, diners softly blurred behind",
        "A restaurant owner using a POS touchscreen at the billing counter"),
    "gst-on-restaurant-bills-india": (
        "GST & Compliance",
        "Close-up of a printed restaurant bill folded on a small steel tray next to a calculator, a pen and a cup of "
        "masala chai on a wooden table, the printed lines blurred so nothing is readable",
        "A printed restaurant bill on a tray beside a calculator and a cup of chai"),
    "swiggy-zomato-pos-integration-guide": (
        "Online Orders",
        "Sealed food delivery bags and boxes lined up on a restaurant pass counter next to a kitchen ticket printer "
        "pushing out a ticket, a delivery rider in a plain helmet blurred in the doorway, no branding anywhere",
        "Packed delivery orders waiting on a restaurant counter beside a ticket printer"),
    "reduce-restaurant-revenue-leakage": (
        "Restaurant Operations",
        "A restaurant manager after closing time reviewing the day on a tablet at the cash counter, an open cash "
        "drawer, a neat stack of receipts and a small desk lamp, empty dining room softly lit behind",
        "A restaurant manager reviewing the day's sales at the cash counter after closing"),
    "restaurant-inventory-management-india": (
        "Restaurant Operations",
        "An organised restaurant storeroom with steel shelves of labelled-but-unreadable containers of rice, lentils, "
        "spices and fresh paneer, a kitchen staff member in an apron counting stock with a clipboard",
        "A kitchen staff member counting stock in an organised restaurant storeroom"),
}

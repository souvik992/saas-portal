"""Load and validate CMS-managed restaurant blog posts from JSON files."""
import html
import json
import re
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

# repo-root content/posts: where the /admin/ CMS commits posts (site/src/cms.py -> ../../content/posts)
CONTENT_DIR = Path(__file__).resolve().parents[2] / "content" / "posts"
LOCAL_TZ = ZoneInfo("Asia/Kolkata")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ALLOWED = {"p","h2","h3","h4","ul","ol","li","strong","b","em","i","blockquote","br","hr","a","table","thead","tbody","tr","th","td","pre","code"}
VOID = {"br","hr"}
DROP = {"script","style","iframe","object","svg","math"}

class SafeArticleHTML(HTMLParser):
    """Allow-list article markup; scripts, styles, event handlers and unsafe URLs are discarded."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.stack, self.drop_depth = [], [], 0

    def handle_starttag(self, tag, attrs):
        if tag in DROP:
            self.drop_depth += 1
            return
        if self.drop_depth or tag not in ALLOWED:
            return
        if tag == "a":
            href = dict(attrs).get("href", "").strip()
            if href.startswith(("/", "https://", "http://", "mailto:")):
                self.parts.append(f'<a href="{html.escape(href, quote=True)}">')
                self.stack.append("a")
            else:
                self.parts.append("<span>")
                self.stack.append("span")
            return
        self.parts.append(f"<{tag}>")
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.drop_depth:
            if tag in DROP:
                self.drop_depth -= 1
            return
        if tag not in ALLOWED or tag in VOID or tag not in self.stack:
            return
        while self.stack:
            name = self.stack.pop()
            self.parts.append(f"</{name}>")
            if name == tag:
                break

    def handle_data(self, data):
        if not self.drop_depth:
            self.parts.append(html.escape(data, quote=False))

    def close(self):
        super().close()
        while self.stack:
            self.parts.append(f"</{self.stack.pop()}>")

def sanitize_article_html(raw):
    parser = SafeArticleHTML()
    parser.feed(str(raw or ""))
    parser.close()
    return "".join(parser.parts).strip()

def load_managed_posts(existing_slugs=None):
    existing = set(existing_slugs or ())
    if not CONTENT_DIR.exists():
        return []
    today = datetime.now(LOCAL_TZ).date()
    loaded = []
    for path in sorted(CONTENT_DIR.glob("*.json")):
        try:
            item = json.loads(path.read_text(encoding="utf-8"))
            slug = str(item.get("slug") or path.stem).strip()
            if not SLUG_RE.fullmatch(slug) or slug in existing:
                continue
            status = item.get("status", "draft")
            if status == "scheduled":
                publish_on = datetime.strptime(item["publish_on"], "%Y-%m-%d").date()
                if publish_on > today:
                    continue
            elif status != "published":
                continue
            title = str(item["title"]).strip()
            desc = str(item["description"]).strip()
            date = str(item.get("published_on") or item.get("publish_on") or today.isoformat())
            datetime.strptime(date, "%Y-%m-%d")
            body = sanitize_article_html(item.get("body_html", ""))
            if not title or not desc or not body:
                continue
            faqs = []
            for entry in item.get("faqs") or []:
                if isinstance(entry, dict):
                    q, a = str(entry.get("question", "")).strip(), str(entry.get("answer", "")).strip()
                else:
                    q, a = str(entry[0]).strip(), str(entry[1]).strip()
                if q and a:
                    faqs.append((html.escape(q), html.escape(a)))
            loaded.append((slug, title, desc, date, body, faqs))
            existing.add(slug)
        except (OSError, ValueError, KeyError, TypeError, IndexError, json.JSONDecodeError) as exc:
            print(f"Skipping invalid CMS post {path.name}: {exc}")
    return loaded

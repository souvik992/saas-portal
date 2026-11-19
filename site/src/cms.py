"""Load CMS-managed restaurant blog posts from JSON files.

The CMS is static and commits JSON to the repository through the GitHub Contents API.
Only published posts and scheduled posts whose publish date has arrived are built.
"""
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content" / "posts"
LOCAL_TZ = ZoneInfo("Asia/Kolkata")


def load_managed_posts(existing_slugs=None):
    existing_slugs = set(existing_slugs or ())
    if not CONTENT_DIR.exists():
        return []

    today = datetime.now(LOCAL_TZ).date()
    loaded = []
    for path in sorted(CONTENT_DIR.glob("*.json")):
        try:
            item = json.loads(path.read_text(encoding="utf-8"))
            slug = str(item.get("slug") or path.stem).strip()
            status = item.get("status", "draft")
            if not slug or slug in existing_slugs:
                continue
            if status == "scheduled":
                publish_on = datetime.strptime(item["publish_on"], "%Y-%m-%d").date()
                if publish_on > today:
                    continue
            elif status != "published":
                continue

            title = str(item["title"]).strip()
            description = str(item["description"]).strip()
            date = str(item.get("published_on") or item.get("publish_on") or today.isoformat())
            datetime.strptime(date, "%Y-%m-%d")
            body = str(item.get("body_html", "")).strip()
            if not title or not description or not body:
                continue
            faqs = item.get("faqs") or []
            cleaned_faqs = []
            for entry in faqs:
                if isinstance(entry, dict):
                    q, a = str(entry.get("question", "")).strip(), str(entry.get("answer", "")).strip()
                else:
                    q, a = str(entry[0]).strip(), str(entry[1]).strip()
                if q and a:
                    cleaned_faqs.append((q, a))
            loaded.append((slug, title, description, date, body, cleaned_faqs))
            existing_slugs.add(slug)
        except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            print(f"Skipping invalid CMS post {path.name}: {exc}")
    return loaded

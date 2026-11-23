"""Makes AI cover images for blog posts, and saves them where the site build picks them up.

Two image services:
    Cloudflare Workers AI (FLUX.1 schnell; free daily allowance) - needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
    OpenAI image API (gpt-image-1; paid)                          - needs OPENAI_API_KEY
--provider auto (default) uses Cloudflare when its two variables are set, else OpenAI. The GitHub Action
"Build and commit static website" runs this with the Cloudflare secrets, so new posts get a cover automatically.

    set OPENAI_API_KEY=sk-...            (PowerShell: $env:OPENAI_API_KEY = "sk-...")
    python site/tools/blog_images.py               # every post without a cover
    python site/tools/blog_images.py --dry-run     # show the prompts, call nothing
    python site/tools/blog_images.py --only <slug> --force   # make one again
    python site/src/build.py                       # then rebuild the site

Each cover is src/images/blog-<slug>.jpg (16:9, 1536x864). The build turns it into WebP sizes and a link-preview JPEG,
and shows "AI-generated illustration" under covers listed in src/images/blog-covers.json (this script keeps that list).
The prompt is the post's subject (blog_meta.CODE_POSTS, or "image_prompt" in a CMS post's JSON; else made from its
title) plus the house style (blog_meta.IMAGE_STYLE), so every cover looks like one blog.

Options: --provider auto|cloudflare|openai, --model (OpenAI only; default gpt-image-1, or OPENAI_IMAGE_MODEL),
--quality low|medium|high (OpenAI only; default medium), --limit N (at most N covers this run).
Keys are read from the environment only; they are never written anywhere.
"""
import argparse
import base64
import io
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))
from blog_meta import CODE_POSTS, IMAGE_STYLE  # noqa: E402

CONTENT = Path(__file__).resolve().parents[2] / "content" / "posts"
IMAGES = SRC / "images"
LEDGER = IMAGES / "blog-covers.json"
API = "https://api.openai.com/v1/images/generations"
CF_MODEL = "@cf/black-forest-labs/flux-1-schnell"
CF_API = "https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/" + CF_MODEL


def posts():
    """(slug, title, subject) for every post: code posts, then CMS posts (drafts too, so covers are ready on publish)."""
    out = []
    code_titles = {}
    try:  # titles of code posts, without importing the site build (it makes fonts on import)
        import ast
        tree = ast.parse((SRC / "posts.py").read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "POSTS" for t in node.targets):
                for el in node.value.elts:
                    code_titles[el.elts[0].value] = el.elts[1].value
    except (OSError, SyntaxError, AttributeError):
        pass
    for slug, (_, subject, _) in CODE_POSTS.items():
        out.append((slug, code_titles.get(slug, slug), subject))
    for f in sorted(CONTENT.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        slug = d.get("slug") or f.stem
        if slug in CODE_POSTS:
            continue
        subject = (d.get("image_prompt") or "").strip() or (
            f"A scene that illustrates the restaurant guide \"{d.get('title', slug)}\" ({d.get('category') or 'restaurant business'}), "
            "showing a real Indian restaurant, café or cloud kitchen at work")
        out.append((slug, d.get("title", slug), subject))
    return out


def has_cover(slug):
    return any((IMAGES / f"blog-{slug}{e}").exists() for e in (".jpg", ".png", ".webp"))


def generate(key, model, quality, prompt):
    body = json.dumps({"model": model, "prompt": prompt, "size": "1536x1024", "quality": quality, "n": 1}).encode()
    req = urllib.request.Request(API, data=body, method="POST", headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:400]
        raise SystemExit(f"The image API refused the request ({e.code}): {detail}")
    item = data["data"][0]
    if item.get("b64_json"):
        return base64.b64decode(item["b64_json"])
    with urllib.request.urlopen(item["url"], timeout=120) as r:  # models that answer with a link
        return r.read()


def generate_cloudflare(account, token, prompt):
    """FLUX.1 schnell on Cloudflare Workers AI: 8 steps (the maximum); answers with a base64 JPEG."""
    body = json.dumps({"prompt": prompt[:2048], "steps": 8}).encode()
    req = urllib.request.Request(CF_API.format(account=account), data=body, method="POST",
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:400]
        raise SystemExit(f"Cloudflare Workers AI refused the request ({e.code}): {detail}")
    image = (data.get("result") or {}).get("image") or data.get("image")
    if not image:
        raise SystemExit(f"Cloudflare Workers AI returned no image: {str(data)[:400]}")
    return base64.b64decode(image)


def save(raw, path):
    from PIL import Image, ImageOps
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    ImageOps.fit(im, (1536, 864), Image.LANCZOS).save(path, "JPEG", quality=88, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser(description="AI cover images for the blog")
    ap.add_argument("--only", action="append", help="this slug only (repeatable)")
    ap.add_argument("--force", action="store_true", help="make covers again even if they exist")
    ap.add_argument("--dry-run", action="store_true", help="print the prompts; call nothing")
    ap.add_argument("--provider", default="auto", choices=["auto", "cloudflare", "openai"])
    ap.add_argument("--limit", type=int, default=0, help="at most this many covers this run (0 = no limit)")
    ap.add_argument("--model", default=os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1"))
    ap.add_argument("--quality", default="medium", choices=["low", "medium", "high"])
    a = ap.parse_args()

    todo = [p for p in posts() if (not a.only or p[0] in a.only) and (a.force or not has_cover(p[0]))]
    if a.only:
        missing = set(a.only) - {p[0] for p in posts()}
        if missing:
            raise SystemExit(f"No such post: {', '.join(sorted(missing))}")
    if a.limit > 0:
        todo = todo[:a.limit]
    if not todo:
        print("Every post already has a cover (use --force to make one again).")
        return
    cf_account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    cf_token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    provider = a.provider if a.provider != "auto" else ("cloudflare" if cf_account and cf_token else "openai")
    if not a.dry_run:
        if provider == "cloudflare" and not (cf_account and cf_token):
            raise SystemExit("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first (read from the environment only).")
        if provider == "openai" and not key:
            raise SystemExit("Set OPENAI_API_KEY (or the two Cloudflare variables) first; keys are read from the environment only.")
    try:
        ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        ledger = {}
    for i, (slug, title, subject) in enumerate(todo, 1):
        prompt = f"{subject}. {IMAGE_STYLE}"
        print(f"[{i}/{len(todo)}] {slug}")
        if a.dry_run:
            print(f"    {prompt}\n")
            continue
        for old in IMAGES.glob(f"blog-{slug}.*"):
            old.unlink()
        if provider == "cloudflare":
            raw = generate_cloudflare(cf_account, cf_token, prompt)
            entry = {"model": CF_MODEL, "quality": "8 steps", "prompt": prompt}
        else:
            raw = generate(key, a.model, a.quality, prompt)
            entry = {"model": a.model, "quality": a.quality, "prompt": prompt}
        save(raw, IMAGES / f"blog-{slug}.jpg")
        ledger[slug] = entry
        LEDGER.write_text(json.dumps(ledger, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"    saved src/images/blog-{slug}.jpg")
    if not a.dry_run:
        print("\nDone. Rebuild the site: python site/src/build.py")


if __name__ == "__main__":
    main()

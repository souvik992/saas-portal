#!/usr/bin/env python3
"""Try the blog admin (/admin/) on this PC, without GitHub or the server.

    python site/cms/dev_local.py            # then open http://127.0.0.1:8090/admin/  (sign in: admin / local-admin-1)

- The site (site/public) and the admin API (cms_server.py) run together on one address.
- Instead of committing to GitHub, saves go straight into this folder (content/posts, site/src/images), so `git status`
  shows them; commit what you want to keep. After each save the site is rebuilt here (python site/src/build.py).
- AI pictures: with OPENAI_API_KEY set in this terminal they come from OpenAI (real, and charged). Without it, add any
  key starting "sk-" under AI settings on the page: it is accepted, and a free test picture is drawn instead.
"""
import base64
import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # the repo
PUBLIC = ROOT / "site" / "public"
WRITABLE = ("content/posts", "site/src/images")      # what the admin may change, as on GitHub
PORT = int(os.environ.get("PORT", "8090"))
USER, PASSWORD = "admin", "local-admin-1"


def sha(b):
    return hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()  # git's blob id


class FakeGitHubAndAI(BaseHTTPRequestHandler):
    """The GitHub contents API on this folder, and a free stand-in for the OpenAI image API."""
    def log_message(self, *a):
        pass

    def out(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def target(self):
        rel = self.path.split("/contents/", 1)[1].split("?")[0]
        if not rel.startswith(WRITABLE) or ".." in rel:
            return rel, None
        return rel, ROOT / rel

    def do_GET(self):
        if self.path.startswith("/v1/models"):  # checking a key: any sk-... key is accepted here
            ok = self.headers.get("Authorization", "").startswith("Bearer sk-")
            return self.out(200 if ok else 401, {"data": []} if ok else {"error": {"message": "bad key"}})
        rel, p = self.target()
        if p is None or not p.exists():
            return self.out(404, {"message": "Not Found"})
        if p.is_dir():
            return self.out(200, [{"type": "file", "name": f.name, "path": f"{rel}/{f.name}", "sha": sha(f.read_bytes())}
                                  for f in sorted(p.iterdir()) if f.is_file()])
        b = p.read_bytes()
        return self.out(200, {"content": base64.b64encode(b).decode(), "sha": sha(b)})

    def body(self):
        return json.loads(self.rfile.read(int(self.headers["Content-Length"])))

    def do_PUT(self):
        rel, p = self.target()
        if p is None:
            return self.out(403, {"message": "Not allowed here"})
        d = self.body()
        if p.exists() and d.get("sha") != sha(p.read_bytes()):
            return self.out(409, {"message": "sha mismatch"})
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(base64.b64decode(d["content"]))
        print(f"  saved {rel}  ({d['message']})")
        return self.out(200, {"content": {"sha": sha(p.read_bytes())}, "commit": {"sha": "local000"}})

    def do_DELETE(self):
        rel, p = self.target()
        if p is None or not p.exists():
            return self.out(404, {"message": "Not Found"})
        p.unlink()
        print(f"  removed {rel}")
        return self.out(200, {})

    def do_POST(self):  # the OpenAI image API, free: a test picture
        d = self.body()
        from PIL import Image, ImageDraw
        im = Image.new("RGB", (1536, 1024))
        dr = ImageDraw.Draw(im)
        for y in range(1024):
            dr.line([(0, y), (1536, y)], fill=(241 - y // 12, 91 + y // 16, 40 + y // 10))
        dr.rectangle([80, 380, 1456, 640], fill=(16, 24, 39))
        dr.text((120, 420), "TEST PICTURE (no OPENAI_API_KEY set)", fill=(255, 255, 255), font_size=56)
        dr.text((120, 520), d["prompt"][:70], fill=(255, 200, 160), font_size=34)
        b = io.BytesIO()
        im.save(b, "JPEG", quality=85)
        time.sleep(1.5)
        return self.out(200, {"data": [{"b64_json": base64.b64encode(b.getvalue()).decode()}]})


def serve(handler, port=0):
    s = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s


def main():
    state = tempfile.mkdtemp(prefix="posinext-cms-")
    fake = serve(FakeGitHubAndAI)
    fake_url = f"http://127.0.0.1:{fake.server_port}"
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    os.environ.update(CMS_CONFIG=f"{state}/config.json", CMS_STATE=state, CMS_GITHUB_API=fake_url)
    if not key:
        os.environ["CMS_OPENAI_API"] = fake_url + "/v1"
    sys.path.insert(0, str(Path(__file__).parent))
    import cms_server as cms
    cfg = {"username": USER, "password_hash": cms.hash_password(PASSWORD), "github_token": "local"}
    if key:
        cfg["openai_api_key"] = key
    json.dump(cfg, open(f"{state}/config.json", "w"))
    api = serve(cms.Handler)

    class Site(SimpleHTTPRequestHandler):
        """site/public, and /admin/api/* passed to the CMS (as Caddy does on the server)."""
        def __init__(self, *a, **k):
            super().__init__(*a, directory=str(PUBLIC), **k)

        def log_message(self, *a):
            pass

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def proxy(self):
            n = int(self.headers.get("Content-Length") or 0)
            req = urllib.request.Request(f"http://127.0.0.1:{api.server_port}{self.path}", method=self.command,
                                         data=self.rfile.read(n) if n else None)
            for h in ("Cookie", "X-CMS", "Content-Type"):
                if self.headers.get(h):
                    req.add_header(h, self.headers[h])
            try:
                r = urllib.request.urlopen(req, timeout=300)
            except urllib.error.HTTPError as e:
                r = e
            body = r.read()
            self.send_response(r.status if hasattr(r, "status") else r.code)
            for h in ("Content-Type", "Set-Cookie"):
                v = r.headers.get(h)
                if v:  # the server's cookie is Secure (https); here the site is http
                    self.send_header(h, v.replace("; Secure", "") if h == "Set-Cookie" else v)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            return self.proxy() if self.path.startswith("/admin/api/") else super().do_GET()

        def do_POST(self):
            return self.proxy()

        def do_PUT(self):
            return self.proxy()

        def do_DELETE(self):
            return self.proxy()

    def rebuild_on_save():  # the server's posinext-site-rebuild.path, here
        flag, seen = Path(state) / "rebuild", 0.0
        while True:
            time.sleep(1)
            if flag.exists() and flag.stat().st_mtime > seen:
                seen = flag.stat().st_mtime
                print("  rebuilding the site…")
                env = dict(os.environ, PYTHONIOENCODING="utf-8")
                r = subprocess.run([sys.executable, str(ROOT / "site" / "src" / "build.py")], capture_output=True, text=True, env=env)
                print("  " + (r.stdout.strip().splitlines() or ["built"])[-1] if r.returncode == 0 else "  BUILD FAILED:\n" + r.stderr[-2000:])
    threading.Thread(target=rebuild_on_save, daemon=True).start()

    ThreadingHTTPServer.allow_reuse_address = True
    site = ThreadingHTTPServer(("127.0.0.1", PORT), Site)
    print(f"\nLocal blog admin running.\n\n  Admin:  http://127.0.0.1:{PORT}/admin/   (sign in: {USER} / {PASSWORD})\n"
          f"  Blog:   http://127.0.0.1:{PORT}/blog/\n\n"
          f"  AI pictures: {'OpenAI (real, charged)' if key else 'off until a key is added under AI settings; any sk-... key works here and draws free test pictures'}\n"
          f"  Saves go into this folder ({ROOT.name}/content/posts, site/src/images), not GitHub. Ctrl+C stops.\n")
    try:
        site.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

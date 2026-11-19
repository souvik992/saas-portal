#!/usr/bin/env python3
"""POSINEXT blog CMS backend (Python standard library only).

Runs on the posinext.com server behind Caddy (/admin/api/* -> 127.0.0.1:8787). The admin signs in with a username and
password; the GitHub token never leaves this server. Posts are committed to content/posts/<slug>.json in the repo,
then the site rebuild is triggered at once (systemd path unit watching the rebuild file).

Config (written by `sudo posinext-cms-setup`), /etc/posinext-cms/config.json, mode 640 root:posinext-cms:
  {"username": "...", "password_hash": "scrypt$...", "github_token": "github_pat_...",
   "repo": "souvik992/saas-portal", "branch": "main"}
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CONFIG = os.environ.get("CMS_CONFIG", "/etc/posinext-cms/config.json")
STATE = os.environ.get("CMS_STATE", "/var/lib/posinext-cms")
GITHUB_API = os.environ.get("CMS_GITHUB_API", "https://api.github.com")
LISTEN = os.environ.get("CMS_LISTEN", "127.0.0.1:8787")
COOKIE = "pnx_cms"
SESSION_SECONDS = 12 * 3600
POSTS_DIR = "content/posts"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_BODY = 1_500_000
FAIL_LIMIT, FAIL_WINDOW = 5, 15 * 60  # 5 wrong logins per IP per 15 minutes

_fails = {}
_fails_lock = threading.Lock()
_cache = {}  # path -> (blob sha, parsed post)
_cache_lock = threading.Lock()
_write_lock = threading.Lock()


# ---------- config, passwords, sessions ----------
def load_config():
    try:
        with open(CONFIG, encoding="utf-8") as f:
            cfg = json.load(f)
    except FileNotFoundError:
        return None
    if not all(cfg.get(k) for k in ("username", "password_hash", "github_token")):
        return None
    cfg.setdefault("repo", "souvik992/saas-portal")
    cfg.setdefault("branch", "main")
    return cfg


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return "scrypt$16384$8$1$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(dk).decode()


def check_password(password, stored):
    try:
        algo, n, r, p, salt, dk = stored.split("$")
        if algo != "scrypt":
            return False
        got = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p),
                             dklen=len(base64.b64decode(dk)))
        return hmac.compare_digest(got, base64.b64decode(dk))
    except Exception:
        return False


def secret_key():
    path = os.path.join(STATE, "session.key")
    try:
        with open(path, "rb") as f:
            key = f.read()
        if len(key) >= 32:
            return key
    except FileNotFoundError:
        pass
    key = secrets.token_bytes(32)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(key)
    return key


def make_session(username, cfg):
    exp = int(time.time()) + SESSION_SECONDS
    # binding to the password hash signs everyone out when the password changes
    payload = f"{username}|{exp}|{hashlib.sha256(cfg['password_hash'].encode()).hexdigest()[:16]}"
    sig = hmac.new(secret_key(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(payload.encode()).decode() + "." + sig


def read_session(value, cfg):
    try:
        b64, sig = value.split(".", 1)
        payload = base64.urlsafe_b64decode(b64.encode()).decode()
        good = hmac.new(secret_key(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, good):
            return None
        user, exp, pw = payload.split("|")
        if int(exp) < time.time() or user != cfg["username"]:
            return None
        if pw != hashlib.sha256(cfg["password_hash"].encode()).hexdigest()[:16]:
            return None
        return user
    except Exception:
        return None


def too_many_failures(ip):
    now = time.time()
    with _fails_lock:
        recent = [t for t in _fails.get(ip, []) if now - t < FAIL_WINDOW]
        _fails[ip] = recent
        return len(recent) >= FAIL_LIMIT


def record_failure(ip):
    with _fails_lock:
        _fails.setdefault(ip, []).append(time.time())


# ---------- GitHub ----------
class GitHubError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def github(cfg, method, path, body=None):
    url = f"{GITHUB_API}/repos/{cfg['repo']}/contents/{path}"
    if method == "GET":
        url += f"?ref={cfg['branch']}"
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", "Bearer " + cfg["github_token"])
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "posinext-cms")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("message", "")
        except Exception:
            msg = ""
        raise GitHubError(e.code, msg or f"GitHub returned {e.code}")
    except urllib.error.URLError as e:
        raise GitHubError(502, f"Could not reach GitHub: {e.reason}")


def list_posts(cfg):
    try:
        files = github(cfg, "GET", POSTS_DIR)
    except GitHubError as e:
        if e.status == 404:
            return []
        raise
    out, live = [], set()
    for f in files:
        if f.get("type") != "file" or not f["name"].endswith(".json"):
            continue
        path, sha = f["path"], f["sha"]
        live.add(path)
        with _cache_lock:
            hit = _cache.get(path)
        if hit and hit[0] == sha:
            data = hit[1]
        else:
            try:
                d = github(cfg, "GET", path)
                data = json.loads(base64.b64decode(d["content"]).decode("utf-8"))
            except Exception:
                continue
            with _cache_lock:
                _cache[path] = (sha, data)
        out.append({"slug": f["name"][:-5], "sha": sha, "data": data})
    with _cache_lock:
        for p in list(_cache):
            if p not in live:
                del _cache[p]
    out.sort(key=lambda p: str(p["data"].get("updated_at") or p["data"].get("publish_on") or ""), reverse=True)
    return out


def validate_post(slug, d):
    if not SLUG_RE.fullmatch(slug) or len(slug) > 90:
        return "Slug must use lowercase letters, numbers and hyphens."
    if not isinstance(d, dict):
        return "Invalid post."
    if d.get("status") not in ("draft", "published", "scheduled"):
        return "Status must be draft, published or scheduled."
    if not str(d.get("title", "")).strip() or len(str(d["title"])) > 110:
        return "Add a title (up to 110 characters)."
    desc = str(d.get("description", "")).strip()
    if not desc or len(desc) > 170:
        return "Add a meta description (up to 170 characters)."
    if len(re.sub(r"<[^>]*>", "", str(d.get("body_html", ""))).strip()) < 500:
        return "The article body needs at least 500 characters of text."
    for k in ("publish_on", "published_on", "updated_on"):
        v = d.get(k)
        if v and not (isinstance(v, str) and DATE_RE.fullmatch(v)):
            return f"{k} must be YYYY-MM-DD."
        if v:
            try:
                date.fromisoformat(v)
            except ValueError:
                return f"{k} is not a real date."
    faqs = d.get("faqs", [])
    if not isinstance(faqs, list) or not all(isinstance(x, dict) and x.get("question") and x.get("answer") for x in faqs):
        return "Each FAQ needs a question and an answer."
    return None


def trigger_rebuild():
    try:
        with open(os.path.join(STATE, "rebuild"), "w") as f:
            f.write(str(time.time()))
    except OSError as e:
        print("could not trigger rebuild:", e, file=sys.stderr)


# ---------- HTTP ----------
class Handler(BaseHTTPRequestHandler):
    server_version = "posinext-cms"
    sys_version = ""

    def log_message(self, fmt, *args):  # one line per request, no bodies or cookies
        sys.stderr.write("%s %s\n" % (self.client_ip(), fmt % args))

    def client_ip(self):
        # only Caddy on localhost talks to us; it sets X-Forwarded-For to the real client
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def send(self, status, obj=None, cookie=None):
        body = json.dumps(obj if obj is not None else {}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ValueError("Request too large.")
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON.")

    def cookie(self):
        for part in (self.headers.get("Cookie") or "").split(";"):
            k, _, v = part.strip().partition("=")
            if k == COOKIE:
                return v
        return ""

    def route(self, method):
        path = self.path.split("?", 1)[0]
        if not path.startswith("/admin/api/"):
            return self.send(404, {"error": "Not found."})
        path = path[len("/admin/api/"):]
        cfg = load_config()
        if cfg is None:
            return self.send(503, {"error": "The CMS is not set up yet. On the server run: sudo posinext-cms-setup"})
        if method != "GET":
            # CSRF guard on top of the SameSite=Strict cookie: browsers cannot send this header cross-site without CORS
            if self.headers.get("X-CMS") != "1" or "application/json" not in (self.headers.get("Content-Type") or ""):
                return self.send(403, {"error": "Forbidden."})
        try:
            if path == "login" and method == "POST":
                return self.login(cfg)
            if path == "logout" and method == "POST":
                return self.send(200, {"ok": True}, cookie=self.clear_cookie())
            user = read_session(self.cookie(), cfg)
            if not user:
                return self.send(401, {"error": "Please sign in."})
            if path == "me" and method == "GET":
                return self.send(200, {"username": user})
            if path == "posts" and method == "GET":
                return self.send(200, {"posts": list_posts(cfg)})
            m = re.fullmatch(r"posts/([a-z0-9-]{1,90})", path)
            if m and method == "PUT":
                return self.save(cfg, user, m.group(1))
            if m and method == "DELETE":
                return self.delete(cfg, m.group(1))
            return self.send(404, {"error": "Not found."})
        except ValueError as e:
            return self.send(400, {"error": str(e)})
        except GitHubError as e:
            status = 409 if e.status in (409, 422) else 502
            if e.status in (401, 403):
                msg = "GitHub refused the server's token (expired or missing Contents: Read and write). Run sudo posinext-cms-setup on the server with a new token."
            elif status == 409:
                msg = "This post changed since you opened it. Click Refresh and try again."
            else:
                msg = str(e)
            return self.send(status, {"error": msg})

    def clear_cookie(self):
        return f"{COOKIE}=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict"

    def login(self, cfg):
        ip = self.client_ip()
        if too_many_failures(ip):
            return self.send(429, {"error": "Too many attempts. Try again in 15 minutes."})
        d = self.body()
        user, pw = str(d.get("username", "")), str(d.get("password", ""))
        ok_user = hmac.compare_digest(user.encode(), cfg["username"].encode())
        ok_pw = check_password(pw, cfg["password_hash"])  # always run, so timing does not reveal the username
        if not (ok_user and ok_pw):
            record_failure(ip)
            time.sleep(0.5)
            return self.send(401, {"error": "Wrong username or password."})
        token = make_session(cfg["username"], cfg)
        cookie = f"{COOKIE}={token}; Path=/admin; Max-Age={SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict"
        return self.send(200, {"username": cfg["username"]}, cookie=cookie)

    def save(self, cfg, user, slug):
        d = self.body()
        post, sha = d.get("post"), d.get("sha") or None
        err = validate_post(slug, post)
        if err:
            raise ValueError(err)
        post["slug"] = slug
        post["author"] = "POSINEXT"
        post["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        verb = {"published": "Publish", "scheduled": "Schedule"}.get(post["status"], "Save draft")
        content = base64.b64encode((json.dumps(post, ensure_ascii=False, indent=2) + "\n").encode()).decode()
        body = {"message": f"{verb}: {post['title']} (via /admin by {user})", "content": content, "branch": cfg["branch"]}
        if sha:
            body["sha"] = sha
        with _write_lock:
            res = github(cfg, "PUT", f"{POSTS_DIR}/{slug}.json", body)
        with _cache_lock:
            _cache[f"{POSTS_DIR}/{slug}.json"] = (res["content"]["sha"], post)
        if post["status"] != "draft":
            trigger_rebuild()
        return self.send(200, {"sha": res["content"]["sha"], "commit": res["commit"]["sha"], "post": post})

    def delete(self, cfg, slug):
        d = self.body()
        sha = d.get("sha")
        if not sha:
            raise ValueError("Missing sha.")
        with _write_lock:
            github(cfg, "DELETE", f"{POSTS_DIR}/{slug}.json",
                   {"message": f"Delete blog post {slug} (via /admin)", "sha": sha, "branch": cfg["branch"]})
        with _cache_lock:
            _cache.pop(f"{POSTS_DIR}/{slug}.json", None)
        trigger_rebuild()
        return self.send(200, {"ok": True})

    def do_GET(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")

    def do_PUT(self):
        self.route("PUT")

    def do_DELETE(self):
        self.route("DELETE")


def main():
    os.makedirs(STATE, exist_ok=True)
    host, port = LISTEN.rsplit(":", 1)
    srv = ThreadingHTTPServer((host, int(port)), Handler)
    srv.daemon_threads = True
    print(f"posinext-cms listening on {LISTEN}", file=sys.stderr)
    srv.serve_forever()


if __name__ == "__main__":
    main()

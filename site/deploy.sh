#!/bin/bash
# Builds and serves the posinext.com website (souvik992/saas-portal, site/) on this server with Caddy.
# Run once as root; after that a systemd timer keeps the site up to date by itself:
#   curl -fsSL https://raw.githubusercontent.com/souvik992/saas-portal/main/site/deploy.sh | sudo bash
#   (another branch: ... | sudo bash -s <branch>)
# Each run downloads the repo at the branch's latest commit, runs site/src/build.py here with the server's python3 (so
# /admin/ and CMS posts from content/posts/ are always included; nothing is installed with apt),
# and serves site/public from /var/www/posinext-site.
# The timer (posinext-site-update.timer) checks every 10 minutes and rebuilds when the branch has a new commit (e.g. a
# post saved in /admin/) or the India date has changed (scheduled posts go live). Force a rebuild now:
#   sudo posinext-site-update --force
# It also installs the blog CMS backend (site/cms/, service posinext-cms) behind /admin/api/. Set its admin login
# and GitHub token once with: sudo posinext-cms-setup
# Its Caddy sites (posinext.com, and www.posinext.com redirecting to it) are in /etc/caddy/posinext-site.caddy, which the
# Caddyfile only imports, so the other hubs' sites on this server are never rewritten. If Caddy does not accept the
# result, everything is put back as it was. If another hub's script rewrites the Caddyfile later (e.g.
# tiffin-hub-domain), run this again to put the import line back.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo "Run it with sudo." >&2; exit 1; fi
REF="${1:-main}"
REPO=souvik992/saas-portal
DIR=/var/www/posinext-site
CF=/etc/caddy/Caddyfile
OURS=/etc/caddy/posinext-site.caddy
STATE=/var/lib/posinext-site
VENV=$STATE/venv
command -v caddy >/dev/null || { echo "Caddy is not installed on this server." >&2; exit 1; }
mkdir -p "$STATE"

# ---- Python for the build: the server's own python3 is enough ----
# The images and fonts in site/public are committed, so the build only needs the standard library. Pillow/fontTools
# are needed only if an image or font changed without its built file being committed; then they are tried from PyPI
# in a private venv (never apt), and the deploy stops with a clear message if that is not possible.
command -v python3 >/dev/null || { echo "python3 is not installed on this server." >&2; exit 1; }
PY=python3
if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c 'import PIL, fontTools' </dev/null >/dev/null 2>&1; then PY="$VENV/bin/python"; fi

# ---- download the exact commit and build it ----
SHA=$(curl -fsSL -H "Accept: application/vnd.github.sha" "https://api.github.com/repos/$REPO/commits/$REF") \
  || { echo "Could not find $REF in $REPO." >&2; exit 1; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
echo "Downloading the site ($REPO, $REF = ${SHA:0:7})"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$SHA" | tar -xz -C "$tmp"
root=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -1)
[ -f "$root/site/src/build.py" ] || { echo "No site/src/build.py in $REPO@$REF." >&2; exit 1; }
echo "Building the site"
if ! "$PY" "$root/site/src/build.py" </dev/null 2>"$tmp/build.log"; then
  if grep -q "No module named '\(PIL\|fontTools\|brotli\)'" "$tmp/build.log"; then
    echo "An image or font changed, so the build needs Pillow/fontTools; installing them from PyPI"
    { [ -x "$VENV/bin/pip" ] || python3 -m venv "$VENV" </dev/null; } \
      && "$VENV/bin/pip" install -q --disable-pip-version-check pillow fonttools brotli </dev/null \
      || { echo "Could not install them here. Run python site/src/build.py on your PC, commit site/public, and run this again." >&2; exit 1; }
    PY="$VENV/bin/python"
    "$PY" "$root/site/src/build.py" </dev/null
  else
    cat "$tmp/build.log" >&2; exit 1
  fi
fi
cat "$tmp/build.log"
src="$root/site/public"
[ -f "$src/index.html" ] && [ -f "$src/admin/index.html" ] || { echo "The build did not produce index.html and admin/." >&2; exit 1; }

mkdir -p /var/www
rm -rf "$DIR.new"
cp -r "$src" "$DIR.new"
chmod -R a+rX "$DIR.new"

# ---- blog CMS backend: admin login on this server, GitHub token kept here (site/cms/) ----
id posinext-cms >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin posinext-cms </dev/null
install -d -m 755 /opt/posinext-cms
install -m 644 "$root/site/cms/cms_server.py" /opt/posinext-cms/cms_server.py
install -m 755 "$root/site/cms/posinext-cms-setup" /usr/local/sbin/posinext-cms-setup
install -d -m 750 -o root -g posinext-cms /etc/posinext-cms
install -d -m 750 -o posinext-cms -g posinext-cms /var/lib/posinext-cms
cat > /etc/systemd/system/posinext-cms.service <<'EOF'
[Unit]
Description=POSINEXT blog CMS backend (/admin/api)
After=network-online.target
Wants=network-online.target

[Service]
User=posinext-cms
Group=posinext-cms
ExecStart=/usr/bin/python3 -I /opt/posinext-cms/cms_server.py
Restart=always
RestartSec=2
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictSUIDSGID=yes
LockPersonality=yes
ReadWritePaths=/var/lib/posinext-cms

[Install]
WantedBy=multi-user.target
EOF
# a CMS publish writes /var/lib/posinext-cms/rebuild; this rebuilds the site right away instead of waiting for the timer
cat > /etc/systemd/system/posinext-site-rebuild.path <<'EOF'
[Unit]
Description=Rebuild posinext.com when the CMS publishes

[Path]
PathModified=/var/lib/posinext-cms/rebuild
Unit=posinext-site-update.service

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload </dev/null
systemctl enable posinext-cms.service posinext-site-rebuild.path </dev/null >/dev/null 2>&1 || true
systemctl restart posinext-cms.service </dev/null
systemctl start posinext-site-rebuild.path </dev/null || true

touch "$CF"
cp -p "$CF" "$tmp/Caddyfile.bak"
if [ -f "$OURS" ]; then cp -p "$OURS" "$tmp/ours.bak"; fi
cat > "$OURS" <<EOF
# posinext.com website (saas-portal site/deploy.sh). Imported by the Caddyfile.
posinext.com {
  root * $DIR
  encode zstd gzip
  header X-Content-Type-Options nosniff
  header Referrer-Policy strict-origin-when-cross-origin
  # browsers use https only for this site for a year (no downgrade to http, no cookie sent in the clear)
  header Strict-Transport-Security "max-age=31536000"
  # never inside another site's frame (clickjacking); no camera, microphone, location or payment APIs
  header X-Frame-Options DENY
  header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  header Cross-Origin-Opener-Policy same-origin
  header -Server
  # the pages: scripts only from this site (no inline script can run, so injected code cannot either); the Book a
  # Demo form posts to the portal's /v1/demo-requests
  @site not path /admin /admin/*
  header @site Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://portal.posinext.com; form-action 'self' https://portal.posinext.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests"
  # the CMS: never cached, never indexed, never framed; its page has its own inline script
  @admin path /admin /admin/*
  header @admin Cache-Control "no-store"
  header @admin X-Robots-Tag "noindex, nofollow"
  header @admin Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
  # CMS backend (site/cms/cms_server.py): admin login, GitHub commits
  handle /admin/api/* {
    request_body {
      max_size 2MB
    }
    reverse_proxy 127.0.0.1:8787
  }
  handle {
    @fonts path /fonts/*
    header @fonts Cache-Control "public, max-age=31536000, immutable"
    # pages link scripts and pictures with ?v=<hash of the file>: a change gets a new URL, so these never go stale
    @versioned {
      path /js/* /img/*
      query v=*
    }
    header @versioned Cache-Control "public, max-age=31536000, immutable"
    @img {
      path /img/* /favicon.svg
      not query v=*
    }
    header @img Cache-Control "public, max-age=2592000"
    @pages {
      not path /fonts/* /img/* /favicon.svg /admin /admin/*
      not {
        path /js/*
        query v=*
      }
    }
    header @pages Cache-Control "public, max-age=600"
    # old Lovable script and style files are gone: no page needs them
    @lovable path /assets/*
    respond @lovable 410
    try_files {path} {path}/index.html
    file_server
  }
  # unknown addresses answer 404 with the site's 404 page (not the home page), so search engines see a real 404
  handle_errors {
    @404 expression "{err.status_code} == 404"
    rewrite @404 /404.html
    file_server
  }
}
www.posinext.com {
  redir https://posinext.com{uri} permanent
}
EOF
grep -qxF "import $OURS" "$CF" || printf '\n# posinext.com website (saas-portal site/deploy.sh)\nimport %s\n' "$OURS" >> "$CF"

rm -rf "$DIR.old"
if [ -d "$DIR" ]; then mv "$DIR" "$DIR.old"; fi
mv "$DIR.new" "$DIR"

if ! caddy validate --adapter caddyfile --config "$CF" >"$tmp/validate.log" 2>&1; then
  cp -p "$tmp/Caddyfile.bak" "$CF"
  if [ -f "$tmp/ours.bak" ]; then cp -p "$tmp/ours.bak" "$OURS"; else rm -f "$OURS"; fi
  rm -rf "$DIR"
  if [ -d "$DIR.old" ]; then mv "$DIR.old" "$DIR"; fi
  echo "Caddy did not accept the new configuration; everything was put back as it was." >&2
  tail -5 "$tmp/validate.log" >&2
  exit 1
fi
systemctl reload caddy </dev/null || systemctl restart caddy </dev/null
echo "$REF $SHA $(TZ=Asia/Kolkata date +%F)" > "$STATE/deployed"

# ---- auto-update: rebuild on a new commit or a new India date ----
cat > /usr/local/sbin/posinext-site-update <<'EOF'
#!/bin/bash
# Rebuilds posinext.com when its branch has a new commit or the India date changed (installed by site/deploy.sh).
set -euo pipefail
REPO=souvik992/saas-portal
STATE=/var/lib/posinext-site
read -r REF OLD_SHA OLD_DAY < "$STATE/deployed" 2>/dev/null || { REF=main; OLD_SHA=; OLD_DAY=; }
SHA=$(curl -fsSL -H "Accept: application/vnd.github.sha" "https://api.github.com/repos/$REPO/commits/$REF")
DAY=$(TZ=Asia/Kolkata date +%F)
if [ "${1:-}" != "--force" ] && [ "$SHA" = "$OLD_SHA" ] && [ "$DAY" = "$OLD_DAY" ]; then exit 0; fi
curl -fsSL "https://raw.githubusercontent.com/$REPO/$SHA/site/deploy.sh" | bash -s "$REF"
EOF
chmod 755 /usr/local/sbin/posinext-site-update
cat > /etc/systemd/system/posinext-site-update.service <<'EOF'
[Unit]
Description=Rebuild posinext.com when the repo or the date changes
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/posinext-site-update
EOF
cat > /etc/systemd/system/posinext-site-update.timer <<'EOF'
[Unit]
Description=Check posinext.com for updates every 10 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload </dev/null
systemctl enable --now posinext-site-update.timer </dev/null >/dev/null 2>&1 || true

echo "posinext.com is served from $DIR ($(find "$DIR" -type f | wc -l) files), built from ${SHA:0:7}."
echo "Admin: https://posinext.com/admin/  ·  auto-update: systemctl list-timers posinext-site-update.timer"
if [ ! -s /etc/posinext-cms/config.json ]; then
  echo
  echo "One more step for the blog admin: set its login and GitHub token with"
  echo "  sudo posinext-cms-setup"
fi
echo "The first visit can take a minute while the HTTPS certificate is made."

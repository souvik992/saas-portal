#!/bin/bash
# Serves the posinext.com website (site/public in souvik992/saas-portal, a static site) from this server with Caddy.
# Run as root, again after each change to the site:
#   curl -fsSL https://raw.githubusercontent.com/souvik992/saas-portal/main/site/deploy.sh | sudo bash
#   (another branch: ... | sudo bash -s <branch>)
# The site goes to /var/www/posinext-site; its Caddy sites (posinext.com, and www.posinext.com redirecting to it) are in
# /etc/caddy/posinext-site.caddy, which the Caddyfile only imports, so the other hubs' sites on this server are never
# rewritten. If Caddy does not accept the result, everything is put back as it was. If another hub's script rewrites
# the Caddyfile later (e.g. tiffin-hub-domain), run this again to put the import line back.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo "Run it with sudo." >&2; exit 1; fi
REF="${1:-main}"
REPO=souvik992/saas-portal
DIR=/var/www/posinext-site
CF=/etc/caddy/Caddyfile
OURS=/etc/caddy/posinext-site.caddy
command -v caddy >/dev/null || { echo "Caddy is not installed on this server." >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
echo "Downloading the site ($REPO, $REF)"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" | tar -xz -C "$tmp"
src=$(find "$tmp" -mindepth 3 -maxdepth 3 -type d -path '*/site/public' | head -1)
[ -n "$src" ] && [ -f "$src/index.html" ] || { echo "No site/public/index.html in $REPO@$REF." >&2; exit 1; }

mkdir -p /var/www
rm -rf "$DIR.new"
cp -r "$src" "$DIR.new"
chmod -R a+rX "$DIR.new"

touch "$CF"
cp -p "$CF" "$tmp/Caddyfile.bak"
if [ -f "$OURS" ]; then cp -p "$OURS" "$tmp/ours.bak"; fi
cat > "$OURS" <<EOF
# posinext.com website (saas-portal site/deploy.sh). Imported by the Caddyfile.
posinext.com {
  root * $DIR
  encode zstd gzip
  @fonts path /fonts/*
  header @fonts Cache-Control "public, max-age=31536000, immutable"
  @img path /img/* /favicon.svg
  header @img Cache-Control "public, max-age=2592000"
  @pages not path /fonts/* /img/* /favicon.svg
  header @pages Cache-Control "public, max-age=600"
  header X-Content-Type-Options nosniff
  header Referrer-Policy strict-origin-when-cross-origin
  # old Lovable script and style files are gone: no page needs them
  @lovable path /assets/*
  respond @lovable 410
  try_files {path} {path}/index.html
  file_server
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
systemctl reload caddy || systemctl restart caddy
echo "posinext.com is served from $DIR ($(find "$DIR" -type f | wc -l) files)."
echo "The first visit can take a minute while the HTTPS certificate is made."

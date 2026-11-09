# posinext.com website

A copy of the posinext.com site (built in Lovable), as plain static files in `public/`: the home page, privacy, terms and
security pages, their scripts, styles and images. Lovable's hosting scripts are left out; the one image Lovable stored
itself is in `public/assets/lovable/`, and the share-preview image is `public/assets/og-image.png`.

## Put it on the server

On the DinePOS Cloud server (it runs Caddy), after DNS for `posinext.com` and `www.posinext.com` points at it:

```bash
curl -fsSL https://raw.githubusercontent.com/souvik992/saas-portal/main/site/deploy.sh | sudo bash
```

Run it again after changing the site. `www.posinext.com` redirects to `posinext.com`. HTTPS certificates are made and
renewed by Caddy (Let's Encrypt). The script never rewrites the other hubs' Caddy sites and undoes everything if Caddy
does not accept the result.

## Change the site

Edit in Lovable and copy the new build here (replace `public/`), or edit the files here directly; then run the
command above on the server.

## Changes made here (not in Lovable)

If you copy a new Lovable build into `public/`, these need doing again:

- **Sign in** (header and phone menu) opens `https://portal.posinext.com/login`; **Start your free trial** opens `https://portal.posinext.com/register`.
- **Book a Demo** posts to `https://portal.posinext.com/v1/demo-requests` (DinePOS Cloud), which emails the request to the
  address set on the server (`HUB_DEMO_REQUEST_TO`). No private email address is anywhere in this site.
- The only email address shown is `support@posinext.com` (policy pages, footer, footer Contact link).
- Phone layout: rules at the end of `assets/styles-*.css` (`pn-cta`, `pn-products`, `pn-footer`, `pn-flink`).
- Edited scripts and styles carry a `p<n>` suffix (bump it on each edit) so browsers do not keep the old copies (assets are cached for a year).
- `llms.txt` and `.well-known/ard.json` describe the site for AI agents.

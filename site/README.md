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

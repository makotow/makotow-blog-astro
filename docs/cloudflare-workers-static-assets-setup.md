# Cloudflare Workers Static Assets Setup

Use this checklist after pushing `makotow/makotow-blog-astro` to GitHub.

## Project

- Cloudflare project name: `makotow-blog-astro`
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Node.js version: `26`

The repository pins Node.js with `.node-version`, and `wrangler.jsonc` configures static assets:

- `assets.directory`: `./dist`
- `assets.not_found_handling`: `404-page`

This project is deployed as a static Astro site. Do not add the `@astrojs/cloudflare` adapter unless the site is intentionally changed to use Astro on-demand rendering or Cloudflare runtime bindings.

The deploy script runs `wrangler deploy --no-autoconfig` to prevent Wrangler from trying to run `astro add cloudflare`.

## Connect Repository

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create an application using the Git repository flow.
4. Select `makotow/makotow-blog-astro`.
5. Use the build and deploy commands above.
6. Run the first deployment.

## First Deployment Checks

- `/` returns 200.
- `/rss.xml` returns 200.
- `/sitemap-index.xml` returns 200.
- A representative article URL such as `/2021/09/12/proxmox-introduction/` returns 200.
- `/index.xml` redirects to `/rss.xml`.
- A legacy `/post/YYYY/MM/DD/:slug/` URL redirects to the matching canonical article URL.
- Article pages with `ogImage` render the image under the title.

## Troubleshooting

### Astro tries to install `@astrojs/cloudflare`

The static site deployment does not need the Astro Cloudflare adapter.

Use:

- Build command: `npm run build`
- Deploy command: `npm run deploy`

Do not use:

- `npm run astro add cloudflare`
- `npx astro add cloudflare`
- `npx wrangler deploy` without `--no-autoconfig`

### The setup UI has no output directory field

That is expected for Workers Builds. The output directory is configured in `wrangler.jsonc` instead:

```jsonc
"assets": {
  "directory": "./dist"
}
```

## PR Preview Checks

After the first deployment succeeds:

1. Create a small test branch.
2. Open a pull request.
3. Confirm GitHub Actions CI passes.
4. Confirm Cloudflare creates a preview deployment URL.
5. Confirm the preview URL passes the first deployment checks for at least one representative article.

## Production Custom Domain

Do this only after preview checks pass.

- Add custom domain: `blog.makotow.net`
- Confirm DNS records Cloudflare asks for.
- Confirm the production deployment serves the custom domain.
- Re-check old URLs and RSS after the custom domain is active.

# Cloudflare Pages Setup

Use this checklist after pushing `makotow/makotow-blog-astro` to GitHub.

## Project

- Cloudflare Pages project name: `makotow-blog-astro`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `26`

The repository pins Node.js with `.node-version`, so Cloudflare Pages should use Node 26 when the build image honors version files.

## Connect Repository

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create a Pages project.
4. Connect to Git.
5. Select `makotow/makotow-blog-astro`.
6. Use the build settings above.
7. Run the first deployment.

## First Deployment Checks

- `/` returns 200.
- `/rss.xml` returns 200.
- `/sitemap-index.xml` returns 200.
- A representative article URL such as `/2021/09/12/proxmox-introduction/` returns 200.
- `/index.xml` redirects to `/rss.xml`.
- A legacy `/post/YYYY/MM/DD/:slug/` URL redirects to the matching canonical article URL.
- Article pages with `ogImage` render the image under the title.

## PR Preview Checks

After the first deployment succeeds:

1. Create a small test branch.
2. Open a pull request.
3. Confirm GitHub Actions CI passes.
4. Confirm Cloudflare Pages creates a preview URL.
5. Confirm the preview URL passes the first deployment checks for at least one representative article.

## Production Custom Domain

Do this only after preview checks pass.

- Add custom domain: `blog.makotow.net`
- Confirm DNS records Cloudflare asks for.
- Confirm the production deployment serves the custom domain.
- Re-check old URLs and RSS after the custom domain is active.

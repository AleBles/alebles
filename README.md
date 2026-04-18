# alebles.com source

Source for the static site at **[ale.bles.nu](https://ale.bles.nu)**. The GitHub profile README lives on `main`; this `site` branch holds the build pipeline and content.

## Branches

| Branch | What's there |
|--------|--------------|
| `main` | Profile README only |
| `site` | Source (this branch) |
| `gh-pages` | Built output, deployed by CI |

## Local dev

```bash
bun install
bun run preview   # build, serve dist/ at http://localhost:3000, rebuild on src/ changes
bun run build     # one-shot build
```

## Authoring

- **Projects**: edit `src/content/projects.json`.
- **Blog posts**: add markdown files under `src/content/posts/` with frontmatter:
  ```yaml
  ---
  title: "..."
  date: 2026-04-18
  excerpt: "One-paragraph teaser shown on the blog index."
  linkedinUrl: https://www.linkedin.com/posts/...   # optional; when present, adds "Read on LinkedIn" link
  ---
  ```

## Deploy

Push to `site` → GitHub Actions builds with Bun and publishes `dist/` to `gh-pages`. Custom domain (`ale.bles.nu`) is re-asserted via the workflow's `cname` input.

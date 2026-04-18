# Changelog

All notable changes to the site source will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-18

### Added
- `tsconfig.json` targeting `ESNext` so editors recognise top-level `await` in build scripts.
- `@types/bun` dev dependency for IDE type support on `Bun.*` APIs.

### Changed
- Replaced the "Azerion Ads SDK" project with "ImproveDigital App SDK" in `src/content/projects.json`, pointing at `https://docs.app.improvedigital.com/`.

## [0.1.0] - 2026-04-18

### Added
- Initial site scaffolding on the `site` branch:
  - `src/templates/layout.html` derived from the single-file `index.html` (Nokia Snake + profile card), with `<!--TITLE-->` / `<!--CONTENT-->` slots and rewritten nav (`/`, `/projects/`, `/blog/`).
  - Page partials under `src/pages/` for home, projects, blog index, and individual posts.
  - Seed content: `src/content/projects.json` and a sample markdown post under `src/content/posts/`.
  - Bun build pipeline (`scripts/build.ts`) rendering `dist/index.html`, `dist/projects/index.html`, `dist/blog/index.html`, and `dist/blog/<slug>/index.html`; copies `CNAME` into `dist/`.
  - Local preview server (`scripts/serve.ts`).
  - GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds on push to `site` and publishes `dist/` to `gh-pages` via `peaceiris/actions-gh-pages`, re-asserting `ale.bles.nu` as the custom domain.
  - `package.json` scripts: `build`, `preview`, `dev`. Runtime deps: `marked`, `gray-matter`.
- Site-specific `README.md` on the `site` branch.

### Removed
- `CNAME` and the legacy Jekyll `.gitignore` from `main` — `main` now holds only the profile `README.md`. The custom domain is re-emitted into `dist/` by the build so it lands on `gh-pages`.

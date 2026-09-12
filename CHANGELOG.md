# Changelog

All notable changes to the site source will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-09-12

Synthwave redesign with terminal accents.

### Added
- Static assets in `src/assets/` (stylesheet, Snake script, favicon, project images), copied to `dist/assets/` by the build.
- Design tokens as CSS custom properties. The Snake canvas reads its colours from them.
- Pure CSS synthwave backdrop: horizon, sun, scrolling perspective grid, scanlines.
- Top nav with active page state, set at build time.
- Meta description, Open Graph tags, canonical URL, theme colour, and favicon on every page.
- Skip link, focus ring, and reduced-motion support (no animations, Snake shows a still frame).
- Snake pauses while the tab is hidden.
- Footer with social and source links.
- Projects: skald and Workspace OSD Flash.
- Project cards support `site` and `github` links with icons, and an optional header image.

### Changed
- Single centred column instead of header plus sidebar: top bar, hero window with profile and Snake, content panel, footer.
- Dark palette throughout: cyan, magenta, purple, amber on deep navy. Snake recoloured to match.
- Section headings render as `> heading` prompts.
- Projects page uses a two-column grid, one column on small screens.
- System monospace font stack instead of Courier New.
- `renderLayout` takes `{ title, description, path, page }`; `inject` fills every occurrence of a slot.
- Home page copy no longer mentions the Nokia Snake.
- README: preview port fixed, `tags` documented, styling section added.

### Removed
- Inline CSS and JS from the layout.
- Sidebar, fake repo and follower stats, nav icons, Nokia LCD and CRT header styling, "Website" self link.

## [0.4.0] - 2026-04-19

### Added
- `/homelab/` page with a sticky intro block (local-first framing + stack summary) and a tag-filtered post list below.
- Homelab nav button in the menu (octicons server icon).
- Optional `tags` array in post frontmatter. Posts with `tags: [homelab]` surface on the homelab page, newest first.
- `.sticky-intro`, `.muted`, and `.empty` CSS helpers on the layout for the new page.
- Umami analytics tracker (`cloud.umami.is`) in the layout `<head>`, loaded with `defer` on every built page.
- Skills section on the home page with six grouped cards (Languages, Game dev, Mobile & SDKs, Platform & ops, Soft & mgmt, Interests). Content informed by GitLab language distribution and LinkedIn profile; no internal project names exposed.
- `.skills` / `.skill-group` CSS for the new section (auto-fit grid, same card treatment as project cards). Lists render with visible accent-coloured bullets.
- `src/content/skills.json` as the single source of truth for skill groups. Home page renders from this JSON via a `<!--SKILLS-->` slot in `src/pages/home.html`.
- `scripts/render-readme.ts`: renders a profile README markdown from `skills.json` plus a short intro. Prints to stdout or a given path.
- `.github/workflows/sync-readme.yml`: on every push to `site`, regenerates the profile README and commits it to `main` if it changed. Uses the default `GITHUB_TOKEN`; skips commits when there's no diff.

### Changed
- Post-card rendering factored into `renderPostCard` / `renderPostCards(list, emptyMsg)` in `scripts/build.ts` so blog index and homelab share identical markup. Empty lists render a `.empty` message instead of nothing.

## [0.3.0] - 2026-04-18

### Added
- `scripts/watch.ts`: initial build, static server, and `src/` file watcher with debounced rebuild, all in one process. `bun run preview` now runs the full dev loop.
- Blog post on the ECR pull-through cache `library/` prefix gotcha, linking out to the LinkedIn original.
- Terminal-styled header: green phosphor prompt (`> ale bles_`) with a blinking cursor, scan lines, text glow, and a CRT-style vignette.
- Nokia LCD screen filter on the Snake canvas: pixel grid, viewing-angle sheen, corner vignette, plus a subtle `contrast`/`saturate` pass on the canvas itself.
- Location (`Amsterdam / Almere`) now links to Google Maps; company (`@azerion`) now links to `azerion.com`. Both use the existing grey-to-accent hover.

### Changed
- `linkedinUrl` is now optional in post frontmatter. Posts *with* a LinkedIn URL skip the local post page entirely and link directly from the blog index card (title + "Read on LinkedIn"). Posts *without* one continue to render at `/blog/<slug>/` and the card links internally. `src/pages/post.html` dropped its unused `<!--POST_LINKEDIN-->` slot.
- Menu ordering: nav buttons (Home/Projects/Blog) moved above the social links. The `border-top` on `.nav-buttons` became a `border-bottom` to match the new position.
- Hello-world post lost its `linkedinUrl` (the site launch announcement lives in-repo, not on LinkedIn) and its title no longer uses an em-dash.
- README frontmatter example notes `linkedinUrl` as optional.

### Removed
- `dev` script from `package.json`: `preview` now does everything `dev` did and also serves the built output.
- Twitter/X icon from the social links.
- Hover arrow (`▸`) on menu links and the associated `padding-left: 30px` hover shift (it was also nudging the profile icons sideways on hover). Dead `.menu ul` / `.menu li` rules cleaned up at the same time.
- All em-dashes from site-authored prose (README, CHANGELOG, page partials, posts, build-script page titles) as a project-wide preference.

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
- `CNAME` and the legacy Jekyll `.gitignore` from `main`; `main` now holds only the profile `README.md`. The custom domain is re-emitted into `dist/` by the build so it lands on `gh-pages`.

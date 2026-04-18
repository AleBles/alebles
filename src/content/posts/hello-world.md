---
title: "Hello world — new personal site is live"
date: 2026-04-18
linkedinUrl: https://www.linkedin.com/in/alebles/
excerpt: "Spun up a static site at ale.bles.nu with a bare Bun build and GitHub Actions deploy. Short post on why I kept it framework-free."
---

Just pushed the first version of my new personal site at **ale.bles.nu**.

A few notes on the setup:

- **Bun** as the build runtime — no framework, just a small TypeScript script that stitches templates together.
- **GitHub Actions** builds on every push to the `site` branch and deploys `dist/` to `gh-pages`.
- Blog posts live as markdown in the repo. Each post mirrors something I've already shared on LinkedIn, with a link back to the original thread.

Keeping the build boring on purpose: less to break, less to maintain, more time to actually write things.

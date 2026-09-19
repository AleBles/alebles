// Renders the profile README to a local HTML file styled like GitHub's dark theme,
// with the banner and project images pointed at the local dist/ build.
// Usage: bun run readme:preview   (run `bun run build` first so dist/assets exists)
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { marked } from "marked";
import { ROOT, SITE_URL } from "./content";

const dist = join(ROOT, "dist");
if (!existsSync(join(dist, "assets"))) {
    console.error("dist/assets not found. Run `bun run build` first.");
    process.exit(1);
}

const proc = Bun.spawn(["bun", join(ROOT, "scripts/render-readme.ts")], { stdout: "pipe" });
const markdown = (await new Response(proc.stdout).text()).replaceAll(
    `${SITE_URL}/assets`,
    `file://${join(dist, "assets")}`,
);

const body = await marked.parse(markdown);
const html = `<!doctype html>
<meta charset="utf-8">
<title>README preview</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-dark.min.css">
<body style="background:#0d1117;margin:0">
<article class="markdown-body" style="max-width:900px;margin:0 auto;padding:32px">
${body}
</article>`;

const outDir = join(ROOT, ".preview");
await mkdir(outDir, { recursive: true });
const out = join(outDir, "readme.html");
await Bun.write(out, html);
console.log(`README preview: file://${out}`);

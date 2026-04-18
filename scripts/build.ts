import { readdir, rm, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

type Project = {
    name: string;
    description: string;
    url: string;
    tags?: string[];
};

type Post = {
    slug: string;
    title: string;
    date: Date;
    excerpt: string;
    linkedinUrl?: string;
    bodyHtml: string;
};

const LAYOUT = await Bun.file(join(SRC, "templates/layout.html")).text();

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/\.md$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function inject(haystack: string, needle: string, value: string): string {
    return haystack.replace(needle, () => value);
}

function renderLayout(title: string, content: string): string {
    return inject(inject(LAYOUT, "<!--TITLE-->", escapeHtml(title)), "<!--CONTENT-->", content);
}

async function emit(relativePath: string, html: string): Promise<void> {
    const full = join(DIST, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await Bun.write(full, html);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const home = await Bun.file(join(SRC, "pages/home.html")).text();
await emit("index.html", renderLayout("Ale Bles", home));

const projectsTpl = await Bun.file(join(SRC, "pages/projects.html")).text();
const projects: Project[] = JSON.parse(
    await Bun.file(join(SRC, "content/projects.json")).text(),
);
const projectCards = projects
    .map((p) => {
        const tags = p.tags?.length
            ? `<div class="tags">${p.tags
                .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
                .join("")}</div>`
            : "";
        return `<div class="card">
    <h3>${escapeHtml(p.name)}</h3>
    <p>${escapeHtml(p.description)}</p>
    <p><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">View project →</a></p>
    ${tags}
</div>`;
    })
    .join("\n");
await emit(
    "projects/index.html",
    renderLayout(
        "Projects · Ale Bles",
        inject(projectsTpl, "<!--PROJECT_CARDS-->", projectCards),
    ),
);

const postsDir = join(SRC, "content/posts");
const postFiles = (await readdir(postsDir)).filter((f) => f.endsWith(".md"));
const posts: Post[] = await Promise.all(
    postFiles.map(async (file) => {
        const raw = await Bun.file(join(postsDir, file)).text();
        const { data, content } = matter(raw);
        const slug = slugify((data.slug as string | undefined) ?? file);
        const bodyHtml = await marked.parse(content);
        return {
            slug,
            title: data.title as string,
            date: new Date(data.date as string),
            excerpt: data.excerpt as string,
            linkedinUrl: data.linkedinUrl as string | undefined,
            bodyHtml,
        };
    }),
);
posts.sort((a, b) => b.date.getTime() - a.date.getTime());

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const blogTpl = await Bun.file(join(SRC, "pages/blog.html")).text();
const postCards = posts
    .map((p) => {
        const external = Boolean(p.linkedinUrl);
        const href = p.linkedinUrl ?? `/blog/${p.slug}/`;
        const linkAttrs = external ? ` target="_blank" rel="noopener"` : "";
        const readMoreLabel = external ? "Read on LinkedIn →" : "Read post →";
        return `<div class="card">
    <div class="meta">${fmtDate(p.date)}</div>
    <h3><a href="${escapeHtml(href)}"${linkAttrs}>${escapeHtml(p.title)}</a></h3>
    <p>${escapeHtml(p.excerpt)}</p>
    <p><a class="read-more" href="${escapeHtml(href)}"${linkAttrs}>${readMoreLabel}</a></p>
</div>`;
    })
    .join("\n");
await emit(
    "blog/index.html",
    renderLayout(
        "Blog · Ale Bles",
        inject(blogTpl, "<!--POST_CARDS-->", postCards),
    ),
);

const postTpl = await Bun.file(join(SRC, "pages/post.html")).text();
const localPosts = posts.filter((p) => !p.linkedinUrl);
for (const p of localPosts) {
    const body = [
        ["<!--POST_TITLE-->", escapeHtml(p.title)],
        ["<!--POST_DATE-->", fmtDate(p.date)],
        ["<!--POST_BODY-->", p.bodyHtml],
    ].reduce((acc, [needle, value]) => inject(acc, needle, value), postTpl);
    await emit(
        `blog/${p.slug}/index.html`,
        renderLayout(`${p.title} · Ale Bles`, body),
    );
}

await Bun.write(
    join(DIST, "CNAME"),
    await Bun.file(join(ROOT, "CNAME")).text(),
);

console.log(
    `Built ${posts.length} post${posts.length === 1 ? "" : "s"} + home/projects/blog → ${DIST}`,
);

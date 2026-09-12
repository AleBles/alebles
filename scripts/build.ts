import { readdir, rm, mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://ale.bles.nu";

type Project = {
    name: string;
    description: string;
    /** Live site or docs, rendered with a globe icon. */
    site?: string;
    /** Source repository, rendered with the GitHub mark. */
    github?: string;
    /** Optional header image, site-relative (e.g. "/assets/projects/skald.png"). Shown 2:1, cropped to cover. */
    image?: string;
    imageAlt?: string;
    tags?: string[];
};

const ICONS = {
    site: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
    github: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
};

/** Hostname without "www." for a short link label. */
function linkLabel(url: string): string {
    return new URL(url).hostname.replace(/^www\./, "");
}

type Post = {
    slug: string;
    title: string;
    date: Date;
    excerpt: string;
    linkedinUrl?: string;
    tags: string[];
    bodyHtml: string;
};

type PageKey = "home" | "projects" | "blog" | "homelab";

type LayoutOpts = {
    title: string;
    description: string;
    /** Site-relative path with trailing slash, e.g. "/" or "/blog/hello-world/". */
    path: string;
    /** Which top-nav link gets the active state. */
    page: PageKey;
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

/** Replace every occurrence of a slot comment. Slots like TITLE appear more than once in the head. */
function inject(haystack: string, needle: string, value: string): string {
    return haystack.replaceAll(needle, () => value);
}

function renderLayout(opts: LayoutOpts, content: string): string {
    let html = LAYOUT;
    html = inject(html, "<!--TITLE-->", escapeHtml(opts.title));
    html = inject(html, "<!--DESCRIPTION-->", escapeHtml(opts.description));
    html = inject(html, "<!--URL-->", SITE_URL + escapeHtml(opts.path));
    html = inject(html, "<!--PAGE-->", opts.page);
    html = html.replace(
        `data-nav="${opts.page}"`,
        `data-nav="${opts.page}" class="active" aria-current="page"`,
    );
    return inject(html, "<!--CONTENT-->", content);
}

async function emit(relativePath: string, html: string): Promise<void> {
    const full = join(DIST, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await Bun.write(full, html);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

type SkillGroup = { title: string; items: string[] };

const skills: SkillGroup[] = JSON.parse(
    await Bun.file(join(SRC, "content/skills.json")).text(),
);
const skillCards = skills
    .map(
        (g) => `    <div class="skill-group">
        <h4>${escapeHtml(g.title)}</h4>
        <ul>
${g.items.map((i) => `            <li>${escapeHtml(i)}</li>`).join("\n")}
        </ul>
    </div>`,
    )
    .join("\n");
const home = await Bun.file(join(SRC, "pages/home.html")).text();
await emit(
    "index.html",
    renderLayout(
        {
            title: "Ale Bles",
            description:
                "Ale Bles, SDK Development Manager at Azerion. HTML5 games, mobile SDKs, and homelab notes.",
            path: "/",
            page: "home",
        },
        inject(home, "<!--SKILLS-->", skillCards),
    ),
);

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
        const links = [
            p.site ? { kind: "site" as const, href: p.site, label: linkLabel(p.site) } : null,
            p.github ? { kind: "github" as const, href: p.github, label: "github" } : null,
        ]
            .filter((l): l is NonNullable<typeof l> => l !== null)
            .map(
                (l) =>
                    `<a class="card__link" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${ICONS[l.kind]}<span>${escapeHtml(l.label)}</span></a>`,
            )
            .join("\n        ");
        const image = p.image
            ? `<img class="card__image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt ?? "")}" loading="lazy">\n    `
            : "";
        return `<article class="card">
    ${image}<h3>${escapeHtml(p.name)}</h3>
    <p>${escapeHtml(p.description)}</p>
    ${links ? `<div class="card__links">\n        ${links}\n    </div>` : ""}
    ${tags}
</article>`;
    })
    .join("\n");
await emit(
    "projects/index.html",
    renderLayout(
        {
            title: "Projects · Ale Bles",
            description: "Things Ale Bles has built or helped ship.",
            path: "/projects/",
            page: "projects",
        },
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
        const rawTags = data.tags;
        const tags = Array.isArray(rawTags)
            ? rawTags.map((t) => String(t).toLowerCase())
            : [];
        return {
            slug,
            title: data.title as string,
            date: new Date(data.date as string),
            excerpt: data.excerpt as string,
            linkedinUrl: data.linkedinUrl as string | undefined,
            tags,
            bodyHtml,
        };
    }),
);
posts.sort((a, b) => b.date.getTime() - a.date.getTime());

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function renderPostCard(p: Post): string {
    const external = Boolean(p.linkedinUrl);
    const href = p.linkedinUrl ?? `/blog/${p.slug}/`;
    const linkAttrs = external ? ` target="_blank" rel="noopener"` : "";
    const readMoreLabel = external ? "Read on LinkedIn →" : "Read post →";
    return `<article class="card">
    <div class="meta">${fmtDate(p.date)}</div>
    <h3><a href="${escapeHtml(href)}"${linkAttrs}>${escapeHtml(p.title)}</a></h3>
    <p>${escapeHtml(p.excerpt)}</p>
    <p><a class="read-more" href="${escapeHtml(href)}"${linkAttrs}>${readMoreLabel}</a></p>
</article>`;
}

function renderPostCards(list: Post[], emptyMsg: string): string {
    return list.length ? list.map(renderPostCard).join("\n") : `<p class="empty">${emptyMsg}</p>`;
}

const blogTpl = await Bun.file(join(SRC, "pages/blog.html")).text();
await emit(
    "blog/index.html",
    renderLayout(
        {
            title: "Blog · Ale Bles",
            description:
                "Short previews of what Ale Bles posts on LinkedIn, plus the occasional local post.",
            path: "/blog/",
            page: "blog",
        },
        inject(blogTpl, "<!--POST_CARDS-->", renderPostCards(posts, "No posts yet.")),
    ),
);

const homelabTpl = await Bun.file(join(SRC, "pages/homelab.html")).text();
const homelabPosts = posts.filter((p) => p.tags.includes("homelab"));
await emit(
    "homelab/index.html",
    renderLayout(
        {
            title: "Homelab · Ale Bles",
            description: "Self-hosted, privacy-first home infrastructure notes.",
            path: "/homelab/",
            page: "homelab",
        },
        inject(homelabTpl, "<!--HOMELAB_POSTS-->", renderPostCards(homelabPosts, "No homelab posts yet.")),
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
        renderLayout(
            {
                title: `${p.title} · Ale Bles`,
                description: p.excerpt,
                path: `/blog/${p.slug}/`,
                page: "blog",
            },
            body,
        ),
    );
}

await Bun.write(
    join(DIST, "CNAME"),
    await Bun.file(join(ROOT, "CNAME")).text(),
);

// Static assets (stylesheet, snake script, favicon, project images) are copied verbatim, subfolders included.
const assetsDir = join(SRC, "assets");
const assetFiles = (await readdir(assetsDir, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => join(relative(assetsDir, e.parentPath), e.name));
for (const file of assetFiles) {
    await Bun.write(join(DIST, "assets", file), Bun.file(join(assetsDir, file)));
}

console.log(
    `Built ${posts.length} post${posts.length === 1 ? "" : "s"} + home/projects/blog/homelab + ${assetFiles.length} assets → ${DIST}`,
);

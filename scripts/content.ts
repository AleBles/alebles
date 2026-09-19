// Shared content loaders for the site build and the profile README renderer.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export const ROOT = new URL("..", import.meta.url).pathname;
export const SRC = join(ROOT, "src");
export const SITE_URL = "https://ale.bles.nu";

export type Project = {
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

export type Post = {
    slug: string;
    title: string;
    date: Date;
    excerpt: string;
    linkedinUrl?: string;
    tags: string[];
    bodyHtml: string;
};

export type SkillGroup = { title: string; items: string[] };

export function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/\.md$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export async function loadSkills(): Promise<SkillGroup[]> {
    return JSON.parse(await Bun.file(join(SRC, "content/skills.json")).text());
}

export async function loadProjects(): Promise<Project[]> {
    return JSON.parse(await Bun.file(join(SRC, "content/projects.json")).text());
}

/** All posts, newest first. */
export async function loadPosts(): Promise<Post[]> {
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
    return posts;
}

/** Public URL a post card links to: LinkedIn when mirrored there, otherwise the local page. */
export function postUrl(p: Post): string {
    return p.linkedinUrl ?? `${SITE_URL}/blog/${p.slug}/`;
}

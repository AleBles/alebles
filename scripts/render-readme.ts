// Renders the GitHub profile README (pushed to `main` by .github/workflows/sync-readme.yml)
// from the same content the site is built from: projects, posts, and skills.
import {
    SITE_URL,
    fmtDate,
    loadPosts,
    loadProjects,
    loadSkills,
    postUrl,
    slugify,
    type Project,
} from "./content";

const [skills, projects, posts] = await Promise.all([loadSkills(), loadProjects(), loadPosts()]);

const GITHUB = "https://github.com/AleBles";
const LINKEDIN = "https://www.linkedin.com/in/alebles/";
const MONO = "ui-monospace";

function badge(label: string, message: string, color: string, href: string): string {
    const enc = (s: string) => encodeURIComponent(s.replaceAll("-", "--").replaceAll("_", "__"));
    const src = `https://img.shields.io/badge/${enc(label)}-${enc(message)}-${color}?style=for-the-badge&labelColor=0b0a1a`;
    return `<a href="${href}"><img alt="${label}: ${message}" src="${src}"></a>`;
}

function repoName(p: Project): string {
    return p.github ? p.github.replace(/\/+$/, "").split("/").pop()! : slugify(p.name);
}

function projectCell(p: Project): string {
    const href = p.site ?? p.github ?? SITE_URL + "/projects/";
    const image = p.image
        ? `<a href="${href}"><img src="${SITE_URL}${p.image}" alt="${p.imageAlt ?? p.name}" width="100%"></a><br>`
        : "";
    const links = [
        p.site ? `<a href="${p.site}">${new URL(p.site).hostname.replace(/^www\./, "")}</a>` : "",
        p.github ? `<a href="${p.github}">github</a>` : "",
    ]
        .filter(Boolean)
        .join(" · ");
    const tags = p.tags?.length ? `<br><sub>${p.tags.map((t) => `<code>${t}</code>`).join(" ")}</sub>` : "";
    return `<td width="50%" valign="top">
${image}<b><a href="${href}">${p.name}</a></b><br>
${p.description}<br>
${links}${tags}
</td>`;
}

const L: string[] = [];

// Banner and badges
L.push(
    `<p align="center"><a href="${SITE_URL}"><img src="${SITE_URL}/assets/readme/banner.svg" alt="ale bles, SDK Development Manager at Azerion" width="100%"></a></p>`,
    "",
    `<p align="center">`,
    `  ${badge("site", "ale.bles.nu", "3df5ff", SITE_URL)}`,
    `  ${badge("linkedin", "alebles", "ff4fd8", LINKEDIN)}`,
    `  ${badge("work", "@azerion", "9d6bff", "https://www.azerion.com")}`,
    `  ${badge("homelab", "local first", "ffb347", SITE_URL + "/homelab/")}`,
    `</p>`,
    "",
);

// Terminal intro
L.push(
    "```console",
    "ale@bles.nu:~$ whoami",
    "Ale Bles. SDK Development Manager at Azerion, Amsterdam / Almere.",
    "HTML5 game veteran, mobile SDK nerd, self-hosting enthusiast.",
    "",
    "ale@bles.nu:~$ ls ~/projects",
    projects.map((p) => `${repoName(p)}/`).join("  "),
    "",
    "ale@bles.nu:~$ cat ~/.plan",
    "Ship SDKs people do not notice. Keep the homelab boring. Play more Snake.",
    "```",
    "",
);

// Projects, two per row
L.push("## > projects", "", "<table>");
for (let i = 0; i < projects.length; i += 2) {
    const row = projects.slice(i, i + 2).map(projectCell);
    if (row.length === 1) row.push(`<td width="50%"></td>`);
    L.push("<tr>", ...row, "</tr>");
}
L.push("</table>", "", `<sub>More at <a href="${SITE_URL}/projects/">ale.bles.nu/projects</a></sub>`, "");

// Latest posts
const latest = posts.slice(0, 5);
L.push("## > latest posts", "");
for (const p of latest) {
    const where = p.linkedinUrl ? "linkedin" : "ale.bles.nu";
    L.push(`- \`${fmtDate(p.date)}\` [${p.title}](${postUrl(p)}) <sub>${where}</sub>`);
}
L.push("", `<sub>All posts at <a href="${SITE_URL}/blog/">ale.bles.nu/blog</a></sub>`, "");

// Skills as a compact table
L.push("## > skills", "", "| | |", "|---|---|");
for (const g of skills) {
    L.push(`| **${g.title}** | ${g.items.map((i) => `\`${i}\``).join(" ")} |`);
}
L.push("");

// Homelab
L.push(
    "## > homelab",
    "",
    "Self-hosted, privacy-first home infrastructure on a low-power x86 server and a NAS. Ad-blocking DNS, VPN, reverse proxy with TLS, Home Assistant with fully local voice, a local LLM for home queries, self-hosted photos and media, cameras with on-device detection, and monitoring across the stack.",
    "",
    `Local-first. If it can run at home, it does. Notes at [ale.bles.nu/homelab](${SITE_URL}/homelab/).`,
    "",
);

// Footer
L.push(
    "---",
    "",
    `<sub>Generated from the <a href="${GITHUB}/alebles/tree/site">site</a> branch (projects, posts, skills). Edits made directly on <code>main</code> are overwritten on the next sync.</sub>`,
    "",
);

const output = L.join("\n");

const arg = process.argv[2];
if (arg) {
    await Bun.write(arg, output);
    console.error(`Wrote README to ${arg}`);
} else {
    process.stdout.write(output);
}

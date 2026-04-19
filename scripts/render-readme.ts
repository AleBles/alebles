import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

type SkillGroup = { title: string; items: string[] };

const skills: SkillGroup[] = JSON.parse(
    await Bun.file(join(SRC, "content/skills.json")).text(),
);

const parts: string[] = [];

parts.push("### Hi, I'm Ale Bles 👋");
parts.push("");
parts.push(
    "Technical Lead at Azerion (Amsterdam / Almere). HTML5 game veteran, mobile SDK nerd, self-hosting enthusiast.",
);
parts.push("");
parts.push(
    "Full site: [ale.bles.nu](https://ale.bles.nu) · [LinkedIn](https://www.linkedin.com/in/alebles/)",
);
parts.push("");
parts.push("## Skills");
parts.push("");
for (const group of skills) {
    parts.push(`**${group.title}**`);
    for (const item of group.items) {
        parts.push(`- ${item}`);
    }
    parts.push("");
}
parts.push("---");
parts.push("");
parts.push(
    "_This README is generated from [`src/content/skills.json`](https://github.com/AleBles/alebles/blob/site/src/content/skills.json) on the `site` branch. Edits made directly on `main` will be overwritten on the next sync._",
);
parts.push("");

const output = parts.join("\n");

const arg = process.argv[2];
if (arg) {
    await Bun.write(arg, output);
    console.error(`Wrote README to ${arg}`);
} else {
    process.stdout.write(output);
}

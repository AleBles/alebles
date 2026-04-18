import { watch } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

async function build() {
    const proc = Bun.spawn(["bun", "scripts/build.ts"], {
        cwd: ROOT,
        stdout: "inherit",
        stderr: "inherit",
    });
    await proc.exited;
}

await build();

await import("./serve.ts");

let debounce: ReturnType<typeof setTimeout> | null = null;
const watched = [join(ROOT, "src"), join(ROOT, "CNAME")];
for (const path of watched) {
    watch(path, { recursive: true }, (_, filename) => {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
            console.log(`\nRebuilding (${filename ?? "change"})...`);
            build();
        }, 80);
    });
}

console.log("Watching src/ for changes. Ctrl+C to stop.");

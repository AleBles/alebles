import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const DIST = new URL("../dist", import.meta.url).pathname;

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".txt": "text/plain; charset=utf-8",
};

const port = Number(process.env.PORT ?? 3121);

Bun.serve({
    port,
    fetch(req) {
        const url = new URL(req.url);
        const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, "/");
        let full = join(DIST, safePath);

        if (existsSync(full) && statSync(full).isDirectory()) {
            full = join(full, "index.html");
        }
        if (!existsSync(full)) {
            return new Response("Not Found", { status: 404 });
        }

        const type = MIME[extname(full)] ?? "application/octet-stream";
        return new Response(Bun.file(full), { headers: { "content-type": type } });
    },
});

console.log(`Preview: http://localhost:${port}`);

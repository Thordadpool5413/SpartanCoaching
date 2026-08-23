import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(scriptDir, "..", "dist", "public");
const port = Number(process.env.PORT || 5000);
const siteOrigin = "https://spartanhospicecoaching.com";

const routeManifest = JSON.parse(
  await readFile(path.join(publicDir, "seo-routes.json"), "utf8"),
);
const routeMetadata = JSON.parse(
  await readFile(path.join(publicDir, "seo-metadata.json"), "utf8"),
);
const publicPaths = new Set(routeManifest.publicPaths);
const noindexPrefixes = routeManifest.noindexPrefixes;

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function isNoIndexPath(pathname) {
  return noindexPrefixes.some((prefix) =>
    prefix.endsWith("/")
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function canonicalPath(pathname) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceMeta(html, attribute, value, content) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );
  return html.replace(pattern, `<meta ${attribute}="${value}" content="${escapeHtml(content)}">`);
}

function injectRouteMetadata(html, pathname, noindex) {
  const canonical = `${siteOrigin}${canonicalPath(pathname)}`;
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  const metadata = routeMetadata[canonicalPath(pathname)] || routeMetadata["/"];

  const withRouteContent = replaceMeta(
    replaceMeta(
      replaceMeta(
        replaceMeta(
          html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`),
          "name",
          "description",
          metadata.description,
        ),
        "property",
        "og:title",
        metadata.title,
      ),
      "property",
      "og:description",
      metadata.description,
    ),
    "name",
    "twitter:title",
    metadata.title,
  );

  return replaceMeta(
    replaceMeta(
      withRouteContent,
      "name",
      "twitter:description",
      metadata.description,
    ),
    "name",
    "robots",
    robots,
  )
    .replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${canonical}">`,
    )
    .replace(
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${canonical}">`,
    )
    .replace(
      /<meta\s+name=["']twitter:url["'][^>]*>/i,
      `<meta name="twitter:url" content="${canonical}">`,
    );
}

function safeStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const filePath = path.resolve(publicDir, `.${decoded}`);
  return filePath === publicDir || filePath.startsWith(`${publicDir}${path.sep}`)
    ? filePath
    : null;
}

async function sendStaticFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes.get(extension) || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(res);
}

async function handleRequest(req, res) {
  if (!req.url || !["GET", "HEAD"].includes(req.method || "")) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  const { pathname } = new URL(req.url, "http://localhost");
  const filePath = safeStaticPath(pathname);
  if (!filePath) {
    res.writeHead(400);
    res.end();
    return;
  }

  try {
    if ((await stat(filePath)).isFile()) {
      if (req.method === "HEAD") {
        res.writeHead(200, { "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream" });
        res.end();
      } else {
        await sendStaticFile(res, filePath);
      }
      return;
    }
  } catch {
    // SPA path: resolve below.
  }

  if (pathname.startsWith("/api/") || pathname.includes(".")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const normalizedPath = canonicalPath(pathname);
  const noindex = isNoIndexPath(normalizedPath) || !publicPaths.has(normalizedPath);
  const canonical = `${siteOrigin}${normalizedPath}`;
  const html = injectRouteMetadata(
    await readFile(path.join(publicDir, "index.html"), "utf8"),
    normalizedPath,
    noindex,
  );

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
    Link: `<${canonical}>; rel="canonical"`,
    ...(noindex ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
  });
  res.end(req.method === "HEAD" ? undefined : html);
}

await access(path.join(publicDir, "index.html"));
http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error("Unhandled public web request error", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
    } else {
      res.destroy();
    }
  });
}).listen(port, "0.0.0.0", () => {
  console.log(`Spartan Coaching production server listening on ${port}`);
});
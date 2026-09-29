import fs from "node:fs";
import path from "node:path";
const tools = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
// Preserve the four public .html URLs on static hosts regardless of Astro output format.
for (const tool of tools.filter((t) => t.path.endsWith(".html"))) {
  const target = path.join("dist", tool.path);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const html = fs.readFileSync(path.join(target, "index.html"));
    fs.rmSync(target, { recursive: true });
    fs.writeFileSync(target, html);
  }
}
const urls = ["/", "/tools/", "/privacy/", ...tools.map((t) => t.path)];
fs.writeFileSync(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map((p) => `  <url><loc>https://tools.openaa.com${p}</loc></url>`)
      .join("\n") +
    "\n</urlset>\n",
);
// Per-tool scopes keep existing installed apps working. Precache each tool's actual bundles.
for (const id of ["expense-record", "usd-rmb", "nyc-attractions"]) {
  const scope = `/usa/${id}/`;
  const html = fs.readFileSync("dist" + scope + "index.html", "utf8");
  const assets = [
    ...new Set([
      scope,
      scope + "manifest.json",
      "/assets/openaa-logo.png",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      ...Array.from(
        html.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+)"/g),
        (m) => m[1],
      ),
    ]),
  ];
  // Dynamic chunks must also be available to start the saved tool offline.
  for (const f of fs.readdirSync("dist/_astro"))
    if (/\.(js|css)$/.test(f)) assets.push("/_astro/" + f);
  const version = process.env.GITHUB_SHA?.slice(0, 10) || String(Date.now());
  fs.writeFileSync(
    "dist" + scope + "sw.js",
    `const PREFIX='openaa-${id}-', CACHE=PREFIX+'${version}', LEGACY='toolku-${id === "expense-record" ? "expense" : id}-';\nconst ASSETS=${JSON.stringify([...new Set(assets)])};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith(PREFIX)||k.startsWith(LEGACY))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;if(r.mode==='navigate'&&u.pathname.startsWith('${scope}')){e.respondWith(fetch(r).then(res=>{if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{}));}return res}).catch(async()=>await caches.match(r)||await caches.match('${scope}')||Response.error()));return;}e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));});\n`,
  );
}
console.log(
  `Built ${tools.length} tools; sitemap and scoped offline caches generated.`,
);

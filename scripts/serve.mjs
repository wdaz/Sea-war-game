// Zero-dependency static file server for local development and for
// Playwright's webServer.
//
// It replaces the `serve` package, whose dependency chain
// (serve -> serve-handler -> minimatch@3 -> brace-expansion@1) carries a
// high-severity advisory with no non-downgrade fix available.
//
//   node scripts/serve.mjs [--port 3000] [--root .]

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PORT = Number(arg('port', process.env.PORT || 3000));
const ROOT = resolve(arg('root', '.'));

// Hidden entries and dependency trees are never served. Without this the git
// directory would be readable over HTTP.
const DENIED = /(^|\/)(\.[^/]+|node_modules)(\/|$)/;

function resolveWithinRoot(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (DENIED.test(decoded)) return null;

  const candidate = resolve(join(ROOT, normalize(decoded)));
  // Reject anything that escapes the served root.
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;
  return candidate;
}

async function resolveFile(pathname) {
  const target = resolveWithinRoot(pathname);
  if (!target) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, 'index.html');
      const indexInfo = await stat(index);
      return indexInfo.isFile() ? { path: index, size: indexInfo.size } : null;
    }
    return { path: target, size: info.size };
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const file = await resolveFile(pathname);

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(file.path).toLowerCase()] ?? 'application/octet-stream',
    'content-length': file.size,
    'cache-control': 'no-cache',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(file.path)
    .on('error', () => res.destroy())
    .pipe(res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop whatever is listening there, `
      + `or pick another port:\n  npm run serve -- --port ${PORT + 1}`,
    );
    process.exit(1);
  }
  if (err.code === 'EACCES') {
    console.error(`Port ${PORT} needs elevated privileges. Use a port above 1024.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} on http://localhost:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

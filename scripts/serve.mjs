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

// An explicitly requested port is honoured exactly: if it is taken, that is an
// error rather than something to work around. Only the default drifts upward.
const PORT_IS_EXPLICIT = process.argv.includes('--port') || Boolean(process.env.PORT);
const MAX_PORT_ATTEMPTS = 10;

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

// Both handlers are registered exactly once. Passing a callback to
// server.listen() on each retry would instead queue one 'listening' listener
// per attempt, and all of them would fire — and print — as soon as the server
// finally bound, reporting the ports that failed rather than the one in use.
let port = PORT;
let attempt = 1;

server.on('listening', () => {
  console.log(`Serving ${ROOT} on http://localhost:${server.address().port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (!PORT_IS_EXPLICIT && attempt < MAX_PORT_ATTEMPTS) {
      console.log(`Port ${port} is in use, trying ${port + 1}`);
      port += 1;
      attempt += 1;
      server.listen(port);
      return;
    }
    const hint = PORT_IS_EXPLICIT
      ? 'Stop whatever is listening there, or choose a different port.'
      : `Tried ${PORT} through ${port}. Stop one of those servers, or pass --port.`;
    console.error(`Port ${port} is already in use. ${hint}`);
    process.exit(1);
  }
  if (err.code === 'EACCES') {
    console.error(`Port ${port} needs elevated privileges. Use a port above 1024.`);
    process.exit(1);
  }
  throw err;
});

server.listen(port);

// server.close() only stops accepting new connections; it waits for open ones
// to end. A browser holds its keep-alive socket open indefinitely, so closing
// alone never completes and the port stays bound. Existing sockets are
// destroyed too, with a short failsafe in case something still lingers.
//
// Ctrl+Z is deliberately not handled: SIGTSTP means "suspend, I will resume
// with fg", and a suspended process keeps its port. Use Ctrl+C to stop.
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) process.exit(1);
  shuttingDown = true;

  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 2000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, shutdown);
}

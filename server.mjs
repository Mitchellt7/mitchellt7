import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 4173);
const ROOT = process.cwd();

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function safePath(urlPath) {
  const cleanPath = normalize(urlPath).replace(/^([.][.][\/\\])+/, '');
  return join(ROOT, cleanPath);
}

createServer((req, res) => {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = safePath(requestPath || '/index.html');

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const type = contentTypes[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Budget app running at http://0.0.0.0:${PORT}`);
});

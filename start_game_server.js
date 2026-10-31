const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIR = path.join(__dirname, 'atomic-bomber');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath.startsWith('/atomic-bomber/')) {
    reqPath = reqPath.replace('/atomic-bomber/', '/');
  } else if (reqPath === '/atomic-bomber') {
    reqPath = '/index.html';
  }
  const filePath = path.join(DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + reqPath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Atomic Strike local server active at http://localhost:${PORT}`);
});

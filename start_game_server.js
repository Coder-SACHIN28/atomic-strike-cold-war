const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const GAME_DIR = path.join(__dirname, 'atomic-bomber');
const ROOT_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  try {
    let rawPath = decodeURIComponent(req.url.split('?')[0]);

    // Normalize empty or root paths
    if (!rawPath || rawPath === '/') {
      rawPath = '/index.html';
    }

    // Strip leading /atomic-bomber or /atomic-bomber/
    let cleanPath = rawPath;
    if (cleanPath === '/atomic-bomber' || cleanPath === '/atomic-bomber/') {
      cleanPath = '/index.html';
    } else if (cleanPath.startsWith('/atomic-bomber/')) {
      cleanPath = cleanPath.slice('/atomic-bomber'.length);
      if (cleanPath === '' || cleanPath === '/') {
        cleanPath = '/index.html';
      }
    }

    // Candidate file paths
    const gameCandidate = path.join(GAME_DIR, cleanPath);
    const rootCandidate = path.join(ROOT_DIR, rawPath);

    let targetFile = null;

    if (fs.existsSync(gameCandidate)) {
      const stat = fs.statSync(gameCandidate);
      if (stat.isFile()) {
        targetFile = gameCandidate;
      } else if (stat.isDirectory()) {
        const indexFile = path.join(gameCandidate, 'index.html');
        if (fs.existsSync(indexFile)) targetFile = indexFile;
      }
    }

    if (!targetFile && fs.existsSync(rootCandidate)) {
      const stat = fs.statSync(rootCandidate);
      if (stat.isFile()) {
        targetFile = rootCandidate;
      } else if (stat.isDirectory()) {
        const indexFile = path.join(rootCandidate, 'index.html');
        if (fs.existsSync(indexFile)) targetFile = indexFile;
      }
    }

    if (!targetFile) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>404 Not Found</h2><p>Path: ${rawPath}</p><p><a href="/atomic-bomber/index.html">Play Atomic Strike</a></p>`);
      return;
    }

    const ext = path.extname(targetFile).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(targetFile);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Server Stream Error');
    });
    stream.pipe(res);
  } catch (err) {
    console.error('Request handler error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Atomic Strike local server active at http://localhost:${PORT}`);
  console.log(`Game direct URL: http://localhost:${PORT}/atomic-bomber/index.html`);
});

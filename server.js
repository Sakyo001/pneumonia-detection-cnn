// Custom Next.js server with optimizations
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Set memory limits for Node.js
const v8 = require('v8');
// Limit heap memory to 1.5GB (1536MB) which should stay within Vercel's limits
v8.setHeapSnapshotNearHeapLimit(1536 * 1024 * 1024);

// Determine environment
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Preload these dependencies to optimize memory usage
require('@prisma/client');

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 
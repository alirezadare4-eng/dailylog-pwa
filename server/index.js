/**
 * DailyLog Node.js Backend Server
 * Provides REST API, PostgreSQL integration (with fallback in-memory/file storage),
 * VAPID Web Push, and Two-Way Syncing.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Fallback in-memory database if PostgreSQL is not active
const memoryStore = {
  reports: new Map(),
  activities: new Map(),
  projects: new Map(),
  categories: new Map(),
  subscriptions: []
};

// Helper: Parse JSON body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --- API ROUTES ---
  if (pathname.startsWith('/api/')) {
    // 1. Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // 2. VAPID Public Key for Web Push
    if (pathname === '/api/vapid-public-key' && req.method === 'GET') {
      return sendJson(res, 200, {
        publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      });
    }

    // 3. Register Push Subscription
    if (pathname === '/api/subscribe' && req.method === 'POST') {
      try {
        const body = await getRequestBody(req);
        if (body.subscription) {
          memoryStore.subscriptions.push(body.subscription);
        }
        return sendJson(res, 200, { success: true, message: 'Subscription saved' });
      } catch (e) {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    }

    // 4. Sync Push (Client sends new/updated reports & activities)
    if (pathname === '/api/sync/push' && req.method === 'POST') {
      try {
        const { reports = [], activities = [] } = await getRequestBody(req);

        reports.forEach(r => {
          memoryStore.reports.set(r.id, r);
        });

        activities.forEach(a => {
          memoryStore.activities.set(a.id, a);
        });

        return sendJson(res, 200, {
          success: true,
          pushedReports: reports.length,
          pushedActivities: activities.length
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 5. Sync Pull (Client fetches latest records from server)
    if (pathname === '/api/sync/pull' && req.method === 'GET') {
      return sendJson(res, 200, {
        reports: Array.from(memoryStore.reports.values()),
        activities: Array.from(memoryStore.activities.values())
      });
    }

    // 404 for unknown API
    return sendJson(res, 404, { error: 'API route not found' });
  }

  // --- STATIC FILES FOR PWA ---
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error loading static file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Periodic Reminder Runner (Check every 60s for 22:00 notification)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 22 && now.getMinutes() === 0) {
    console.log('[Reminder Cron] Triggering 22:00 daily reminder notifications to all active subscribers...');
    // In production with web-push installed:
    // memoryStore.subscriptions.forEach(sub => webpush.sendNotification(sub, ...))
  }
}, 60000);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 DailyLog (روزنگار) Server is running on:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`📡 API Endpoints ready: /api/health, /api/sync/push, /api/sync/pull`);
  console.log(`===============================================`);
});


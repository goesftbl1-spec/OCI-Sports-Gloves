import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function staticImageFallback(): Plugin {
  return {
    name: 'static-image-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && /\.(jpeg|jpg|png|webp|svg|mp4|webm|mov)$/i.test(req.url)) {
          const urlClean = req.url.split('?')[0].replace(/^\//, '');
          const filename = path.basename(urlClean);
          const possiblePaths = [
            path.resolve(__dirname, 'public', urlClean),
            path.resolve(__dirname, urlClean),
            path.resolve(__dirname, 'src/assets/images', urlClean),
            path.resolve(__dirname, 'public', filename),
            path.resolve(__dirname, filename),
            path.resolve(__dirname, 'src/assets/images', filename),
          ];

          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime'
          };

          const streamFile = (filePath: string) => {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const range = req.headers.range;

            if (range && ext === '.mp4') {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
              const chunksize = (end - start) + 1;
              const file = fs.createReadStream(filePath, { start, end });
              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
              });
              return file.pipe(res);
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return fs.createReadStream(filePath).pipe(res);
          };

          for (const p of possiblePaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
              return streamFile(p);
            }
          }

          // Case-insensitive check in public/ and src/assets/images/
          const searchDirs = [
            path.resolve(__dirname, 'public'),
            path.resolve(__dirname, 'src/assets/images'),
            path.resolve(__dirname)
          ];
          for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
              const entries = fs.readdirSync(dir);
              const matched = entries.find((e) => e.toLowerCase() === filename.toLowerCase());
              if (matched) {
                const fullPath = path.join(dir, matched);
                if (fs.statSync(fullPath).isFile()) {
                  return streamFile(fullPath);
                }
              }
            }
          }
        }
        next();
      });
    }
  };
}

function ordersApiPlugin(): Plugin {
  const activeDevSessions = new Set<string>();
  const VALID_DEV_PASSWORDS = new Set(['14MCGEEOCI', 'OCI2026']);

  return {
    name: 'orders-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlClean = (req.url || '').split('?')[0];

        // 1. Owner Login
        if (urlClean === '/api/admin/login' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { password } = JSON.parse(body);
              const clean = String(password || '').trim();
              if (VALID_DEV_PASSWORDS.has(clean)) {
                const token = 'dev-token-' + Math.random().toString(36).substring(2) + Date.now();
                activeDevSessions.add(token);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, token, expiresIn: 43200 }));
              }
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Incorrect password. Access denied.' }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        // 2. Owner Logout
        if (urlClean === '/api/admin/logout' && req.method === 'POST') {
          const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
          if (auth) activeDevSessions.delete(auth);
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true }));
        }

        // 3. Patch Order Status (e.g. /api/orders/:orderId/status)
        const patchStatusMatch = urlClean.match(/^\/api\/orders\/([^/]+)\/status$/);
        if (patchStatusMatch && req.method === 'PATCH') {
          const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
          const tokenH = (req.headers['x-admin-token'] as string || '').trim();
          const passH = (req.headers['x-admin-passcode'] as string || '').trim();
          const isAuthed = activeDevSessions.has(auth) || activeDevSessions.has(tokenH) || VALID_DEV_PASSWORDS.has(passH);

          if (!isAuthed) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
          }

          const targetOrderId = decodeURIComponent(patchStatusMatch[1]);
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { status, dispatchStatus, trackingNumber, carrier, notes } = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'data/orders.json');
              let orders: any[] = [];
              if (fs.existsSync(filePath)) {
                try {
                  orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  orders = [];
                }
              }
              const cleanId = targetOrderId.toUpperCase();
              const idx = orders.findIndex((o) => (o.orderId && o.orderId.toUpperCase() === cleanId) || (o.paypalOrderId && o.paypalOrderId.toUpperCase() === cleanId));
              if (idx === -1) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Order not found' }));
              }
              orders[idx] = {
                ...orders[idx],
                ...(status ? { status } : {}),
                ...(dispatchStatus ? { dispatchStatus } : {}),
                ...(trackingNumber !== undefined ? { trackingNumber } : {}),
                ...(carrier !== undefined ? { carrier } : {}),
                ...(notes !== undefined ? { notes } : {}),
                updatedAt: new Date().toISOString(),
              };
              fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, order: orders[idx] }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Invalid request' }));
            }
          });
          return;
        }

        // 4. Create / Sync Order
        if (urlClean === '/api/orders' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const order = JSON.parse(body);
              const dataDir = path.resolve(__dirname, 'data');
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              const filePath = path.resolve(dataDir, 'orders.json');
              let orders = [];
              if (fs.existsSync(filePath)) {
                try {
                  orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  orders = [];
                }
              }
              orders = [order, ...orders.filter((o: any) => o.orderId !== order.orderId)];
              fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: orders.length }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid order JSON' }));
            }
          });
          return;
        }

        // 5. Get Orders (Protected)
        if (urlClean === '/api/orders' && req.method === 'GET') {
          const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
          const tokenH = (req.headers['x-admin-token'] as string || '').trim();
          const passH = (req.headers['x-admin-passcode'] as string || '').trim();
          const isAuthed = activeDevSessions.has(auth) || activeDevSessions.has(tokenH) || VALID_DEV_PASSWORDS.has(passH);

          if (!isAuthed) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Authentication required' }));
          }

          const filePath = path.resolve(__dirname, 'data/orders.json');
          let orders = [];
          if (fs.existsSync(filePath)) {
            try {
              orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch {
              orders = [];
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, orders }));
          return;
        }

        if (urlClean === '/api/orders' && req.method === 'DELETE') {
          const filePath = path.resolve(__dirname, 'data/orders.json');
          fs.writeFileSync(filePath, '[]', 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, orders: [] }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), staticImageFallback(), ordersApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

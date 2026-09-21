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
  return {
    name: 'orders-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlClean = (req.url || '').split('?')[0];

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

        if (urlClean === '/api/orders' && req.method === 'GET') {
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
          res.end(JSON.stringify({ orders }));
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

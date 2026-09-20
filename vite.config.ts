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
        if (req.url && /\.(jpeg|jpg|png|webp|svg)$/i.test(req.url)) {
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
          for (const p of possiblePaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
              const ext = path.extname(p).toLowerCase();
              const mimeTypes: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml'
              };
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              res.setHeader('Cache-Control', 'public, max-age=3600');
              return fs.createReadStream(p).pipe(res);
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
                  const ext = path.extname(fullPath).toLowerCase();
                  const mimeTypes: Record<string, string> = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.webp': 'image/webp',
                    '.svg': 'image/svg+xml'
                  };
                  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                  res.setHeader('Cache-Control', 'public, max-age=3600');
                  return fs.createReadStream(fullPath).pipe(res);
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), staticImageFallback()],
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

import { defineConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));

// Replaces <!-- include:name --> with src/partials/name.html so every page
// shares one header/footer/head without a runtime fetch.
function htmlPartials() {
  const dir = resolve(root, 'src/partials');
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const expand = (src) =>
          src.replace(/<!--\s*include:([\w-]+)\s*-->/g, (_, name) =>
            expand(readFileSync(resolve(dir, `${name}.html`), 'utf8').trim()),
          );
        return expand(html);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('partials')) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  plugins: [htmlPartials()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p.replace('.html', ''), resolve(root, p)])),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion';
        },
      },
    },
  },
});

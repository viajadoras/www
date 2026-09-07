import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Domínio público do site
const SITE = 'https://viajadoras.com';

export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      filter: (page) =>
        !['/convite', '/404'].includes(
          new URL(page).pathname.replace(/\/$/, ''),
        ),
      // Datas de alterações editoriais significativas; não atualizar a cada build.
      serialize: (item) => {
        const path = new URL(item.url).pathname;
        if (
          path === '/' ||
          path.startsWith('/blog/') ||
          [
            '/companhia-para-viajar/',
            '/viagens-para-mulheres/',
            '/companhia-feminina-para-sair/',
            '/viajar-sozinha-mulher/',
          ].includes(path)
        ) {
          item.lastmod = new Date('2026-09-07T00:00:00-03:00');
        }
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwind()] },
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br'],
    routing: { prefixDefaultLocale: false },
  },
});

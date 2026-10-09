import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

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
          item.lastmod = new Date('2026-10-04T00:00:00-03:00');
        }
        return item;
      },
    }),
  ],
  // Fontes self-hosted no build (sem pedido a fonts.googleapis.com).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--face-fraunces',
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Manrope',
      cssVariable: '--face-manrope',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwind()] },
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br'],
    routing: { prefixDefaultLocale: false },
  },
});

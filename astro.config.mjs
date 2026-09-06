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
        new URL(page).pathname.replace(/\/$/, '') !== '/convite',
    }),
  ],
  vite: { plugins: [tailwind()] },
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br'],
    routing: { prefixDefaultLocale: false },
  },
});

import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// Domínio público do site
const SITE = 'https://viajadoras.com';

// lastmod de cada post vem do frontmatter (updated, senão date), para o Google confiar na data.
const blogDir = new URL('./src/pages/blog/', import.meta.url);
const postDates = Object.fromEntries(
  readdirSync(blogDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(new URL(f, blogDir), 'utf8');
      const field = (k) =>
        text.match(new RegExp(`^${k}: '([\\d-]+)'`, 'm'))?.[1];
      return [
        `/blog/${f.replace(/\.md$/, '')}/`,
        field('updated') ?? field('date'),
      ];
    }),
);

export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      filter: (page) =>
        !['/convite', '/acompanhar', '/404'].includes(
          new URL(page).pathname.replace(/\/$/, ''),
        ),
      // Datas de alterações editoriais significativas; não atualizar a cada build.
      serialize: (item) => {
        const path = new URL(item.url).pathname;
        if (postDates[path]) {
          item.lastmod = new Date(`${postDates[path]}T00:00:00-03:00`);
        } else if (
          path === '/' ||
          path === '/blog/' ||
          [
            '/companhia-para-viajar/',
            '/viagens-para-mulheres/',
            '/companhia-para-sair-goiania/',
            '/viajar-sozinha-mulher/',
            '/grupo-para-viajar/',
            '/viagem-em-grupo-mulheres-seguranca/',
          ].includes(path)
        ) {
          item.lastmod = new Date('2026-10-21T00:00:00-03:00');
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

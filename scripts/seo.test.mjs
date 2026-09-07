import { expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const html = (path) => readFile(new URL(path, dist), 'utf8');

test('sitemap preserva só páginas públicas, com canonical único e metadados', async () => {
  const sitemap = await html('sitemap-0.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.length).toBe(14);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.some((u) => /convite|404|obrigada/.test(u))).toBe(false);
  for (const url of urls) {
    const page = await html(`${new URL(url).pathname.slice(1)}index.html`);
    expect(page.match(/<h1\b/g)?.length).toBe(1);
    expect(page).toContain(`rel="canonical" href="${url}"`);
    expect(page).toContain('name="description"');
    expect(page).not.toContain('noindex');
  }
});

test('404 e convite ficam fora do índice, sem alterar vínculos do app', async () => {
  expect(await html('404.html')).toContain('noindex');
  expect(await html('convite/index.html')).toContain('noindex');
  expect(await html('_redirects')).toContain('/obrigada/ / 301');
  expect(await html('.well-known/assetlinks.json')).toContain(
    'com.viajadoras.app',
  );
  expect(await html('.well-known/apple-app-site-association')).toContain(
    'appID',
  );
});

test('cada artigo tem capa própria, breadcrumb e acesso direto às duas lojas', async () => {
  const folders = (
    await readdir(new URL('blog/', dist), { withFileTypes: true })
  ).filter((d) => d.isDirectory());
  const images = new Set();
  for (const folder of folders) {
    const page = await html(`blog/${folder.name}/index.html`);
    const schemas = [
      ...page.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ].map((m) => JSON.parse(m[1]));
    const article = schemas.find((s) => s['@type'] === 'BlogPosting');
    expect(article.datePublished).toBe(
      [
        'como-dividir-gastos-viagem-entre-amigas',
        'combinar-passeios-amigas-rotinas-diferentes',
      ].includes(folder.name)
        ? '2026-09-07'
        : '2026-09-06',
    );
    expect(article.dateModified >= article.datePublished).toBe(true);
    expect(article.image.length).toBe(1);
    images.add(article.image[0]);
    expect(schemas.some((s) => s['@type'] === 'BreadcrumbList')).toBe(true);
    expect(page).toContain('id="baixar"');
    expect(page).toContain('href="#baixar"');
    expect(page).toContain('apps.apple.com/br/app/viajadoras/id6755790482');
    expect(page).toContain(
      'play.google.com/store/apps/details?id=com.viajadoras.app',
    );
    expect(page).toContain(`property="og:image" content="${article.image[0]}"`);
  }
  expect(images.size).toBe(5);
});

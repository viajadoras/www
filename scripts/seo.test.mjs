import { expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const html = (path) => readFile(new URL(path, dist), 'utf8');

const newPosts = [
  'companhia-feminina-para-sair-goiania',
  'como-achar-companhia-para-viajar-mulher',
  'como-sair-sozinha-e-conhecer-mulheres',
  'grupo-de-viagem-para-mulheres-como-montar',
  'viagens-para-mulheres-brasil-ideias-de-roteiro',
  'roteiro-de-fim-de-semana-sozinha-brasil',
  'como-pedir-ajuda-viajando-sozinha',
  'mala-e-documentos-viagem-mulher-checklist',
];

test('sitemap preserva só páginas públicas, com canonical único e metadados', async () => {
  const sitemap = await html('sitemap-0.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.length).toBe(28);
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
      newPosts.includes(folder.name)
        ? '2026-10-09'
        : [
              'primeira-viagem-sozinha-mulher',
              'viagem-a-trabalho-sozinha-dicas',
            ].includes(folder.name)
          ? '2026-10-04'
          : [
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
  expect(images.size).toBe(folders.length);
});

test('site identifica a empresa oficial sem expor endereço residencial', async () => {
  const about = await html('sobre/index.html');
  const schemas = [
    ...about.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
  const organization = schemas.find((s) => s['@type'] === 'Organization');
  expect(organization.legalName).toBe('VIAJADORAS INOVA SIMPLES (I.S.)');
  expect(organization.taxID).toBe('67102571000108');
  expect(organization.address.streetAddress).toBeUndefined();
  expect(schemas.some((s) => s['@type'] === 'AboutPage')).toBe(true);
  for (const path of [
    'index.html',
    'sobre/index.html',
    'privacidade/index.html',
    'termos/index.html',
  ]) {
    const page = await html(path);
    expect(page).toContain('67.102.571/0001-08');
    expect(page).toContain('https://www.finep.gov.br/');
    expect(page).toContain('/images/apoio/finep.png');
    expect(page).not.toMatch(
      /GT TECNOLOGIA|46\.112\.388|Pedro Paulo|74663|74\.663/,
    );
  }
});

test('home comunica rolês, viagem e confiança com FAQ estruturado', async () => {
  const home = await html('index.html');
  expect(home).toMatch(/<h1[^>]*>[\s\S]*espírito viajante/);
  for (const id of ['como-funciona', 'roles', 'confianca', 'faq', 'baixar']) {
    expect(home).toContain(`id="${id}"`);
  }
  expect(home).toContain('Selfie verificada pela equipe');
  expect(home).toContain('"@type":"FAQPage"');
});

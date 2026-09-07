import { readFile } from 'node:fs/promises';

const origin = 'https://viajadoras.com';
const key = (
  await readFile(new URL('../public/indexnow-key.txt', import.meta.url), 'utf8')
).trim();
const keyLocation = `${origin}/indexnow-key.txt`;
const publishedKey = await fetch(keyLocation);
if (!publishedKey.ok || (await publishedKey.text()).trim() !== key) {
  throw new Error('A chave IndexNow ainda não está publicada corretamente.');
}
const sitemap = await fetch(`${origin}/sitemap-0.xml`);
if (!sitemap.ok) throw new Error(`Sitemap indisponível: ${sitemap.status}`);
const urlList = [
  ...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g),
].map((m) => m[1]);
if (!urlList.length || urlList.some((url) => new URL(url).origin !== origin)) {
  throw new Error('O sitemap não contém apenas URLs do site esperado.');
}
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'viajadoras.com', key, keyLocation, urlList }),
});
console.log(
  JSON.stringify(
    {
      date: new Date().toISOString(),
      status: response.status,
      urls: urlList,
      response: await response.text(),
    },
    null,
    2,
  ),
);
if (![200, 202].includes(response.status)) process.exitCode = 1;

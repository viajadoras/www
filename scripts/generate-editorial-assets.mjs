import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const base = new URL('../', import.meta.url);
const output = new URL('public/images/blog/', base);
await mkdir(output, { recursive: true });
const drawings = [
  {
    slug: 'checklist-antes-de-viajar-com-outra-mulher',
    label: 'ANTES DE RESERVAR',
    lines: ['Uma boa viagem', 'começa na conversa.'],
    art: `<rect x="810" y="140" width="260" height="335" rx="25" fill="#fffaf5" transform="rotate(8 940 307)"/><path d="M853 235l16 16 29-37m-45 95 16 16 29-37m-45 95 16 16 29-37" fill="none" stroke="#946549" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M925 235h90m-90 75h90m-90 75h55" stroke="#d9baa1" stroke-width="12" stroke-linecap="round"/>`,
  },
  {
    slug: 'como-fazer-amigas-em-uma-cidade-nova',
    label: 'AMIZADES NA CIDADE',
    lines: ['A próxima amizade', 'pode começar pequena.'],
    art: `<ellipse cx="860" cy="395" rx="85" ry="19" fill="#ac7755"/><ellipse cx="1040" cy="325" rx="85" ry="19" fill="#ac7755"/><path d="M805 280h108v74a45 45 0 0 1-108 0zM980 210h108v74a45 45 0 0 1-108 0z" fill="#fffaf5"/><path d="M915 300h12a26 26 0 0 1 0 52h-12m174-124h12a26 26 0 0 1 0 52h-12" fill="none" stroke="#fffaf5" stroke-width="14"/><path d="M858 242q-22-22 0-44m176-25q-22-22 0-44" fill="none" stroke="#946549" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    slug: 'como-organizar-primeiro-encontro-de-grupo',
    label: 'ENCONTROS DE GRUPO',
    lines: ['Um encontro simples.', 'Um próximo passo juntas.'],
    art: `<rect x="800" y="165" width="280" height="290" rx="28" fill="#fffaf5"/><path d="M800 240h280" stroke="#d9baa1" stroke-width="10"/><path d="M867 143v48m147-48v48" stroke="#946549" stroke-width="14" stroke-linecap="round"/><circle cx="870" cy="305" r="18" fill="#d9baa1"/><circle cx="945" cy="305" r="18" fill="#d9baa1"/><circle cx="1020" cy="305" r="18" fill="#d9baa1"/><path d="M909 380l23 23 49-54" fill="none" stroke="#946549" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
];
for (const { slug, label, lines, art } of drawings) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f4ebe3"/><circle cx="995" cy="315" r="285" fill="#dec0aa"/><text x="70" y="105" font-family="Georgia,serif" font-size="30" fill="#332a25">Viajadoras</text><text x="70" y="235" font-family="Arial,sans-serif" font-size="19" font-weight="bold" letter-spacing="3" fill="#825134">${label}</text>${lines.map((line, i) => `<text x="70" y="${315 + i * 65}" font-family="Georgia,serif" font-size="43" fill="#332a25">${line}</text>`).join('')}<text x="70" y="535" font-family="Arial,sans-serif" font-size="21" fill="#825134">viajadoras.com/blog</text>${art}</svg>`;
  await writeFile(new URL(`${slug}.svg`, output), svg);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(new URL(`${slug}.jpg`, output).pathname);
}
for (const width of [96, 192]) {
  await sharp(new URL('public/logo.png', base).pathname)
    .resize({ width })
    .webp({ quality: 85 })
    .toFile(new URL(`public/images/logo-${width}.webp`, base).pathname);
}

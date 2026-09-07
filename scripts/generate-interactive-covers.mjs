import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const covers = [
  {
    slug: 'como-dividir-gastos-viagem-entre-amigas',
    label: 'VIAGEM ENTRE AMIGAS',
    lines: ['Planos em comum.', 'Contas combinadas.'],
    art: `<g transform="rotate(-8 860 290)"><path d="M745 130h255v332l-25-15-25 15-25-15-25 15-25-15-25 15-25-15-25 15-25-15-30 15z" fill="#fffaf5"/><path d="M785 190h175M785 230h90M785 292h175" stroke="#d7c1d1" stroke-width="10" stroke-linecap="round"/><text x="785" y="362" font-family="Georgia,serif" font-size="48" fill="#5c3e51">÷ 3</text></g><g fill="#d9baa1" stroke="#946549" stroke-width="3"><circle cx="1040" cy="410" r="42"/><circle cx="950" cy="465" r="42"/><circle cx="850" cy="490" r="42"/></g><g fill="none" stroke="#fffaf5" stroke-width="4"><path d="M1028 410h24m-12-12v24M938 465h24m-12-12v24M838 490h24m-12-12v24"/></g>`,
  },
  {
    slug: 'combinar-passeios-amigas-rotinas-diferentes',
    label: 'AMIZADES NO DIA A DIA',
    lines: ['Um café.', 'Uma hora para vocês.'],
    art: `<g transform="rotate(6 910 285)"><rect x="755" y="125" width="305" height="310" rx="20" fill="#fffaf5"/><path d="M755 205h305" stroke="#d7c1d1" stroke-width="5"/><path d="M820 108v46m175-46v46" stroke="#5c3e51" stroke-width="13" stroke-linecap="round"/><g fill="#d7c1d1"><circle cx="815" cy="258" r="14"/><circle cx="900" cy="258" r="14"/><circle cx="985" cy="258" r="14"/><circle cx="815" cy="335" r="14"/><circle cx="985" cy="335" r="14"/></g><circle cx="900" cy="335" r="32" fill="#744f66"/><path d="m886 334 10 10 20-23" stroke="#fffaf5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g><ellipse cx="1038" cy="490" rx="88" ry="19" fill="#bfa0b5"/><path d="M987 405h100v40a50 50 0 0 1-100 0z" fill="#d9baa1"/><path d="M1087 415h10a23 23 0 0 1 0 46h-10" stroke="#d9baa1" stroke-width="12" fill="none"/><path d="M1037 377q-20-20 0-40" stroke="#744f66" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  },
];
for (const { slug, label, lines, art } of covers) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6f1f5"/><path d="M720 0h480v630H860Q605 315 720 0" fill="#ebdde8"/><circle cx="970" cy="290" r="215" fill="#d7c1d1"/><text x="65" y="95" font-family="Georgia,serif" font-size="31" fill="#33212d">Viajadoras</text><path d="M65 158h65" stroke="#a27d94" stroke-width="3"/><text x="65" y="237" font-family="Arial,sans-serif" font-size="17" font-weight="bold" letter-spacing="2" fill="#744f66">${label}</text>${lines.map((line, i) => `<text x="65" y="${317 + i * 66}" font-family="Georgia,serif" font-size="45" fill="#33212d">${line}</text>`).join('')}<text x="65" y="536" font-family="Arial,sans-serif" font-size="20" fill="#744f66">Um guia para fazer acontecer, juntas.</text>${art}</svg>`;
  const base = new URL(`../public/images/blog/${slug}`, import.meta.url);
  await writeFile(`${base.pathname}.svg`, svg);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(`${base.pathname}.jpg`);
}

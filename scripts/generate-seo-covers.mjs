import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const output = new URL('../public/images/blog/', import.meta.url);
const W = '#fffaf5',
  D = '#d9baa1',
  B = '#946549',
  A = '#ac7755';
const covers = [
  {
    slug: 'companhia-feminina-para-sair-goiania',
    label: 'ROLÊS EM GOIÂNIA',
    lines: ['Sair acompanhada', 'é mais leve.'],
    art: `<path d="M800 440V300h60v-50h70v70h50v-40h60v160z" fill="${W}"/><path d="M820 340h30m-30 40h30m-30 40h30m110-120h30m-30 40h30m-30 40h30m50-20h20m-20 40h20" stroke="${D}" stroke-width="10" stroke-linecap="round"/><path d="M965 180a34 34 0 0 1 34 34c0 28-34 56-34 56s-34-28-34-56a34 34 0 0 1 34-34z" fill="${A}"/><circle cx="965" cy="212" r="11" fill="${W}"/><path d="M780 440h330" stroke="${B}" stroke-width="12" stroke-linecap="round"/>`,
  },
  {
    slug: 'como-achar-companhia-para-viajar-mulher',
    label: 'COMPANHIA DE VIAGEM',
    lines: ['Boa companhia', 'faz a viagem.'],
    art: `<path d="M810 420a190 190 0 0 1 370 0" fill="none" stroke="${D}" stroke-width="12" stroke-dasharray="4 26" stroke-linecap="round"/><circle cx="880" cy="300" r="55" fill="${W}"/><circle cx="1010" cy="300" r="55" fill="${W}"/><circle cx="880" cy="285" r="20" fill="${A}"/><circle cx="1010" cy="285" r="20" fill="${A}"/><path d="M845 335a38 30 0 0 1 70 0m60 0a38 30 0 0 1 70 0" fill="${A}"/><path d="M935 400l-14-14a22 22 0 0 1 31-31l3 3 3-3a22 22 0 0 1 31 31z" fill="${B}" transform="translate(-10 -10)"/>`,
  },
  {
    slug: 'como-sair-sozinha-e-conhecer-mulheres',
    label: 'SAIR SOZINHA',
    lines: ['Um primeiro passo,', 'sem pressa.'],
    art: `<circle cx="995" cy="300" r="120" fill="${W}"/><path d="M995 205l24 95-24 95-24-95z" fill="${A}"/><path d="M995 205l24 95h-48z" fill="${B}"/><circle cx="995" cy="300" r="10" fill="${W}"/><circle cx="995" cy="300" r="148" fill="none" stroke="${B}" stroke-width="10"/><path d="M855 450q140 40 280 0" fill="none" stroke="${D}" stroke-width="12" stroke-linecap="round"/><circle cx="1130" cy="190" r="16" fill="${D}"/><circle cx="860" cy="180" r="12" fill="${D}"/>`,
  },
  {
    slug: 'grupo-de-viagem-para-mulheres-como-montar',
    label: 'GRUPO DE VIAGEM',
    lines: ['Um grupo pequeno,', 'um plano claro.'],
    art: `<rect x="790" y="230" width="270" height="170" rx="36" fill="${W}"/><path d="M830 400v40m190-40v40" stroke="${B}" stroke-width="14" stroke-linecap="round"/><rect x="820" y="270" width="210" height="14" rx="7" fill="${D}"/><rect x="820" y="305" width="150" height="14" rx="7" fill="${D}"/><rect x="820" y="340" width="180" height="14" rx="7" fill="${D}"/><circle cx="1090" cy="220" r="24" fill="${A}"/><circle cx="1130" cy="290" r="24" fill="${A}"/><circle cx="1100" cy="360" r="24" fill="${A}"/><path d="M1070 232l-10 20m50 18l-8 55" stroke="${B}" stroke-width="6" stroke-linecap="round"/><path d="M930 190l30 28 55-60" transform="translate(-60 -30)" fill="none" stroke="${B}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    slug: 'viagens-para-mulheres-brasil-ideias-de-roteiro',
    label: 'ROTEIROS NO BRASIL',
    lines: ['Ideias para ir', 'por todo o Brasil.'],
    art: `<path d="M880 170l120-10 60 70-20 90 40 70-70 70-70-30-60 20-50-90 20-100z" fill="${W}"/><path d="M880 170l120-10 60 70-20 90 40 70-70 70-70-30-60 20-50-90 20-100z" fill="none" stroke="${D}" stroke-width="8" stroke-linejoin="round"/><path d="M890 400q60-90 130-110t50-70" fill="none" stroke="${B}" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/><circle cx="890" cy="400" r="14" fill="${A}"/><path d="M1070 160a30 30 0 0 1 30 30c0 26-30 50-30 50s-30-24-30-50a30 30 0 0 1 30-30z" fill="${A}"/><circle cx="1070" cy="190" r="10" fill="${W}"/>`,
  },
  {
    slug: 'roteiro-de-fim-de-semana-sozinha-brasil',
    label: 'FIM DE SEMANA SOZINHA',
    lines: ['Dois dias, um roteiro', 'leve e seu.'],
    art: `<circle cx="1050" cy="210" r="48" fill="${A}"/><path d="M1050 130v-25m0 210v25m-80-105h-25m210 0h25" stroke="${A}" stroke-width="10" stroke-linecap="round"/><rect x="800" y="270" width="190" height="190" rx="22" fill="${W}"/><path d="M800 325h190" stroke="${D}" stroke-width="10"/><path d="M838 250v40m114-40v40" stroke="${B}" stroke-width="12" stroke-linecap="round"/><rect x="1000" y="340" width="130" height="120" rx="20" fill="${B}"/><path d="M1040 340v-20a25 25 0 0 1 50 0v20" fill="none" stroke="${B}" stroke-width="10"/><path d="M845 380h100m-100 40h60" stroke="${D}" stroke-width="12" stroke-linecap="round"/>`,
  },
  {
    slug: 'como-pedir-ajuda-viajando-sozinha',
    label: 'SEGURANÇA NA VIAGEM',
    lines: ['Saber pedir ajuda', 'também é preparo.'],
    art: `<rect x="880" y="150" width="200" height="320" rx="34" fill="${W}"/><rect x="900" y="185" width="160" height="230" rx="12" fill="${D}" opacity=".5"/><circle cx="980" cy="440" r="10" fill="${D}"/><path d="M980 340a45 45 0 0 1 0-90 45 45 0 0 1 0 90z" fill="${A}"/><path d="M980 335l-30 55 50-25z" fill="${A}"/><path d="M960 295h40m-20-20v40" stroke="${W}" stroke-width="9" stroke-linecap="round"/><path d="M830 250a90 90 0 0 0 0 130m-35-160a130 130 0 0 0 0 190m320-190a130 130 0 0 1 0 190m-35-160a90 90 0 0 1 0 130" fill="none" stroke="${B}" stroke-width="9" stroke-linecap="round"/>`,
  },
  {
    slug: 'mala-e-documentos-viagem-mulher-checklist',
    label: 'MALA E DOCUMENTOS',
    lines: ['Tudo certo antes', 'de sair de casa.'],
    art: `<rect x="810" y="250" width="270" height="200" rx="28" fill="${W}"/><path d="M900 250v-30a25 25 0 0 1 25-25h40a25 25 0 0 1 25 25v30" fill="none" stroke="${B}" stroke-width="13"/><path d="M850 250v200m190-200v200" stroke="${D}" stroke-width="12"/><rect x="1060" y="170" width="105" height="140" rx="12" fill="${B}" transform="rotate(10 1110 240)"/><circle cx="1112" cy="225" r="22" fill="none" stroke="${D}" stroke-width="7" transform="rotate(10 1110 240)"/><path d="M1085 275h55m-55 20h40" stroke="${D}" stroke-width="7" stroke-linecap="round" transform="rotate(10 1110 240)"/><path d="M890 350l25 25 50-60" fill="none" stroke="${B}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    slug: 'o-que-fazer-em-goiania-sozinha',
    label: 'GOIÂNIA SOZINHA',
    lines: ['Um roteiro para', 'cada humor do dia.'],
    art: `<rect x="810" y="200" width="330" height="260" rx="24" fill="${W}"/><path d="M810 290l110-0 90-60 130 110" fill="none" stroke="${D}" stroke-width="10" stroke-linejoin="round"/><path d="M850 420q80-120 150-60t110-110" fill="none" stroke="${B}" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/><circle cx="850" cy="420" r="14" fill="${A}"/><path d="M1110 220a28 28 0 0 1 28 28c0 24-28 46-28 46s-28-22-28-46a28 28 0 0 1 28-28z" fill="${A}"/><circle cx="1110" cy="248" r="9" fill="${W}"/>`,
  },
  {
    slug: 'chapada-dos-veadeiros-sozinha-ou-em-grupo',
    label: 'CHAPADA DOS VEADEIROS',
    lines: ['Natureza para ir', 'sozinha ou em grupo.'],
    art: `<path d="M780 440l130-210 90 120 60-80 100 170z" fill="${W}"/><path d="M910 230l-35 55 35-12 25 22z" fill="${D}"/><path d="M1000 350v90" stroke="${A}" stroke-width="22" stroke-linecap="round"/><path d="M980 440q20 20 40 0" fill="none" stroke="${B}" stroke-width="8"/><circle cx="1090" cy="200" r="38" fill="${A}"/><path d="M830 470q120 30 260 0" fill="none" stroke="${B}" stroke-width="10" stroke-linecap="round"/>`,
  },
  {
    slug: 'pesquisa-mulheres-deixam-de-viajar-sozinhas-seguranca',
    label: 'O QUE A PESQUISA MOSTRA',
    lines: ['Segurança pesa', 'na hora de viajar.'],
    art: `<rect x="810" y="170" width="300" height="290" rx="28" fill="${W}"/><rect x="850" y="330" width="40" height="90" rx="8" fill="${D}"/><rect x="920" y="270" width="40" height="150" rx="8" fill="${A}"/><rect x="990" y="220" width="40" height="200" rx="8" fill="${B}"/><path d="M840 430h210" stroke="${B}" stroke-width="8" stroke-linecap="round"/><path d="M1120 150a30 30 0 0 1 30 30c0 26-30 50-30 50s-30-24-30-50a30 30 0 0 1 30-30z" fill="${A}"/><circle cx="1120" cy="180" r="10" fill="${W}"/>`,
  },
  {
    slug: 'roles-em-goiania-para-fazer-amigas',
    label: 'ROLÊS EM GRUPO',
    lines: ['Mesmo rolê, mesmas', 'pessoas, de novo.'],
    art: `<ellipse cx="960" cy="360" rx="130" ry="70" fill="${W}"/><circle cx="840" cy="250" r="34" fill="${A}"/><circle cx="960" cy="210" r="34" fill="${B}"/><circle cx="1080" cy="250" r="34" fill="${A}"/><circle cx="880" cy="450" r="30" fill="${D}"/><circle cx="1040" cy="450" r="30" fill="${D}"/><path d="M1110 150h90v50h-30l-15 20-5-20h-40z" fill="${W}"/><path d="M1125 172h60" stroke="${A}" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    slug: 'lugares-para-ir-sozinha',
    label: 'LUGARES PARA IR SOZINHA',
    lines: ['Um programa pequeno,', 'só seu.'],
    art: `<path d="M850 350h250" stroke="${B}" stroke-width="12" stroke-linecap="round"/><path d="M880 350v100m190-100v100" stroke="${B}" stroke-width="12" stroke-linecap="round"/><rect x="890" y="318" width="90" height="32" rx="6" fill="${A}"/><path d="M935 318v32" stroke="${W}" stroke-width="5"/><path d="M1000 290h80v30a40 40 0 0 1-80 0z" fill="${W}"/><path d="M1080 300a22 22 0 0 1 0 38" fill="none" stroke="${W}" stroke-width="10" stroke-linecap="round"/><path d="M1025 270q10-18 0-36m30 36q10-18 0-36" fill="none" stroke="${D}" stroke-width="8" stroke-linecap="round"/><path d="M1130 170a32 32 0 0 1 32 32c0 28-32 54-32 54s-32-26-32-54a32 32 0 0 1 32-32z" fill="${A}"/><circle cx="1130" cy="202" r="11" fill="${W}"/>`,
  },
  {
    slug: 'grupos-de-viagem-para-quem-vai-sozinha',
    label: 'GRUPOS DE VIAGEM',
    lines: ['Confira tudo', 'antes de pagar.'],
    art: `<path d="M810 200h250a30 30 0 0 1 30 30v110a30 30 0 0 1-30 30h-170l-60 50v-50a30 30 0 0 1-30-30V230a30 30 0 0 1 30-30z" fill="${W}"/><rect x="850" y="250" width="170" height="14" rx="7" fill="${D}"/><rect x="850" y="285" width="120" height="14" rx="7" fill="${D}"/><rect x="850" y="320" width="150" height="14" rx="7" fill="${D}"/><circle cx="1090" cy="200" r="52" fill="${A}"/><path d="M1090 172v36" stroke="${W}" stroke-width="12" stroke-linecap="round"/><circle cx="1090" cy="228" r="7" fill="${W}"/><rect x="1020" y="380" width="130" height="90" rx="16" fill="${B}"/><path d="M1020 410h130" stroke="${D}" stroke-width="12"/><path d="M1040 445h40" stroke="${D}" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    slug: 'destinos-para-primeira-viagem-sozinha-brasil',
    label: 'PRIMEIRA VIAGEM SOZINHA',
    lines: ['Um destino fácil', 'para começar.'],
    art: `<path d="M880 170l120-10 60 70-20 90 40 70-70 70-70-30-60 20-50-90 20-100z" fill="${W}"/><path d="M880 170l120-10 60 70-20 90 40 70-70 70-70-30-60 20-50-90 20-100z" fill="none" stroke="${D}" stroke-width="8" stroke-linejoin="round"/><path d="M850 400l60-60 70 30 50-90 60 20" fill="none" stroke="${B}" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/><circle cx="850" cy="400" r="12" fill="${A}"/><circle cx="910" cy="340" r="12" fill="${A}"/><circle cx="980" cy="370" r="12" fill="${A}"/><circle cx="1030" cy="280" r="12" fill="${A}"/><path d="M1090 160a30 30 0 0 1 30 30c0 26-30 50-30 50s-30-24-30-50a30 30 0 0 1 30-30z" fill="${B}"/><circle cx="1090" cy="190" r="10" fill="${W}"/>`,
  },
];
for (const { slug, label, lines, art } of covers) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f4ebe3"/><circle cx="995" cy="315" r="285" fill="#dec0aa"/><text x="70" y="105" font-family="Georgia,serif" font-size="30" fill="#332a25">Viajadoras</text><text x="70" y="235" font-family="Arial,sans-serif" font-size="19" font-weight="bold" letter-spacing="3" fill="#825134">${label}</text>${lines.map((l, i) => `<text x="70" y="${315 + i * 65}" font-family="Georgia,serif" font-size="43" fill="#332a25">${l}</text>`).join('')}<text x="70" y="535" font-family="Arial,sans-serif" font-size="21" fill="#825134">viajadoras.com/blog</text>${art}</svg>`;
  await writeFile(new URL(`${slug}.svg`, output), svg);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(new URL(`${slug}.jpg`, output).pathname);
}

const panel = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="${W}"/>`;
const inline = [
  {
    name: 'lugares-para-ir-sozinha-programas',
    art: [0, 1, 2, 3]
      .map((i) => panel(55 + i * 280, 130, 250, 370))
      .join('')
      .concat(
        // cinema
        `<rect x="105" y="215" width="150" height="100" rx="12" fill="${B}"/><rect x="117" y="227" width="126" height="76" rx="6" fill="${D}"/><path d="M165 245l34 20-34 20z" fill="${W}"/><path d="M125 350a22 22 0 0 1 44 0v10h-44zm66 0a22 22 0 0 1 44 0v10h-44z" fill="${A}"/>`,
        // museu
        `<rect x="395" y="205" width="130" height="110" rx="10" fill="${B}"/><rect x="407" y="217" width="106" height="86" rx="4" fill="${D}"/><circle cx="487" cy="243" r="12" fill="${W}"/><path d="M407 303l40-44 30 28 14-14 22 30z" fill="${A}"/><rect x="545" y="240" width="28" height="36" rx="4" fill="${A}" transform="translate(-60 20)"/><path d="M400 360h120m-100 0v40m80-40v40" stroke="${B}" stroke-width="10" stroke-linecap="round"/>`,
        // cafe e livro
        `<path d="M675 290h95v34a47 47 0 0 1-95 0z" fill="${A}"/><path d="M770 300a22 22 0 0 1 0 40" fill="none" stroke="${A}" stroke-width="10" stroke-linecap="round"/><path d="M705 265q10-18 0-34m30 34q10-18 0-34" fill="none" stroke="${D}" stroke-width="8" stroke-linecap="round"/><rect x="660" y="385" width="140" height="20" rx="5" fill="${B}"/><rect x="672" y="365" width="116" height="20" rx="5" fill="${D}"/>`,
        // parque
        `<rect x="1008" y="300" width="24" height="90" rx="8" fill="${B}"/><circle cx="1020" cy="270" r="52" fill="${A}"/><circle cx="982" cy="300" r="34" fill="${A}"/><circle cx="1058" cy="300" r="34" fill="${A}"/><path d="M945 410q75 20 150 0" fill="none" stroke="${D}" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 18"/>`,
        // hora de comecar e de acabar
        [0, 1, 2, 3]
          .map(
            (i) =>
              `<path d="M${105 + i * 280} 455h150" stroke="${D}" stroke-width="8" stroke-linecap="round"/><circle cx="${105 + i * 280}" cy="455" r="10" fill="${B}"/><circle cx="${255 + i * 280}" cy="455" r="10" fill="${B}"/>`,
          )
          .join(''),
      ),
  },
  {
    name: 'lugares-para-ir-sozinha-kit',
    art: `<path d="M470 300h260l30 230H440z" fill="${B}"/><path d="M530 300v-30a70 70 0 0 1 140 0v30" fill="none" stroke="${B}" stroke-width="16" stroke-linecap="round"/><path d="M455 380h290" stroke="${D}" stroke-width="10"/><rect x="540" y="400" width="120" height="60" rx="10" fill="${A}"/><circle cx="600" cy="430" r="12" fill="${W}"/><rect x="300" y="190" width="110" height="140" rx="10" fill="${A}" transform="rotate(-10 355 260)"/><path d="M325 215l60-10m-54 36l60-10" stroke="${W}" stroke-width="8" stroke-linecap="round" transform="rotate(-10 355 260)"/><rect x="800" y="180" width="90" height="170" rx="18" fill="${W}" transform="rotate(8 845 265)"/><rect x="812" y="200" width="66" height="120" rx="6" fill="${D}" transform="rotate(8 845 265)"/><rect x="835" y="190" width="20" height="10" rx="3" fill="${B}" transform="rotate(8 845 265)"/><rect x="846" y="330" width="46" height="14" rx="4" fill="${A}" transform="rotate(8 845 265)"/><path d="M930 400a60 60 0 0 1 120 0" fill="none" stroke="${B}" stroke-width="14" stroke-linecap="round"/><rect x="915" y="395" width="30" height="55" rx="12" fill="${A}"/><rect x="1035" y="395" width="30" height="55" rx="12" fill="${A}"/><rect x="1000" y="130" width="46" height="120" rx="14" fill="${D}" transform="rotate(10 1023 190)"/><rect x="1009" y="115" width="28" height="22" rx="6" fill="${A}" transform="rotate(10 1023 190)"/>`,
  },
  {
    name: 'grupos-de-viagem-para-quem-vai-sozinha-antes-de-pagar',
    art: `${panel(60, 150, 320, 330)}${panel(440, 150, 320, 330)}${panel(820, 150, 320, 330)}<rect x="150" y="205" width="140" height="190" rx="14" fill="${D}"/><path d="M180 250h80m-80 34h80m-80 34h50" stroke="${W}" stroke-width="10" stroke-linecap="round"/><circle cx="270" cy="375" r="34" fill="${A}"/><path d="M254 375l12 12 22-26" fill="none" stroke="${W}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M600 215l80 26v70c0 50-38 82-80 100-42-18-80-50-80-100v-70z" fill="${B}"/><path d="M565 320l26 26 48-56" fill="none" stroke="${W}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><rect x="870" y="260" width="220" height="140" rx="20" fill="${B}"/><path d="M870 300h220" stroke="${D}" stroke-width="22"/><path d="M900 365h70" stroke="${D}" stroke-width="10" stroke-linecap="round"/><rect x="1030" y="345" width="38" height="30" rx="6" fill="${A}"/><rect x="915" y="195" width="90" height="62" rx="8" fill="${A}"/><path d="M935 215h12m14 0h12m14 0h12m-52 24h12m14 0h12m14 0h12" stroke="${W}" stroke-width="8" stroke-linecap="round"/><path d="M396 315h28m-10-10l10 10-10 10m346-10h28m-10-10l10 10-10 10" fill="none" stroke="${B}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    name: 'destinos-para-primeira-viagem-sozinha-brasil-mapa',
    art: `<g transform="translate(-928 -166) scale(1.6)"><path d="M880 170l120-10 60 70-20 90 40 70-70 70-70-30-60 20-50-90 20-100z" fill="${W}" stroke="${D}" stroke-width="5" stroke-linejoin="round"/>${[
      [960, 415],
      [880, 412],
      [885, 350],
      [1025, 372],
      [975, 298],
    ]
      .map(
        ([x, y], i) =>
          `<circle cx="${x}" cy="${y}" r="15" fill="${i % 2 ? B : A}"/><text x="${x}" y="${y + 5.5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${W}">${i + 1}</text>`,
      )
      .join(
        '',
      )}</g><circle cx="190" cy="170" r="70" fill="${D}"/><path d="M190 75v-25m0 215v25m-115-140h-25m230 0h25" stroke="${A}" stroke-width="10" stroke-linecap="round" transform="translate(0 0)"/><rect x="930" y="320" width="190" height="140" rx="24" fill="${B}"/><path d="M990 320v-22a35 35 0 0 1 35 -35h0a35 35 0 0 1 35 35v22" fill="none" stroke="${B}" stroke-width="12"/><path d="M930 372h190" stroke="${D}" stroke-width="10"/><circle cx="1025" cy="372" r="14" fill="${A}"/>`,
  },
  {
    name: 'destinos-para-primeira-viagem-sozinha-brasil-chegada',
    art: `<circle cx="260" cy="170" r="64" fill="${A}"/><path d="M260 70v-28m0 256v-28m-100-100h-28m256 0h28m-198-70l-20-20m196 0l20-20" stroke="${A}" stroke-width="10" stroke-linecap="round" transform="translate(0 0)"/><rect x="0" y="470" width="1200" height="160" fill="${D}"/><rect x="100" y="330" width="320" height="130" rx="28" fill="${B}"/><rect x="130" y="355" width="70" height="50" rx="8" fill="${W}"/><rect x="220" y="355" width="70" height="50" rx="8" fill="${W}"/><rect x="310" y="355" width="70" height="50" rx="8" fill="${W}"/><circle cx="175" cy="465" r="30" fill="${D}" stroke="${B}" stroke-width="14"/><circle cx="355" cy="465" r="30" fill="${D}" stroke="${B}" stroke-width="14"/><rect x="760" y="250" width="280" height="220" rx="16" fill="${W}"/><path d="M740 255l160-80 160 80z" fill="${A}"/><rect x="800" y="300" width="60" height="60" rx="8" fill="${D}"/><rect x="940" y="300" width="60" height="60" rx="8" fill="${D}"/><rect x="870" y="370" width="60" height="100" rx="10" fill="${B}"/><circle cx="830" cy="330" r="8" fill="${A}"/><path d="M470 500q130 30 260-10" fill="none" stroke="${B}" stroke-width="9" stroke-linecap="round" stroke-dasharray="4 20"/><path d="M900 120a30 30 0 0 1 30 30c0 26-30 50-30 50s-30-24-30-50a30 30 0 0 1 30-30z" fill="${B}" transform="translate(0 -20)"/><circle cx="900" cy="130" r="10" fill="${W}"/>`,
  },
];
for (const { name, art } of inline) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img"><rect width="1200" height="630" fill="#f4ebe3"/><circle cx="600" cy="315" r="285" fill="#dec0aa" opacity=".45"/>${art}</svg>`;
  await writeFile(new URL(`${name}.svg`, output), svg);
}

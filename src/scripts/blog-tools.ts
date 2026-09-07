export function invitation(
  activity: string,
  place: string,
  when: string,
  duration: string,
) {
  const clean = (value: string) =>
    value.trim().replace(/\s+/g, ' ').slice(0, 120);
  const values = [activity, place, when, duration].map(clean);
  if (values.some((v) => !v)) return null;
  return `Estou pensando em ${values[0]}, em ${values[1]}, ${values[2]}. A ideia é ficar por ${values[3]}. Você teria vontade de ir? Se não der desta vez, tudo bem.`;
}

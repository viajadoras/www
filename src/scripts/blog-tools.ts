export function splitExpense(amount: string, people: number) {
  if (!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(amount.trim())) return null;
  if (!Number.isInteger(people) || people < 2 || people > 20) return null;
  const cents = Math.round(Number(amount.replace(',', '.')) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100_000_000)
    return null;
  return {
    baseCents: Math.floor(cents / people),
    extraPeople: cents % people,
    people,
  };
}

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

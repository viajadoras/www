export type Person = { id: string; name: string };
export type Entry = {
  id: string;
  description: string;
  cents: number;
  payer: string;
  participants: string[];
  kind: 'expense' | 'transfer';
};
export type Ledger = { people: Person[]; entries: Entry[] };
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
export function parseMoney(value: string): number | null {
  const clean = value.trim();
  if (!/^(?:\d{1,7}|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(clean))
    return null;
  const [whole, fraction = ''] = clean.replaceAll('.', '').split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100_000_000
    ? cents
    : null;
}
export function validateLedger(value: unknown): value is Ledger {
  if (!value || typeof value !== 'object') return false;
  const data = value as Ledger;
  if (
    !Array.isArray(data.people) ||
    !Array.isArray(data.entries) ||
    data.people.length > 20 ||
    data.entries.length > 500
  )
    return false;
  if (
    data.people.some(
      (p) =>
        !p ||
        typeof p.id !== 'string' ||
        typeof p.name !== 'string' ||
        !p.name.trim() ||
        p.name.length > 40,
    )
  )
    return false;
  const ids = new Set(data.people.map((p) => p.id));
  if (
    ids.size !== data.people.length ||
    new Set(data.people.map((p) => p.name.trim().toLocaleLowerCase('pt-BR')))
      .size !== data.people.length
  )
    return false;
  if (new Set(data.entries.map((e) => e?.id)).size !== data.entries.length)
    return false;
  return data.entries.every(
    (e) =>
      e &&
      typeof e.id === 'string' &&
      typeof e.description === 'string' &&
      e.description.trim().length > 0 &&
      e.description.length <= 100 &&
      Number.isSafeInteger(e.cents) &&
      e.cents > 0 &&
      e.cents <= 100_000_000 &&
      ids.has(e.payer) &&
      ['expense', 'transfer'].includes(e.kind) &&
      Array.isArray(e.participants) &&
      e.participants.length > 0 &&
      new Set(e.participants).size === e.participants.length &&
      e.participants.every((id) => ids.has(id)) &&
      (e.kind !== 'transfer' ||
        (e.participants.length === 1 && e.participants[0] !== e.payer)),
  );
}
export function calculateLedger(data: Ledger) {
  if (!validateLedger(data)) throw new Error('Registro inválido.');
  const balances = data.people.map((p) => ({
    ...p,
    paid: 0,
    share: 0,
    balance: 0,
  }));
  const byId = new Map(balances.map((p) => [p.id, p]));
  let total = 0;
  for (const entry of data.entries) {
    const payer = byId.get(entry.payer);
    if (!payer) throw new Error('Participante ausente.');
    payer.balance += entry.cents;
    if (entry.kind === 'transfer') {
      const recipient = byId.get(entry.participants[0]);
      if (!recipient) throw new Error('Participante ausente.');
      recipient.balance -= entry.cents;
    } else {
      total += entry.cents;
      payer.paid += entry.cents;
      // Stable participant order makes the allocation of leftover cents reproducible.
      const participants = balances.filter((p) =>
        entry.participants.includes(p.id),
      );
      const base = Math.floor(entry.cents / participants.length);
      participants.forEach((p, i) => {
        const share = base + (i < entry.cents % participants.length ? 1 : 0);
        p.share += share;
        p.balance -= share;
      });
    }
  }
  const debtors = balances
    .filter((p) => p.balance < 0)
    .map((p) => ({ id: p.id, cents: -p.balance }));
  const creditors = balances
    .filter((p) => p.balance > 0)
    .map((p) => ({ id: p.id, cents: p.balance }));
  const transfers: { from: string; to: string; cents: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const cents = Math.min(debtors[i].cents, creditors[j].cents);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, cents });
    debtors[i].cents -= cents;
    creditors[j].cents -= cents;
    if (!debtors[i].cents) i++;
    if (!creditors[j].cents) j++;
  }
  return { total, balances, transfers };
}
export function ledgerCsv(data: Ledger) {
  const result = calculateLedger(data);
  const name = (id: string) => {
    const person = data.people.find((p) => p.id === id);
    if (!person) throw new Error('Participante ausente.');
    return person.name;
  };
  const decimal = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
  const rows: string[][] = [
    ['Despesas e acertos — Viajadoras'],
    [
      'Tipo',
      'Descrição',
      'Valor (R$)',
      'Quem pagou/enviou',
      'Quem divide/recebe',
    ],
    ...data.entries.map((e) => [
      e.kind === 'expense' ? 'Despesa' : 'Acerto realizado',
      e.description,
      decimal(e.cents),
      name(e.payer),
      e.participants.map(name).join(', '),
    ]),
    [],
    [
      'Pessoa',
      'Pagou em despesas (R$)',
      'Parte nas despesas (R$)',
      'Saldo a receber (+) ou pagar (-) (R$)',
    ],
    ...result.balances.map((p) => [
      p.name,
      decimal(p.paid),
      decimal(p.share),
      decimal(p.balance),
    ]),
    [],
    ['Sugestão de acerto', 'Recebe', 'Valor (R$)'],
    ...result.transfers.map((t) => [
      name(t.from),
      name(t.to),
      decimal(t.cents),
    ]),
    [],
    ['Total de despesas (R$)', decimal(result.total)],
  ];
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => {
            const safe =
              /^[=+@\-\t\r\n]/.test(value) && !/^-?\d+,\d{2}$/.test(value)
                ? `'${value}`
                : value;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(';'),
      )
      .join('\r\n')
  );
}
export function exampleLedger(): Ledger {
  return {
    people: [
      { id: 'ana', name: 'Ana' },
      { id: 'bia', name: 'Bia' },
      { id: 'carla', name: 'Carla' },
    ],
    entries: [
      {
        id: 'hotel',
        description: 'Hospedagem',
        cents: 60000,
        payer: 'ana',
        participants: ['ana', 'bia', 'carla'],
        kind: 'expense',
      },
      {
        id: 'transporte',
        description: 'Transporte',
        cents: 9000,
        payer: 'bia',
        participants: ['ana', 'bia', 'carla'],
        kind: 'expense',
      },
      {
        id: 'passeio',
        description: 'Passeio opcional',
        cents: 12000,
        payer: 'carla',
        participants: ['bia', 'carla'],
        kind: 'expense',
      },
    ],
  };
}

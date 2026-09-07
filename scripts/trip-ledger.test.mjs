import { expect, test } from 'bun:test';
import {
  calculateLedger,
  exampleLedger,
  ledgerCsv,
  parseMoney,
  validateLedger,
} from '../src/scripts/trip-ledger';

test('exemplo do artigo separa o passeio opcional e fecha os saldos', () => {
  const result = calculateLedger(exampleLedger());
  expect(result.total).toBe(81000);
  expect(result.balances.map((p) => p.balance)).toEqual([
    37000, -20000, -17000,
  ]);
  expect(result.transfers).toEqual([
    { from: 'bia', to: 'ana', cents: 20000 },
    { from: 'carla', to: 'ana', cents: 17000 },
  ]);
});
test('registrar os acertos zera saldos sem inflar despesas', () => {
  const data = exampleLedger();
  for (const [i, t] of calculateLedger(data).transfers.entries())
    data.entries.push({
      id: `transfer-${i}`,
      kind: 'transfer',
      description: 'Acerto',
      payer: t.from,
      participants: [t.to],
      cents: t.cents,
    });
  const result = calculateLedger(data);
  expect(result.total).toBe(81000);
  expect(result.transfers).toEqual([]);
  expect(result.balances.map((p) => p.balance)).toEqual([0, 0, 0]);
});
test('centavos e sugestões sempre conservam o saldo total', () => {
  for (let count = 2; count <= 20; count++) {
    const people = Array.from({ length: count }, (_, i) => ({
      id: `p${i}`,
      name: `Pessoa ${i}`,
    }));
    for (const cents of [1, 2, 100, 10000, 100000000]) {
      const data = {
        people,
        entries: [
          {
            id: 'e',
            kind: 'expense',
            description: 'Teste',
            cents,
            payer: 'p0',
            participants: people.map((p) => p.id),
          },
        ],
      };
      const result = calculateLedger(data);
      expect(result.balances.reduce((s, p) => s + p.share, 0)).toBe(cents);
      expect(result.balances.reduce((s, p) => s + p.balance, 0)).toBe(0);
      const balances = new Map(result.balances.map((p) => [p.id, p.balance]));
      for (const t of result.transfers) {
        balances.set(t.from, balances.get(t.from) + t.cents);
        balances.set(t.to, balances.get(t.to) - t.cents);
      }
      expect([...balances.values()].every((v) => v === 0)).toBe(true);
    }
  }
});
test('edição e exclusão recalculam somente os registros restantes', () => {
  const data = exampleLedger();
  data.entries[0].cents = 30000;
  expect(calculateLedger(data).balances.map((p) => p.balance)).toEqual([
    17000, -10000, -7000,
  ]);
  data.entries.pop();
  expect(calculateLedger(data).balances.map((p) => p.balance)).toEqual([
    17000, -4000, -13000,
  ]);
});
test('valores brasileiros e registros inválidos são tratados sem arredondamento oculto', () => {
  expect(parseMoney('1.250,50')).toBe(125050);
  expect(parseMoney('0,01')).toBe(1);
  expect(parseMoney('10,1')).toBe(1010);
  for (const value of ['', '0', '-10', '1.25', '1e3', '1,001', '1.000.000,01'])
    expect(parseMoney(value)).toBeNull();
  const data = exampleLedger();
  data.entries[0].participants = [];
  expect(validateLedger(data)).toBe(false);
  expect(validateLedger({ people: [], entries: [null] })).toBe(false);
  const duplicate = exampleLedger();
  duplicate.entries[0].participants = ['ana', 'ana'];
  expect(validateLedger(duplicate)).toBe(false);
  const self = exampleLedger();
  self.entries[0] = {
    ...self.entries[0],
    kind: 'transfer',
    participants: ['ana'],
  };
  expect(validateLedger(self)).toBe(false);
});
test('exportação preserva acentos, centavos e neutraliza fórmulas em textos', () => {
  const data = exampleLedger();
  data.people[0].name = '=HYPERLINK("x")';
  data.entries[0].description = 'Hotel; quarto "azul"';
  const csv = ledgerCsv(data);
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).toContain('"Hotel; quarto ""azul"""');
  expect(csv).toContain('"\'=HYPERLINK(""x"")"');
  expect(csv).toContain('"370,00"');
});

import { expect, test } from 'bun:test';
import { invitation, splitExpense } from '../src/scripts/blog-tools';

test('divisão preserva cada centavo, inclusive valores pequenos', () => {
  for (const amount of ['100', '0,01', '0', '600,00', '1000000.00']) {
    for (let people = 2; people <= 20; people++) {
      const result = splitExpense(amount, people);
      expect(result.baseCents * people + result.extraPeople).toBe(
        Math.round(Number(amount.replace(',', '.')) * 100),
      );
      expect(result.extraPeople).toBeLessThan(people);
    }
  }
  expect(splitExpense('100', 3)).toEqual({
    baseCents: 3333,
    extraPeople: 1,
    people: 3,
  });
});

test('rejeita valores ambíguos e quantidades inválidas', () => {
  for (const amount of [
    '',
    '-1',
    '1e3',
    '1.000,00',
    '10,001',
    'NaN',
    '1000000.01',
  ])
    expect(splitExpense(amount, 3)).toBeNull();
  for (const people of [0, 1, 21, 2.5, Number.NaN])
    expect(splitExpense('100', people)).toBeNull();
});

test('convite exige dados, normaliza espaços e preserva a possibilidade de recusar', () => {
  expect(invitation('café', '', 'sábado', '1 hora')).toBeNull();
  const result = invitation(
    '  tomar um café  ',
    'um café no centro',
    ' sábado  às 16h ',
    '1 hora',
  );
  expect(result).toBe(
    'Estou pensando em tomar um café, em um café no centro, sábado às 16h. A ideia é ficar por 1 hora. Você teria vontade de ir? Se não der desta vez, tudo bem.',
  );
});

import { expect, test } from 'bun:test';
import { invitation } from '../src/scripts/blog-tools';

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

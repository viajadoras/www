import { afterEach, expect, test } from 'bun:test';
import {
  inviteAppLink,
  recordStoreClick,
  storeClick,
} from '../src/scripts/product-links.ts';

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
});

test('convite preserva somente comunidade e evento válidos', () => {
  expect(inviteAppLink('?grupo=abc-123&encontro=evt_1&email=private')).toBe(
    'viajadoras:///convite?grupo=abc-123&encontro=evt_1',
  );
  expect(inviteAppLink('?grupo=abc')).toBe('viajadoras:///convite?grupo=abc');
});

test('convite rejeita destino ausente, ambíguo, vazio ou malformado', () => {
  for (const query of [
    '',
    '?grupo=',
    '?grupo=abc&grupo=other',
    '?grupo=abc&encontro=',
    '?grupo=abc&encontro=x&encontro=y',
    '?grupo=../abc',
    `?grupo=${'x'.repeat(65)}`,
  ]) {
    expect(inviteAppLink(query)).toBeNull();
  }
});

test('mede apenas links para este aplicativo nas lojas oficiais', () => {
  expect(
    storeClick(
      'https://apps.apple.com/br/app/viajadoras/id6755790482',
      '/ajuda/',
    ),
  ).toEqual({ platform: 'ios', source: '/ajuda' });
  expect(
    storeClick(
      'https://play.google.com/store/apps/details?id=com.viajadoras.app',
      '/',
    ),
  ).toEqual({ platform: 'android', source: '/' });
  for (const href of [
    'not-a-url',
    'https://apps.apple.com.evil.example/id6755790482',
    'https://play.google.com/store/apps/details?id=com.other.app',
    'http://apps.apple.com/br/app/viajadoras/id6755790482',
  ]) {
    expect(storeClick(href, '/')).toBeNull();
  }
});

test('envia contrato first-party sem credenciais nem referrer', async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ ok: true }), { status: 202 });
  };
  await recordStoreClick({ platform: 'ios', source: '/convite' });
  expect(request.url).toBe(
    'https://api.viajadoras.com/api/v1/public/store-clicks',
  );
  expect(request.options).toMatchObject({
    method: 'POST',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true,
  });
  expect(JSON.parse(request.options.body)).toEqual({
    platform: 'ios',
    source: '/convite',
  });
});

test('preserva a origem pública no caminho até a home sem coletar parâmetros pessoais', () => {
  const href = 'https://apps.apple.com/br/app/viajadoras/id6755790482';
  expect(
    storeClick(
      href,
      '/',
      '?origem=%2Fblog%2Fcomo-fazer-amigas-em-uma-cidade-nova%2F&utm_source=instagram',
    ),
  ).toEqual({
    platform: 'ios',
    source: '/blog/como-fazer-amigas-em-uma-cidade-nova',
  });
  expect(storeClick(href, '/blog/artigo/', '?origem=/ajuda')).toEqual({
    platform: 'ios',
    source: '/blog/artigo',
  });
  for (const search of [
    '?origem=https://evil.example',
    '?origem=/blog/private?email=a',
    '?origem=/blog/../private',
    '?origem=/ajuda&origem=/blog',
    '?origem=/users/abc',
  ]) {
    expect(storeClick(href, '/', search)).toEqual({
      platform: 'ios',
      source: '/',
    });
  }
});

test('falha de medição é explícita e não propaga para a navegação', async () => {
  const warnings = [];
  console.warn = (message) => warnings.push(message);
  globalThis.fetch = async () => {
    throw new TypeError('network unavailable');
  };
  await recordStoreClick({ platform: 'android', source: '/' });
  globalThis.fetch = async () => new Response(null, { status: 429 });
  await recordStoreClick({ platform: 'android', source: '/' });
  expect(warnings).toEqual([
    'Não foi possível medir o clique na loja.',
    'A medição do clique na loja não foi aceita.',
  ]);
});

export function inviteAppLink(search: string): string | null {
  const query = new URLSearchParams(search);
  const group = query.get('grupo');
  const event = query.get('encontro');
  const identifier = /^[a-zA-Z0-9_-]{1,64}$/;
  if (
    !group ||
    !identifier.test(group) ||
    query.getAll('grupo').length !== 1 ||
    query.getAll('encontro').length > 1 ||
    (event !== null && !identifier.test(event))
  ) {
    return null;
  }
  const params = new URLSearchParams({ grupo: group });
  if (event) params.set('encontro', event);
  return `viajadoras:///convite?${params}`;
}

export function storeClick(href: string, pathname: string, search = '') {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  let platform: 'ios' | 'android';
  if (
    url.hostname === 'apps.apple.com' &&
    url.pathname.endsWith('/id6755790482')
  ) {
    platform = 'ios';
  } else if (
    url.hostname === 'play.google.com' &&
    url.pathname === '/store/apps/details' &&
    url.searchParams.get('id') === 'com.viajadoras.app'
  ) {
    platform = 'android';
  } else {
    return null;
  }
  let source = pathname.replace(/\/$/, '') || '/';
  if (source === '/') {
    const params = new URLSearchParams(search);
    const origin = params.get('origem')?.replace(/\/$/, '');
    const publicPages = new Set([
      '/blog',
      '/convite',
      '/ajuda',
      '/termos',
      '/privacidade',
      '/viajar-sozinha-mulher',
      '/viagens-para-mulheres',
      '/companhia-para-viajar',
      '/companhia-feminina-para-sair',
    ]);
    if (
      params.getAll('origem').length === 1 &&
      origin &&
      (publicPages.has(origin) || /^\/blog\/[a-z0-9-]{1,150}$/.test(origin))
    ) {
      source = origin;
    }
  }
  return { platform, source };
}

export async function recordStoreClick(click: {
  platform: 'ios' | 'android';
  source: string;
}) {
  try {
    const response = await fetch(
      'https://api.viajadoras.com/api/v1/public/store-clicks',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(click),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true,
      },
    );
    if (!response.ok) {
      console.warn('A medição do clique na loja não foi aceita.');
    }
  } catch {
    console.warn('Não foi possível medir o clique na loja.');
  }
}

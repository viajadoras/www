const API = 'https://api.viajadoras.com/api/v1/public/location-shares/';
const POLL_MS = 30_000;
const STALE_MIN = 25;
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

interface Point {
  lat: number;
  lng: number;
  accuracyM?: number | null;
  recordedAt: string;
}
interface Checkin {
  note?: string | null;
  lat: number;
  lng: number;
  recordedAt: string;
}
interface Share {
  firstName: string;
  status: 'active' | 'ended';
  startedAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  lastMovedAt: string | null;
  points: Point[];
  checkins: Checkin[];
}

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const views = ['loading', 'invalid', 'error', 'content'];
const show = (name: string) => {
  for (const v of views) $(`state-${v}`).hidden = v !== name;
};

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});
function clock(iso: string) {
  const parts = timeFormat.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('hour')}h${get('minute')}`;
}
function duration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const hash = new URLSearchParams(window.location.hash.slice(1)).get('t');
const token = hash && /^[A-Za-z0-9_-]{8,256}$/.test(hash) ? hash : null;

type Result =
  | { kind: 'ok'; share: Share }
  | { kind: 'invalid' | 'rate' | 'network' };

async function load(): Promise<Result> {
  if (!token) return { kind: 'invalid' };
  try {
    const res = await fetch(API + encodeURIComponent(token), {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return { kind: 'invalid' };
    if (res.status === 429) return { kind: 'rate' };
    if (!res.ok) return { kind: 'network' };
    return { kind: 'ok', share: (await res.json()) as Share };
  } catch {
    return { kind: 'network' };
  }
}

interface Source {
  setData(data: object): void;
}
interface MapInstance {
  on(event: 'load', fn: () => void): void;
  addSource(id: string, source: object): void;
  addLayer(layer: object): void;
  getSource(id: string): Source;
  easeTo(o: object): void;
  fitBounds(b: Bounds, o: object): void;
}
interface Bounds {
  extend(p: [number, number]): void;
}
interface MarkerInstance {
  setLngLat(p: [number, number]): MarkerInstance;
  addTo(m: MapInstance): MarkerInstance;
  remove(): void;
}
type MapLibre = {
  Map: new (o: object) => MapInstance;
  Marker: new (o: object) => MarkerInstance;
  LngLatBounds: new () => Bounds;
};
let maplibregl: MapLibre | undefined;
let map: MapInstance | undefined;
let mapReady = false;
let pending: Share | null = null;
let markers: MarkerInstance[] = [];
let fitted = '';
let heartbeatSeen = false;
let latest: Share | null = null;

function circle(p: Point) {
  const r = Math.max(p.accuracyM ?? 0, 0);
  const coords: [number, number][] = [];
  const dLat = r / 111_320;
  const dLng = r / (111_320 * Math.cos((p.lat * Math.PI) / 180) || 1);
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * 2 * Math.PI;
    coords.push([p.lng + dLng * Math.cos(a), p.lat + dLat * Math.sin(a)]);
  }
  return coords;
}

function dot(className: string, text = '') {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function drawMap(share: Share) {
  if (!maplibregl) return;
  const pts = share.points;
  const lineData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: pts.map((p) => [p.lng, p.lat]),
    },
  };
  const last = pts[pts.length - 1];
  const accuracyData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [last?.accuracyM ? circle(last) : []],
    },
  };
  if (!map) {
    const m = new maplibregl.Map({
      container: 'map',
      style: STYLE,
      center: last ? [last.lng, last.lat] : [-49.25, -16.68],
      zoom: last ? 15 : 4,
      attributionControl: false,
      cooperativeGestures: true,
    });
    map = m;
    m.on('load', () => {
      m.addSource('trail', { type: 'geojson', data: lineData });
      m.addSource('accuracy', { type: 'geojson', data: accuracyData });
      m.addLayer({
        id: 'accuracy',
        type: 'fill',
        source: 'accuracy',
        paint: { 'fill-color': '#c96949', 'fill-opacity': 0.15 },
      });
      m.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#91432b', 'line-width': 4 },
      });
      mapReady = true;
      if (pending) drawMap(pending);
    });
  }
  if (!mapReady) {
    pending = share;
    return;
  }
  pending = null;
  map.getSource('trail').setData(lineData);
  map.getSource('accuracy').setData(accuracyData);
  for (const m of markers) m.remove();
  markers = [];
  const bounds = new maplibregl.LngLatBounds();
  for (const p of pts) bounds.extend([p.lng, p.lat]);
  for (const c of share.checkins) {
    markers.push(
      new maplibregl.Marker({
        element: dot(
          'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-success-600 text-sm font-bold text-white shadow',
          '✓',
        ),
      })
        .setLngLat([c.lng, c.lat])
        .addTo(map),
    );
    bounds.extend([c.lng, c.lat]);
  }
  if (last) {
    markers.push(
      new maplibregl.Marker({
        element: dot(
          'h-5 w-5 rounded-full border-[3px] border-white bg-primary-700 shadow',
        ),
      })
        .setLngLat([last.lng, last.lat])
        .addTo(map),
    );
    const key = `${pts.length}:${share.checkins.length}`;
    if (key !== fitted) {
      fitted = key;
      if (pts.length + share.checkins.length === 1) {
        map.easeTo({ center: [last.lng, last.lat], zoom: 15 });
      } else {
        map.fitBounds(bounds, { padding: 48, maxZoom: 17, duration: 600 });
      }
    }
  }
}

function render(share: Share) {
  latest = share;
  show('content');
  const active = share.status === 'active';
  $('title').textContent =
    `${share.firstName} está compartilhando a localização com você`;
  if (!active) $('title').textContent = `Localização de ${share.firstName}`;

  const last = share.points[share.points.length - 1];
  const lastAt = last?.recordedAt;
  $('last-point').textContent = lastAt
    ? `Último ponto às ${clock(lastAt)}${active ? ' · atualiza quando ela se move' : ''}`
    : active
      ? 'Ainda sem pontos. Assim que ela se mover, o mapa aparece aqui.'
      : 'Nenhum ponto foi registrado.';

  const ends = $('ends-at');
  ends.hidden = !active;
  ends.textContent = active ? `Termina às ${clock(share.expiresAt)}` : '';
  $('ended').hidden = active;

  if (
    share.lastSeenAt &&
    (!share.lastMovedAt ||
      Date.parse(share.lastSeenAt) > Date.parse(share.lastMovedAt))
  ) {
    heartbeatSeen = true;
  }
  const idle = share.lastSeenAt
    ? Math.floor((Date.now() - Date.parse(share.lastSeenAt)) / 60_000)
    : 0;
  const stale = $('stale');
  stale.hidden = !(active && heartbeatSeen && idle > STALE_MIN);
  if (!stale.hidden) {
    stale.textContent = `Sem atualização há ${duration(idle)}. O celular dela pode estar sem sinal ou desligado.`;
  }
  $('offline').hidden = true;

  const box = $('checkins-box');
  const list = $('checkins');
  box.hidden = share.checkins.length === 0;
  list.replaceChildren(
    ...share.checkins.map((c) => {
      const li = document.createElement('li');
      li.className =
        'rounded-xl border border-primary-100 bg-white px-4 py-3 shadow-sm';
      const when = document.createElement('p');
      when.className = 'text-sm font-semibold text-primary-800';
      when.textContent = clock(c.recordedAt);
      const note = document.createElement('p');
      note.className = 'text-neutral-900';
      note.textContent = c.note?.trim() || 'Cheguei bem';
      li.append(when, note);
      return li;
    }),
  );

  drawMap(share);
}

let timer: number | undefined;
async function tick() {
  window.clearTimeout(timer);
  const result = await load();
  let next = POLL_MS;
  if (result.kind === 'ok') {
    render(result.share);
    if (result.share.status !== 'active') return;
  } else if (result.kind === 'invalid') {
    show('invalid');
    return;
  } else if (latest) {
    $('offline').hidden = false;
    if (result.kind === 'rate') next = POLL_MS * 2;
  } else {
    const rate = result.kind === 'rate';
    $('error-title').textContent = rate
      ? 'Muitas tentativas'
      : 'Não deu para carregar agora';
    $('error-text').textContent = rate
      ? 'Aguarde um instante e tente de novo.'
      : 'Confira sua conexão e tente de novo.';
    show('error');
    return;
  }
  timer = window.setTimeout(schedule, next);
}

function schedule() {
  if (document.hidden) return;
  void tick();
}

$('retry').addEventListener('click', () => {
  show('loading');
  void tick();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && latest?.status === 'active') void tick();
});

function start() {
  maplibregl = (window as unknown as { maplibregl?: MapLibre }).maplibregl;
  void tick();
}
if (document.readyState === 'complete') start();
else window.addEventListener('load', start);

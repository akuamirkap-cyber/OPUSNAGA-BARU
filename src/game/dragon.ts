import type { Skin } from './progress';

export interface Vec { x: number; y: number }

// =================== PILIHAN BAGIAN (MODULAR) ===================
export type HornId =
  | 'klasik' | 'agung' | 'panjang' | 'banteng' | 'kristal' | 'spiral' | 'karang' | 'sakura'
  | 'duri' | 'nyala' | 'rusa' | 'kambing' | 'tombak' | 'mahkota' | 'unikorn' | 'bulan';
export type EyeId =
  | 'bulat' | 'predator' | 'tenang' | 'kristal' | 'mistis' | 'sabit' | 'galaksi' | 'lentik'
  | 'reptil' | 'bara' | 'teratai' | 'tajam' | 'lembut' | 'kucing' | 'bintang' | 'roh';
export type WingId = 'none' | 'kelelawar' | 'bulu' | 'kristal' | 'aurora' | 'awan' | 'peri' | 'kupu' | 'api' | 'kelopak';
export type FinId = 'duri' | 'layar' | 'jambul' | 'kristal' | 'ombak' | 'api' | 'polos';
export type FrillId = 'none' | 'telinga' | 'leher' | 'lengan' | 'ekor' | 'lengkap';
export type TailId = 'runcing' | 'kipas' | 'api' | 'awan' | 'bunga' | 'kristal' | 'jumbai' | 'panah' | 'phoenix' | 'pita';
export type LegId = 'cakar' | 'elang' | 'qilin' | 'awan' | 'kristal' | 'bulat' | 'sirip' | 'ular';
export type PatternId = 'polos' | 'sisik' | 'belang' | 'totol' | 'awan' | 'rasi' | 'kosmik' | 'seigaiha' | 'bunga' | 'runa' | 'faset';

export interface Parts { horn: HornId; eye: EyeId; wing: WingId; fin: FinId; frill: FrillId; tail: TailId; leg: LegId; pattern: PatternId }
export type PartKey = keyof Parts;
export interface PartOption { id: string; name: string; isNew?: boolean }

export const DEFAULT_PARTS: Parts = { horn: 'rusa', eye: 'bulat', wing: 'none', fin: 'duri', frill: 'none', tail: 'jumbai', leg: 'cakar', pattern: 'sisik' };
export const PART_KEYS: PartKey[] = ['horn', 'eye', 'wing', 'fin', 'frill', 'tail', 'leg', 'pattern'];
export const PART_LABEL: Record<PartKey, string> = { horn: 'Tanduk', eye: 'Mata', wing: 'Sayap', fin: 'Sirip', frill: 'Hiasan', tail: 'Ekor', leg: 'Kaki', pattern: 'Corak' };

const opt = (id: string, name: string, isNew = false): PartOption => ({ id, name, isNew });
export const PART_OPTIONS: Record<PartKey, PartOption[]> = {
  horn: [
    opt('klasik', 'Klasik', true), opt('agung', 'Rusa Bercabang', true), opt('panjang', 'Panjang ke Belakang', true),
    opt('banteng', 'Melengkung', true), opt('kristal', 'Kristal', true), opt('spiral', 'Spiral', true),
    opt('karang', 'Karang Laut', true), opt('sakura', 'Ranting Sakura', true), opt('duri', 'Mahkota Duri', true),
    opt('nyala', 'Api Roh', true), opt('rusa', 'Rusa'), opt('kambing', 'Kambing'), opt('tombak', 'Tombak'),
    opt('mahkota', 'Mahkota'), opt('unikorn', 'Unikorn'), opt('bulan', 'Bulan Sabit'),
  ],
  eye: [
    opt('bulat', 'Bulat'), opt('predator', 'Predator', true), opt('tenang', 'Tenang', true), opt('kristal', 'Kristal', true),
    opt('mistis', 'Mistis', true), opt('sabit', 'Bulan Sabit', true), opt('galaksi', 'Galaksi', true), opt('lentik', 'Lentik', true),
    opt('reptil', 'Reptil', true), opt('bara', 'Bara', true), opt('teratai', 'Teratai', true), opt('tajam', 'Tajam'),
    opt('lembut', 'Terpejam'), opt('kucing', 'Kucing'), opt('bintang', 'Berbinar'), opt('roh', 'Roh'),
  ],
  wing: [
    opt('none', 'Tanpa Sayap'), opt('kelelawar', 'Naga Klasik'), opt('bulu', 'Berbulu'), opt('kristal', 'Kristal', true),
    opt('aurora', 'Aurora', true), opt('awan', 'Awan', true), opt('peri', 'Peri'), opt('kupu', 'Kupu-kupu', true),
    opt('api', 'Phoenix', true), opt('kelopak', 'Kelopak', true),
  ],
  fin: [opt('duri', 'Duri'), opt('layar', 'Layar', true), opt('jambul', 'Jambul Bulu', true), opt('kristal', 'Kristal', true), opt('ombak', 'Ombak', true), opt('api', 'Api', true), opt('polos', 'Tanpa Sirip')],
  frill: [opt('none', 'Tanpa'), opt('telinga', 'Sirip Telinga', true), opt('leher', 'Jumbai Leher', true), opt('lengan', 'Sirip Lengan', true), opt('ekor', 'Sirip Ekor', true), opt('lengkap', 'Lengkap', true)],
  tail: [
    opt('runcing', 'Panjang Meruncing', true), opt('kipas', 'Kipas'), opt('api', 'Nyala Api'), opt('awan', 'Awan', true),
    opt('bunga', 'Daun & Bunga', true), opt('kristal', 'Kristal', true), opt('jumbai', 'Jumbai'), opt('panah', 'Panah'),
    opt('phoenix', 'Phoenix'), opt('pita', 'Pita'),
  ],
  leg: [opt('cakar', 'Cakar Naga'), opt('elang', 'Kaki Burung'), opt('qilin', 'Qilin', true), opt('awan', 'Kaki Awan', true), opt('kristal', 'Cakar Kristal', true), opt('bulat', 'Kaki Bulat'), opt('sirip', 'Sirip')],
  pattern: [
    opt('polos', 'Polos'), opt('sisik', 'Sisik'), opt('belang', 'Belang'), opt('totol', 'Totol'), opt('awan', 'Awan'), opt('rasi', 'Rasi Bintang'),
    opt('kosmik', 'Kosmik', true), opt('seigaiha', 'Ombak Seigaiha', true), opt('bunga', 'Sakura', true), opt('runa', 'Rune Cahaya', true), opt('faset', 'Faset Kristal', true),
  ],
};

export function sanitizeParts(p?: Partial<Record<PartKey, string>> | null): Parts {
  const out: Record<PartKey, string> = { ...DEFAULT_PARTS };
  if (p) for (const k of PART_KEYS) {
    const v = p[k];
    if (v && PART_OPTIONS[k].some((q) => q.id === v)) out[k] = v;
  }
  return out as Parts;
}
export function randomParts(): Parts {
  const out = {} as Record<PartKey, string>;
  for (const k of PART_KEYS) { const q = PART_OPTIONS[k]; out[k] = q[Math.floor(Math.random() * q.length)].id; }
  return out as Parts;
}
export function partName(k: PartKey, id: string) {
  return PART_OPTIONS[k].find((q) => q.id === id)?.name ?? id;
}

// =================== UTIL WARNA & BENTUK ===================
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const cache = new Map<string, number[]>();
export function rgbOf(c: string): number[] {
  let v = cache.get(c);
  if (!v) {
    if (c[0] === '#') { const n = parseInt(c.slice(1, 7), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    else { const m = c.match(/[\d.]+/g); v = m ? m.slice(0, 3).map(Number) : [255, 255, 255]; }
    cache.set(c, v);
  }
  return v;
}
export function hexA(c: string, a: number) { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; }
export function shade(c: string, k: number, a = 1) {
  const [r, g, b] = rgbOf(c);
  const to = k < 0 ? 0 : 255, t = Math.abs(k);
  return `rgba(${Math.round(r + (to - r) * t)},${Math.round(g + (to - g) * t)},${Math.round(b + (to - b) * t)},${a})`;
}
const mixStr = (A: number[], B: number[], f: number, a: number) =>
  `rgba(${Math.round(A[0] + (B[0] - A[0]) * f)},${Math.round(A[1] + (B[1] - A[1]) * f)},${Math.round(A[2] + (B[2] - A[2]) * f)},${a})`;
export function pick(cols: string[], u: number, a = 1) {
  const n = cols.length;
  if (n === 1) return hexA(cols[0], a);
  const x = clamp(u, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(x));
  return mixStr(rgbOf(cols[i]), rgbOf(cols[i + 1]), x - i, a);
}
export function cyc(cols: string[], u: number, a = 1) {
  const n = cols.length, x = (((u % 1) + 1) % 1) * n, i = Math.floor(x);
  return mixStr(rgbOf(cols[i % n]), rgbOf(cols[(i + 1) % n]), x - i, a);
}
export function lin(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, cols: string[], phase?: number, alpha = 1) {
  const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  if (phase === undefined) { const n = cols.length; cols.forEach((c, i) => g.addColorStop(n === 1 ? 0 : i / (n - 1), hexA(c, alpha))); }
  else for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, cyc(cols, i / 8 + phase, alpha));
  return g;
}
function quad(a: Vec, c: Vec, b: Vec, n = 8): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, m = 1 - t; out.push({ x: m * m * a.x + 2 * m * t * c.x + t * t * b.x, y: m * m * a.y + 2 * m * t * c.y + t * t * b.y }); }
  return out;
}
function cubic(a: Vec, c1: Vec, c2: Vec, b: Vec, n = 10): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    out.push({ x: m * m * m * a.x + 3 * m * m * t * c1.x + 3 * m * t * t * c2.x + t * t * t * b.x, y: m * m * m * a.y + 3 * m * m * t * c1.y + 3 * m * t * t * c2.y + t * t * t * b.y });
  }
  return out;
}
export function taper(ctx: CanvasRenderingContext2D, P: Vec[], w0: number, w1: number) {
  const n = P.length;
  if (n < 2) return;
  const L: Vec[] = [], R: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const hw = lerp(w0, w1, i / (n - 1)) / 2;
    L.push({ x: P[i].x - dy * hw, y: P[i].y + dx * hw });
    R.push({ x: P[i].x + dy * hw, y: P[i].y - dx * hw });
  }
  ctx.beginPath();
  ctx.moveTo(L[0].x, L[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
  ctx.closePath();
  ctx.fill();
}
function circ(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); ctx.fill(); }
function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); }
function seg(ctx: CanvasRenderingContext2D, a: Vec, b: Vec) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function polyFill(ctx: CanvasRenderingContext2D, P: Vec[]) {
  ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y);
  for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
  ctx.closePath(); ctx.fill();
}
function smoothClosed(ctx: CanvasRenderingContext2D, P: Vec[]) {
  const n = P.length, m = (a: Vec, b: Vec) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const s = m(P[n - 1], P[0]);
  ctx.beginPath(); ctx.moveTo(s.x, s.y);
  for (let i = 0; i < n; i++) { const e = m(P[i], P[(i + 1) % n]); ctx.quadraticCurveTo(P[i].x, P[i].y, e.x, e.y); }
  ctx.closePath();
}
export function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const i = r * 0.32;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + i, y - i); ctx.lineTo(x + r, y); ctx.lineTo(x + i, y + i);
  ctx.lineTo(x, y + r); ctx.lineTo(x - i, y + i); ctx.lineTo(x - r, y); ctx.lineTo(x - i, y - i);
  ctx.closePath(); ctx.fill();
}
// kristal heksagonal tembus pandang
export function shard(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, wd: number, glow: string, alpha = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const P = (s: number, k: number): Vec => ({ x: a.x + ux * L * s + nx * wd * k, y: a.y + uy * L * s + ny * wd * k });
  const pts = [P(0, 0.32), P(0.22, 0.5), P(0.8, 0.36), P(1, 0), P(0.8, -0.36), P(0.22, -0.5), P(0, -0.32)];
  const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  g.addColorStop(0, `rgba(${glow},${0.6 * alpha})`);
  g.addColorStop(1, `rgba(255,255,255,${0.92 * alpha})`);
  ctx.fillStyle = g; polyFill(ctx, pts);
  ctx.fillStyle = `rgba(255,255,255,${0.3 * alpha})`; polyFill(ctx, [P(0, 0.32), P(0.22, 0.5), P(0.8, 0.36), P(1, 0), P(0.25, 0.04)]);
  ctx.strokeStyle = `rgba(255,255,255,${0.7 * alpha})`; ctx.lineWidth = 0.55;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
}
function flame(ctx: CanvasRenderingContext2D, at: (a: number, b: number) => Vec, len: number, wid: number, t: number, wv: number, col: string) {
  const L: Vec[] = [], R: Vec[] = [];
  for (let j = 0; j <= 10; j++) {
    const s = j / 10;
    const hw = Math.pow(Math.max(0, Math.sin(Math.min(1, s * 1.12) * Math.PI)), 0.8) * wid * (1 - s * 0.35);
    const wob = Math.sin(t * 13 - s * 7) * wid * 0.32 * s * wv;
    L.push(at(s * len, hw + wob)); R.push(at(s * len, -hw + wob));
  }
  ctx.fillStyle = col;
  polyFill(ctx, [...L, ...R.reverse()]);
}
function blossom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.fillStyle = 'rgba(255,196,220,0.96)';
  for (let k = 0; k < 5; k++) { const a = rot + (k * Math.PI * 2) / 5; ell(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.36, a); }
  ctx.fillStyle = 'rgba(255,236,170,1)'; circ(ctx, x, y, r * 0.28);
}
function cloudPuff(ctx: CanvasRenderingContext2D, c: Vec, r: number, glow: string, dir: Vec) {
  const P = [[0, 0, 1], [0.9, 0.15, 0.72], [-0.85, 0.1, 0.66]] as const;
  ctx.fillStyle = `rgba(${glow},0.45)`;
  for (const [k, q, s] of P) circ(ctx, c.x + dir.x * r * k + 0.7, c.y + dir.y * r * k + r * q + 1, r * s);
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  for (const [k, q, s] of P) circ(ctx, c.x + dir.x * r * k, c.y + dir.y * r * k + r * q * 0.5, r * s * 0.92);
}
function rings(ctx: CanvasRenderingContext2D, P: Vec[], w0: number, w1: number, every: number) {
  ctx.strokeStyle = 'rgba(0,0,0,0.17)'; ctx.lineWidth = 0.6;
  for (let k = every; k < P.length - 2; k += every) {
    const a = P[k], b = P[k + 1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, hw = lerp(w0, w1, k / (P.length - 1)) / 2;
    seg(ctx, { x: a.x + nx * hw, y: a.y + ny * hw }, { x: a.x - nx * hw, y: a.y - ny * hw });
  }
}

// =================== GEOMETRI TUBUH ===================
// jumlah ruas tubuh (1.7× lebih panjang dari versi awal 30 ruas)
export const BODY_N = 51;
export interface DragonGeo { pts: Vec[]; ups: Vec[]; w: number[]; N: number }

export function dragonGeo(b: Vec[], t: number, spd: number, limp = false, bodyScale = 1.5): DragonGeo {
  const N = b.length;
  const pts: Vec[] = [], ups: Vec[] = [], w: number[] = [];
  const bs = clamp(bodyScale, 0.7, 2.5);
  for (let i = 0; i < N; i++) {
    const p0 = b[Math.max(0, i - 1)], p1 = b[Math.min(N - 1, i + 1)];
    let tx = p0.x - p1.x, ty = p0.y - p1.y;
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const ux = ty, uy = -tx;
    const amp = limp ? 0 : (i / N) * 7 * (1 - clamp((spd - 300) / 600, 0, 0.6));
    const o = Math.sin(t * 5.5 - i * (15 / N)) * amp;
    pts.push({ x: b[i].x + ux * o, y: b[i].y + uy * o });
    ups.push({ x: ux, y: uy });
    const u = i / (N - 1);
    w.push(Math.max(1.2 * bs, 10.5 * bs * Math.pow(1 - u, 0.7) * (u < 0.1 ? 0.8 + u * 2 : 1)));
  }
  return { pts, ups, w, N };
}

interface Fr { p: Vec; u: Vec; f: Vec; w: number }
function fr(g: DragonGeo, fi: number): Fr {
  const i = clamp(Math.floor(fi), 0, g.N - 2), k = clamp(fi - i, 0, 1);
  const a = g.pts[i], b = g.pts[i + 1], ua = g.ups[i], ub = g.ups[i + 1];
  // u tidak dinormalisasi → saat pusaran, fitur tubuh memipih & berpindah sisi dengan mulus
  let fx = a.x - b.x, fy = a.y - b.y;
  const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
  return { p: { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }, u: { x: lerp(ua.x, ub.x, k), y: lerp(ua.y, ub.y, k) }, f: { x: fx, y: fy }, w: lerp(g.w[i], g.w[i + 1], k) };
}
const off = (F: Fr, k: number): Vec => ({ x: F.p.x + F.u.x * k, y: F.p.y + F.u.y * k });

// titik duduk penunggang (pangkal leher) + titik pegangan di surai naga
export function seatFrame(g: DragonGeo) {
  const F = fr(g, 4.2), G = fr(g, 2.2);
  return { seat: off(F, F.w * 0.82), f: F.f, u: F.u, grip: off(G, G.w + 3) };
}

// puntiran per ruas (Pusaran Naga & guling saat berbalik arah): sisi punggung/perut berputar mengelilingi tubuh
export function twistGeo(g: DragonGeo, tw: number[]): DragonGeo {
  return { pts: g.pts, w: g.w, N: g.N, ups: g.ups.map((u, i) => { const c = Math.cos(tw[i] || 0); return { x: u.x * c, y: u.y * c }; }) };
}

function bodyPath(ctx: CanvasRenderingContext2D, g: DragonGeo) {
  const { pts, ups, w, N } = g;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const x = pts[i].x + ups[i].x * w[i], y = pts[i].y + ups[i].y * w[i];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let i = N - 1; i >= 0; i--) ctx.lineTo(pts[i].x - ups[i].x * w[i], pts[i].y - ups[i].y * w[i]);
  ctx.closePath();
}

// =================== MATERIAL PREMIUM ===================
type Fill = string | CanvasGradient;
interface Mat { body: Fill; fin: Fill; finSolid: string; wing: string[]; head: string; shine: number; phase: number }
const IRI = ['#ff9ad5', '#ffd27a', '#9dffb0', '#7ae0ff', '#b38cff'];
const PEARL = ['#ffd6ec', '#d6ecff', '#dcffe9', '#fff1d6', '#e8dcff'];

function material(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, t: number, shine: number): Mat {
  const head = g.pts[0], tail = g.pts[g.N - 1], ref = g.pts[Math.min(8, g.N - 1)];
  const heading = Math.atan2(head.y - ref.y, head.x - ref.x);
  const fx = skin.fx;
  const phase = fx === 'aurora' ? t * 0.06 : fx === 'iri' ? t * 0.08 + heading * 0.35 : fx === 'pearl' ? t * 0.05 + heading * 0.25 : 0;
  const anim = fx === 'aurora' ? phase : undefined;
  return {
    body: skin.grad ? lin(ctx, head, tail, skin.grad, anim) : lin(ctx, head, tail, [skin.body, skin.dark]),
    fin: skin.finGrad ? lin(ctx, head, tail, skin.finGrad, anim) : skin.fin,
    finSolid: skin.fin,
    wing: skin.wingGrad ?? skin.finGrad ?? [skin.body, skin.fin],
    head: skin.grad ? (anim !== undefined ? cyc(skin.grad, phase) : skin.grad[0]) : skin.body,
    shine: clamp(shine, 0, 1),
    phase,
  };
}

function drawSheen(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, t: number) {
  const fx = skin.fx, sh = M.shine;
  if (!fx || sh < 0.02) return;
  const { pts, w, N } = g;
  const head = pts[0], tail = pts[N - 1];
  const P = (fi: number, k: number) => { const F = fr(g, fi); return off(F, F.w * k); };
  if (fx === 'iri' || fx === 'pearl') {
    const pal = fx === 'iri' ? IRI : PEARL, A = (fx === 'iri' ? 0.5 : 0.36) * sh;
    for (let b = 0; b < 4; b++) {
      const k = -0.62 + b * 0.42, R: Vec[] = [];
      for (let i = 0; i < N - 2; i++) R.push(P(i, k));
      ctx.fillStyle = lin(ctx, head, tail, pal, M.phase + b * 0.21, A);
      taper(ctx, R, 7.5, 1.2);
    }
  } else if (fx === 'galaxy') {
    const neb: [number, string][] = [[4, '255,110,210'], [10, '110,170,255'], [16, '190,120,255'], [22, '255,140,200'], [26, '120,220,255']];
    for (const [i0, c] of neb) {
      const i = Math.floor((i0 * N) / 30);
      const q = P(i, 0.3 * Math.sin(i * 1.3)), r = w[Math.min(N - 1, i)] * 2.2 + 3;
      const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      gr.addColorStop(0, `rgba(${c},${0.3 + 0.25 * sh})`); gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr; circ(ctx, q.x, q.y, r);
    }
    for (let i = 1; i < N - 3; i++) for (let k = 0; k < 2; k++) {
      const h = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453, hr = h - Math.floor(h);
      const q = P(i + hr, (hr - 0.5) * 1.6);
      const tw = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + i * 1.7 + k * 2));
      ctx.fillStyle = `rgba(255,255,255,${tw * (0.5 + 0.5 * sh)})`;
      if ((i + k) % 5 === 0) star4(ctx, q.x, q.y, 1.6 * tw + 0.4); else circ(ctx, q.x, q.y, 0.55);
    }
  } else if (fx === 'aurora') {
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.11 + k * 0.27) % 1, fi = 1 + u * (N - 4), q = P(fi, 0.15), r = w[Math.floor(fi)] * 1.5 + 2;
      const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      gr.addColorStop(0, `rgba(255,255,255,${0.32 * sh})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; circ(ctx, q.x, q.y, r);
    }
    const R: Vec[] = [];
    for (let i = 0; i < N - 3; i++) R.push(P(i, 0.45 + 0.12 * Math.sin(t * 2 + i * 0.4)));
    ctx.fillStyle = lin(ctx, head, tail, ['#eafff6', '#d6f6ff', '#efe0ff'], undefined, 0.38 * sh);
    taper(ctx, R, 3, 0.6);
  } else if (fx === 'celestial') {
    for (let i = 2; i < N - 3; i += 2) {
      const h = Math.sin(i * 91.7) * 43758.5453, hr = h - Math.floor(h);
      const q = P(i + hr, (hr - 0.5) * 1.2), tw = Math.max(0, Math.sin(t * 2.6 + i * 1.1));
      ctx.fillStyle = i % 3 ? `rgba(255,255,240,${tw * sh})` : `rgba(140,170,255,${tw * sh * 0.9})`;
      star4(ctx, q.x, q.y, 0.6 + tw * 2);
    }
  }
}

// =================== MENGGAMBAR NAGA ===================
export interface DrawOpts {
  t: number; spd?: number; boost?: number; star?: number; shine?: number;
  flap?: number; amp?: number; fold?: number; limp?: boolean; saddle?: string; grip?: Vec | null; glow?: number;
  bank?: number; flutter?: number; twist?: number[]; ang?: number;
  bodyScale?: number; headScale?: number; hornScale?: number;
}

export function paintDragon(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, parts: Parts, op: DrawOpts) {
  const { pts, w, N } = g;
  if (N < 8) return;
  const t = op.t, boost = op.boost ?? 0, star = op.star ?? 0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const M = material(ctx, g, skin, t, op.shine ?? 0.6);
  // Pusaran Naga: gelombang puntiran merambat dari bahu ke ekor; sirip, perut, corak & kaki berputar mengelilingi tubuh
  const tw = op.twist;
  const gF: DragonGeo = tw ? twistGeo(g, tw) : g;
  const ups = gF.ups;
  const spine = () => { ctx.beginPath(); pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))); ctx.stroke(); };

  if (op.glow && op.glow > 0) { ctx.strokeStyle = lin(ctx, pts[0], pts[N - 1], IRI, t * 0.5, 0.22 * op.glow); ctx.lineWidth = 36; spine(); }
  if (boost > 0) { ctx.strokeStyle = `rgba(${skin.glow},${0.22 * clamp(boost, 0, 1)})`; ctx.lineWidth = 28; spine(); }
  if (star > 0.3) {
    // cahaya malam lembut di sekitar kepala (gradien, bukan lingkaran tegas)
    const hg = ctx.createRadialGradient(pts[0].x, pts[0].y, 0, pts[0].x, pts[0].y, 48);
    hg.addColorStop(0, `rgba(${skin.glow},${0.17 * star})`);
    hg.addColorStop(1, `rgba(${skin.glow},0)`);
    ctx.fillStyle = hg; circ(ctx, pts[0].x, pts[0].y, 48);
  }

  drawWing(ctx, gF, skin, M, parts.wing, op, true);
  drawLegs(ctx, gF, skin, M, parts.leg, parts.frill === 'lengan' || parts.frill === 'lengkap', op, 'far');
  drawDorsal(ctx, gF, skin, M, parts.fin, op);
  drawTail(ctx, gF, skin, M, parts.tail, op);

  if (skin.fx === 'galaxy' || skin.fx === 'celestial' || skin.fx === 'aurora') {
    ctx.strokeStyle = `rgba(${skin.glow},${0.3 * M.shine})`; ctx.lineWidth = 4; bodyPath(ctx, g); ctx.stroke();
  }
  ctx.fillStyle = M.body;
  bodyPath(ctx, g); ctx.fill();
  ctx.save(); bodyPath(ctx, g); ctx.clip(); drawPattern(ctx, gF, skin, parts.pattern, t); drawSheen(ctx, gF, skin, M, t); ctx.restore();
  if (parts.frill === 'ekor' || parts.frill === 'lengkap') drawTailFrill(ctx, gF, M);

  // perut & garis cahaya punggung
  ctx.strokeStyle = skin.belly; ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 1; i < N - 3; i++) { const k = w[i] * 0.55; const x = pts[i].x - ups[i].x * k, y = pts[i].y - ups[i].y * k; if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${(skin.shimmer ? 0.25 : 0.08) + 0.32 * M.shine})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let i = 1; i < N - 4; i++) { const k = w[i] * 0.62; const x = pts[i].x + ups[i].x * k, y = pts[i].y + ups[i].y * k; if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  if (skin.shimmer) {
    const sweep = ((t * 0.7) % 1.7) - 0.35;
    for (let i = 1; i < N - 3; i++) {
      const k = Math.max(0, 1 - Math.abs(i / (N - 1) - sweep) * 6);
      if (k <= 0) continue;
      const w0 = w[i] * 0.45, w1 = w[i + 1] * 0.45;
      ctx.strokeStyle = `rgba(255,253,235,${0.9 * k * (0.4 + 0.6 * M.shine)})`;
      ctx.lineWidth = 0.8 + 3 * k;
      seg(ctx, { x: pts[i].x + ups[i].x * w0, y: pts[i].y + ups[i].y * w0 }, { x: pts[i + 1].x + ups[i + 1].x * w1, y: pts[i + 1].y + ups[i + 1].y * w1 });
    }
  }

  // tangan & kaki sisi dekat — di depan tubuh agar terlihat jelas dan gagah
  drawLegs(ctx, gF, skin, M, parts.leg, parts.frill === 'lengan' || parts.frill === 'lengkap', op, 'near');

  // pelana
  if (op.saddle) {
    const top = (i: number, k: number): Vec => ({ x: pts[i].x + ups[i].x * w[i] * k, y: pts[i].y + ups[i].y * w[i] * k });
    ctx.fillStyle = op.saddle;
    polyFill(ctx, [top(3, 1.1), top(4, 1.16), top(5, 1.14), top(6, 1.06), top(6, 0.42), top(5, 0.3), top(4, 0.32), top(3, 0.5)]);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    polyFill(ctx, [top(3, 1.1), top(4, 1.16), top(5, 1.14), top(6, 1.06), top(6, 0.9), top(4, 0.98), top(3, 0.95)]);
    ctx.strokeStyle = 'rgba(40,25,25,0.5)'; ctx.lineWidth = 1.1;
    seg(ctx, top(5, 0.3), top(5, -1));
  }

  drawMane(ctx, gF, skin, op);
  drawHead(ctx, gF, skin, M, parts, op);
  drawWing(ctx, gF, skin, M, parts.wing, op, false);
}

// =================== SURAI (tempat penunggang berpegangan) ===================
function drawMane(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, op: DrawOpts) {
  const wv = op.limp ? 0.25 : 1, grip = op.limp ? null : op.grip ?? null;
  for (let k = 4; k >= 0; k--) {
    const P: Vec[] = [];
    for (let j = 0; j <= 10; j++) {
      const s = j / 10, fi = 0.3 + s * 6.2, F = fr(g, fi);
      const h = F.w * (0.62 + k * 0.1) + 1 + s * (3 + k * 1.5) + Math.sin(op.t * 6 - s * 6 + k * 1.3) * 1.8 * s * wv;
      let x = F.p.x + F.u.x * h - F.f.x * s * 3, y = F.p.y + F.u.y * h - F.f.y * s * 3;
      if (grip) { const m = Math.exp(-(((fi - 2.2) / 0.9) ** 2)) * 0.82; x += (grip.x - x) * m; y += (grip.y - y) * m; }
      P.push({ x, y });
    }
    ctx.fillStyle = skin.maneGrad ? lin(ctx, P[0], P[10], skin.maneGrad) : k % 2 ? shade(skin.mane, -0.12) : skin.mane;
    taper(ctx, P, 3.4 - k * 0.3, 0.5);
  }
}

// =================== SAYAP ===================
const WING_DIMS: Record<Exclude<WingId, 'none'>, [number, number]> = {
  kelelawar: [58, 38], bulu: [60, 36], kristal: [56, 36], aurora: [62, 44], awan: [54, 34], peri: [46, 30], kupu: [46, 40], api: [58, 36], kelopak: [52, 34],
};

function drawWing(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, type: WingId, op: DrawOpts, far: boolean) {
  if (type === 'none') return;
  const F = fr(g, 7);
  const b = { x: -F.f.x, y: -F.f.y }, u = F.u;
  const root = { x: F.p.x + u.x * F.w * 0.55 + F.f.x * (far ? 3 : 0), y: F.p.y + u.y * F.w * 0.55 + F.f.y * (far ? 3 : 0) };
  const fold = op.limp ? 1 : clamp(op.fold ?? 0, 0, 1);
  const rate = type === 'peri' ? 2.4 : type === 'kupu' ? 0.8 : 1;
  const ph = (op.flap ?? op.t * 6) * rate + (far ? 0.45 : 0);
  const amp = op.limp ? 0 : (op.amp ?? 0.5);
  // sayap kiri/kanan menyesuaikan sudut saat berbelok (bank) & bergetar halus saat menembus kabut (flutter)
  const beta = lerp(0.75, 0.3, fold) + amp * 1.1 * Math.sin(ph) * lerp(1, 0.25, fold)
    + (far ? 1 : -1) * (op.bank ?? 0) * 0.24
    + Math.sin(op.t * 31 + (far ? 1.3 : 0)) * 0.07 * (op.flutter ?? 0);
  const lift = Math.sin(beta);
  const sweep = lerp(0.4, 1.0, fold) + 0.1 * Math.cos(ph) * (1 - fold);
  const [L0, C0] = WING_DIMS[type];
  const L = L0 * (far ? 0.9 : 1), C = C0 * (far ? 0.9 : 1);
  const S = { x: (b.x * sweep + u.x * lift) * L, y: (b.y * sweep + u.y * lift) * L };
  const cb = lerp(1, 0.35, fold), cu = -lerp(0.18, 0.75, fold), cl = Math.hypot(cb, cu);
  const Cv = { x: ((b.x * cb + u.x * cu) / cl) * C, y: ((b.y * cb + u.y * cu) / cl) * C };
  const P = (s: number, q: number): Vec => ({ x: root.x + S.x * s + Cv.x * q, y: root.y + S.y * s + Cv.y * q });
  const stops = far ? M.wing.map((c) => shade(c, -0.3)) : M.wing;
  const t = op.t;

  switch (type) {
    case 'kelelawar': {
      const wrist = P(0.5, -0.05), t1 = P(1.0, 0.02), t2 = P(0.84, 0.44), t3 = P(0.56, 0.74), base = P(0.02, 0.62);
      ctx.fillStyle = lin(ctx, root, t2, stops, undefined, 0.95);
      const sc = (a: Vec, c: Vec, k = 0.3): Vec => ({ x: ((a.x + c.x) / 2) * (1 - k) + wrist.x * k, y: ((a.y + c.y) / 2) * (1 - k) + wrist.y * k });
      ctx.beginPath();
      ctx.moveTo(root.x, root.y); ctx.lineTo(wrist.x, wrist.y); ctx.lineTo(t1.x, t1.y);
      let c = sc(t1, t2); ctx.quadraticCurveTo(c.x, c.y, t2.x, t2.y);
      c = sc(t2, t3); ctx.quadraticCurveTo(c.x, c.y, t3.x, t3.y);
      c = sc(t3, base, 0.2); ctx.quadraticCurveTo(c.x, c.y, base.x, base.y);
      ctx.closePath(); ctx.fill();
      if (skin.fx === 'galaxy' || skin.fx === 'celestial') {
        ctx.save(); ctx.clip();
        for (let k = 0; k < 9; k++) {
          const sp = P(0.1 + ((k * 0.37) % 0.8), 0.08 + ((k * 0.53) % 0.55));
          ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 3 + k * 1.7)})`;
          star4(ctx, sp.x, sp.y, 1.1 + (k % 3) * 0.45);
        }
        ctx.restore();
      }
      ctx.strokeStyle = far ? shade(skin.dark, -0.3) : skin.dark;
      ctx.lineWidth = 2.4; seg(ctx, root, wrist);
      ctx.lineWidth = 1.3; seg(ctx, wrist, t1); seg(ctx, wrist, t2); seg(ctx, wrist, t3);
      ctx.lineWidth = 1.5; seg(ctx, wrist, P(0.55, -0.17));
      break;
    }
    case 'bulu': {
      for (let k = 7; k >= 0; k--) {
        const sb = 0.06 + 0.12 * k;
        const base = P(sb, 0.05), tip = P(sb + 0.05 + 0.034 * k, 0.74 - 0.035 * k);
        const mx = (base.x + tip.x) / 2, my = (base.y + tip.y) / 2;
        const dx = tip.x - base.x, dy = tip.y - base.y, l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l, hw = C * 0.17;
        const col = pick(stops, 0.3 + (k / 7) * 0.7);
        ctx.fillStyle = k % 2 ? col : shade(col, -0.1);
        ctx.beginPath(); ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(mx + nx * hw, my + ny * hw, tip.x, tip.y);
        ctx.quadraticCurveTo(mx - nx * hw, my - ny * hw, base.x, base.y);
        ctx.fill();
      }
      ctx.fillStyle = pick(stops, 0);
      const a0 = P(0, -0.07), a1 = P(0.55, -0.1), a2 = P(1.02, 0.03), b1 = P(0.5, 0.3), b0 = P(0, 0.42);
      ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.quadraticCurveTo(a1.x, a1.y, a2.x, a2.y);
      const m = P(0.8, 0.26); ctx.quadraticCurveTo(m.x, m.y, b1.x, b1.y);
      const m2 = P(0.2, 0.42); ctx.quadraticCurveTo(m2.x, m2.y, b0.x, b0.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = far ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.9;
      for (let k = 1; k < 5; k++) { const s = k * 0.18; const c = P(s, 0.22 - s * 0.05); ctx.beginPath(); ctx.arc(c.x, c.y, C * 0.07, 0, Math.PI); ctx.stroke(); }
      break;
    }
    case 'kristal': {
      const A = far ? 0.55 : 1;
      const wrist = P(0.55, -0.05), tip = P(1.0, 0);
      ctx.strokeStyle = hexA(skin.horn, 0.95 * A); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(root.x, root.y); ctx.lineTo(wrist.x, wrist.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      for (let k = 5; k >= 0; k--) {
        const s = 0.1 + k * 0.17;
        shard(ctx, P(s, 0), P(s + 0.08, 0.62 + 0.16 * Math.sin(k * 1.3) - k * 0.05), C * 0.15, skin.glow, A);
      }
      if (!far) { const tw = 0.5 + 0.5 * Math.sin(t * 4); const sp = P(0.9, 0.3); ctx.fillStyle = `rgba(255,255,255,${tw})`; star4(ctx, sp.x, sp.y, 1 + tw * 1.6); }
      break;
    }
    case 'aurora': {
      const A = far ? 0.55 : 1;
      const depth = (s: number) => 0.95 - 0.45 * s + 0.08 * Math.sin(t * 2.4 + s * 9);
      const top: Vec[] = [], bot: Vec[] = [];
      for (let k = 0; k <= 12; k++) { const s = k / 12; top.push(P(s, -0.02 + 0.04 * Math.sin(s * Math.PI))); bot.push(P(s * 0.96, depth(s))); }
      const g0 = P(0.45, 0), g1 = P(0.42, 0.95);
      const gr = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
      gr.addColorStop(0, `rgba(170,255,214,${0.92 * A})`);
      gr.addColorStop(0.32, `rgba(96,232,255,${0.7 * A})`);
      gr.addColorStop(0.66, `rgba(160,124,255,${0.5 * A})`);
      gr.addColorStop(1, 'rgba(255,140,215,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(root.x, root.y);
      for (const q of top) ctx.lineTo(q.x, q.y);
      for (let k = bot.length - 1; k >= 0; k--) ctx.lineTo(bot[k].x, bot[k].y);
      ctx.closePath(); ctx.fill();
      for (let k = 0; k < 11; k++) {
        const s = (k + 0.5) / 11, a = (0.16 + 0.26 * Math.max(0, Math.sin(t * 3 + k * 1.7))) * A;
        const p0 = P(s, 0.02), p1 = P(s * 0.96, depth(s) * 0.82);
        const rg = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
        rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = rg; ctx.lineWidth = 1.5; seg(ctx, p0, p1);
      }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(root.x, root.y); for (const q of top) ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = `rgba(150,255,220,${0.35 * A})`; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = `rgba(235,255,250,${0.95 * A})`; ctx.lineWidth = 1.8; ctx.stroke();
      break;
    }
    case 'awan': {
      const lobes: [number, number, number][] = [];
      for (let j = 0; j < 6; j++) lobes.push([0.12 + j * 0.165, 0.34 - j * 0.035 + 0.03 * Math.sin(t * 2 + j), C * (0.3 - j * 0.03)]);
      const lead: Vec[] = [];
      for (let k = 0; k <= 6; k++) { const s = k / 6; lead.push(P(s, -0.06 + 0.05 * Math.sin(s * Math.PI))); }
      const ox = (Cv.x / C) * 1.8, oy = (Cv.y / C) * 1.8;
      const puffs = (dx: number, dy: number, kr: number) => {
        ctx.beginPath(); ctx.moveTo(root.x + dx, root.y + dy);
        for (const q of lead) ctx.lineTo(q.x + dx, q.y + dy);
        for (let j = lobes.length - 1; j >= 0; j--) { const c = P(lobes[j][0], lobes[j][1]); ctx.lineTo(c.x + dx, c.y + dy); }
        ctx.closePath(); ctx.fill();
        for (const [s, q, r] of lobes) { const c = P(s, q); circ(ctx, c.x + dx, c.y + dy, r * kr); }
        for (let k = 1; k <= 5; k++) { const c = P(k / 6, -0.02); circ(ctx, c.x + dx, c.y + dy, C * (0.16 - k * 0.012) * kr); }
        circ(ctx, root.x + dx, root.y + dy, C * 0.24 * kr);
      };
      ctx.fillStyle = far ? 'rgba(160,172,205,0.85)' : `rgba(${skin.glow},0.5)`;
      puffs(ox, oy, 1);
      ctx.fillStyle = far ? 'rgba(222,228,244,0.96)' : 'rgba(255,255,255,0.97)';
      puffs(0, 0, 0.92);
      if (!far) { ctx.fillStyle = '#ffffff'; for (const [s, q, r] of lobes) { const c = P(s - 0.02, q - 0.1); circ(ctx, c.x, c.y, r * 0.34); } }
      break;
    }
    case 'peri': {
      const lobe = (tip: Vec, wd: number) => {
        const dx = tip.x - root.x, dy = tip.y - root.y, l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l;
        ctx.beginPath(); ctx.moveTo(root.x, root.y);
        ctx.quadraticCurveTo(root.x + dx * 0.6 + nx * wd, root.y + dy * 0.6 + ny * wd, tip.x, tip.y);
        ctx.quadraticCurveTo(root.x + dx * 0.55 - nx * wd * 0.55, root.y + dy * 0.55 - ny * wd * 0.55, root.x, root.y);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(root.x, root.y); ctx.quadraticCurveTo(root.x + dx * 0.5 + nx * wd * 0.3, root.y + dy * 0.5 + ny * wd * 0.3, tip.x, tip.y); ctx.stroke();
      };
      ctx.fillStyle = `rgba(${skin.glow},${far ? 0.16 : 0.28})`;
      ctx.strokeStyle = hexA(M.finSolid, far ? 0.45 : 0.9);
      ctx.lineWidth = 1;
      lobe(P(1.0, 0.1), C * 0.5);
      lobe(P(0.62, 0.74), C * 0.42);
      break;
    }
    case 'kupu': {
      const fore = [root, P(0.3, -0.28), P(0.8, -0.3), P(1.02, 0.05), P(0.78, 0.42), P(0.3, 0.32)];
      const hind = [root, P(0.24, 0.3), P(0.46, 0.62), P(0.34, 0.98), P(0.08, 0.86), P(-0.02, 0.4)];
      const paint = (pts: Vec[]) => {
        smoothClosed(ctx, pts);
        ctx.fillStyle = lin(ctx, root, pts[3], stops, undefined, 0.93); ctx.fill();
        ctx.strokeStyle = hexA(skin.dark, far ? 0.6 : 0.85); ctx.lineWidth = 1.4; ctx.stroke();
        ctx.strokeStyle = hexA(skin.dark, 0.35); ctx.lineWidth = 0.6;
        for (let i = 2; i < pts.length - 1; i++) seg(ctx, root, { x: lerp(root.x, pts[i].x, 0.85), y: lerp(root.y, pts[i].y, 0.85) });
      };
      paint(hind); paint(fore);
      const e1 = P(0.66, 0.06), e2 = P(0.28, 0.72);
      ctx.fillStyle = hexA(skin.dark, 0.8); circ(ctx, e1.x, e1.y, C * 0.11); circ(ctx, e2.x, e2.y, C * 0.08);
      ctx.fillStyle = `rgba(${skin.glow},${far ? 0.6 : 0.95})`; circ(ctx, e1.x, e1.y, C * 0.07); circ(ctx, e2.x, e2.y, C * 0.05);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; circ(ctx, e1.x - 0.6, e1.y - 0.6, C * 0.025);
      break;
    }
    case 'api': {
      const A = far ? 0.65 : 1;
      for (let k = 6; k >= 0; k--) {
        const s = 0.08 + k * 0.14;
        const base = P(s * 0.92, 0.02);
        const tip = P(s + 0.1 + Math.sin(t * 9 + k) * 0.025, 0.72 - k * 0.045 + Math.sin(t * 11 + k * 2) * 0.05);
        const dx = tip.x - base.x, dy = tip.y - base.y, l = Math.hypot(dx, dy) || 1;
        const ux = dx / l, uy = dy / l;
        const at = (a: number, q: number): Vec => ({ x: base.x + ux * a - uy * q, y: base.y + uy * a + ux * q });
        flame(ctx, at, l * 1.12, C * 0.17, t + k, 1, `rgba(255,${110 + k * 12},50,${0.85 * A})`);
        flame(ctx, at, l * 0.8, C * 0.09, t + k + 0.5, 1, `rgba(255,236,150,${0.95 * A})`);
      }
      const w1 = P(0.5, -0.04), w2 = P(1.0, 0.03);
      ctx.strokeStyle = `rgba(255,214,120,${0.95 * A})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(root.x, root.y); ctx.quadraticCurveTo(w1.x, w1.y, w2.x, w2.y); ctx.stroke();
      break;
    }
    case 'kelopak': {
      for (let k = 5; k >= 0; k--) {
        const m = k / 5;
        const dx = S.x * (1 - m) + Cv.x * m * 1.1, dy = S.y * (1 - m) + Cv.y * m * 1.1;
        const l = Math.hypot(dx, dy) || 1, len = l * (1 - m * 0.1);
        const ux = dx / l, uy = dy / l, nx = -uy, ny = ux, wd = len * 0.3;
        const Q = (s: number, q: number): Vec => ({ x: root.x + ux * len * s + nx * wd * q, y: root.y + uy * len * s + ny * wd * q });
        ctx.fillStyle = lin(ctx, root, Q(1, 0), stops, undefined, far ? 0.85 : 0.95);
        const s0 = Q(0, 0), c1 = Q(0.45, 1.15), e1 = Q(0.97, 0.45), nt = Q(0.84, 0), e2 = Q(0.97, -0.45), c2 = Q(0.45, -1.15);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.quadraticCurveTo(c1.x, c1.y, e1.x, e1.y); ctx.lineTo(nt.x, nt.y); ctx.lineTo(e2.x, e2.y); ctx.quadraticCurveTo(c2.x, c2.y, s0.x, s0.y); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.6; seg(ctx, Q(0.05, 0), Q(0.75, 0));
      }
      break;
    }
  }
}

// =================== KAKI ===================
function clawHook(ctx: CanvasRenderingContext2D, base: Vec, dir: Vec, curl: Vec, len: number, wd: number, col: string) {
  const tip = { x: base.x + dir.x * len, y: base.y + dir.y * len };
  const ctl = { x: base.x + dir.x * len * 0.55 - curl.x * len * 0.12, y: base.y + dir.y * len * 0.55 - curl.y * len * 0.12 };
  const hook = { x: tip.x + curl.x * len * 0.3, y: tip.y + curl.y * len * 0.3 };
  ctx.fillStyle = col;
  taper(ctx, [...quad(base, ctl, tip, 4), hook], wd, 0.2);
}

// dua pasang tungkai besar: tangan depan & kaki belakang. Sisi jauh digambar di belakang tubuh, sisi dekat di depan tubuh.
function drawLegs(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, type: LegId, armFin: boolean, op: DrawOpts, layer: 'far' | 'near') {
  if (type === 'ular') return;
  const far = layer === 'far';
  const tuck = op.limp ? 0.2 : clamp(((op.spd ?? 300) - 280) / 560, 0, 1) * 0.8;
  const limbCol = far ? shade(skin.dark, -0.15) : M.head;
  const darkCol = far ? shade(skin.dark, -0.4) : skin.dark;
  const clawCol = far ? shade(skin.horn, -0.38) : skin.horn;
  const maneCol = far ? shade(skin.mane, -0.32) : skin.mane;
  const finCol = far ? shade(M.finSolid, -0.3) : M.finSolid;
  [5.5, g.N * 0.55].forEach((li, k) => {
    const F = fr(g, li), u = F.u, f = F.f;
    const ul = Math.hypot(u.x, u.y);
    if (ul < 0.2) return; // tepat di tengah guling → tungkai tersembunyi di balik tubuh
    const d = { x: -u.x / ul, y: -u.y / ul }, b = { x: -f.x, y: -f.y };
    const front = k === 0;
    const sc = (front ? 1 : 1.05) * (far ? 0.9 : 1);
    const sw = op.limp ? 0 : Math.sin(op.t * 5 + k * 2.2 + (far ? 2.6 : 0)) * (1 - tuck);
    const fo = far ? 2.6 : 0;
    const hip = { x: F.p.x + d.x * F.w * 0.3 * ul + f.x * fo, y: F.p.y + d.y * F.w * 0.3 * ul + f.y * fo };
    const dirA = (a: number): Vec => ({ x: d.x * Math.cos(a) + b.x * Math.sin(a), y: d.y * Math.cos(a) + b.y * Math.sin(a) });
    const sz = type === 'bulat' ? 0.7 : type === 'sirip' ? 0.78 : type === 'elang' ? 1.1 : 1;
    const L1 = (front ? 12.5 : 13.5) * sc * sz, L2 = (front ? 12 : 12.8) * sc * sz;
    // pose: tergantung & mengayuh pelan saat santai, tersapu ke belakang (ramping) saat melesat
    const a1 = (front ? 0.3 : 0.5) + tuck * 1.0 + sw * 0.3;
    const A = a1 + (front ? -0.6 : -0.9) + tuck * 1.3 - sw * 0.22;
    const v1 = dirA(a1), v2 = dirA(A);
    const knee = { x: hip.x + v1.x * L1, y: hip.y + v1.y * L1 };
    const foot = { x: knee.x + v2.x * L2, y: knee.y + v2.y * L2 };
    const mid2 = { x: (knee.x + foot.x) / 2, y: (knee.y + foot.y) / 2 };
    const thick = type === 'bulat' ? 1.3 : type === 'qilin' ? 0.82 : 1;
    const W0 = (front ? 7.6 : 7.2) * sc * thick, W1 = 3.2 * sc * thick;
    const kc = { x: (hip.x + knee.x) / 2 + b.x * 1.4, y: (hip.y + knee.y) / 2 + b.y * 1.4 };

    // --- bahu/paha berotot + lengan/betis ---
    ctx.fillStyle = limbCol;
    ell(ctx, hip.x + v1.x * L1 * 0.42, hip.y + v1.y * L1 * 0.42, L1 * 0.62, W0 * 0.66, Math.atan2(v1.y, v1.x));
    if (type === 'elang') {
      taper(ctx, quad(hip, kc, knee, 5), W0 * 1.1, W0 * 0.75);
      ctx.fillStyle = finCol;
      for (let j = 0; j < 3; j++) {
        const q = { x: knee.x - v1.x * (2 + j * 2.6) + b.x * 1.5, y: knee.y - v1.y * (2 + j * 2.6) + b.y * 1.5 };
        ell(ctx, q.x, q.y, 3.4 * sc, 2 * sc, Math.atan2(v1.y, v1.x) + Math.PI / 2);
      }
      ctx.fillStyle = darkCol;
      taper(ctx, [knee, mid2, foot], 2.8 * sc, 2.2 * sc);
    } else {
      taper(ctx, [...quad(hip, kc, knee, 4), mid2, foot], W0, W1);
    }
    if (!far) {
      // sorot otot & sisik melintang di lengan bawah
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.1;
      const nf = dirA(a1 - Math.PI / 2);
      seg(ctx, { x: hip.x + nf.x * W0 * 0.35, y: hip.y + nf.y * W0 * 0.35 }, { x: knee.x + nf.x * W0 * 0.22, y: knee.y + nf.y * W0 * 0.22 });
      if (type !== 'elang') {
        ctx.strokeStyle = skin.scale;
        ctx.lineWidth = 0.7;
        const nv = dirA(A - Math.PI / 2), hwd = (W0 * 0.36 + W1 * 0.5) * 0.5;
        for (let j = 1; j <= 3; j++) {
          const q = { x: knee.x + v2.x * L2 * j * 0.24, y: knee.y + v2.y * L2 * j * 0.24 };
          seg(ctx, { x: q.x + nv.x * hwd, y: q.y + nv.y * hwd }, { x: q.x - nv.x * hwd, y: q.y - nv.y * hwd });
        }
      }
    }

    // --- jumbai siku khas naga oriental ---
    if (type === 'cakar' || type === 'qilin' || type === 'awan' || type === 'kristal') {
      ctx.fillStyle = maneCol;
      for (let j = 0; j < 3; j++) {
        const td = dirA(a1 + 1.35 + j * 0.3), tl = (8 - j * 1.6) * sc;
        const wav = op.limp ? 0 : Math.sin(op.t * 7 + j + k) * 0.8;
        const tip = { x: knee.x + td.x * tl + d.x * wav, y: knee.y + td.y * tl + d.y * wav };
        const ctl = { x: knee.x + td.x * tl * 0.5 + d.x * 1.6, y: knee.y + td.y * tl * 0.5 + d.y * 1.6 };
        taper(ctx, quad(knee, ctl, tip, 4), 2.8 * sc, 0.25);
      }
    }

    // --- telapak & cakar ---
    switch (type) {
      case 'cakar': case 'awan': case 'kristal': {
        ctx.fillStyle = limbCol;
        circ(ctx, foot.x, foot.y, 3 * sc);
        for (let c = 0; c < 4; c++) {
          const th = A - 1.5 + c * 0.42, td = dirA(th);
          const base = { x: foot.x + td.x * 1.8 * sc, y: foot.y + td.y * 1.8 * sc };
          if (type === 'kristal') shard(ctx, base, { x: base.x + td.x * 6.5 * sc, y: base.y + td.y * 6.5 * sc }, 2.2 * sc, skin.glow, far ? 0.55 : 0.95);
          else clawHook(ctx, base, td, dirA(th + 1.5), 6.2 * sc, 2.4 * sc, clawCol);
        }
        if (type === 'awan') cloudPuff(ctx, { x: knee.x * 0.35 + foot.x * 0.65, y: knee.y * 0.35 + foot.y * 0.65 }, 4.6 * sc, skin.glow, b);
        break;
      }
      case 'elang': {
        for (let c = 0; c < 3; c++) { const th = A - 1.3 + c * 0.5; clawHook(ctx, foot, dirA(th), dirA(th + 1.5), 7 * sc, 2 * sc, clawCol); }
        clawHook(ctx, foot, dirA(A + 1.2), dirA(A + 2.7), 5 * sc, 1.8 * sc, clawCol);
        break;
      }
      case 'qilin': {
        ctx.fillStyle = maneCol;
        for (let j = 0; j < 3; j++) {
          const td = dirA(A + 1.1 + j * 0.35);
          const tip = { x: mid2.x + td.x * (6 - j) * sc, y: mid2.y + td.y * (6 - j) * sc };
          taper(ctx, quad(mid2, { x: (mid2.x + tip.x) / 2 + d.x, y: (mid2.y + tip.y) / 2 + d.y }, tip, 4), 2.2 * sc, 0.2);
        }
        ctx.fillStyle = clawCol;
        const hv = dirA(A), hn = dirA(A - Math.PI / 2);
        polyFill(ctx, [
          { x: foot.x + hn.x * 2.6 * sc, y: foot.y + hn.y * 2.6 * sc },
          { x: foot.x - hn.x * 2.6 * sc, y: foot.y - hn.y * 2.6 * sc },
          { x: foot.x + hv.x * 4.2 * sc - hn.x * 3.4 * sc, y: foot.y + hv.y * 4.2 * sc - hn.y * 3.4 * sc },
          { x: foot.x + hv.x * 4.2 * sc + hn.x * 3.4 * sc, y: foot.y + hv.y * 4.2 * sc + hn.y * 3.4 * sc },
        ]);
        break;
      }
      case 'bulat': {
        ctx.fillStyle = limbCol;
        circ(ctx, foot.x, foot.y, 4.6 * sc);
        ctx.fillStyle = finCol;
        for (let c = -1; c <= 1; c++) { const q = dirA(A - 0.5 + c * 0.55); circ(ctx, foot.x + q.x * 3.4 * sc, foot.y + q.y * 3.4 * sc, 1.3 * sc); }
        const pv = dirA(A);
        circ(ctx, foot.x + pv.x * sc, foot.y + pv.y * sc, 1.9 * sc);
        break;
      }
      case 'sirip': {
        const t1 = { x: foot.x + v2.x * 8 * sc + b.x * 6 * sc, y: foot.y + v2.y * 8 * sc + b.y * 6 * sc };
        const t2 = { x: knee.x + b.x * 12 * sc + d.x * 2 * sc, y: knee.y + b.y * 12 * sc + d.y * 2 * sc };
        ctx.fillStyle = hexA(finCol, 0.85);
        polyFill(ctx, [knee, t2, t1, foot]);
        ctx.strokeStyle = shade(finCol, -0.3, 0.7);
        ctx.lineWidth = 0.8;
        for (let r = 1; r <= 3; r++) seg(ctx, knee, { x: t2.x + ((t1.x - t2.x) * r) / 4, y: t2.y + ((t1.y - t2.y) * r) / 4 });
        break;
      }
    }

    // --- sirip lengan (hiasan) ---
    if (armFin) {
      const e1 = dirA(a1 + 1.6), e2 = dirA(A + 1.4);
      const t1 = { x: knee.x + e1.x * 11 * sc, y: knee.y + e1.y * 11 * sc };
      const t2 = { x: mid2.x + e2.x * 8 * sc, y: mid2.y + e2.y * 8 * sc };
      ctx.fillStyle = hexA(finCol, 0.8);
      polyFill(ctx, [knee, t1, t2, mid2]);
      ctx.strokeStyle = shade(finCol, -0.35, 0.7);
      ctx.lineWidth = 0.6;
      seg(ctx, knee, t1); seg(ctx, knee, t2);
    }
  });
}

// =================== SIRIP PUNGGUNG ===================
function drawDorsal(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, type: FinId, op: DrawOpts) {
  if (type === 'polos') return;
  const start = op.saddle ? 7 : 3, end = g.N - 5, wv = op.limp ? 0.2 : 1, t = op.t, span = end - start;
  switch (type) {
    case 'duri': {
      ctx.fillStyle = M.fin;
      for (let i = start; i < g.N - 4; i += 2) {
        const F = fr(g, i), Q = fr(g, i + 1), fh = F.w * 0.7 + 2;
        polyFill(ctx, [off(F, F.w * 0.8), { x: F.p.x + F.u.x * (F.w + fh) + (Q.p.x - F.p.x) * 1.2, y: F.p.y + F.u.y * (F.w + fh) + (Q.p.y - F.p.y) * 1.2 }, off(Q, Q.w * 0.8)]);
      }
      break;
    }
    case 'layar': case 'ombak': {
      const edge: Vec[] = [], base: Vec[] = [];
      for (let j = start; j <= end + 0.01; j += 0.5) {
        const F = fr(g, j), s = (j - start) / span;
        const hgt = type === 'layar'
          ? (4 + 6 * Math.sin(Math.PI * Math.min(1, s * 1.1))) * (Math.round(j * 2) % 2 === 0 ? 1 : 0.68)
          : (2.5 + 4.5 * Math.sin(Math.PI * s)) * (0.7 + 0.3 * Math.sin(t * 4 - j * 0.7) * wv);
        edge.push(off(F, F.w * 0.8 + hgt)); base.push(off(F, F.w * 0.55));
      }
      ctx.globalAlpha = type === 'layar' ? 0.88 : 0.8;
      ctx.fillStyle = M.fin; polyFill(ctx, [...edge, ...[...base].reverse()]);
      ctx.globalAlpha = 1;
      if (type === 'layar') {
        ctx.strokeStyle = shade(M.finSolid, -0.38, 0.8); ctx.lineWidth = 0.8;
        for (let k = 0; k < edge.length; k += 2) seg(ctx, base[k], edge[k]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); edge.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
      }
      break;
    }
    case 'jambul': {
      let k = 0;
      for (let j = start; j <= end; j += 1.3, k++) {
        const F = fr(g, j), s = (j - start) / span, len = 10 - s * 6;
        const b0 = off(F, F.w * 0.75), s2 = Math.sin(t * 5 - j * 0.6) * 1.5 * wv;
        const tip = { x: b0.x + F.u.x * (len * 0.65 + s2 * 0.3) - F.f.x * len, y: b0.y + F.u.y * (len * 0.65 + s2 * 0.3) - F.f.y * len };
        const dx = tip.x - b0.x, dy = tip.y - b0.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, hw = len * 0.22;
        ctx.fillStyle = k % 2 ? M.fin : shade(M.finSolid, 0.25);
        ctx.beginPath(); ctx.moveTo(b0.x, b0.y);
        ctx.quadraticCurveTo((b0.x + tip.x) / 2 + nx * hw, (b0.y + tip.y) / 2 + ny * hw, tip.x, tip.y);
        ctx.quadraticCurveTo((b0.x + tip.x) / 2 - nx * hw, (b0.y + tip.y) / 2 - ny * hw, b0.x, b0.y);
        ctx.fill();
      }
      break;
    }
    case 'kristal': {
      for (let j = start + 0.5; j <= end; j += 2.6) {
        const F = fr(g, j), s = (j - start) / span, b0 = off(F, F.w * 0.55);
        shard(ctx, b0, { x: b0.x + F.u.x * (9 - s * 4.5) - F.f.x * 2.5, y: b0.y + F.u.y * (9 - s * 4.5) - F.f.y * 2.5 }, 3.6 - s * 1.2, skin.glow, 0.92);
      }
      break;
    }
    case 'api': {
      for (let j = start; j <= end; j += 1.8) {
        const F = fr(g, j), s = (j - start) / span, b0 = off(F, F.w * 0.6);
        let ux = F.u.x - F.f.x * 0.55, uy = F.u.y - F.f.y * 0.55;
        const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
        const at = (a: number, q: number): Vec => ({ x: b0.x + ux * a - uy * q, y: b0.y + uy * a + ux * q });
        flame(ctx, at, 10 - s * 5, 3.4, t + j, wv, `rgba(${skin.glow},0.6)`);
        flame(ctx, at, 6.5 - s * 3, 1.8, t + j + 0.4, wv, 'rgba(255,248,220,0.92)');
      }
      break;
    }
  }
}

function drawTailFrill(ctx: CanvasRenderingContext2D, g: DragonGeo, M: Mat) {
  for (const i of [g.N * 0.64, g.N * 0.8]) {
    const F = fr(g, i), base = off(F, -F.w * 0.4), s = i > g.N * 0.7 ? 0.8 : 1;
    const bx = -F.f.x, by = -F.f.y;
    const t1 = { x: base.x + bx * 11 * s - F.u.x * 6 * s, y: base.y + by * 11 * s - F.u.y * 6 * s };
    const t2 = { x: base.x + bx * 4 * s - F.u.x * 9 * s, y: base.y + by * 4 * s - F.u.y * 9 * s };
    const c = { x: base.x + bx * 9 * s - F.u.x * 10 * s, y: base.y + by * 9 * s - F.u.y * 10 * s };
    ctx.fillStyle = hexA(M.finSolid, 0.75);
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(t1.x, t1.y); ctx.quadraticCurveTo(c.x, c.y, t2.x, t2.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(M.finSolid, -0.3, 0.6); ctx.lineWidth = 0.6;
    seg(ctx, base, t1); seg(ctx, base, { x: (c.x + t1.x) / 2, y: (c.y + t1.y) / 2 }); seg(ctx, base, t2);
  }
}

// =================== EKOR ===================
function drawTail(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, type: TailId, op: DrawOpts) {
  const N = g.N, tl = g.pts[N - 1], tu = g.ups[N - 1], tp = g.pts[N - 3];
  let dx = tl.x - tp.x, dy = tl.y - tp.y;
  const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const at = (a: number, b: number): Vec => ({ x: tl.x + dx * a + tu.x * b, y: tl.y + dy * a + tu.y * b });
  const t = op.t, wv = op.limp ? 0.15 : 1;
  switch (type) {
    case 'runcing': {
      const P: Vec[] = [];
      for (let j = 0; j <= 14; j++) { const s = j / 14; P.push(at(40 * s, Math.sin(t * 5 - s * 4) * 4 * s * wv)); }
      ctx.fillStyle = M.body; taper(ctx, P, 2.6, 0.2);
      ctx.fillStyle = M.fin;
      for (const j of [3, 6, 9]) {
        const a = P[j], b = P[j + 1], hgt = 3.4 - j * 0.22;
        polyFill(ctx, [a, { x: (a.x + b.x) / 2 + tu.x * hgt - dx * 1.2, y: (a.y + b.y) / 2 + tu.y * hgt - dy * 1.2 }, b]);
      }
      break;
    }
    case 'jumbai': {
      ctx.fillStyle = M.fin;
      for (let k = -1; k <= 1; k++) {
        const wav = Math.sin(t * 7 + k) * 4 * wv;
        const s0 = at(0, 3), c = at(10, k * 7 + wav), e = at(22, k * 10 + wav), r = at(8, 0), s1 = at(0, -3);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.quadraticCurveTo(c.x, c.y, e.x, e.y); ctx.quadraticCurveTo(r.x, r.y, s1.x, s1.y); ctx.fill();
      }
      break;
    }
    case 'kipas': {
      const rays: Vec[] = [];
      for (let k = -2; k <= 2; k++) {
        const a = k * 0.36 + Math.sin(t * 5 + k * 0.8) * 0.12 * wv, len = 25 - Math.abs(k) * 2.5;
        rays.push(at(Math.cos(a) * len, Math.sin(a) * len));
      }
      ctx.fillStyle = hexA(M.finSolid, 0.72);
      ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(rays[0].x, rays[0].y);
      for (let i = 1; i < rays.length; i++) {
        const pr = rays[i - 1], r = rays[i], mx = (pr.x + r.x) / 2, my = (pr.y + r.y) / 2;
        ctx.quadraticCurveTo(mx - (mx - tl.x) * 0.14, my - (my - tl.y) * 0.14, r.x, r.y);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = M.finSolid; ctx.lineWidth = 1;
      rays.forEach((r) => seg(ctx, tl, r));
      break;
    }
    case 'panah': {
      ctx.fillStyle = skin.dark;
      polyFill(ctx, [at(-1, 2.6), at(5, 9), at(18, 0), at(5, -9), at(-1, -2.6)]);
      ctx.fillStyle = hexA(M.finSolid, 0.6);
      polyFill(ctx, [at(4, 0), at(7, 4.5), at(13, 0), at(7, -4.5)]);
      break;
    }
    case 'phoenix': {
      const lens = [38, 48, 34], offs = [7, 0, -7];
      for (let k = 0; k < 3; k++) {
        const P: Vec[] = [];
        for (let j = 0; j <= 10; j++) { const s = j / 10; P.push(at(lens[k] * s, offs[k] * s * 1.3 + Math.sin(t * 5 - s * 5 + k * 1.3) * 5 * s * wv)); }
        ctx.fillStyle = k === 1 ? M.finSolid : shade(M.finSolid, -0.12);
        taper(ctx, P, 3, 1);
        const e = P[10];
        ctx.fillStyle = M.finSolid; circ(ctx, e.x, e.y, 3.4);
        ctx.fillStyle = skin.body; circ(ctx, e.x, e.y, 1.9);
        ctx.fillStyle = skin.dark; circ(ctx, e.x, e.y, 0.8);
      }
      break;
    }
    case 'api': {
      flame(ctx, at, 34, 8.7, t, wv, `rgba(${skin.glow},0.35)`);
      flame(ctx, at, 27, 7, t, wv, M.finSolid);
      flame(ctx, at, 15, 3.9, t, wv, 'rgba(255,250,228,0.95)');
      break;
    }
    case 'pita': {
      for (let k = 0; k < 2; k++) {
        const P: Vec[] = [], len = k ? 44 : 54;
        for (let j = 0; j <= 14; j++) { const s = j / 14; P.push(at(len * s, (k ? -3 : 3) * s * 2 + Math.sin(t * 4.5 - s * 6 + k * 2) * 6 * s * wv)); }
        ctx.fillStyle = k ? shade(M.finSolid, -0.12) : M.finSolid;
        taper(ctx, P, 3.4, 1.2);
      }
      break;
    }
    case 'awan': {
      const pts: [number, number, number][] = [[5, 1.5, 6], [12, -1.5, 5.2], [19, 2.2, 4.4], [25.5, -0.6, 3.6], [31, 2.6, 2.8]];
      const pos = (a: number, b: number) => at(a, b + Math.sin(t * 2 + a) * 1.2 * wv);
      ctx.fillStyle = `rgba(${skin.glow},0.45)`;
      for (const [a, b, r] of pts) { const q = pos(a, b); circ(ctx, q.x + 0.9, q.y + 1.2, r); }
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      for (const [a, b, r] of pts) { const q = pos(a, b); circ(ctx, q.x, q.y, r * 0.93); }
      ctx.fillStyle = '#ffffff';
      for (const [a, b, r] of pts) { const q = pos(a - r * 0.25, b + r * 0.35); circ(ctx, q.x, q.y, r * 0.38); }
      const w0 = at(33, 0), w1 = at(40, -3 + Math.sin(t * 3) * 2 * wv), w2 = at(46, 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w0.x, w0.y); ctx.quadraticCurveTo(w1.x, w1.y, w2.x, w2.y); ctx.stroke();
      break;
    }
    case 'bunga': {
      const sway = Math.sin(t * 3) * 0.12 * wv;
      for (const [ang, len] of [[-0.75, 15], [0.1, 19], [0.85, 14]] as [number, number][]) {
        const a = ang + sway, ux = Math.cos(a), uy = Math.sin(a);
        const tip = at(ux * len, uy * len);
        const c1 = at(ux * len * 0.5 - uy * len * 0.28, uy * len * 0.5 + ux * len * 0.28);
        const c2 = at(ux * len * 0.5 + uy * len * 0.28, uy * len * 0.5 - ux * len * 0.28);
        ctx.fillStyle = M.finSolid;
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.quadraticCurveTo(c1.x, c1.y, tip.x, tip.y); ctx.quadraticCurveTo(c2.x, c2.y, tl.x, tl.y); ctx.fill();
        ctx.strokeStyle = shade(M.finSolid, -0.3, 0.6); ctx.lineWidth = 0.6; seg(ctx, tl, tip);
      }
      const fc = at(6, 0);
      blossom(ctx, fc.x, fc.y, 5.2, t * 0.4);
      break;
    }
    case 'kristal': {
      shard(ctx, at(-1, 1.5), at(14, 9), 4.2, skin.glow, 0.9);
      shard(ctx, at(-1, -1.5), at(14, -9), 4.2, skin.glow, 0.9);
      shard(ctx, at(-2, 0), at(24, 0), 5.4, skin.glow, 0.95);
      const sp = at(24, 0), tw = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(255,255,255,${tw})`; star4(ctx, sp.x, sp.y, 1 + tw * 2.2);
      break;
    }
  }
}

// =================== CORAK ===================
function rune(ctx: CanvasRenderingContext2D, c: Vec, r: number, kind: number) {
  ctx.beginPath();
  if (kind === 0) { ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.moveTo(c.x, c.y - r); ctx.lineTo(c.x, c.y + r); }
  else if (kind === 1) { ctx.moveTo(c.x, c.y - r); ctx.lineTo(c.x + r, c.y + r * 0.8); ctx.lineTo(c.x - r, c.y + r * 0.8); ctx.closePath(); }
  else if (kind === 2) { ctx.moveTo(c.x - r, c.y); ctx.lineTo(c.x, c.y - r); ctx.lineTo(c.x + r, c.y); ctx.lineTo(c.x, c.y + r); ctx.closePath(); }
  else { ctx.moveTo(c.x - r, c.y - r * 0.6); ctx.lineTo(c.x + r, c.y - r * 0.6); ctx.moveTo(c.x, c.y - r); ctx.lineTo(c.x, c.y + r); ctx.moveTo(c.x - r * 0.6, c.y + r * 0.5); ctx.lineTo(c.x + r * 0.6, c.y + r * 0.5); }
  ctx.stroke();
}

function drawPattern(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, type: PatternId, t: number) {
  const { pts, ups, w, N } = g;
  const P = (i: number, k: number): Vec => ({ x: pts[i].x + ups[i].x * w[i] * k, y: pts[i].y + ups[i].y * w[i] * k });
  const dirTail = (i: number) => Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
  switch (type) {
    case 'polos':
      return;
    case 'sisik': {
      ctx.strokeStyle = skin.scale; ctx.lineWidth = 0.9;
      for (let i = 2; i < N - 3; i++) {
        const a = dirTail(i);
        for (const k of [-0.35, 0.15, 0.62]) {
          const c = P(i, k + (i % 2 ? 0.22 : 0));
          ctx.beginPath(); ctx.arc(c.x, c.y, w[i] * 0.3, a - Math.PI / 2, a + Math.PI / 2); ctx.stroke();
        }
      }
      break;
    }
    case 'belang': {
      ctx.fillStyle = shade(skin.dark, -0.15, 0.55);
      for (let i = 3; i < N - 3; i += 3) polyFill(ctx, [P(i, 1.2), P(i + 1, 1.2), P(i + 1, 0.05), P(i, -0.2)]);
      break;
    }
    case 'totol': {
      ctx.fillStyle = shade(skin.dark, -0.1, 0.5);
      for (let i = 2; i < N - 3; i += 2) {
        const c = P(i, 0.3 + 0.3 * Math.sin(i * 1.7)), r = w[i] * (0.22 + 0.08 * Math.sin(i * 2.3));
        circ(ctx, c.x, c.y, r);
        if (i % 4 === 0) { const c2 = P(i + 1, -0.25); circ(ctx, c2.x, c2.y, r * 0.55); }
      }
      break;
    }
    case 'awan': {
      ctx.strokeStyle = hexA(skin.fin, 0.85); ctx.lineWidth = 1.1;
      for (let i = 3; i < N - 4; i += 4) {
        const c = P(i, 0.28), r = w[i] * 0.34, a = dirTail(i);
        ctx.beginPath(); ctx.arc(c.x, c.y, r, a, a + Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * r * 0.45, c.y + Math.sin(a) * r * 0.45, r * 0.45, a + Math.PI, a + Math.PI * 2.4); ctx.stroke();
        seg(ctx, P(i, -0.06), P(i + 2, -0.1));
      }
      break;
    }
    case 'rasi': {
      const stars: Vec[] = [];
      for (let i = 2; i < N - 3; i += 2) stars.push(P(i, 0.55 * Math.sin(i * 2.1 + 0.5)));
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); stars.forEach((s, i) => (i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y))); ctx.stroke();
      stars.forEach((s, i) => { ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 3 + i * 1.3)})`; star4(ctx, s.x, s.y, 1.7 + (i % 3 === 0 ? 0.9 : 0)); });
      break;
    }
    case 'kosmik': {
      for (const [i0, c] of [[4, '255,120,220'], [10, '120,170,255'], [17, '190,130,255'], [23, '120,230,255']] as [number, string][]) {
        const i = Math.floor((i0 * N) / 30);
        const q = P(i, 0.2), r = w[i] * 1.9 + 2;
        const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        gr.addColorStop(0, `rgba(${c},0.45)`); gr.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = gr; circ(ctx, q.x, q.y, r);
      }
      for (let i = 2; i < N - 3; i++) {
        const h = Math.sin(i * 45.1) * 9871.3, hr = h - Math.floor(h);
        const q = P(i, (hr - 0.5) * 1.5);
        ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.55 * Math.max(0, Math.sin(t * 3.2 + i))})`;
        if (i % 4 === 0) star4(ctx, q.x, q.y, 1.5); else circ(ctx, q.x, q.y, 0.5);
      }
      break;
    }
    case 'seigaiha': {
      ctx.strokeStyle = hexA(skin.fin, 0.55); ctx.lineWidth = 0.75;
      for (let i = 2; i < N - 4; i += 2) {
        const au = Math.atan2(ups[i].y, ups[i].x);
        for (const k of i % 4 ? [-0.5, 0.3] : [-0.1, 0.7]) {
          const c = P(i, k);
          for (const s of [0.42, 0.28, 0.14]) { ctx.beginPath(); ctx.arc(c.x, c.y, w[i] * s * 1.3, au - Math.PI / 2, au + Math.PI / 2); ctx.stroke(); }
        }
      }
      break;
    }
    case 'bunga': {
      for (let i = 3; i < N - 4; i += 3) {
        const c = P(i, i % 2 ? 0.35 : -0.25), r = w[i] * 0.3;
        ctx.fillStyle = hexA(skin.belly, 0.75);
        for (let k = 0; k < 5; k++) { const a = i + (k * Math.PI * 2) / 5; ell(ctx, c.x + Math.cos(a) * r * 0.6, c.y + Math.sin(a) * r * 0.6, r * 0.6, r * 0.38, a); }
        ctx.fillStyle = `rgba(${skin.glow},0.9)`; circ(ctx, c.x, c.y, r * 0.3);
      }
      break;
    }
    case 'runa': {
      for (let i = 3; i < N - 4; i += 2) {
        const c = P(i, 0.15), r = w[i] * 0.32, a = 0.3 + 0.6 * Math.max(0, Math.sin(t * 3 - i * 0.45));
        ctx.strokeStyle = `rgba(${skin.glow},${a * 0.35})`; ctx.lineWidth = 2.2; rune(ctx, c, r, i % 4);
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 0.7; rune(ctx, c, r, i % 4);
      }
      break;
    }
    case 'faset': {
      for (let i = 1; i < N - 4; i += 2) {
        const a = P(i, 1.1), b = P(i + 2, 1.1), m = P(i + 1, 0), c = P(i, -1.1), d = P(i + 2, -1.1);
        ctx.fillStyle = 'rgba(255,255,255,0.13)'; polyFill(ctx, [a, b, m]);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; polyFill(ctx, [m, d, c]);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 0.5; seg(ctx, a, m); seg(ctx, m, d);
      }
      break;
    }
  }
}

// =================== KEPALA: HIASAN, TANDUK & MATA ===================
function neckFrill(ctx: CanvasRenderingContext2D, M: Mat, t: number, wv: number) {
  const c = { x: -5, y: 0.5 }, tips: Vec[] = [];
  for (let k = 0; k <= 6; k++) {
    const a = ((110 + k * (140 / 6)) * Math.PI) / 180 + Math.sin(t * 3 + k) * 0.04 * wv;
    const R = 13 + (k % 2) * 1.5;
    tips.push({ x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R });
  }
  ctx.fillStyle = hexA(M.finSolid, 0.72);
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tips[0].x, tips[0].y);
  for (let k = 1; k < tips.length; k++) {
    const p = tips[k - 1], q = tips[k];
    ctx.quadraticCurveTo(((p.x + q.x) / 2) * 0.86 + c.x * 0.14, ((p.y + q.y) / 2) * 0.86 + c.y * 0.14, q.x, q.y);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(M.finSolid, -0.35, 0.75); ctx.lineWidth = 0.7;
  for (const q of tips) seg(ctx, c, q);
}

function earFin(ctx: CanvasRenderingContext2D, M: Mat, t: number, wv: number) {
  const r = { x: -1, y: -3.5 }, fl = Math.sin(t * 4) * 0.8 * wv;
  const tips = [{ x: -13, y: -13 + fl }, { x: -17, y: -6 + fl * 0.7 }, { x: -13.5, y: 0.5 + fl * 0.4 }];
  ctx.fillStyle = hexA(M.finSolid, 0.82);
  ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(tips[0].x, tips[0].y);
  ctx.quadraticCurveTo(-13, -9, tips[1].x, tips[1].y); ctx.quadraticCurveTo(-13.5, -3, tips[2].x, tips[2].y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(M.finSolid, -0.35, 0.8); ctx.lineWidth = 0.7;
  for (const q of tips) seg(ctx, r, q);
}

function drawHorn(ctx: CanvasRenderingContext2D, id: HornId, fill: string | CanvasGradient, skin: Skin, t: number, far: boolean) {
  const hc = far ? shade(skin.horn, -0.32) : skin.horn;
  ctx.fillStyle = fill;
  switch (id) {
    case 'klasik': {
      const P = cubic({ x: 2, y: -8 }, { x: -5, y: -12.5 }, { x: -12, y: -14 }, { x: -21, y: -12 }, 12);
      taper(ctx, P, 3.8, 0.5); rings(ctx, P, 3.8, 0.5, 3);
      break;
    }
    case 'agung': {
      const main = cubic({ x: 1, y: -8 }, { x: -4, y: -16 }, { x: -12, y: -21 }, { x: -25, y: -23 }, 14);
      taper(ctx, main, 3.1, 0.9);
      const tine = (i: number, ddx: number, ddy: number, wd: number) => {
        const a = main[i], e = { x: a.x + ddx, y: a.y + ddy };
        taper(ctx, quad(a, { x: a.x + ddx * 0.25, y: a.y + ddy * 0.7 }, e, 6), wd, 0.45);
        return e;
      };
      const fork = (e: Vec, ddx: number, ddy: number, wd: number) => taper(ctx, quad(e, { x: e.x + ddx * 0.4, y: e.y + ddy * 0.6 }, { x: e.x + ddx, y: e.y + ddy }, 4), wd, 0.35);
      tine(3, 3.5, -7, 2.1);
      const t2 = tine(6, 1, -10, 1.9); fork(t2, 3.5, -3, 1.1); fork(t2, -1.5, -4, 1.0);
      const t3 = tine(9, -1, -9, 1.7); fork(t3, 3, -3.5, 1.0);
      tine(12, -2.5, -6.5, 1.4);
      fork(main[14], -3.5, -3.5, 1.0); fork(main[14], -4.5, 1, 0.9);
      break;
    }
    case 'panjang': {
      const A = cubic({ x: 1, y: -7.5 }, { x: -10, y: -11.5 }, { x: -24, y: -12.5 }, { x: -40, y: -9 }, 16);
      taper(ctx, A, 3.2, 0.35);
      taper(ctx, cubic({ x: -1, y: -5.5 }, { x: -10, y: -7 }, { x: -20, y: -6.5 }, { x: -31, y: -2.5 }, 12), 2.2, 0.3);
      rings(ctx, A, 3.2, 0.35, 3);
      break;
    }
    case 'banteng': {
      const P = cubic({ x: -1, y: -8 }, { x: -9, y: -14 }, { x: -4, y: -24 }, { x: 8, y: -25 }, 14);
      taper(ctx, P, 3.9, 0.5); rings(ctx, P, 3.9, 0.5, 3);
      break;
    }
    case 'kristal': {
      if (!far) {
        const gr = ctx.createRadialGradient(-6, -16, 0, -6, -16, 13);
        gr.addColorStop(0, `rgba(${skin.glow},0.35)`); gr.addColorStop(1, `rgba(${skin.glow},0)`);
        ctx.fillStyle = gr; circ(ctx, -6, -16, 13);
      }
      const A = far ? 0.55 : 1;
      shard(ctx, { x: -3, y: -8 }, { x: -18, y: -17 }, 3.8, skin.glow, A);
      shard(ctx, { x: 0, y: -8.5 }, { x: -9, y: -25 }, 4.8, skin.glow, A);
      shard(ctx, { x: 3, y: -8.5 }, { x: 2.5, y: -17 }, 3, skin.glow, A);
      break;
    }
    case 'spiral': {
      const P = cubic({ x: 1, y: -8 }, { x: -5, y: -16 }, { x: -9, y: -25 }, { x: -17, y: -32 }, 18);
      taper(ctx, P, 3.7, 0.4);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.7;
      for (let k = 1; k < 16; k += 2) {
        const a = P[k], b = P[k + 1], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, hw = lerp(3.7, 0.4, k / 18) / 2;
        seg(ctx, { x: a.x + nx * hw, y: a.y + ny * hw }, { x: P[k + 2].x - nx * hw, y: P[k + 2].y - ny * hw });
      }
      break;
    }
    case 'karang': {
      const main = quad({ x: 0, y: -8 }, { x: -6, y: -15 }, { x: -8, y: -24 }, 8);
      taper(ctx, main, 3.3, 1.6);
      const tips: Vec[] = [main[8]];
      const br = (a: Vec, c: Vec, e: Vec, wd: number) => { taper(ctx, quad(a, c, e, 6), wd, wd * 0.7); circ(ctx, e.x, e.y, wd * 0.45); tips.push(e); };
      br(main[3], { x: -1, y: -15 }, { x: 2.5, y: -19.5 }, 1.9);
      br(main[5], { x: -12, y: -18 }, { x: -15.5, y: -22 }, 1.7);
      br(main[8], { x: -5, y: -28 }, { x: -2.5, y: -30 }, 1.4);
      br(main[8], { x: -11, y: -27 }, { x: -13.5, y: -29 }, 1.3);
      ctx.fillStyle = shade(hc, 0.4);
      for (const e of tips) circ(ctx, e.x, e.y, 0.9);
      break;
    }
    case 'sakura': {
      const main = quad({ x: 0, y: -8 }, { x: -8, y: -14 }, { x: -19, y: -20 }, 8);
      taper(ctx, main, 2.6, 0.8);
      taper(ctx, quad(main[3], { x: -5, y: -16 }, { x: -4, y: -21 }, 5), 1.4, 0.5);
      taper(ctx, quad(main[6], { x: -17, y: -16 }, { x: -22, y: -14 }, 5), 1.2, 0.5);
      if (!far) { blossom(ctx, -4, -21.5, 2.7, t * 0.3); blossom(ctx, -19.5, -21, 2.4, 1 + t * 0.2); blossom(ctx, -22.5, -13.5, 2.1, 2); blossom(ctx, -11, -17.5, 1.9, 0.5); }
      break;
    }
    case 'duri': {
      const sp: [number, number, number][] = [[7, -8, 6], [3, -9.4, 8], [-1, -9.6, 9.5], [-5, -9, 8.5], [-9, -7.8, 7], [-13, -6.2, 5]];
      for (const [x, y, len] of sp) polyFill(ctx, [{ x: x - 1.7, y: y + 0.7 }, { x: x + Math.cos(-2.3) * len, y: y + Math.sin(-2.3) * len }, { x: x + 1.7, y: y + 0.7 }]);
      break;
    }
    case 'nyala': {
      const A = far ? 0.5 : 1;
      for (const [bx, by, a, len] of [[1, -8, -2.15, 15], [-4, -7.5, -2.45, 12]] as [number, number, number, number][]) {
        const ux = Math.cos(a), uy = Math.sin(a);
        const at = (p: number, q: number): Vec => ({ x: bx + ux * p - uy * q, y: by + uy * p + ux * q });
        flame(ctx, at, len * 1.15, 4.2, t, 1, `rgba(${skin.glow},${0.55 * A})`);
        flame(ctx, at, len, 2.6, t + 0.3, 1, hexA(hc, 0.95 * A));
        flame(ctx, at, len * 0.6, 1.3, t + 0.6, 1, `rgba(255,255,245,${0.9 * A})`);
      }
      break;
    }
    case 'rusa':
      taper(ctx, cubic({ x: 1, y: -7.5 }, { x: -4, y: -13 }, { x: -10, y: -17 }, { x: -18, y: -19 }), 2.8, 1);
      taper(ctx, quad({ x: -5, y: -13.6 }, { x: -4.4, y: -18 }, { x: -2.4, y: -22 }, 6), 1.9, 0.7);
      taper(ctx, quad({ x: -11, y: -17 }, { x: -12.6, y: -22 }, { x: -10.4, y: -26 }, 6), 1.7, 0.6);
      break;
    case 'kambing': {
      const P: Vec[] = [];
      for (let k = 0; k <= 22; k++) { const s = k / 22, a = 0.55 - s * Math.PI * 1.75, r = 7.6 - s * 4.6; P.push({ x: -5 + Math.cos(a) * r, y: -11.5 + Math.sin(a) * r }); }
      taper(ctx, P, 3.8, 1.3); rings(ctx, P, 3.8, 1.3, 3);
      break;
    }
    case 'tombak':
      taper(ctx, quad({ x: 1, y: -7 }, { x: -8, y: -14.5 }, { x: -21, y: -21 }, 10), 3.4, 0.3);
      break;
    case 'mahkota': {
      const sp: [number, number, number, number][] = [[8, -8.6, 5, -1.85], [4, -9.6, 7, -2.0], [0, -9.7, 9.5, -2.15], [-4, -9, 8.5, -2.3], [-8, -7.8, 6.5, -2.45]];
      for (const [x, y, len, a] of sp) polyFill(ctx, [{ x: x - 1.9, y: y + 0.8 }, { x: x + Math.cos(a) * len, y: y + Math.sin(a) * len }, { x: x + 1.9, y: y + 0.8 }]);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; circ(ctx, Math.cos(-2.15) * 4, -9.7 + Math.sin(-2.15) * 4, 0.9);
      break;
    }
    case 'unikorn': {
      const base = { x: 10, y: -7.4 }, tip = { x: 20.5, y: -22.5 };
      const P: Vec[] = [];
      for (let k = 0; k <= 6; k++) P.push({ x: lerp(base.x, tip.x, k / 6), y: lerp(base.y, tip.y, k / 6) });
      taper(ctx, P, 3.8, 0.3);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.6;
      const ddx = tip.x - base.x, ddy = tip.y - base.y, l = Math.hypot(ddx, ddy), ux = ddx / l, uy = ddy / l, nx = -uy, ny = ux;
      for (let k = 1; k <= 4; k++) {
        const s = k / 5, hw = lerp(1.9, 0.2, s), cx = lerp(base.x, tip.x, s), cy = lerp(base.y, tip.y, s);
        seg(ctx, { x: cx - nx * hw + ux * 0.9, y: cy - ny * hw + uy * 0.9 }, { x: cx + nx * hw - ux * 0.9, y: cy + ny * hw - uy * 0.9 });
      }
      break;
    }
    case 'bulan':
      taper(ctx, cubic({ x: 0, y: -8 }, { x: -12, y: -9 }, { x: -17.5, y: -21 }, { x: -9, y: -27.5 }, 12), 3.3, 0.4);
      break;
  }
}

function drawEye(ctx: CanvasRenderingContext2D, id: EyeId, skin: Skin, t: number) {
  const G = skin.glow;
  switch (id) {
    case 'bulat':
      ctx.fillStyle = skin.eye; ell(ctx, 8, -4.5, 2.6, 1.8, -0.2);
      ctx.fillStyle = skin.pupil; circ(ctx, 8.7, -4.5, 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; circ(ctx, 8.1, -5.1, 0.5);
      break;
    case 'tajam':
      ctx.fillStyle = skin.eye;
      ctx.beginPath(); ctx.moveTo(5, -4.1); ctx.quadraticCurveTo(8, -6.6, 11.2, -4.9); ctx.quadraticCurveTo(8.3, -3, 5, -4.1); ctx.fill();
      ctx.fillStyle = skin.pupil; ell(ctx, 8.5, -4.6, 0.55, 1.25, 0);
      ctx.strokeStyle = skin.dark; ctx.lineWidth = 1.5;
      seg(ctx, { x: 4.4, y: -7.1 }, { x: 11.4, y: -5.7 });
      break;
    case 'lembut':
      ctx.strokeStyle = skin.pupil; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(5.6, -4); ctx.quadraticCurveTo(8.2, -6.8, 10.8, -4.1); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,160,0.35)'; ell(ctx, 9.5, -1.2, 2.2, 1.2, 0);
      break;
    case 'kucing':
      ctx.fillStyle = `rgb(${G})`; ell(ctx, 8.2, -4.6, 2.7, 2.0, -0.15);
      ctx.fillStyle = '#141018'; ell(ctx, 8.6, -4.6, 0.5, 1.75, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; circ(ctx, 7.6, -5.4, 0.55);
      break;
    case 'bintang': {
      ctx.fillStyle = skin.pupil; circ(ctx, 8.3, -4.6, 3);
      ctx.fillStyle = '#ffffff'; circ(ctx, 9.3, -5.7, 1.05); circ(ctx, 7.4, -3.6, 0.5);
      const tw = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`; star4(ctx, 11.4, -7.6, 0.6 + tw * 1.1);
      break;
    }
    case 'roh': {
      const gr = ctx.createRadialGradient(8.3, -4.6, 0, 8.3, -4.6, 6.5);
      gr.addColorStop(0, `rgba(${G},0.75)`); gr.addColorStop(1, `rgba(${G},0)`);
      ctx.fillStyle = gr; circ(ctx, 8.3, -4.6, 6.5);
      ctx.fillStyle = '#ffffff'; ell(ctx, 8.3, -4.6, 2.4, 1.4, -0.15);
      break;
    }
    case 'predator': {
      const gr = ctx.createRadialGradient(8.6, -4.8, 0, 8.6, -4.8, 3.4);
      gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.5, `rgb(${G})`); gr.addColorStop(1, shade(`rgb(${G})`, -0.35));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(4.4, -4.3); ctx.quadraticCurveTo(8.2, -6.9, 12.3, -5.3); ctx.quadraticCurveTo(8.6, -2.7, 4.4, -4.3); ctx.fill();
      ctx.fillStyle = '#120a08'; ell(ctx, 8.8, -4.75, 0.42, 1.4, 0.12);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; circ(ctx, 7.5, -5.2, 0.38);
      ctx.fillStyle = skin.dark; polyFill(ctx, [{ x: 3.4, y: -6.9 }, { x: 12.8, y: -6.6 }, { x: 12.4, y: -5.6 }, { x: 4.2, y: -5.7 }]);
      break;
    }
    case 'tenang': {
      ctx.save(); ctx.beginPath(); ctx.rect(3.5, -4.85, 10, 5); ctx.clip();
      ctx.fillStyle = skin.eye; ell(ctx, 8.3, -4.5, 2.7, 1.9, -0.12);
      ctx.fillStyle = skin.pupil; circ(ctx, 8.7, -4.4, 1.3);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; circ(ctx, 8.1, -4.3, 0.35);
      ctx.restore();
      ctx.strokeStyle = skin.dark; ctx.lineWidth = 1.15;
      ctx.beginPath(); ctx.moveTo(5.3, -4.7); ctx.quadraticCurveTo(8.3, -5.5, 11.2, -4.9); ctx.stroke();
      ctx.lineWidth = 0.6; seg(ctx, { x: 10.6, y: -4.95 }, { x: 11.8, y: -5.6 });
      break;
    }
    case 'kristal': {
      const gl = ctx.createRadialGradient(8.3, -4.6, 0, 8.3, -4.6, 6.5);
      gl.addColorStop(0, `rgba(${G},0.6)`); gl.addColorStop(1, `rgba(${G},0)`);
      ctx.fillStyle = gl; circ(ctx, 8.3, -4.6, 6.5);
      const g2 = ctx.createLinearGradient(8.3, -7.4, 8.3, -1.9);
      g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, `rgb(${G})`);
      const D = [{ x: 5, y: -4.6 }, { x: 8.3, y: -7.4 }, { x: 11.6, y: -4.6 }, { x: 8.3, y: -1.9 }];
      ctx.fillStyle = g2; polyFill(ctx, D);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.4;
      for (const p of D) seg(ctx, { x: 8.3, y: -4.6 }, p);
      const tw = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * tw})`; star4(ctx, 11.2, -7.2, 0.7 + tw * 1.1);
      break;
    }
    case 'mistis': {
      const tr = ctx.createLinearGradient(8, -4.6, -8, -6);
      tr.addColorStop(0, `rgba(${G},0.75)`); tr.addColorStop(1, `rgba(${G},0)`);
      const wv = Math.sin(t * 3) * 0.8;
      ctx.fillStyle = tr; polyFill(ctx, [{ x: 8, y: -5.9 }, { x: -9, y: -7.4 + wv }, { x: -9, y: -5.8 + wv }, { x: 8, y: -3.3 }]);
      const gl = ctx.createRadialGradient(8.3, -4.6, 0, 8.3, -4.6, 6);
      gl.addColorStop(0, `rgba(${G},0.65)`); gl.addColorStop(1, `rgba(${G},0)`);
      ctx.fillStyle = gl; circ(ctx, 8.3, -4.6, 6);
      ctx.fillStyle = '#ffffff'; ell(ctx, 8.3, -4.6, 2.7, 1.75, -0.12);
      ctx.fillStyle = `rgba(${G},0.35)`; ell(ctx, 8.5, -4.5, 1.6, 1, -0.12);
      break;
    }
    case 'sabit':
      ctx.fillStyle = `rgb(${G})`; ell(ctx, 8.2, -4.6, 2.7, 2, -0.12);
      ctx.fillStyle = skin.pupil; circ(ctx, 8.6, -4.6, 1.35);
      ctx.fillStyle = `rgb(${G})`; circ(ctx, 9.25, -4.95, 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; circ(ctx, 7.4, -5.5, 0.45);
      break;
    case 'galaksi': {
      const gr = ctx.createRadialGradient(8.6, -4.9, 0.2, 8.3, -4.6, 3);
      gr.addColorStop(0, '#ffb3e6'); gr.addColorStop(0.45, '#7a5cff'); gr.addColorStop(1, '#0d0b2e');
      ctx.fillStyle = gr; ell(ctx, 8.3, -4.6, 2.8, 2.1, -0.12);
      for (let k = 0; k < 4; k++) { const a = t * 0.8 + k * 1.6; ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 4 + k)})`; circ(ctx, 8.3 + Math.cos(a) * 1.5, -4.6 + Math.sin(a), 0.32); }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.ellipse(8.3, -4.6, 2.8, 2.1, -0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffffff'; circ(ctx, 7.5, -5.5, 0.5);
      break;
    }
    case 'lentik': {
      ctx.fillStyle = skin.eye; ell(ctx, 8.3, -4.5, 2.9, 2.2, -0.1);
      ctx.fillStyle = skin.pupil; circ(ctx, 8.7, -4.4, 1.75);
      ctx.fillStyle = '#ffffff'; circ(ctx, 8, -5.1, 0.6); circ(ctx, 9.3, -3.8, 0.3);
      ctx.strokeStyle = skin.dark; ctx.lineWidth = 0.75;
      for (const [x0, y0, x1, y1] of [[6, -6.1, 4.2, -8.4], [7.5, -6.6, 6.4, -9.2], [9.1, -6.7, 8.8, -9.4]] as [number, number, number, number][]) {
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 - 0.8, (y0 + y1) / 2, x1, y1); ctx.stroke();
      }
      break;
    }
    case 'reptil': {
      const gr = ctx.createRadialGradient(8.4, -4.6, 0.3, 8.3, -4.6, 3);
      gr.addColorStop(0, '#fff0a8'); gr.addColorStop(0.6, '#f0b030'); gr.addColorStop(1, '#8a5210');
      ctx.fillStyle = gr; ell(ctx, 8.3, -4.6, 2.8, 2.1, -0.1);
      ctx.strokeStyle = 'rgba(90,50,0,0.35)'; ctx.lineWidth = 0.3;
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; seg(ctx, { x: 8.3 + Math.cos(a) * 0.9, y: -4.6 + Math.sin(a) * 0.7 }, { x: 8.3 + Math.cos(a) * 2.5, y: -4.6 + Math.sin(a) * 1.9 }); }
      ctx.fillStyle = '#140c06'; ell(ctx, 8.4, -4.6, 0.38, 1.85, 0);
      ctx.strokeStyle = skin.dark; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(8.3, -4.6, 2.8, 2.1, -0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; circ(ctx, 7.5, -5.5, 0.4);
      break;
    }
    case 'bara': {
      const fl = 0.75 + 0.25 * Math.sin(t * 14) * Math.sin(t * 5.3);
      const gl = ctx.createRadialGradient(8.3, -4.6, 0, 8.3, -4.6, 6);
      gl.addColorStop(0, `rgba(255,130,40,${0.55 * fl})`); gl.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gl; circ(ctx, 8.3, -4.6, 6);
      const gr = ctx.createRadialGradient(8.5, -4.7, 0.2, 8.3, -4.6, 2.9);
      gr.addColorStop(0, '#fff6b8'); gr.addColorStop(0.45, '#ff8a1e'); gr.addColorStop(1, '#a8200c');
      ctx.fillStyle = gr; ell(ctx, 8.3, -4.6, 2.7, 1.9, -0.12);
      ctx.fillStyle = '#2a0800'; circ(ctx, 8.7, -4.6, 0.7);
      break;
    }
    case 'teratai': {
      ctx.fillStyle = hexA(skin.fin, 0.95);
      polyFill(ctx, [{ x: 5.2, y: -4 }, { x: -4.5, y: -8 }, { x: -1.2, y: -5.3 }, { x: 5.4, y: -3.2 }]);
      ctx.fillStyle = '#e2483a'; circ(ctx, 8.4, -8.6, 0.8);
      ctx.fillStyle = skin.eye; ell(ctx, 8.3, -4.6, 2.7, 1.8, -0.15);
      ctx.fillStyle = `rgb(${G})`; circ(ctx, 8.7, -4.6, 1.3);
      ctx.fillStyle = skin.pupil; circ(ctx, 8.8, -4.6, 0.6);
      ctx.fillStyle = '#ffffff'; circ(ctx, 8.2, -5.2, 0.4);
      ctx.strokeStyle = '#e2483a'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(5.4, -5.5); ctx.quadraticCurveTo(8.5, -7.4, 11.4, -5.6); ctx.stroke();
      break;
    }
  }
}

function drawHead(ctx: CanvasRenderingContext2D, g: DragonGeo, skin: Skin, M: Mat, parts: Parts, op: DrawOpts) {
  const t = op.t, wv = op.limp ? 0.2 : 1;
  const h = g.pts[0];
  const histAng = Math.atan2(g.pts[0].y - g.pts[2].y, g.pts[0].x - g.pts[2].x);
  // Heading responsif: kepala naga mengarah langsung sesuai arah kemudi pemain (lincah & gesit seperti skate)
  const ha = op.ang !== undefined && !op.limp ? op.ang : histAng;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(ha);
  // Kemiringan carving skate: kepala & leher ikut condong saat meliuk tajam
  const bankLean = (op.bank ?? 0) * 0.16;
  ctx.rotate(bankLean);

  // Skala kepala & tanduk naga (default 1.4× lebih panjang, proporsional dan bisa di-adjust kembali normal 1.0×)
  const headScale = op.headScale ?? 1.4;
  const hornScale = op.hornScale ?? 1.4;
  ctx.scale(headScale, 1 + (headScale - 1) * 0.3);

  // saat naga berguling (berbalik arah), kepala ikut membalik agar tanduk & mata tetap menghadap ke atas
  const cr = Math.cos(op.twist?.[0] ?? 0);
  if (cr < 0.999) ctx.scale(1, cr >= 0 ? Math.max(0.3, cr) : Math.min(-0.3, cr));
  if (parts.frill === 'leher' || parts.frill === 'lengkap') neckFrill(ctx, M, t, wv);
  ctx.fillStyle = skin.mane;
  for (let k = 0; k < 3; k++) {
    const m = Math.sin(t * 6 + k) * 2 * wv;
    ctx.beginPath(); ctx.moveTo(-2, -6 + k * 2.5);
    ctx.quadraticCurveTo(-9, -10 + k * 4 + m, -15 - k, -6 + k * 5 + m);
    ctx.quadraticCurveTo(-8, -3 + k * 3, -2, -2 + k * 2.5); ctx.fill();
  }
  if (parts.frill === 'telinga' || parts.frill === 'lengkap') earFin(ctx, M, t, wv);
  const single = parts.horn === 'unikorn' || parts.horn === 'mahkota' || parts.horn === 'duri';
  const hornS = 1.25 * hornScale;
  if (!single) { ctx.save(); ctx.translate(-2.6, 1.4); ctx.translate(0, -7); ctx.scale(hornS, hornS); ctx.translate(0, 7); drawHorn(ctx, parts.horn, shade(skin.horn, -0.32), skin, t, true); ctx.restore(); }
  ctx.fillStyle = M.head;
  ctx.beginPath();
  ctx.moveTo(-6, -9); ctx.quadraticCurveTo(6, -11, 12, -6); ctx.lineTo(22, -3);
  ctx.quadraticCurveTo(25, 0, 22, 2); ctx.lineTo(10, 6); ctx.quadraticCurveTo(2, 10, -6, 8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.25 * M.shine})`;
  ctx.beginPath(); ctx.moveTo(-3, -8.2); ctx.quadraticCurveTo(6, -10, 12, -5.6); ctx.quadraticCurveTo(5, -7.6, -3, -6.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = skin.belly;
  ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(22, 1.5); ctx.lineTo(10, 6.5); ctx.closePath(); ctx.fill();
  const hornFill = lin(ctx, { x: 2, y: -6 }, { x: -20, y: -26 }, skin.hornGrad ?? [shade(skin.horn, 0.3), skin.horn, shade(skin.horn, -0.18)]);
  ctx.save(); ctx.translate(0, -7); ctx.scale(hornS, hornS); ctx.translate(0, 7); drawHorn(ctx, parts.horn, hornFill, skin, t, false); ctx.restore();
  drawEye(ctx, parts.eye, skin, t);
  ctx.strokeStyle = skin.whisker; ctx.lineWidth = 1.2;
  const w1 = Math.sin(t * 4) * 6 * wv, w2 = Math.cos(t * 3.4) * 6 * wv;
  ctx.beginPath(); ctx.moveTo(20, -1); ctx.bezierCurveTo(12, 10, -6, 4 + w1, -28, 14 + w1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(19, 2); ctx.bezierCurveTo(10, 16, -4, 12 + w2, -22, 24 + w2); ctx.stroke();
  ctx.restore();
}

import { shade, taper, type Vec } from './dragon';

// =================== GAYA PENUNGGANG ===================
export type HatType =
  | 'caping' | 'bun' | 'monk' | 'kabuto' | 'hood' | 'aviator' | 'topknot' | 'cloud'
  | 'wizard' | 'longhair' | 'lotus' | 'fox' | 'ninja' | 'twinbun' | 'plume';
export type TrailKind = 'scarf' | 'hair' | 'cape';
export type AccType = 'sword' | 'staff' | 'lantern' | 'foxfire';
export interface RiderStyle {
  id: string; name: string; title: string; desc: string;
  robe: string; robeDark: string; skin: string; hair: string; scarf: string; accent: string; hat: HatType;
  trail?: TrailKind; acc?: AccType; trailGrad?: string[]; isNew?: boolean;
}

export const RIDERS: RiderStyle[] = [
  { id: 'kaze', name: 'Kaze', title: 'Sang Pengembara', desc: 'Pengelana bertopi caping yang tenang, mengikuti ke mana angin berembus.', robe: '#3d4f86', robeDark: '#27335a', skin: '#f2c9a5', hair: '#2b2230', scarf: '#e5533d', accent: '#e8cf98', hat: 'caping' },
  { id: 'mei', name: 'Mei', title: 'Putri Angin', desc: 'Penari langit bersanggul dengan pita yang ikut menari.', robe: '#f4e9ee', robeDark: '#d3bcc7', skin: '#f6d2b8', hair: '#3a2433', scarf: '#46b5a6', accent: '#f08aa8', hat: 'bun' },
  { id: 'tenzin', name: 'Tenzin', title: 'Biksu Gunung', desc: 'Biksu pendiam dari puncak bersalju, jubah safronnya berkibar.', robe: '#e8902e', robeDark: '#b7651a', skin: '#d9a47c', hair: '#3a2a20', scarf: '#8e2f3a', accent: '#7a3b1f', hat: 'monk' },
  { id: 'ryu', name: 'Ryu', title: 'Samurai Senja', desc: 'Penjaga gerbang dengan helm berhias bulan sabit emas.', robe: '#3a3848', robeDark: '#22212c', skin: '#e6b892', hair: '#17151d', scarf: '#f2c14e', accent: '#f2c14e', hat: 'kabuto' },
  { id: 'sora', name: 'Sora', title: 'Penjelajah Awan', desc: 'Petualang berkerudung dengan kacamata terbang.', robe: '#5f7d55', robeDark: '#3f5639', skin: '#efc39f', hair: '#4a3020', scarf: '#f08c3a', accent: '#bfe3f0', hat: 'hood' },
  { id: 'aero', name: 'Aero', title: 'Penjelajah Langit', desc: 'Penerbang pemberani bertopi kulit dan kacamata, syal putihnya selalu berkibar.', robe: '#8a5a3c', robeDark: '#5e3c27', skin: '#f0c4a0', hair: '#5a3a24', scarf: '#f4efe6', accent: '#9fd8ef', hat: 'aviator', isNew: true },
  { id: 'hayate', name: 'Hayate', title: 'Pendekar Zen', desc: 'Pendekar tenang berkuncir dengan pedang di punggung. Setiap gerakannya hening.', robe: '#eeeae0', robeDark: '#2e3a5e', skin: '#ecc19c', hair: '#1c1820', scarf: '#2e3a5e', accent: '#c23b3b', hat: 'topknot', acc: 'sword', isNew: true },
  { id: 'kumo', name: 'Kumo', title: 'Penjaga Awan', desc: 'Penjaga gerbang langit berjubah awan. Jubahnya mengalir seperti kabut.', robe: '#dfe9f7', robeDark: '#9fb4d6', skin: '#f6d6be', hair: '#c8d4ea', scarf: '#ffffff', accent: '#8fc6e8', hat: 'cloud', trail: 'cape', isNew: true },
  { id: 'astra', name: 'Astra', title: 'Penyihir Kosmik', desc: 'Penyihir pembaca bintang dengan topi berhias rasi dan tongkat cahaya.', robe: '#3b2a7a', robeDark: '#21184a', skin: '#efc8b0', hair: '#c9b8ff', scarf: '#8a6cff', accent: '#ffd76a', hat: 'wizard', acc: 'staff', trail: 'cape', isNew: true },
  { id: 'lumi', name: 'Lumi', title: 'Pengelana Aurora', desc: 'Rambut panjangnya berkilau seperti cahaya utara yang menari.', robe: '#2f7f86', robeDark: '#1d555c', skin: '#f6d4bf', hair: '#7dffc4', scarf: '#7dffc4', accent: '#ff9ad5', hat: 'longhair', trail: 'hair', trailGrad: ['#7dffc4', '#5fe0ff', '#b57bff', '#ff9ad5'], isNew: true },
  { id: 'padma', name: 'Padma', title: 'Putri Teratai', desc: 'Putri dari kolam teratai, mahkota bunganya tak pernah layu.', robe: '#f6b8cc', robeDark: '#d987a3', skin: '#f6d2b8', hair: '#3a2433', scarf: '#ffe08a', accent: '#ffffff', hat: 'lotus', isNew: true },
  { id: 'kitsu', name: 'Kitsu', title: 'Roh Kitsune', desc: 'Pengelana bertopeng rubah yang misterius, ditemani api rubah biru.', robe: '#f4f0ea', robeDark: '#c8432f', skin: '#f2cdb0', hair: '#f08c3a', scarf: '#c8432f', accent: '#5fd0ff', hat: 'fox', acc: 'foxfire', isNew: true },
  { id: 'kage', name: 'Kage', title: 'Ninja Bayangan', desc: 'Senyap seperti bayangan, ikat kepalanya menari di angin.', robe: '#2a2a38', robeDark: '#15151f', skin: '#e8bf9a', hair: '#15151f', scarf: '#7a3cff', accent: '#b8b8c8', hat: 'ninja', isNew: true },
  { id: 'tomo', name: 'Tomo', title: 'Gadis Lentera', desc: 'Membawa lentera kecil yang menerangi jalan para naga di malam hari.', robe: '#d9534a', robeDark: '#a3332c', skin: '#f6d2b8', hair: '#2b1d24', scarf: '#ffcf6e', accent: '#ffcf6e', hat: 'twinbun', acc: 'lantern', isNew: true },
  { id: 'sol', name: 'Sol', title: 'Kesatria Fajar', desc: 'Kesatria berzirah perak dengan jambul merah dan jubah yang megah.', robe: '#c9d1de', robeDark: '#8a96aa', skin: '#eec4a2', hair: '#3a2a20', scarf: '#d9443a', accent: '#d9443a', hat: 'plume', trail: 'cape', isNew: true },
];
export function riderById(id: string) { return RIDERS.find((r) => r.id === id) || RIDERS[0]; }

// =================== FISIKA ===================
export interface PP { x: number; y: number; ox: number; oy: number; vx: number; vy: number; r: number; im: number }
export interface RideFrame { seat: Vec; f: Vec; u: Vec; grip: Vec; lean: number }
export interface PhysWorld { ground?: (x: number) => number; solids?: Vec[][]; wind: Vec; gravity?: number }

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const mid = (a: Vec, b: Vec): Vec => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const nrm = (x: number, y: number): Vec => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };

export function solveDist(A: PP, B: PP, mn: number, mx: number, wa = A.im, wb = B.im) {
  const dx = B.x - A.x, dy = B.y - A.y;
  const d = Math.hypot(dx, dy) || 0.0001;
  const target = d < mn ? mn : d > mx ? mx : d;
  if (target === d) return;
  const ws = wa + wb;
  if (ws <= 0) return;
  const k = (d - target) / d / ws;
  A.x += dx * k * wa; A.y += dy * k * wa;
  B.x -= dx * k * wb; B.y -= dy * k * wb;
}

function inside(p: Vec, poly: Vec[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

export function collidePoint(q: PP, w: PhysWorld, friction: number) {
  if (w.solids) {
    for (const poly of w.solids) {
      if (!inside(q, poly)) continue;
      let best = Infinity, bx = q.x, by = q.y;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[j], b = poly[i];
        const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey || 1;
        const t = clamp(((q.x - a.x) * ex + (q.y - a.y) * ey) / l2, 0, 1);
        const px = a.x + ex * t, py = a.y + ey * t;
        const d = (q.x - px) ** 2 + (q.y - py) ** 2;
        if (d < best) { best = d; bx = px; by = py; }
      }
      const d = Math.sqrt(best) || 0.001;
      q.x = bx + ((bx - q.x) / d) * q.r;
      q.y = by + ((by - q.y) / d) * q.r;
      if (friction > 0) { q.x -= (q.x - q.ox) * friction; q.y -= (q.y - q.oy) * friction * 0.5; }
    }
  }
  if (w.ground) {
    const gy = w.ground(q.x) - q.r;
    if (q.y > gy) { q.y = gy; if (friction > 0) q.x -= (q.x - q.ox) * friction; }
  }
}

const HEAD = 0, NECK = 1, PELV = 2, EN = 3, HN = 4, EF = 5, HF = 6, KN = 7, FN = 8, KF = 9, FF = 10;
const BONES: [number, number, number][] = [
  [HEAD, NECK, 5.2], [NECK, PELV, 10], [NECK, EN, 5.4], [EN, HN, 5.4], [NECK, EF, 5.4], [EF, HF, 5.4],
  [PELV, KN, 6.6], [KN, FN, 6.6], [PELV, KF, 6.6], [KF, FF, 6.6],
];
const LIMITS: [number, number, number, number][] = [
  [HEAD, PELV, 13, 16], [NECK, HN, 4.6, 11], [NECK, HF, 4.6, 11], [PELV, FN, 5.5, 13.2], [PELV, FF, 5.5, 13.2],
  [HEAD, KN, 9, 30], [HEAD, KF, 9, 30], [KN, KF, 0, 9], [EN, PELV, 6, 20],
];
const RADII = [3.8, 2.6, 3.2, 1.8, 1.6, 1.8, 1.6, 2.1, 1.8, 2.1, 1.8];
const INV_M = [1, 0.8, 0.6, 1.4, 1.6, 1.4, 1.6, 1.1, 1.3, 1.1, 1.3];
const STIFF = [15, 28, 0, 18, 30, 18, 30, 30, 32, 30, 32];
const TRAIL: Record<TrailKind, [number, number, number]> = { scarf: [15, 4.2, 1], hair: [12, 3.5, 0.55], cape: [9, 3.6, 0.7] };

function limb(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, c: Vec, w: number, col: string) {
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke();
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function line(ctx: CanvasRenderingContext2D, a: Vec, b: Vec) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); }
function tri(ctx: CanvasRenderingContext2D, a: number[]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]); ctx.closePath(); ctx.fill(); }
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const i = r * 0.35;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + i, y - i); ctx.lineTo(x + r, y); ctx.lineTo(x + i, y + i);
  ctx.lineTo(x, y + r); ctx.lineTo(x - i, y + i); ctx.lineTo(x - r, y); ctx.lineTo(x - i, y - i); ctx.closePath(); ctx.fill();
}

export class Rider {
  style: RiderStyle;
  p: PP[] = [];
  scarf: PP[] = [];
  mode: 'ride' | 'ragdoll' = 'ride';
  gripping = false;
  time = 0;
  cheer = 0;
  // arah hadap penunggang (+1 = menghadap arah terbang normal, −1 = cermin) — dihitung dari kerangka naga
  face = 1;

  constructor(style: RiderStyle) { this.style = style; }
  faceOf(fr: RideFrame) { return fr.f.y * fr.u.x - fr.f.x * fr.u.y >= 0 ? 1 : -1; }
  get kind(): TrailKind { return this.style.trail ?? 'scarf'; }

  reset() { this.p = []; this.scarf = []; this.mode = 'ride'; this.gripping = false; this.stunt = null; }

  // ================= SALTO PENUNGGANG (FREESTYLE OTOMATIS) =================
  stunt: { t: number; dur: number; n: number; dir: number; h: number; face: number } | null = null;
  onLand?: (n: number, front: boolean) => void;

  // mulai salto: n = jumlah putaran, front = salto depan (selain itu salto belakang)
  startFlip(n = 1, front = false) {
    if (this.mode !== 'ride' || this.stunt || !this.p.length) return false;
    this.stunt = { t: 0, dur: 0.6 + 0.36 * n, n, dir: front ? 1 : -1, h: 30 + 12 * n, face: this.face };
    return true;
  }

  // pose salto: melompat dari pelana, meringkuk (lutut ke dada) sambil berputar, lalu mendarat kembali di punggung naga
  stuntPose(fr: RideFrame, s: number, st: { n: number; dir: number; h: number; face: number }): Vec[] {
    const T = this.targets(fr);
    const S = fr.seat, fx = st.face;
    const L = (a: number, b: number): Vec => ({ x: S.x + fx * a, y: S.y - b });
    // urutan sendi: kepala, leher, panggul, siku/tangan dekat, siku/tangan jauh, lutut/kaki dekat, lutut/kaki jauh
    const tk: Vec[] = [L(3.2, 15.2), L(1.8, 10.2), L(0, 0), L(4.6, 6.6), L(6.0, 2.8), L(4.2, 6.9), L(5.6, 3.1), L(5.4, 5.2), L(3.0, -0.6), L(5.0, 4.8), L(2.6, -0.8)];
    const sm = (x: number) => x * x * (3 - 2 * x);
    const k = s < 0.2 ? sm(s / 0.2) : s > 0.8 ? sm((1 - s) / 0.2) : 1;
    const e = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
    const th = st.dir * fx * Math.PI * 2 * st.n * e;
    const lift = Math.sin(Math.PI * s) * st.h;
    const cx = S.x, cy = S.y - 6.5, c = Math.cos(th), sn = Math.sin(th);
    return T.map((p, i) => {
      const px = p.x + (tk[i].x - p.x) * k - cx, py = p.y + (tk[i].y - p.y) * k - cy;
      return { x: cx + px * c - py * sn, y: cy + px * sn + py * c - lift };
    });
  }

  updateStunt(dt: number, fr: RideFrame, w: PhysWorld) {
    const st = this.stunt!;
    st.t += dt;
    const s = Math.min(1, st.t / st.dur);
    this.face = s > 0.85 ? this.faceOf(fr) : st.face;
    const P = this.stuntPose(fr, s, st);
    for (let i = 0; i < this.p.length; i++) {
      const q = this.p[i];
      q.ox = q.x; q.oy = q.y;
      q.x = P[i].x; q.y = P[i].y;
      q.vx = (q.x - q.ox) / dt; q.vy = (q.y - q.oy) / dt;
    }
    this.gripping = false;
    this.stepScarf(dt, w);
    if (s >= 1) { this.stunt = null; this.onLand?.(st.n, st.dir > 0); }
  }

  // pose duduk dikejar pegas (active ragdoll); kedua tangan menggenggam surai naga
  targets(fr: RideFrame): Vec[] {
    const { seat: S, f, u, grip } = fr;
    const ln = clamp(fr.lean, -0.2, 1.1);
    const d = nrm(u.x * Math.cos(ln) + f.x * Math.sin(ln), u.y * Math.cos(ln) + f.y * Math.sin(ln));
    const C = add(S, d, 10);
    const hd = nrm(d.x * 0.6 + u.x * 0.4 + f.x * 0.15, d.y * 0.6 + u.y * 0.4 + f.y * 0.15);
    const H = add(C, hd, 5.2);
    let hn = add(grip, f, 0.8), en = add(add(mid(C, hn), u, -2.1), f, -1.2);
    const hf = add(add(grip, f, -1), u, 0.4);
    const ef = add(add(mid(C, hf), u, -1.9), f, -1.6);
    if (this.cheer > 0) {
      const k = Math.min(1, this.cheer / 0.25);
      const up = add(add(C, u, 8.5), f, 3.5), eu = add(add(C, u, 4.6), f, 3.4);
      hn = { x: hn.x + (up.x - hn.x) * k, y: hn.y + (up.y - hn.y) * k };
      en = { x: en.x + (eu.x - en.x) * k, y: en.y + (eu.y - en.y) * k };
    }
    const kn = add(add(S, f, 4.8), u, -3.4);
    const fn = add(add(S, f, 1.4), u, -9.4);
    return [H, C, S, en, hn, ef, hf, kn, fn, add(kn, f, -1.1), add(fn, f, -1.1)];
  }

  anchor(): Vec {
    const h = this.p[HEAD], n = this.p[NECK];
    const k = this.kind;
    if (k === 'scarf') return { x: n.x + (h.x - n.x) * 0.3, y: n.y + (h.y - n.y) * 0.3 };
    const s = nrm(h.x - n.x, h.y - n.y), fwd = { x: -s.y * this.face, y: s.x * this.face };
    if (k === 'hair') return { x: h.x - fwd.x * 2.6 + s.x * 0.8, y: h.y - fwd.y * 2.6 + s.y * 0.8 };
    return { x: n.x - fwd.x * 1.8 + s.x * 0.5, y: n.y - fwd.y * 1.8 + s.y * 0.5 };
  }

  initChain(fdir: Vec) {
    const [n, len] = TRAIL[this.kind];
    const a = this.anchor();
    this.scarf = [];
    for (let i = 0; i < n; i++) {
      const x = a.x - fdir.x * i * len, y = a.y - fdir.y * i * len + i * 0.5;
      this.scarf.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, r: 1, im: 1 });
    }
  }

  snap(fr: RideFrame) {
    this.face = this.faceOf(fr);
    const T = this.targets(fr);
    this.p = T.map((t, i) => ({ x: t.x, y: t.y, ox: t.x, oy: t.y, vx: 0, vy: 0, r: RADII[i], im: INV_M[i] }));
    this.initChain(fr.f);
    this.mode = 'ride';
    this.gripping = true;
  }

  release(kick: Vec, spin: number) {
    if (!this.p.length) return;
    this.mode = 'ragdoll';
    this.stunt = null;
    this.gripping = false;
    for (const q of this.p) { q.vx += kick.x; q.vy += kick.y; }
    this.p[HEAD].vx += spin; this.p[NECK].vx += spin * 0.5;
    this.p[FN].vx -= spin * 0.5; this.p[FF].vx -= spin * 0.5;
    this.p[KN].vx -= spin * 0.3; this.p[KF].vx -= spin * 0.3;
  }

  update(dt: number, fr: RideFrame | null, w: PhysWorld) {
    if (!this.p.length) { if (!fr) return; this.snap(fr); }
    if (this.scarf.length !== TRAIL[this.kind][0]) this.initChain(fr ? fr.f : { x: 1, y: 0 });
    if (dt <= 0) return;
    this.time += dt;
    this.cheer = Math.max(0, this.cheer - dt);
    const ride = this.mode === 'ride' && fr ? fr : null;
    if (ride) this.face = this.faceOf(ride);
    // sedang bersalto → pose kinematik mengikuti pelana naga
    if (ride && this.stunt) { this.updateStunt(dt, ride, w); return; }
    const T = ride ? this.targets(ride) : null;
    const g = (w.gravity ?? 900) * (ride ? 0.3 : 1);
    const damp = Math.exp(-(ride ? 1.2 : 0.2) * dt);
    for (let i = 0; i < this.p.length; i++) {
      const q = this.p[i];
      q.ox = q.x; q.oy = q.y;
      if (ride && i === PELV) { q.x = ride.seat.x; q.y = ride.seat.y; continue; }
      q.vx *= damp;
      q.vy = q.vy * damp + g * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (T) { const a = 1 - Math.exp(-STIFF[i] * dt); q.x += (T[i].x - q.x) * a; q.y += (T[i].y - q.y) * a; }
    }
    const pin = !!ride;
    for (let it = 0; it < 4; it++) {
      for (const [a, b, L] of BONES) this.solve(a, b, L, L, pin);
      for (const [a, b, mn, mx] of LIMITS) this.solve(a, b, mn, mx, pin);
      if (!ride) for (const q of this.p) collidePoint(q, w, 0);
    }
    if (!ride) for (const q of this.p) collidePoint(q, w, 0.22);
    for (const q of this.p) { q.vx = (q.x - q.ox) / dt; q.vy = (q.y - q.oy) / dt; }
    this.gripping = !!ride;
    this.stepScarf(dt, w);
  }

  solve(a: number, b: number, mn: number, mx: number, pin: boolean) {
    const A = this.p[a], B = this.p[b];
    solveDist(A, B, mn, mx, pin && a === PELV ? 0 : A.im, pin && b === PELV ? 0 : B.im);
  }

  stepScarf(dt: number, w: PhysWorld) {
    const s = this.scarf;
    if (s.length < 2 || !this.p.length) return;
    const [, SL, flut] = TRAIL[this.kind];
    const a = this.anchor();
    const nk = this.p[NECK];
    const air = Math.min(700, Math.hypot(nk.vx - w.wind.x, nk.vy - w.wind.y));
    const drag = 1 - Math.exp(-3.2 * dt);
    for (let i = 0; i < s.length; i++) {
      const q = s[i];
      q.ox = q.x; q.oy = q.y;
      if (i === 0) { q.x = a.x; q.y = a.y; continue; }
      q.vx += (w.wind.x - q.vx) * drag;
      q.vy += (w.wind.y - q.vy) * drag;
      q.vy += 240 * dt + Math.sin(this.time * 15 - i * 0.85) * air * 2.2 * flut * (i / s.length) * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let it = 0; it < 6; it++) {
      for (let i = 1; i < s.length; i++) {
        const A = s[i - 1], B = s[i];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.0001;
        if (d <= SL) continue;
        const k = (d - SL) / d;
        if (i === 1) { B.x -= dx * k; B.y -= dy * k; }
        else { A.x += dx * k * 0.5; A.y += dy * k * 0.5; B.x -= dx * k * 0.5; B.y -= dy * k * 0.5; }
      }
    }
    if (w.ground) for (const q of s) { const gy = w.ground(q.x) - 1; if (q.y > gy) q.y = gy; }
    for (let i = 1; i < s.length; i++) { const q = s[i]; q.vx = (q.x - q.ox) / dt; q.vy = (q.y - q.oy) / dt; }
  }

  // =================== MENGGAMBAR ===================
  drawBack(ctx: CanvasRenderingContext2D) {
    const P = this.p;
    if (!P.length) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    limb(ctx, P[PELV], P[KF], P[FF], 3.1, this.style.robeDark);
    dot(ctx, P[FF].x, P[FF].y, 1.9, shade(this.style.robeDark, -0.45));
  }

  drawFront(ctx: CanvasRenderingContext2D) {
    const P = this.p, st = this.style;
    if (!P.length) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (this.kind !== 'scarf') this.drawTrail(ctx);
    limb(ctx, P[NECK], P[EF], P[HF], 2.3, st.robeDark);
    dot(ctx, P[HF].x, P[HF].y, 1.45, shade(st.skin, -0.22));
    this.drawAcc(ctx);
    this.drawTorso(ctx);
    limb(ctx, P[PELV], P[KN], P[FN], 3.3, st.robe);
    dot(ctx, P[FN].x, P[FN].y, 1.95, shade(st.robeDark, -0.4));
    limb(ctx, P[NECK], P[EN], P[HN], 2.6, st.robe);
    dot(ctx, P[HN].x, P[HN].y, 1.6, st.skin);
    if (this.gripping && this.cheer <= 0) {
      ctx.strokeStyle = shade(st.skin, -0.35, 0.85); ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(P[HN].x, P[HN].y, 1.1, -0.4, 1.7); ctx.stroke();
    }
    this.drawHead(ctx);
    if (st.acc === 'foxfire') this.drawFoxfire(ctx);
  }

  drawScarf(ctx: CanvasRenderingContext2D) { if (this.kind === 'scarf') this.drawTrail(ctx); }

  drawTrail(ctx: CanvasRenderingContext2D) {
    const s = this.scarf, n = s.length;
    if (n < 2) return;
    const st = this.style, kind = this.kind;
    const L: Vec[] = [], R: Vec[] = [], flip: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
      const d = nrm(b.x - a.x, b.y - a.y), u = i / (n - 1);
      const tw = Math.cos(this.time * 3.2 + i * 0.55);
      const hw = kind === 'hair' ? 2.6 - u * 2 : kind === 'cape' ? (2.6 + u * 2.8) * (0.75 + 0.25 * Math.abs(tw)) : (1.9 - u) * (0.45 + 0.55 * Math.abs(tw));
      L.push({ x: s[i].x - d.y * hw, y: s[i].y + d.x * hw });
      R.push({ x: s[i].x + d.y * hw, y: s[i].y - d.x * hw });
      flip.push(tw < 0);
    }
    const base = kind === 'hair' ? st.hair : st.scarf;
    const tg = st.trailGrad;
    if (kind === 'hair' && tg) {
      const g = ctx.createLinearGradient(s[0].x, s[0].y, s[n - 1].x, s[n - 1].y);
      tg.forEach((c, i) => g.addColorStop(i / (tg.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = base;
    ctx.beginPath(); ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath(); ctx.fill();
    if (kind === 'hair') {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); s.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
    } else {
      ctx.fillStyle = shade(base, -0.25);
      for (let i = 0; i < n - 1; i++) {
        if (!flip[i]) continue;
        ctx.beginPath(); ctx.moveTo(L[i].x, L[i].y); ctx.lineTo(L[i + 1].x, L[i + 1].y); ctx.lineTo(R[i + 1].x, R[i + 1].y); ctx.lineTo(R[i].x, R[i].y); ctx.closePath(); ctx.fill();
      }
    }
    if (kind === 'scarf') dot(ctx, s[0].x, s[0].y, 2.3, base);
  }

  frame() {
    const pl = this.p[PELV], nk = this.p[NECK];
    const s = nrm(nk.x - pl.x, nk.y - pl.y), n = { x: -s.y * this.face, y: s.x * this.face };
    const at = (b: Vec, kn: number, ks: number): Vec => ({ x: b.x + n.x * kn + s.x * ks, y: b.y + n.y * kn + s.y * ks });
    return { pl, nk, s, n, at };
  }

  drawAcc(ctx: CanvasRenderingContext2D) {
    const acc = this.style.acc, st = this.style;
    if (!acc || acc === 'foxfire') return;
    const { pl, nk, at } = this.frame();
    if (acc === 'sword') {
      const a = at(nk, -3.6, 4.6), b = at(pl, -5.6, -3.6);
      const g = { x: a.x + (b.x - a.x) * 0.24, y: a.y + (b.y - a.y) * 0.24 };
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 1.9; line(ctx, a, g);
      ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = 1.3; line(ctx, g, b);
      dot(ctx, g.x, g.y, 1.2, st.accent);
    } else if (acc === 'staff') {
      const a = at(nk, -3.4, 9.5), b = at(pl, -4.6, -5);
      ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 1.2; line(ctx, a, b);
      const gr = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 7);
      gr.addColorStop(0, 'rgba(255,230,150,0.75)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(a.x, a.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.accent; star(ctx, a.x, a.y, 2.6 + Math.sin(this.time * 4) * 0.3);
    } else if (acc === 'lantern') {
      const a = at(pl, -4.2, 0), top = at(nk, -6.5, 8);
      ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 1; line(ctx, a, top);
      const lp = { x: top.x + Math.sin(this.time * 3) * 1.2, y: top.y + 4 };
      ctx.strokeStyle = 'rgba(60,40,30,0.8)'; ctx.lineWidth = 0.5; line(ctx, top, lp);
      const gr = ctx.createRadialGradient(lp.x, lp.y + 2, 0, lp.x, lp.y + 2, 10);
      gr.addColorStop(0, 'rgba(255,200,110,0.5)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(lp.x, lp.y + 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.accent; ellipse(ctx, lp.x, lp.y + 2.4, 2.3, 3, 0);
      ctx.fillStyle = '#4a2a1e'; ctx.fillRect(lp.x - 1.6, lp.y - 0.9, 3.2, 0.9); ctx.fillRect(lp.x - 1.6, lp.y + 5, 3.2, 0.9);
    }
  }

  drawFoxfire(ctx: CanvasRenderingContext2D) {
    const h = this.p[HEAD], a = this.time * 2.2;
    const x = h.x + Math.cos(a) * 10, y = h.y - 4 + Math.sin(a) * 4;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 8);
    gr.addColorStop(0, 'rgba(110,220,255,0.6)'); gr.addColorStop(1, 'rgba(110,220,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(190,240,255,0.95)';
    ctx.beginPath(); ctx.moveTo(x, y - 4.5 - Math.sin(this.time * 9)); ctx.quadraticCurveTo(x + 2.4, y - 0.5, x, y + 1.8); ctx.quadraticCurveTo(x - 2.4, y - 0.5, x, y - 4.5 - Math.sin(this.time * 9)); ctx.fill();
  }

  drawTorso(ctx: CanvasRenderingContext2D) {
    const st = this.style;
    const { pl, nk, at } = this.frame();
    const flap = Math.sin(this.time * 11) * 0.9;
    const a = at(pl, 3.9, -1.2), b = at(nk, 2.9, 0.4), c = at(nk, -2.9, 0.6), d = at(pl, -4.2, -0.6);
    const e = at(pl, -8 + flap, -3.6), f2 = at(pl, -1, -2.6), m1 = at(mid(pl, nk), 4.4, 0), top = at(nk, 0, 2.6);
    ctx.fillStyle = st.robe;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(m1.x, m1.y, b.x, b.y);
    ctx.quadraticCurveTo(top.x, top.y, c.x, c.y);
    ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.lineTo(f2.x, f2.y);
    ctx.closePath(); ctx.fill();
    const q1 = at(pl, -2, 0), q2 = at(nk, -1, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = st.accent; ctx.lineWidth = 1.4;
    const p1 = st.hat === 'monk' ? at(nk, 2.6, -0.5) : at(pl, -4, 2.2);
    const p2 = st.hat === 'monk' ? at(pl, -3.6, 0.6) : at(pl, 3.8, 2.2);
    line(ctx, p1, p2);
    if (st.hat === 'plume') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; const s1 = at(nk, 1.5, -1), s2 = at(mid(pl, nk), 2.6, 0); ctx.beginPath(); ctx.arc(s1.x, s1.y, 1.6, 0, Math.PI * 2); ctx.arc(s2.x, s2.y, 1.2, 0, Math.PI * 2); ctx.fill(); }
  }

  drawHead(ctx: CanvasRenderingContext2D) {
    const st = this.style, h = this.p[HEAD], nk = this.p[NECK];
    const R = 3.8, T = this.time;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.y - nk.y, h.x - nk.x) + Math.PI / 2);
    if (this.face < 0) ctx.scale(-1, 1); // wajah & topi menghadap arah terbang
    const cap = (col: string, r = R + 0.4) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.93, Math.PI * 2.06); ctx.closePath(); ctx.fill(); };
    const backHair = (col: string) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-1.3, 0.4, R * 0.86, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); };
    switch (st.hat) {
      case 'caping': {
        dot(ctx, -1.2, 0.7, R * 0.9, st.hair);
        dot(ctx, 0, 0, R, st.skin);
        ctx.fillStyle = st.accent;
        ctx.beginPath(); ctx.moveTo(-9.5, -1.6); ctx.lineTo(0.4, -8.8); ctx.lineTo(9.6, -1.4); ctx.quadraticCurveTo(0, 0.5, -9.5, -1.6); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath(); ctx.moveTo(0.4, -8.8); ctx.lineTo(9.6, -1.4); ctx.quadraticCurveTo(5, -0.5, 0.4, -0.6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = shade(st.accent, -0.4); ctx.lineWidth = 0.7;
        line(ctx, { x: -6.4, y: -3.7 }, { x: 6.6, y: -3.5 });
        break;
      }
      case 'bun': {
        ctx.fillStyle = st.accent;
        for (let k = 0; k < 2; k++) {
          const P: Vec[] = [];
          for (let j = 0; j <= 6; j++) { const s = j / 6; P.push({ x: -3.2 - s * 11, y: -4.4 + s * (k ? 3.2 : 1) + Math.sin(T * 9 - s * 4 + k) * 1.6 * s }); }
          taper(ctx, P, 1.6, 0.6);
        }
        dot(ctx, 0, 0, R, st.skin);
        cap(st.hair); backHair(st.hair);
        dot(ctx, -2.2, -4.6, 2.4, st.hair);
        ctx.strokeStyle = st.accent; ctx.lineWidth = 0.8;
        line(ctx, { x: -4.8, y: -6.8 }, { x: 0.4, y: -3 });
        break;
      }
      case 'monk':
        dot(ctx, 0, 0, R, st.skin);
        dot(ctx, 0.9, -1.6, 1.4, 'rgba(255,255,255,0.25)');
        dot(ctx, 2.7, -1.2, 0.55, '#c0392b');
        break;
      case 'kabuto': {
        dot(ctx, 0, 0, R, st.skin);
        ctx.fillStyle = st.hair;
        ctx.beginPath(); ctx.arc(0, -0.2, R + 0.9, Math.PI * 0.95, Math.PI * 2.02); ctx.closePath(); ctx.fill();
        tri(ctx, [-4.6, -0.6, -8.6, 3.2, -3.4, 2.4]);
        ctx.fillStyle = st.accent;
        ctx.beginPath(); ctx.moveTo(-5.8, -9.4); ctx.quadraticCurveTo(0.4, -3.4, 6.8, -9.8); ctx.quadraticCurveTo(0.4, -5.6, -5.8, -9.4); ctx.fill();
        break;
      }
      case 'hood': {
        ctx.fillStyle = st.robe;
        ctx.beginPath(); ctx.arc(-0.4, -0.2, R + 1, 0, Math.PI * 2); ctx.fill();
        tri(ctx, [-3.6, -3.2, -9.8, 0.8, -3.2, 3]);
        dot(ctx, 1.5, 0.6, 2.6, st.skin);
        ctx.fillStyle = shade(st.robeDark, -0.35); ctx.fillRect(-1.4, -3.5, 5.8, 1.7);
        dot(ctx, 2.9, -2.65, 1.05, st.accent);
        break;
      }
      case 'aviator': {
        dot(ctx, 0, 0, R, st.skin);
        cap(st.robeDark, R + 0.7);
        ctx.beginPath(); ctx.moveTo(-3.9, -0.2); ctx.quadraticCurveTo(-4.8, 3.2, -2.1, 3.8); ctx.lineTo(-1.4, 0.4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2e241f'; ctx.fillRect(-4, -3.6, 8.2, 1.3);
        dot(ctx, 1.1, -3.3, 1.55, '#2e241f'); dot(ctx, 3.7, -2.8, 1.3, '#2e241f');
        dot(ctx, 1.1, -3.3, 1.05, st.accent); dot(ctx, 3.7, -2.8, 0.85, st.accent);
        dot(ctx, 0.8, -3.6, 0.38, 'rgba(255,255,255,0.9)');
        break;
      }
      case 'topknot': {
        dot(ctx, 0, 0, R, st.skin);
        cap(st.hair); backHair(st.hair);
        dot(ctx, -1.2, -4.9, 1.8, st.hair);
        ctx.fillStyle = st.hair; taper(ctx, [{ x: -1.6, y: -5.8 }, { x: -3.6, y: -6.6 }, { x: -5.8, y: -6.2 + Math.sin(T * 8) * 0.7 }], 1.3, 0.3);
        ctx.fillStyle = st.accent; ctx.fillRect(-2.2, -4, 2.1, 1);
        ctx.fillRect(-3.8, -2.5, 7.6, 0.9);
        break;
      }
      case 'cloud': {
        dot(ctx, 0, 0, R, st.skin);
        backHair(st.hair);
        const puffs: [number, number, number][] = [[-3.4, -2.6, 2.4], [-0.8, -4.4, 2.9], [2.4, -3.8, 2.4], [-4.8, 0.2, 1.9]];
        for (const [x, y, r] of puffs) dot(ctx, x + 0.4, y + 0.7, r, st.robeDark);
        for (const [x, y, r] of puffs) dot(ctx, x, y, r, '#ffffff');
        dot(ctx, -0.4, -5.4, 1, 'rgba(255,255,255,1)');
        break;
      }
      case 'wizard': {
        ctx.fillStyle = st.hair;
        ctx.beginPath(); ctx.moveTo(-1, -2); ctx.quadraticCurveTo(-6.4, 0, -5.6, 5.4); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill();
        dot(ctx, 0, 0, R, st.skin);
        ctx.fillStyle = st.robeDark; ellipse(ctx, -0.2, -2.6, 7.4, 1.6, -0.1);
        ctx.fillStyle = st.robe;
        ctx.beginPath(); ctx.moveTo(-4, -3); ctx.quadraticCurveTo(-1, -10, -8, -14.2 + Math.sin(T * 3) * 0.7); ctx.quadraticCurveTo(0.4, -9, 3.6, -3.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = st.accent; ctx.fillRect(-3.6, -4.5, 7, 1);
        star(ctx, -1.6, -8, 1.5);
        break;
      }
      case 'longhair': {
        dot(ctx, 0, 0, R, st.skin);
        let hf: string | CanvasGradient = st.hair;
        if (st.trailGrad) { const g = ctx.createLinearGradient(-4, -4, -2, 6); st.trailGrad.forEach((c, i, arr) => g.addColorStop(i / (arr.length - 1), c)); hf = g; }
        ctx.fillStyle = hf;
        ctx.beginPath(); ctx.arc(-0.2, -0.2, R + 0.5, Math.PI * 0.9, Math.PI * 2.08); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3.6, -1); ctx.quadraticCurveTo(-5.6, 3.5, -3, 6.6); ctx.lineTo(-0.8, 2.5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0.5, -4.3); ctx.quadraticCurveTo(4.6, -3.6, 3.9, -0.6); ctx.quadraticCurveTo(2.2, -2.4, 0.5, -4.3); ctx.fill();
        dot(ctx, -2, -3.5, 0.85, st.accent);
        break;
      }
      case 'lotus': {
        dot(ctx, 0, 0, R, st.skin);
        cap(st.hair); backHair(st.hair);
        for (let k = -2; k <= 2; k++) {
          const a = -Math.PI / 2 + k * 0.45;
          ctx.fillStyle = Math.abs(k) === 2 ? st.robeDark : k === 0 ? st.accent : st.robe;
          ellipse(ctx, Math.cos(a) * 2.4, -4.2 + Math.sin(a) * 2.4, 2.5, 1.05, a);
        }
        dot(ctx, 0, -4.4, 0.9, st.scarf);
        break;
      }
      case 'fox': {
        backHair(st.hair);
        dot(ctx, 0, 0, R, '#fbf7f0');
        ctx.fillStyle = '#fbf7f0';
        tri(ctx, [-3.2, -2.2, -3.9, -7.8, -0.6, -3.8]);
        tri(ctx, [0.6, -3.6, 2.4, -8.2, 3.4, -2.6]);
        ctx.fillStyle = st.robeDark;
        tri(ctx, [-2.8, -3, -3.4, -6.4, -1.3, -3.9]);
        tri(ctx, [1.2, -3.6, 2.3, -6.8, 2.9, -3.1]);
        ctx.fillStyle = '#fbf7f0'; tri(ctx, [3.2, -0.6, 5.8, 0.6, 3.2, 1.8]);
        dot(ctx, 5.6, 0.6, 0.55, '#2a1a1a');
        ctx.strokeStyle = st.robeDark; ctx.lineWidth = 0.75;
        line(ctx, { x: 1, y: -1.2 }, { x: 3, y: -1.9 });
        line(ctx, { x: 0.6, y: 1.6 }, { x: 2.2, y: 2.4 });
        break;
      }
      case 'ninja': {
        dot(ctx, 0, 0, R + 0.2, st.robe);
        ctx.fillStyle = st.skin; ctx.fillRect(0.4, -1.7, 3.8, 1.6);
        dot(ctx, 2.6, -0.9, 0.48, '#111');
        ctx.fillStyle = st.scarf; ctx.fillRect(-3.9, -3.1, 7.8, 1.1);
        ctx.fillStyle = st.accent; ctx.fillRect(1.3, -3.3, 2.2, 1.5);
        break;
      }
      case 'twinbun': {
        dot(ctx, -2.6, -3.6, 2.1, st.hair); dot(ctx, 1.2, -4.6, 2.1, st.hair);
        ctx.fillStyle = st.accent; tri(ctx, [-4.6, -4.4, -6.6, -6, -5.8, -3.2]); tri(ctx, [2.9, -6, 4.8, -7.2, 4, -4.8]);
        dot(ctx, 0, 0, R, st.skin);
        cap(st.hair); backHair(st.hair);
        break;
      }
      case 'plume': {
        ctx.fillStyle = st.accent;
        const P: Vec[] = [];
        for (let j = 0; j <= 7; j++) { const s = j / 7; P.push({ x: -s * 12, y: -5.6 - s * 2.4 + s * s * 5.5 + Math.sin(T * 7 - s * 4) * 1.4 * s }); }
        taper(ctx, P, 3.4, 0.8);
        dot(ctx, 0, 0, R + 0.7, st.robe);
        ctx.fillStyle = st.skin;
        ctx.beginPath(); ctx.moveTo(0.8, -1.6); ctx.lineTo(4.5, -1.4); ctx.lineTo(4.3, 2.4); ctx.lineTo(1.2, 2.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = st.robeDark; ctx.lineWidth = 0.7;
        line(ctx, { x: -4.2, y: -1.8 }, { x: 4.6, y: -1.8 });
        dot(ctx, -1.4, -2.8, 1.2, 'rgba(255,255,255,0.45)');
        break;
      }
    }
    ctx.restore();
  }
}

import { BIOMES, type Biome, type DecoType, type RGB, type RidgeType } from './biomes';
import { hexA, type Vec } from './dragon';

// ================= KONSTANTA DUNIA =================
export const W = 960;
export const H = 540;
export const SP = 8; // jarak sampel medan
export const DRAGON_SX = 0.33;
export const LOOK = 150;
// proyeksi kedalaman (ilusi 3D): Z+ = mendekat ke kamera → bergeser ke kanan-bawah layar
export const KX = 0.45, KY = 0.22;
// kecepatan normal · batas tahan-melesat (5×) · batas Melesat Bintang (10×)
export const NORMAL_SPD = 320, MAX_HOLD = NORMAL_SPD * 5, STAR_MAX = NORMAL_SPD * 10;
// lapisan awan dunia (ketinggian relatif tanah): 0 = awan tipis terputus, 1 = lautan awan
export const CLOUD_LAYERS = [
  { alt: 560, thick: 70, broken: true },
  { alt: 1250, thick: 150, broken: false },
];

// ================= UTIL =================
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ================= PALET =================
export interface Pal {
  skyTop: RGB; skyBot: RGB; sun: RGB; fog: RGB; far: RGB; mid: RGB; near: RGB;
  groundTop: RGB; ground: RGB; rim: RGB; rock: RGB; rockLight: RGB; ring: RGB;
  star: number; aurora: number; sunX: number; sunY: number; sunR: number; sunA: number; moonA: number;
  ridgeA: RidgeType; ridgeB: RidgeType; rt: number; decoA: DecoType; decoB: DecoType;
}

export function blend(a: Biome, b: Biome, t: number): Pal {
  return {
    skyTop: mix(a.skyTop, b.skyTop, t), skyBot: mix(a.skyBot, b.skyBot, t), sun: mix(a.sun, b.sun, t), fog: mix(a.fog, b.fog, t),
    far: mix(a.far, b.far, t), mid: mix(a.mid, b.mid, t), near: mix(a.near, b.near, t),
    groundTop: mix(a.groundTop, b.groundTop, t), ground: mix(a.ground, b.ground, t), rim: mix(a.rim, b.rim, t),
    rock: mix(a.rock, b.rock, t), rockLight: mix(a.rockLight, b.rockLight, t), ring: mix(a.ring, b.ring, t),
    star: lerp(a.star, b.star, t), aurora: lerp(a.aurora, b.aurora, t),
    sunX: lerp(a.sunX, b.sunX, t), sunY: lerp(a.sunY, b.sunY, t), sunR: lerp(a.sunR, b.sunR, t),
    sunA: lerp(a.sunA, b.sunA, t), moonA: lerp(a.moonA, b.moonA, t),
    ridgeA: a.ridge, ridgeB: b.ridge, rt: t, decoA: a.deco, decoB: b.deco,
  };
}

export function ridgeShape(type: RidgeType, x: number, seed: number) {
  switch (type) {
    case 'peak': {
      const a = 1 - Math.abs(Math.sin(x * 0.0021 + seed));
      const b = 1 - Math.abs(Math.sin(x * 0.0057 + seed * 2.1));
      return a * a * 0.62 + b * b * 0.3 + Math.sin(x * 0.017 + seed * 3.7) * 0.03 + 0.05;
    }
    case 'dune': {
      const v = 0.36 + 0.26 * Math.sin(x * 0.0031 + seed) + 0.14 * Math.sin(x * 0.0074 + seed * 1.7) + 0.03 * Math.sin(x * 0.019 + seed);
      return Math.max(0.05, v);
    }
    case 'mesa': {
      const n = 0.5 + 0.35 * Math.sin(x * 0.0026 + seed) + 0.15 * Math.sin(x * 0.0067 + seed * 2.3);
      const p = smooth(clamp((n - 0.5) * 6, 0, 1));
      return 0.1 + p * 0.62 + 0.015 * Math.sin(x * 0.05 + seed);
    }
    case 'spike': {
      const a = 1 - Math.abs(Math.sin(x * 0.0029 + seed));
      const b = 1 - Math.abs(Math.sin(x * 0.0071 + seed * 1.9));
      return Math.pow(a, 2.6) * 0.9 + Math.pow(b, 3) * 0.35 + 0.04;
    }
  }
}

// ================= GEOMETRI =================
export function pointInPoly(p: Vec, poly: Vec[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function distSeg(p: Vec, a: Vec, b: Vec) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = dx * dx + dy * dy;
  const t = l === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l, 0, 1);
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}
export function hitPoly(p: Vec, r: number, poly: Vec[]) {
  if (pointInPoly(p, poly)) return true;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if (distSeg(p, poly[j], poly[i]) < r) return true;
  return false;
}
export function polyDist(p: Vec, poly: Vec[]) {
  if (pointInPoly(p, poly)) return 0;
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, distSeg(p, poly[j], poly[i]));
  return d;
}

// ================= TIPE OBJEK DUNIA =================
export type Style = 'rock' | 'bamboo' | 'float' | 'wisp';
export interface Gate { x: number; style: 'torii' | 'arch'; D: number; open: number; state: number; t: number; biome: number; seed: number; snow: boolean; lantern: boolean; floor?: number; caveCrystal?: RGB }
export interface WispAnim { baseY: number; cy: number; amp: number; spd: number; ph: number; r: number; t: number }
export interface Obstacle { x: number; w: number; polys: Vec[][]; style: Style; top?: Vec; deco?: DecoType; biome: number; variant: number; near?: boolean; passed?: boolean; smashed?: boolean; anim?: WispAnim; caveCrystal?: RGB; caveAlt?: RGB }
export interface Ring { x: number; y: number; r: number; state: number; t: number; form?: number; idx?: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: number; ph: number }
export interface FText { x: number; y: number; text: string; life: number; big: boolean }

type Ctx = CanvasRenderingContext2D;

// ================= LATAR =================
export function drawAurora(ctx: Ctx, a: number, vo: number, t: number) {
  for (let k = 0; k < 3; k++) {
    const base = 50 + k * 34 + vo * 0.03;
    const g = ctx.createLinearGradient(0, base - 20, 0, base + 110);
    const col = k === 1 ? '150,120,255' : '110,255,200';
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(0.25, `rgba(${col},${0.22 * a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    const top: number[] = [];
    for (let x = 0; x <= W; x += 16) top.push(base + Math.sin(x * 0.005 + t * 0.25 + k * 1.7) * 26 + Math.sin(x * 0.013 - t * 0.4 + k) * 10);
    top.forEach((y, i) => (i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * 16, y)));
    for (let i = top.length - 1; i >= 0; i--) ctx.lineTo(i * 16, top[i] + 110);
    ctx.closePath();
    ctx.fill();
  }
}

export function fogBand(ctx: Ctx, pal: Pal, y: number, a: number) {
  const g = ctx.createLinearGradient(0, y - 60, 0, H);
  g.addColorStop(0, rgba(pal.fog, 0));
  g.addColorStop(1, rgba(pal.fog, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 60, W, H - y + 60);
}

// lapisan pegunungan paralaks yang ikut miring mengikuti lereng
export function drawLayer(ctx: Ctx, pal: Pal, camX: number, tiltIn: number, t: number, par: number, base: number, amp: number, seed: number, col: RGB, fogAmt: number, tiltK: number, deco: boolean) {
  const off = camX * par;
  const tilt = tiltIn * tiltK;
  const yAt = (x: number) => {
    const wx = x + off;
    const r = lerp(ridgeShape(pal.ridgeA, wx, seed), ridgeShape(pal.ridgeB, wx, seed), pal.rt);
    return base + (x - W * DRAGON_SX) * tilt - r * amp;
  };
  const g = ctx.createLinearGradient(0, base - amp, 0, base + 160);
  g.addColorStop(0, rgba(col));
  g.addColorStop(1, rgba(mix(col, pal.fog, fogAmt)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 10; x += 6) ctx.lineTo(x, yAt(x));
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  ctx.fill();
  if (!deco) return;
  const type = pal.rt < 0.5 ? pal.decoA : pal.decoB;
  const sil = mix(col, [0, 0, 0], 0.12);
  const step = 24;
  for (let wx = Math.floor(off / step) * step - step; wx < off + W + step; wx += step) {
    const h = hash(wx * 0.37 + seed);
    if (h < 0.5) continue;
    const x = wx - off + (hash(wx) - 0.5) * 14;
    drawDeco(ctx, type, x, yAt(x) + 3, 0.5 + h * 0.45, sil, true, t);
  }
}

// ================= DEKORASI =================
export function drawDeco(ctx: Ctx, type: DecoType, x: number, y: number, s: number, col: RGB, sil: boolean, t: number, B?: Biome) {
  const c = rgba(col);
  switch (type) {
    case 'sakura': {
      ctx.strokeStyle = sil ? c : 'rgba(90,46,62,1)';
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 18 * s); ctx.lineTo(x - 6 * s, y - 24 * s); ctx.moveTo(x, y - 16 * s); ctx.lineTo(x + 7 * s, y - 22 * s); ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y - 26 * s, 11 * s, 0, Math.PI * 2);
      ctx.moveTo(x - 9 * s + 8 * s, y - 21 * s);
      ctx.arc(x - 9 * s, y - 21 * s, 8 * s, 0, Math.PI * 2);
      ctx.moveTo(x + 9 * s + 8.5 * s, y - 22 * s);
      ctx.arc(x + 9 * s, y - 22 * s, 8.5 * s, 0, Math.PI * 2);
      ctx.fill();
      if (!sil) {
        ctx.fillStyle = 'rgba(255,214,228,0.75)';
        ctx.beginPath(); ctx.arc(x + 3 * s, y - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'cactus': {
      ctx.strokeStyle = c;
      ctx.lineCap = 'round';
      ctx.lineWidth = 6 * s;
      ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y - 34 * s); ctx.stroke();
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(x, y - 14 * s); ctx.lineTo(x - 8 * s, y - 14 * s); ctx.lineTo(x - 8 * s, y - 24 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 20 * s); ctx.lineTo(x + 8 * s, y - 20 * s); ctx.lineTo(x + 8 * s, y - 28 * s); ctx.stroke();
      ctx.lineCap = 'butt';
      break;
    }
    case 'shrub': {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 9 * s, 6 * s, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.2 * s;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y - 4 * s); ctx.lineTo(x + k * 5 * s, y - 14 * s + Math.abs(k) * 2 * s); ctx.stroke(); }
      break;
    }
    case 'bamboo': {
      ctx.strokeStyle = c;
      for (let k = 0; k < 3; k++) {
        const bx = x + (k - 1) * 6 * s, h = (46 + k * 14 + (k === 1 ? 12 : 0)) * s, lean = (k - 1) * 4 * s;
        ctx.lineWidth = 2.6 * s;
        ctx.beginPath(); ctx.moveTo(bx, y + 2); ctx.lineTo(bx + lean, y - h); ctx.stroke();
        ctx.fillStyle = c;
        for (let l = 0; l < 3; l++) {
          ctx.save();
          ctx.translate(bx + lean, y - h + l * 8 * s);
          ctx.rotate((l % 2 ? 0.6 : -0.6) + Math.sin(t + x) * 0.08);
          ctx.beginPath(); ctx.ellipse(l % 2 ? 7 * s : -7 * s, 0, 7 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      break;
    }
    case 'pine': {
      ctx.fillStyle = c;
      for (let k = 0; k < 3; k++) {
        const w = (12 - k * 3) * s, yy = y - (6 + k * 9) * s;
        ctx.beginPath(); ctx.moveTo(x - w, yy + 4 * s); ctx.lineTo(x, yy - 10 * s); ctx.lineTo(x + w, yy + 4 * s); ctx.fill();
      }
      if (!sil && B && B.weather === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        for (let k = 0; k < 3; k++) {
          const w = (12 - k * 3) * s * 0.45, yy = y - (6 + k * 9) * s;
          ctx.beginPath(); ctx.moveTo(x - w, yy - 4 * s); ctx.lineTo(x, yy - 10 * s); ctx.lineTo(x + w, yy - 4 * s); ctx.fill();
        }
      }
      break;
    }
    case 'lantern': {
      ctx.fillStyle = sil ? c : 'rgba(40,44,70,1)';
      ctx.fillRect(x - 5 * s, y - 4 * s, 10 * s, 4 * s);
      ctx.fillRect(x - 1.8 * s, y - 14 * s, 3.6 * s, 10 * s);
      ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 24 * s); ctx.lineTo(x, y - 31 * s); ctx.lineTo(x + 9 * s, y - 24 * s); ctx.fill();
      if (!sil) {
        const fl = 0.8 + Math.sin(t * 6 + x) * 0.15;
        ctx.fillStyle = `rgba(255,190,100,${0.22 * fl})`;
        ctx.beginPath(); ctx.arc(x, y - 19 * s, 16 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,214,140,${fl})`;
        ctx.fillRect(x - 4.5 * s, y - 23 * s, 9 * s, 8 * s);
      }
      break;
    }
    case 'glowMushroom': {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.4 + x * 0.04);
      if (!sil) {
        ctx.fillStyle = rgba(col, 0.26 * pulse);
        ctx.beginPath(); ctx.arc(x, y - 16 * s, 22 * s, 0, Math.PI * 2); ctx.fill();
      }
      const caps = [
        { ox: -6 * s, h: 16 * s, r: 8 * s },
        { ox: 6 * s, h: 13 * s, r: 6.5 * s },
        { ox: 0, h: 24 * s, r: 11.5 * s },
      ];
      for (const m of caps) {
        ctx.strokeStyle = sil ? c : 'rgba(225,250,255,0.75)';
        ctx.lineWidth = 2.2 * s;
        ctx.beginPath(); ctx.moveTo(x + m.ox * 0.5, y); ctx.quadraticCurveTo(x + m.ox * 1.15, y - m.h * 0.5, x + m.ox, y - m.h); ctx.stroke();
        ctx.fillStyle = rgba(col, 0.92 * pulse);
        ctx.beginPath(); ctx.ellipse(x + m.ox, y - m.h, m.r, m.r * 0.52, 0, Math.PI, 0); ctx.fill();
        if (!sil) {
          ctx.fillStyle = `rgba(255,255,255,${0.82 * pulse})`;
          ctx.beginPath(); ctx.arc(x + m.ox - m.r * 0.28, y - m.h - m.r * 0.2, 1.5 * s, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + m.ox + m.r * 0.25, y - m.h - m.r * 0.14, 1.2 * s, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }
    case 'crystalCluster': {
      const pulse = 0.82 + 0.18 * Math.sin(t * 2.8 + x * 0.05);
      if (!sil) {
        ctx.fillStyle = rgba(col, 0.28 * pulse);
        ctx.beginPath(); ctx.arc(x, y - 14 * s, 20 * s, 0, Math.PI * 2); ctx.fill();
      }
      const shards = [
        { ox: -4 * s, tilt: -0.35, h: 19 * s, w: 4.2 * s },
        { ox: 4 * s, tilt: 0.32, h: 17 * s, w: 4 * s },
        { ox: 0, tilt: 0.03, h: 26 * s, w: 5.5 * s },
      ];
      for (const sh of shards) {
        const tx = x + sh.ox + Math.sin(sh.tilt) * sh.h;
        const ty = y - Math.cos(sh.tilt) * sh.h;
        ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.4), 0.94 * pulse);
        ctx.beginPath();
        ctx.moveTo(x + sh.ox - sh.w * 0.5, y + 2);
        ctx.lineTo(tx, ty);
        ctx.lineTo(x + sh.ox, y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(col, 0.88 * pulse);
        ctx.beginPath();
        ctx.moveTo(x + sh.ox, y + 2);
        ctx.lineTo(tx, ty);
        ctx.lineTo(x + sh.ox + sh.w * 0.5, y + 2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'caveFern': {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.1 + x * 0.03);
      ctx.strokeStyle = rgba(col, 0.85 * pulse);
      ctx.lineWidth = 1.8 * s;
      for (const dir of [-1, 0, 1]) {
        const tipX = x + dir * 13 * s + Math.sin(t * 1.6 + x + dir) * 2 * s;
        const tipY = y - (dir === 0 ? 22 : 16) * s;
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.quadraticCurveTo(x + dir * 5 * s, y - 12 * s, tipX, tipY);
        ctx.stroke();
        if (!sil) {
          ctx.fillStyle = `rgba(255,255,255,${0.85 * pulse})`;
          ctx.beginPath(); ctx.arc(tipX, tipY, 1.8 * s, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }
  }
}

// ================= RINTANGAN =================
export function fillFaceted(ctx: Ctx, pts: Vec[], dark: RGB, light: RGB, cx: number) {
  ctx.fillStyle = rgba(dark);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  let minY = Infinity, maxY = -Infinity, maxX = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); maxX = Math.max(maxX, p.x); }
  ctx.fillStyle = rgba(light);
  ctx.beginPath();
  ctx.moveTo(cx + 4, minY - 5);
  ctx.lineTo(maxX + 5, minY - 5);
  ctx.lineTo(maxX + 5, maxY + 5);
  ctx.lineTo(cx - 10, maxY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawObstacle(ctx: Ctx, o: Obstacle, pal: Pal, t: number) {
  const B = BIOMES[o.biome];
  if (o.style === 'rock') {
    const dk = o.caveCrystal ? mix(pal.rock, o.caveCrystal, 0.26) : pal.rock;
    const lt = o.caveCrystal ? mix(o.caveCrystal, [255, 255, 255], 0.35) : pal.rockLight;
    if (o.caveCrystal && o.top) {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + o.x * 0.02);
      const gl = ctx.createRadialGradient(o.top.x, o.top.y + 40, 0, o.top.x, o.top.y + 40, 95);
      gl.addColorStop(0, rgba(o.caveCrystal, 0.35 * pulse));
      gl.addColorStop(1, rgba(o.caveCrystal, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(o.top.x, o.top.y + 40, 95, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of o.polys) {
      let cx = 0; for (const q of p) cx += q.x; cx /= p.length;
      fillFaceted(ctx, p, dk, lt, cx);
      if (o.caveCrystal && o.top) {
        ctx.strokeStyle = `rgba(255,255,255,0.45)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, o.top.y + 70);
        ctx.lineTo(o.top.x, o.top.y);
        ctx.stroke();
      }
    }
    if (o.top && o.deco) {
      const dcol = o.caveAlt ?? o.caveCrystal ?? mix(pal.rock, [0, 0, 0], 0.15);
      drawDeco(ctx, o.deco, o.top.x, o.top.y + 3, 1.15, dcol, false, t, B);
    }
    if (o.variant === 2 && o.top) {
      const tip = o.top;
      const gl = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 30);
      gl.addColorStop(0, `rgba(170,220,255,${0.5 + 0.2 * Math.sin(t * 3 + o.x)})`);
      gl.addColorStop(1, 'rgba(170,220,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(220,240,255,0.95)';
      ctx.beginPath(); ctx.arc(tip.x, tip.y - 2, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (o.style === 'bamboo') {
    const green: RGB = mix(B.decoCol, pal.rock, 0.25);
    for (const p of o.polys) {
      const [b0, t0, t1] = p;
      ctx.fillStyle = rgba(green);
      ctx.beginPath(); p.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(mix(green, [0, 0, 0], 0.3));
      ctx.lineWidth = 1.5;
      const len = b0.y - t0.y;
      for (let yy = 26; yy < len; yy += 28) {
        const u = yy / len;
        const xx = lerp(b0.x + 4, (t0.x + t1.x) / 2, u);
        ctx.beginPath(); ctx.moveTo(xx - 4.5, b0.y - yy); ctx.lineTo(xx + 4.5, b0.y - yy); ctx.stroke();
      }
      ctx.fillStyle = rgba(green);
      const tx = (t0.x + t1.x) / 2;
      for (let k = 0; k < 5; k++) {
        ctx.save();
        ctx.translate(tx, t0.y + k * 10);
        ctx.rotate((k % 2 ? 0.5 : -0.5) + Math.sin(t * 1.5 + tx + k) * 0.1);
        ctx.beginPath(); ctx.ellipse(k % 2 ? 11 : -11, 0, 12, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  } else if (o.style === 'float') {
    const p = o.polys[0];
    const top = o.top!;
    const r = o.w - 10;
    if (o.caveCrystal) {
      const gl = ctx.createRadialGradient(top.x, top.y + r * 0.6, 0, top.x, top.y + r * 0.6, r * 2.2);
      gl.addColorStop(0, rgba(o.caveCrystal, 0.34));
      gl.addColorStop(1, rgba(o.caveCrystal, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(top.x, top.y + r * 0.6, r * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    fillFaceted(ctx, p, pal.rock, o.caveCrystal ? mix(pal.rockLight, o.caveCrystal, 0.35) : pal.rockLight, o.x);
    ctx.fillStyle = rgba(pal.groundTop);
    ctx.beginPath(); ctx.ellipse(top.x, top.y + 2, r * 1.03, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (o.caveCrystal) {
      drawDeco(ctx, o.variant % 2 === 0 ? 'crystalCluster' : 'glowMushroom', top.x, top.y + 2, 1.25, o.caveAlt ?? o.caveCrystal, false, t, B);
      return;
    }
    const dc = mix(pal.rock, [0, 0, 0], 0.2);
    if (o.variant === 0) {
      ctx.fillStyle = rgba(mix([206, 60, 50], [30, 20, 40], pal.star * 0.45));
      ctx.fillRect(top.x - 13, top.y - 26, 3, 27);
      ctx.fillRect(top.x + 10, top.y - 26, 3, 27);
      ctx.fillRect(top.x - 17, top.y - 30, 34, 4);
      ctx.fillRect(top.x - 14, top.y - 21, 28, 2.5);
    } else if (o.variant === 1) {
      const dt: DecoType = B.deco === 'cactus' ? 'cactus' : B.deco === 'bamboo' ? 'bamboo' : B.deco === 'sakura' ? 'sakura' : 'pine';
      drawDeco(ctx, dt, top.x, top.y + 2, 1, B.deco === 'sakura' ? B.decoCol : dc, false, t, B);
    } else {
      ctx.fillStyle = rgba(dc);
      for (let k = 0; k < 3; k++) {
        const w = 16 - k * 4, yy = top.y - 2 - k * 10;
        ctx.fillRect(top.x - w * 0.55, yy - 7, w * 1.1, 7);
        ctx.beginPath(); ctx.moveTo(top.x - w - 3, yy - 6); ctx.lineTo(top.x, yy - 12); ctx.lineTo(top.x + w + 3, yy - 6); ctx.fill();
      }
      ctx.fillRect(top.x - 0.7, top.y - 44, 1.4, 10);
      if (pal.star > 0.4) {
        ctx.fillStyle = `rgba(255,200,120,${pal.star * 0.8})`;
        ctx.fillRect(top.x - 2, top.y - 7, 4, 4);
      }
    }
  } else if (o.style === 'wisp') {
    const a = o.anim!;
    const cx = o.x, cy = a.cy, r = a.r;
    const pulse = 0.75 + 0.25 * Math.sin(t * 4 + a.ph);
    const wr = r + 12 + 4 * Math.sin(t * 3 + a.ph);
    const glowC = o.caveCrystal ?? [170, 180, 255];
    const altC = o.caveAlt ?? [210, 195, 255];
    ctx.strokeStyle = o.caveCrystal ? rgba(altC, 0.45 * pulse) : `rgba(255,150,170,${0.35 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(cx, cy, wr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
    g.addColorStop(0, rgba(glowC, 0.65 * pulse));
    g.addColorStop(0.5, rgba(altC, 0.28 * pulse));
    g.addColorStop(1, rgba(altC, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();
    const bg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    bg.addColorStop(0, rgba(mix(glowC, [255, 255, 255], 0.75)));
    bg.addColorStop(0.55, rgba(mix(glowC, [255, 255, 255], 0.25)));
    bg.addColorStop(1, rgba(glowC));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.28, r * 0.16, 0, Math.PI * 2); ctx.fill();
    const blink = (t * 0.7 + a.ph) % 3.4 > 3.1;
    ctx.fillStyle = '#1c1838';
    if (blink) {
      ctx.fillRect(cx - r * 0.32, cy - r * 0.02, r * 0.22, 2);
      ctx.fillRect(cx + r * 0.1, cy - r * 0.02, r * 0.22, 2);
    } else {
      ctx.beginPath(); ctx.arc(cx - r * 0.21, cy - r * 0.05, r * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r * 0.21, cy - r * 0.05, r * 0.11, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#1c1838'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.12, r * 0.13, 0.3, Math.PI - 0.3); ctx.stroke();
    const fl = 1 + 0.25 * Math.sin(t * 9 + a.ph);
    ctx.fillStyle = rgba(altC, 0.75 * pulse);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.2, cy + r * 0.6);
    ctx.quadraticCurveTo(cx, cy + r * (0.6 + 0.55 * fl), cx + r * 0.2, cy + r * 0.6);
    ctx.closePath(); ctx.fill();
  }
}

// ================= GERBANG 3D =================
export function poly(ctx: Ctx, p: number[], c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath();
  ctx.fill();
}

// balok 3D: X (arah terbang) xl..xr, Z (kedalaman) za..zb, tepi atas/bawah sebagai fungsi Z
export function box(ctx: Ctx, x0: number, xl: number, xr: number, za: number, zb: number, yt: (z: number) => number, yb: (z: number) => number, cTop: string | null, cLeft: string, cFront: string, n = 1) {
  const L: number[] = [];
  for (let i = 0; i <= n; i++) { const z = za + ((zb - za) * i) / n; L.push(x0 + xl + KX * z, yt(z) + KY * z); }
  for (let i = n; i >= 0; i--) { const z = za + ((zb - za) * i) / n; L.push(x0 + xl + KX * z, yb(z) + KY * z); }
  poly(ctx, L, cLeft);
  if (cTop) {
    const T: number[] = [];
    for (let i = 0; i <= n; i++) { const z = za + ((zb - za) * i) / n; T.push(x0 + xl + KX * z, yt(z) + KY * z); }
    for (let i = n; i >= 0; i--) { const z = za + ((zb - za) * i) / n; T.push(x0 + xr + KX * z, yt(z) + KY * z); }
    poly(ctx, T, cTop);
  }
  const fx = KX * zb, fy = KY * zb;
  poly(ctx, [x0 + xl + fx, yt(zb) + fy, x0 + xr + fx, yt(zb) + fy, x0 + xr + fx, yb(zb) + fy, x0 + xl + fx, yb(zb) + fy], cFront);
}

export function gatePortal(ctx: Ctx, g: Gate, G0: number, t: number) {
  const flash = g.state === 1 ? Math.max(0, 1 - g.t / 0.9) : 0;
  const a = g.state === 0 ? 0.12 + Math.sin(t * 2.4 + g.x * 0.01) * 0.05 : 0.55 * flash;
  if (a <= 0.01) return;
  const D = g.D * 0.9, x0 = g.x, o = g.open;
  const grd = ctx.createLinearGradient(0, o, 0, G0);
  grd.addColorStop(0, `rgba(255,238,196,${a})`);
  grd.addColorStop(0.65, `rgba(255,238,196,${a * 0.35})`);
  grd.addColorStop(1, 'rgba(255,238,196,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(x0 - KX * D, o - KY * D);
  ctx.lineTo(x0 + KX * D, o + KY * D);
  ctx.lineTo(x0 + KX * D, G0 + KY * D);
  ctx.lineTo(x0 - KX * D, G0 - KY * D);
  ctx.closePath();
  ctx.fill();
}

// pulau kecil melayang tempat torii langit berdiri
export function drawSkyIsland(ctx: Ctx, x0: number, y0: number, pal: Pal, t: number) {
  const ax = KX * 122, ay = KY * 122, rot = Math.atan2(KY, KX), rx = Math.hypot(ax, ay) + 10;
  poly(ctx, [x0 - ax - 8, y0 - ay + 3, x0 + ax + 8, y0 + ay + 3, x0 + 22, y0 + 62, x0 + 4, y0 + 92, x0 - 18, y0 + 56], rgba(pal.rock));
  poly(ctx, [x0 + 4, y0 + 8, x0 + ax + 8, y0 + ay + 3, x0 + 22, y0 + 62, x0 + 4, y0 + 92], rgba(pal.rockLight));
  ctx.fillStyle = rgba(mix(pal.groundTop, pal.near, 0.15));
  ctx.beginPath(); ctx.ellipse(x0, y0, rx, 15, rot, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(mix(pal.groundTop, [255, 255, 255], 0.35), 0.8);
  ctx.beginPath(); ctx.ellipse(x0 - 4, y0 - 3, rx * 0.8, 9, rot, 0, Math.PI * 2); ctx.fill();
  const fy = Math.sin(t * 1.4 + x0) * 3;
  ctx.fillStyle = rgba(pal.rock, 0.9);
  ctx.beginPath(); ctx.arc(x0 - 42, y0 + 70 + fy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x0 + 48, y0 + 86 - fy, 3.5, 0, Math.PI * 2); ctx.fill();
}

export function drawTorii(ctx: Ctx, g: Gate, pal: Pal, front: boolean, t: number, groundY: (x: number) => number) {
  const x0 = g.x, o = g.open, D = g.D;
  const fl = g.floor !== undefined;
  const G0 = g.floor ?? groundY(x0);
  const flash = g.state === 1 ? Math.max(0, 1 - g.t / 0.8) : 0;
  const dim = pal.star * 0.5;
  const red = mix(mix([216, 70, 56], [96, 34, 52], dim), [255, 226, 180], flash * 0.5);
  const blk = mix([50, 34, 42], [16, 14, 30], dim);
  const rT = rgba(mix(red, [255, 238, 222], 0.3)), rL = rgba(mix(red, [255, 250, 245], 0.12)), rF = rgba(mix(red, [40, 0, 14], 0.2));
  const kT = rgba(mix(blk, [255, 255, 255], 0.22)), kL = rgba(mix(blk, [255, 255, 255], 0.08)), kF = rgba(blk);
  const far = mix(red, pal.fog, 0.25);
  const hx = 6.5, hz = 6.5, pTop = o - 28;
  if (!front) { if (fl) drawSkyIsland(ctx, x0, G0, pal, t); gatePortal(ctx, g, G0, t); }
  // tiang belakang — kakinya tersembunyi di balik punggung bukit (atau berdiri di pulau melayang)
  const fb = fl ? G0 + 2 + KY * (-D + hz) : groundY(x0 - KX * D) + 40;
  box(ctx, x0, -hx, hx, -D - hz, -D + hz, () => pTop, () => fb - KY * (-D + hz), null, rgba(mix(far, [255, 250, 245], 0.12)), rgba(mix(far, [40, 0, 14], 0.2)));
  box(ctx, x0, -4, 4, -D - 18, D + hz, () => o - 10, () => o, rT, rL, rF);
  box(ctx, x0, -3.5, 3.5, -5, 5, () => pTop, () => o - 10, null, rL, rF);
  box(ctx, x0, -6, -3.5, -10, 10, () => o - 26, () => o - 12, null, kL, kF);
  const nb = fl ? G0 + 2 + KY * (D + hz) : Math.max(G0 + KY * (D + hz), groundY(x0 + KX * (D + hz)) + 8);
  const nbz = nb - KY * (D + hz);
  if (front && !fl) {
    ctx.fillStyle = 'rgba(20,10,30,0.13)';
    ctx.beginPath(); ctx.ellipse(x0 + KX * D, nb, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  box(ctx, x0, -hx, hx, D - hz, D + hz, () => pTop, () => nbz, null, rL, rF);
  box(ctx, x0, -hx - 1.2, hx + 1.2, D - hz - 1.2, D + hz + 1.2, () => nbz - 16, () => nbz, null, kL, kF);
  box(ctx, x0, -4, 4, D + hz, D + 18, () => o - 10, () => o, rT, rL, rF);
  box(ctx, x0, -6, 6, -D - 26, D + 26, () => o - 36, () => pTop, rT, rL, rF);
  const up = (z: number) => { const e = clamp((Math.abs(z) - D * 0.3) / (D * 0.7 + 42), 0, 1); return e * e * 11; };
  box(ctx, x0, -9, 9, -D - 42, D + 42, (z) => o - 50 - up(z), (z) => o - 36 - up(z) * 0.65, kT, kL, kF, 18);
  if (g.lantern) {
    for (const z of [-D * 0.45, D * 0.45]) {
      const lx = x0 - 4 + KX * z, ly = o + KY * z;
      const fk = 0.85 + Math.sin(t * 5 + z) * 0.15;
      if (!front) {
        ctx.fillStyle = `rgba(255,190,110,${0.22 * fk})`;
        ctx.beginPath(); ctx.arc(lx, ly + 18, 24, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(30,20,30,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 10); ctx.stroke();
      ctx.fillStyle = `rgba(255,${(200 + 20 * fk) | 0},130,1)`;
      ctx.beginPath(); ctx.ellipse(lx, ly + 18, 5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(60,30,30,0.9)';
      ctx.fillRect(lx - 3.5, ly + 9.5, 7, 2);
      ctx.fillRect(lx - 3.5, ly + 24.5, 7, 2);
    }
  }
}

export function drawArch(ctx: Ctx, g: Gate, pal: Pal, front: boolean, t: number, groundY: (x: number) => number) {
  const x0 = g.x, o = g.open, D = g.D, S = D + 26, sd = g.seed;
  const G0 = groundY(x0);
  const flash = g.state === 1 ? Math.max(0, 1 - g.t / 0.8) : 0;
  const lit = (c: RGB) => mix(c, [255, 236, 200], flash * 0.4);
  const cTop = rgba(g.snow ? [248, 251, 255] : lit(mix(pal.rockLight, pal.fog, 0.35)));
  const cLeft = rgba(lit(pal.rockLight));
  const cFront = rgba(lit(mix(pal.rock, pal.rockLight, 0.3)));
  const far = mix(pal.rockLight, pal.fog, 0.22);
  if (!front) gatePortal(ctx, g, G0, t);
  const hz = 16, wb = 27, wt = 18;
  const leg = (zc: number, base: number, cL: string, cF: string) => {
    const za = zc - hz, zf = zc + hz;
    const top = o + 20;
    const jm = Math.sin(sd + zc) * 3;
    const mid = (base + top + KY * zf) / 2;
    const dz = KY * (zf - za);
    poly(ctx, [
      x0 - wb + KX * za, base - dz,
      x0 - (wb + wt) / 2 + jm + KX * za, mid - dz,
      x0 - wt + KX * za, top + KY * za,
      x0 - wt + KX * zf, top + KY * zf,
      x0 - (wb + wt) / 2 + jm + KX * zf, mid,
      x0 - wb + KX * zf, base,
    ], cL);
    poly(ctx, [
      x0 - wb + KX * zf, base,
      x0 - (wb + wt) / 2 + jm + KX * zf, mid,
      x0 - wt + KX * zf, top + KY * zf,
      x0 + wt + KX * zf, top + KY * zf,
      x0 + (wb + wt) / 2 - jm * 0.6 + KX * zf, mid,
      x0 + wb + KX * zf, base,
    ], cF);
  };
  // kaki belakang (tersembunyi di balik bukit) lalu kaki depan
  leg(-D, groundY(x0 - KX * D) + 44, rgba(far), rgba(mix(far, pal.rock, 0.45)));
  const nb = Math.max(G0 + KY * (D + hz), groundY(x0 + KX * (D + hz)) + 8);
  if (front) {
    ctx.fillStyle = 'rgba(20,10,30,0.13)';
    ctx.beginPath(); ctx.ellipse(x0 + KX * D, nb, 34, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  leg(D, nb, cLeft, cFront);
  const yt = (z: number) => o - 46 + 9 * (z / S) ** 2 + Math.sin(z * 0.06 + sd) * 2.5;
  const yb = (z: number) => {
    const a = Math.abs(z), k = D - 8;
    return a <= k ? o + 26 * Math.pow(a / k, 2.4) : o + 26 + (a - k) * 0.4;
  };
  box(ctx, x0, -18, 18, -S, S, yt, yb, cTop, cLeft, cFront, 20);
  ctx.strokeStyle = g.snow ? 'rgba(255,255,255,0.35)' : rgba(mix(pal.rockLight, [255, 240, 220], 0.35), 0.4);
  ctx.lineWidth = 1.2;
  for (let k = 1; k <= 2; k++) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const z = -S + (2 * S * i) / 20;
      const y = Math.min(yt(z) + k * 13, yb(z) - 3) + KY * z;
      const x = x0 - 18 + KX * z;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (g.snow) {
    ctx.fillStyle = 'rgba(236,246,255,0.95)';
    for (let i = 0; i < 7; i++) {
      const z = -D * 0.7 + (D * 1.4 * i) / 6;
      const x = x0 - 18 + KX * z, y = yb(z) + KY * z;
      const len = 6 + ((i * 37 + sd) % 7);
      ctx.beginPath(); ctx.moveTo(x - 2.2, y - 1); ctx.lineTo(x + 2.2, y - 1); ctx.lineTo(x, y + len); ctx.closePath(); ctx.fill();
    }
  }
  if (g.caveCrystal) {
    const pulse = 0.8 + 0.2 * Math.sin(t * 2.8 + sd);
    ctx.strokeStyle = rgba(g.caveCrystal, 0.72 * pulse);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const z = -S * 0.85 + (1.7 * S * i) / 16;
      const y = (yt(z) + yb(z)) * 0.5 + KY * z;
      const x = x0 + 18 + KX * z;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const ky = yb(0) + 12 + Math.sin(t * 2.4 + sd) * 3;
    const gl = ctx.createRadialGradient(x0, ky, 0, x0, ky, 26);
    gl.addColorStop(0, rgba(g.caveCrystal, 0.7 * pulse));
    gl.addColorStop(1, rgba(g.caveCrystal, 0));
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(x0, ky, 26, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = rgba(mix(g.caveCrystal, [255, 255, 255], 0.45), 0.95);
    ctx.beginPath();
    ctx.moveTo(x0, ky - 10); ctx.lineTo(x0 + 6, ky); ctx.lineTo(x0, ky + 10); ctx.lineTo(x0 - 6, ky);
    ctx.closePath(); ctx.fill();
  }
}

// ================= CINCIN, BINTANG, HATI =================
export function drawRing(ctx: Ctx, r: Ring, pal: Pal, back: boolean, t: number) {
  let scale = 1, alpha = 1;
  if (r.state === 1) { scale = 1 + r.t * 1.3; alpha = Math.max(0, 1 - r.t / 0.9); }
  if (r.state >= 2) alpha = 0.3;
  if (alpha <= 0) return;
  const pulse = r.state === 0 ? 1 + Math.sin(t * 3 + r.x) * 0.04 : 1;
  const ry = r.r * scale * pulse, rx = ry * 0.34;
  const a0 = back ? Math.PI / 2 : -Math.PI / 2, a1 = back ? Math.PI * 1.5 : Math.PI / 2;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(pal.ring, 0.22 * alpha);
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, a0, a1); ctx.stroke();
  ctx.strokeStyle = rgba(back ? mix(pal.ring, [120, 70, 30], 0.35) : pal.ring, alpha);
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, a0, a1); ctx.stroke();
  if (!back) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * alpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(r.x + 1, r.y, rx, ry, 0, -Math.PI / 2.4, Math.PI / 6); ctx.stroke();
    if (r.state === 0) {
      ctx.fillStyle = rgba(pal.ring, 0.9);
      ctx.beginPath(); ctx.arc(r.x, r.y - ry - 7, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export function starShape(ctx: Ctx, r: number, c: string) {
  const i = r * 0.22;
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(i, -i); ctx.lineTo(r, 0); ctx.lineTo(i, i); ctx.lineTo(0, r); ctx.lineTo(-i, i); ctx.lineTo(-r, 0); ctx.lineTo(-i, -i); ctx.closePath(); ctx.fill();
}

export function heart(ctx: Ctx, x: number, y: number, s: number, full: boolean) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y - s * 0.25, x - s, y - s * 0.25, x - s, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y + s * 0.75, x - s * 0.2, y + s * 1.05, x, y + s * 1.35);
  ctx.bezierCurveTo(x + s * 0.2, y + s * 1.05, x + s, y + s * 0.75, x + s, y + s * 0.3);
  ctx.bezierCurveTo(x + s, y - s * 0.25, x, y - s * 0.25, x, y + s * 0.35);
  ctx.closePath();
  if (full) { ctx.fillStyle = 'rgba(255,150,172,0.95)'; ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,250,240,0.85)'; ctx.lineWidth = 1.3; ctx.stroke();
}

// ================= PARTIKEL =================
export function drawParticle(ctx: Ctx, p: Particle, pal: Pal, skinBody: string) {
  const a = clamp(p.life / p.max, 0, 1);
  const fade = Math.max(0, Math.min(1, (p.max - p.life) * 2, p.life));
  switch (p.color) {
    case 'mist': {
      // kabut lembut dua lapis (tanpa tepi bulat yang tegas)
      const r = p.size * (1 + (1 - a) * 1.4);
      ctx.fillStyle = `rgba(255,255,255,${a * 0.14})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.18})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.58, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'lift':
      ctx.fillStyle = `rgba(255,255,240,${fade * 0.75})`;
      ctx.fillRect(p.x, p.y, p.size, p.size * 3.2);
      break;
    case 'starlight':
    case 'trail-prism': {
      const hue = (p.ph * 140 + p.x * 0.5) % 360;
      ctx.fillStyle = `hsla(${hue},95%,${p.color === 'starlight' ? 80 : 84}%,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.6), 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'trail-stardust': {
      const s = p.size * (0.6 + a * 0.8);
      ctx.fillStyle = (p.ph * 10) % 2 < 1 ? `rgba(255,255,255,${a})` : `rgba(200,175,255,${a})`;
      ctx.fillRect(p.x - s, p.y - 0.4, s * 2, 0.8); ctx.fillRect(p.x - 0.4, p.y - s, 0.8, s * 2);
      break;
    }
    case 'trail-aurora':
      ctx.fillStyle = `hsla(${150 + ((p.ph * 60) % 170)},90%,72%,${a * 0.6})`;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * 2.4, p.size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'trail-pearl':
      ctx.fillStyle = `hsla(${(p.ph * 90) % 360},80%,90%,${a * 0.45})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.85})`; ctx.lineWidth = 0.6; ctx.stroke();
      break;
    case 'trail-cloud': {
      const r = p.size * (1 + (1 - a) * 1.6);
      ctx.fillStyle = `rgba(255,255,255,${a * 0.3})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.2})`;
      ctx.beginPath(); ctx.arc(p.x + r * 0.6, p.y + r * 0.15, r * 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'trail-petal': {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ph * 2.2);
      ctx.fillStyle = `rgba(255,190,214,${fade * 0.9})`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5 * Math.abs(Math.sin(p.ph * 3)) + 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'trail-glitter': {
      ctx.fillStyle = `rgba(255,222,130,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.45 + a * 0.45), 0, Math.PI * 2); ctx.fill();
      if (p.size > 2.1) {
        const tw = Math.max(0, Math.sin(p.ph * 9)) * a;
        const s = p.size * 2.6 * tw;
        ctx.strokeStyle = `rgba(255,252,230,${tw})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s); ctx.stroke();
      }
      break;
    }
    case 'trail-leaf': {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ph * 2.5);
      ctx.fillStyle = `rgba(150,230,170,${fade * 0.85})`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45 * Math.abs(Math.sin(p.ph * 3)) + 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'trail-frost': {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ph);
      ctx.fillStyle = `rgba(220,245,255,${a})`;
      const s2 = p.size * (0.6 + a * 0.6);
      ctx.beginPath(); ctx.moveTo(0, -s2 * 1.6); ctx.lineTo(s2 * 0.6, 0); ctx.lineTo(0, s2 * 1.6); ctx.lineTo(-s2 * 0.6, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'trail-ember': {
      ctx.fillStyle = `rgba(255,110,60,${a * 0.28})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3 * a + 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,230,150,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size * a), 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'gold':
      ctx.fillStyle = `rgba(255,224,140,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
      break;
    case 'spray':
      ctx.fillStyle = rgba(mix(pal.groundTop, pal.rim, 0.5), a * 0.9);
      ctx.fillRect(p.x, p.y, p.size, p.size);
      break;
    case 'fly': {
      const tw = (0.5 + 0.5 * Math.sin(p.ph * 4)) * fade;
      ctx.fillStyle = `rgba(255,240,150,${tw * 0.25})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,250,200,${tw})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'caveSpore': {
      const tw = (0.45 + 0.55 * Math.sin(p.ph * 3.2)) * fade;
      ctx.fillStyle = rgba(pal.rim, tw * 0.28);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(mix(pal.rim, [255, 255, 255], 0.5), tw * 0.92);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'petal':
    case 'leaf': {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ph * 2);
      ctx.fillStyle = p.color === 'petal' ? `rgba(255,206,220,${fade * 0.9})` : `rgba(110,170,110,${fade * 0.8})`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5 * Math.abs(Math.sin(p.ph * 3)) + 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'snow':
      ctx.fillStyle = `rgba(255,255,255,${fade * 0.85})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      break;
    case 'sand':
      ctx.strokeStyle = `rgba(255,240,210,${a * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.size, p.y); ctx.stroke();
      break;
    case 'ember':
      ctx.fillStyle = `rgba(255,170,90,${fade * (0.6 + 0.4 * Math.sin(p.ph * 6))})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      break;
    case 'red':
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ph * 3);
      ctx.fillStyle = hexA(skinBody, a);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    case 'lantern': {
      const la = Math.min(1, p.life / 3, (p.max - p.life) / 2) * Math.max(0.3, pal.star);
      if (la <= 0) break;
      ctx.fillStyle = `rgba(255,170,80,${la * 0.25})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,190,110,${la})`;
      ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.7, p.size, p.size * 1.4);
      break;
    }
    case 'wind':
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.22})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.size, p.y); ctx.stroke();
      break;
  }
}

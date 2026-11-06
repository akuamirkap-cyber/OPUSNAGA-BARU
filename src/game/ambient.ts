import type { RGB } from './biomes';
import { clamp, mix, rgba } from './scenery';

type Ctx = CanvasRenderingContext2D;

// ============================================================================
// 1. AWAN (CLOUDS)
// ============================================================================
export interface CloudCols { light: string; body: string; shade: string; shadeRGB: number[] }
export interface CloudOpts { alpha?: number; soft?: number; shadow?: boolean; flat?: boolean; rects?: number[] }
interface P2 { x: number; y: number }

function lobePath(ctx: CanvasRenderingContext2D, L: number[], grow: number, rects?: number[]) {
  ctx.beginPath();
  for (let i = 0; i < L.length; i += 4) {
    const rx = L[i + 2] + grow, ry = L[i + 3] + grow;
    if (rx <= 0.5 || ry <= 0.5) continue;
    ctx.moveTo(L[i] + rx, L[i + 1]);
    ctx.ellipse(L[i], L[i + 1], rx, ry, 0, 0, Math.PI * 2);
  }
  if (rects) for (let i = 0; i < rects.length; i += 4) ctx.rect(rects[i] - grow, rects[i + 1] - grow, rects[i + 2] + grow * 2, rects[i + 3] + grow * 2);
}

/** g0 → g1 = arah gradasi cahaya (puncak → perut awan). */
export function paintCloud(ctx: CanvasRenderingContext2D, L: number[], g0: P2, g1: P2, c: CloudCols, o: CloudOpts = {}) {
  if (L.length < 4 && !o.rects) return;
  const a = o.alpha ?? 1, soft = o.soft ?? 1, ga = ctx.globalAlpha;
  if (a <= 0.01) return;
  // 1) tepi berbulu
  if (soft > 0) {
    ctx.fillStyle = c.body;
    ctx.globalAlpha = ga * a * 0.09; lobePath(ctx, L, 8 * soft, o.rects); ctx.fill();
    ctx.globalAlpha = ga * a * 0.2; lobePath(ctx, L, 3.6 * soft, o.rects); ctx.fill();
  }
  // 2) badan awan dengan gradasi cahaya
  ctx.globalAlpha = ga * a;
  if (o.flat) ctx.fillStyle = c.body;
  else {
    const gr = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
    gr.addColorStop(0, c.light);
    gr.addColorStop(0.52, c.body);
    gr.addColorStop(1, c.shade);
    ctx.fillStyle = gr;
  }
  lobePath(ctx, L, 0, o.rects);
  ctx.fill();
  // 3) lipatan bayangan lembut di dalam siluet
  if (o.shadow !== false && !o.flat) {
    const [r, g, b] = c.shadeRGB;
    ctx.save();
    ctx.clip();
    const sg = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
    sg.addColorStop(0.28, `rgba(${r | 0},${g | 0},${b | 0},0)`);
    sg.addColorStop(1, `rgba(${r | 0},${g | 0},${b | 0},0.55)`);
    ctx.fillStyle = sg;
    ctx.beginPath();
    for (let i = 0; i < L.length; i += 4) {
      const rx = L[i + 2] * 0.94, ry = L[i + 3] * 0.86;
      if (rx <= 0.5 || ry <= 0.5) continue;
      const x = L[i] + L[i + 2] * 0.1, y = L[i + 1] + L[i + 3] * 0.62;
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = ga;
}

// ============================================================================
// 2. BALON UDARA (BALLOONS)
// ============================================================================
export interface Balloon { x: number; y: number; r: number; vx: number; ph: number; c1: RGB; c2: RGB; sq: number; sqT: number; cd: number; burn: number }

const COLS: [RGB, RGB][] = [
  [[232, 72, 58], [255, 236, 204]],
  [[46, 150, 160], [250, 240, 222]],
  [[242, 180, 60], [140, 40, 62]],
  [[245, 150, 182], [255, 248, 250]],
  [[42, 62, 122], [242, 196, 92]],
  [[255, 140, 62], [255, 222, 112]],
  [[132, 92, 202], [232, 212, 255]],
  [[62, 160, 112], [250, 236, 192]],
];

export function makeBalloon(x: number, y: number, r: number): Balloon {
  const [c1, c2] = COLS[Math.floor(Math.random() * COLS.length)];
  return { x, y, r, vx: -7 + Math.random() * 16, ph: Math.random() * 6.28, c1, c2, sq: 0, sqT: 0, cd: 0, burn: Math.random() * 3 };
}

export function balloonBob(b: Balloon, t: number) { return Math.sin(t * 0.8 + b.ph) * 4; }

function hw(y: number, r: number) {
  const yt = -r, ym = -0.1 * r, yb = 1.05 * r;
  if (y <= ym) { const u = (y - ym) / (ym - yt); return r * Math.sqrt(Math.max(0, 1 - u * u)); }
  const v = clamp((y - ym) / (yb - ym), 0, 1);
  return r * (0.24 + 0.76 * Math.pow(Math.cos((v * Math.PI) / 2), 1.15));
}

function envelopePath(ctx: Ctx, r: number) {
  const n = 22;
  ctx.beginPath();
  for (let k = 0; k <= n; k++) { const y = -r + (2.05 * r * k) / n; const x = hw(y, r); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  for (let k = n; k >= 0; k--) { const y = -r + (2.05 * r * k) / n; ctx.lineTo(-hw(y, r), y); }
  ctx.closePath();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, rr: number) {
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawBalloon(ctx: Ctx, b: Balloon, t: number, night: number) {
  const r = b.r;
  const sq = b.sq * Math.cos(b.sqT * 16);
  ctx.save();
  ctx.translate(b.x, b.y + balloonBob(b, t));
  ctx.rotate(Math.sin(t * 0.6 + b.ph) * 0.035);
  ctx.scale(1 + 0.15 * sq, 1 - 0.15 * sq);
  // tali
  ctx.strokeStyle = 'rgba(70,46,34,0.8)';
  ctx.lineWidth = Math.max(0.7, r * 0.012);
  ctx.beginPath();
  for (const k of [-0.23, -0.08, 0.08, 0.23]) { ctx.moveTo(k * r, 1.08 * r); ctx.lineTo(k * 0.62 * r, 1.42 * r); }
  ctx.stroke();
  // keranjang anyaman
  ctx.fillStyle = '#7a4c2c';
  roundRect(ctx, -0.16 * r, 1.42 * r, 0.32 * r, 0.2 * r, 0.035 * r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,22,12,0.5)';
  ctx.lineWidth = Math.max(0.5, r * 0.008);
  ctx.beginPath();
  for (let k = 1; k < 4; k++) { const yy = 1.42 * r + k * 0.05 * r; ctx.moveTo(-0.16 * r, yy); ctx.lineTo(0.16 * r, yy); }
  ctx.stroke();
  ctx.fillStyle = '#5a341c';
  ctx.fillRect(-0.18 * r, 1.4 * r, 0.36 * r, 0.04 * r);
  // api pembakar yang menyala sesekali
  const fire = 0.5 + 0.5 * Math.sin(t * 9 + b.burn) * Math.sin(t * 2.1 + b.burn * 2);
  if (fire > 0.35) {
    const fl = (fire - 0.35) / 0.65;
    const gfl = ctx.createRadialGradient(0, 1.2 * r, 0, 0, 1.2 * r, 0.24 * r);
    gfl.addColorStop(0, `rgba(255,236,170,${0.9 * fl})`);
    gfl.addColorStop(0.5, `rgba(255,150,60,${0.6 * fl})`);
    gfl.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gfl;
    ctx.beginPath(); ctx.arc(0, 1.2 * r, 0.24 * r, 0, Math.PI * 2); ctx.fill();
  }
  // amplop bergaris (gore)
  envelopePath(ctx, r);
  ctx.save();
  ctx.clip();
  const G = 8, n = 14;
  for (let k = 0; k < G; k++) {
    const s0 = Math.sin(-Math.PI / 2 + (k / G) * Math.PI), s1 = Math.sin(-Math.PI / 2 + ((k + 1) / G) * Math.PI);
    ctx.fillStyle = rgba(k % 2 ? b.c2 : b.c1);
    ctx.beginPath();
    for (let j = 0; j <= n; j++) { const y = -r + (2.05 * r * j) / n; const x = s0 * hw(y, r) - 0.5; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    for (let j = n; j >= 0; j--) { const y = -r + (2.05 * r * j) / n; ctx.lineTo(s1 * hw(y, r) + 0.5, y); }
    ctx.closePath();
    ctx.fill();
  }
  // pita hias
  ctx.fillStyle = rgba(mix(b.c1, [40, 20, 24], 0.3));
  ctx.fillRect(-1.1 * r, 0.46 * r, 2.2 * r, 0.08 * r);
  ctx.fillStyle = rgba(mix(b.c2, [255, 255, 255], 0.3), 0.85);
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(k * 0.15 * r, 0.5 * r, 0.025 * r, 0, Math.PI * 2); ctx.fill(); }
  // sorot cahaya & sisi bayangan
  const hl = ctx.createRadialGradient(-0.4 * r, -0.5 * r, 0, -0.2 * r, -0.25 * r, 1.25 * r);
  hl.addColorStop(0, 'rgba(255,255,255,0.45)');
  hl.addColorStop(0.45, 'rgba(255,255,255,0.08)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  const sh = ctx.createLinearGradient(-r, 0, r, 0);
  sh.addColorStop(0, 'rgba(20,10,30,0)');
  sh.addColorStop(0.55, 'rgba(20,10,30,0.06)');
  sh.addColorStop(1, 'rgba(20,10,30,0.34)');
  ctx.fillStyle = sh;
  ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  // malam
  if (night > 0.15) {
    const ig = ctx.createRadialGradient(0, 0.95 * r, 0, 0, 0.5 * r, 1.3 * r);
    ig.addColorStop(0, `rgba(255,170,80,${0.5 * night * (0.55 + 0.45 * fire)})`);
    ig.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = ig;
    ctx.fillRect(-1.2 * r, -1.1 * r, 2.4 * r, 2.3 * r);
  }
  ctx.restore();
  // mulut amplop
  ctx.fillStyle = rgba(mix(b.c1, [30, 14, 18], 0.45));
  ctx.beginPath();
  ctx.moveTo(-0.25 * r, 1.0 * r); ctx.lineTo(0.25 * r, 1.0 * r); ctx.lineTo(0.2 * r, 1.12 * r); ctx.lineTo(-0.2 * r, 1.12 * r);
  ctx.closePath();
  ctx.fill();
  envelopePath(ctx, r);
  ctx.strokeStyle = 'rgba(40,20,30,0.28)';
  ctx.lineWidth = Math.max(0.8, r * 0.014);
  ctx.stroke();
  ctx.restore();
}

export function balloonSilhouette(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  envelopePath(ctx, r);
  ctx.fill();
  ctx.fillRect(-0.15 * r, 1.38 * r, 0.3 * r, 0.2 * r);
  ctx.strokeStyle = fill;
  ctx.lineWidth = Math.max(0.5, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(-0.22 * r, 1.05 * r); ctx.lineTo(-0.12 * r, 1.4 * r);
  ctx.moveTo(0.22 * r, 1.05 * r); ctx.lineTo(0.12 * r, 1.4 * r);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 3. BURUNG (BIRDS)
// ============================================================================
export type BirdType = 'bangau' | 'walet' | 'merpati';
export interface Bird { ox: number; oy: number; px: number; py: number; ph: number; s: number; rate: number; seed: number }
export interface Flock { x: number; y: number; vx: number; type: BirdType; birds: Bird[]; t: number; met: boolean; react: number }

const SPEED: Record<BirdType, number> = { bangau: 120, walet: 200, merpati: 150 };
const FLAP: Record<BirdType, number> = { bangau: 1.35, walet: 4.4, merpati: 2.4 };

export function makeFlock(x: number, y: number, type: BirdType): Flock {
  const birds: Bird[] = [];
  const n = type === 'walet' ? 7 + Math.floor(Math.random() * 5) : type === 'bangau' ? 5 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    let ox: number, oy: number;
    if (type === 'bangau') {
      const k = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
      ox = -k * 34; oy = side * k * 19;
    } else if (type === 'merpati') {
      ox = -i * 30 + (Math.random() - 0.5) * 14; oy = (Math.random() - 0.5) * 50;
    } else {
      ox = (Math.random() - 0.5) * 140; oy = (Math.random() - 0.5) * 70;
    }
    birds.push({
      ox, oy, px: 0, py: 0, ph: Math.random() * 6.28, rate: 0.88 + Math.random() * 0.24, seed: Math.random() * 100,
      s: (type === 'bangau' ? 1.45 : type === 'merpati' ? 1.15 : 0.95) * (0.88 + Math.random() * 0.24),
    });
  }
  return { x, y, vx: SPEED[type] * (0.9 + Math.random() * 0.2), type, birds, t: 0, met: false, react: 0 };
}

export function birdPos(f: Flock, b: Bird) {
  let x = f.x + b.ox + b.px, y = f.y + b.oy + b.py + Math.sin(f.t * 0.9 + b.seed) * 3;
  if (f.type === 'walet') { x += Math.sin(f.t * 1.3 + b.seed) * 14; y += Math.cos(f.t * 1.7 + b.seed * 1.3) * 9; }
  return { x, y };
}

export function updateFlock(f: Flock, dt: number, hx: number, hy: number): boolean {
  f.t += dt;
  f.x += f.vx * dt;
  f.y += Math.sin(f.t * 0.45) * 7 * dt;
  f.react = Math.max(0, f.react - dt * 0.5);
  let metNow = false;
  for (const b of f.birds) {
    const p = birdPos(f, b);
    const dx = p.x - hx, dy = p.y - hy, d = Math.hypot(dx, dy);
    if (d < 95) {
      const k = (95 - d) / 95, l = d || 1;
      b.px += (dx / l) * k * 170 * dt;
      b.py += ((dy / l) * 0.7 - 0.6) * k * 170 * dt;
      if (!f.met) { f.met = true; metNow = true; f.react = 1; }
    }
    b.px *= 1 - dt * 0.45;
    b.py *= 1 - dt * 0.45;
    b.ph += dt * Math.PI * 2 * FLAP[f.type] * b.rate * (1 + f.react * 1.3);
  }
  return metNow;
}

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, r = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2); ctx.fill(); }
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function poly(ctx: CanvasRenderingContext2D, p: number[]) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.closePath(); ctx.fill();
}

function wing(ctx: CanvasRenderingContext2D, w: number, span: number, sweep: number, broad: number, col: string, tip?: string) {
  const ty = -span * w, tx = -sweep - Math.abs(w) * 1.5;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(broad * 0.5, -0.8);
  ctx.quadraticCurveTo(broad * 0.45, ty * 0.6, tx + 1, ty);
  ctx.quadraticCurveTo(-broad * 0.55, ty * 0.75, -broad * 0.6, -0.6);
  ctx.closePath(); ctx.fill();
  if (tip) {
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(tx + 1, ty);
    ctx.lineTo(tx + broad * 0.32, ty * 0.66);
    ctx.lineTo(tx - broad * 0.32, ty * 0.7);
    ctx.closePath(); ctx.fill();
  }
}

function crane(ctx: CanvasRenderingContext2D, ph: number, glide: number) {
  const w = Math.sin(ph) * glide + (1 - glide) * 0.15;
  wing(ctx, w * 0.92, 15, 2, 9, '#c9d0dc', '#2a2a34');
  ctx.strokeStyle = '#3a3a46'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-5, 0.8); ctx.lineTo(-15.5, 2); ctx.stroke();
  ctx.fillStyle = '#fbfbfd'; ell(ctx, 0, 0, 7.6, 2.7);
  ctx.fillStyle = '#2a2a34'; poly(ctx, [-6.4, -1.2, -10, 0.2, -6.4, 1.6]);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(5.5, -0.8); ctx.quadraticCurveTo(9, -1.2, 12.5, -1.8); ctx.stroke();
  ctx.fillStyle = '#fbfbfd'; dot(ctx, 13.4, -1.9, 1.75);
  ctx.fillStyle = '#e2483a'; dot(ctx, 13.5, -3.2, 0.85);
  ctx.strokeStyle = '#cdb27a'; ctx.lineWidth = 0.85;
  ctx.beginPath(); ctx.moveTo(14.9, -1.7); ctx.lineTo(18.6, -1.2); ctx.stroke();
  ctx.fillStyle = '#1a1a22'; dot(ctx, 13.9, -2.1, 0.35);
  wing(ctx, w, 16, 1, 10, '#ffffff', '#2a2a34');
}

function swallow(ctx: CanvasRenderingContext2D, ph: number) {
  const w = Math.sin(ph);
  wing(ctx, w * 0.9, 9, 5, 4, '#2a3150');
  ctx.fillStyle = '#26304e';
  poly(ctx, [-3.2, -0.6, -11, -2.8, -5, 0]);
  poly(ctx, [-3.2, 0.6, -11, 2.6, -5, 0]);
  ell(ctx, 0, 0, 4.4, 1.6);
  ctx.fillStyle = '#f4efe6'; ell(ctx, 0.6, 0.75, 3, 0.75);
  ctx.fillStyle = '#26304e'; dot(ctx, 3.8, -0.3, 1.35);
  ctx.fillStyle = '#c8553d'; dot(ctx, 4.5, 0.45, 0.65);
  wing(ctx, w, 10, 5.5, 4.4, '#1e2642');
}

function dove(ctx: CanvasRenderingContext2D, ph: number, t: number, seed: number) {
  const w = Math.sin(ph);
  const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 16);
  g.addColorStop(0, `rgba(255,250,235,${0.32 + 0.12 * Math.sin(t * 3 + seed)})`);
  g.addColorStop(1, 'rgba(255,250,235,0)');
  ctx.fillStyle = g; dot(ctx, 0, -1, 16);
  wing(ctx, w * 0.9, 12, 1.5, 9, '#e4e6f0');
  ctx.fillStyle = '#f0f1f6'; poly(ctx, [-4, -1.2, -9.5, -2.6, -9.5, 2.2, -4, 1.2]);
  ctx.fillStyle = '#ffffff'; ell(ctx, 0, 0, 5.4, 2.5);
  dot(ctx, 4.9, -1.3, 1.95);
  ctx.fillStyle = '#f0a050'; poly(ctx, [6.6, -1.5, 8.6, -1, 6.6, -0.6]);
  ctx.fillStyle = '#2a2230'; dot(ctx, 5.4, -1.7, 0.4);
  wing(ctx, w, 13, 1, 10, '#ffffff');
  ctx.strokeStyle = 'rgba(190,196,214,0.7)'; ctx.lineWidth = 0.4;
  for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-1 + k * 1.6, -0.8); ctx.lineTo(-2 + k * 1.2, -13 * w * (0.4 + k * 0.12)); ctx.stroke(); }
}

export function drawFlock(ctx: CanvasRenderingContext2D, f: Flock, t: number) {
  for (const b of f.birds) {
    const p = birdPos(f, b);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(b.s, b.s);
    if (f.type === 'bangau') {
      const glide = f.react > 0.2 ? 1 : 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.35 + b.seed));
      crane(ctx, b.ph, glide);
    } else if (f.type === 'walet') swallow(ctx, b.ph);
    else dove(ctx, b.ph, t, b.seed);
    ctx.restore();
  }
}

export function farBird(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, ph: number, col: string) {
  const w = Math.sin(ph) * 0.8;
  ctx.strokeStyle = col; ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, y - 3 * s * w);
  ctx.quadraticCurveTo(x - 2 * s, y - 2.6 * s * w, x, y);
  ctx.quadraticCurveTo(x + 2 * s, y - 2.6 * s * w, x + 5 * s, y - 3 * s * w);
  ctx.stroke();
}

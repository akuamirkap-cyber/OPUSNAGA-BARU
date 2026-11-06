import type { RGB } from './biomes';
import type { HollowTheme } from './progress';
import { W, H, clamp, lerp, smooth, mix, rgba, hash, type Pal } from './scenery';

type Ctx = CanvasRenderingContext2D;

// ================= KONFIGURASI DUNIA VERTIKAL (HOLLOW EARTH & SURGA) =================
export const CAVE_START = 4200;    // awal gerbang Hollow Earth
export const CAVE_LEN = 18000;     // panjang ekspedisi Hollow Earth (~1.800 m)
export const CAVE_EVERY = 44000;   // siklus dunia bawah tanah berikutnya
export const CAVE_H = 540;         // tinggi kubah gua yang lapang & megah (tanpa duri tajam)
export const PILLAR_H = 290;       // tinggi pilar gerbang mulut masuk & keluar gua
export const ARCH_MID_H = 324;     // tinggi puncak busur gerbang mulut gua
export const GATE_SPAN = 260;      // lebar bentang gerbang mulut masuk & keluar gua
export const HEAVEN_A0 = 1500;     // surga mulai terlihat di langit tinggi
export const HEAVEN_A1 = 2500;     // surga penuh di atas awan

let caveOrigin = 1400;
export function setCaveOrigin(x: number) { caveOrigin = x; }
export function getCaveOrigin() { return caveOrigin; }

export interface CaveSeg { xStart: number; xEnd: number; idx: number }

export function caveSegmentsInRange(x0: number, x1: number): CaveSeg[] {
  const out: CaveSeg[] = [];
  const baseStart = CAVE_START + caveOrigin;
  const k0 = Math.max(0, Math.floor((x0 - baseStart - CAVE_LEN) / CAVE_EVERY));
  const k1 = Math.floor((x1 - baseStart) / CAVE_EVERY);
  for (let k = k0; k <= k1; k++) {
    const xStart = baseStart + k * CAVE_EVERY;
    const xEnd = xStart + CAVE_LEN;
    if (xEnd >= x0 && xStart <= x1) out.push({ xStart, xEnd, idx: k });
  }
  return out;
}

// ================= PROFIL KEDALAMAN TANAH HOLLOW EARTH =================
// Lereng ngarai menurun mulus & alami menuju gerbang Hollow Earth (2400px turunan landai),
// terjaga dalam di bawah tanah tanpa patahan ekstrem, lalu menanjak kembali ke permukaan saat keluar.
export function caveGroundOffset(x: number): number {
  const lx = x - caveOrigin;
  const leadIn = 2400;
  const leadOut = 2400;
  const maxDepth = 380;

  if (lx < CAVE_START - leadIn) return 0;

  if (lx < CAVE_START) {
    const u = (lx - (CAVE_START - leadIn)) / leadIn;
    return smooth(clamp(u, 0, 1)) * maxDepth;
  }

  const rel = lx - CAVE_START;
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;

  if (m <= CAVE_LEN) {
    let depthFactor = 1;
    if (m > CAVE_LEN - leadOut) {
      depthFactor = smooth((CAVE_LEN - m) / leadOut);
    }
    const blendIn = smooth(clamp(m / leadIn, 0, 1));
    const blendOut = smooth(clamp((CAVE_LEN - m) / leadOut, 0, 1));
    const ripple = (Math.sin(x * 0.0032) * 24 + Math.sin(x * 0.0075 + 1.2) * 11) * blendIn * blendOut;
    return depthFactor * maxDepth + ripple;
  }

  const distToNext = CAVE_EVERY - m;
  if (distToNext <= leadIn) {
    const u = (leadIn - distToNext) / leadIn;
    return smooth(clamp(u, 0, 1)) * maxDepth;
  }

  return 0;
}

// Spasial murni: 1 di dalam rongga gua [xStart, xEnd], 0 di luar gua
export function caveInfo(x: number): { amt: number; idx: number } {
  const rel = x - caveOrigin - CAVE_START;
  if (rel < 0) return { amt: 0, idx: -1 };
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;
  const idx = Math.floor(rel / CAVE_EVERY);
  if (m < 0 || m > CAVE_LEN) return { amt: 0, idx };
  return { amt: 1, idx };
}

// Langit-langit kubah gua (koordinat dunia, menyatu tepat di puncak pilar & busur gerbang masuk/keluar)
export function caveCeilY(g: number, x: number): number {
  const rel = x - caveOrigin - CAVE_START;
  if (rel < 0) return g - 3000;
  const m = ((rel % CAVE_EVERY) + CAVE_EVERY) % CAVE_EVERY;
  if (m < 0 || m > CAVE_LEN) return g - 3000;
  const dEdge = Math.min(m, CAVE_LEN - m);
  const halfGate = GATE_SPAN * 0.5;
  let h: number;
  if (dEdge <= halfGate) {
    h = lerp(PILLAR_H, ARCH_MID_H, smooth(clamp(dEdge / halfGate, 0, 1)));
  } else {
    h = lerp(ARCH_MID_H, CAVE_H, smooth(clamp((dEdge - halfGate) / 600, 0, 1)));
  }
  const waveEnv = smooth(clamp((dEdge - halfGate) / 500, 0, 1));
  const wave = (Math.sin(x * 0.004) * 14 + Math.sin(x * 0.012 + 1.5) * 6) * waveEnv;
  return g - h + wave;
}

export function heavenAmt(altS: number): number {
  return smooth(clamp((altS - HEAVEN_A0) / (HEAVEN_A1 - HEAVEN_A0), 0, 1));
}

// ================= TEMA WARNA TUNGGAL HOLLOW EARTH (DAPAT DIGANTI DI SETELAN) =================
export interface CaveZoneData {
  id: HollowTheme;
  name: string;
  sub: string;
  swatch: [string, string, string];
  skyTop: RGB;
  skyMid: RGB;
  skyBot: RGB;
  fogRGB: RGB;
  farRGB: RGB;
  midRGB: RGB;
  nearRGB: RGB;
  crystalRGB: RGB;
  crystalAltRGB: RGB;
  waterRGB: RGB;
  crystalGlow: string;
  crystalAltGlow: string;
  lightRay: string;
}

const rgbPrefix = (c: RGB) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},`;

function makeTheme(t: Omit<CaveZoneData, 'crystalGlow' | 'crystalAltGlow' | 'lightRay'>): CaveZoneData {
  const rayRGB = mix(t.crystalRGB, [255, 255, 255], 0.45);
  return {
    ...t,
    crystalGlow: rgbPrefix(t.crystalRGB),
    crystalAltGlow: rgbPrefix(t.crystalAltRGB),
    lightRay: rgbPrefix(rayRGB),
  };
}

export const HOLLOW_THEMES: CaveZoneData[] = [
  makeTheme({
    id: 'safir',
    name: 'Lembah Safir',
    sub: 'HOLLOW EARTH · 地心藍晶',
    swatch: ['#7ce8ff', '#2b7de9', '#0b1e46'],
    skyTop: [7, 16, 38],
    skyMid: [14, 42, 82],
    skyBot: [24, 82, 128],
    fogRGB: [38, 112, 164],
    farRGB: [18, 52, 94],
    midRGB: [12, 34, 68],
    nearRGB: [8, 22, 46],
    crystalRGB: [75, 214, 255],
    crystalAltRGB: [130, 255, 232],
    waterRGB: [42, 184, 245],
  }),
  makeTheme({
    id: 'ametis',
    name: 'Katedral Ametis',
    sub: 'HOLLOW EARTH · 地心紫晶',
    swatch: ['#f5a6ff', '#9c4dff', '#1a0b38'],
    skyTop: [16, 8, 38],
    skyMid: [40, 16, 78],
    skyBot: [78, 30, 120],
    fogRGB: [108, 48, 152],
    farRGB: [50, 22, 90],
    midRGB: [34, 14, 66],
    nearRGB: [22, 9, 44],
    crystalRGB: [216, 115, 255],
    crystalAltRGB: [255, 155, 225],
    waterRGB: [188, 96, 248],
  }),
  makeTheme({
    id: 'zamrud',
    name: 'Rimba Zamrud',
    sub: 'HOLLOW EARTH · 地心翠林',
    swatch: ['#9effc8', '#1ec88a', '#062022'],
    skyTop: [5, 22, 24],
    skyMid: [10, 50, 48],
    skyBot: [20, 90, 76],
    fogRGB: [36, 124, 100],
    farRGB: [14, 60, 54],
    midRGB: [9, 42, 38],
    nearRGB: [6, 26, 26],
    crystalRGB: [68, 245, 172],
    crystalAltRGB: [190, 255, 125],
    waterRGB: [45, 218, 158],
  }),
  makeTheme({
    id: 'emas',
    name: 'Istana Emas',
    sub: 'HOLLOW EARTH · 地心金殿',
    swatch: ['#fff0a8', '#f5a638', '#261224'],
    skyTop: [22, 12, 32],
    skyMid: [56, 26, 52],
    skyBot: [110, 56, 68],
    fogRGB: [158, 88, 92],
    farRGB: [68, 34, 58],
    midRGB: [46, 22, 44],
    nearRGB: [30, 14, 32],
    crystalRGB: [255, 214, 92],
    crystalAltRGB: [255, 154, 120],
    waterRGB: [248, 188, 86],
  }),
];

let activeHollowTheme: HollowTheme = 'safir';
export function setHollowTheme(id: HollowTheme) { activeHollowTheme = id; }
export function getHollowTheme(): HollowTheme { return activeHollowTheme; }

export function caveZone(_x = 0): CaveZoneData {
  return HOLLOW_THEMES.find((t) => t.id === activeHollowTheme) || HOLLOW_THEMES[0];
}

export function hollowGroundColors() {
  const z = caveZone();
  return {
    groundTop: mix(z.nearRGB, z.crystalRGB, 0.24),
    ground: mix(z.skyTop, z.nearRGB, 0.55),
    rim: mix(z.crystalRGB, [255, 255, 255], 0.35),
    rock: z.nearRGB,
    rockLight: mix(z.midRGB, z.crystalRGB, 0.28),
  };
}

// ================= PALET SURGA =================
const HEAVEN = {
  skyTop: [120, 140, 255] as RGB, skyBot: [255, 190, 216] as RGB, fog: [255, 224, 238] as RGB,
  far: [192, 166, 255] as RGB, mid: [255, 178, 216] as RGB, near: [255, 206, 178] as RGB,
  groundTop: [255, 240, 230] as RGB, ground: [230, 190, 220] as RGB,
  rock: [150, 140, 200] as RGB, rockLight: [210, 200, 240] as RGB,
  sun: [255, 244, 214] as RGB,
};

export function applyRealmTints(p: Pal, _caveK: number, heavenK: number) {
  if (heavenK > 0.01) {
    const k = clamp(heavenK, 0, 1) * 0.7;
    p.skyTop = mix(p.skyTop, HEAVEN.skyTop, k);
    p.skyBot = mix(p.skyBot, HEAVEN.skyBot, k);
    p.fog = mix(p.fog, HEAVEN.fog, k * 0.65);
    p.far = mix(p.far, HEAVEN.far, k * 0.75);
    p.mid = mix(p.mid, HEAVEN.mid, k * 0.75);
    p.near = mix(p.near, HEAVEN.near, k * 0.75);
    p.groundTop = mix(p.groundTop, HEAVEN.groundTop, k * 0.65);
    p.ground = mix(p.ground, HEAVEN.ground, k * 0.65);
    p.rock = mix(p.rock, HEAVEN.rock, k * 0.7);
    p.rockLight = mix(p.rockLight, HEAVEN.rockLight, k * 0.7);
    p.sun = mix(p.sun, HEAVEN.sun, k);
    p.sunA = Math.max(p.sunA, k);
    p.star = lerp(p.star, 0.35, k);
    p.aurora = Math.max(p.aurora, k * 0.35);
  }
}

// ================= CLIPPING SPASIAL RONGGA HOLLOW EARTH (TANPA FADE-IN / FADE-OUT) =================
export function clipCaveCavities(
  ctx: Ctx, camX: number, camY: number, zoom: number, groundYat: (x: number) => number,
): boolean {
  const vw = W / zoom;
  const segs = caveSegmentsInRange(camX - 60, camX + vw + 60);
  if (!segs.length) return false;

  ctx.beginPath();
  for (const { xStart, xEnd } of segs) {
    const xa = Math.max(xStart, camX - 40);
    const xb = Math.min(xEnd, camX + vw + 40);
    if (xb <= xa) continue;

    const sxA = (xa - camX) * zoom;
    const syA = (caveCeilY(groundYat(xa), xa) - camY) * zoom;
    ctx.moveTo(sxA, syA);

    for (let x = xa + 24; x < xb; x += 24) {
      ctx.lineTo((x - camX) * zoom, (caveCeilY(groundYat(x), x) - camY) * zoom);
    }

    const sxB = (xb - camX) * zoom;
    const syB = (caveCeilY(groundYat(xb), xb) - camY) * zoom;
    ctx.lineTo(sxB, syB);
    ctx.lineTo(sxB, H + 80);
    ctx.lineTo(sxA, H + 80);
    ctx.closePath();
  }
  ctx.clip();
  return true;
}

// ================= ELEMEN VISUAL HOLLOW EARTH (KRISTAL, JAMUR, AIR TERJUN) =================
function drawCrystalShard(
  ctx: Ctx, x: number, y: number, ang: number, len: number, w: number,
  col: RGB, altCol: RGB, alpha: number,
) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const shoulder = len * 0.72;
  const tipX = x + dx * len, tipY = y + dy * len;
  const midX = x + dx * shoulder, midY = y + dy * shoulder;

  ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.42), alpha * 0.92);
  ctx.beginPath();
  ctx.moveTo(x - nx * w * 0.5, y - ny * w * 0.5);
  ctx.lineTo(midX - nx * w * 0.46, midY - ny * w * 0.46);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgba(mix(col, altCol, 0.4), alpha * 0.85);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(midX + nx * w * 0.46, midY + ny * w * 0.46);
  ctx.lineTo(x + nx * w * 0.5, y + ny * w * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.72})`;
  ctx.lineWidth = Math.max(0.8, w * 0.08);
  ctx.beginPath();
  ctx.moveTo(x + dx * len * 0.08, y + dy * len * 0.08);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
}

function drawCrystalCluster(
  ctx: Ctx, x: number, y: number, sc: number, seed: number,
  z: CaveZoneData, alpha: number, t: number, down = false,
) {
  const pulse = 0.86 + 0.14 * Math.sin(t * 2.1 + seed * 3.7);
  const a = alpha * pulse;
  const dir = down ? Math.PI * 0.5 : -Math.PI * 0.5;
  const glowR = 68 * sc;

  const gl = ctx.createRadialGradient(x, y + (down ? 24 : -24) * sc, 0, x, y + (down ? 24 : -24) * sc, glowR);
  gl.addColorStop(0, z.crystalGlow + `${0.42 * a})`);
  gl.addColorStop(0.5, z.crystalAltGlow + `${0.16 * a})`);
  gl.addColorStop(1, z.crystalGlow + '0)');
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.arc(x, y + (down ? 24 : -24) * sc, glowR, 0, Math.PI * 2);
  ctx.fill();

  const shards = 5;
  for (let k = 0; k < shards; k++) {
    const u = (k / (shards - 1)) - 0.5;
    const ang = dir + u * 1.15 + (hash(seed + k * 2.3) - 0.5) * 0.14;
    const len = (36 + (1 - Math.abs(u) * 1.1) * 44 + hash(seed * 3 + k) * 16) * sc;
    const w = (10 + (1 - Math.abs(u)) * 8) * sc;
    drawCrystalShard(ctx, x + u * 18 * sc, y, ang, len, w, z.crystalRGB, z.crystalAltRGB, a);
  }
}

function drawGiantMushroom(
  ctx: Ctx, x: number, y: number, sc: number, seed: number,
  z: CaveZoneData, alpha: number, t: number,
) {
  const sway = Math.sin(t * 1.2 + seed * 2.5) * 4 * sc;
  const pulse = 0.85 + 0.15 * Math.sin(t * 1.9 + seed * 4.1);
  const h = (70 + hash(seed * 2.7) * 45) * sc;
  const capW = (44 + hash(seed * 5.1) * 26) * sc;
  const capH = capW * 0.46;
  const topX = x + sway, topY = y - h;

  const gl = ctx.createRadialGradient(topX, topY, 0, topX, topY, capW * 1.55);
  gl.addColorStop(0, z.crystalAltGlow + `${0.36 * alpha * pulse})`);
  gl.addColorStop(0.55, z.crystalGlow + `${0.14 * alpha * pulse})`);
  gl.addColorStop(1, z.crystalGlow + '0)');
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.arc(topX, topY, capW * 1.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rgba(mix(z.crystalAltRGB, [255, 255, 255], 0.55), alpha * 0.72);
  ctx.lineWidth = 6.5 * sc;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - sway * 0.6, y - h * 0.5, topX, topY + capH * 0.2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = rgba(mix(z.crystalAltRGB, [255, 255, 255], 0.65), alpha * 0.85);
  ctx.beginPath();
  ctx.ellipse(topX, topY + capH * 0.18, capW * 0.92, capH * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const cg = ctx.createLinearGradient(topX, topY - capH, topX, topY + capH * 0.25);
  cg.addColorStop(0, rgba(mix(z.crystalRGB, [255, 255, 255], 0.25), alpha * 0.94));
  cg.addColorStop(0.65, rgba(z.crystalRGB, alpha * 0.9));
  cg.addColorStop(1, rgba(z.crystalAltRGB, alpha * 0.95));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(topX - capW, topY + capH * 0.16);
  ctx.bezierCurveTo(topX - capW * 0.95, topY - capH * 1.05, topX + capW * 0.95, topY - capH * 1.05, topX + capW, topY + capH * 0.16);
  ctx.quadraticCurveTo(topX, topY + capH * 0.34, topX - capW, topY + capH * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.78 * pulse})`;
  for (let k = -2; k <= 2; k++) {
    const sx = topX + k * capW * 0.32 + (hash(seed + k) - 0.5) * 6 * sc;
    const sy = topY - capH * (0.36 - Math.abs(k) * 0.08);
    ctx.beginPath();
    ctx.arc(sx, sy, (2.2 + hash(seed * 3 + k) * 2.2) * sc, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLuminousWaterfall(
  ctx: Ctx, x: number, topY: number, botY: number, w: number,
  z: CaveZoneData, alpha: number, t: number, seed: number,
) {
  const h = botY - topY;
  if (h <= 10) return;

  const aura = ctx.createLinearGradient(x - w * 2.2, 0, x + w * 2.2, 0);
  aura.addColorStop(0, z.crystalGlow + '0)');
  aura.addColorStop(0.5, z.crystalGlow + `${0.24 * alpha})`);
  aura.addColorStop(1, z.crystalGlow + '0)');
  ctx.fillStyle = aura;
  ctx.fillRect(x - w * 2.2, topY, w * 4.4, h);

  const wg = ctx.createLinearGradient(0, topY, 0, botY);
  wg.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`);
  wg.addColorStop(0.25, z.crystalGlow + `${0.48 * alpha})`);
  wg.addColorStop(0.85, z.crystalAltGlow + `${0.42 * alpha})`);
  wg.addColorStop(1, z.crystalAltGlow + '0)');
  ctx.fillStyle = wg;
  ctx.fillRect(x - w * 0.5, topY, w, h);

  ctx.strokeStyle = `rgba(255,255,255,${0.52 * alpha})`;
  ctx.lineWidth = 1.4;
  for (let k = -1; k <= 1; k++) {
    const sx = x + k * w * 0.26;
    const phase = (t * 110 + seed * 40 + k * 25) % 48;
    ctx.beginPath();
    for (let yy = topY + phase; yy < botY - 12; yy += 48) {
      ctx.moveTo(sx, yy);
      ctx.lineTo(sx, Math.min(botY - 6, yy + 26));
    }
    ctx.stroke();
  }

  const sp = ctx.createRadialGradient(x, botY, 0, x, botY, w * 2.6);
  sp.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`);
  sp.addColorStop(0.4, z.crystalAltGlow + `${0.32 * alpha})`);
  sp.addColorStop(1, z.crystalAltGlow + '0)');
  ctx.fillStyle = sp;
  ctx.beginPath();
  ctx.ellipse(x, botY, w * 2.6, w * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ================= PANORAMA DUNIA BAWAH TANAH HOLLOW EARTH (100% OPASITAS SPASIAL) =================
export function drawCaveBackdrop(ctx: Ctx, t: number, camX: number, gyScr: number) {
  const z = caveZone();

  // 1. Langit Kubah Bawah Tanah & Cahaya Inti Bumi
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, rgba(z.skyTop));
  sky.addColorStop(0.38, rgba(z.skyMid));
  sky.addColorStop(0.74, rgba(z.skyBot));
  sky.addColorStop(1, rgba(z.fogRGB));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const coreY = H * 0.54;
  const coreGlow = ctx.createRadialGradient(W * 0.52, coreY, 10, W * 0.52, coreY, W * 0.62);
  coreGlow.addColorStop(0, z.crystalAltGlow + '0.26)');
  coreGlow.addColorStop(0.45, z.crystalGlow + '0.12)');
  coreGlow.addColorStop(1, z.crystalGlow + '0)');
  ctx.fillStyle = coreGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Aurora Bioluminesensi Bawah Tanah di Kubah Atas
  for (let k = 0; k < 3; k++) {
    const base = 66 + k * 34;
    const ag = ctx.createLinearGradient(0, base - 25, 0, base + 95);
    const colPrefix = k % 2 === 0 ? z.crystalGlow : z.crystalAltGlow;
    ag.addColorStop(0, colPrefix + '0)');
    ag.addColorStop(0.3, colPrefix + '0.2)');
    ag.addColorStop(1, colPrefix + '0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    const pts: number[] = [];
    for (let sx = 0; sx <= W; sx += 20) {
      const wx = sx + camX * 0.025;
      pts.push(base + Math.sin(wx * 0.005 + t * 0.35 + k * 1.9) * 20 + Math.sin(wx * 0.012 - t * 0.45 + k) * 9);
    }
    pts.forEach((py, i) => (i === 0 ? ctx.moveTo(0, py) : ctx.lineTo(i * 20, py)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(i * 20, pts[i] + 95);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Berkas Sinar Cahaya Volumetrik (God Rays) Lembut
  for (let k = 0; k < 5; k++) {
    const bx = (((k * 260 + 90 - camX * 0.03 + t * 5) % (W + 420) + W + 420) % (W + 420)) - 210;
    const rw = 65 + (k % 3) * 28;
    const rg = ctx.createLinearGradient(bx, 0, bx + 150, H * 0.85);
    rg.addColorStop(0, z.lightRay + '0.15)');
    rg.addColorStop(0.55, z.lightRay + '0.06)');
    rg.addColorStop(1, z.lightRay + '0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(bx, -10);
    ctx.lineTo(bx + rw, -10);
    ctx.lineTo(bx + rw + 210, H * 0.88);
    ctx.lineTo(bx + 170, H * 0.88);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Lapisan Pegunungan & Katedral Kristal Jauh (Parallax 0.04)
  {
    const par = 0.04, off = camX * par;
    const farY = (sx: number) => {
      const wx = sx + off;
      const r = 1 - Math.abs(Math.sin(wx * 0.0024 + 0.7));
      const r2 = 1 - Math.abs(Math.sin(wx * 0.0061 + 1.9));
      return H * 0.64 - (r * r * 125 + r2 * r2 * 55);
    };
    const fg = ctx.createLinearGradient(0, H * 0.32, 0, H * 0.78);
    fg.addColorStop(0, rgba(z.farRGB));
    fg.addColorStop(1, rgba(mix(z.farRGB, z.fogRGB, 0.55)));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-10, H);
    for (let sx = -10; sx <= W + 10; sx += 12) ctx.lineTo(sx, farY(sx));
    ctx.lineTo(W + 10, H);
    ctx.closePath();
    ctx.fill();

    const slot = 340, i0 = Math.floor((off - 160) / slot), i1 = Math.floor((off + W + 160) / slot);
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 4.3 + 2.1) < 0.3) continue;
      const sx = i * slot - off + (hash(i * 6.7) - 0.5) * 90;
      if (sx < -120 || sx > W + 120) continue;
      const sy = farY(sx) + 12;
      drawCrystalCluster(ctx, sx, sy, 0.75 + hash(i * 8.1) * 0.55, i * 1.7, z, 0.55, t, false);
    }
  }

  // 5. Lapisan Gua Tengah: Air Terjun Bercahaya, Kristal Raksasa & Jamur Bioluminesensi (Parallax 0.11)
  const waterY = clamp(gyScr - 44, H * 0.52, H * 0.84);
  {
    const par = 0.11, off = camX * par;
    const midY = (sx: number) => {
      const wx = sx + off;
      const r = 1 - Math.abs(Math.sin(wx * 0.0033 + 2.3));
      const r2 = Math.sin(wx * 0.0085 + 0.9) * 0.5 + 0.5;
      return waterY + 14 - (r * r * 95 + r2 * 36);
    };

    const wfSlot = 480, w0 = Math.floor((off - 200) / wfSlot), w1 = Math.floor((off + W + 200) / wfSlot);
    for (let i = w0; i <= w1; i++) {
      if (hash(i * 9.3 + 1.4) < 0.32) continue;
      const sx = i * wfSlot - off + (hash(i * 4.9) - 0.5) * 120;
      if (sx < -120 || sx > W + 120) continue;
      const topY = H * (0.08 + hash(i * 3.1) * 0.14);
      const fw = 14 + hash(i * 7.7) * 14;
      drawLuminousWaterfall(ctx, sx, topY, waterY + 4, fw, z, 0.82, t, i);
    }

    const mg = ctx.createLinearGradient(0, waterY - 120, 0, waterY + 40);
    mg.addColorStop(0, rgba(z.midRGB));
    mg.addColorStop(1, rgba(mix(z.midRGB, z.fogRGB, 0.4)));
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(-10, waterY + 40);
    for (let sx = -10; sx <= W + 10; sx += 10) ctx.lineTo(sx, midY(sx));
    ctx.lineTo(W + 10, waterY + 40);
    ctx.closePath();
    ctx.fill();

    const slot = 260, i0 = Math.floor((off - 160) / slot), i1 = Math.floor((off + W + 160) / slot);
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 5.7 + 3.2) < 0.22) continue;
      const sx = i * slot - off + (hash(i * 8.3) - 0.5) * 80;
      if (sx < -140 || sx > W + 140) continue;
      const sy = midY(sx) + 6;
      const sc = 0.72 + hash(i * 6.1) * 0.55;
      const mushChance = z.id === 'zamrud' ? 0.68 : 0.26;
      if (hash(i * 11.3) < mushChance) {
        drawGiantMushroom(ctx, sx, sy, sc, i * 2.3, z, 0.9, t);
      } else {
        drawCrystalCluster(ctx, sx, sy, sc, i * 2.9, z, 0.9, t, false);
      }
    }

    // Sulur tanaman berpendar menggantung lembut dari kubah jauh
    const vineSlot = 170, v0 = Math.floor((off - 100) / vineSlot), v1 = Math.floor((off + W + 100) / vineSlot);
    for (let i = v0; i <= v1; i++) {
      if (hash(i * 7.3 + 4.1) < 0.35) continue;
      const sx = i * vineSlot - off + (hash(i * 2.9) - 0.5) * 60;
      if (sx < -40 || sx > W + 40) continue;
      const vLen = 55 + hash(i * 9.7) * 95;
      const sway = Math.sin(t * 1.1 + i * 1.7) * 8;
      ctx.strokeStyle = z.crystalAltGlow + '0.32)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.quadraticCurveTo(sx + sway * 0.5, vLen * 0.5, sx + sway, vLen);
      ctx.stroke();

      const tw = 0.65 + 0.35 * Math.sin(t * 2.6 + i * 2.1);
      ctx.fillStyle = z.crystalAltGlow + `${0.75 * tw})`;
      ctx.beginPath();
      ctx.arc(sx + sway, vLen, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.85 * tw})`;
      ctx.beginPath();
      ctx.arc(sx + sway, vLen, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Danau Cermin Bawah Tanah yang Berkilau
  {
    const wg = ctx.createLinearGradient(0, waterY, 0, H);
    wg.addColorStop(0, rgba(mix(z.waterRGB, z.fogRGB, 0.35), 0.92));
    wg.addColorStop(0.35, rgba(mix(z.waterRGB, z.skyTop, 0.45), 0.96));
    wg.addColorStop(1, rgba(z.skyTop));
    ctx.fillStyle = wg;
    ctx.fillRect(0, waterY, W, H - waterY);

    ctx.strokeStyle = z.crystalAltGlow + '0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    ctx.lineTo(W, waterY);
    ctx.stroke();

    const par = 0.11, off = camX * par;
    for (let k = 0; k < 14; k++) {
      const rx = (((k * 95 - off * 0.8 + Math.sin(t * 0.8 + k) * 14) % (W + 120)) + W + 120) % (W + 120) - 60;
      const ry = waterY + 8 + (k % 5) * 14;
      if (ry > H - 6) continue;
      const rw = 26 + Math.sin(t * 2.2 + k * 1.7) * 10 + (k % 3) * 14;
      const tw = 0.25 + 0.25 * Math.sin(t * 2.8 + k * 2.3);
      ctx.fillStyle = (k % 2 === 0 ? z.crystalGlow : z.crystalAltGlow) + `${tw})`;
      ctx.fillRect(rx - rw * 0.5, ry, rw, 1.8);
    }
  }

  // 7. Spora Bioluminesensi Melayang Halus di Dalam Rongga Gua
  for (let i = 0; i < 24; i++) {
    const spanX = W + 120, spanY = H + 120;
    const mx = (((hash(i * 7.1) * spanX - camX * (0.18 + hash(i * 2.1) * 0.12) + t * (10 + hash(i) * 12) * (i % 2 ? 1 : -1)) % spanX) + spanX) % spanX - 60;
    const my = (((hash(i * 3.7 + 5) * spanY + Math.sin(t * 0.9 + i) * 18 + t * 5) % spanY) + spanY) % spanY - 60;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + i * 2.1));
    const r = 1.4 + hash(i * 5.1) * 1.8;
    const colPrefix = i % 3 === 0 ? z.crystalAltGlow : z.crystalGlow;

    ctx.fillStyle = colPrefix + `${0.24 * tw})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${0.85 * tw})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================= RERUNTUHAN KUNO & JEMBATAN LENGKUNG HOLLOW EARTH =================
export function drawCaveRuins(ctx: Ctx, t: number, camX: number, gy: number) {
  const par = 0.24, off = camX * par, slot = 380;
  const i0 = Math.floor((off - 350) / slot), i1 = Math.floor((off + W + 350) / slot);
  const ruinBase = clamp(gy - 34, H * 0.54, H * 0.86);
  const zData = caveZone();
  const rock = rgba(mix(zData.nearRGB, [18, 16, 28], 0.45));
  const rockMid = rgba(mix(zData.midRGB, [36, 30, 52], 0.4));
  const rockLt = rgba(mix(zData.midRGB, zData.crystalRGB, 0.22));
  type Tower = { x: number; top: number; w: number };
  const towers: Tower[] = [];

  for (let i = i0; i <= i1; i++) {
    const r0 = hash(i * 11.7 + 1.2);
    if (r0 < 0.24) continue;
    const x = i * slot - off + (hash(i * 6.3) - 0.5) * 90;
    if (x < -120 || x > W + 120) continue;

    const s = 0.9 + hash(i * 3.1) * 0.4;
    const bh = (150 + hash(i * 4.3) * 145) * s;
    const bw = (38 + hash(i * 8.7) * 22) * s;
    const top = ruinBase - bh;

    ctx.fillStyle = rock;
    ctx.fillRect(x - bw * 0.72, ruinBase - 14 * s, bw * 1.44, 16 * s + 140);
    ctx.fillStyle = rockMid;
    ctx.fillRect(x - bw * 0.58, ruinBase - 24 * s, bw * 1.16, 10 * s);

    ctx.fillStyle = rock;
    ctx.fillRect(x - bw / 2, top, bw, ruinBase - top + 120);
    ctx.fillStyle = rockMid;
    ctx.fillRect(x - bw * 0.3, top + 12 * s, bw * 0.22, ruinBase - top - 12 * s);
    ctx.fillRect(x + bw * 0.08, top + 12 * s, bw * 0.22, ruinBase - top - 12 * s);

    ctx.fillStyle = rockLt;
    ctx.fillRect(x - bw * 0.68, top - 10 * s, bw * 1.36, 10 * s);
    ctx.fillStyle = rockMid;
    ctx.fillRect(x - bw * 0.55, top - 18 * s, bw * 1.1, 8 * s);

    const runeY = top + 28 * s;
    const fl = 0.75 + 0.25 * Math.sin(t * 2.4 + i * 1.9);
    ctx.fillStyle = zData.crystalGlow + `${0.65 * fl})`;
    ctx.fillRect(x - bw * 0.52, runeY, bw * 1.04, 3.2 * s);

    for (let c = 0; c < 2; c++) {
      const cy = top + 58 * s + c * 56 * s;
      if (cy > ruinBase - 36 * s) break;
      const cx = x + (hash(i * 5.5 + c) - 0.5) * bw * 0.35;
      const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 * s);
      gl.addColorStop(0, zData.crystalGlow + `${0.65 * fl})`);
      gl.addColorStop(1, zData.crystalGlow + '0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgba(mix(zData.crystalRGB, [255, 255, 255], 0.65), 0.95 * fl);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6 * s);
      ctx.lineTo(cx + 4 * s, cy);
      ctx.lineTo(cx, cy + 6 * s);
      ctx.lineTo(cx - 4 * s, cy);
      ctx.closePath();
      ctx.fill();
    }

    drawCrystalCluster(ctx, x - bw * 0.55, ruinBase + 2, 0.42 * s, i * 3.3, zData, 0.85, t, false);
    towers.push({ x, top, w: bw });
  }

  for (let i = 0; i + 1 < towers.length; i++) {
    const a = towers[i], b = towers[i + 1];
    const span = b.x - a.x;
    if (span > 520) continue;

    const bridgeY = Math.max(a.top, b.top) + 42;
    if (i % 2 === 0 && span > 180) {
      const archCrown = bridgeY + 46;
      ctx.strokeStyle = rgba(mix(zData.nearRGB, [22, 18, 34], 0.45));
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(a.x, archCrown);
      ctx.quadraticCurveTo((a.x + b.x) / 2, bridgeY - 8, b.x, archCrown);
      ctx.stroke();

      ctx.fillStyle = rgba(mix(zData.midRGB, [34, 28, 48], 0.45));
      ctx.fillRect(a.x, bridgeY - 4, span, 7);

      const sconces = Math.floor(span / 68);
      for (let k = 1; k < sconces; k++) {
        const sx = lerp(a.x, b.x, k / sconces);
        const fl = 0.75 + 0.25 * Math.sin(t * 2.8 + k + i);
        ctx.fillStyle = zData.crystalAltGlow + `${0.6 * fl})`;
        ctx.beginPath();
        ctx.arc(sx, bridgeY - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,250,235,${0.95 * fl})`;
        ctx.beginPath();
        ctx.arc(sx, bridgeY - 8, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const y0 = a.top + 14, y1 = b.top + 14;
    const sag = Math.max(y0, y1) + 54;
    ctx.strokeStyle = 'rgba(20,16,30,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(a.x, y0);
    ctx.quadraticCurveTo((a.x + b.x) / 2, sag, b.x, y1);
    ctx.stroke();

    const nLamps = Math.floor(span / 46);
    for (let k = 1; k < nLamps; k++) {
      const u = k / nLamps;
      const mx = lerp(a.x, b.x, u);
      const my = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * sag + u * u * y1;
      const fl = 0.72 + 0.28 * Math.sin(t * 3.2 + k * 1.5 + i);

      const lg = ctx.createRadialGradient(mx, my + 2, 0, mx, my + 2, 14);
      lg.addColorStop(0, `rgba(255,220,145,${0.75 * fl})`);
      lg.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(mx, my + 2, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,242,190,${fl})`;
      ctx.fillRect(mx - 2.4, my - 2, 4.8, 6.5);
    }
  }
}

// ================= GUNUNG & KUBAH LANGIT-LANGIT HOLLOW EARTH (SPASIAL MULUS TANPA FADE) =================
export function drawCaveCeiling(
  ctx: Ctx, x0: number, x1: number, topY: number,
  groundYat: (x: number) => number, t: number, surfRock: RGB, surfRockLight: RGB,
) {
  const segs = caveSegmentsInRange(x0 - 120, x1 + 120);
  if (!segs.length) return;

  const zData = caveZone();
  const caveRock = zData.nearRGB;
  const caveRockLight = mix(zData.midRGB, zData.crystalRGB, 0.28);
  const slopeSpan = 560;

  for (const { xStart, xEnd } of segs) {
    const xa = Math.max(xStart, x0 - 90);
    const xb = Math.min(xEnd, x1 + 90);
    if (xb <= xa) continue;

    const outerTopY = (x: number) => {
      const dIn = x - xStart;
      const dOut = xEnd - x;
      if (dIn < slopeSpan) {
        const u = clamp(dIn / slopeSpan, 0, 1);
        const y0 = groundYat(xStart) - PILLAR_H;
        const ridge = (Math.sin(x * 0.014) * 14 + Math.sin(x * 0.033 + 1.1) * 7) * Math.sin(u * Math.PI);
        return lerp(y0, topY, Math.pow(u, 0.82)) + ridge;
      }
      if (dOut < slopeSpan) {
        const u = clamp(dOut / slopeSpan, 0, 1);
        const y1 = groundYat(xEnd) - PILLAR_H;
        const ridge = (Math.sin(x * 0.014) * 14 + Math.sin(x * 0.033 + 1.1) * 7) * Math.sin(u * Math.PI);
        return lerp(y1, topY, Math.pow(u, 0.82)) + ridge;
      }
      return topY;
    };

    const xs: number[] = [xa];
    for (let x = Math.floor(xa / 28) * 28 + 28; x < xb; x += 28) xs.push(x);
    xs.push(xb);

    const yTops = xs.map((x) => outerTopY(x));
    const yBots = xs.map((x) => caveCeilY(groundYat(x), x));

    let minTop = Infinity, maxBot = -Infinity;
    for (let i = 0; i < xs.length; i++) {
      minTop = Math.min(minTop, yTops[i]);
      maxBot = Math.max(maxBot, yBots[i]);
    }

    ctx.save();
    // Massa gunung & kubah gua: bergradasi dari batu permukaan di lereng luar ke batu kristal gua di kubah dalam
    const g = ctx.createLinearGradient(0, Math.max(minTop, maxBot - 520), 0, maxBot + 40);
    g.addColorStop(0, rgba(mix(surfRock, caveRock, 0.45)));
    g.addColorStop(0.45, rgba(mix(caveRock, [4, 4, 12], 0.6)));
    g.addColorStop(1, rgba(mix(caveRock, caveRockLight, 0.45)));

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(xs[0], yTops[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], yTops[i]);
    for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], yBots[i]);
    ctx.closePath();
    ctx.fill();

    // Lapisan strata geologi & urat kristal di dalam kubah
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = zData.crystalGlow + '0.16)';
    ctx.lineWidth = 3;
    for (const offset of [28, 64]) {
      ctx.beginPath();
      ctx.moveTo(xs[0], yBots[0] - offset);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], yBots[i] - offset);
      ctx.stroke();
    }
    ctx.restore();

    // Garis punggung lereng gunung luar (menyatu dengan pegunungan bioma permukaan)
    if (xa < xStart + slopeSpan || xb > xEnd - slopeSpan) {
      ctx.strokeStyle = rgba(mix(surfRockLight, [255, 248, 240], 0.2), 0.7);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xs[0], yTops[0]);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], yTops[i]);
      ctx.stroke();
    }

    // Pendaran cahaya bioluminesensi di sepanjang lengkung langit-langit gua
    ctx.strokeStyle = zData.crystalGlow + '0.22)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(xs[0], yBots[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], yBots[i]);
    ctx.stroke();

    // Garis rim light berkilau di sepanjang bibir langit-langit
    ctx.strokeStyle = zData.crystalAltGlow + '0.58)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(xs[0], yBots[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], yBots[i]);
    ctx.stroke();

    // Geode kristal rata & untaian lumut cahaya halus (tanpa duri tajam)
    for (let sx = Math.floor(xa / 130) * 130; sx < xb; sx += 130) {
      if (sx < xStart + 180 || sx > xEnd - 180) continue;
      if (hash(sx * 0.053 + 7.1) < 0.3) continue;
      const mx = sx + hash(sx * 0.029) * 80;
      const cy = caveCeilY(groundYat(mx), mx);
      const my = cy - 8 - hash(sx * 0.041) * 20;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + sx * 0.04);

      const gl = ctx.createRadialGradient(mx, my, 0, mx, my, 24);
      gl.addColorStop(0, zData.crystalGlow + `${0.55 * tw})`);
      gl.addColorStop(1, zData.crystalGlow + '0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(mx, my, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,255,255,${0.92 * tw})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (hash(sx * 0.091) > 0.45) {
        const len = 18 + hash(sx * 0.037) * 28;
        const sway = Math.sin(t * 1.5 + sx * 0.02) * 4;
        ctx.strokeStyle = zData.crystalAltGlow + `${0.32 * tw})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx, cy);
        ctx.quadraticCurveTo(mx + sway * 0.5, cy + len * 0.5, mx + sway, cy + len);
        ctx.stroke();

        ctx.fillStyle = zData.crystalAltGlow + `${0.75 * tw})`;
        ctx.beginPath();
        ctx.arc(mx + sway, cy + len, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export function drawCaveFront(ctx: Ctx, t: number, camX: number, zoom: number, groundYat: (x: number) => number) {
  const vw = W / zoom;
  const segs = caveSegmentsInRange(camX - 60, camX + vw + 60);
  if (!segs.length) return;

  const zData = caveZone();
  ctx.save();
  if (!clipCaveCavities(ctx, camX, 0, zoom, groundYat)) {
    ctx.restore();
    return;
  }
  for (let i = 0; i < 14; i++) {
    const spanX = W + 120, spanY = H + 120;
    const mx = (((hash(i * 11.3 + 2.1) * spanX - camX * (0.28 + hash(i * 3.1) * 0.14) + t * (12 + hash(i) * 10) * (i % 2 ? 1 : -1)) % spanX) + spanX) % spanX - 60;
    const my = (((hash(i * 4.7 + 9) * spanY + Math.sin(t * 1.1 + i) * 16 + t * 4) % spanY) + spanY) % spanY - 60;
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.1 + i * 1.7));
    const r = 1.6 + hash(i * 6.1) * 2.0;
    const colPrefix = i % 2 === 0 ? zData.crystalAltGlow : zData.crystalGlow;

    ctx.fillStyle = colPrefix + `${0.22 * tw})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${0.85 * tw})`;
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ================= GERBANG MONUMENTAL HOLLOW EARTH & JALAN RUNE (BELAKANG & DEPAN NAGA) =================
export function drawCaveMouths(ctx: Ctx, x0: number, x1: number, groundYat: (x: number) => number, t: number, front = false) {
  const segs: { bx: number; isExit: boolean; idx: number }[] = [];
  const baseStart = CAVE_START + caveOrigin;
  const k0 = Math.floor((x0 - 800 - baseStart) / CAVE_EVERY), k1 = Math.floor((x1 + 800 - baseStart) / CAVE_EVERY);

  for (let k = k0; k <= k1; k++) {
    const sx = baseStart + k * CAVE_EVERY;
    if (sx + CAVE_LEN >= x0 - 400 && sx <= x1 + 400) {
      segs.push({ bx: sx, isExit: false, idx: k });
      segs.push({ bx: sx + CAVE_LEN, isExit: true, idx: k });
    }
  }

  const zData = caveZone();

  for (const { bx, isExit, idx } of segs) {
    if (bx < x0 - 650 || bx > x1 + 650) continue;
    const portalGlow = isExit ? 'rgba(255,224,140,' : zData.crystalGlow;
    const portalAlt = isExit ? 'rgba(255,180,115,' : zData.crystalAltGlow;

    const pW = 46;
    const pH = PILLAR_H;
    // Pilar luar berdiri persis di ambang xStart (masuk) dan xEnd (keluar) sehingga batas rongga gua tertutup rapi oleh pilar batu
    const offsets = isExit ? [-GATE_SPAN, 0] : [0, GATE_SPAN];
    const leftP = bx + offsets[0];
    const rightP = bx + offsets[1];
    const midX = (leftP + rightP) * 0.5;
    const gMid = groundYat(midX);
    const leftTop = groundYat(leftP) - pH;
    const rightTop = groundYat(rightP) - pH;
    const ctrlY = (leftTop + rightTop) * 0.5 - 76;
    const peakY = (leftTop + rightTop) * 0.5 - 34;

    if (!front) {
      // 1. JALAN BATU KUNO BERUKIR RUNE BERCAHAYA MENGIKUTI KONTUR LERENG
      ctx.save();
      const roadStart = midX - (isExit ? 520 : 820);
      const roadEnd = midX + (isExit ? 820 : 520);
      const paverStep = 36;

      for (let rx = roadStart; rx <= roadEnd; rx += paverStep) {
        const ry = groundYat(rx);
        const ryNext = groundYat(rx + paverStep);
        const sl = Math.atan2(ryNext - ry, paverStep);

        ctx.save();
        ctx.translate(rx + paverStep * 0.5, ry);
        ctx.rotate(sl);

        ctx.fillStyle = '#201a2c';
        ctx.fillRect(-paverStep * 0.46, -3, paverStep * 0.92, 7);
        ctx.fillStyle = '#382e4a';
        ctx.fillRect(-paverStep * 0.44, -4, paverStep * 0.88, 2.5);

        if ((Math.abs(Math.floor(rx / 72)) % 2) === 0) {
          ctx.fillStyle = portalGlow + '0.7)';
          ctx.fillRect(-7, -4.6, 14, 1.5);
        }
        ctx.restore();
      }
      ctx.restore();

      // 2. AIR TERJUN PENGAPIT GERBANG & BERKAS CAHAYA ALAMI
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftP, groundYat(leftP) + 20);
      ctx.lineTo(leftP, leftTop + 8);
      ctx.quadraticCurveTo(midX, ctrlY, rightP, rightTop + 8);
      ctx.lineTo(rightP, groundYat(rightP) + 20);
      ctx.closePath();
      ctx.clip();

      drawLuminousWaterfall(ctx, leftP + 28, leftTop + 28, groundYat(leftP + 28), 10, zData, 0.55, t, idx + 1);
      drawLuminousWaterfall(ctx, rightP - 28, rightTop + 28, groundYat(rightP - 28), 10, zData, 0.55, t, idx + 2);
      ctx.restore();

      // 2b. Spandrel Tebing Batu Mulut Gua (menyambung rapat antara kubah atap gua & busur gerbang)
      ctx.save();
      const archY = (u: number) => (1 - u) * (1 - u) * (leftTop + 8) + 2 * (1 - u) * u * ctrlY + u * u * (rightTop + 8);
      const archX = (u: number) => lerp(leftP, rightP, u);
      const steps = 16;
      ctx.fillStyle = rgba(mix(zData.nearRGB, [16, 13, 26], 0.5));
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const ax = archX(u);
        const cy = caveCeilY(groundYat(ax), ax);
        if (s === 0) ctx.moveTo(ax, cy - 4);
        else ctx.lineTo(ax, cy - 4);
      }
      for (let s = steps; s >= 0; s--) {
        const u = s / steps;
        ctx.lineTo(archX(u), archY(u) + 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2c. Berkas Sinar Cahaya Alami Menyorot ke Mulut Gua
      ctx.save();
      const rayG = ctx.createLinearGradient(midX - 120, gMid - 620, midX + 180, gMid + 40);
      rayG.addColorStop(0, portalAlt + '0.2)');
      rayG.addColorStop(0.55, portalGlow + '0.07)');
      rayG.addColorStop(1, portalGlow + '0)');
      ctx.fillStyle = rayG;
      ctx.beginPath();
      ctx.moveTo(midX - 90, gMid - 620);
      ctx.lineTo(midX + 50, gMid - 620);
      ctx.lineTo(midX + 260, gMid + 30);
      ctx.lineTo(midX - 50, gMid + 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Pilar belakang (sebelum naga lewat — menutup sambungan vertikal antara gua & dunia luar)
      for (const off of offsets) {
        const px = bx + off;
        const py = groundYat(px);
        const top = py - pH;
        const fl = 0.8 + 0.2 * Math.sin(t * 2.6 + off * 0.05 + idx);

        ctx.save();
        ctx.fillStyle = 'rgba(10,6,20,0.5)';
        ctx.beginPath();
        ctx.ellipse(px, py + 3, pW * 1.35, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#181324';
        ctx.fillRect(px - pW * 0.72, py - 18, pW * 1.44, 24);
        ctx.fillRect(px - pW / 2, top, pW, pH + 8);

        ctx.fillStyle = '#282038';
        ctx.fillRect(px - pW * 0.36, top + 16, pW * 0.72, pH - 34);
        ctx.fillStyle = portalGlow + `${0.75 * fl})`;
        ctx.fillRect(px - 2.2, top + 28, 4.4, pH - 60);

        ctx.fillStyle = '#342a48';
        ctx.fillRect(px - pW * 0.74, top - 12, pW * 1.48, 12);
        ctx.fillRect(px - pW * 0.56, top - 22, pW * 1.12, 10);
        drawCrystalCluster(ctx, px, top - 22, 0.55, off + idx, zData, 0.95, t, false);
        ctx.restore();
      }
      continue;
    }

    // LAPISAN DEPAN (DIGAMBAR DI ATAS NAGA SEHINGGA NAGA MENEMBUS KOLONG GERBANG)
    for (const off of offsets) {
      const px = bx + off;
      const py = groundYat(px);
      const top = py - pH;
      const fl = 0.8 + 0.2 * Math.sin(t * 2.6 + off * 0.05 + idx);

      ctx.save();
      const ly = top + 72;
      const lx = px + (off > 0 ? 22 : -22);
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
      lg.addColorStop(0, `rgba(255,220,140,${0.7 * fl})`);
      lg.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,244,195,${0.96 * fl})`;
      ctx.fillRect(lx - 5.5, ly - 8, 11, 16);
      ctx.fillStyle = '#241a12';
      ctx.fillRect(lx - 7.5, ly - 11, 15, 3);
      ctx.fillRect(lx - 7.5, ly + 8, 15, 3);

      ctx.strokeStyle = '#241a12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, top + 48);
      ctx.lineTo(lx, ly - 10);
      ctx.stroke();
      ctx.restore();
    }

    // LINTEL LENGKUNG BATU GANDA & PERMATA KRISTAL DI PUNCAK BUSUR
    ctx.save();
    ctx.strokeStyle = '#1f182e';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(leftP - 10, leftTop + 8);
    ctx.quadraticCurveTo(midX, ctrlY, rightP + 10, rightTop + 8);
    ctx.stroke();

    ctx.strokeStyle = '#322848';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(leftP - 4, leftTop + 4);
    ctx.quadraticCurveTo(midX, ctrlY - 6, rightP + 4, rightTop + 4);
    ctx.stroke();

    ctx.strokeStyle = portalGlow + '0.65)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(leftP + 12, leftTop - 3);
    ctx.quadraticCurveTo(midX, ctrlY - 14, rightP - 12, rightTop - 3);
    ctx.stroke();

    const flMid = 0.8 + 0.2 * Math.sin(t * 3.1 + idx);
    const cg = ctx.createRadialGradient(midX, peakY - 14, 0, midX, peakY - 14, 36);
    cg.addColorStop(0, portalAlt + `${0.85 * flMid})`);
    cg.addColorStop(0.5, portalGlow + `${0.35 * flMid})`);
    cg.addColorStop(1, portalGlow + '0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(midX, peakY - 14, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = portalGlow + `${0.95 * flMid})`;
    ctx.beginPath();
    ctx.moveTo(midX, peakY - 30);
    ctx.lineTo(midX + 11, peakY - 14);
    ctx.lineTo(midX, peakY + 2);
    ctx.lineTo(midX - 11, peakY - 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(midX, peakY - 14, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ================= SURGA (Spasial Murni di Langit Tinggi) =================
export function drawHeavenBackdrop(ctx: Ctx, t: number, horizonY: number) {
  if (horizonY < -80) return;
  const hy = Math.min(horizonY, H + 60);

  const sx = W * 0.5, sy = hy - H * 0.35, pulse = 1 + Math.sin(t * 0.8) * 0.02;
  if (sy > -220) {
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 340 * pulse);
    halo.addColorStop(0, 'rgba(255,252,240,0.9)');
    halo.addColorStop(0.3, 'rgba(255,240,205,0.5)');
    halo.addColorStop(0.7, 'rgba(255,210,180,0.18)');
    halo.addColorStop(1, 'rgba(255,210,180,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sx, sy, 340 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.arc(sx, sy, 65 * pulse, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < 7; i++) {
    const span = W + 500;
    const x = (((hash(i * 13.7) * span + t * (10 + hash(i * 3.3) * 14)) % span) + span) % span - 250;
    const y = hy - H * 0.08 - hash(i * 7.9) * Math.max(120, hy * 0.75);
    if (y < -160) continue;
    const r = 60 + hash(i * 5.1) * 100;
    ctx.fillStyle = 'rgba(255,235,245,0.32)';
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function heavenIsland(ctx: Ctx, x: number, y: number, s: number, t: number, sd: number) {
  const yy = y + Math.sin(t * 0.45 + sd * 2.2) * 6 * s;
  const w = 125 * s;

  ctx.fillStyle = 'rgba(255,246,220,0.45)';
  ctx.beginPath(); ctx.arc(x, yy - 60 * s, 160 * s, 0, Math.PI * 2); ctx.fill();

  for (let k = 0; k < 4; k++) {
    const cx = x - w * 0.8 + k * w * 0.5 + (hash(sd * 7 + k) - 0.5) * 25 * s;
    const cy = yy + 78 * s + hash(sd + k * 3) * 30 * s;
    const cr = (34 + hash(sd * 3 + k * 5) * 26) * s;
    ctx.fillStyle = 'rgba(255,244,250,0.65)';
    ctx.beginPath(); ctx.ellipse(cx, cy, cr * 1.5, cr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }

  const rg = ctx.createLinearGradient(0, yy, 0, yy + 130 * s);
  rg.addColorStop(0, '#9d94cc');
  rg.addColorStop(0.45, '#7a72ab');
  rg.addColorStop(1, '#57507f');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(x - w, yy);
  ctx.quadraticCurveTo(x - w * 0.72, yy + 62 * s, x - w * 0.16, yy + 108 * s);
  ctx.quadraticCurveTo(x, yy + 128 * s, x + w * 0.14, yy + 104 * s);
  ctx.quadraticCurveTo(x + w * 0.68, yy + 58 * s, x + w, yy);
  ctx.closePath(); ctx.fill();

  heavenTemple(ctx, x + (hash(sd * 3.3) - 0.5) * w * 0.3, yy, s);
}

function heavenTemple(ctx: Ctx, x: number, y: number, s: number) {
  const marble = '#f6f1ff', marbleDk = '#d9d0f0', gold = '#ffd98a';
  ctx.fillStyle = marbleDk;
  ctx.fillRect(x - 52 * s, y - 8 * s, 104 * s, 8 * s);
  ctx.fillStyle = marble;
  ctx.fillRect(x - 46 * s, y - 11 * s, 92 * s, 6 * s);

  const towers = [
    { o: -34, w: 15, h: 66, sp: 30 },
    { o: 34, w: 15, h: 66, sp: 30 },
    { o: 0, w: 20, h: 96, sp: 44 },
  ];
  for (const tw of towers) {
    const tx = x + tw.o * s, hh = tw.h * s, ww = tw.w * s, yb = y - 11 * s;
    ctx.fillStyle = marble;
    ctx.fillRect(tx - ww / 2, yb - hh, ww, hh);
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(tx - ww * 0.55, yb - hh);
    ctx.lineTo(tx, yb - hh - tw.sp * s);
    ctx.lineTo(tx + ww * 0.55, yb - hh);
    ctx.closePath(); ctx.fill();
  }
}

export function drawHeavenPalaces(ctx: Ctx, t: number, camX: number, horizonY: number) {
  if (horizonY < -120) return;
  const layers = [
    { par: 0.05, slot: 760, s: 0.52, off0: 320, a: 0.7 },
    { par: 0.12, slot: 980, s: 0.95, off0: 180, a: 1 },
  ];
  layers.forEach((L, li) => {
    const off = camX * L.par;
    const i0 = Math.floor((off - 600) / L.slot), i1 = Math.floor((off + W + 600) / L.slot);
    for (let i = i0; i <= i1; i++) {
      if (hash(i * 7.7 + li * 13.1) < 0.3) continue;
      const x = i * L.slot - off + (hash(i * 3.9 + li) - 0.5) * 160;
      if (x < -420 || x > W + 420) continue;
      const y = horizonY - L.off0 - hash(i * 5.5 + li * 2.7) * 260 + Math.sin(t * 0.4 + i + li * 3) * 8;
      if (y < -320) continue;
      const fadeIn = smooth(clamp((y + 320) / 160, 0, 1));
      ctx.save();
      ctx.globalAlpha = L.a * fadeIn;
      heavenIsland(ctx, x, y, L.s * (0.9 + hash(i * 9.1) * 0.25), t, i * 1.31 + li * 7.7);
      ctx.restore();
    }
  });
}

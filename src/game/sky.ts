import type { RGB } from './biomes';
import { W, H, DRAGON_SX, clamp, lerp, mix, rgba, hash, ridgeShape, type Pal } from './scenery';
import { balloonSilhouette } from './ambient';

type Ctx = CanvasRenderingContext2D;
const lum = (c: RGB) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

// ================= BINTANG, METEOR & BULAN =================
// bintang penuh saat malam, berkelip di langit senja, nyaris hilang di siang yang terang
export function starVisibility(pal: Pal) {
  return Math.max(pal.star, clamp((0.74 - lum(pal.skyTop)) * 1.7, 0, 0.85));
}

export function drawStars(ctx: Ctx, stars: { x: number; y: number; s: number; p: number }[], vis: number, t: number, camX: number, vo: number) {
  if (vis < 0.02) return;
  for (const st of stars) {
    const y = st.y + vo * 0.02;
    // memudar ke arah cakrawala yang terang (kecuali malam)
    const fade = vis > 0.95 ? 1 : clamp(1 - y / (H * 0.62), 0, 1);
    const tw = 0.55 + 0.45 * Math.sin(t * (1.1 + (st.p % 1.4)) + st.p * 3);
    const a = vis * fade * tw;
    if (a < 0.03) continue;
    const x = (((st.x - camX * 0.004) % W) + W) % W;
    if (st.s > 1.5) {
      // bintang terang: pendar + kilau silang
      ctx.fillStyle = `rgba(255,250,236,${a * 0.2})`;
      ctx.beginPath(); ctx.arc(x, y, st.s * 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,253,245,${a})`;
      ctx.beginPath(); ctx.arc(x, y, st.s * 0.7, 0, Math.PI * 2); ctx.fill();
      const L = st.s * 3 * tw;
      ctx.strokeStyle = `rgba(255,250,236,${a * 0.55})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(255,252,242,${a * 0.9})`;
      ctx.fillRect(x - st.s / 2, y - st.s / 2, st.s, st.s);
    }
  }
}

// meteor (bintang berekor) yang sesekali melintas di langit senja/malam
export function drawMeteors(ctx: Ctx, t: number, vis: number) {
  if (vis < 0.25) return;
  const period = 5.5, k = Math.floor(t / period), lt = t - k * period;
  if (lt > 1.1 || hash(k * 5.13) > 0.7) return;
  const x0 = W * (0.15 + hash(k * 3.17) * 0.7), y0 = 18 + hash(k * 7.41) * H * 0.22;
  const ang = 2.55 + (hash(k * 1.9) - 0.5) * 0.4;
  const p = lt / 1.1;
  const hx = x0 + Math.cos(ang) * 280 * p, hy = y0 + Math.sin(ang) * 280 * p;
  const tx = hx - Math.cos(ang) * 130, ty = hy - Math.sin(ang) * 130;
  const a = vis * Math.sin(p * Math.PI);
  const g = ctx.createLinearGradient(hx, hy, tx, ty);
  g.addColorStop(0, `rgba(255,252,240,${a})`);
  g.addColorStop(1, 'rgba(255,252,240,0)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = `rgba(255,255,250,${a})`;
  ctx.beginPath(); ctx.arc(hx, hy, 1.7, 0, Math.PI * 2); ctx.fill();
}

// bulan sabit bercahaya (bentuk dipotong dengan aturan evenodd agar menyatu dengan gradasi langit)
export function drawCrescent(ctx: Ctx, x: number, y: number, r: number, a: number) {
  if (a < 0.02) return;
  const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4.5);
  g.addColorStop(0, `rgba(255,244,228,${0.24 * a})`);
  g.addColorStop(1, 'rgba(255,244,228,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x + r * 0.2 + r, y - r * 0.52);
  ctx.arc(x + r * 0.2, y - r * 0.52, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,248,236,${a})`;
  ctx.fill('evenodd');
  ctx.restore();
}

// ================= MATAHARI =================
export function drawSun(ctx: Ctx, pal: Pal, sx: number, sy: number, t: number, a: number) {
  if (a < 0.02) return;
  const R = pal.sunR * 1.3;
  const warm = mix(pal.sun, pal.fog, 0.4);
  // cahaya atmosfer yang luas
  const g0 = ctx.createRadialGradient(sx, sy, R * 0.6, sx, sy, 640);
  g0.addColorStop(0, rgba(mix(pal.sun, [255, 255, 255], 0.25), 0.55 * a));
  g0.addColorStop(0.22, rgba(warm, 0.3 * a));
  g0.addColorStop(0.6, rgba(warm, 0.08 * a));
  g0.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = g0;
  ctx.fillRect(0, 0, W, H);
  // pita cahaya mendatar di sepanjang cakrawala
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(3.4, 1);
  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 150);
  g1.addColorStop(0, rgba(warm, 0.3 * a));
  g1.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = g1;
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // sinar dewa yang berputar pelan
  drawRays(ctx, sx, sy, R, t, a, mix(pal.sun, [255, 255, 255], 0.2));
  // halo dalam
  const g2 = ctx.createRadialGradient(sx, sy, R * 0.85, sx, sy, R * 3.6);
  g2.addColorStop(0, rgba(pal.sun, 0.62 * a));
  g2.addColorStop(0.4, rgba(pal.sun, 0.2 * a));
  g2.addColorStop(1, rgba(pal.sun, 0));
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(sx, sy, R * 3.6, 0, Math.PI * 2); ctx.fill();
  // cakram bertepi lembut, inti putih panas
  ctx.fillStyle = rgba(pal.sun, 0.35 * a);
  ctx.beginPath(); ctx.arc(sx, sy, R * 1.08, 0, Math.PI * 2); ctx.fill();
  const g3 = ctx.createRadialGradient(sx - R * 0.18, sy - R * 0.18, 0, sx, sy, R);
  g3.addColorStop(0, `rgba(255,255,250,${a})`);
  g3.addColorStop(0.65, rgba(mix(pal.sun, [255, 255, 255], 0.5), a));
  g3.addColorStop(1, rgba(pal.sun, a));
  ctx.fillStyle = g3;
  ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fill();
}

function drawRays(ctx: Ctx, sx: number, sy: number, R: number, t: number, a: number, col: RGB) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const n = 18;
  for (let i = 0; i < n; i++) {
    const h = hash(i * 7.31 + 2);
    const ang = (i / n) * Math.PI * 2 + t * 0.02 + h * 0.25;
    const wd = 0.025 + h * 0.055;
    const L = 360 + 300 * hash(i * 3.7 + 1);
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.45 + i * 1.9);
    const g = ctx.createRadialGradient(sx, sy, R * 0.8, sx, sy, L);
    g.addColorStop(0, rgba(col, 0.13 * a * pulse));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang - wd) * L, sy + Math.sin(ang - wd) * L);
    ctx.lineTo(sx + Math.cos(ang + wd) * L, sy + Math.sin(ang + wd) * L);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// cahaya matahari yang terhambur di kabut → siluet jauh dekat matahari tampak memudar keemasan (ala Alto)
export function drawSunHaze(ctx: Ctx, pal: Pal, sx: number, sy: number, a: number, k: number) {
  if (a < 0.02) return;
  const warm = mix(pal.sun, pal.fog, 0.35);
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 440);
  g.addColorStop(0, rgba(warm, k * a));
  g.addColorStop(0.4, rgba(warm, k * 0.42 * a));
  g.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// pantulan lensa lembut di sepanjang garis matahari → tengah layar
export function drawFlare(ctx: Ctx, sx: number, sy: number, a: number, col: RGB) {
  if (a < 0.05 || sx < -100 || sx > W + 100 || sy < -100 || sy > H + 60) return;
  const vx = W / 2 - sx, vy = H / 2 - sy;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ghosts: [number, number, number][] = [[0.45, 10, 0.07], [0.85, 26, 0.045], [1.25, 16, 0.06], [1.6, 44, 0.03]];
  for (const [k, r, al] of ghosts) {
    const x = sx + vx * k, y = sy + vy * k;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, al * a));
    g.addColorStop(0.7, rgba(col, al * 0.6 * a));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ================= BALON UDARA DI KEJAUHAN =================
export function drawBgBalloons(ctx: Ctx, pal: Pal, t: number, camX: number, vo: number, list: { x: number; y: number; s: number; v: number; ph: number }[]) {
  const span = W + 300;
  list.forEach((b, i) => {
    const x = (((b.x + t * b.v - camX * (0.02 + i * 0.012)) % span) + span) % span - 150;
    const y = b.y + vo * 0.05 + Math.sin(t * 0.25 + b.ph) * 10;
    const col = mix(mix(pal.far, [40, 26, 44], 0.3 + i * 0.1), pal.fog, 0.22 - i * 0.05);
    balloonSilhouette(ctx, x, y, 9 * b.s, rgba(col));
  });
}

// ================= PEMANDANGAN BERLAPIS (kuil melayang, pagoda, reruntuhan, dll.) =================
export interface LandPlane { par: number; base: number; amp: number; seed: number; tiltK: number; col: RGB; fogAmt: number; slot: number; density: number; scale: number; layer: number; floatOnly?: boolean }
type Kind = 'kuil' | 'pagoda' | 'torii' | 'reruntuhan' | 'stupa' | 'menara';
const KINDS: Kind[][] = [
  ['kuil', 'torii', 'pagoda', 'kuil'], // Lembah Sakura
  ['reruntuhan', 'reruntuhan', 'kuil'], // Gurun Emas
  ['reruntuhan', 'kuil', 'pagoda'], // Ngarai Senja
  ['kuil', 'pagoda', 'torii'], // Hutan Bambu
  ['stupa', 'kuil', 'pagoda'], // Puncak Salju
  ['menara', 'kuil', 'torii'], // Malam Lentera
];

// ketinggian punggung gunung pada lapisan paralaks (sama persis dengan drawLayer)
export function ridgeY(pal: Pal, camX: number, tilt: number, x: number, par: number, base: number, amp: number, seed: number, tiltK: number) {
  const wx = x + camX * par;
  const r = lerp(ridgeShape(pal.ridgeA, wx, seed), ridgeShape(pal.ridgeB, wx, seed), pal.rt);
  return base + (x - W * DRAGON_SX) * tilt * tiltK - r * amp;
}

export function drawLandmarks(ctx: Ctx, pal: Pal, camX: number, tilt: number, t: number, P: LandPlane, biomeAt: (x: number) => number) {
  const off = camX * P.par;
  const i0 = Math.floor((off - 300) / P.slot), i1 = Math.floor((off + W + 300) / P.slot);
  const fill = ctx.createLinearGradient(0, P.base - P.amp - 240, 0, P.base + 140);
  fill.addColorStop(0, rgba(P.col));
  fill.addColorStop(1, rgba(mix(P.col, pal.fog, P.fogAmt + 0.12)));
  const mist = rgba(mix(pal.fog, [255, 255, 255], 0.35), 0.5);
  const glow = pal.star;
  for (let i = i0; i <= i1; i++) {
    const sd = i * 0.618 + P.layer * 7.3 + 0.37;
    if (hash(sd * 13.1) > P.density) continue;
    const lx = i * P.slot + hash(sd * 5.3) * P.slot * 0.55;
    const x = lx - off;
    if (x < -280 || x > W + 280) continue;
    // jenis ditentukan bioma di titik dunia yang bersesuaian → stabil saat bergulir
    const list = KINDS[biomeAt((lx - W * 0.5) / P.par + W * 0.3) % KINDS.length];
    const kind: Kind = P.floatOnly ? 'kuil' : list[Math.floor(hash(sd * 9.7) * list.length) % list.length];
    const s = P.scale * (0.8 + hash(sd * 3.9) * 0.45);
    const gy = ridgeY(pal, camX, tilt, x, P.par, P.base, P.amp, P.seed, P.tiltK);
    ctx.fillStyle = fill;
    ctx.strokeStyle = fill;
    switch (kind) {
      case 'kuil': {
        const fy = Math.max(80 + 30 * s, gy - (P.amp * 0.3 + 40 + hash(sd * 2.1) * 90) * s);
        floatingTemple(ctx, x, fy, s, t, sd, mist, glow);
        break;
      }
      case 'pagoda': pagoda(ctx, x, gy + 6, s * 1.1, 4 + Math.floor(hash(sd * 1.3) * 2), glow, t); break;
      case 'torii': giantTorii(ctx, x, gy + 8, s); break;
      case 'reruntuhan': ruins(ctx, x, gy + 8, s, sd); break;
      case 'stupa': stupa(ctx, x, gy + 6, s * 1.1); break;
      case 'menara': lanternTower(ctx, x, gy + 6, s, t, glow); break;
    }
  }
}

function roof(ctx: Ctx, x: number, yb: number, rw: number, rh: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x - rw - 5 * s, yb - rh * 0.6);
  ctx.quadraticCurveTo(x - rw * 0.78, yb + 1.4 * s, x - rw * 0.5, yb);
  ctx.lineTo(x + rw * 0.5, yb);
  ctx.quadraticCurveTo(x + rw * 0.78, yb + 1.4 * s, x + rw + 5 * s, yb - rh * 0.6);
  ctx.lineTo(x + rw * 0.32, yb - rh);
  ctx.lineTo(x - rw * 0.32, yb - rh);
  ctx.closePath();
  ctx.fill();
}

function windowsGlow(ctx: Ctx, pts: [number, number][], s: number, glow: number, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  pts.forEach(([x, y], i) => {
    const fl = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9 * s);
    g.addColorStop(0, `rgba(255,190,110,${0.5 * glow * fl})`);
    g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,214,150,${0.85 * glow * fl})`;
    ctx.fillRect(x - 1.6 * s, y - 1.6 * s, 3.2 * s, 3.2 * s);
  });
  ctx.restore();
}

function pagoda(ctx: Ctx, x: number, y: number, s: number, tiers: number, glow: number, t: number) {
  let w = 22 * s, yy = y;
  ctx.fillRect(x - w * 1.25, yy - 5 * s, w * 2.5, 5 * s + 30);
  yy -= 5 * s;
  const wins: [number, number][] = [];
  for (let k = 0; k < tiers; k++) {
    const bh = (10 - k * 0.9) * s;
    ctx.fillRect(x - w * 0.6, yy - bh, w * 1.2, bh);
    wins.push([x, yy - bh * 0.5]);
    yy -= bh;
    roof(ctx, x, yy + 1.5 * s, w * 1.18, 6 * s, s);
    yy -= 5 * s;
    w *= 0.84;
  }
  ctx.fillRect(x - 0.9 * s, yy - 18 * s, 1.8 * s, 18 * s);
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x, yy - 3 * s - k * 3.6 * s, (1.9 - k * 0.25) * s, 0, Math.PI * 2); ctx.fill(); }
  if (glow > 0.35) windowsGlow(ctx, wins, s, glow, t);
}

function templeHall(ctx: Ctx, x: number, y: number, s: number, glow: number, t: number) {
  ctx.fillRect(x - 30 * s, y - 5 * s, 60 * s, 5 * s);
  ctx.fillRect(x - 24 * s, y - 16 * s, 48 * s, 11 * s);
  roof(ctx, x, y - 15 * s, 30 * s, 9 * s, s);
  ctx.fillRect(x - 14 * s, y - 30 * s, 28 * s, 7 * s);
  roof(ctx, x, y - 29 * s, 19 * s, 8 * s, s);
  ctx.fillRect(x - 0.8 * s, y - 44 * s, 1.6 * s, 8 * s);
  if (glow > 0.35) windowsGlow(ctx, [[x - 12 * s, y - 10 * s], [x, y - 10 * s], [x + 12 * s, y - 10 * s], [x, y - 26 * s]], s, glow, t);
}

function treeSil(ctx: Ctx, x: number, y: number, s: number, kind: number) {
  if (kind === 0) {
    for (let k = 0; k < 3; k++) {
      const w = (9 - k * 2.4) * s, yy = y - (4 + k * 6.5) * s;
      ctx.beginPath(); ctx.moveTo(x - w, yy + 3 * s); ctx.lineTo(x, yy - 8 * s); ctx.lineTo(x + w, yy + 3 * s); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(x - 0.8 * s, y - 4 * s, 1.6 * s, 4 * s);
  } else {
    ctx.fillRect(x - 0.9 * s, y - 9 * s, 1.8 * s, 9 * s);
    ctx.beginPath();
    ctx.moveTo(x + 7 * s, y - 13 * s); ctx.arc(x, y - 13 * s, 7 * s, 0, Math.PI * 2);
    ctx.moveTo(x, y - 10 * s); ctx.arc(x - 5 * s, y - 10 * s, 5 * s, 0, Math.PI * 2);
    ctx.moveTo(x + 10.5 * s, y - 10.5 * s); ctx.arc(x + 5.5 * s, y - 10.5 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

// pulau melayang dengan kuil, pepohonan, akar menjuntai, batu-batu kecil & air terjun
function floatingTemple(ctx: Ctx, x: number, y: number, s: number, t: number, sd: number, mist: string, glow: number) {
  y += Math.sin(t * 0.45 + sd * 6) * 5 * s;
  const w = 58 * s;
  if (hash(sd * 41) > 0.4) {
    const fx = x + w * (0.35 + hash(sd * 2) * 0.4) * (hash(sd * 3) > 0.5 ? 1 : -1);
    const g = ctx.createLinearGradient(0, y, 0, y + 170 * s);
    g.addColorStop(0, mist);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    const keep = ctx.fillStyle;
    ctx.fillStyle = g;
    ctx.fillRect(fx - 2.2 * s, y + 4 * s, 4.4 * s, 170 * s);
    ctx.fillStyle = keep;
  }
  // batuan bawah (kerucut terbalik bergerigi)
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  const n = 10;
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const depth = Math.pow(Math.sin(u * Math.PI), 0.85) * 86 * s * (0.7 + 0.55 * hash(sd * 31 + k));
    ctx.lineTo(x - w + 2 * w * u + (hash(sd * 17 + k) - 0.5) * 9 * s, y + 5 * s + depth);
  }
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w * 1.05, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
  // akar menjuntai
  ctx.lineWidth = 1.1 * s;
  for (let k = 0; k < 6; k++) {
    const vx = x - w * 0.75 + k * w * 0.3 + hash(sd + k * 3.3) * 7 * s;
    const L = (16 + hash(sd * 3 + k) * 34) * s;
    ctx.beginPath();
    ctx.moveTo(vx, y + 6 * s);
    ctx.quadraticCurveTo(vx + 3 * s, y + L * 0.6, vx + Math.sin(t * 0.7 + k + sd) * 2.5 * s, y + L + 12 * s);
    ctx.stroke();
  }
  // batu-batu kecil melayang
  for (let k = 0; k < 3; k++) {
    const rx = x + (k - 1) * w * 1.05 + (hash(sd * 5 + k) - 0.5) * 24 * s;
    const ry = y + (36 + k * 20) * s + Math.sin(t * 0.6 + k * 2 + sd) * 4 * s;
    const rr = (4 + hash(sd * 9 + k) * 6) * s;
    ctx.beginPath(); ctx.moveTo(rx - rr, ry); ctx.lineTo(rx + rr, ry); ctx.lineTo(rx + rr * 0.15, ry + rr * 1.7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(rx, ry, rr, rr * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  // kuil di atas pulau
  const tx = x + (hash(sd * 7) - 0.5) * w * 0.4;
  if (hash(sd * 13) < 0.55) pagoda(ctx, tx, y - s, s * 0.85, 3 + Math.floor(hash(sd * 19) * 2), glow, t);
  else templeHall(ctx, tx, y - s, s, glow, t);
  treeSil(ctx, x - w * 0.7, y + s, s * 0.85, hash(sd * 23) > 0.5 ? 1 : 0);
  treeSil(ctx, x + w * 0.66, y + s, s * 0.75, hash(sd * 29) > 0.5 ? 1 : 0);
}

// reruntuhan kota kuno: menara patah & akueduk berlengkung (lengkungnya tembus pandang)
function ruins(ctx: Ctx, x: number, y: number, s: number, sd: number) {
  const n = 4 + Math.floor(hash(sd * 1.7) * 3);
  const span = n * 24 * s;
  if (hash(sd * 11) > 0.35) {
    const ax = x - span * 0.55, aw = span * 1.1, ah = 30 * s, ay = y - ah;
    const cnt = Math.max(3, Math.floor(aw / (13 * s)));
    ctx.beginPath();
    ctx.rect(ax, ay, aw, ah + 40);
    for (let a = 0; a < cnt; a++) {
      const cx = ax + (a + 0.5) * (aw / cnt), hwd = (aw / cnt) * 0.32;
      ctx.moveTo(cx - hwd, ay + ah + 40);
      ctx.lineTo(cx - hwd, ay + ah * 0.45);
      ctx.arc(cx, ay + ah * 0.45, hwd, Math.PI, 0, false);
      ctx.lineTo(cx + hwd, ay + ah + 40);
      ctx.closePath();
    }
    ctx.fill('evenodd');
  }
  for (let k = 0; k < n; k++) {
    const bx = x - span / 2 + (k + 0.5) * (span / n) + (hash(sd * 3 + k) - 0.5) * 10 * s;
    const bw = (11 + hash(sd * 5 + k) * 15) * s;
    const bh = (46 + hash(sd * 7 + k) * 120) * s;
    const cut = (hash(sd * 13 + k) - 0.5) * bw * 1.3;
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2, y + 40);
    ctx.lineTo(bx - bw / 2, y - bh + Math.max(0, cut));
    if (hash(sd * 17 + k) > 0.6) { ctx.lineTo(bx - bw * 0.1, y - bh - 6 * s); ctx.lineTo(bx + bw * 0.15, y - bh + 3 * s); }
    ctx.lineTo(bx + bw / 2, y - bh + Math.max(0, -cut));
    ctx.lineTo(bx + bw / 2, y + 40);
    ctx.closePath();
    ctx.fill();
  }
}

function giantTorii(ctx: Ctx, x: number, y: number, s: number) {
  const h = 104 * s, span = 64 * s, pw = 6 * s;
  ctx.fillRect(x - span / 2 - pw / 2, y - h, pw, h + 30);
  ctx.fillRect(x + span / 2 - pw / 2, y - h, pw, h + 30);
  ctx.fillRect(x - span / 2 - 12 * s, y - h + 15 * s, span + 24 * s, 5 * s);
  ctx.fillRect(x - 2.5 * s, y - h, 5 * s, 15 * s);
  ctx.beginPath();
  ctx.moveTo(x - span / 2 - 24 * s, y - h - 9 * s);
  ctx.quadraticCurveTo(x, y - h + s, x + span / 2 + 24 * s, y - h - 9 * s);
  ctx.lineTo(x + span / 2 + 20 * s, y - h + s);
  ctx.quadraticCurveTo(x, y - h + 8 * s, x - span / 2 - 20 * s, y - h + s);
  ctx.closePath();
  ctx.fill();
}

function stupa(ctx: Ctx, x: number, y: number, s: number) {
  ctx.fillRect(x - 32 * s, y - 7 * s, 64 * s, 7 * s + 30);
  ctx.fillRect(x - 25 * s, y - 13 * s, 50 * s, 6 * s);
  ctx.beginPath(); ctx.arc(x, y - 13 * s, 21 * s, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 7 * s, y - 41 * s, 14 * s, 8 * s);
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 41 * s); ctx.lineTo(x, y - 74 * s); ctx.lineTo(x + 6 * s, y - 41 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 76 * s, 2.2 * s, 0, Math.PI * 2); ctx.fill();
  // bendera doa
  ctx.lineWidth = 0.8 * s;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y - 62 * s);
    ctx.quadraticCurveTo(x + side * 34 * s, y - 34 * s, x + side * 62 * s, y - 4 * s);
    ctx.stroke();
    for (let k = 1; k < 7; k++) {
      const u = k / 7;
      const fx = x + side * 62 * s * u, fy = y - 62 * s + 58 * s * u - Math.sin(u * Math.PI) * 14 * s;
      ctx.fillRect(fx - 1.6 * s, fy, 3.2 * s, 4.2 * s);
    }
  }
}

function lanternTower(ctx: Ctx, x: number, y: number, s: number, t: number, glow: number) {
  const wins: [number, number][] = [];
  let w = 14 * s, yy = y - 6 * s;
  ctx.fillRect(x - w, yy, w * 2, 36 + 6 * s);
  for (let k = 0; k < 5; k++) {
    const h = 18 * s;
    ctx.fillRect(x - w * 0.7, yy - h, w * 1.4, h);
    wins.push([x, yy - h * 0.5]);
    yy -= h;
    roof(ctx, x, yy + s, w * 1.05, 5 * s, s * 0.8);
    yy -= 4 * s;
    w *= 0.9;
  }
  ctx.fillRect(x - s, yy - 14 * s, 2 * s, 14 * s);
  windowsGlow(ctx, wins, s, Math.max(0.5, glow), t);
}

import { BIOMES } from './biomes';
import { DEFAULT_PARTS, hexA, rgbOf, sanitizeParts, shade, type Parts } from './dragon';
import { riderById } from './rider';

// ---------------- WARNA / MATERIAL NAGA ----------------
export type TrailType = 'glitter' | 'cloud' | 'petal' | 'leaf' | 'frost' | 'ember' | 'prism' | 'stardust' | 'aurora' | 'pearl';
export type FxType = 'iri' | 'galaxy' | 'aurora' | 'pearl' | 'celestial';
export interface Skin {
  id: string; name: string; title: string; desc: string;
  body: string; dark: string; fin: string; belly: string; mane: string; horn: string;
  eye: string; pupil: string; whisker: string; scale: string; trail: TrailType; glow: string; shimmer?: boolean;
  grad?: string[]; finGrad?: string[]; wingGrad?: string[]; hornGrad?: string[]; maneGrad?: string[];
  fx?: FxType; premium?: boolean;
}

export const SKINS: Skin[] = [
  {
    id: 'emas', name: 'Naga Emas', title: '金龍 · Jīn Lóng',
    desc: 'Naga legendaris pembawa keberuntungan. Sisiknya berkilau seperti cahaya matahari pagi.',
    body: '#f2c14e', dark: '#b07418', fin: '#fff3cc', belly: 'rgba(255,244,210,0.95)', mane: '#fffaf0', horn: '#fff3cc',
    eye: '#fffdf2', pupil: '#4a2a00', whisker: 'rgba(255,240,190,0.95)', scale: 'rgba(140,80,0,0.32)',
    trail: 'glitter', glow: '255,214,120', shimmer: true,
  },
  {
    id: 'surgawi', name: 'Emas Surgawi', title: '天金龍 · Celestial', premium: true, fx: 'celestial', shimmer: true,
    desc: 'Emas bercahaya bertabur aksen kosmik — sang penguasa langit.',
    body: '#f7cf5a', dark: '#9a5e12', fin: '#fff6d6', belly: 'rgba(255,248,220,0.95)', mane: '#fffaf0', horn: '#fff1c0',
    eye: '#fffdf2', pupil: '#2a2060', whisker: 'rgba(255,242,200,0.95)', scale: 'rgba(120,70,0,0.3)', trail: 'glitter', glow: '255,214,120',
    grad: ['#fff3c4', '#f7cf5a', '#e0a030', '#b8761e', '#6a4a8a'], finGrad: ['#fffbe8', '#ffe9a8', '#ffd27a'], wingGrad: ['#fff6d0', '#f7cf5a', '#d9932a', '#3b2a7a'],
    hornGrad: ['#ffffff', '#ffe9a8', '#c9a0ff'],
  },
  {
    id: 'iridescent', name: 'Naga Iridescent', title: '彩龍 · Cǎi Lóng', premium: true, fx: 'iri',
    desc: 'Sisik pelangi yang berubah warna mengikuti arah terbang dan cahaya.',
    body: '#d8d2f0', dark: '#8a82c0', fin: '#f4ecff', belly: 'rgba(250,246,255,0.92)', mane: '#ffffff', horn: '#f2eaff',
    eye: '#ffffff', pupil: '#4b3a8a', whisker: 'rgba(240,232,255,0.95)', scale: 'rgba(90,70,160,0.28)', trail: 'prism', glow: '200,170,255',
    grad: ['#e4dcff', '#c6d6ff', '#b8e6f0', '#d6c6f4', '#9a8ed0'], finGrad: ['#ffe0f4', '#d8f4ff', '#e6ffe8', '#fff0d0'],
    wingGrad: ['#ffd6f0', '#c8e4ff', '#d4ffe8', '#fff2cc'], maneGrad: ['#ffd6f0', '#d0ecff', '#e0ffe8'],
  },
  {
    id: 'galaksi', name: 'Naga Galaksi', title: '星龍 · Xīng Lóng', premium: true, fx: 'galaxy',
    desc: 'Tubuhnya adalah langit malam — nebula berputar dan bintang berkelip di setiap sisik.',
    body: '#2a2060', dark: '#0c0a24', fin: '#c9a8ff', belly: 'rgba(190,170,255,0.75)', mane: '#e6d8ff', horn: '#d8c8ff',
    eye: '#ffffff', pupil: '#1a1040', whisker: 'rgba(210,190,255,0.9)', scale: 'rgba(160,140,255,0.25)', trail: 'stardust', glow: '170,140,255',
    grad: ['#3b2a7a', '#2a1f5c', '#1b2a6b', '#2b1550', '#0c0a24'], finGrad: ['#e0c8ff', '#a88cff', '#7a9cff'],
    wingGrad: ['#1a1446', '#3a2378', '#6a3fa0', '#ff8ad0'], hornGrad: ['#ffffff', '#c9a8ff', '#6a8cff'],
  },
  {
    id: 'aurora', name: 'Naga Aurora', title: '極光龍 · Aurora', premium: true, fx: 'aurora',
    desc: 'Menari bersama cahaya utara: hijau, sian, biru, ungu, dan merah muda yang lembut.',
    body: '#6fe8c8', dark: '#4a4fb8', fin: '#eafff8', belly: 'rgba(235,255,250,0.9)', mane: '#f0fffa', horn: '#e8fff6',
    eye: '#ffffff', pupil: '#14405a', whisker: 'rgba(220,255,245,0.95)', scale: 'rgba(20,60,90,0.22)', trail: 'aurora', glow: '120,255,210',
    grad: ['#7dffc4', '#5fe0ff', '#6f8cff', '#b57bff', '#ff9ad5'], finGrad: ['#d8fff0', '#d0f4ff', '#e4dcff', '#ffe0f2'],
    wingGrad: ['#7dffc4', '#5fe0ff', '#b57bff', '#ff9ad5'], maneGrad: ['#ffffff', '#c8fff0', '#ffd8f0'],
  },
  {
    id: 'mutiara', name: 'Mutiara Awan', title: '真珠龍 · Cloud Pearl', premium: true, fx: 'pearl',
    desc: 'Putih mutiara selembut awan, memantulkan semburat pastel saat bergerak.',
    body: '#fbf9ff', dark: '#d6d0e8', fin: '#ffe4f2', belly: 'rgba(255,255,255,0.95)', mane: '#ffffff', horn: '#fff6fb',
    eye: '#ffffff', pupil: '#6a5a8a', whisker: 'rgba(255,240,250,0.95)', scale: 'rgba(160,150,200,0.25)', trail: 'pearl', glow: '255,226,244',
    grad: ['#ffffff', '#f6f2ff', '#eef6ff', '#e6e0f4'], finGrad: ['#ffe8f4', '#e8f4ff', '#eaffef'], wingGrad: ['#ffffff', '#ffeaf6', '#e6f2ff'],
  },
  {
    id: 'awan', name: 'Naga Awan', title: '雲龍 · Yún Lóng',
    desc: 'Lahir dari gumpalan awan. Lembut, tenang, dan meninggalkan jejak kabut putih.',
    body: '#f4f7fc', dark: '#a9b8d6', fin: '#a6e6da', belly: 'rgba(206,242,236,0.95)', mane: '#94dccf', horn: '#e4f7f3',
    eye: '#effffb', pupil: '#2c7a72', whisker: 'rgba(170,232,220,0.95)', scale: 'rgba(120,140,190,0.3)', trail: 'cloud', glow: '210,236,255',
  },
  {
    id: 'sakura', name: 'Naga Sakura', title: '桜龍 · Sakura',
    desc: 'Menari bersama musim semi, menaburkan kelopak bunga di setiap liukannya.',
    body: '#f6a9c3', dark: '#c4628a', fin: '#fff1f6', belly: 'rgba(255,234,243,0.95)', mane: '#ffffff', horn: '#fff1f6',
    eye: '#fff8fb', pupil: '#6a1f40', whisker: 'rgba(255,236,246,0.95)', scale: 'rgba(160,60,100,0.28)', trail: 'petal', glow: '255,182,212',
  },
  {
    id: 'giok', name: 'Naga Giok', title: '玉龍 · Yù Lóng',
    desc: 'Penjaga hutan bambu yang bijak. Jejaknya berupa daun yang menari.',
    body: '#46b18f', dark: '#1e6a5a', fin: '#ecf7cf', belly: 'rgba(216,244,202,0.92)', mane: '#f4fbe0', horn: '#ecf7cf',
    eye: '#fdfff2', pupil: '#0f2a22', whisker: 'rgba(233,245,201,0.95)', scale: 'rgba(8,56,42,0.32)', trail: 'leaf', glow: '130,255,196',
  },
  {
    id: 'samudra', name: 'Naga Samudra', title: '蒼龍 · Cāng Lóng',
    desc: 'Lahir dari ombak dan salju abadi. Meninggalkan kristal es yang berkilau.',
    body: '#4b8fe0', dark: '#1f4596', fin: '#c8ecff', belly: 'rgba(220,244,255,0.92)', mane: '#eefaff', horn: '#c8ecff',
    eye: '#f2fbff', pupil: '#0b1a3a', whisker: 'rgba(214,242,255,0.95)', scale: 'rgba(8,26,84,0.32)', trail: 'frost', glow: '140,204,255',
  },
  {
    id: 'merah', name: 'Naga Merah', title: '紅龍 · Hóng Lóng',
    desc: 'Sang pengelana klasik yang berani, berpercik bara keemasan.',
    body: '#e2483a', dark: '#9c2234', fin: '#ffcf6e', belly: 'rgba(255,214,130,0.9)', mane: '#ffcf6e', horn: '#ffcf6e',
    eye: '#fff6dc', pupil: '#2a0f18', whisker: 'rgba(255,214,130,0.95)', scale: 'rgba(80,6,18,0.32)', trail: 'ember', glow: '255,140,100',
  },
];

export const DEFAULT_CUSTOM = ['#ff9ad5', '#7a5cff', '#2a1f5c'];
export function customSkin(c: string[]): Skin {
  const [a, b, d] = [c[0] ?? DEFAULT_CUSTOM[0], c[1] ?? DEFAULT_CUSTOM[1], c[2] ?? DEFAULT_CUSTOM[2]];
  return {
    id: 'kustom', name: 'Gradien Kustom', title: '自 · Racikanmu', desc: 'Gradien tiga warna racikanmu sendiri.',
    body: a, dark: shade(d, -0.3), fin: shade(b, 0.55), belly: hexA(shade(a, 0.6), 0.92), mane: shade(b, 0.7), horn: shade(a, 0.65),
    eye: '#fffdf6', pupil: shade(d, -0.6), whisker: hexA(shade(b, 0.6), 0.95), scale: 'rgba(0,0,0,0.22)', trail: 'prism',
    glow: rgbOf(b).join(','), grad: [a, b, d], finGrad: [shade(a, 0.5), shade(b, 0.45), shade(d, 0.4)], wingGrad: [a, b, d],
  };
}

// ---------------- RANK ----------------
const RANKS: [number, string][] = [
  [1, 'Telur Naga'], [3, 'Naga Kecil'], [5, 'Penjelajah Angin'], [8, 'Penari Awan'],
  [12, 'Penjaga Lembah'], [16, 'Penguasa Badai'], [20, 'Naga Abadi'], [25, 'Legenda Langit'],
];
export function rankTitle(level: number) {
  let t = RANKS[0][1];
  for (const [l, n] of RANKS) if (level >= l) t = n;
  return t;
}

// ---------------- MISI ----------------
export type GoalType =
  | 'dist' | 'rings' | 'combo' | 'score' | 'perfect' | 'skim' | 'biome' | 'gate' | 'star' | 'alt'
  | 'loop' | 'spiral' | 'chain' | 'near' | 'speed' | 'bird' | 'nohit' | 'sky' | 'dive' | 'bank' | 'multi';
export interface Goal { type: GoalType; target: number; text: string }
export interface RunStats {
  distance: number; rings: number; perfects: number; bestCombo: number; score: number;
  skimTime: number; biomeReached: number; maxSpeed: number; gates: number; stars: number; maxAlt: number; biome: string;
  loops: number; spirals: number; dives: number; nears: number; birds: number; bestChain: number; bestBank: number;
  noHit: number; skyTime: number; multiLoop: number; speedX: number; tricks: number;
}
type Stats = Omit<RunStats, 'biome'>;

export function goalValue(g: Goal, s: Stats) {
  switch (g.type) {
    case 'dist': return s.distance;
    case 'rings': return s.rings;
    case 'combo': return s.bestCombo;
    case 'score': return s.score;
    case 'perfect': return s.perfects;
    case 'skim': return Math.floor(s.skimTime);
    case 'biome': return s.biomeReached;
    case 'gate': return s.gates;
    case 'star': return s.stars;
    case 'alt': return s.maxAlt;
    case 'loop': return s.loops;
    case 'spiral': return s.spirals;
    case 'chain': return s.bestChain;
    case 'near': return s.nears;
    case 'speed': return s.speedX;
    case 'bird': return s.birds;
    case 'nohit': return s.noHit;
    case 'sky': return s.skyTime;
    case 'dive': return s.dives;
    case 'bank': return s.bestBank;
    case 'multi': return s.multiLoop;
  }
}

export function goalProgress(g: Goal, s: Stats | null | undefined) {
  if (!s || g.type === 'biome') return '';
  return `${Math.min(goalValue(g, s), g.target)}/${g.target}`;
}

function makeGoal(type: GoalType, target: number): Goal {
  const text: Record<GoalType, string> = {
    dist: `Terbang sejauh ${target} meter`,
    rings: `Kumpulkan ${target} cincin emas`,
    combo: `Lewati ${target} cincin berturut-turut`,
    score: `Raih skor ${target}`,
    perfect: `Lewati ${target} cincin tepat di tengahnya`,
    skim: `Terbang rendah dekat tanah selama ${target} detik`,
    biome: `Terbang sampai ke ${BIOMES[target % BIOMES.length].name}`,
    gate: `Terbang menembus ${target} gerbang`,
    star: `Tangkap ${target} bintang jatuh`,
    alt: `Terbang setinggi ${target} meter ke langit`,
    loop: `Lakukan ${target} Putaran ↻ (klik kanan / E)`,
    spiral: `Lakukan ${target} Pusaran Naga ∿ (scroll / Q)`,
    chain: `Capai pengganda aliran ×${target}`,
    near: `Nyaris menyerempet batu ${target} kali`,
    speed: target > 5 ? `Melesat hingga kecepatan ×${target} (tangkap bintang ✦)` : `Melesat hingga kecepatan ×${target}`,
    bird: `Terbang bersama ${target} kawanan burung`,
    nohit: `Terbang ${target} m tanpa menabrak`,
    sky: `Melayang di atas awan selama ${target} detik`,
    dive: `Tukikan Elang ${target}× — menukik tajam lalu terbang rendah`,
    bank: `Simpan ${target} poin dalam satu aliran`,
    multi: `Lakukan ${target} putaran beruntun (tahan klik kanan / E)`,
  };
  return { type, target, text: text[type] };
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function goalsForLevel(L: number): Goal[] {
  // level awal dirancang bertahap: dasar → trik → aliran → keahlian
  const fixed: Record<number, Goal[]> = {
    1: [makeGoal('dist', 300), makeGoal('rings', 5), makeGoal('gate', 1)],
    2: [makeGoal('loop', 1), makeGoal('speed', 3), makeGoal('rings', 10)],
    3: [makeGoal('spiral', 1), makeGoal('chain', 3), makeGoal('alt', 60)],
    4: [makeGoal('near', 2), makeGoal('bird', 1), makeGoal('star', 1)],
    5: [makeGoal('multi', 2), makeGoal('dive', 1), makeGoal('sky', 10)],
    6: [makeGoal('bank', 600), makeGoal('nohit', 800), makeGoal('speed', 5)],
  };
  if (fixed[L]) return fixed[L];
  const r = rng(L * 9973 + 17);
  const f = L - 1;
  // selalu 1 misi trik/keahlian + 2 misi beragam lainnya
  const skill: GoalType[] = ['loop', 'spiral', 'chain', 'near', 'dive', 'bank', 'multi', 'speed'];
  const other: GoalType[] = ['dist', 'rings', 'combo', 'score', 'perfect', 'skim', 'gate', 'biome', 'star', 'alt', 'bird', 'nohit', 'sky'];
  const pool: GoalType[] = [...skill, ...other, ...other];
  const picked: GoalType[] = [skill[Math.floor(r() * skill.length)]];
  while (picked.length < 3) {
    const t = pool[Math.floor(r() * pool.length)];
    if (!picked.includes(t)) picked.push(t);
  }
  return picked.map((t) => {
    switch (t) {
      case 'dist': return makeGoal(t, Math.round((400 + f * 170) / 50) * 50);
      case 'rings': return makeGoal(t, Math.min(120, 6 + f * 3));
      case 'combo': return makeGoal(t, Math.min(30, 3 + Math.floor(f * 0.6)));
      case 'score': return makeGoal(t, Math.round((700 + f * 420) / 100) * 100);
      case 'perfect': return makeGoal(t, Math.min(40, 1 + Math.floor(f * 0.6)));
      case 'skim': return makeGoal(t, Math.min(60, 2 + Math.floor(f * 0.8)));
      case 'gate': return makeGoal(t, Math.min(40, 2 + Math.floor(f * 0.9)));
      case 'star': return makeGoal(t, Math.min(6, 1 + Math.floor(f / 4)));
      case 'alt': return makeGoal(t, Math.min(250, Math.round((60 + f * 12) / 10) * 10));
      case 'loop': return makeGoal(t, Math.min(30, 2 + Math.floor(f * 0.6)));
      case 'spiral': return makeGoal(t, Math.min(30, 2 + Math.floor(f * 0.5)));
      case 'chain': return makeGoal(t, Math.min(10, 3 + Math.floor(f / 3)));
      case 'near': return makeGoal(t, Math.min(20, 2 + Math.floor(f / 2)));
      case 'speed': return makeGoal(t, Math.min(10, 3 + Math.floor(f / 5)));
      case 'bird': return makeGoal(t, Math.min(10, 1 + Math.floor(f / 4)));
      case 'nohit': return makeGoal(t, Math.min(5000, Math.round((600 + f * 120) / 100) * 100));
      case 'sky': return makeGoal(t, Math.min(120, 10 + f * 3));
      case 'dive': return makeGoal(t, Math.min(10, 1 + Math.floor(f / 4)));
      case 'bank': return makeGoal(t, Math.round((500 + f * 250) / 100) * 100);
      case 'multi': return makeGoal(t, Math.min(5, 2 + Math.floor(f / 6)));
      default: return makeGoal('biome', Math.min(1 + Math.floor(f / 5), 3)); // tema kini ±2200 m: 1–3 perpindahan per misi
    }
  });
}

// ---------------- PAPAN PERINGKAT ----------------
export interface Entry { name: string; score: number; distance: number; rings: number; skin: string; date: number; me?: boolean }

export const RIVALS: Entry[] = [
  { name: 'Shen Long', score: 14800, distance: 9120, rings: 310, skin: 'surgawi', date: 0 },
  { name: 'Yuki', score: 10400, distance: 6840, rings: 236, skin: 'aurora', date: 0 },
  { name: 'Arjuna', score: 7600, distance: 5210, rings: 172, skin: 'galaksi', date: 0 },
  { name: 'Mei Lin', score: 5300, distance: 3950, rings: 121, skin: 'sakura', date: 0 },
  { name: 'Tenzin', score: 3700, distance: 2780, rings: 88, skin: 'mutiara', date: 0 },
  { name: 'Sora', score: 2600, distance: 2010, rings: 61, skin: 'iridescent', date: 0 },
  { name: 'Bayu', score: 1750, distance: 1420, rings: 40, skin: 'awan', date: 0 },
  { name: 'Ryūjin', score: 1100, distance: 940, rings: 26, skin: 'merah', date: 0 },
  { name: 'Hana', score: 620, distance: 540, rings: 14, skin: 'sakura', date: 0 },
  { name: 'Kaze', score: 280, distance: 250, rings: 6, skin: 'giok', date: 0 },
];

// ---------------- SIMPANAN ----------------
export type ControlMode = 'ultra' | 'angle' | 'classic';
export type HollowTheme = 'safir' | 'ametis' | 'zamrud' | 'emas';
export interface Save {
  name: string; level: number; done: boolean[]; skin: string;
  parts: Parts; rider: string; shine: number; custom: string[];
  goalVer?: number; seenTricks?: boolean;
  steer?: number; // kepekaan kemudi naga (0.5 = lembut, 1 = normal, 1.5 = sangat responsif)
  control?: ControlMode; // 'ultra' = kepala mengejar kursor (termudah) · 'angle' = kendali sudut kepala langsung · 'classic' = fisika momentum
  hollowTheme?: HollowTheme; // tema warna tetap Hollow Earth
  dragonScale?: number; // 1.5 = Megah (badan 1.5×, kepala & tanduk 1.4×), 1.0 = Normal
  musicVol: number; sfxVol: number;
  best: number; bestDistance: number; bestCombo: number;
  runs: number; totalDistance: number; totalRings: number;
  board: Entry[];
}

const KEY = 'into-the-clouds-save';
export const GOAL_VER = 4;
const OLD_KEY = 'naga-angin-save-v2';

export function defaultSave(): Save {
  return {
    name: 'Pengembara', level: 1, done: [false, false, false], skin: 'emas',
    parts: { ...DEFAULT_PARTS }, rider: 'kaze', shine: 0.6, custom: [...DEFAULT_CUSTOM], goalVer: GOAL_VER, control: 'ultra',
    hollowTheme: 'safir',
    dragonScale: 1.5,
    musicVol: 0.8, sfxVol: 0.9, best: 0, bestDistance: 0, bestCombo: 0,
    runs: 0, totalDistance: 0, totalRings: 0, board: [],
  };
}

const validSkin = (id: string) => id === 'kustom' || SKINS.some((k) => k.id === id);

export function loadSave(): Save {
  const def = defaultSave();
  try {
    let raw = localStorage.getItem(KEY);
    let migrated = false;
    if (!raw) { raw = localStorage.getItem(OLD_KEY); migrated = !!raw; }
    if (!raw) return def;
    const s: Save = { ...def, ...JSON.parse(raw) };
    if (!validSkin(s.skin)) s.skin = 'emas';
    s.board = (s.board || []).map((e) => (validSkin(e.skin) ? e : { ...e, skin: 'emas' }));
    s.parts = sanitizeParts(s.parts);
    s.rider = riderById(s.rider).id;
    s.shine = typeof s.shine === 'number' ? Math.min(1, Math.max(0, s.shine)) : 0.6;
    if (!Array.isArray(s.custom) || s.custom.length !== 3) s.custom = [...DEFAULT_CUSTOM];
    if (s.control !== 'classic' && s.control !== 'ultra' && s.control !== 'angle') s.control = 'ultra';
    if (s.hollowTheme !== 'safir' && s.hollowTheme !== 'ametis' && s.hollowTheme !== 'zamrud' && s.hollowTheme !== 'emas') s.hollowTheme = 'safir';
    if (migrated) s.done = [false, false, false];
    // daftar misi diperbarui → progres misi level saat ini diulang agar tidak salah tanda
    if (s.goalVer !== GOAL_VER) { s.done = [false, false, false]; s.goalVer = GOAL_VER; }
    return s;
  } catch {
    return def;
  }
}

export function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* abaikan */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* abaikan */ }
}

export function fullBoard(s: Save): Entry[] {
  return [...RIVALS, ...s.board].sort((a, b) => b.score - a.score);
}

export function skinById(id: string) {
  return SKINS.find((k) => k.id === id) || SKINS[0];
}
export function resolveSkin(s: Pick<Save, 'skin' | 'custom'>) {
  return s.skin === 'kustom' ? customSkin(s.custom) : skinById(s.skin);
}

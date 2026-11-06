export type RGB = [number, number, number];
export type RidgeType = 'peak' | 'dune' | 'mesa' | 'spike';
export type DecoType = 'sakura' | 'cactus' | 'shrub' | 'bamboo' | 'pine' | 'lantern' | 'glowMushroom' | 'crystalCluster' | 'caveFern';
export type WeatherType = 'petal' | 'sand' | 'ember' | 'firefly' | 'snow' | 'night';
// Rintangan & struktur interaktif: cadas, kristal, pulau, bambu, hantu, gerbang, serta wallride (ngarai), vine (kuil), bridge (jembatan gantung)
export type ObstacleType = 'spire' | 'stalac' | 'arch' | 'torii' | 'float' | 'bamboo' | 'wisp' | 'tunnel' | 'wallride' | 'vine' | 'bridge';

export interface Biome {
  name: string;
  sub: string;
  skyTop: RGB; skyBot: RGB; sun: RGB; fog: RGB;
  far: RGB; mid: RGB; near: RGB;
  groundTop: RGB; ground: RGB; rim: RGB;
  rock: RGB; rockLight: RGB; decoCol: RGB; ring: RGB;
  star: number; aurora: number;
  sunX: number; sunY: number; sunR: number; sunA: number; moonA: number;
  ridge: RidgeType; deco: DecoType; weather: WeatherType;
  slopeMin: number; slopeMax: number; bumpAmp: number; bumpFreq: number; cliff: number;
  obstacles: ObstacleType[];
}

export const BIOMES: Biome[] = [
  {
    name: 'Lembah Sakura', sub: 'FAJAR · 夜明け',
    skyTop: [238, 160, 176], skyBot: [255, 224, 204], sun: [255, 246, 228], fog: [255, 214, 206],
    far: [236, 178, 184], mid: [214, 142, 160], near: [176, 102, 132],
    groundTop: [255, 238, 236], ground: [222, 168, 182], rim: [255, 255, 255],
    rock: [128, 70, 100], rockLight: [168, 102, 128], decoCol: [240, 128, 160], ring: [255, 232, 160],
    star: 0, aurora: 0,
    sunX: 0.72, sunY: 0.5, sunR: 46, sunA: 1, moonA: 0,
    ridge: 'peak', deco: 'sakura', weather: 'petal',
    slopeMin: 0.14, slopeMax: 0.38, bumpAmp: 12, bumpFreq: 0.004, cliff: 0.05,
    obstacles: ['torii', 'spire', 'tunnel', 'float', 'wisp', 'torii'],
  },
  {
    name: 'Gurun Emas', sub: 'SIANG · 砂漠',
    skyTop: [104, 168, 212], skyBot: [252, 228, 192], sun: [255, 252, 236], fog: [252, 226, 190],
    far: [234, 198, 160], mid: [222, 166, 120], near: [200, 130, 90],
    groundTop: [252, 220, 168], ground: [224, 168, 110], rim: [255, 244, 214],
    rock: [176, 98, 66], rockLight: [214, 136, 94], decoCol: [96, 140, 92], ring: [255, 236, 150],
    star: 0, aurora: 0,
    sunX: 0.6, sunY: 0.2, sunR: 38, sunA: 1, moonA: 0,
    ridge: 'dune', deco: 'cactus', weather: 'sand',
    slopeMin: 0.06, slopeMax: 0.26, bumpAmp: 36, bumpFreq: 0.0055, cliff: 0.03,
    obstacles: ['arch', 'stalac', 'float', 'wisp', 'arch'],
  },
  {
    name: 'Ngarai Senja', sub: 'SENJA · 峡谷',
    skyTop: [88, 56, 128], skyBot: [255, 150, 96], sun: [255, 220, 150], fog: [255, 160, 116],
    far: [216, 112, 104], mid: [170, 70, 82], near: [120, 44, 66],
    groundTop: [240, 146, 104], ground: [162, 72, 66], rim: [255, 206, 160],
    rock: [100, 36, 54], rockLight: [150, 62, 70], decoCol: [96, 48, 56], ring: [255, 226, 150],
    star: 0.12, aurora: 0,
    sunX: 0.78, sunY: 0.56, sunR: 56, sunA: 1, moonA: 0,
    ridge: 'mesa', deco: 'shrub', weather: 'ember',
    slopeMin: 0.1, slopeMax: 0.32, bumpAmp: 10, bumpFreq: 0.005, cliff: 0.16,
    obstacles: ['arch', 'stalac', 'wisp', 'spire', 'arch'],
  },
  {
    name: 'Hutan Bambu', sub: 'KABUT · 竹林',
    skyTop: [132, 186, 178], skyBot: [230, 242, 226], sun: [255, 255, 236], fog: [222, 238, 222],
    far: [172, 206, 192], mid: [122, 170, 150], near: [74, 128, 108],
    groundTop: [218, 236, 210], ground: [118, 160, 128], rim: [250, 255, 244],
    rock: [52, 92, 82], rockLight: [80, 124, 108], decoCol: [70, 132, 92], ring: [255, 230, 150],
    star: 0, aurora: 0,
    sunX: 0.3, sunY: 0.24, sunR: 34, sunA: 0.7, moonA: 0,
    ridge: 'peak', deco: 'bamboo', weather: 'firefly',
    slopeMin: 0.18, slopeMax: 0.44, bumpAmp: 14, bumpFreq: 0.0045, cliff: 0.06,
    obstacles: ['bamboo', 'torii', 'float', 'tunnel', 'bamboo', 'wisp'],
  },
  {
    name: 'Puncak Salju', sub: 'SENJAKALA · 雪山',
    skyTop: [38, 56, 108], skyBot: [176, 192, 228], sun: [255, 236, 220], fog: [190, 204, 236],
    far: [142, 160, 206], mid: [100, 120, 172], near: [64, 82, 130],
    groundTop: [248, 250, 255], ground: [176, 190, 226], rim: [255, 255, 255],
    rock: [42, 54, 96], rockLight: [78, 94, 140], decoCol: [34, 58, 76], ring: [255, 222, 140],
    star: 0.55, aurora: 0.7,
    sunX: 0.82, sunY: 0.68, sunR: 40, sunA: 0.6, moonA: 0,
    ridge: 'spike', deco: 'pine', weather: 'snow',
    slopeMin: 0.26, slopeMax: 0.56, bumpAmp: 10, bumpFreq: 0.004, cliff: 0.14,
    obstacles: ['spire', 'arch', 'stalac', 'wisp', 'float'],
  },
  {
    name: 'Malam Lentera', sub: 'MALAM · 灯籠',
    skyTop: [8, 12, 38], skyBot: [44, 54, 106], sun: [236, 240, 255], fog: [62, 72, 126],
    far: [44, 54, 98], mid: [30, 38, 78], near: [20, 26, 58],
    groundTop: [84, 96, 150], ground: [26, 32, 66], rim: [170, 186, 240],
    rock: [12, 14, 34], rockLight: [30, 36, 72], decoCol: [16, 22, 46], ring: [255, 210, 120],
    star: 1, aurora: 0.35,
    sunX: 0.24, sunY: 0.22, sunR: 28, sunA: 0, moonA: 1,
    ridge: 'peak', deco: 'lantern', weather: 'night',
    slopeMin: 0.14, slopeMax: 0.36, bumpAmp: 12, bumpFreq: 0.004, cliff: 0.07,
    obstacles: ['torii', 'tunnel', 'spire', 'float', 'wisp'],
  },
];

// Satu tema bertahan ±2200 m (dulu ±760 m) dengan transisi ±420 m yang bertahap,
// supaya pergantian tempat & waktu (fajar→siang→senja→malam) terasa masuk akal, tidak tiap sebentar ganti.
export const BIOME_LEN = 22000;
export const BIOME_TRANS = 4200;

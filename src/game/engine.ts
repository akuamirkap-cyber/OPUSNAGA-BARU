import { ZenAudio } from './audio';
import { BIOMES, BIOME_LEN, BIOME_TRANS, type DecoType, type ObstacleType, type RGB } from './biomes';
import { SKINS, goalValue, type Skin, type Goal, type RunStats, type HollowTheme } from './progress';
import { dragonGeo, paintDragon, seatFrame, twistGeo, BODY_N, DEFAULT_PARTS, type Parts, type DragonGeo, type Vec } from './dragon';
import { Rider, RIDERS, collidePoint, solveDist, type RiderStyle, type PhysWorld, type PP } from './rider';
import {
  makeFlock, updateFlock, drawFlock, farBird, type Flock, type BirdType,
  paintCloud, type CloudCols,
  makeBalloon, drawBalloon, balloonBob, type Balloon,
} from './ambient';
import { starVisibility, drawStars, drawMeteors, drawCrescent, drawSun, drawSunHaze, drawFlare, drawLandmarks, drawBgBalloons, type LandPlane } from './sky';
import { caveInfo, caveCeilY, heavenAmt, applyRealmTints, drawCaveBackdrop, drawCaveRuins, drawCaveCeiling, drawCaveFront, drawCaveMouths, drawHeavenBackdrop, drawHeavenPalaces, caveGroundOffset, caveZone, setCaveOrigin, setHollowTheme, caveSegmentsInRange, clipCaveCavities, hollowGroundColors } from './realms';
import {
  W, H, SP, DRAGON_SX, LOOK, KX, KY, NORMAL_SPD, MAX_HOLD, STAR_MAX, CLOUD_LAYERS,
  clamp, lerp, rand, smooth, mix, rgba, hash, blend, hitPoly, polyDist, heart,
  drawTorii, drawArch, drawDeco, drawObstacle, drawRing, drawParticle, drawAurora, fogBand, drawLayer, starShape,
  type Pal, type Gate, type Obstacle, type Ring, type Particle, type FText,
} from './scenery';

export { W, H } from './scenery';
export type GameStats = RunStats;
export interface GameCallbacks { onGameOver: (s: RunStats) => void; onGoal?: (i: number) => void }
interface Toast { text: string; t: number }
interface Puff { x: number; y: number; r: number; state: number; t: number }
interface Thermal { x: number; w: number; top: number }
interface Flow { n: number; mult: number; pts: number; t: number; pulse: number; zen: boolean; names: { s: string; t: number }[] }
interface HP { x: number; y: number; r: number } // titik lintasan kepala + sudut guling tubuh

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  audio = new ZenAudio();
  cb: GameCallbacks;
  mode: 'menu' | 'playing' | 'dead' = 'menu';
  scale = 1; dpr = 1; raf = 0; last = 0; time = 0;
  ro: ResizeObserver | null = null;

  // ---- input ----
  // posisi mutiara cahaya (mouse/jari) di layar 0..1 — naga mengejarnya ke segala arah
  targetFrac = 0.45; targetX = 0.72; keyDir = 0; keyDirX = 0; pearlX = 0; pearlY = 0;
  holding = false; wasHolding = false; throttle = 0; holdT = 0;

  // ---- medan ----
  tY: number[] = [];
  gBase = 0; gSlope = 0.2; gTarget = 0.2; gEase = 0.02; gRemain = 0; gPh = 0;
  biomeOrigin = -2000;

  // ---- naga & penunggang ----
  dx = 300; dy = 0; ang = 0.2; spd = 300; angVel = 0;
  hist: HP[] = []; body: Vec[] = []; bodyRoll: number[] = [];
  // arah hadap: saat naga berbalik arah, tubuhnya berguling 180° (merambat dari kepala ke ekor) agar punggung tetap di atas
  roll = 0; facing = 1; faceT = 0; turnDir = 0; maxDx = 0; deadRoll: number[] | null = null;
  skin: Skin = SKINS[0];
  look: Parts = { ...DEFAULT_PARTS };
  shine = 0.6;
  rider = new Rider(RIDERS[0]);
  geo: DragonGeo | null = null;
  wingPhase = 0; wingAmp = 0.4; wingFold = 0; wingKick = 0;
  chain: PP[] | null = null;
  trailT = 0;

  // ---- kamera ----
  camX = 0; camY = 0; camOff = 0; tilt = 0.25; zoom = 1; camRel = 0; sxF = DRAGON_SX; assistOff = 0; altS = 0;
  zoneL = 0.3; zoneR = 0.3; maxCamX = -1e9;

  // ---- dunia ----
  obstacles: Obstacle[] = []; gates: Gate[] = []; rings: Ring[] = [];
  parts: Particle[] = []; texts: FText[] = [];
  puffs: Puff[] = []; thermals: Thermal[] = []; flocks: Flock[] = [];
  nextSpawn = 0; startX = 0; patternCount = 0; menuGateX = 0; flockT = 2;
  stars: { x: number; y: number; s: number; p: number }[] = [];
  clouds: { x: number; y: number; w: number; h: number }[] = [];
  bgBirds = Array.from({ length: 3 }, (_, i) => ({ x: 160 + i * 340, y: 80 + i * 46, n: 3 + i, v: 10 + i * 6 }));

  // ---- skor & status ----
  ringScore = 0; ringCount = 0; combo = 0; bestCombo = 0; perfects = 0;
  gatesPassed = 0; gateStreak = 0; skimTotal = 0; maxSpeed = 0; maxAlt = 0; biomeReached = 0; birdsMet = 0;
  boost = 0; skimT = 0; skimShown = false;
  lives = 3; invuln = 0;
  // panduan formasi (visual saja): garis emas ke sisa cincin formasi — tidak mengubah arah naga
  nextForm = 1; railForm = 0; railT = 0; railW = 0; railTX = 0; railTY = 0;
  // balon udara besar (bisa dipantuli) & salto otomatis penunggang
  balloons: Balloon[] = []; balloonT = 3; bounceStreak = 0; bounceT = 0; balloonsHit = 0;
  bgBalloons = Array.from({ length: 3 }, (_, i) => ({ x: 140 + i * 330, y: 110 + i * 36, s: 0.75 + i * 0.3, v: 5 + i * 3, ph: i * 2.1 }));
  flipCd = 0; weaveE = 0; riderFlips = 0;
  deadT = 0; shake = 0; slowmo = 1; reported = false; playT = 0; frozen: RunStats | null = null;
  curBiome = -1; banner = { name: '', sub: '', t: 0 };
  // dunia vertikal: gua bawah tanah (segmen-X) & surga (ketinggian) — 0..1 yang dihaluskan
  caveS = 0; heavenS = 0; caveIdxAnn = -1; heavenAnn = false; curCaveZone = -1;
  goals: Goal[] = []; goalDone: boolean[] = []; toasts: Toast[] = [];
  paused = false; tutorial = true; skyBanner = false; demoT = 5; thudCd = 0;
  notice: { text: string; t: number } | null = null;

  // ---- awan, arus naik & bintang jatuh ----
  inCloud = 0; cloudSkim = 0; cloudSkimShown = false; pierced = false; cloudFlag = [false, false]; liftE = 0; burstCd = 0;
  star: { x: number; y: number; t: number; retry?: boolean } | null = null;
  starTimer = 10; starsCaught = 0;
  // Melesat Bintang (maks 10×)
  superT = 0; superDur = 4.2; superE = 0; superV0 = 0; starV = 0; maxPop = false; starGrace = 0;

  // ---- freestyle & aliran ----
  rolling = false; rollT = 0; rollDur = 1.2; rollStart = 0; rollDir = -1;
  loopSrc: 'star' | 'player' = 'star'; loopCount = 0; trickHeld = false; trickBoost = 0;
  spiralT = -1; spiralDur = 1.05; twistArr: number[] | null = null;
  flow: Flow = { n: 0, mult: 1, pts: 0, t: 0, pulse: 0, zen: false, names: [] };
  bankPop: { pts: number; mult: number; t: number; lost?: boolean } | null = null;
  loops = 0; spirals = 0; dives = 0; nears = 0; bestChain = 1; bestBank = 0; multiBest = 0;
  skyTime = 0; noHitBest = 0; hitX = 0; diveT = 0; diveWin = 0;

  get vw() { return W / this.zoom; }
  get vh() { return H / this.zoom; }
  get zen() { return this.flow.n > 0 && this.flow.mult >= 5; }
  // batas pembersihan objek di belakang: objek yang sudah dilewati tetap ada sejenak saat naga berbalik arah
  get cutX() { return Math.min(this.camX - 300, this.maxCamX - 2200); }
  loopFwd = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cb = cb;
    // langit penuh bintang (sebagian bintang terang berkilau)
    for (let i = 0; i < 230; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H * 0.66, s: Math.random() < 0.12 ? 1.6 + Math.random() * 0.9 : 0.35 + Math.random() * 1.05, p: Math.random() * 6.28 });
    this.rider.onLand = (n, front) => this.riderLanded(n, front);
    for (let i = 0; i < 8; i++) this.clouds.push({ x: Math.random() * (W + 600), y: rand(40, 260), w: rand(120, 300), h: rand(10, 22) });
    this.resize();
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas.parentElement);
    }
    setCaveOrigin(1400);
    this.dy = this.groundY(this.dx) - 160;
    this.menuGateX = this.dx + 900;
    this.resetHist();
    this.updateCamera(0, true);
    this.pearlX = this.dx + LOOK; this.pearlY = this.dy;
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.scale = rect.width / W;
  }

  run() {
    this.last = performance.now();
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, Math.max(0, (t - this.last) / 1000));
      this.last = t;
      this.update(dt);
      this.render();
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.audio.destroy();
  }

  // ================= KONTROL DARI UI =================
  // posisi mouse/jari di layar (0..1) → naga mengejar mutiara cahaya di titik itu, ke arah mana pun
  setTarget(fy: number, fx?: number) {
    this.targetFrac = clamp(fy, 0.02, 0.98);
    if (fx !== undefined) this.targetX = clamp(fx, 0.02, 0.98);
  }
  setKeyDir(d: number) { this.keyDir = d; }
  setKeyDirX(d: number) { this.keyDirX = d; }
  setMuted(m: boolean) { this.audio.setMuted(m); }
  setSkin(s: Skin) { this.skin = s; }
  setLook(skin: Skin, parts: Parts, style: RiderStyle, shine?: number) {
    this.skin = skin;
    this.look = parts;
    this.rider.style = style;
    if (shine !== undefined) this.shine = shine;
  }
  setGoals(g: Goal[], done: boolean[]) { this.goals = g; this.goalDone = [...done]; }
  setPaused(p: boolean) {
    if (this.mode !== 'playing') return;
    this.paused = p;
    this.holding = false;
    this.audio.muffle(p);
  }
  // tahan (klik kiri / Spasi / tombol sentuh) = melesat bertahap hingga 5× (10× saat Melesat Bintang)
  setHold(h: boolean) { this.holding = h; }
  // kepekaan kemudi dari Setelan (0.5–1.5)
  steer = 1;
  setSteer(v: number) { this.steer = clamp(v, 0.5, 1.5); }
  // mode kontrol: 'ultra' = kepala mengejar kursor (termudah, default),
  // 'angle' = kendali SUDUT kepala langsung (tanpa batas, bisa mendarat),
  // 'classic' = fisika momentum ala Alto (butuh keahlian)
  controlMode: 'ultra' | 'angle' | 'classic' = 'ultra';
  setControlMode(m: 'ultra' | 'angle' | 'classic') { this.controlMode = m; }
  setHollowTheme(t: HollowTheme) { setHollowTheme(t); }
  get ultra() { return this.controlMode !== 'classic'; } // fisika pemaaf: ultra & angle
  get angleCtl() { return this.controlMode === 'angle'; } // kendali SUDUT kepala langsung
  get free() { return this.controlMode !== 'classic'; } // tanpa fisika mogok

  runStats(): RunStats {
    return {
      distance: this.distanceM(), rings: this.ringCount, perfects: this.perfects, bestCombo: this.bestCombo,
      score: this.totalScore(), skimTime: this.skimTotal, biomeReached: this.biomeReached, maxSpeed: this.maxSpeed, gates: this.gatesPassed,
      stars: this.starsCaught, maxAlt: Math.round(this.maxAlt / 10),
      loops: this.loops, spirals: this.spirals, dives: this.dives, nears: this.nears, birds: this.birdsMet,
      bestChain: this.bestChain, bestBank: this.bestBank, noHit: Math.floor(this.noHitBest), skyTime: Math.floor(this.skyTime),
      multiLoop: this.multiBest, speedX: Math.floor((this.maxSpeed / NORMAL_SPD) * 10) / 10,
      tricks: this.loops + this.spirals + this.dives + this.nears + this.riderFlips + this.balloonsHit,
      biome: BIOMES[this.biomeInfo(this.dx).dom].name,
    };
  }

  resetHist() {
    this.hist = [];
    const c = Math.cos(this.ang), s = Math.sin(this.ang);
    for (let i = 0; i < 150; i++) this.hist.push({ x: this.dx - i * 3 * c, y: this.dy - i * 3 * s, r: this.roll });
    this.computeBody();
  }

  resetFlight() {
    this.angVel = 0; this.wingKick = 0; this.liftE = 0; this.rolling = false;
    this.roll = 0; this.facing = 1; this.faceT = 0; this.turnDir = 0; this.deadRoll = null;
    this.balloons = []; this.balloonT = rand(3, 5); this.bounceStreak = 0; this.bounceT = 0; this.balloonsHit = 0;
    this.flipCd = 0; this.weaveE = 0; this.riderFlips = 0;
    this.ang = Math.atan2(Math.sin(this.ang), Math.abs(Math.cos(this.ang)) + 0.001);
    this.star = null; this.starTimer = rand(8, 12); this.starsCaught = 0; this.puffs = []; this.thermals = [];
    this.maxAlt = 0; this.inCloud = 0; this.cloudSkim = 0; this.cloudSkimShown = false; this.pierced = false; this.cloudFlag = [false, false];
    this.lives = 3; this.invuln = 0; this.birdsMet = 0; this.skyBanner = false;
    this.throttle = 0; this.holding = false; this.wasHolding = false; this.notice = null;
    this.superT = 0; this.superDur = 4.2; this.superE = 0; this.superV0 = 0; this.starV = 0; this.maxPop = false; this.starGrace = 0;
    this.loopCount = 0; this.trickHeld = false; this.trickBoost = 0; this.spiralT = -1; this.twistArr = null;
    this.flow = { n: 0, mult: 1, pts: 0, t: 0, pulse: 0, zen: false, names: [] }; this.bankPop = null;
    this.loops = 0; this.spirals = 0; this.dives = 0; this.nears = 0; this.bestChain = 1; this.bestBank = 0; this.multiBest = 0;
    this.skyTime = 0; this.noHitBest = 0; this.hitX = this.dx; this.diveT = 0; this.diveWin = 0; this.burstCd = 0;
    this.caveS = 0; this.heavenS = 0; this.caveIdxAnn = -1; this.heavenAnn = false; this.curCaveZone = -1;
    this.nextForm = 1; this.railForm = 0; this.railT = 0; this.railW = 0;
  }

  resetWorldFromSurface() {
    this.dx = 300;
    this.tY = [];
    this.gBase = 0; this.gSlope = 0.2; this.gTarget = 0.2; this.gRemain = 0; this.gPh = 0;
    setCaveOrigin(1400);
  }

  start() {
    this.audio.init();
    this.mode = 'playing';
    this.obstacles = []; this.rings = []; this.texts = []; this.gates = [];
    this.parts = this.parts.filter((p) => p.kind !== 4);
    const genHead = this.tY.length * SP;
    let resetCam = false;
    if (caveInfo(genHead).amt > 0.01 || caveGroundOffset(genHead) > 1 || caveInfo(this.dx).amt > 0.01) {
      this.resetWorldFromSurface();
      resetCam = true;
    } else {
      setCaveOrigin(Math.max(1400, this.dx + 1100));
    }
    this.biomeOrigin = this.dx - 400;
    this.startX = this.dx;
    this.maxDx = this.dx;
    this.nextSpawn = this.dx + 1100;
    this.dy = Math.min(this.dy, this.groundY(this.dx) - 80);
    this.spd = Math.max(this.spd, 320);
    this.ringScore = 0; this.ringCount = 0; this.combo = 0; this.bestCombo = 0;
    this.boost = 0; this.skimT = 0; this.deadT = 0; this.shake = 0; this.slowmo = 1; this.reported = false;
    this.playT = 0; this.curBiome = -1;
    this.perfects = 0; this.skimTotal = 0; this.maxSpeed = 0; this.biomeReached = 0;
    this.gatesPassed = 0; this.gateStreak = 0; this.patternCount = 0;
    this.chain = null; this.frozen = null;
    this.rider.reset();
    this.resetFlight();
    this.toasts = []; this.paused = false;
    this.audio.muffle(false);
    this.audio.start();
    this.resetHist();
    if (resetCam) this.updateCamera(0, true);
    this.maxCamX = this.camX;
    this.targetX = 0.72; this.targetFrac = 0.45; this.pearlX = this.dx + LOOK; this.pearlY = this.dy;
  }

  toMenu() {
    this.mode = 'menu';
    this.paused = false;
    this.obstacles = []; this.rings = []; this.texts = []; this.toasts = [];
    this.gates = [];
    const genHead = this.tY.length * SP;
    let resetCam = false;
    if (caveInfo(genHead).amt > 0.01 || caveGroundOffset(genHead) > 1 || caveInfo(this.dx).amt > 0.01) {
      this.resetWorldFromSurface();
      resetCam = true;
    } else {
      setCaveOrigin(Math.max(1400, this.dx + 1100));
    }
    this.menuGateX = this.dx + 900;
    this.chain = null; this.frozen = null;
    this.rider.reset();
    this.resetFlight();
    this.parts = this.parts.filter((p) => p.kind !== 4);
    this.dy = this.groundY(this.dx) - 160;
    this.ang = 0.2; this.spd = 320; this.boost = 0; this.slowmo = 1; this.shake = 0;
    this.resetHist();
    if (resetCam) this.updateCamera(0, true);
    this.audio.muffle(false);
  }

  // ================= BIOMA & MEDAN =================
  biomeInfo(x: number) {
    const rel = x - this.biomeOrigin;
    if (rel < 0) return { a: 0, b: 0, t: 0, dom: 0 };
    const pos = rel / BIOME_LEN;
    const k = Math.floor(pos);
    const f = (pos - k) * BIOME_LEN;
    const t = smooth(clamp((f - (BIOME_LEN - BIOME_TRANS)) / BIOME_TRANS, 0, 1));
    const a = k % BIOMES.length, b = (k + 1) % BIOMES.length;
    return { a, b, t, dom: t < 0.5 ? a : b };
  }

  genStep() {
    const x = this.tY.length * SP;
    const { a, b, t } = this.biomeInfo(x);
    const A = BIOMES[a], B = BIOMES[b];
    if (this.gRemain <= 0) {
      const P = t < 0.5 ? A : B;
      const r = Math.random();
      if (x < 1500) { this.gTarget = 0.22; this.gRemain = 600; this.gEase = 0.02; }
      else if (r < P.cliff) { this.gTarget = rand(0.9, 1.3); this.gRemain = rand(50, 90); this.gEase = 0.12; }
      else if (r < P.cliff + 0.12) { this.gTarget = rand(-0.14, 0.02); this.gRemain = rand(200, 380); this.gEase = 0.03; }
      else { this.gTarget = rand(P.slopeMin, P.slopeMax); this.gRemain = rand(400, 1100); this.gEase = 0.02; }
    }
    this.gSlope += (this.gTarget - this.gSlope) * this.gEase;
    this.gRemain -= SP;
    this.gBase += this.gSlope * SP;
    const amp = lerp(A.bumpAmp, B.bumpAmp, t);
    this.gPh += lerp(A.bumpFreq, B.bumpFreq, t) * SP;
    this.tY.push(this.gBase + amp * Math.sin(this.gPh) + 5 * Math.sin(x * 0.013) + caveGroundOffset(x));
  }

  groundY(x: number) {
    if (x < 0) x = 0;
    const fi = x / SP;
    const i = Math.floor(fi);
    while (this.tY.length <= i + 2) this.genStep();
    const f = fi - i;
    return this.tY[i] + (this.tY[i + 1] - this.tY[i]) * f;
  }

  // tanah yang dihaluskan agar lapisan awan tidak meniru gundukan lereng
  smoothG(x: number) {
    return (this.groundY(x - 260) + this.groundY(x - 130) + this.groundY(x) + this.groundY(x + 130) + this.groundY(x + 260)) / 5;
  }

  difficulty() { return clamp((this.dx - this.startX) / 90000, 0, 1); }
  // jarak = titik terjauh yang pernah dicapai (terbang mundur tidak mengurangi skor)
  distanceM() { return Math.max(0, Math.floor((this.maxDx - this.startX) / 10)); }
  totalScore() { return Math.floor(this.ringScore + this.distanceM()); }

  palette(): Pal {
    const { a, b, t } = this.biomeInfo(this.dx + W * 0.25);
    const p = blend(BIOMES[a], BIOMES[b], t);
    // langit berubah seiring ketinggian: cerah di atas awan, biru-nila & berbintang di langit tinggi
    const k1 = smooth(clamp((this.altS - 350) / 900, 0, 1));
    const k2 = smooth(clamp((this.altS - 1400) / 1200, 0, 1));
    if (k1 > 0) {
      p.skyBot = mix(p.skyBot, mix([255, 250, 244], p.skyBot, 0.35 + p.star * 0.5), k1 * 0.6);
      p.fog = mix(p.fog, mix([255, 255, 255], p.fog, 0.4 + p.star * 0.4), k1 * 0.5);
    }
    if (k2 > 0) {
      p.skyTop = mix(p.skyTop, mix([34, 54, 128], [10, 12, 40], p.star), k2 * 0.85);
      p.star = Math.max(p.star, k2 * 0.8);
      p.aurora = Math.max(p.aurora, k2 * 0.45);
    }
    // surga mewarnai palet langit tinggi secara bertahap (Hollow Earth dipisahkan secara spasial tanpa fade)
    applyRealmTints(p, 0, this.heavenS);
    return p;
  }

  cavePalette(pal: Pal): Pal {
    const hc = hollowGroundColors();
    const z = caveZone();
    return {
      ...pal,
      groundTop: hc.groundTop,
      ground: hc.ground,
      rim: hc.rim,
      rock: hc.rock,
      rockLight: hc.rockLight,
      fog: z.fogRGB,
      far: z.farRGB,
      mid: z.midRGB,
      near: z.nearRGB,
      ring: mix(z.crystalAltRGB, [255, 240, 185], 0.45),
      star: 0.25,
    };
  }

  // ================= RINTANGAN & POLA =================
  edge(x0: number, y0: number, x1: number, y1: number, n: number, jit: number, curve: number) {
    const pts: Vec[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const j = i > 0 && i < n ? rand(-jit, jit) * (1 - t * 0.6) : 0;
      pts.push({ x: lerp(x0, x1, Math.pow(t, curve)) + j, y: lerp(y0, y1, t) });
    }
    return pts;
  }

  makeSpire(x: number, h: number, w: number, bi: number) {
    const bl = this.groundY(x - w / 2) + 40, br = this.groundY(x + w / 2) + 40;
    const tipX = x + rand(-w * 0.12, w * 0.12), tipY = this.groundY(x) - h;
    const left = this.edge(x - w / 2, bl, tipX, tipY, 6, 5, 1.3);
    const right = this.edge(x + w / 2, br, tipX, tipY, 6, 5, 1.3);
    right.pop();
    const poly = [...left, ...right.reverse()];
    const B = BIOMES[bi];
    const z = caveInfo(x).amt > 0.35 ? caveZone(x) : null;
    const deco: DecoType | undefined = z
      ? (Math.random() < 0.5 ? 'crystalCluster' : 'glowMushroom')
      : B.deco === 'sakura' || B.deco === 'pine' ? B.deco : B.deco === 'lantern' ? 'pine' : undefined;
    this.obstacles.push({
      x, w: w / 2 + 10, polys: [poly], style: 'rock', top: { x: tipX, y: tipY + 4 }, deco, biome: bi, variant: 0,
      caveCrystal: z?.crystalRGB, caveAlt: z?.crystalAltRGB,
    });
    return tipY;
  }

  // KRISTAL GANTUNG: stalaktit dari langit — terbanglah di BAWAH ujungnya
  makeStalactite(x: number, tipAlt: number, len: number, w: number, bi: number) {
    const tipY = this.groundY(x) - tipAlt;
    const topY = tipY - len;
    const tipX = x + rand(-w * 0.1, w * 0.1);
    const left = this.edge(x - w / 2, topY - 60, tipX, tipY, 6, 4, 1.1);
    const right = this.edge(x + w / 2, topY - 60, tipX, tipY, 6, 4, 1.1);
    right.pop();
    const poly = [...left, ...right.reverse()];
    this.obstacles.push({ x, w: w / 2 + 10, polys: [poly], style: 'rock', top: { x: tipX, y: tipY }, biome: bi, variant: 2 });
    return tipY;
  }

  // STALAKTIT GUA: menggantung dari langit-langit lorong yang tinggi (960px)
  makeCaveStalac(x: number, bi: number) {
    const ceil = caveCeilY(this.groundY(x), x);
    const len = rand(160, 320), w = rand(80, 130);
    const tipX = x + rand(-w * 0.1, w * 0.1), tipY = ceil + len;
    const left = this.edge(x - w / 2, ceil - 70, tipX, tipY, 6, 4, 1.1);
    const right = this.edge(x + w / 2, ceil - 70, tipX, tipY, 6, 4, 1.1);
    right.pop();
    const poly = [...left, ...right.reverse()];
    this.obstacles.push({ x, w: w / 2 + 10, polys: [poly], style: 'rock', top: { x: tipX, y: tipY }, biome: bi, variant: 2 });
    return tipY;
  }

  // gerbang 3D yang bisa ditembus (torii / lengkung batu)
  makeGate(x: number, style: 'torii' | 'arch', bi: number, gap?: number) {
    const G0 = this.groundY(x);
    const gp = gap ?? (style === 'torii' ? rand(168, 190) : rand(172, 200));
    const B = BIOMES[bi];
    const z = caveInfo(x).amt > 0.35 ? caveZone(x) : null;
    const g: Gate = {
      x, style, D: style === 'torii' ? 92 : 96, open: G0 - gp, state: 0, t: 0, biome: bi,
      seed: Math.random() * 100, snow: !z && B.weather === 'snow', lantern: B.weather === 'night',
      caveCrystal: z?.crystalRGB,
    };
    this.gates.push(g);
    return g;
  }

  // gerbang torii di atas pulau melayang — bisa ditembus di langit
  makeSkyGate(x: number, alt: number) {
    const G = this.groundY(x), bi = this.biomeInfo(x).dom, B = BIOMES[bi];
    this.gates.push({
      x, style: 'torii', D: 92, open: G - alt - 78, floor: G - alt + 78, state: 0, t: 0, biome: bi,
      seed: Math.random() * 100, snow: B.weather === 'snow', lantern: B.weather === 'night' || Math.random() < 0.45,
    });
    const f = this.newForm();
    this.rings.push({ x: x - 170, y: G - alt + 6, r: 34, state: 0, t: 0, form: f, idx: 0 });
    this.rings.push({ x, y: G - alt, r: 34, state: 0, t: 0, form: f, idx: 1 });
  }

  makeFloat(x: number, y: number, r: number, bi: number) {
    const poly: Vec[] = [{ x: x - r, y: y - 4 }, { x: x - r * 0.4, y: y - 9 }, { x: x + r * 0.5, y: y - 8 }, { x: x + r, y: y - 3 }];
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const depth = Math.sin(t * Math.PI);
      poly.push({ x: lerp(x + r, x - r, t) + rand(-3, 3), y: y + 4 + depth * r * (t > 0.35 && t < 0.65 ? 1.45 : rand(0.9, 1.25)) });
    }
    const z = caveInfo(x).amt > 0.35 ? caveZone(x) : null;
    this.obstacles.push({
      x, w: r + 10, polys: [poly], style: 'float', top: { x, y: y - 7 }, biome: bi, variant: Math.floor(Math.random() * 3),
      caveCrystal: z?.crystalRGB, caveAlt: z?.crystalAltRGB,
    });
    return y + r * 1.5;
  }

  makeBamboo(x: number, bi: number) {
    const polys: Vec[][] = [];
    const n = 4 + Math.floor(Math.random() * 3);
    let sx = x;
    let maxTop = Infinity;
    for (let i = 0; i < n; i++) {
      const h = rand(100, 155);
      const g = this.groundY(sx);
      const lean = rand(-10, 10);
      const top = g - h;
      maxTop = Math.min(maxTop, top);
      polys.push([{ x: sx - 4, y: g + 30 }, { x: sx - 3.5 + lean, y: top }, { x: sx + 3.5 + lean, y: top }, { x: sx + 4, y: g + 30 }]);
      sx += rand(14, 22);
    }
    this.obstacles.push({ x: (x + sx) / 2, w: (sx - x) / 2 + 20, polys, style: 'bamboo', biome: bi, variant: 0 });
    return { top: maxTop, end: sx };
  }

  // LENTERA HANTU / SPORA KRISTAL: bola cahaya yang melayang naik-turun
  makeWisp(x: number, alt: number, bi: number) {
    const r = rand(24, 30);
    const baseY = this.groundY(x) - alt;
    const anim = { baseY, cy: baseY, amp: rand(38, 66), spd: rand(1.1, 1.7), ph: rand(0, 6.28), r, t: rand(0, 10) };
    const z = caveInfo(x).amt > 0.35 ? caveZone(x) : null;
    this.obstacles.push({
      x, w: r + 18, polys: [this.wispPoly(x, baseY, r)], style: 'wisp', biome: bi, variant: 0, anim,
      caveCrystal: z?.crystalRGB, caveAlt: z?.crystalAltRGB,
    });
    return anim;
  }

  wispPoly(x: number, y: number, r: number): Vec[] {
    // hitbox segi-8 sedikit lebih kecil dari visual → adil & pemaaf
    const pts: Vec[] = [], hr = r * 0.62;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      pts.push({ x: x + Math.cos(a) * hr, y: y + Math.sin(a) * hr });
    }
    return pts;
  }

  // satu formasi = grup cincin yang dibidik berurutan oleh mode ikuti-formasi
  newForm() { return this.nextForm++; }
  addRing(x: number, y: number, form?: number, idx?: number) {
    const g = this.groundY(x);
    const minY = caveInfo(x).amt > 0 ? caveCeilY(g, x) + 84 : g - 360;
    this.rings.push({ x, y: clamp(y, minY, g - 34), r: 34, state: 0, t: 0, form, idx });
  }
  ringAlt(x: number, alt: number, form?: number, idx?: number) { this.addRing(x, this.groundY(x) - alt, form, idx); }
  skyRing(x: number, alt: number, form?: number, idx?: number) { this.rings.push({ x, y: this.groundY(x) - alt, r: 34, state: 0, t: 0, form, idx }); }

  puffArc(x: number, alt: number, n: number) {
    for (let i = 0; i < n; i++) {
      const px = x + i * 70;
      this.puffs.push({ x: px, y: this.groundY(px) - alt - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 50, r: rand(16, 22), state: 0, t: 0 });
    }
  }

  spawnSky(x: number, width: number) {
    // di dalam gua: langit-langit menutup — hanya kabut rendah, tanpa termal/gerbang langit
    if (caveInfo(x + width / 2).amt > 0.4) {
      if (Math.random() < 0.5) this.puffArc(x + rand(-60, width), rand(140, 220), 4);
      return;
    }
    // arus angin naik cukup sering → mudah terbang ke langit
    if (this.patternCount % 2 === 1) this.thermals.push({ x: (x + width + this.nextSpawn) / 2, w: 180, top: rand(1400, 1900) });
    if (Math.random() < 0.45) this.puffArc(x + rand(-80, width), rand(200, 330), 4);
    // konten langit: gerbang awan terapung, jalur cincin, gumpalan awan
    const r = Math.random(), alt = rand(480, 1650);
    if (r < 0.42) this.makeSkyGate(x + width * 0.5, alt);
    else if (r < 0.78) { const f = this.newForm(); const drift = rand(-30, 30); for (let i = 0; i < 5; i++) this.skyRing(x + i * 105, alt + drift * (i / 4) + Math.sin((i / 4) * Math.PI) * 30, f, i); }
    else this.puffArc(x + width * 0.4, alt, 6);
  }

  spawnPattern(x: number) {
    const bi = this.biomeInfo(x).dom;
    const B = BIOMES[bi];
    const d = this.difficulty();
    const cave = caveInfo(x).amt > 0.45;
    const nearMouth = caveSegmentsInRange(x - 420, x + 420).some(
      (s) => Math.abs(x - s.xStart) < 380 || Math.abs(x - s.xEnd) < 380,
    );
    let width = 200;
    // di dalam Hollow Earth: menara kristal bercahaya, pulau kristal melayang, spora cahaya & gerbang lengkung rune
    const pool: (ObstacleType | 'swoop')[] = cave
      ? ['swoop', 'wisp', 'spire', 'arch', 'float', 'wisp', 'swoop', 'spire']
      : B.obstacles;
    const pick: ObstacleType | 'swoop' | 'ascend' = nearMouth ? 'swoop'
      : !cave && this.patternCount === 0 && B.obstacles.includes('torii') ? 'torii'
      : !cave && this.patternCount % 5 === 2 ? 'ascend'
      : Math.random() < (cave ? 0.35 : 0.34) ? 'swoop' : pool[Math.floor(Math.random() * pool.length)];
    this.patternCount++;
    switch (pick) {
      case 'ascend': {
        // tangga cincin menuju langit + arus angin naik (lurus landai, satu formasi)
        const n = 8, f = this.newForm();
        for (let i = 0; i < n; i++) this.skyRing(x + i * 115, 70 + i * 68, f, i);
        this.thermals.push({ x: x + 330, w: 190, top: 1500 });
        width = (n - 1) * 115;
        break;
      }
      case 'swoop': {
        // formasi landai: garis lurus miring / busur dangkal (aman di dalam kubah & gerbang gua)
        const n = nearMouth ? 5 : 6, f = this.newForm(), roll = nearMouth ? 0 : Math.random();
        const base = nearMouth ? 148 : cave ? rand(170, 390) : rand(120, 230);
        const slope = nearMouth ? 0 : rand(-45, 45);
        if (roll < 0.55) {
          for (let i = 0; i < n; i++) this.ringAlt(x + i * 105, base + slope * (i / (n - 1)), f, i);
        } else if (roll < 0.8) {
          const amp = cave ? 55 : 34;
          for (let i = 0; i < n; i++) this.ringAlt(x + i * 105, base + slope * (i / (n - 1)) + Math.sin((i / (n - 1)) * Math.PI) * amp, f, i);
        } else {
          const amp = cave ? 85 : 70, hi = base;
          for (let i = 0; i < n; i++) this.ringAlt(x + i * 105, hi - Math.sin((i / (n - 1)) * Math.PI) * amp, f, i);
        }
        width = (n - 1) * 105;
        break;
      }
      case 'spire': {
        const h = rand(95, lerp(140, 175, d));
        const tip = this.makeSpire(x, h, rand(58, 82), bi);
        const f = this.newForm();
        if (Math.random() < 0.6) {
          this.addRing(x - 130, tip - 18, f, 0); this.addRing(x, tip - 46, f, 1); this.addRing(x + 130, tip - 18, f, 2);
        } else {
          this.ringAlt(x - 190, 60, f, 0); this.ringAlt(x - 95, 105, f, 1); this.addRing(x + 10, tip - 50, f, 2);
        }
        width = 160;
        break;
      }

      case 'stalac': {
        const tipAlt = rand(300, 400);
        const tipY = this.makeStalactite(x, tipAlt, rand(150, 220), rand(56, 78), bi);
        const f = this.newForm();
        this.addRing(x - 135, tipY + 62, f, 0); this.addRing(x, tipY + 52, f, 1); this.addRing(x + 135, tipY + 62, f, 2);
        width = 170;
        break;
      }
      case 'arch': {
        const g = this.makeGate(x, 'arch', bi);
        const alt = (this.groundY(x) - g.open) / 2;
        const f = this.newForm();
        this.ringAlt(x - 170, alt + 4, f, 0);
        this.addRing(x, g.open + alt + 4, f, 1);
        if (Math.random() < 0.5) this.ringAlt(x + 170, alt - 4, f, 2);
        width = 240;
        break;
      }
      case 'torii': {
        const g = this.makeGate(x, 'torii', bi);
        const alt = (this.groundY(x) - g.open) / 2;
        const f = this.newForm();
        this.ringAlt(x - 160, alt + 6, f, 0);
        this.addRing(x, g.open + alt + 4, f, 1);
        width = 200;
        break;
      }
      case 'tunnel': {
        // deretan torii seperti lorong Fushimi Inari, menuruni lereng
        const n = 5, sp = 88, f = this.newForm();
        let ri = 0;
        for (let i = 0; i < n; i++) {
          const gx = x + i * sp;
          const g = this.makeGate(gx, 'torii', bi, 176);
          if (i === 1 || i === 3) { this.addRing(gx, (g.open + this.groundY(gx)) / 2 + 4, f, ri); ri++; }
        }
        width = (n - 1) * sp + 120;
        break;
      }
      case 'float': {
        const r = rand(32, 46);
        const fy = this.groundY(x) - (cave ? rand(205, 250) : rand(230, 280));
        const bottom = this.makeFloat(x, fy, r, bi);
        const f = this.newForm();
        if (Math.random() < 0.65) {
          const altC = (this.groundY(x) - bottom) / 2;
          this.ringAlt(x - 110, altC + 8, f, 0);
          this.ringAlt(x, altC, f, 1);
          this.ringAlt(x + 110, altC + 8, f, 2);
        } else {
          this.addRing(x - 115, fy - 30, f, 0); this.addRing(x, fy - 56, f, 1); this.addRing(x + 115, fy - 30, f, 2);
        }
        width = 180;
        break;
      }
      case 'bamboo': {
        const bb = this.makeBamboo(x, bi);
        const cx = (x + bb.end) / 2;
        const f = this.newForm();
        this.addRing(cx - 145, bb.top + 18, f, 0); this.addRing(cx, bb.top - 34, f, 1); this.addRing(cx + 145, bb.top + 18, f, 2);
        width = bb.end - x + 120;
        break;
      }
      case 'wisp': {
        const alt = rand(170, 300);
        this.makeWisp(x, alt, bi);
        const f = this.newForm();
        this.ringAlt(x - 120, alt + 6, f, 0);
        this.ringAlt(x + 120, alt - 6, f, 1);
        width = 200;
        break;
      }
    }
    this.nextSpawn = x + width + rand(560, 900) * lerp(1, 0.8, d);
    this.spawnSky(x, width);
  }

  // ================= AWAN, ARUS NAIK & BINTANG JATUH =================
  cloudAt(x: number, li: number) {
    const L = CLOUD_LAYERS[li];
    let k = 1;
    if (L.broken) k = clamp((0.5 + 0.35 * Math.sin(x * 0.0017 + 0.7) + 0.25 * Math.sin(x * 0.0041 + 2.1) - 0.42) / 0.18, 0, 1);
    const vary = L.broken ? 1 : 0.8 + 0.2 * Math.sin(x * 0.0021 + 0.5);
    const th = L.thick * (0.6 + 0.4 * k) * k * vary;
    const c = this.smoothG(x) - L.alt;
    // puncak awan bergelombang halus (tanpa lekukan tajam)
    const puff = ((0.5 + 0.5 * Math.sin(x * 0.011 + 0.3)) * 0.5 + (0.5 + 0.5 * Math.sin(x * 0.0047 + 1.3)) * 0.65) * th * 0.45;
    return { top: c - th * 0.5 - puff, bot: c + th * 0.5 + (0.5 + 0.5 * Math.sin(x * 0.006 + 0.4)) * th * 0.08, k };
  }

  applyLift(dt: number) {
    let inT = 0;
    const alt = this.groundY(this.dx) - this.dy;
    for (const th of this.thermals) {
      const d = Math.abs(this.dx - th.x);
      if (d < th.w / 2 && alt < th.top) inT = Math.max(inT, Math.sqrt(1 - d / (th.w / 2)) * clamp((th.top - alt) / 250, 0, 1));
    }
    this.liftE = inT > 0 ? Math.min(1.5, this.liftE + inT * dt * 4) : Math.max(0, this.liftE - dt * 0.7);
    if (this.liftE <= 0) return;
    const k = clamp(this.liftE, 0, 1);
    this.spd += k * (430 * Math.max(0, -Math.sin(this.ang)) + 25) * dt;
    this.dy -= k * 55 * dt;
    if (Math.random() < k * 0.6) this.parts.push({ x: this.dx + rand(-30, 10), y: this.dy + rand(5, 30), vx: rand(-20, 20), vy: rand(-90, -50), life: 0.9, max: 0.9, size: rand(1, 2), color: 'lift', kind: 11, ph: Math.random() * 6 });
  }

  cloudPhysics(dt: number) {
    let inside = 0, skimming = false;
    for (let li = 0; li < CLOUD_LAYERS.length; li++) {
      const r = this.cloudAt(this.dx, li);
      if (r.k < 0.15) { this.cloudFlag[li] = false; continue; }
      if (this.dy > r.top + 4 && this.dy < r.bot - 4) {
        inside = 1;
        this.cloudFlag[li] = true;
        if (Math.random() < 0.9) this.parts.push({ x: this.dx - rand(0, 30), y: this.dy + rand(-14, 14), vx: rand(-90, -20), vy: rand(-20, 20), life: 1.4, max: 1.4, size: rand(8, 16), color: 'mist', kind: 10, ph: 0 });
      } else if (this.dy <= r.top + 4) {
        if (this.cloudFlag[li]) {
          this.cloudFlag[li] = false;
          if (this.spd > 420 && this.burstCd <= 0) { this.burstCd = 2.5; this.flowEvent('Lompatan Awan', 80, true); }
          if (li === 1 && !this.pierced) {
            this.pierced = true; this.ringScore += 80; this.wingKick = 1; this.audio.cloud();
            this.texts.push({ x: this.dx, y: this.dy - 50, text: 'Menembus Lautan Awan ✦', life: 2.2, big: true });
          } else this.audio.puff();
        }
        const gap = r.top - this.dy;
        if (gap < 34) {
          skimming = true;
          const f = 1 - clamp(gap, 0, 34) / 34;
          this.spd += 70 * f * dt; this.ringScore += f * dt * 10; this.cloudSkim += dt;
          if (Math.random() < 0.7) this.parts.push({ x: this.dx - 8, y: r.top + 2, vx: rand(-120, -40), vy: rand(-40, 5), life: 1, max: 1, size: rand(5, 10), color: 'mist', kind: 10, ph: 0 });
          if (this.cloudSkim > 0.5 && !this.cloudSkimShown) {
            this.cloudSkimShown = true; this.ringScore += 10;
            this.flowEvent('Selancar Awan', 40, false);
            this.texts.push({ x: this.dx, y: this.dy - 36, text: 'Selancar Awan ✦', life: 1.4, big: false });
          }
        }
      } else this.cloudFlag[li] = false;
    }
    if (!skimming) { this.cloudSkim = 0; this.cloudSkimShown = false; }
    this.inCloud += (inside - this.inCloud) * (1 - Math.exp(-4 * dt));
  }

  updateSky(dt: number) {
    for (const p of this.puffs) {
      p.t += dt;
      if (this.mode === 'playing' && p.state === 0 && Math.hypot(this.dx - p.x, this.dy - p.y) < p.r + 8) {
        p.state = 1; p.t = 0;
        this.spd += 35; this.ringScore += 5; this.audio.puff(); this.wingKick = Math.max(this.wingKick, 0.5);
        for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, s = rand(30, 110); this.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s + 60, vy: Math.sin(a) * s, life: 1.1, max: 1.1, size: rand(6, 12), color: 'mist', kind: 10, ph: 0 }); }
      }
    }
    this.puffs = this.puffs.filter((p) => p.x > this.cutX && !(p.state === 1 && p.t > 0.8));
    this.thermals = this.thermals.filter((t) => t.x + t.w > this.cutX);
    for (const th of this.thermals) {
      if (th.x < this.camX - 80 || th.x > this.camX + this.vw + 80 || Math.random() > dt * 7) continue;
      const g0 = this.groundY(th.x), y = clamp(rand(this.camY, this.camY + this.vh), g0 - th.top, g0);
      this.parts.push({ x: th.x + rand(-th.w * 0.4, th.w * 0.4), y, vx: rand(-8, 8), vy: rand(-70, -40), life: 2.2, max: 2.2, size: rand(1, 2), color: 'lift', kind: 11, ph: Math.random() * 6 });
    }
    if (this.mode !== 'playing') return;
    if (!this.star && !this.rolling) {
      this.starTimer -= dt;
      if (this.starTimer <= 0) {
        // muncul di depan pada ketinggian yang sama dengan naga
        const sx = this.dx + this.vw * 0.75 + 100;
        const sAlt = clamp(this.groundY(this.dx) - this.dy, 110, 2300);
        this.star = { x: sx, y: this.groundY(sx) - sAlt + rand(-40, 40), t: 0 };
        this.audio.starAppear();
        this.notice = { text: '✦ Bintang jatuh terlihat — kejar untuk melesat 10×!', t: 3.2 };
      }
    }
    const s = this.star;
    if (!s) return;
    s.t += dt; s.x -= 40 * dt;
    // bintang perlahan menghampiri ketinggian naga → mudah ditangkap
    const sax = s.x - this.dx;
    if (sax < 700 && sax > -60) s.y += (this.dy - s.y) * (1 - Math.exp(-1.2 * dt));
    s.y += Math.sin(s.t * 1.7) * 10 * dt;
    s.y = Math.min(s.y, this.groundY(s.x) - 40);
    if (Math.random() < 0.8) this.parts.push({ x: s.x + rand(-4, 4), y: s.y + rand(-4, 4), vx: rand(20, 70), vy: rand(-15, 15), life: 1.1, max: 1.1, size: rand(1.2, 2.6), color: 'starlight', kind: 12, ph: Math.random() * 6 });
    // tarikan magnet saat sudah dekat
    if (Math.hypot(this.dx - s.x, this.dy - s.y) < 150 && Math.random() < 0.7) {
      this.parts.push({ x: s.x + rand(-6, 6), y: s.y + rand(-6, 6), vx: (this.dx - s.x) * 2.5, vy: (this.dy - s.y) * 2.5, life: 0.4, max: 0.4, size: rand(1, 2), color: 'starlight', kind: 12, ph: Math.random() * 6 });
    }
    if (Math.hypot(this.dx - s.x, this.dy - s.y) < 54) this.catchStar();
    else if (s.x < this.camX - 60 || s.t > 30) {
      if (!s.retry) {
        // kesempatan kedua: bintang berputar kembali ke depan naga (searah arah hadapnya)
        s.retry = true; s.t = Math.min(s.t, 18);
        s.x = this.dx + this.facing * this.vw * 0.45; s.y = this.dy - 30;
        this.notice = { text: '✦ Bintang berputar kembali — kejar lagi!', t: 2.8 };
        this.audio.starAppear();
      } else { this.star = null; this.starTimer = rand(10, 15); }
    }
  }

  catchStar() {
    const s = this.star;
    if (!s) return;
    this.star = null; this.starTimer = rand(16, 24); this.starsCaught++;
    if (this.lives < 3) { this.lives++; this.texts.push({ x: s.x, y: s.y - 70, text: '+1 ♥', life: 1.6, big: true }); }
    // atraksi bintang: putaran yang arahnya mengikuti gerakan, lalu Melesat Bintang
    this.startLoop('star');
    this.flowEvent('Bintang Jatuh', 150, true);
    this.slowmo = 0.45; this.wingKick = 1; this.ringScore += 250; this.rider.cheer = 1.4;
    this.audio.starCatch();
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, sp = rand(60, 280); this.parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.8, 1.5), max: 1.5, size: rand(1.5, 3.2), color: 'starlight', kind: 12, ph: Math.random() * 6 }); }
    this.texts.push({ x: s.x, y: s.y - 46, text: 'Atraksi Bintang!', life: 1.8, big: true });
    this.texts.push({ x: s.x, y: s.y - 22, text: '+250', life: 1.4, big: false });
  }

  // setelah atraksi bintang: kecepatan naik bertahap (kurva-S) hingga 10× — lihat updateDragon
  endRoll() {
    this.rolling = false;
    this.ang = this.rollStart; this.angVel = 0;
    this.superDur = 4.2; this.superT = 4.2; this.superE = 0;
    this.superV0 = this.spd; this.starV = this.spd; this.maxPop = false; this.starGrace = 0;
    this.boost = Math.max(this.boost, 2.4);
    this.wingKick = 1; this.shake = 3;
    this.audio.whoosh(1.6);
    this.texts.push({ x: this.dx + 40, y: this.dy - 50, text: 'Melesat Bintang!', life: 1.4, big: true });
    this.autoFlip('star');
  }

  // ================= FREESTYLE =================
  wrapAng(a: number) { return Math.atan2(Math.sin(a), Math.cos(a)); }

  startLoop(src: 'star' | 'player') {
    this.rolling = true; this.rollT = 0; this.loopSrc = src;
    this.rollStart = this.wrapAng(this.ang);
    this.ang = this.rollStart;
    const alt = this.groundY(this.dx) - this.dy;
    // arah putar yang mengangkat hidung naga bergantung pada arah terbang (ke kanan / ke kiri)
    const up = Math.cos(this.ang) >= 0 ? -1 : 1, diving = Math.sin(this.ang);
    if (src === 'star') { this.rollDur = 1.2; this.rollDir = diving > 0.3 && alt > 260 ? -up : up; return; }
    // makin cepat → putaran makin besar & sedikit lebih singkat
    this.rollDur = clamp(0.98 - (this.spd - 320) / 2600, 0.6, 0.98);
    const r = (this.spd * this.rollDur) / (Math.PI * 2);
    // menukik di ketinggian cukup → Salto Bulan (putaran ke depan), selain itu Putaran ke atas
    this.loopFwd = diving > 0.34 && alt > 2 * r + 90;
    this.rollDir = this.loopFwd ? -up : up;
    this.wingKick = 1;
    this.audio.whoosh(0.9);
  }

  completeLoop() {
    this.loopCount++;
    this.ang = this.rollStart; this.angVel = 0;
    this.trickBoost = 0.55;
    if (this.mode === 'playing') {
      this.loops++;
      this.multiBest = Math.max(this.multiBest, this.loopCount);
      const fwd = this.loopFwd, name = fwd ? 'Salto Bulan' : 'Putaran';
      this.flowEvent(this.loopCount > 1 ? `${name} ×${this.loopCount}` : name, (fwd ? 150 : 100) * this.loopCount, true);
      this.texts.push({ x: this.dx, y: this.dy - 48, text: this.loopCount > 1 ? `${name} ×${this.loopCount}!` : `${name} ✦`, life: 1.3, big: true });
    }
    if (this.trickHeld && this.mode !== 'dead') { this.rollT = 0; this.wingKick = 1; this.audio.whoosh(0.7); }
    else { this.rolling = false; this.loopCount = 0; }
  }

  // menyentuh tanah di awal putaran = pendaratan kasar (aliran putus)
  crashLanding() {
    this.rolling = false; this.loopCount = 0; this.trickHeld = false;
    this.ang = Math.atan2(0.1, Math.cos(this.ang) >= 0 ? 1 : -1); this.angVel = 0;
    if (this.mode !== 'playing') return;
    // ULTRA: pendaratan selalu mulus — tanpa hukuman aliran
    this.spd *= this.ultra ? 0.92 : 0.72;
    this.shake = this.ultra ? 3 : 6;
    if (!this.ultra) this.loseFlow();
    this.audio.thud(0.6);
    this.texts.push({ x: this.dx, y: this.dy - 44, text: this.ultra ? 'Mendarat mulus!' : 'Pendaratan kasar!', life: 1.4, big: true });
  }

  trickDown() {
    this.trickHeld = true;
    if (!this.rolling && this.mode !== 'dead' && !this.paused) { this.loopCount = 0; this.startLoop('player'); }
  }
  trickUp() { this.trickHeld = false; }

  spin() {
    if (this.spiralT >= 0 || this.mode === 'dead' || this.paused) return;
    this.spiralT = 0; this.wingKick = 1; this.audio.whoosh(0.75);
  }

  updateSpiral(dt: number) {
    if (this.spiralT < 0) { this.twistArr = null; return; }
    this.spiralT += dt;
    const p = this.spiralT / this.spiralDur, N = BODY_N, i0 = 8, sp = 1.1, span = N - 1 - i0;
    const arr: number[] = this.twistArr ?? new Array<number>(N).fill(0);
    for (let i = i0; i < N; i++) {
      const s = clamp(p * (1 + sp) - (sp * (i - i0)) / span, 0, 1);
      arr[i] = Math.PI * 2 * (s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2);
    }
    this.twistArr = arr;
    // kilau berpilin di puncak gelombang puntiran
    const ci = Math.round(i0 + clamp((p * (1 + sp) - 0.5) / sp, 0, 1) * span);
    const b = this.body[Math.min(this.body.length - 1, ci)];
    if (b && Math.random() < 0.9) this.parts.push({ x: b.x + rand(-5, 5), y: b.y + rand(-5, 5), vx: rand(-50, 10), vy: rand(-30, 30), life: 0.8, max: 0.8, size: rand(1.2, 2.6), color: 'trail-' + this.skin.trail, kind: 0, ph: Math.random() * 6 });
    if (p >= 1) {
      this.spiralT = -1; this.twistArr = null;
      if (this.mode === 'playing') {
        this.spirals++;
        this.trickBoost = Math.max(this.trickBoost, 0.4);
        const combo = this.rolling;
        this.flowEvent(combo ? 'Putaran Pusaran' : 'Pusaran Naga', combo ? 150 : 70, true);
        this.texts.push({ x: this.dx, y: this.dy - 40, text: combo ? 'Putaran Pusaran!' : 'Pusaran Naga ∿', life: 1.2, big: true });
      }
    }
  }

  // ================= ALIRAN (FLOW) =================
  // trik menaikkan pengganda; cincin/gerbang/burung menjaga aliran; menabrak memutusnya
  flowEvent(name: string, pts: number, trick: boolean) {
    if (this.mode !== 'playing') return;
    const f = this.flow;
    if (f.n === 0) { f.mult = 1; f.pts = 0; f.zen = false; }
    f.n++;
    if (trick) { f.mult = Math.min(10, f.mult + 1); f.pulse = 1; this.bestChain = Math.max(this.bestChain, f.mult); this.audio.trick(f.mult); }
    f.pts += pts;
    f.t = 3.2;
    if (f.n === 1) f.names = [];
    f.names.push({ s: name, t: 0 });
    if (f.names.length > 14) f.names.shift();
    if (f.mult >= 5 && !f.zen) {
      f.zen = true;
      this.audio.cloud();
      this.texts.push({ x: this.dx, y: this.dy - 72, text: 'ALIRAN ZEN ✦', life: 1.8, big: true });
    }
  }

  updateFlow(dt: number) {
    const f = this.flow;
    f.pulse = Math.max(0, f.pulse - dt * 3);
    for (const n of f.names) n.t += dt;
    if (f.n > 0 && this.mode === 'playing') { f.t -= dt; if (f.t <= 0) this.bankFlow(); }
    if (this.bankPop && (this.bankPop.t -= dt) <= 0) this.bankPop = null;
  }

  bankFlow() {
    const f = this.flow, gained = Math.round(f.pts * f.mult);
    this.ringScore += gained;
    this.bestBank = Math.max(this.bestBank, gained);
    this.bankPop = { pts: gained, mult: f.mult, t: 2.2 };
    if (f.mult >= 2) this.audio.bank(f.mult);
    f.n = 0; f.mult = 1; f.pts = 0; f.t = 0; f.zen = false;
  }

  loseFlow() {
    const f = this.flow;
    if (f.n > 0 && f.mult > 1) this.bankPop = { pts: 0, mult: f.mult, t: 2, lost: true };
    f.n = 0; f.mult = 1; f.pts = 0; f.t = 0; f.zen = false;
  }

  // ================= UPDATE =================
  update(dt: number) {
    if (this.paused) { this.audio.setWind(0); return; }
    this.time += dt;
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);
    if (this.keyDir !== 0) this.targetFrac = clamp(this.targetFrac + this.keyDir * dt * 0.9, 0.02, 0.98);
    if (this.keyDirX !== 0) this.targetX = clamp(this.targetX + this.keyDirX * dt * 0.9, 0.02, 0.98);
    if (this.mode === 'menu') {
      this.biomeOrigin = this.dx - 2400;
      setCaveOrigin(Math.max(1400, this.dx + 1100));
    }
    if (this.mode === 'dead') {
      this.deadT += dt;
      this.slowmo = lerp(this.slowmo, 1, dt * 0.8);
      if (this.deadT > 1.9 && !this.reported) {
        this.reported = true;
        this.cb.onGameOver(this.frozen ?? this.runStats());
      }
    }
    if (this.mode !== 'dead') this.slowmo += (1 - this.slowmo) * (1 - Math.exp(-2.2 * dt));
    const sdt = dt * this.slowmo;
    if (this.mode !== 'dead') this.updateDragon(sdt);
    else this.updateRagdolls(sdt);
    this.updateSky(sdt);
    this.updateSpiral(sdt);
    this.updateFlow(dt);
    this.updateCamera(dt, false);
    this.updateRealms(dt);

    this.shake = Math.max(0, this.shake - dt * 30);
    this.invuln = Math.max(0, this.invuln - dt);
    this.starGrace = Math.max(0, this.starGrace - dt);
    if (this.notice && (this.notice.t -= dt) <= 0) this.notice = null;
    this.burstCd = Math.max(0, this.burstCd - dt);
    if (this.banner.t > 0) this.banner.t -= dt;

    if (this.mode === 'playing') {
      this.playT += dt;
      while (this.nextSpawn < this.camX + this.vw + 500) this.spawnPattern(this.nextSpawn);
      this.maxAlt = Math.max(this.maxAlt, this.groundY(this.dx) - this.dy);
      if (this.altS > 480) this.skyTime += dt;
      this.maxDx = Math.max(this.maxDx, this.dx);
      this.noHitBest = Math.max(this.noHitBest, (this.maxDx - this.hitX) / 10);
      if (!this.skyBanner && this.altS > 480) {
        this.skyBanner = true;
        this.banner = { name: 'Langit Terbuka', sub: 'LANGIT · 天空', t: 4 };
        this.audio.cloud();
      }
      const dom = this.biomeInfo(this.maxDx + 200).dom;
      if (dom !== this.curBiome) {
        if (this.curBiome !== -1) this.biomeReached++;
        this.curBiome = dom;
        this.banner = { name: BIOMES[dom].name, sub: BIOMES[dom].sub, t: 4.5 };
        this.audio.setBiome(dom);
      }
      this.maxSpeed = Math.max(this.maxSpeed, this.spd);
      // cek misi
      const st = this.runStats();
      this.goals.forEach((g, i) => {
        if (this.goalDone[i]) return;
        if (goalValue(g, st) >= g.target) {
          this.goalDone[i] = true;
          this.toasts.push({ text: g.text, t: 3.6 });
          this.audio.goal();
          this.cb.onGoal?.(i);
        }
      });
    } else if (this.mode === 'menu') {
      this.audio.setBiome(this.biomeInfo(this.dx + 200).dom);
      // demo freestyle di menu utama
      this.demoT -= dt;
      if (this.demoT <= 0 && !this.rolling) {
        this.demoT = rand(5.5, 8.5);
        if (this.groundY(this.dx) - this.dy > 210 && Math.random() < 0.55) { this.trickHeld = false; this.loopCount = 0; this.startLoop('player'); }
        else if (Math.random() < 0.5) this.autoFlip('demo');
        else this.spin();
      }
    }
    const inten = this.mode === 'playing'
      ? clamp(clamp((this.spd - 180) / 480, 0, 1) * 0.85 + (this.boost > 0 ? 0.15 : 0) + (this.superT > 0 ? 0.3 : 0) + (this.zen ? 0.2 : 0), 0, 1)
      : this.mode === 'menu' ? 0.12 : 0;
    this.audio.setIntensity(inten, this.boost > 0 && this.mode === 'playing');
    for (const r of this.rings) r.t += sdt;
    const cut = this.cutX;
    for (const g of this.gates) {
      g.t += sdt;
      // debu cahaya yang mengundang untuk ditembus
      if (g.state === 0 && g.x > this.camX && g.x < this.camX + this.vw && Math.random() < sdt * 2.5) {
        const z = rand(-g.D, g.D) * 0.8;
        const y = lerp(g.open + 12, (g.floor ?? this.groundY(g.x)) - 12, Math.random());
        this.parts.push({ x: g.x + KX * z, y: y + KY * z, vx: rand(-8, 8), vy: rand(-14, -4), life: 2, max: 2, size: rand(1, 1.8), color: 'fly', kind: 2, ph: Math.random() * 6 });
      }
    }
    this.gates = this.gates.filter((g) => g.x + 170 > cut);
    if (this.mode === 'menu') {
      while (this.menuGateX < this.camX + this.vw + 300) {
        if (this.menuGateX > this.camX + this.vw + 80) this.makeGate(this.menuGateX, 'torii', 0);
        this.menuGateX += rand(1100, 1600);
      }
    }
    // Lentera Hantu melayang naik-turun (hitbox ikut bergerak)
    for (const o of this.obstacles) {
      const a = o.anim;
      if (!a) continue;
      a.t += sdt;
      a.cy = a.baseY + Math.sin(a.t * a.spd + a.ph) * a.amp;
      o.polys[0] = this.wispPoly(o.x, a.cy, a.r);
      if (o.x > this.camX - 60 && o.x < this.camX + this.vw + 60 && Math.random() < sdt * 6) {
        this.parts.push({ x: o.x + rand(-8, 8), y: a.cy + rand(-8, 8), vx: rand(-15, 15), vy: rand(-25, -5), life: 0.9, max: 0.9, size: rand(1, 2), color: 'starlight', kind: 12, ph: Math.random() * 6 });
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > cut);
    this.rings = this.rings.filter((r) => r.x > cut && !(r.state === 1 && r.t > 1.2));
    this.updateParticles(sdt);
    this.updateBirds(sdt);
    this.updateBalloons(sdt);
    this.audio.setWind(clamp((this.spd - 150) / 600, 0, 1) * (this.mode === 'dead' ? 0.2 : 1));
  }

  // Gua & surga + banner + partikel suasana
  updateRealms(dt: number) {
    const c = caveInfo(this.dx);
    this.caveS = c.amt;
    const h = heavenAmt(this.altS);
    this.heavenS += (h - this.heavenS) * (1 - Math.exp(-1.4 * dt));
    if (this.mode !== 'playing') return;
    if (c.amt > 0 && this.caveIdxAnn !== c.idx) {
      this.caveIdxAnn = c.idx;
      const z = caveZone();
      this.banner = { name: `Hollow Earth · ${z.name}`, sub: z.sub, t: 4.5 };
      this.audio.caveEnter();
      this.ringScore += 100;
      this.texts.push({ x: this.dx, y: this.dy - 60, text: `Hollow Earth · ${z.name} ✦ +100`, life: 2.4, big: true });
    }
    if (this.heavenS > 0.55 && !this.heavenAnn) {
      this.heavenAnn = true;
      this.banner = { name: 'Surga Awan', sub: 'HEAVEN · 天空', t: 4.5 };
      this.audio.heavenEnter();
      this.ringScore += 150;
      this.texts.push({ x: this.dx, y: this.dy - 60, text: 'Surga Awan ✦ +150', life: 2.2, big: true });
    } else if (this.heavenS < 0.2) this.heavenAnn = false;
    // spora bioluminesensi & kunang-kunang kristal hanya di dalam koordinat rongga Hollow Earth
    if (c.amt > 0) {
      const trySpawn = (color: string, life: number, size: number) => {
        const px = this.camX + rand(0, this.vw);
        if (caveInfo(px).amt <= 0) return;
        const g = this.groundY(px);
        const py = clamp(this.camY + rand(0, this.vh), caveCeilY(g, px) + 28, g - 16);
        this.parts.push({ x: px, y: py, vx: rand(-20, 20), vy: rand(-16, 12), life, max: life, size, color, kind: 2, ph: Math.random() * 6 });
      };
      if (Math.random() < dt * 11) trySpawn('caveSpore', 3.8, rand(1.4, 2.6));
      if (Math.random() < dt * 3.5) trySpawn('fly', 3.2, rand(1.2, 2.0));
    }
    if (this.heavenS > 0.25) {
      if (Math.random() < dt * 6) this.parts.push({ x: this.camX + rand(0, this.vw), y: this.camY - 20, vx: rand(-30, -10), vy: rand(25, 55), life: 5, max: 5, size: rand(2.2, 3.4), color: 'petal', kind: 3, ph: Math.random() * 6 });
      if (Math.random() < dt * 4) this.parts.push({ x: this.camX + rand(0, this.vw), y: this.camY + rand(0, this.vh), vx: rand(-12, 12), vy: rand(-16, -4), life: 2.6, max: 2.6, size: rand(1.4, 2.4), color: 'starlight', kind: 12, ph: Math.random() * 6 });
    }
  }

  updateCamera(dt: number, snap: boolean) {
    // kamera 30% lebih jauh (zoom dasar 0.7) + zoom-out lembut saat cepat / tinggi / Melesat Bintang
    const sp = clamp((this.spd - 320) / 520, 0, 1);
    const ZB = 0.7;
    const fast = clamp((this.spd - MAX_HOLD) / (STAR_MAX - MAX_HOLD), 0, 1);
    const zt = this.mode === 'playing'
      ? ZB * clamp(1 - sp * 0.16 - clamp(this.altS / 2400, 0, 1) * 0.08 - (this.superT > 0 ? 0.1 : 0), 0.72, 1) * lerp(1, 0.86, this.throttle) * lerp(1, 0.84, fast)
      : this.mode === 'menu' ? 0.84 : this.zoom;
    this.zoom = snap ? zt : this.zoom + (zt - this.zoom) * (1 - Math.exp(-0.9 * dt));
    const vw = this.vw, vh = this.vh;
    // saat jatuh, kamera mengikuti tubuh penunggang yang terguling
    const fp = this.mode === 'dead' && this.rider.p.length ? this.rider.p[2] : null;
    const fx = fp ? fp.x : this.dx, fy = fp ? fp.y : this.dy;
    this.altS += (clamp(this.groundY(fx) - fy, 0, 4000) - this.altS) * (snap ? 1 : 1 - Math.exp(-2 * dt));
    const gRef = (this.groundY(fx - 150) + this.groundY(fx + 100) + this.groundY(fx + 350)) / 3;
    const floor = gRef - 0.64 * vh;
    // kamera zona-tengah: selama naga di zona tengah layar kamera diam, hanya menggulir di dekat tepi
    const frac = (fy - (floor + this.camRel)) / vh;
    if (frac < 0.3) this.camRel = fy - 0.3 * vh - floor;
    else if (frac > 0.66) this.camRel = fy - 0.66 * vh - floor;
    this.camRel = Math.min(0, this.camRel);
    const t = floor + this.camRel;
    this.camY = snap ? t : this.camY + (t - this.camY) * (1 - Math.exp(-(3.4 + this.spd / 450) * dt));
    this.camOff = this.camY - floor;
    if (fp) {
      // saat jatuh, kamera mengikuti tubuh penunggang yang terguling
      const tx = fx - 0.4 * vw - 140;
      this.camX = snap ? tx : this.camX + (tx - this.camX) * (1 - Math.exp(-3.5 * dt));
    } else if (this.mode === 'menu') {
      this.zoneL = this.zoneR = 0.3;
      this.camX = fx - 0.3 * vw;
    } else {
      // zona-tengah horizontal: naga bebas meliuk di dalam zona; kamera hanya menggulir saat naga mendekati tepi.
      // tepi zona bergeser mengikuti arah & kecepatan terbang → pandangan lebih luas ke arah tujuan (maju maupun mundur)
      const vxw = Math.cos(this.ang) * this.spd;
      const fwdK = clamp((vxw - 420) / 900, 0, 1), backK = clamp((-vxw - 300) / 700, 0, 1);
      const Rt = lerp(lerp(0.42, 0.32, fwdK), 0.74, backK), Lt = lerp(0.2, 0.58, backK);
      const ek = snap ? 1 : 1 - Math.exp(-1.5 * dt);
      this.zoneR += (Rt - this.zoneR) * ek;
      this.zoneL += (Lt - this.zoneL) * ek;
      const sxs = (fx - this.camX) / vw;
      if (sxs > this.zoneR) this.camX = fx - this.zoneR * vw;
      else if (sxs < this.zoneL) this.camX = fx - this.zoneL * vw;
    }
    this.maxCamX = Math.max(this.maxCamX, this.camX);
    const tl = clamp((this.groundY(this.camX + vw) - this.groundY(this.camX)) / vw, -0.1, 0.7);
    this.tilt = snap ? tl : this.tilt + (tl - this.tilt) * (1 - Math.exp(-1.2 * dt));
  }

  updateDragon(dt: number) {
    const gAhead = this.groundY(this.dx + LOOK);
    let tx: number, ty: number;
    if (this.mode === 'menu') {
      // di menu, naga terbang anggun menembus gerbang
      let alt = 160 + Math.sin(this.time * 0.55) * 90;
      const ng = this.gates.find((g) => g.x > this.dx - 30 && g.x < this.dx + 480);
      if (ng) alt = (this.groundY(ng.x) - ng.open) * 0.5;
      tx = this.dx + LOOK * 2;
      ty = gAhead - alt;
    } else {
      // mutiara cahaya = posisi mouse/jari di dunia → naga mengejarnya ke arah mana pun, termasuk berbalik ke belakang
      tx = this.camX + this.targetX * this.vw;
      ty = this.aimAssist(this.camY + this.targetFrac * this.vh, dt, tx > this.dx + 80);
    }
    // classic menahan target di atas tanah; ultra & angle boleh menekan ke tanah → BISA MENDARAT & meluncur
    ty = Math.min(ty, this.groundY(tx) + (this.controlMode === 'classic' ? -18 : 8));
    // di dalam gua, target ditahan di bawah langit-langit → naga menyelam masuk mulut gua dengan alami
    if (caveInfo(tx).amt > 0.02) ty = Math.max(ty, caveCeilY(this.groundY(tx), tx) + 44);
    // PANDUAN formasi (visual saja): garis emas ke cincin berikutnya — TIDAK mengubah arah naga.
    // Arah naga 100% mengikuti arahan pemain; cincin hanya memberi boost kecepatan.
    if (this.mode === 'playing' && !this.rolling) {
      this.railT = Math.max(0, this.railT - dt);
      const nx = this.nextRailRing();
      const ok = this.railForm > 0 && this.railT > 0 && !!nx && Math.cos(this.ang) > 0.15;
      this.railW = clamp(this.railW + (ok ? dt / 0.28 : -dt / 0.25), 0, 1);
      if ((this.railT <= 0 || !nx) && this.railW <= 0.02) { this.railForm = 0; this.railW = 0; }
    } else this.railW = 0;
    // mutiara menempel kursor: cepat & tanpa jeda
    const pk = 1 - Math.exp(-(this.angleCtl ? 70 : this.ultra ? 65 : 24) * dt);
    this.pearlX += (tx - this.pearlX) * pk;
    this.pearlY += (ty - this.pearlY) * pk;

    const altNow = this.groundY(this.dx) - this.dy;
    // ULTRA: tanpa batas daya angkat & tanpa kerucut mogok — kepala bebas menunjuk ke mana saja
    const lift = this.ultra ? 1 : clamp((this.spd - 90) / 150, 0, 1);
    let sinMin = this.ultra ? -1 : lerp(0.12, -1, lift);
    if (altNow > 2500) sinMin = Math.max(sinMin, lerp(-1, 0.6, clamp((altNow - 2500) / 400, 0, 1)));
    // kerucut "mogok" di sekitar arah lurus ke atas (lebar saat lambat, hilang saat cepat; tidak ada di ultra)
    const cone = !this.ultra && sinMin > -0.999 ? Math.acos(clamp(-sinMin, -1, 1)) : 0;
    // arah menuju mutiara, dibatasi daya angkat (ultra = langsung ke kursor)
    let vxT = tx - this.dx, vyT = ty - this.dy;
    const distT = Math.hypot(vxT, vyT);
    let tgt = this.ang;
    if (distT > (this.ultra ? 10 : 22)) {
      vxT /= distT; vyT /= distT;
      if (!this.ultra && vyT < sinMin) {
        const hs = Math.abs(vxT) > 0.02 ? Math.sign(vxT) : Math.cos(this.ang) >= 0 ? 1 : -1;
        vyT = sinMin; vxT = hs * Math.sqrt(Math.max(0, 1 - vyT * vyT));
      }
      tgt = Math.atan2(vyT, vxT);
    }
    if (this.rolling) {
      // atraksi: naga berputar membentuk lingkaran penuh
      this.rollT += dt;
      const k = clamp(this.rollT / this.rollDur, 0, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.ang = this.rollStart + this.rollDir * Math.PI * 2 * e;
      this.angVel = 0;
      if (this.loopSrc === 'star') this.spd += 40 * dt;
      if (k >= 1) { if (this.loopSrc === 'star') this.endRoll(); else this.completeLoop(); }
    } else if (this.angleCtl && this.mode === 'playing') {
      // MODE SUDUT: kepala menunjuk langsung ke arah kursor — tanpa batas, tanpa ragu, bisa mendarat
      const dA = this.wrapAng(tgt - this.ang);
      const kA = 1 - Math.exp(-18 * this.steer * dt);
      this.ang = this.wrapAng(this.ang + dA * kA);
      this.angVel = dA * 14; // untuk ayunan sayap & deteksi meliuk
      this.turnDir = 0;
      this.weaveE = this.weaveE * Math.exp(-1.6 * dt) + Math.abs(this.angVel) * dt;
      if (this.weaveE > 3.2) { this.weaveE = 0; this.autoFlip('weave'); }
    } else {
      let d = this.wrapAng(tgt - this.ang);
      const intoGround = Math.cos(this.ang) >= 0 ? 1 : -1; // arah putar yang menukikkan hidung
      // belokan besar (berbalik arah): pilih satu arah putar & pertahankan agar tidak ragu-ragu
      if (Math.abs(d) > 2.2) {
        if (this.turnDir === 0) {
          // dekat tanah → berbalik lewat atas agar tidak menghantam tanah
          this.turnDir = altNow < 170 ? -intoGround : Math.abs(this.angVel) > 0.6 ? Math.sign(this.angVel) : Math.sign(d) || 1;
        }
        if (Math.sign(d) !== this.turnDir) d -= Math.sign(d) * Math.PI * 2;
      } else if (Math.abs(d) < 1.3) this.turnDir = 0;
      // menempel tanah: hanya classic yang belokannya dibatalkan → ultra/angle bebas mendarat
      if (this.controlMode === 'classic' && altNow < 22 && Math.abs(d) > 0.6 && Math.sign(d) === intoGround) { d -= Math.sign(d) * Math.PI * 2; this.turnDir = Math.sign(d); }
      // jangan memutar melewati kerucut mogok → saat lambat naga berbalik lewat bawah sambil menambah kecepatan
      if (cone > 0.01) {
        const e = this.wrapAng(-Math.PI / 2 - this.ang);
        if (Math.sign(e) === Math.sign(d) && Math.abs(e) < Math.abs(d)) { d -= Math.sign(d) * Math.PI * 2; this.turnDir = Math.sign(d); }
      }
      // ULTRA: tolak lembut dari titik batu terdekat di depan → seperti bumper skate, bukan autopilot
      if (this.ultra && this.mode === 'playing') {
        const hx = Math.cos(this.ang), hy = Math.sin(this.ang);
        let px2 = 0, py2 = 0, pw = 0;
        for (const o of this.obstacles) {
          const ox = o.x - this.dx;
          if (ox < -40 || ox > 260) continue;
          for (const poly of o.polys) {
            for (const v of poly) {
              const vx = v.x - this.dx, vy = v.y - this.dy;
              const ahead = vx * hx + vy * hy;
              if (ahead < 0 || ahead > 240) continue;
              const side = -vx * hy + vy * hx;
              const dist = Math.hypot(vx, vy);
              if (dist > 130) continue;
              const k = (1 - dist / 130) * (1 - Math.abs(side) / 130);
              if (k > pw) { pw = k; px2 = -vx / (dist || 1); py2 = -vy / (dist || 1); }
            }
          }
        }
        if (pw > 0.05) {
          const pushAng = Math.atan2(hy + py2 * pw * 1.6, hx + px2 * pw * 1.6);
          const dd = this.wrapAng(pushAng - this.ang);
          d = d * (1 - pw * 0.55) + dd * (pw * 0.55);
        }
      }
      // FISIKA KEMUDI KEK SKATE: sangat responsif, lincah, dan nyaman dikendalikan
      // Tidak mengunci atau mematikan kendali dekat kursor
      d *= lerp(this.ultra ? 0.94 : 0.3, 1, clamp((distT - 12) / 45, 0, 1));
      // Pegas sudut skate yang lincah & bertenaga tinggi
      const st = this.steer * (this.ultra ? 2.0 : 1);
      const maxTurn = clamp((this.ultra ? 8500 : 2300) / Math.max(this.spd, 1), this.ultra ? 8.5 : 3, this.ultra ? 19 : 6.8) * st;

      // Carving instan ala papan skate: kepala naga langsung merespons gerakan tangan
      if (this.ultra && this.mode === 'playing') {
        const snapRate = 1 - Math.exp(-12 * st * dt);
        this.ang = this.wrapAng(this.ang + d * snapRate * 0.45);
        d *= (1 - snapRate * 0.45);
      }

      this.angVel += (d * (this.ultra ? 260 : 64) * st * st - this.angVel * (this.ultra ? 24 : 14.5) * st) * dt;
      this.angVel = clamp(this.angVel, -maxTurn, maxTurn);
      this.ang = this.wrapAng(this.ang + this.angVel * dt);
      // meliuk tajam → penunggang otomatis bersalto
      this.weaveE = this.weaveE * Math.exp(-1.6 * dt) + Math.abs(this.angVel) * dt;
      if (this.weaveE > 3.2) { this.weaveE = 0; this.autoFlip('weave'); }
      // bila kecepatan turun saat menanjak, hidung naga turun keluar dari kerucut mogok
      if (cone > 0.01) {
        const o = this.wrapAng(this.ang + Math.PI / 2);
        if (Math.abs(o) < cone) {
          const side = o !== 0 ? Math.sign(o) : Math.cos(this.ang) >= 0 ? 1 : -1;
          this.ang = this.wrapAng(this.ang + (side * cone - o) * (1 - Math.exp(-6 * dt)));
        }
      }
    }

    // angin langit: di atas awan, naik jauh lebih ringan & naga tak pernah mogok
    const skyK = smooth(clamp((altNow - 380) / 420, 0, 1));
    // tahan untuk melesat: throttle naik perlahan (±2.6 dtk ke penuh), turun perlahan saat dilepas
    const HOLD = this.holding && this.mode === 'playing' && !this.rolling;
    if (HOLD) {
      if (!this.wasHolding) { this.holdT = 0; this.wingKick = 1; this.audio.whoosh(0.9); }
      this.holdT += dt;
      this.throttle = Math.min(1, this.throttle + dt / 2.6);
    } else this.throttle = Math.max(0, this.throttle - dt / 1.5);
    this.wasHolding = HOLD;
    const sA = Math.sin(this.ang);
    // hambatan lembut di kecepatan tinggi agar naga tetap meluncur & melambat bertahap
    const drag = 0.00046 * Math.min(this.spd, 850) ** 2 + Math.max(0, this.spd - 850) * 0.12;
    if (this.ultra && this.mode === 'playing' && !this.rolling) {
      // ULTRA: kecepatan jelajah stabil seperti skate meluncur — menanjak hampir tanpa hukuman
      const cruise = 380;
      this.spd += (cruise - this.spd) * (1 - Math.exp(-0.55 * dt));
      this.spd += ((sA < 0 ? 120 : 300) * sA - drag * 0.55 + 30 + skyK * 22) * dt;
    } else {
      this.spd += ((sA < 0 ? 430 * lerp(1, 0.4, skyK) : 520) * sA - drag + 55 + skyK * 22) * dt;
    }
    if (HOLD) this.spd += lerp(260, 660, this.throttle) * dt;
    // lontaran setelah trik & percepatan saat Aliran Zen
    if (this.trickBoost > 0) { this.trickBoost -= dt; this.spd += 210 * dt; }
    if (this.zen) this.spd += 70 * dt;
    if (skyK > 0 && this.mode === 'playing') this.spd = Math.max(this.spd, lerp(110, 270, skyK));
    if (this.mode === 'playing') this.applyLift(dt);

    // ===== MELESAT BINTANG: hingga 10× =====
    if (this.superT > 0) {
      this.superE += dt;
      // menahan selama lesatan = lesatan bertahan lebih lama (waktunya berkurang 2× lebih lambat)
      this.superT -= dt * (HOLD ? 0.5 : 1);
      if (this.superT <= 0) this.starGrace = 1.1;
      // kurva-S halus dari kecepatan awal menuju 10× — terasa kuat namun bertahap, bukan teleport
      const tgtV = lerp(this.superV0, STAR_MAX, smooth(clamp(this.superE / 1.6, 0, 1)));
      this.starV += (tgtV - this.starV) * (1 - Math.exp(-7 * dt));
      this.spd = Math.max(this.spd, this.starV);
      if (!this.maxPop && this.spd > STAR_MAX * 0.97) {
        this.maxPop = true;
        this.audio.whoosh(1.8);
        this.shake = Math.max(this.shake, 2.5);
        this.texts.push({ x: this.dx + 60, y: this.dy - 60, text: '×10 ✦', life: 1.6, big: true });
      }
      for (let k = 0; k < 2 && this.body.length > 10; k++) {
        const b = this.body[Math.floor(Math.random() * this.body.length)];
        this.parts.push({ x: b.x, y: b.y, vx: rand(-80, -10), vy: rand(-20, 20), life: 0.9, max: 0.9, size: rand(1.4, 3), color: 'starlight', kind: 12, ph: Math.random() * 6 });
      }
    }

    const g = this.groundY(this.dx);
    const alt = g - this.dy;
    // Tukikan Elang: menukik tajam & cepat, lalu menyusur tanah
    if (this.mode === 'playing' && !this.rolling) {
      if (Math.sin(this.ang) > 0.66 && this.spd > 420 && alt > 70) this.diveT += dt;
      else if (this.diveT > 0) { if (this.diveT > 0.42) this.diveWin = 1.2; this.diveT = 0; }
      if (this.diveWin > 0) {
        this.diveWin -= dt;
        if (alt < 46) {
          this.diveWin = 0; this.dives++; this.trickBoost = 0.6;
          this.flowEvent('Tukikan Elang', 120, true);
          this.texts.push({ x: this.dx, y: this.dy - 44, text: 'Tukikan Elang ✦', life: 1.4, big: true });
        }
      }
    }
    if (alt < 48) {
      const f = 1 - clamp(alt, 0, 48) / 48;
      this.spd += 90 * f * dt;
      this.skimT += dt;
      if (this.mode === 'playing') { this.ringScore += f * dt * 12; this.skimTotal += dt; }
      if (Math.random() < 0.8) {
        this.parts.push({ x: this.dx - 6, y: g - 2, vx: rand(-140, -40), vy: rand(-90, -20), life: 0.8, max: 0.8, size: rand(1.5, 3.2), color: 'spray', kind: 1, ph: 0 });
      }
      if (this.skimT > 0.4 && !this.skimShown && this.mode === 'playing') {
        this.skimShown = true;
        this.texts.push({ x: this.dx, y: this.dy - 40, text: 'Selancar Angin ✦', life: 1.4, big: false });
        this.ringScore += 5;
        this.flowEvent('Selancar Angin', 30, false);
      }
    } else { this.skimT = 0; this.skimShown = false; }

    if (this.boost > 0) { this.boost -= dt; this.spd += 110 * dt; }
    // jejak khas skin
    this.trailT += dt * (this.boost > 0 ? 60 : 9);
    while (this.trailT > 1 && this.body.length > 10) {
      this.trailT -= 1;
      const b = this.boost > 0 ? this.body[Math.floor(Math.random() * this.body.length)] : this.body[this.body.length - 1 - Math.floor(Math.random() * 4)];
      const tr = this.skin.trail;
      const sway = tr === 'leaf' || tr === 'petal';
      const life = tr === 'cloud' ? 1.3 : sway ? 1.6 : 0.9;
      const size = tr === 'cloud' ? rand(3.5, 6) : rand(1.4, 2.8) * (sway ? 1.4 : 1);
      this.parts.push({ x: b.x, y: b.y, vx: rand(-60, 0), vy: rand(-25, 25) + (tr === 'ember' ? -25 : 0), life, max: life, size, color: 'trail-' + tr, kind: sway ? 3 : 0, ph: Math.random() * 6 });
    }
    // batas kecepatan: tahan biasa maks 5× · Melesat Bintang (termasuk sambil menahan) maks 10×.
    // kelebihan kecepatan meluruh perlahan (tidak berhenti mendadak)
    const cap = this.superT > 0 ? STAR_MAX : Math.max(900, lerp(900, MAX_HOLD, this.throttle), this.zen ? 1150 : 0);
    if (this.spd > cap) this.spd -= (this.spd - cap) * (1 - Math.exp(-(HOLD ? 1.6 : 0.9) * dt));
    // kecepatan minimum lebih tinggi → naga selalu punya tenaga untuk meliuk & menanjak
    this.spd = clamp(this.spd, this.mode === 'playing' ? (this.ultra ? 270 : 200) : 110, STAR_MAX);

    const px = this.dx;
    this.dx += Math.cos(this.ang) * this.spd * dt;
    this.dy += Math.sin(this.ang) * this.spd * dt;

    const g2 = this.groundY(this.dx);
    if (this.dy > g2 - 9) {
      this.dy = g2 - 9;
      // menyentuh tanah di akhir putaran = mendarat mulus; hanya awal putaran yang dianggap kasar
      if (this.rolling && this.loopSrc === 'player' && this.rollT / this.rollDur < 0.55) this.crashLanding();
      if (!this.rolling) {
        // meluncur menyusuri permukaan ke kanan maupun ke kiri: komponen gerak yang menembus tanah dihapus
        const sl = Math.atan2(this.groundY(this.dx + 6) - this.groundY(this.dx - 6), 12);
        const gnx = Math.sin(sl), gny = -Math.cos(sl);
        const hvx = Math.cos(this.ang), hvy = Math.sin(this.ang);
        const vn = hvx * gnx + hvy * gny;
        if (vn < 0) {
          const tvx = hvx - vn * gnx, tvy = hvy - vn * gny;
          this.ang = Math.hypot(tvx, tvy) > 0.05 ? Math.atan2(tvy, tvx) : hvx >= 0 ? sl : this.wrapAng(sl + Math.PI);
          if (Math.sign(this.angVel) === (Math.cos(this.ang) >= 0 ? 1 : -1)) this.angVel = 0;
        }
      }
    }
    // langit-langit gua: naga meluncur di bawahnya (tanpa damage — zen)
    if (caveInfo(this.dx).amt > 0.02 && !this.rolling) {
      const ceil = caveCeilY(this.groundY(this.dx), this.dx) + 12;
      if (this.dy < ceil) {
        this.dy = ceil;
        const sl = Math.atan2(caveCeilY(this.groundY(this.dx + 6), this.dx + 6) - caveCeilY(this.groundY(this.dx - 6), this.dx - 6), 12);
        const cnx = -Math.sin(sl), cny = Math.cos(sl);
        const hvx = Math.cos(this.ang), hvy = Math.sin(this.ang);
        const vn = hvx * cnx + hvy * cny;
        if (vn < 0) {
          const tvx = hvx - vn * cnx, tvy = hvy - vn * cny;
          if (Math.hypot(tvx, tvy) > 0.05) this.ang = Math.atan2(tvy, tvx);
          this.angVel *= 0.4;
          if (this.mode === 'playing' && Math.random() < 0.5) {
            this.parts.push({ x: this.dx + 6, y: ceil + 2, vx: rand(-60, 60), vy: rand(20, 80), life: 0.7, max: 0.7, size: rand(1.5, 3), color: 'spray', kind: 1, ph: 0 });
          }
        }
      }
    }

    // arah hadap: saat naga berbalik arah (bukan saat atraksi putar), tubuh berguling 180° agar punggung tetap di atas
    if (!this.rolling) {
      const c = Math.cos(this.ang);
      if ((this.facing > 0 && c < -0.3) || (this.facing < 0 && c > 0.3)) {
        this.faceT += dt;
        if (this.faceT > 0.14) { this.facing = -this.facing; this.faceT = 0; this.autoFlip('turn'); }
      } else this.faceT = 0;
    }
    this.roll += clamp((this.facing > 0 ? 0 : Math.PI) - this.roll, -dt * 7.5, dt * 7.5);

    // riwayat lintasan (+ sudut guling) dengan sub-langkah → tubuh meliuk halus & guling merambat dari kepala ke ekor
    const h0 = this.hist[0];
    if (!h0) this.hist.unshift({ x: this.dx, y: this.dy, r: this.roll });
    else {
      const hd = Math.hypot(this.dx - h0.x, this.dy - h0.y);
      if (hd > 2) {
        const n = Math.min(16, Math.ceil(hd / 8));
        for (let k = 1; k <= n; k++) this.hist.unshift({ x: lerp(h0.x, this.dx, k / n), y: lerp(h0.y, this.dy, k / n), r: lerp(h0.r, this.roll, k / n) });
      } else h0.r = this.roll;
    }
    if (this.hist.length > 400) this.hist.length = 400;
    this.computeBody();

    // sayap bereaksi: kepak kuat saat naik, melipat saat menukik, mengembang saat menarik tajam,
    // terbentang saat atraksi, kepakan dramatis lalu pose meluncur saat melesat
    this.wingKick = Math.max(0, this.wingKick - dt * 1.6);
    const sW = Math.sin(this.ang), hdir = Math.cos(this.ang) >= 0 ? 1 : -1;
    const climb = clamp(-sW / 0.52, 0, 1);
    const dive = clamp((sW - 0.2) / 0.48, 0, 1);
    const flare = clamp((-this.angVel * hdir) / 2.2, 0, 1);
    let fT = dive * (1 - flare);
    let aT = lerp(0.22, 0.95, climb) * (1 - fT * 0.7) + flare * 0.5 + (this.boost > 0 ? 0.15 : 0) + this.liftE * 0.3;
    let rate = 1 + climb * 2.2 + (this.boost > 0 ? 0.8 : 0) + flare;
    // terbang cepat: sayap ditarik sedikit ke belakang
    const fastW = clamp((this.spd - 520) / 420, 0, 1);
    fT = Math.max(fT, fastW * 0.42); aT *= 1 - fastW * 0.35;
    if (alt < 48) fT = Math.max(fT, 0.35);
    if (this.rolling) { const kick = this.loopSrc === 'player' && this.rollT < 0.28; fT = 0; aT = kick ? 1.1 : 0.32; rate = kick ? 3.2 : 0.6; }
    else if (this.superT > 0 && this.superE < 0.75) { fT = 0; aT = 1.15; rate = 3.4; } // kepakan kuat dramatis
    else if (this.superT > 0) { fT = 0.72; aT = 0.1; rate = 1.4; } // pose meluncur berkecepatan tinggi
    else if (this.throttle > 0.02) {
      if (this.holding && this.holdT < 0.6) { fT = 0; aT = 1; rate = 3.2; }
      else { fT = Math.max(fT, lerp(0.3, 0.74, this.throttle)); aT = lerp(aT, 0.1, this.throttle); rate = lerp(rate, 1.3, this.throttle); }
    }
    aT += this.wingKick * 0.7; rate += this.wingKick * 2.5;
    const wk = 1 - Math.exp(-5 * dt);
    this.wingFold += (fT - this.wingFold) * wk;
    this.wingAmp += (aT - this.wingAmp) * wk;
    this.wingPhase += dt * Math.PI * 2 * rate;

    // penunggang (active ragdoll) duduk di pangkal leher & menggenggam surai — merunduk saat melesat
    this.geo = dragonGeo(this.body, this.time, this.spd);
    // kerangka duduk ikut guling tubuh → penunggang tetap di punggung saat naga berbalik arah
    const twN = this.twistNow();
    const sfB = seatFrame(this.geo), sfT = twN ? seatFrame(twistGeo(this.geo, twN)) : sfB;
    const crS = twN ? Math.cos(twN[4] || 0) : 1;
    const sf = { seat: sfT.seat, grip: sfT.grip, f: sfB.f, u: crS >= 0 ? sfB.u : { x: -sfB.u.x, y: -sfB.u.y } };
    const lean = 0.45 + clamp(Math.sin(this.ang), -0.6, 1) * 0.35 + clamp((this.spd - 320) / 500, 0, 1) * 0.22
      - (this.boost > 1 ? 0.1 : 0) + this.throttle * 0.22 + (this.superT > 0 ? 0.25 : 0);
    this.rider.update(dt, { ...sf, lean }, { ground: (x: number) => this.groundY(x), wind: { x: 0, y: 0 } });

    if (this.mode !== 'playing') return;
    this.cloudPhysics(dt);

    for (const r of this.rings) {
      if (r.state !== 0) continue;
      // melintasi garis cincin dari arah mana pun (maju maupun saat meliuk ke belakang)
      if ((px - r.x) * (this.dx - r.x) <= 0 && px !== this.dx) {
        const dy = Math.abs(this.dy - r.y);
        if (dy < r.r * 1.35) this.collect(r, dy);
        else if (dy < 260 && this.dx > px) {
          r.state = 2; r.t = 0; this.combo = 0;
          if (r.form === this.railForm) { this.railForm = 0; this.railW = 0; this.railT = 0; }
        }
      }
    }
    // gerbang: tidak ada tabrakan — terbang di bawah balok (dan di atas lantai pulau) = menembus gerbang
    for (const g of this.gates) {
      if (g.state !== 0) continue;
      if ((px - g.x) * (this.dx - g.x) <= 0 && px !== this.dx) {
        const bottom = g.floor ?? Infinity;
        const mid = g.floor !== undefined ? (g.open + g.floor) / 2 : g.open;
        if (this.dy > g.open - 8 && this.dy < bottom + 6) this.passGate(g);
        else if (Math.abs(this.dy - mid) < 320 && this.dx > px) { g.state = 2; g.t = 0; this.gateStreak = 0; }
      }
    }

    const starSafe = this.superT > 0 || this.starGrace > 0;
    const safe = (this.rolling && this.loopSrc === 'star') || starSafe || this.invuln > 0;
    const head = { x: this.dx, y: this.dy };
    // nyaris menyerempet batu = trik keahlian berisiko
    for (const o of this.obstacles) {
      if (o.passed) continue;
      if (!safe && !o.near && Math.abs(o.x - head.x) < o.w + 40) {
        for (const p of o.polys) if (polyDist(head, p) < 26) { o.near = true; break; }
      }
      // dihitung saat naga keluar dari rentang batu ke arah mana pun
      if (o.near && Math.abs(this.dx - o.x) > o.w + 6) {
        o.passed = true;
        this.nears++; this.spd += 45; this.wingKick = Math.max(this.wingKick, 0.6);
        this.flowEvent('Nyaris!', 60, true);
        this.texts.push({ x: this.dx, y: this.dy - 40, text: 'Nyaris! ✦', life: 1.2, big: true });
      }
    }
    if (safe) {
      // saat Melesat Bintang, naga menembus batu dengan percikan cahaya
      if (starSafe) {
        for (const o of this.obstacles) {
          if (o.smashed || Math.abs(o.x - head.x) > o.w + 12) continue;
          if (!o.polys.some((p) => hitPoly(head, 8, p))) continue;
          o.smashed = true;
          this.shake = Math.max(this.shake, 3);
          this.ringScore += 15;
          this.audio.puff();
          for (let i = 0; i < 18; i++) {
            const a = Math.random() * Math.PI * 2, s = rand(60, 240);
            this.parts.push({ x: head.x, y: head.y, vx: Math.cos(a) * s + this.spd * 0.2, vy: Math.sin(a) * s, life: rand(0.5, 1), max: 1, size: rand(1.4, 3), color: 'starlight', kind: 12, ph: Math.random() * 6 });
          }
          this.texts.push({ x: head.x, y: head.y - 40, text: 'Tembus! ✦', life: 1, big: false });
        }
      }
      return;
    }
    for (const o of this.obstacles) {
      if (Math.abs(o.x - head.x) > o.w + 10) continue;
      for (const p of o.polys) if (hitPoly(head, 4.5, p)) { this.hit(); return; }
    }
  }

  // ================= BALON UDARA BESAR =================
  updateBalloons(dt: number) {
    this.flipCd = Math.max(0, this.flipCd - dt);
    this.bounceT = Math.max(0, this.bounceT - dt);
    if (this.bounceT <= 0) this.bounceStreak = 0;
    this.balloonT -= dt;
    if (this.balloonT <= 0 && this.mode !== 'dead') {
      // muncul di ketinggian tempat pemain terbang; kadang berkelompok → pantulan beruntun
      this.balloonT = this.mode === 'menu' ? rand(9, 14) : rand(5, 8.5);
      const bx = this.camX + this.vw + rand(220, 480);
      if (caveInfo(bx).amt <= 0.2) {
        const n = this.mode === 'playing' && Math.random() < 0.38 ? 2 + Math.floor(Math.random() * 2) : 1;
        const alt = this.mode === 'menu' ? rand(210, 320) : clamp(this.altS + rand(-150, 230), 190, 2000);
        for (let k = 0; k < n; k++) {
          const x = bx + k * rand(240, 310);
          const r = rand(60, 86) * (Math.random() < 0.18 ? 1.3 : 1);
          this.balloons.push(makeBalloon(x, this.groundY(x) - alt - (k % 2 ? rand(40, 110) : 0), r));
        }
      }
    }
    for (const b of this.balloons) {
      b.x += b.vx * dt;
      b.cd = Math.max(0, b.cd - dt);
      b.sqT += dt;
      b.sq *= Math.exp(-3 * dt);
      const gmin = this.groundY(b.x) - b.r * 1.9;
      if (b.y > gmin) b.y = gmin;
    }
    this.balloons = this.balloons.filter((b) => b.x > this.cutX - 200 && b.x < this.camX + this.vw + 3000);
    if (this.mode !== 'playing' || this.superT > 0) return;
    for (const b of this.balloons) {
      if (b.cd > 0) continue;
      const cx = b.x, cy = b.y + balloonBob(b, this.time) - 0.1 * b.r;
      const ddx = this.dx - cx, ddy = this.dy - cy, dist = Math.hypot(ddx, ddy), R = b.r * 0.98 + 6;
      if (dist > R || dist < 0.001) continue;
      this.bounceBalloon(b, ddx / dist, ddy / dist, cx, cy, R);
      break;
    }
  }

  // memantul di amplop balon: arah dipantulkan + dorongan ke atas, balon bergoyang, penunggang bersalto
  bounceBalloon(b: Balloon, nx: number, ny: number, cx: number, cy: number, R: number) {
    const vx = Math.cos(this.ang), vy = Math.sin(this.ang);
    const vn = vx * nx + vy * ny;
    let rx = vx, ry = vy;
    if (vn < 0) { rx = vx - 2 * vn * nx; ry = vy - 2 * vn * ny; }
    rx += nx * 0.55; ry += ny * 0.55 - 0.4;
    this.ang = Math.atan2(ry, rx); this.angVel = 0; this.turnDir = 0;
    this.dx = cx + nx * (R + 1); this.dy = cy + ny * (R + 1);
    this.spd = Math.max(this.spd * 1.04, 380) + 120;
    b.cd = 0.6; b.sq = 1; b.sqT = 0;
    this.bounceStreak = this.bounceT > 0 ? this.bounceStreak + 1 : 1;
    this.bounceT = 3.2;
    this.balloonsHit++;
    const pts = 40 * Math.min(this.bounceStreak, 6);
    this.ringScore += pts;
    this.wingKick = 1;
    this.shake = Math.max(this.shake, 2);
    this.audio.bounce(this.bounceStreak);
    const nm = this.bounceStreak > 1 ? `Pantulan Balon ×${this.bounceStreak}` : 'Pantulan Balon';
    this.flowEvent(nm, 60, true);
    this.texts.push({ x: cx, y: cy - b.r - 24, text: `${nm} ✦`, life: 1.3, big: true });
    this.texts.push({ x: cx, y: cy - b.r, text: `+${pts}`, life: 1.1, big: false });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(40, 180);
      this.parts.push({ x: cx + nx * R, y: cy + ny * R, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.5, 1), max: 1, size: rand(1.4, 3), color: 'gold', kind: 0, ph: 0 });
    }
    this.autoFlip('bounce');
  }

  // ================= SALTO PENUNGGANG OTOMATIS =================
  autoFlip(reason: 'turn' | 'weave' | 'bounce' | 'gate' | 'star' | 'demo') {
    if (this.flipCd > 0 || this.rolling || this.mode === 'dead' || this.rider.mode !== 'ride') return;
    const fast = this.spd > 640;
    let n = fast ? 2 : 1;
    if (reason === 'bounce' || reason === 'star') n = fast ? 3 : 2;
    const front = (reason === 'weave' || reason === 'demo') && Math.random() < 0.35;
    if (this.rider.startFlip(n, front)) {
      this.flipCd = 1.4 + 0.36 * n;
      this.audio.whoosh(0.5);
    }
  }

  riderLanded(n: number, front: boolean) {
    if (this.mode !== 'playing') return;
    this.riderFlips += n;
    const name = front ? (n > 1 ? `Salto Depan ×${n}` : 'Salto Depan') : n === 1 ? 'Salto Penunggang' : n === 2 ? 'Salto Ganda' : 'Salto Tiga Kali';
    this.flowEvent(name, 70 * n, true);
    const p = this.rider.p[0];
    this.texts.push({ x: p ? p.x : this.dx, y: (p ? p.y : this.dy) - 26, text: `${name} ✦`, life: 1.3, big: true });
  }

  // cincin berikutnya dalam formasi yang sedang diikuti (paling dekat di depan naga)
  nextRailRing() {
    if (this.railForm <= 0) return null;
    let best = null as null | { x: number; y: number };
    for (const r of this.rings) {
      if (r.form !== this.railForm || r.state !== 0) continue;
      const ax = r.x - this.dx;
      if (ax < -60 || ax > 1100) continue;
      if (!best || r.x < best.x) best = r;
    }
    return best;
  }

  // bantuan bidik: HANYA magnet lembut ke bintang jatuh langka.
  // Cincin & gerbang TIDAK menarik bidikan — arah naga murni mengikuti arahan pemain,
  // jadi tidak ada belokan aneh saat mendekati atau mengambil cincin.
  aimAssist(ty: number, dt: number, active = true) {
    let best = 0, by = ty;
    if (active && this.mode === 'playing' && !this.rolling) {
      const R = Math.max(340, this.spd * 0.6);
      const s = this.star;
      if (s) {
        const ax = s.x - this.dx;
        if (ax > -30 && ax < R + 280 && Math.abs(s.y - ty) < 300) { best = 0.55; by = s.y; }
      }
    }
    this.assistOff += ((by - ty) * best - this.assistOff) * (1 - Math.exp(-9 * dt));
    return ty + this.assistOff;
  }

  // tabrakan ringan: selama masih punya hati, naga hanya terpental & kebal sejenak
  // ULTRA: aliran & kombo tidak hangus, kebal lebih lama, pantulan lebih kuat
  hit() {
    if (!this.ultra) this.loseFlow();
    this.rolling = false; this.loopCount = 0; this.trickHeld = false;
    this.ang = this.wrapAng(this.ang); this.angVel = 0;
    this.hitX = this.maxDx;
    for (const o of this.obstacles) if (Math.abs(o.x - this.dx) < o.w + 80) o.near = false;
    if (this.lives <= 1) { this.lives = 0; this.crash(); return; }
    this.lives--;
    this.invuln = this.ultra ? 3.2 : 2.2;
    this.spd = Math.max(this.spd * (this.ultra ? 0.9 : 0.8), this.ultra ? 320 : 280);
    // terpental ke atas searah arah terbang saat ini (kanan maupun kiri)
    this.ang = Math.atan2(this.ultra ? -0.62 : -0.47, Math.cos(this.ang) >= 0 ? 0.88 : -0.88); this.angVel = 0;
    if (!this.ultra) this.combo = 0;
    this.shake = 6; this.wingKick = 1;
    this.audio.thud(0.7);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * 6.28, s = rand(40, 160);
      this.parts.push({ x: this.dx, y: this.dy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.9, max: 0.9, size: rand(1.5, 3), color: 'trail-' + this.skin.trail, kind: 0, ph: Math.random() * 6 });
    }
    this.texts.push({ x: this.dx, y: this.dy - 46, text: `Hampir! ♥ ${this.lives}`, life: 1.6, big: true });
  }

  // kawanan burung muncul di ketinggian tempat pemain terbang (darat maupun langit)
  updateBirds(dt: number) {
    this.flockT -= dt;
    if (this.flockT <= 0) {
      this.flockT = this.mode === 'menu' ? rand(7, 11) : rand(4.5, 8);
      const fx = this.camX + this.vw + rand(80, 320), G = this.groundY(fx);
      if (caveInfo(fx).amt <= 0.2) {
        const alt = this.mode === 'menu' ? rand(170, 300) : clamp(this.altS + rand(-220, 220), 130, 2200);
        const B = BIOMES[this.biomeInfo(fx).dom];
        const type: BirdType = alt > 750 ? (Math.random() < 0.55 ? 'merpati' : 'bangau')
          : B.weather === 'sand' || B.weather === 'ember' ? (Math.random() < 0.75 ? 'walet' : 'bangau')
          : Math.random() < 0.6 ? 'bangau' : 'walet';
        this.flocks.push(makeFlock(fx, G - alt, type));
      }
    }
    for (const f of this.flocks) {
      if (updateFlock(f, dt, this.dx, this.dy) && this.mode === 'playing') {
        this.birdsMet++;
        this.ringScore += 20;
        this.audio.chirp();
        this.flowEvent('Kawan Burung', 40, false);
        this.texts.push({ x: this.dx, y: this.dy - 40, text: 'Terbang Bersama Burung ✦ +20', life: 1.6, big: false });
      }
    }
    this.flocks = this.flocks.filter((f) => f.x > this.camX - 400 && f.x < this.camX + this.vw + 3000);
  }

  passGate(g: Gate) {
    g.state = 1; g.t = 0;
    this.gatesPassed++;
    this.gateStreak++;
    const pts = 25 * Math.min(this.gateStreak, 8);
    this.ringScore += pts;
    this.spd += 85;
    this.boost = Math.max(this.boost, 1.2);
    this.audio.gate(this.gateStreak);
    this.wingKick = 1;
    this.flowEvent('Gerbang', 40, false);
    this.rider.cheer = 0.75;
    if (Math.random() < 0.5) this.autoFlip('gate');
    const G0 = g.floor ?? this.groundY(g.x);
    for (let i = 0; i < 30; i++) {
      const z = rand(-g.D, g.D) * 0.9;
      const y = lerp(g.open, G0, Math.random());
      this.parts.push({ x: g.x + KX * z, y: y + KY * z, vx: rand(30, 200), vy: rand(-70, 50), life: rand(0.6, 1.2), max: 1.2, size: rand(1.4, 3.2), color: 'gold', kind: 0, ph: 0 });
    }
    this.texts.push({ x: g.x, y: g.open - 104, text: this.gateStreak > 1 ? `Gerbang ×${this.gateStreak}` : 'Gerbang ✦', life: 1.3, big: true });
    this.texts.push({ x: g.x, y: g.open - 80, text: `+${pts}`, life: 1.1, big: false });
  }

  collect(r: Ring, dy: number) {
    r.state = 1; r.t = 0;
    this.combo++; this.ringCount++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    // tandai formasi aktif untuk PANDUAN VISUAL saja (garis emas) — arah naga tidak diubah sama sekali
    if (r.form !== undefined) {
      if (this.railForm !== r.form) { this.railTX = r.x; this.railTY = r.y; }
      this.railForm = r.form; this.railT = 5;
    }
    const perfect = dy < r.r * 0.42;
    this.spd += perfect ? 150 : 105;
    this.boost = perfect ? 1.8 : 1.3;
    this.wingKick = 1;
    this.flowEvent(perfect ? 'Cincin Sempurna' : 'Cincin', perfect ? 30 : 12, perfect);
    const pts = 10 * this.combo + (perfect ? 15 : 0);
    this.ringScore += pts;
    if (perfect) { this.perfects++; this.rider.cheer = Math.max(this.rider.cheer, 0.5); }
    this.audio.ring(this.combo - 1, perfect);
    if (this.combo % 5 === 0) this.audio.whoosh(0.8);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(60, 230);
      this.parts.push({ x: r.x, y: r.y + rand(-r.r, r.r) * 0.8, vx: Math.cos(a) * s + 80, vy: Math.sin(a) * s, life: rand(0.5, 1), max: 1, size: rand(1.5, 3.2), color: 'gold', kind: 0, ph: 0 });
    }
    this.texts.push({ x: r.x, y: r.y - r.r - 10, text: `+${pts}`, life: 1.1, big: false });
    if (perfect) this.texts.push({ x: r.x + 10, y: r.y - r.r - 36, text: 'Sempurna!', life: 1.3, big: true });
    else if (this.combo >= 3) this.texts.push({ x: r.x + 10, y: r.y - r.r - 36, text: `Kombo ×${this.combo}`, life: 1.2, big: true });
  }

  crash() {
    if (this.mode !== 'playing') return;
    this.frozen = this.runStats();
    this.deadRoll = this.bodyRoll.slice();
    this.mode = 'dead';
    this.slowmo = 0.3; this.shake = 14;
    this.audio.crash();
    const vx = Math.cos(this.ang) * this.spd, vy = Math.sin(this.ang) * this.spd;
    // penunggang terlempar → ragdoll penuh
    this.rider.release({ x: -vx * 0.15, y: -190 - this.spd * 0.12 }, 120 + this.spd * 0.25);
    // tubuh naga menjadi rantai lentur yang jatuh & meluncur
    const src = this.geo ? this.geo.pts : this.body;
    this.chain = src.map((b, i) => ({
      x: b.x, y: b.y, ox: b.x, oy: b.y,
      vx: vx * (0.5 - i * 0.008), vy: vy * 0.5 - 60,
      r: Math.max(2, (this.geo ? this.geo.w[i] : 6) * 0.7), im: 1,
    }));
    for (const b of this.body) {
      if (Math.random() < 0.5) continue;
      const a = Math.random() * Math.PI * 2, s = rand(40, 200);
      this.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(0.8, 1.8), max: 1.8, size: rand(1.5, 3.5), color: Math.random() < 0.5 ? 'red' : 'gold', kind: 4, ph: Math.random() * 6 });
    }
  }

  physWorld(): PhysWorld {
    const solids: Vec[][] = [];
    for (const o of this.obstacles) {
      if (o.x + o.w < this.camX - 150 || o.x - o.w > this.camX + this.vw + 150) continue;
      for (const p of o.polys) solids.push(p);
    }
    return { ground: (x: number) => this.groundY(x), solids, wind: { x: 0, y: 0 } };
  }

  impact(x: number, y: number, v: number) {
    if (this.thudCd > 0 || v < 200) return;
    this.thudCd = 0.22;
    this.audio.thud(clamp(v / 600, 0.3, 1));
    this.shake = Math.max(this.shake, clamp(v / 120, 1.5, 5));
    for (let i = 0; i < 12; i++) {
      this.parts.push({ x: x + rand(-6, 6), y: Math.min(y, this.groundY(x)) - 2, vx: rand(-110, 110), vy: rand(-130, -30), life: 0.8, max: 0.8, size: rand(1.5, 3.2), color: 'spray', kind: 1, ph: 0 });
    }
  }

  updateRagdolls(dt: number) {
    if (dt <= 0) return;
    this.thudCd = Math.max(0, this.thudCd - dt);
    const w = this.physWorld();
    const pl = this.rider.p[2], hd = this.rider.p[0];
    const vb = pl ? Math.max(pl.vy, hd.vy) : 0;
    this.rider.update(dt, null, w);
    if (pl && vb > 200 && Math.max(pl.vy, hd.vy) < vb * 0.4) this.impact(pl.x, pl.y + 3, vb);
    const c = this.chain;
    if (!c) return;
    const cb = c[0].vy;
    const damp = Math.exp(-0.3 * dt);
    for (const q of c) {
      q.ox = q.x; q.oy = q.y;
      q.vx *= damp; q.vy = q.vy * damp + 800 * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let it = 0; it < 6; it++) {
      for (let i = 1; i < c.length; i++) solveDist(c[i - 1], c[i], 6.6, 6.6);
      for (let i = 2; i < c.length; i++) solveDist(c[i - 2], c[i], 10.5, 13.2);
      for (const q of c) collidePoint(q, w, 0);
    }
    for (const q of c) collidePoint(q, w, 0.18);
    for (const q of c) { q.vx = (q.x - q.ox) / dt; q.vy = (q.y - q.oy) / dt; }
    if (cb > 220 && c[0].vy < cb * 0.4) this.impact(c[0].x, c[0].y + 6, cb);
  }

  computeBody() {
    const N = BODY_N, S = 6.6;
    const body: Vec[] = [{ x: this.dx, y: this.dy }];
    const roll: number[] = [this.roll];
    let prev: HP = { x: this.dx, y: this.dy, r: this.roll };
    let remain = S;
    for (const p of this.hist) {
      let sx = prev.x, sy = prev.y, sr = prev.r;
      let segLen = Math.hypot(p.x - sx, p.y - sy);
      while (segLen >= remain && body.length < N) {
        const t = remain / segLen;
        sx += (p.x - sx) * t; sy += (p.y - sy) * t; sr += (p.r - sr) * t;
        body.push({ x: sx, y: sy });
        roll.push(sr);
        segLen -= remain; remain = S;
      }
      remain -= segLen;
      prev = p;
      if (body.length >= N) break;
    }
    while (body.length < N) { const l = body[body.length - 1]; body.push({ x: l.x - S, y: l.y }); roll.push(roll[roll.length - 1]); }
    this.body = body;
    this.bodyRoll = roll;
  }

  // puntiran total per ruas = guling arah hadap (merambat dari kepala ke ekor) + Pusaran Naga
  twistNow(): number[] | undefined {
    const R = this.bodyRoll, Sp = this.twistArr;
    let any = !!Sp;
    if (!any) for (let i = 0; i < R.length; i++) if (Math.abs(R[i]) > 0.002) { any = true; break; }
    if (!any) return undefined;
    const out: number[] = new Array<number>(BODY_N);
    for (let i = 0; i < BODY_N; i++) out[i] = (R[i] || 0) + (Sp ? Sp[i] || 0 : 0);
    return out;
  }

  updateParticles(dt: number) {
    const info = this.biomeInfo(this.dx + 200);
    const weather = BIOMES[info.dom].weather;
    const cx = this.camX, cy = this.camY;
    const spawn = (rate: number, fn: () => void) => {
      let n = rate * dt;
      while (n > 0) { if (Math.random() < n) fn(); n -= 1; }
    };
    const VW = this.vw, VH = this.vh;
    const anywhere = () => ({ x: cx + rand(0, VW + 250), y: cy + rand(-40, VH) });
    switch (weather) {
      case 'petal':
        spawn(8, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-70, -25), vy: rand(15, 40), life: 7, max: 7, size: rand(2.2, 3.8), color: 'petal', kind: 3, ph: Math.random() * 6 }); });
        break;
      case 'sand':
        spawn(8, () => this.parts.push({ x: cx + VW + rand(0, 80), y: cy + rand(80, VH), vx: -rand(380, 600), vy: rand(-10, 10), life: 2.4, max: 2.4, size: rand(8, 26), color: 'sand', kind: 8, ph: 0 }));
        break;
      case 'ember':
        spawn(5, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-20, 0), vy: rand(-50, -20), life: 5, max: 5, size: rand(1.2, 2.4), color: 'ember', kind: 9, ph: Math.random() * 6 }); });
        break;
      case 'firefly':
        spawn(3.5, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-15, 15), vy: rand(-10, 10), life: 6, max: 6, size: rand(1.2, 2.2), color: 'fly', kind: 2, ph: Math.random() * 6 }); });
        spawn(2.5, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-60, -20), vy: rand(10, 30), life: 7, max: 7, size: rand(3, 4.5), color: 'leaf', kind: 3, ph: Math.random() * 6 }); });
        break;
      case 'snow':
        spawn(14, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-70, -25), vy: rand(25, 60), life: 6, max: 6, size: rand(1, 2.6), color: 'snow', kind: 7, ph: Math.random() * 6 }); });
        break;
      case 'night':
        spawn(3.5, () => { const p = anywhere(); this.parts.push({ ...p, vx: rand(-15, 15), vy: rand(-10, 10), life: 6, max: 6, size: rand(1.2, 2.2), color: 'fly', kind: 2, ph: Math.random() * 6 }); });
        spawn(0.8, () => { const x = cx + rand(VW * 0.4, VW + 200); this.parts.push({ x, y: this.groundY(x) - rand(10, 60), vx: 0, vy: rand(-22, -12), life: 22, max: 22, size: rand(3, 5), color: 'lantern', kind: 5, ph: Math.random() * 6 }); });
        break;
    }
    // garis kecepatan: makin cepat makin banyak & panjang (dibatasi agar ringan saat 10×)
    if (this.spd > 400) spawn(Math.min(32, (this.spd - 400) / 40), () => this.parts.push({ x: cx + VW + 20, y: cy + rand(20, VH - 20), vx: -this.spd * rand(1.3, 1.9), vy: 0, life: 0.8, max: 0.8, size: rand(40, 100) * (1 + this.spd / 1600), color: 'wind', kind: 6, ph: 0 }));

    for (const p of this.parts) {
      p.life -= dt; p.ph += dt;
      switch (p.kind) {
        case 0: p.vx *= 1 - dt * 2.5; p.vy *= 1 - dt * 2.5; break;
        case 1: p.vy += 220 * dt; p.vx *= 1 - dt; break;
        case 2: p.vx += Math.sin(p.ph * 1.3) * 12 * dt; p.vy += Math.cos(p.ph) * 12 * dt; break;
        case 3: p.vx += Math.sin(p.ph * 1.7) * 30 * dt; break;
        case 4: p.vy += 90 * dt; p.vx *= 1 - dt * 1.2; p.vy *= 1 - dt * 0.6; break;
        case 5: p.vx = Math.sin(p.ph * 0.4) * 8; break;
        case 7: p.vx += Math.sin(p.ph * 2) * 10 * dt; break;
        case 9: p.vx += Math.sin(p.ph * 2.2) * 14 * dt; break;
        case 10: p.vx *= 1 - dt * 1.6; p.vy *= 1 - dt * 1.6; break;
        case 12: p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; break;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0 && p.x > cx - 300 && p.x < cx + VW + 450 && p.y > cy - 400 && p.y < cy + VH + 300);
    if (this.parts.length > 280) this.parts.splice(0, this.parts.length - 280);
    for (const t of this.texts) { t.life -= dt; t.y -= 26 * dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  // ================= RENDER =================
  render() {
    const ctx = this.ctx;
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const pal = this.palette();
    const shx = (Math.random() - 0.5) * this.shake, shy = (Math.random() - 0.5) * this.shake;
    const vo = -this.camOff; // >0 saat kamera naik

    // langit
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgba(pal.skyTop));
    sky.addColorStop(0.7, rgba(pal.skyBot));
    sky.addColorStop(1, rgba(pal.fog));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // garis horizon surga: turun dari atas layar saat kamu naik (surga = TEMPAT, bukan fade)
    const horizonY = -0.35 * H + this.heavenS * 1.5 * H;
    const gyScr = (this.smoothG(this.camX + this.vw * 0.5) - this.camY) * this.zoom;

    drawHeavenBackdrop(ctx, this.time, horizonY);

    // bintang berkelip di langit senja & malam + meteor sesekali
    const sv = starVisibility(pal);
    if (sv > 0.01) {
      drawStars(ctx, this.stars, sv, this.time, this.camX, vo);
      drawMeteors(ctx, this.time, sv);
    }
    if (pal.aurora > 0.01) drawAurora(ctx, pal.aurora, vo, this.time);

    // matahari besar bersinar: halo berlapis, cahaya cakrawala & sinar dewa
    const sunX = pal.sunX * W, sunY = Math.min(pal.sunY * H, H * 0.38) + vo * 0.04;
    const sunHeaven = smooth(clamp((horizonY - sunY) / 140, 0, 1));
    if (pal.moonA < 0.5) drawCrescent(ctx, W * 0.47, 20 + vo * 0.02, 24, clamp((sv - 0.25) * 1.5, 0, 0.9));
    drawSun(ctx, pal, sunX, sunY, this.time, pal.sunA * (1 - sunHeaven * 0.92));
    if (pal.moonA > 0.01) drawCrescent(ctx, sunX, sunY, 30, pal.moonA * (1 - sunHeaven * 0.85));

    // awan latar jauh: tipis memanjang, lembut & menyatu dengan langit
    {
      const bgB = mix(mix(pal.fog, pal.skyBot, 0.35), [255, 255, 255], 0.28);
      const bgSh = mix(bgB, pal.skyTop, 0.16);
      const bgCols: CloudCols = { light: rgba(mix(bgB, [255, 255, 255], 0.45)), body: rgba(bgB), shade: rgba(bgSh), shadeRGB: bgSh };
      this.clouds.forEach((c, i) => {
        const span = W + 700;
        const x = ((c.x - this.camX * 0.06 - this.time * 4) % span + span) % span - 350;
        const cx = x + c.w / 2, by = c.y + vo * 0.05 + c.h * 1.6;
        const Lb: number[] = [cx, by - c.h * 0.5, c.w * 0.54, c.h * 0.6];
        const n = 3 + (i % 2);
        for (let k = 0; k < n; k++) {
          const h = hash(i * 7.1 + k * 3.3), u = (k + 0.5) / n;
          Lb.push(cx + (u - 0.5) * c.w * 0.78, by - c.h * (1 + 0.55 * h), c.w * (0.14 + 0.08 * h), c.h * (0.6 + 0.35 * h));
        }
        paintCloud(ctx, Lb, { x: 0, y: by - c.h * 2.4 }, { x: 0, y: by + c.h * 0.2 }, bgCols, { alpha: 0.55, shadow: false, soft: 1.2 });
      });
    }

    ctx.save();
    ctx.translate(shx, shy);
    // ===== pemandangan permukaan berlapis (100% spasial di luar rongga Hollow Earth) =====
    {
      const bAt = (x: number) => this.biomeInfo(x).dom;
      const baseF = 310 + vo * 0.08, baseM = 380 + vo * 0.16, baseN = 450 + vo * 0.3;
      const PF: LandPlane = { par: 0.04, base: baseF, amp: 210, seed: 0.3, tiltK: 0.12, col: mix(pal.far, pal.fog, 0.12), fogAmt: 0.5, slot: 520, density: 0.6, scale: 0.75, layer: 0 };
      const PM: LandPlane = { par: 0.12, base: baseM, amp: 190, seed: 1.7, tiltK: 0.3, col: pal.mid, fogAmt: 0.42, slot: 760, density: 0.5, scale: 1, layer: 1 };
      const PN: LandPlane = { par: 0.3, base: baseN, amp: 160, seed: 4.2, tiltK: 0.58, col: pal.near, fogAmt: 0.32, slot: 1500, density: 0.32, scale: 1.35, layer: 2, floatOnly: true };
      drawLandmarks(ctx, pal, this.camX, this.tilt, this.time, PF, bAt);
      drawLayer(ctx, pal, this.camX, this.tilt, this.time, 0.04, baseF, 210, 0.3, pal.far, 0.45, 0.12, false);
      drawSunHaze(ctx, pal, sunX, sunY, pal.sunA * (1 - sunHeaven * 0.9), 0.42);
      fogBand(ctx, pal, 250 + vo * 0.1, 0.25);
      drawBgBalloons(ctx, pal, this.time, this.camX, vo, this.bgBalloons);
      this.drawFarBirds(pal, vo);
      drawLandmarks(ctx, pal, this.camX, this.tilt, this.time, PM, bAt);
      drawLayer(ctx, pal, this.camX, this.tilt, this.time, 0.12, baseM, 190, 1.7, pal.mid, 0.4, 0.3, false);
      drawSunHaze(ctx, pal, sunX, sunY, pal.sunA * (1 - sunHeaven * 0.9), 0.2);
      fogBand(ctx, pal, 320 + vo * 0.18, 0.22);
      drawLandmarks(ctx, pal, this.camX, this.tilt, this.time, PN, bAt);
      drawLayer(ctx, pal, this.camX, this.tilt, this.time, 0.3, baseN, 160, 4.2, pal.near, 0.3, 0.58, true);
      fogBand(ctx, pal, 380 + vo * 0.3, 0.18);
    }

    drawHeavenPalaces(ctx, this.time, this.camX, horizonY);
    if (vo > 200) this.drawCloudSea(pal, vo);

    // ===== panorama megah Hollow Earth (di-clip secara spasial ke dalam rongga gua tanpa fade-in/fade-out) =====
    ctx.save();
    if (clipCaveCavities(ctx, this.camX, this.camY, this.zoom, (x) => this.groundY(x))) {
      drawCaveBackdrop(ctx, this.time, this.camX, gyScr);
      drawCaveRuins(ctx, this.time, this.camX, gyScr);
    }
    ctx.restore();

    // ---- dunia (dengan zoom dinamis) ----
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camX, -this.camY);
    const cavePal = this.cavePalette(pal);
    this.drawThermals();
    // mulut gua (bagian belakang) lalu gunung & kubah langit-langit — di belakang rintangan & naga
    drawCaveMouths(ctx, this.camX - 300, this.camX + this.vw + 300, (x) => this.groundY(x), this.time, false);
    drawCaveCeiling(ctx, this.camX - 60, this.camX + this.vw + 60, this.camY - 2400,
      (x) => this.groundY(x), this.time, pal.rock, pal.rockLight);
    for (const p of this.parts) if (p.kind === 5) drawParticle(ctx, p, caveInfo(p.x).amt > 0 ? cavePal : pal, this.skin.body);
    for (const o of this.obstacles) drawObstacle(ctx, o, caveInfo(o.x).amt > 0 ? cavePal : pal, this.time);
    for (const g of this.gates) this.drawGate(g, caveInfo(g.x).amt > 0 ? cavePal : pal, false);
    this.drawGround(pal, cavePal);
    this.drawForegroundDeco();
    this.drawCloudLayer(0, pal, false);
    this.drawCloudLayer(1, pal, false);
    this.drawPuffs(pal, cavePal);
    for (const b of this.balloons) if (b.x > this.camX - 220 && b.x < this.camX + this.vw + 220) drawBalloon(ctx, b, this.time, pal.star);
    for (const f of this.flocks) if (f.x > this.camX - 250 && f.x - 400 < this.camX + this.vw) drawFlock(ctx, f, this.time);
    this.drawRailGuide();
    for (const r of this.rings) drawRing(ctx, r, caveInfo(r.x).amt > 0 ? cavePal : pal, true, this.time);
    for (const p of this.parts) if (p.kind === 1 || p.kind === 0 || p.kind === 11) drawParticle(ctx, p, caveInfo(p.x).amt > 0 ? cavePal : pal, this.skin.body);
    if (this.mode === 'playing') this.drawPearl();
    this.drawDragon(pal);
    for (const g of this.gates) this.drawGate(g, caveInfo(g.x).amt > 0 ? cavePal : pal, true);
    // bagian depan mulut gua digambar di atas naga → naga terlihat masuk & keluar menembus gerbang gua
    drawCaveMouths(ctx, this.camX - 300, this.camX + this.vw + 300, (x) => this.groundY(x), this.time, true);
    for (const r of this.rings) drawRing(ctx, r, caveInfo(r.x).amt > 0 ? cavePal : pal, false, this.time);
    this.drawStarPickup();
    for (const p of this.parts) if (p.kind !== 0 && p.kind !== 1 && p.kind !== 5 && p.kind !== 11) drawParticle(ctx, p, caveInfo(p.x).amt > 0 ? cavePal : pal, this.skin.body);
    this.drawCloudLayer(0, pal, true);
    this.drawCloudLayer(1, pal, true);

    ctx.textAlign = 'center';
    const fz = 1 / this.zoom;
    for (const t of this.texts) {
      const a = clamp(t.life / 0.5, 0, 1);
      ctx.font = t.big ? `700 ${Math.round(24 * fz)}px "Cormorant Garamond", serif` : `700 ${Math.round(16 * fz)}px Quicksand, sans-serif`;
      ctx.fillStyle = `rgba(0,0,0,${0.18 * a})`;
      ctx.fillText(t.text, t.x + 1, t.y + 2);
      ctx.fillStyle = `rgba(255,248,225,${a})`;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
    ctx.restore();

    // partikel spora depan di dalam rongga gua
    drawCaveFront(ctx, this.time, this.camX, this.zoom, (x) => this.groundY(x));
    // pantulan lensa lembut dari matahari
    drawFlare(ctx, sunX, sunY, pal.sunA * (1 - this.inCloud) * (1 - sunHeaven * 0.9), pal.sun);
    // kabut tipis saat berada di dalam awan
    if (this.inCloud > 0.02) { ctx.fillStyle = `rgba(255,255,255,${0.24 * this.inCloud})`; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.45, W / 2, H * 0.5, W * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(10,5,25,${0.26 + pal.star * 0.14})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (this.superT > 0 || this.zen) {
      const a = Math.max(this.superT > 0 ? Math.min(1, this.superT) * 0.16 : 0, this.zen ? 0.1 : 0);
      const sg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
      sg.addColorStop(0, 'rgba(255,240,200,0)');
      sg.addColorStop(1, this.zen && this.superT <= 0 ? `rgba(150,255,220,${a})` : `rgba(255,236,190,${a})`);
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    }
    if (this.boost > 0) {
      const a = clamp(this.boost, 0, 1) * 0.16;
      const bg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.6);
      bg.addColorStop(0, 'rgba(255,220,140,0)');
      bg.addColorStop(1, `rgba(255,210,120,${a})`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.mode !== 'menu') drawHUD(this);
    if (this.toasts.length) drawToasts(this);
    if (this.banner.t > 0) drawBanner(this);
  }

  drawGate(g: Gate, pal: Pal, front: boolean) {
    if (g.x + 170 < this.camX || g.x - 170 > this.camX + this.vw) return;
    const ctx = this.ctx;
    if (front) {
      // bagian depan gerbang digambar ulang di atas naga → naga terlihat masuk ke dalam gerbang
      ctx.save();
      ctx.beginPath();
      ctx.rect(g.x, this.camY - 400, 500, this.vh + 900);
      ctx.clip();
    }
    const gy = (x: number) => this.groundY(x);
    if (g.style === 'torii') drawTorii(ctx, g, pal, front, this.time, gy);
    else drawArch(ctx, g, pal, front, this.time, gy);
    if (front) ctx.restore();
  }

  drawGround(pal: Pal, cavePal: Pal) {
    const ctx = this.ctx;
    const x0 = this.camX - 20, x1 = this.camX + this.vw + 20;
    const bottom = this.camY + this.vh + 40;
    const ys: number[] = [], xs: number[] = [];
    for (let x = x0; x <= x1; x += 10) { xs.push(x); ys.push(this.groundY(x)); }
    const paintSurface = (p: Pal) => {
      const band = (off: number, col: RGB) => {
        ctx.fillStyle = rgba(col);
        ctx.beginPath();
        ctx.moveTo(x0, bottom);
        for (let i = 0; i < xs.length; i++) ctx.lineTo(xs[i], ys[i] + off);
        ctx.lineTo(x1, bottom);
        ctx.closePath();
        ctx.fill();
      };
      band(0, p.groundTop);
      band(26, mix(p.groundTop, p.ground, 0.45));
      band(85, p.ground);
      ctx.strokeStyle = rgba(p.rim, 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) (i === 0 ? ctx.moveTo(xs[i], ys[i]) : ctx.lineTo(xs[i], ys[i]));
      ctx.stroke();
    };

    // Tanah bioma permukaan (spasial di luar Hollow Earth)
    paintSurface(pal);

    // Tanah kristal Hollow Earth (di-clip secara spasial ke dalam segmen gua [xStart, xEnd], tanpa fade)
    const segs = caveSegmentsInRange(x0, x1);
    if (segs.length) {
      ctx.save();
      ctx.beginPath();
      for (const { xStart, xEnd } of segs) {
        const xa = Math.max(x0, xStart), xb = Math.min(x1, xEnd);
        if (xb > xa) ctx.rect(xa, this.camY - 200, xb - xa, this.vh + 400);
      }
      ctx.clip();
      paintSurface(cavePal);

      // Urat kristal bercahaya di dalam tanah gua
      ctx.strokeStyle = rgba(cavePal.rim, 0.32);
      ctx.lineWidth = 1.6;
      const vStep = 120;
      for (let vx = Math.floor(x0 / vStep) * vStep; vx < x1; vx += vStep) {
        if (hash(vx * 0.13 + 4.2) < 0.35) continue;
        const vy0 = this.groundY(vx) + 12;
        const vy1 = this.groundY(vx + 55) + 44 + hash(vx * 0.31) * 28;
        ctx.beginPath();
        ctx.moveTo(vx, vy0);
        ctx.quadraticCurveTo(vx + 26, vy0 + 28, vx + 58, vy1);
        ctx.stroke();

        ctx.fillStyle = rgba(cavePal.rim, 0.45);
        ctx.beginPath();
        ctx.arc(vx + 28, vy0 + 18, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pendaran tepi bioluminesensi di sepanjang permukaan lantai gua
      ctx.strokeStyle = rgba(cavePal.rim, 0.24);
      ctx.lineWidth = 7;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) (i === 0 ? ctx.moveTo(xs[i], ys[i]) : ctx.lineTo(xs[i], ys[i]));
      ctx.stroke();
      ctx.restore();
    }
  }

  drawForegroundDeco() {
    const step = 30;
    const x0 = this.camX - 60, x1 = this.camX + this.vw + 60;
    for (let wx = Math.floor(x0 / step) * step; wx < x1; wx += step) {
      const h = hash(wx * 0.71 + 3.1);
      const ci = caveInfo(wx).amt;
      const B = BIOMES[this.biomeInfo(wx).dom];
      if (ci > 0.42) {
        if (h > 0.28) continue;
        const x = wx + (hash(wx * 1.3) - 0.5) * 18;
        const y = this.groundY(x) + 2;
        const z = caveZone(x);
        const pick = hash(wx * 2.13);
        const type: DecoType = pick < 0.42 ? 'glowMushroom' : pick < 0.76 ? 'crystalCluster' : 'caveFern';
        const col = pick < 0.5 ? z.crystalRGB : z.crystalAltRGB;
        drawDeco(this.ctx, type, x, y, 0.85 + hash(wx * 2.7) * 0.65, col, false, this.time, B);
        continue;
      }
      const dens = B.deco === 'bamboo' ? 0.32 : B.deco === 'pine' ? 0.3 : B.deco === 'shrub' ? 0.22 : B.deco === 'sakura' ? 0.16 : B.deco === 'cactus' ? 0.1 : 0.22;
      if (h > dens) continue;
      const x = wx + (hash(wx * 1.3) - 0.5) * 18;
      const y = this.groundY(x) + 2;
      let type: DecoType = B.deco;
      if (B.deco === 'lantern' && h > 0.06) type = 'pine';
      drawDeco(this.ctx, type, x, y, 0.75 + hash(wx * 2.7) * 0.6, B.decoCol, false, this.time, B);
    }
  }

  // palet awan mengikuti suasana bioma: putih hangat saat fajar/senja, sejuk kebiruan saat malam
  cloudCols(pal: Pal): CloudCols {
    const lit = mix([255, 255, 255], pal.sun, 0.35);
    const body = mix([255, 255, 255], pal.fog, 0.16 + pal.star * 0.5);
    const light = mix(body, lit, 0.55 + pal.star * 0.15);
    const shade = mix(body, mix(pal.mid, pal.skyTop, 0.5), 0.26 + pal.star * 0.18);
    return { light: rgba(light), body: rgba(body), shade: rgba(shade), shadeRGB: shade };
  }

  // lautan awan di cakrawala saat terbang tinggi
  drawCloudSea(pal: Pal, vo: number) {
    const ctx = this.ctx;
    const y0 = H + 120 - (vo - 200) * 0.2;
    if (y0 > H + 40) return;
    const cols = this.cloudCols(pal);
    const rows: [number, number, number, number, number, number][] = [[0.03, -24, 118, 30, 0.72, 11], [0.05, 0, 150, 46, 1, 3]];
    for (const [par, dy, S, hgt, alpha, seed] of rows) {
      const off = this.camX * par, b0 = Math.floor(off / S), yb = y0 + dy, Ls: number[] = [];
      for (let k = -1; k < W / S + 2; k++) {
        const i = b0 + k, h1 = hash(i * 1.9 + seed), h2 = hash(i * 3.3 + seed);
        const x = i * S - off + (h1 - 0.5) * S * 0.4;
        const ry = hgt * (0.55 + 0.45 * h2), rx = ry * 1.7 + S * 0.35;
        Ls.push(x, yb - ry * 0.4, rx, ry);
        if (h2 > 0.5) Ls.push(x + (h1 - 0.5) * rx * 0.8, yb - ry * 1.02, rx * 0.4, ry * 0.42);
      }
      paintCloud(ctx, Ls, { x: 0, y: yb - hgt * 1.5 }, { x: 0, y: yb + hgt * 0.9 }, cols, { alpha, rects: [-30, yb, W + 60, H - yb + 60] });
    }
  }

  // lapisan awan dunia: satu siluet menyatu, dasar datar, puncak bergelombang
  drawCloudLayer(li: number, pal: Pal, front: boolean) {
    const L = CLOUD_LAYERS[li];
    const S = li === 0 ? 64 : 76;
    const x0 = this.camX - 220, x1 = this.camX + this.vw + 220;
    const cA = this.smoothG(x0) - L.alt, cB = this.smoothG(x1) - L.alt;
    const vt = this.camY - 140, vb = this.camY + this.vh + 140;
    if (Math.max(cA, cB) + L.thick < vt || Math.min(cA, cB) - L.thick * 2 > vb) return;
    const ctx = this.ctx, cols = this.cloudCols(pal);
    const Ls: number[] = [];
    for (let i = Math.floor(x0 / S); i * S < x1; i++) {
      const h1 = hash(i * 2.11 + li * 5.3), h2 = hash(i * 3.71 + li * 7.1), h3 = hash(i * 5.13 + li * 3.7);
      const x = i * S + (h1 - 0.5) * S * 0.45;
      const r = this.cloudAt(x, li), th = r.bot - r.top;
      if (r.k < 0.1 || th < 6 || r.bot < vt || r.top > vb) continue;
      if (front) {
        // kabut tipis di depan naga → terasa benar-benar menembus awan
        if (h2 > 0.45) Ls.push(x, lerp(r.top, r.bot, 0.64), S * 1.8, Math.max(3, th * 0.13));
        continue;
      }
      const ry = clamp(th * (0.3 + 0.16 * h2), 5, 88), rx = ry * (1.3 + 0.55 * h3) + S * 0.3;
      Ls.push(x, r.top + ry, rx, ry); // kubah
      const rb = Math.max(4, th * 0.26);
      Ls.push(x, r.bot - rb, S * 1.1, rb); // dasar datar
      const gap = r.bot - rb - (r.top + ry);
      if (gap > 0) Ls.push(x, (r.top + ry + r.bot - rb) / 2, rx * 0.92, gap / 2 + Math.min(ry, rb) * 0.7);
      if (h3 > 0.42 && th > 26) Ls.push(x + (h2 - 0.5) * rx * 0.9, r.top + ry * 0.32, rx * 0.4, ry * 0.46); // detail kembang kol
    }
    if (!Ls.length) return;
    // gradasi tegak lurus kemiringan lapisan: puncak tersinari, perut teduh
    const xm = this.camX + this.vw / 2, cm = this.smoothG(xm) - L.alt;
    const sl = (cB - cA) / (x1 - x0), nl = Math.hypot(1, sl), nx = -sl / nl, ny = 1 / nl, T = L.thick;
    const g0 = { x: xm - nx * T * 1.05, y: cm - ny * T * 1.05 }, g1 = { x: xm + nx * T * 0.62, y: cm + ny * T * 0.62 };
    const segs = caveSegmentsInRange(x0 - 200, x1 + 200);
    if (segs.length) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 - 400, vt - 400, x1 - x0 + 800, vb - vt + 800);
      for (const { xStart, xEnd } of segs) {
        ctx.rect(xStart - 60, vt - 400, xEnd - xStart + 120, vb - vt + 800);
      }
      ctx.clip('evenodd');
    }
    if (front) paintCloud(ctx, Ls, g0, g1, cols, { alpha: 0.2, flat: true, soft: 1.6 });
    else paintCloud(ctx, Ls, g0, g1, cols, { alpha: li === 0 ? 0.95 : 1 });
    if (segs.length) ctx.restore();
  }

  // jejak aurora yang mengikuti lintasan naga saat melesat / Melesat Bintang / Aliran Zen
  drawAuroraTrail(a: number) {
    const ctx = this.ctx, P = this.hist, n = Math.min(P.length, 110);
    if (n < 4 || a <= 0.02) return;
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < n; i++) {
        const k = 1 - i / n;
        const hue = 150 + ((i * 2.4 + this.time * 50) % 160);
        ctx.strokeStyle = `hsla(${hue},90%,${pass ? 82 : 68}%,${a * k * (pass ? 0.75 : 0.2)})`;
        ctx.lineWidth = pass ? 2 + k * 3 : 6 + k * 18;
        ctx.beginPath(); ctx.moveTo(P[i - 1].x, P[i - 1].y); ctx.lineTo(P[i].x, P[i].y); ctx.stroke();
      }
    }
  }

  drawThermals() {
    const ctx = this.ctx;
    for (const th of this.thermals) {
      if (th.x + th.w < this.camX || th.x - th.w > this.camX + this.vw) continue;
      const g0 = this.groundY(th.x), top = g0 - th.top;
      const gr = ctx.createLinearGradient(th.x - th.w / 2, 0, th.x + th.w / 2, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.09)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(th.x - th.w / 2, top, th.w, g0 - top);
      ctx.lineWidth = 1.4;
      const cy = (this.time * 90) % 60;
      for (let y = g0 - cy; y > top; y -= 60) {
        if (y < this.camY - 20 || y > this.camY + this.vh + 20) continue;
        const a = clamp((y - top) / 200, 0, 1) * clamp((g0 - y) / 120, 0, 1);
        ctx.strokeStyle = `rgba(255,255,255,${0.28 * a})`;
        ctx.beginPath(); ctx.moveTo(th.x - 10, y + 6); ctx.lineTo(th.x, y); ctx.lineTo(th.x + 10, y + 6); ctx.stroke();
      }
    }
  }

  drawPuffs(pal: Pal, cavePal: Pal) {
    const ctx = this.ctx, cols = this.cloudCols(pal), cCols = this.cloudCols(cavePal);
    for (const p of this.puffs) {
      if (p.x < this.camX - 80 || p.x > this.camX + this.vw + 80) continue;
      const k = p.state === 1 ? 1 + p.t * 1.5 : 1, a = p.state === 1 ? Math.max(0, 1 - p.t / 0.8) : 1;
      const y = p.y + Math.sin(this.time * 1.3 + p.x * 0.01) * 3, x = p.x, r = p.r * k;
      const Lp = [
        x, y + r * 0.32, r * 1.25, r * 0.42,
        x - r * 0.55, y + r * 0.02, r * 0.72, r * 0.58,
        x + r * 0.52, y - r * 0.02, r * 0.78, r * 0.6,
        x - r * 0.02, y - r * 0.36, r * 0.82, r * 0.66,
        x + r * 0.3, y - r * 0.66, r * 0.42, r * 0.36,
      ];
      paintCloud(ctx, Lp, { x, y: y - r * 1.1 }, { x, y: y + r * 0.8 }, caveInfo(p.x).amt > 0 ? cCols : cols, { alpha: a, soft: 0.7 });
    }
  }

  drawStarPickup() {
    const s = this.star;
    if (!s) return;
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(s.t * 6) * 0.12;
    const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 58 * pulse);
    gl.addColorStop(0, 'rgba(255,250,225,0.78)'); gl.addColorStop(0.35, 'rgba(255,214,150,0.3)'); gl.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(s.x, s.y, 58 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `hsla(${(s.t * 120) % 360},90%,78%,0.55)`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(s.x, s.y, 24 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 1.5);
    starShape(ctx, 18 * pulse, 'rgba(255,255,255,0.96)');
    ctx.rotate(Math.PI / 4); starShape(ctx, 10 * pulse, 'rgba(255,226,150,0.92)');
    ctx.restore();
  }

  drawFarBirds(pal: Pal, vo: number) {
    const col = rgba(mix(pal.far, [30, 20, 40], 0.45 + pal.star * 0.2), 0.55);
    const span = W + 260;
    this.bgBirds.forEach((b, i) => {
      const x = (((b.x + this.time * b.v - this.camX * 0.03) % span) + span) % span - 130;
      const y = b.y + vo * 0.06 + Math.sin(this.time * 0.3 + i) * 6;
      for (let k = 0; k < b.n; k++) farBird(this.ctx, x - k * 14, y + (k % 2 ? 6 : -2) + k * 3, 1, this.time * 5 + k * 1.3 + i, col);
    });
  }

  // panduan visual formasi: lengkung putus-putus emas + penanda denyut di target (tidak menyetir naga)
  drawRailGuide() {
    if (this.railW < 0.03 || this.railForm <= 0 || this.mode !== 'playing') return;
    const pts = this.rings
      .filter((r) => r.form === this.railForm && r.state === 0 && r.x > this.dx - 60 && r.x < this.dx + 1100)
      .sort((a, b) => a.x - b.x);
    if (!pts.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.railW * 0.75;
    ctx.strokeStyle = 'rgba(255,226,150,0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 10]);
    const all = [{ x: this.dx, y: this.dy }, ...pts];
    ctx.beginPath();
    ctx.moveTo(all[0].x, all[0].y);
    for (let i = 0; i < all.length - 1; i++) {
      const p0 = all[Math.max(0, i - 1)], p1 = all[i], p2 = all[i + 1], p3 = all[Math.min(all.length - 1, i + 2)];
      ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const n = pts[0], pr = 46 + Math.sin(this.time * 6) * 6;
    ctx.strokeStyle = 'rgba(255,236,180,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  drawPearl() {
    const ctx = this.ctx;
    const x = this.pearlX, y = this.pearlY;
    const pulse = 1 + Math.sin(this.time * 4) * 0.08;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 22 * pulse);
    g.addColorStop(0, 'rgba(255,255,245,0.55)');
    g.addColorStop(0.35, 'rgba(255,220,150,0.25)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,252,240,0.85)';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    // ULTRA: cincin kemudi ganda di sekitar mutiara — kepala "dikemudikan" seperti skate
    if (this.ultra && this.mode === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(140,255,220,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 7]);
      ctx.lineDashOffset = -this.time * 40;
      ctx.beginPath(); ctx.arc(x, y, 15 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(140,255,220,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (this.railW > 0.3) {
      ctx.strokeStyle = `rgba(255,226,150,${0.75 * this.railW})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 15 * pulse, 0, Math.PI * 2); ctx.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const a = this.time * 2.4 + (k * Math.PI * 2) / 3;
      ctx.fillStyle = 'rgba(255,214,140,0.7)';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawDragon(pal: Pal) {
    const ctx = this.ctx;
    const saddle = this.rider.style.scarf;
    if (this.mode === 'dead' && this.chain) {
      const g = dragonGeo(this.chain, this.time, 0, true);
      paintDragon(ctx, g, this.skin, this.look, { t: this.time, spd: 0, star: pal.star, limp: true, saddle, shine: this.shine, twist: this.deadRoll ?? undefined });
      this.rider.drawBack(ctx);
      this.rider.drawFront(ctx);
      this.rider.drawScarf(ctx);
      return;
    }
    const g = this.geo ?? dragonGeo(this.body, this.time, this.spd);
    const tw = this.twistNow();
    // jejak aurora saat melesat / Melesat Bintang / Aliran Zen
    this.drawAuroraTrail(Math.max(
      this.superT > 0 ? Math.min(1, this.superT) : this.starGrace > 0 ? this.starGrace * 0.7 : 0,
      clamp((this.throttle - 0.25) / 0.5, 0, 1) * 0.85,
      this.zen ? 0.55 : 0,
    ));
    // berkedip lembut saat kebal setelah tabrakan
    if (this.invuln > 0 && Math.floor(this.time * 14) % 2 === 0) ctx.globalAlpha = 0.38;
    this.rider.drawBack(ctx);
    paintDragon(ctx, g, this.skin, this.look, {
      t: this.time, spd: this.spd, boost: this.boost, star: pal.star,
      flap: this.wingPhase, amp: this.wingAmp, fold: this.wingFold, saddle,
      shine: this.shine, grip: this.rider.gripping ? seatFrame(tw ? twistGeo(g, tw) : g).grip : null,
      glow: Math.max(this.superT > 0 ? Math.min(1, this.superT) : 0, this.throttle * 0.6, this.zen ? 0.5 + 0.2 * Math.sin(this.time * 4) : 0),
      bank: clamp(this.angVel / 2.0, -1.2, 1.2), flutter: this.inCloud,
      twist: tw,
      ang: this.ang,
    });
    this.rider.drawFront(ctx);
    this.rider.drawScarf(ctx);
    ctx.globalAlpha = 1;
  }
}

// ============================================================================
// HUD & ON-SCREEN OVERLAYS
// ============================================================================
export const HINTS_ULTRA = [
  'Mode ULTRA MUDAH: kepala naga = skate — arahkan mouse, kepala langsung mengejar!',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu, tanpa belok sendiri ✦',
  'Tahan klik kiri / Spasi untuk melesat hingga 5× · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻   ·   tahan untuk putaran beruntun',
  'Scroll mouse / Q = Pusaran Naga ∿   ·   tubuh naga berpilin indah',
  'Setiap trik menaikkan pengganda ALIRAN ×   ·   cincin & gerbang menjaganya tetap hidup',
  'Menabrak batu atau menyentuh tanah saat berputar memutus aliran!',
  'Saat naga meliuk tajam, penunggang otomatis bersalto — tiap salto menambah aliran ✦',
  'Pantul di atas balon udara besar untuk melambung tinggi & salto ganda 🎈',
  'Ikuti tangga cincin atau arus angin naik ⌃ untuk terbang ke langit ☁',
  'Tangkap bintang jatuh: atraksi, melesat hingga 10× & +1 ♥',
  'Masuki gua reruntuhan bawah tanah — awas stalaktit! Terbang tinggi menembus surga awan ✦',
];

export const HINTS_CLASSIC = [
  'Mode KLASIK: naga mengejar mutiara cahaya — jaga momentum seperti Alto!',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu ✦',
  'Menukik = tambah cepat · menanjak = pakai kecepatan — atur ritmenya',
  'Tahan klik kiri / Spasi untuk melesat · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻ · Scroll / Q = Pusaran Naga ∿',
  'Setiap trik menaikkan pengganda ALIRAN × — jangan menabrak!',
];

export const HINTS_ANGLE = [
  'Mode SUDUT: kepala naga menunjuk persis ke arah mousemu — seperti menyetir!',
  'Arahkan ke bawah untuk mendarat & meluncur di tanah — tanpa batasan',
  'Cincin = boost kecepatan — arah naga tetap 100% ikut mousemu ✦',
  'Tahan klik kiri / Spasi untuk melesat · bintang jatuh = 10× ✦',
  'Klik kanan / E = Putaran ↻ · Scroll / Q = Pusaran Naga ∿',
  'Setiap trik menaikkan pengganda ALIRAN × — tabrakan dimaafkan!',
];

export const HINTS = HINTS_ULTRA;
export const hintsFor = (mode: string) => (mode === 'classic' ? HINTS_CLASSIC : mode === 'angle' ? HINTS_ANGLE : HINTS_ULTRA);

export function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}

export function drawFlow(g: Game) {
  const ctx = g.ctx, f = g.flow;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (f.n > 0) {
    const zen = f.mult >= 5, pulse = 1 + f.pulse * 0.28;
    ctx.font = `700 italic ${Math.round(34 * pulse)}px "Cormorant Garamond", serif`;
    ctx.shadowColor = zen ? 'rgba(140,255,220,0.85)' : 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = zen ? 18 : 6;
    ctx.fillStyle = zen ? `hsl(${(g.time * 80) % 360},90%,86%)` : 'rgba(255,236,190,0.98)';
    ctx.fillText(`×${f.mult}`, W / 2, 34);
    ctx.shadowBlur = 0;
    const bw = 110, k = clamp(f.t / 3.2, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; round(ctx, W / 2 - bw / 2, 56, bw, 3, 1.5);
    ctx.fillStyle = zen ? '#9dffd8' : k < 0.3 ? `rgba(255,170,150,${0.7 + Math.sin(g.time * 14) * 0.3})` : 'rgba(255,236,190,0.95)';
    round(ctx, W / 2 - bw / 2, 56, Math.max(3, bw * k), 3, 1.5);
    ctx.font = '700 10px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,250,240,0.85)';
    ctx.fillText(`${zen ? 'ALIRAN ZEN' : 'ALIRAN'} · ${Math.round(f.pts)} × ${f.mult}`, W / 2, 70);
    const N = f.names.length;
    ctx.textAlign = 'right';
    f.names.forEach((n, i) => {
      const a = clamp(n.t / 0.25, 0, 1), newest = i === N - 1;
      ctx.globalAlpha = a * (newest ? 1 : 0.86);
      ctx.font = `${newest ? 700 : 600} ${newest ? 14 : 12}px Quicksand, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = newest ? 'rgba(255,236,180,1)' : 'rgba(255,250,240,0.95)';
      ctx.fillText((i ? '+ ' : '') + n.s, W - 26 + (1 - a) * 22, 106 + i * 17);
    });
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }
  if (g.bankPop) {
    const b = g.bankPop, a = clamp(b.t / 0.5, 0, 1), rise = (2.2 - b.t) * 10, y = f.n > 0 ? 150 : 40;
    ctx.globalAlpha = a;
    ctx.font = '700 28px "Cormorant Garamond", serif';
    ctx.fillStyle = b.lost ? 'rgba(255,175,170,0.95)' : 'rgba(255,240,200,0.98)';
    ctx.fillText(b.lost ? 'Aliran putus' : `+${b.pts.toLocaleString('id-ID')}`, W / 2, y - rise);
    ctx.font = '700 10px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,250,240,0.8)';
    ctx.fillText(b.lost ? `pengganda ×${b.mult} hilang` : `aliran ×${b.mult} tersimpan`, W / 2, y + 20 - rise);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawToasts(g: Game) {
  const ctx = g.ctx;
  ctx.save();
  g.toasts.forEach((tt, i) => {
    const a = Math.min(1, (3.6 - tt.t) / 0.3, tt.t / 0.5);
    const slide = (1 - Math.min(1, (3.6 - tt.t) / 0.35)) * -30;
    const y = 180 + i * 44 + slide;
    ctx.font = '600 14px Quicksand, sans-serif';
    const label = 'Misi selesai · ' + tt.text;
    const w = ctx.measureText(label).width + 70;
    const x = W / 2 - w / 2;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,14,40,0.45)';
    ctx.beginPath();
    ctx.moveTo(x + 18, y); ctx.arcTo(x + w, y, x + w, y + 36, 18); ctx.arcTo(x + w, y + 36, x, y + 36, 18);
    ctx.arcTo(x, y + 36, x, y, 18); ctx.arcTo(x, y, x + w, y, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,120,1)';
    ctx.beginPath(); ctx.arc(x + 22, y + 18, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,20,0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x + 17, y + 18); ctx.lineTo(x + 21, y + 22); ctx.lineTo(x + 27, y + 14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,240,1)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 42, y + 18.5);
  });
  ctx.restore();
}

export function drawBanner(g: Game) {
  const ctx = g.ctx;
  const t = g.banner.t;
  const a = Math.min(1, (4.5 - t) / 0.8, t / 1);
  if (a <= 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = `rgba(255,250,240,${a * 0.75})`;
  ctx.font = '600 12px Quicksand, sans-serif';
  const y0 = H * 0.3;
  ctx.fillText(g.banner.sub.split('').join(' '), W / 2, y0);
  ctx.fillStyle = `rgba(255,250,240,${a})`;
  ctx.font = '600 40px "Cormorant Garamond", serif';
  ctx.fillText(g.banner.name, W / 2, y0 + 30);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,250,240,${a * 0.5})`;
  ctx.fillRect(W / 2 - 34 * a, y0 + 56, 68 * a, 1);
  ctx.restore();
}

export function drawHUD(g: Game) {
  const ctx = g.ctx;
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(255,250,240,0.95)';
  ctx.textAlign = 'left';
  ctx.font = '700 26px Quicksand, sans-serif';
  const dist = `${g.distanceM()}`;
  ctx.fillText(dist, 26, 22);
  const dw = ctx.measureText(dist).width;
  ctx.font = '600 14px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.7)';
  ctx.fillText('m', 30 + dw, 32);

  ctx.textAlign = 'right';
  ctx.font = '700 24px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.95)';
  ctx.fillText(`${g.totalScore()}`, W - 26, 22);
  ctx.font = '600 13px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.75)';
  ctx.fillText(`◯ ${g.ringCount}`, W - 26, 52);
  for (let i = 0; i < 3; i++) heart(ctx, W - 34 - (2 - i) * 20, 74, 6.5, i < g.lives);
  ctx.shadowBlur = 0;

  drawFlow(g);

  const altA = clamp((g.altS - 60) / 200, 0, 1);
  if (altA > 0.01) {
    const ax = 30, ay0 = H * 0.3, ay1 = H * 0.72, maxA = 260;
    const yOf = (m: number) => ay1 - clamp(m / maxA, 0, 1) * (ay1 - ay0);
    ctx.globalAlpha = altA;
    ctx.strokeStyle = 'rgba(255,250,240,0.28)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1); ctx.stroke();
    ctx.font = '600 10px Quicksand, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const L of CLOUD_LAYERS) {
      const y = yOf(L.alt / 10);
      ctx.fillStyle = 'rgba(255,250,240,0.5)'; ctx.fillRect(ax - 4, y, 8, 1);
      ctx.fillText('☁', ax + 8, y);
    }
    const altM = Math.round(g.altS / 10), ya = yOf(altM);
    ctx.fillStyle = 'rgba(255,250,240,0.95)';
    ctx.beginPath(); ctx.arc(ax, ya, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 12px Quicksand, sans-serif';
    ctx.fillText(`${altM} m`, ax + 22, ya);
    ctx.globalAlpha = 1;
  }

  if (g.star && g.mode === 'playing') {
    const sx = (g.star.x - g.camX) * g.zoom, sy = (g.star.y - g.camY) * g.zoom;
    if (sx > W - 24 || sy < 10 || sy > H - 10) {
      const px = clamp(sx, 40, W - 28), py = clamp(sy, 40, H - 70);
      const pu = 1 + Math.sin(g.time * 6) * 0.15;
      const gl = ctx.createRadialGradient(px, py, 0, px, py, 22);
      gl.addColorStop(0, 'rgba(255,240,200,0.6)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(px, py); ctx.rotate(g.time); starShape(ctx, 8 * pu, 'rgba(255,255,255,0.95)'); ctx.restore();
      ctx.font = '700 10px Quicksand, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,248,225,0.9)'; ctx.fillText('bintang jatuh ✦', px - 16, py + 18);
    }
  }
  ctx.textBaseline = 'top';

  if (g.notice) {
    ctx.globalAlpha = Math.max(0, Math.min(1, g.notice.t / 0.5, (3.2 - g.notice.t) / 0.3));
    ctx.textAlign = 'center';
    ctx.font = '600 13px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,240,200,0.96)';
    ctx.fillText(g.notice.text, W / 2, H - 132);
    ctx.globalAlpha = 1;
  }

  const bw = 280, bx = W / 2 - bw / 2, by = H - 36;
  const m = clamp(g.spd / STAR_MAX, 0, 1);
  const stall = g.spd < 190;
  const starRush = g.superT > 0 || g.starGrace > 0;
  const rushing = g.throttle > 0.05 || starRush;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  round(ctx, bx, by, bw, 5, 2.5);
  ctx.fillStyle = 'rgba(255,226,150,0.16)';
  round(ctx, bx + bw / 2, by, bw / 2, 5, 2.5);
  if (starRush) {
    const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.5, '#ffd27a'); gr.addColorStop(0.78, '#ff9ad5'); gr.addColorStop(1, '#9d8cff');
    ctx.fillStyle = gr;
  } else if (rushing || g.zen) {
    const gr = ctx.createLinearGradient(bx, 0, bx + bw / 2, 0);
    gr.addColorStop(0, '#7dffc4'); gr.addColorStop(0.5, '#6fb8ff'); gr.addColorStop(1, '#ff9ad5');
    ctx.fillStyle = gr;
  } else ctx.fillStyle = stall ? `rgba(255,120,110,${0.7 + Math.sin(g.time * 12) * 0.3})` : g.boost > 0 ? 'rgba(255,226,140,1)' : 'rgba(255,250,240,0.9)';
  round(ctx, bx, by, Math.max(5, bw * m), 5, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let k = 1; k < 10; k++) ctx.fillRect(bx + (bw * k) / 10 - 0.5, by - (k === 5 ? 4 : 1), 1, k === 5 ? 13 : 7);
  ctx.textAlign = 'center';
  ctx.font = '700 8px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.55)';
  ctx.fillText('×5', bx + bw / 2, by - 14);
  ctx.fillText('×10 ✦', bx + bw - 8, by - 14);
  ctx.font = '600 10px Quicksand, sans-serif';
  ctx.fillStyle = 'rgba(255,250,240,0.72)';
  const mult = (g.spd / NORMAL_SPD).toFixed(1);
  ctx.fillText(
    stall ? 'TERLALU LAMBAT · MENUKIKLAH'
      : starRush ? `MELESAT BINTANG ✦  ×${mult}`
      : rushing ? `MELESAT  ×${mult}  ·  maks ×5 — tangkap bintang untuk ×10`
      : `×${mult}  ·  TAHAN KLIK = MELESAT  ·  KLIK KANAN / E = PUTARAN  ·  SCROLL / Q = PUSARAN`,
    W / 2, by + 11,
  );

  const HL = hintsFor(g.controlMode);
  if (g.tutorial && g.playT < HL.length * 4.5 && g.mode === 'playing') {
    const idx = Math.min(HL.length - 1, Math.floor(g.playT / 4.5));
    const lt = g.playT - idx * 4.5;
    const a = Math.max(0, Math.min(1, lt / 0.5, (4.5 - lt) / 0.5));
    if (a > 0) {
      ctx.font = '600 14px Quicksand, sans-serif';
      const tw = ctx.measureText(HL[idx]).width + 48;
      const py = H - 96;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(24,16,44,0.34)';
      round(ctx, W / 2 - tw / 2, py, tw, 34, 17);
      ctx.fillStyle = 'rgba(255,250,240,0.96)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(HL[idx], W / 2, py + 17.5);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}


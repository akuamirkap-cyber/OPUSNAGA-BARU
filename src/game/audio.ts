// Mesin audio generatif zen: musik prosedural per bioma + efek suara harmonis
const SCALES: { root: number; steps: number[] }[] = [
  { root: 62, steps: [0, 2, 4, 7, 9] }, // Sakura — D pentatonik mayor
  { root: 57, steps: [0, 1, 4, 5, 7, 8, 10] }, // Gurun — A hijaz
  { root: 60, steps: [0, 3, 5, 7, 10] }, // Ngarai — C pentatonik minor
  { root: 62, steps: [0, 1, 5, 7, 8] }, // Bambu — miyako-bushi
  { root: 64, steps: [0, 2, 4, 6, 7, 9, 11] }, // Salju — E lydian
  { root: 57, steps: [0, 2, 3, 7, 8] }, // Malam — hirajoshi
];
const PROG = [0, 3, 1, 4];
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class ZenAudio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  musicFilter!: BiquadFilterNode;
  sfxBus!: GainNode;
  reverb!: ConvolverNode;
  revSend!: GainNode;
  delay!: DelayNode;
  padFilter!: BiquadFilterNode;
  windGain!: GainNode;
  windFilter!: BiquadFilterNode;
  noise!: AudioBuffer;
  muted = false;
  musicVol = 0.8;
  sfxVol = 0.9;
  intensity = 0;
  boosting = false;
  scale = 0;
  pendingScale = 0;
  step = 0;
  nextTime = 0;
  melDeg = 5;
  timer: number | null = null;
  tempo = 74;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // reverb
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeIR(3.4);
    const revRet = ctx.createGain();
    revRet.gain.value = 0.55;
    this.reverb.connect(revRet);
    revRet.connect(this.master);
    this.revSend = ctx.createGain();
    this.revSend.gain.value = 1;
    this.revSend.connect(this.reverb);

    // delay
    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = (60 / this.tempo) * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 2400;
    this.delay.connect(dlp);
    dlp.connect(fb);
    fb.connect(this.delay);
    const dRet = ctx.createGain();
    dRet.gain.value = 0.45;
    dlp.connect(dRet);
    dRet.connect(this.master);
    dRet.connect(this.revSend);

    // bus musik & sfx
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 18000;
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.musicFilter);
    this.musicFilter.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 700;
    this.padFilter.Q.value = 0.6;
    this.padFilter.connect(this.musicBus);
    const padRev = ctx.createGain();
    padRev.gain.value = 0.6;
    this.padFilter.connect(padRev);
    padRev.connect(this.revSend);

    // noise
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // angin
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const bd = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; bd[i] = last * 3.2; }
    const src = ctx.createBufferSource();
    src.buffer = brown;
    src.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 500;
    this.windFilter.Q.value = 0.7;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxBus);
    src.start();

    this.nextTime = ctx.currentTime + 0.2;
    this.timer = window.setInterval(() => this.tick(), 40);
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.ctx?.close();
  }

  makeIR(sec: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    return buf;
  }

  // ---------- kontrol ----------
  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.1);
  }
  setVolumes(music: number, sfx: number) {
    this.musicVol = music;
    this.sfxVol = sfx;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(music, this.ctx.currentTime, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
  }
  setBiome(i: number) {
    this.pendingScale = i % SCALES.length;
  }
  setIntensity(v: number, boosting: boolean) {
    this.intensity = v;
    this.boosting = boosting;
    if (!this.ctx) return;
    this.padFilter.frequency.setTargetAtTime(520 + v * 1500, this.ctx.currentTime, 0.4);
  }
  setWind(v: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(0.015 + v * 0.13, t, 0.15);
    this.windFilter.frequency.setTargetAtTime(320 + v * 1300, t, 0.15);
  }
  muffle(on: boolean) {
    if (!this.ctx) return;
    this.musicFilter.frequency.setTargetAtTime(on ? 380 : 18000, this.ctx.currentTime, on ? 0.15 : 0.8);
  }

  // ---------- musik ----------
  note(deg: number, s = this.scale) {
    const sc = SCALES[s];
    const n = sc.steps.length;
    const o = Math.floor(deg / n);
    const k = ((deg % n) + n) % n;
    return sc.root + 12 * o + sc.steps[k];
  }

  tick() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const eighth = 60 / this.tempo / 2;
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.schedule(this.step, this.nextTime, eighth);
      this.nextTime += eighth;
      this.step++;
    }
  }

  schedule(step: number, t: number, e: number) {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const I = this.intensity;
    if (beat === 0 && bar % 2 === 0) {
      if (this.pendingScale !== this.scale) {
        this.scale = this.pendingScale;
        this.bellChord(t);
      }
      const ci = PROG[(bar / 2) % PROG.length];
      const chord = [ci, ci + 2, ci + 4, ci + 6].map((d) => this.note(d) - 12);
      chord.forEach((m, i) => this.pad(mtof(m), t, e * 16, i === 0 ? 0.03 : 0.022));
      this.bass(mtof(this.note(ci) - 24), t, e * 14);
    } else if (beat === 0) {
      const ci = PROG[(Math.floor(bar / 2)) % PROG.length];
      this.bass(mtof(this.note(ci) - 24), t, e * 7, 0.07);
    }

    // melodi koto
    const strong = beat % 2 === 0;
    const p = (strong ? 0.22 : 0.08) + I * (strong ? 0.38 : 0.28);
    if (Math.random() < p) {
      const r = Math.random();
      this.melDeg += r < 0.35 ? 1 : r < 0.7 ? -1 : r < 0.85 ? 2 : -2;
      const n = SCALES[this.scale].steps.length;
      this.melDeg = Math.max(n, Math.min(n * 3 - 1, this.melDeg));
      this.pluck(mtof(this.note(this.melDeg)), t, 0.075 + I * 0.03);
      if (Math.random() < 0.15) this.pluck(mtof(this.note(this.melDeg + 2)), t + e * 0.5, 0.04);
    }
    if (Math.random() < 0.035) this.bell(mtof(this.note(this.melDeg + SCALES[this.scale].steps.length)), t, 0.035);

    // perkusi lembut
    if (I > 0.3) {
      const v = (I - 0.3) / 0.7;
      if (beat === 0) this.taiko(t, 0.22 * v);
      if (beat === 4 && I > 0.55) this.taiko(t, 0.12 * v, 1.25);
      if (beat === 6 && Math.random() < 0.4 * v) this.taiko(t, 0.07 * v, 1.5);
    }
    if (this.boosting && beat % 2 === 1) this.shaker(t, 0.03);
  }

  pad(f: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1.6);
    g.gain.setValueAtTime(vol, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur + 2.6);
    g.connect(this.padFilter);
    [-7, 7].forEach((det) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 2.7);
    });
  }

  bass(f: number, t: number, dur: number, vol = 0.11) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  pluck(f: number, t: number, vol: number, bus: AudioNode = this.musicBus) {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 6), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.2), t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    lp.connect(g);
    g.connect(bus);
    g.connect(this.delay);
    g.connect(this.revSend);
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = f * 1.002;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    o1.start(t); o2.start(t);
    o1.stop(t + 1.9); o2.stop(t + 1.9);
  }

  bell(f: number, t: number, vol: number, bus: AudioNode = this.musicBus, dur = 3) {
    const ctx = this.ctx!;
    [[1, 1], [2.76, 0.35], [5.4, 0.12], [2, 0.2]].forEach(([m, a]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (m > 2 ? 2.2 : 1));
      o.connect(g);
      g.connect(bus);
      g.connect(this.revSend);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  bellChord(t: number) {
    [0, 2, 4].forEach((d, i) => this.bell(mtof(this.note(d + 10)), t + i * 0.18, 0.05, this.sfxBus, 4));
  }

  taiko(t: number, vol: number, pitch = 1) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(48 * pitch, t + 0.35);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + 0.55);
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    n.connect(lp); lp.connect(ng); ng.connect(this.musicBus);
    n.start(t, Math.random()); n.stop(t + 0.1);
  }

  shaker(t: number, vol: number) {
    const ctx = this.ctx!;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(hp); hp.connect(g); g.connect(this.musicBus);
    n.start(t, Math.random()); n.stop(t + 0.09);
  }

  // ---------- SFX ----------
  ring(combo: number, perfect: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const deg = Math.min(combo, 11) + SCALES[this.scale].steps.length;
    const f = mtof(this.note(deg) + 12);
    this.bell(f, t, 0.12, this.sfxBus, 2.2);
    this.pluck(f / 2, t, 0.06, this.sfxBus);
    if (perfect) {
      this.bell(mtof(this.note(deg + 2) + 12), t + 0.08, 0.08, this.sfxBus, 2.4);
      this.bell(mtof(this.note(deg + 4) + 12), t + 0.16, 0.05, this.sfxBus, 2.6);
      this.sparkle(t);
    }
  }

  // denting trik: makin tinggi pengganda aliran, makin tinggi nadanya
  trick(m: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, n = SCALES[this.scale].steps.length, base = n + Math.min(m, 10);
    this.bell(mtof(this.note(base) + 12), t, 0.07, this.sfxBus, 2);
    this.bell(mtof(this.note(base + 2) + 12), t + 0.06, 0.05, this.sfxBus, 2.2);
    this.sparkle(t);
  }

  // aliran tersimpan: akor naik yang memuaskan
  bank(m: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, n = SCALES[this.scale].steps.length, steps = Math.min(7, 2 + Math.floor(m / 2));
    for (let i = 0; i < steps; i++) this.bell(mtof(this.note(n + i * 2) + 12), t + i * 0.07, 0.07, this.sfxBus, 3);
    this.pad(mtof(this.note(0)), t, 1.6, 0.03);
    if (m >= 5) this.sparkle(t + 0.3);
  }

  starAppear() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, n = SCALES[this.scale].steps.length;
    [0, 2, 4].forEach((d, i) => this.bell(mtof(this.note(n * 2 + d) + 12), t + i * 0.12, 0.05, this.sfxBus, 3));
  }

  starCatch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, n = SCALES[this.scale].steps.length;
    for (let i = 0; i < 10; i++) this.bell(mtof(this.note(n + i) + 12), t + i * 0.07, 0.08, this.sfxBus, 3.2);
    [0, 2, 4].forEach((d) => this.pad(mtof(this.note(d) - 12), t, 2.2, 0.035));
    this.whoosh(1.4);
    this.sparkle(t + 0.1);
    this.sparkle(t + 0.7);
  }

  // kicau burung lembut
  chirp() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const at = t + i * 0.085 + Math.random() * 0.02;
      const o = ctx.createOscillator();
      o.type = 'sine';
      const f0 = 2300 + Math.random() * 700;
      o.frequency.setValueAtTime(f0, at);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.45, at + 0.05);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.9, at + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.035, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      o.connect(g); g.connect(this.sfxBus); g.connect(this.revSend);
      o.start(at); o.stop(at + 0.12);
    }
  }

  puff() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const nn = ctx.createBufferSource();
    nn.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1800, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    nn.connect(lp); lp.connect(g); g.connect(this.sfxBus); g.connect(this.revSend);
    nn.start(t, Math.random()); nn.stop(t + 0.5);
    this.bell(mtof(this.note(SCALES[this.scale].steps.length * 2 + Math.floor(Math.random() * 4)) + 12), t, 0.03, this.sfxBus, 1.6);
  }

  cloud() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 2, 4, 6].forEach((d, i) => this.bell(mtof(this.note(d + 8) + 12), t + i * 0.15, 0.06, this.sfxBus, 4));
    [0, 4].forEach((d) => this.pad(mtof(this.note(d)), t, 2.5, 0.03));
    this.whoosh(0.9);
  }

  // memasuki Hollow Earth: lonceng kristal berkilau + resonansi gua megah
  caveEnter() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 2, 4, 7].forEach((d, i) => this.bell(mtof(this.note(d) + 12), t + i * 0.14, 0.048, this.sfxBus, 4.2));
    [0, 2].forEach((d, i) => this.bell(mtof(this.note(d) - 12), t + i * 0.35, 0.065, this.sfxBus, 5.2));
    this.pad(mtof(this.note(0) - 24), t, 4.0, 0.045);
    this.sparkle(t + 0.12);
    this.whoosh(0.65);
  }

  // mencapai surga: kilau naik yang cerah & megah
  heavenEnter() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, n = SCALES[this.scale].steps.length;
    for (let i = 0; i < 8; i++) this.bell(mtof(this.note(n + i) + 24), t + i * 0.09, 0.055, this.sfxBus, 3.5);
    [4, 6].forEach((d) => this.pad(mtof(this.note(d)), t, 3, 0.03));
    this.sparkle(t + 0.2);
    this.sparkle(t + 0.8);
  }

  // pantulan balon udara: "boing" lembut + denting yang makin tinggi untuk pantulan beruntun
  bounce(streak: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(420 + Math.min(streak, 6) * 40, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 0.4);
    const n = SCALES[this.scale].steps.length;
    this.bell(mtof(this.note(n + Math.min(streak, 8) + 2) + 12), t + 0.04, 0.07, this.sfxBus, 2.2);
  }

  thud(v: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 0.3);
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12 * v, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    n.connect(lp); lp.connect(ng); ng.connect(this.sfxBus);
    n.start(t, Math.random()); n.stop(t + 0.18);
  }

  gate(streak: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = SCALES[this.scale].steps.length;
    const base = n + Math.min(streak - 1, 9);
    [0, 2, 4].forEach((d, i) => this.bell(mtof(this.note(base + d) + 12), t + i * 0.06, 0.075 - i * 0.015, this.sfxBus, 2.8));
    this.pluck(mtof(this.note(base)), t, 0.07, this.sfxBus);
    this.whoosh(0.7);
    this.sparkle(t + 0.05);
  }

  sparkle(t: number) {
    const ctx = this.ctx!;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(5000, t);
    bp.frequency.exponentialRampToValueAtTime(11000, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    n.connect(bp); bp.connect(g); g.connect(this.sfxBus); g.connect(this.revSend);
    n.start(t); n.stop(t + 0.55);
  }

  whoosh(strength = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
    bp.frequency.exponentialRampToValueAtTime(400, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12 * strength, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    n.connect(bp); bp.connect(g); g.connect(this.sfxBus);
    n.start(t, Math.random()); n.stop(t + 0.8);
  }

  goal() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 2, 4, 7].forEach((d, i) => this.bell(mtof(this.note(d + 10)), t + i * 0.11, 0.09, this.sfxBus, 2.5));
  }

  levelUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) this.bell(mtof(this.note(i + 5) + 12), t + i * 0.09, 0.08, this.sfxBus, 3);
    [0, 2, 4].forEach((d) => this.pad(mtof(this.note(d) - 12), t, 2.5, 0.03));
    this.sparkle(t + 0.7);
  }

  click() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(this.sfxBus); g.connect(this.revSend);
    o.start(t); o.stop(t + 0.1);
  }

  start() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.whoosh(1.2);
    this.bell(mtof(this.note(5) + 12), t + 0.05, 0.08, this.sfxBus, 3);
    this.bell(mtof(this.note(7) + 12), t + 0.2, 0.06, this.sfxBus, 3);
  }

  crash() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.muffle(true);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 1.2);
    // gong
    [[1, 0.09], [1.48, 0.05], [2.0, 0.04], [2.66, 0.025], [3.9, 0.012]].forEach(([m, a]) => {
      const oo = ctx.createOscillator();
      oo.type = 'sine';
      oo.frequency.value = 98 * m;
      const gg = ctx.createGain();
      gg.gain.setValueAtTime(0, t + 0.04);
      gg.gain.linearRampToValueAtTime(a, t + 0.07);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
      oo.connect(gg); gg.connect(this.sfxBus); gg.connect(this.revSend);
      oo.start(t + 0.04); oo.stop(t + 4.6);
    });
  }
}

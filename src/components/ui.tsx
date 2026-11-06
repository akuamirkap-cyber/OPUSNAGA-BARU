import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import {
  dragonGeo, paintDragon, seatFrame, BODY_N, DEFAULT_PARTS,
  PART_KEYS, PART_LABEL, PART_OPTIONS, partName,
  type Parts, type PartKey, type Vec,
} from '../game/dragon';
import { Rider, RIDERS, riderById, type RiderStyle } from '../game/rider';
import {
  SKINS, customSkin, resolveSkin, fullBoard, goalsForLevel, rankTitle, skinById, goalProgress,
  type Goal, type GoalType, type Skin, type Save, type RunStats,
} from '../game/progress';
import { HOLLOW_THEMES } from '../game/realms';

export const stop = (e: SyntheticEvent) => e.stopPropagation();

// ============================================================================
// 1. ANIMASI & PRATINJAU NAGA
// ============================================================================
function previewBody(t: number, wave: number): Vec[] {
  const body: Vec[] = [];
  for (let i = 0; i < BODY_N; i++) {
    body.push({ x: 92 - i * 6.2, y: (Math.sin(t * 2 - i * 0.22) * 12 + Math.sin(i * 0.12) * 4) * wave + (1 - wave) * Math.sin(i * 0.25) * 3 });
  }
  return body;
}

export function DragonPreview({ skin, parts = DEFAULT_PARTS, rider = RIDERS[0], width = 260, height = 110, speed = 1, shine = 0.6 }: {
  skin: Skin; parts?: Parts; rider?: RiderStyle | null; width?: number; height?: number; speed?: number; shine?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    c.width = width * dpr;
    c.height = height * dpr;
    const R = rider ? new Rider(rider) : null;
    let raf = 0, last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000) * speed;
      last = now;
      const t = ((now - t0) / 1000) * speed;
      const g = dragonGeo(previewBody(t, 1), t, 320);
      const sf = seatFrame(g);
      if (R) R.update(dt, { ...sf, lean: 0.5 + Math.sin(t * 1.3) * 0.12 }, { wind: { x: -300, y: 0 }, gravity: 700 });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const sc = Math.min(width / 400, height / 170) * 1.05;
      ctx.translate(width / 2 + 70 * sc, height / 2 + 14 * sc);
      ctx.scale(sc, sc);
      R?.drawBack(ctx);
      paintDragon(ctx, g, skin, parts, { t, spd: 320, boost: 0.5 + Math.sin(t) * 0.3, flap: t * Math.PI * 2 * 1.1, amp: 0.8, fold: 0, saddle: rider ? rider.scarf : undefined, shine, grip: R ? sf.grip : null });
      if (R) { R.drawFront(ctx); R.drawScarf(ctx); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [skin, parts, rider, width, height, speed, shine]);
  return <canvas ref={ref} style={{ width, height }} />;
}

export type Focus = 'all' | 'horn' | 'eye' | 'wing' | 'fin' | 'frill' | 'tail' | 'leg' | 'pattern' | 'rider';
const FOCUS: Record<Focus, [number, number, number]> = {
  all: [-62, -10, 0.25], horn: [80, -14, 1.5], eye: [99, -5, 3.3], wing: [26, -26, 0.92], fin: [-40, -8, 0.6],
  frill: [28, -4, 0.62], tail: [-226, 0, 0.9], leg: [54, 17, 1.4], pattern: [-10, 0, 1.3], rider: [60, -15, 1.65],
};

export function LookThumb({ skin, parts, rider, focus, width = 120, height = 70 }: {
  skin: Skin; parts: Parts; rider: RiderStyle | null; focus: Focus; width?: number; height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = width * dpr;
    c.height = height * dpr;
    const t = 0.9;
    const g = dragonGeo(previewBody(t, 0), t, 900, true);
    const [cx, cy, z] = FOCUS[focus];
    const s = z * (width / 100);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    let R: Rider | null = null;
    if (rider && (focus === 'rider' || focus === 'all')) {
      R = new Rider(rider);
      R.snap({ ...seatFrame(g), lean: 0.35 });
    }
    R?.drawBack(ctx);
    paintDragon(ctx, g, skin, parts, { t, spd: 300, flap: Math.PI / 2, amp: 0.55, fold: 0, saddle: R ? R.style.scarf : undefined, shine: 0.7, grip: R ? seatFrame(g).grip : null });
    if (R) { R.drawFront(ctx); R.drawScarf(ctx); }
  }, [skin, parts, rider, focus, width, height]);
  return <canvas ref={ref} style={{ width, height }} />;
}

// ============================================================================
// 2. IKON DAN KOMPONEN DASAR
// ============================================================================
export type IconName =
  | 'flag' | 'dragon' | 'rank' | 'sliders' | 'play' | 'pause' | 'sound' | 'mute' | 'mouse' | 'down' | 'up'
  | 'ring' | 'gate' | 'path' | 'combo' | 'spark' | 'target' | 'wave' | 'mountain' | 'close' | 'check' | 'star' | 'cloud'
  | 'loop' | 'spiral' | 'bolt' | 'bird' | 'shield' | 'dive' | 'flow';

const PATHS: Record<IconName, ReactNode> = {
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  dragon: <><path d="M2 15c2.5 0 3.2-4 6-4s3.4 5 6.2 5S18 11 19.5 9" /><path d="M19.5 9l2.5-1M19.5 9l1 2.4" /><path d="M6 11.5l-.8-2M10 12.5l.3-2.2M14 15l.8-2" /></>,
  rank: <path d="M4 20v-7h4v7M10 20V8h4v12M16 20v-5h4v5" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" /></>,
  sound: <><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  mute: <><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" /></>,
  mouse: <><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v3" /></>,
  down: <><path d="M4 6c5 0 8 4 10 9l1.5 3" /><path d="M16 19h-5M16 19v-5" /></>,
  up: <><path d="M4 18c5 0 8-4 10-9l1.5-3" /><path d="M16 5h-5M16 5v5" /></>,
  ring: <ellipse cx="12" cy="12" rx="5" ry="9" />,
  gate: <path d="M3 6c6 1.4 12 1.4 18 0M5 10h14M7 7v14M17 7v14" />,
  path: <><path d="M4 19c4 0 4-6 8-6s4-6 8-6" /><path d="M17 4l3 3-3 3" /></>,
  combo: <><ellipse cx="6" cy="12" rx="2.2" ry="4.5" /><ellipse cx="12" cy="12" rx="2.2" ry="4.5" /><ellipse cx="18" cy="12" rx="2.2" ry="4.5" /></>,
  spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" fill="currentColor" /></>,
  wave: <><path d="M3 11c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /><path d="M3 18h18" /></>,
  mountain: <path d="M3 19l6-10 4 6 2-3 6 7z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12 5 5L20 7" />,
  star: <path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z" />,
  cloud: <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.5 4.3 4.3 0 0 0 7 18z" />,
  loop: <><path d="M20 12a8 8 0 1 1-3-6.2" /><path d="M20 4v5h-5" /></>,
  spiral: <path d="M12 12a1.6 1.6 0 1 1 1.6 1.6A3.6 3.6 0 1 1 15.6 9a5.6 5.6 0 1 1-8.2 7.4" />,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  bird: <path d="M2 11c3-3 6-3 9 1 3-4 7-4 11-1M7 15c2-1.5 3.5-1.5 5 0" />,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  dive: <><path d="M5 4c3 3 6 7 7 12" /><path d="M8.5 14.5 12 17l2.5-3.5" /><path d="M3 20h18" /></>,
  flow: <><path d="M3 9c3-3 6-3 9 0s6 3 9 0" /><path d="M3 15c3-3 6-3 9 0s6 3 9 0" /></>,
};

export function Icon({ name, size = 18, className = '', stroke = 1.6 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}

const GOAL_ICON: Record<GoalType, IconName> = {
  dist: 'path', rings: 'ring', combo: 'combo', score: 'spark', perfect: 'target', skim: 'wave', biome: 'mountain', gate: 'gate', star: 'star', alt: 'cloud',
  loop: 'loop', spiral: 'spiral', chain: 'flow', near: 'mountain', speed: 'bolt', bird: 'bird', nohit: 'shield', sky: 'cloud', dive: 'dive', bank: 'spark', multi: 'loop',
};
export function GoalIcon({ type, size = 17 }: { type: GoalType; size?: number }) {
  return <Icon name={GOAL_ICON[type]} size={size} />;
}

export function Btn({ children, onClick, variant = 'ghost', className = '' }: { children: ReactNode; onClick: () => void; variant?: 'primary' | 'ghost' | 'soft'; className?: string }) {
  const base = 'rounded-full font-semibold tracking-wide transition duration-300 active:scale-95 select-none';
  const v = {
    primary: 'bg-white/90 text-[#4a3352] hover:bg-white px-8 py-3 text-[14px] shadow-[0_10px_30px_rgba(40,20,60,0.22)]',
    soft: 'border border-white/20 bg-white/[0.08] text-white/90 hover:bg-white/20 px-6 py-2.5 text-[13px] backdrop-blur-md',
    ghost: 'text-white/70 hover:text-white px-3 py-2 text-[13px]',
  }[variant];
  return (
    <button onPointerDown={stop} onClick={onClick} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Panel({ title, sub, children, onClose }: { title: string; sub?: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/25 backdrop-blur-[6px]">
      <div className="anim-rise relative flex h-[440px] w-[740px] flex-col rounded-[32px] border border-white/15 bg-white/[0.09] px-9 py-8 text-white shadow-[0_30px_80px_rgba(20,10,40,0.3)] backdrop-blur-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            {sub && <div className="mb-1 text-[10px] font-medium tracking-[0.5em] text-white/50">{sub}</div>}
            <h2 className="font-title text-[40px] font-medium leading-none tracking-wide">{title}</h2>
          </div>
          <button onPointerDown={stop} onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Check({ done, fresh }: { done: boolean; fresh?: boolean }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition duration-500 ${done ? 'border-amber-100 bg-amber-100 text-[#5a3a1a]' : 'border-white/30 text-transparent'} ${fresh ? 'anim-stamp' : ''}`}>
      <Icon name="check" size={13} stroke={2.6} />
    </span>
  );
}

export function MissionRow({ goal, done, fresh, progress, compact }: { goal: Goal; done: boolean; fresh?: boolean; progress?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3.5 rounded-2xl px-4 transition duration-500 ${compact ? 'py-2.5' : 'py-3.5'} ${done ? 'bg-amber-100/[0.13]' : 'bg-white/[0.06]'}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-amber-100/20 text-amber-100' : 'bg-white/10 text-white/75'}`}>
        <GoalIcon type={goal.type} />
      </span>
      <span className={`flex-1 text-[13.5px] font-medium leading-snug ${done ? 'text-amber-50/85' : 'text-white/90'}`}>{goal.text}</span>
      {progress && !done && <span className="text-[11.5px] font-semibold tabular-nums text-white/55">{progress}</span>}
      <Check done={done} fresh={fresh} />
    </div>
  );
}

const BACK_CLOUDS = [
  { x: 70, y: 58, s: 1.15, o: 0.5, d: 44 },
  { x: 620, y: 36, s: 0.95, o: 0.45, d: 50 },
  { x: 330, y: 128, s: 1.35, o: 0.28, d: 58 },
  { x: 730, y: 148, s: 0.8, o: 0.35, d: 38 },
];
const FRONT_CLOUDS = [
  { x: 150, y: 186, s: 1.0, o: 0.4, d: 36 },
  { x: 560, y: 198, s: 1.15, o: 0.34, d: 42 },
];

export function Clouds({ front = false }: { front?: boolean }) {
  const list = front ? FRONT_CLOUDS : BACK_CLOUDS;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {list.map((c, i) => (
        <div key={i} className="cloud" style={{ left: c.x, top: c.y, opacity: c.o, animationDuration: `${c.d}s`, animationDelay: `${-i * 9}s` }}>
          <span style={{ left: 0, top: 26 * c.s, width: 130 * c.s, height: 56 * c.s }} />
          <span style={{ left: 54 * c.s, top: 0, width: 120 * c.s, height: 84 * c.s }} />
          <span style={{ left: 128 * c.s, top: 16 * c.s, width: 120 * c.s, height: 66 * c.s }} />
          <span style={{ left: 30 * c.s, top: 44 * c.s, width: 210 * c.s, height: 48 * c.s }} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 3. PANEL (GOALS, LEADERBOARD, SETTINGS)
// ============================================================================
interface PanelProps { save: Save; onClose: () => void; sfx: () => void }

function HowTo({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80"><Icon name={icon} size={15} /></span>
      <span>{text}</span>
    </li>
  );
}

export function GoalsPanel({ save, onClose }: PanelProps) {
  const goals = goalsForLevel(save.level);
  const doneCount = save.done.filter(Boolean).length;
  return (
    <Panel title="Misi" sub={`LEVEL ${save.level} · ${rankTitle(save.level).toUpperCase()}`} onClose={onClose}>
      <div className="flex h-full gap-7">
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-[13px] leading-relaxed text-white/70">
            Selesaikan ketiga misi untuk naik level. Setiap misi harus dicapai dalam <b className="font-semibold text-white/90">satu kali terbang</b>.
          </p>
          <div className="space-y-2.5">
            {goals.map((g, i) => <MissionRow key={i} goal={g} done={save.done[i]} />)}
          </div>
          <div className="mt-auto flex items-center gap-3 pt-4">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition ${save.done[i] ? 'bg-amber-100' : 'bg-white/15'}`} />)}
            </div>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-white/55">{doneCount}/3 SELESAI</span>
          </div>
        </div>
        <div className="w-[226px] rounded-3xl bg-white/[0.05] p-5">
          <div className="mb-4 text-[10px] font-semibold tracking-[0.4em] text-white/50">CARA BERMAIN</div>
          <ul className="space-y-3.5 text-[12.5px] leading-snug text-white/80">
            <HowTo icon="mouse" text={(save.control ?? 'ultra') === 'angle' ? 'Mode SUDUT: kepala menunjuk persis ke arah mouse — arahkan ke bawah untuk mendarat!' : (save.control ?? 'ultra') === 'ultra' ? 'Mode ULTRA: kepala = skate — arahkan mouse ke mana saja, langsung mengejar!' : 'Gerakkan mouse ke mana saja — naga mengejar mutiara cahaya, bisa berbalik arah'} />
            <HowTo icon="down" text="Menukik membuat naga makin cepat" />
            <HowTo icon="up" text={(save.control ?? 'ultra') === 'classic' ? 'Naik membuat naga melambat' : 'Naik tetap mudah — tanpa takut mogok'} />
            <HowTo icon="gate" text="Cincin = boost kecepatan — arah naga selalu ikut mousemu ✦" />
            <HowTo icon="spark" text="Tahan klik / Spasi = melesat 5× · bintang jatuh ✦ = 10×" />
            <HowTo icon="loop" text="Klik kanan / E = Putaran · Scroll / Q = Pusaran" />
            <HowTo icon="flow" text="Trik menaikkan pengganda aliran — jangan menabrak!" />
          </ul>
        </div>
      </div>
    </Panel>
  );
}

export function LeaderboardPanel({ save, onClose, sfx, highlight }: PanelProps & { highlight?: number }) {
  const [tab, setTab] = useState<'all' | 'me'>('all');
  const all = fullBoard(save);
  const list = tab === 'all' ? all : [...save.board].sort((a, b) => b.score - a.score);
  const myIdx = all.findIndex((e) => e.me);
  return (
    <Panel title="Peringkat" sub="PARA PENERBANG LANGIT" onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-full bg-white/[0.07] p-1">
            {(['all', 'me'] as const).map((t) => (
              <button
                key={t}
                onPointerDown={stop}
                onClick={() => { sfx(); setTab(t); }}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${tab === t ? 'bg-white/90 text-[#4a3352]' : 'text-white/70 hover:text-white'}`}
              >
                {t === 'all' ? 'Semua' : 'Riwayatku'}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-white/60">
            Peringkat terbaikmu <span className="font-title ml-1 text-[20px] text-amber-100">{myIdx >= 0 ? `#${myIdx + 1}` : '—'}</span>
          </div>
        </div>
        <div className="grid grid-cols-[44px_1fr_90px_70px_90px] border-b border-white/10 px-3 pb-2 text-[9.5px] font-semibold tracking-[0.25em] text-white/45">
          <span>#</span><span>PENERBANG</span><span className="text-right">JARAK</span><span className="text-right">CINCIN</span><span className="text-right">SKOR</span>
        </div>
        <div className="scroll-soft min-h-0 flex-1 overflow-y-auto pr-1">
          {list.length === 0 && <div className="py-10 text-center text-[13px] text-white/55">Belum ada perjalanan. Ayo terbang!</div>}
          {list.slice(0, 40).map((e, i) => {
            const sk = skinById(e.skin);
            const hl = e.me && highlight !== undefined && e.date === highlight;
            return (
              <div
                key={`${e.name}-${e.date}-${i}`}
                className={`grid grid-cols-[44px_1fr_90px_70px_90px] items-center border-b border-white/[0.06] px-3 py-2.5 text-[13px] ${hl ? 'anim-glow rounded-xl bg-amber-100/[0.14]' : e.me ? 'bg-white/[0.07]' : ''}`}
              >
                <span className={`font-title text-[17px] ${i < 3 ? 'text-amber-100' : 'text-white/55'}`}>{i + 1}</span>
                <span className="flex items-center gap-2.5 truncate font-medium">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, ${sk.fin}, ${sk.body} 60%, ${sk.dark})` }} />
                  {e.name}
                  {e.me && <span className="rounded-full bg-white/15 px-2 text-[9px] font-bold tracking-wider text-white/85">KAMU</span>}
                </span>
                <span className="text-right text-white/65">{e.distance} m</span>
                <span className="text-right text-white/65">{e.rings}</span>
                <span className="text-right font-semibold">{e.score.toLocaleString('id-ID')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block w-[280px]" onPointerDown={stop}>
      <div className="mb-1.5 flex justify-between text-[10px] font-semibold tracking-[0.35em] text-white/55">
        <span>{label}</span><span>{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

export function SettingsPanel({ save, onClose, sfx, onChange, onReset }: PanelProps & { onChange: (s: Partial<Save>) => void; onReset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const activeHollow = save.hollowTheme ?? 'safir';
  return (
    <Panel title="Setelan" sub="SUARA & PROFIL" onClose={onClose}>
      <div className="scroll-soft flex h-full flex-col gap-5 overflow-y-auto pr-2">
        <div className="flex flex-wrap items-end gap-8">
          <label className="block">
            <div className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-white/55">NAMA PENERBANG</div>
            <input
              value={save.name}
              maxLength={14}
              onPointerDown={stop}
              onKeyDown={stop}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-[280px] rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2 text-[15px] font-medium text-white outline-none transition focus:border-white/50"
            />
          </label>
          <Slider label="KEPEKAAN KEMUDI (50% = NORMAL)" value={(save.steer ?? 1) - 0.5} onChange={(v) => onChange({ steer: 0.5 + v })} />
        </div>
        <div className="flex gap-10">
          <Slider label="MUSIK" value={save.musicVol} onChange={(v) => onChange({ musicVol: v })} />
          <Slider label="EFEK SUARA" value={save.sfxVol} onChange={(v) => onChange({ sfxVol: v })} />
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-white/55">WARNA HOLLOW EARTH</div>
          <div className="grid grid-cols-4 gap-2">
            {HOLLOW_THEMES.map((th) => {
              const selected = activeHollow === th.id;
              return (
                <button
                  key={th.id}
                  onPointerDown={stop}
                  onClick={() => { sfx(); onChange({ hollowTheme: th.id }); }}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition ${selected ? 'border-white/75 bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.12)]' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-white/40"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${th.swatch[0]}, ${th.swatch[1]} 58%, ${th.swatch[2]})` }}
                  />
                  <span className="truncate text-[12.5px] font-bold text-white">{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-white/55">MODE KONTROL</div>
          <div className="flex gap-2">
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'ultra' }); }}
              className={`flex-1 rounded-2xl border px-4 py-2.5 text-left transition ${(save.control ?? 'ultra') === 'ultra' ? 'border-emerald-200/70 bg-emerald-200/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="bolt" size={14} className="text-emerald-200" />Ultra Mudah</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Kepala = skate pengemudi. Arahkan mouse, langsung mengejar. Tanpa mogok.</div>
            </button>
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'angle' }); }}
              className={`flex-1 rounded-2xl border px-4 py-2.5 text-left transition ${(save.control ?? 'ultra') === 'angle' ? 'border-sky-200/70 bg-sky-200/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="target" size={14} className="text-sky-200" />Sudut</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Kepala menunjuk persis ke arah mouse. Tanpa batas — bisa mendarat.</div>
            </button>
            <button
              onPointerDown={stop}
              onClick={() => { sfx(); onChange({ control: 'classic' }); }}
              className={`flex-1 rounded-2xl border px-4 py-2.5 text-left transition ${(save.control ?? 'ultra') === 'classic' ? 'border-amber-100/70 bg-amber-100/10' : 'border-white/15 bg-white/[0.05] hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Icon name="wave" size={14} className="text-amber-100" />Klasik</div>
              <div className="mt-1 text-[11px] leading-snug text-white/60">Fisika momentum ala Alto. Menanjak butuh kecepatan. Untuk master.</div>
            </button>
          </div>
        </div>
        <p className="text-[12px] leading-relaxed text-white/60">
          Kontrol: gerakkan <b className="text-white/85">mouse ke mana saja</b> — naga mengejar mutiara cahaya, termasuk meliuk berbalik arah (atau geser jari / tombol panah). Tahan <b className="text-white/85">klik kiri / Spasi</b> untuk melesat hingga 5×. Tekan <b className="text-white/85">Esc</b> untuk jeda.
        </p>
        <div className="mt-auto flex items-center gap-3 pb-1">
          {!confirm ? (
            <Btn variant="soft" onClick={() => { sfx(); setConfirm(true); }}>Hapus semua progres</Btn>
          ) : (
            <>
              <span className="text-[13px] text-rose-100">Yakin? Level & rekor akan hilang.</span>
              <Btn variant="soft" className="!bg-rose-300/30" onClick={() => { onReset(); setConfirm(false); }}>Ya, hapus</Btn>
              <Btn variant="ghost" onClick={() => setConfirm(false)}>Batal</Btn>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ============================================================================
// 4. SANGGAR KUSTOMISASI NAGA (HANGAR)
// ============================================================================
type HangarTab = 'color' | PartKey | 'rider';
const HANGAR_TABS: { id: HangarTab; label: string }[] = [
  { id: 'color', label: 'Warna' },
  ...PART_KEYS.map((k) => ({ id: k as HangarTab, label: PART_LABEL[k] })),
  { id: 'rider', label: 'Penunggang' },
];
const HANGAR_TIPS: Partial<Record<HangarTab, string>> = {
  wing: 'Sayap mengepak kuat saat naik, melipat saat menukik, dan terbentang saat atraksi bintang.',
  fin: 'Sirip punggung mengikuti lekuk tubuh dan tidak menutupi pelana penunggang.',
  frill: 'Hiasan sirip di kepala, leher, lengan, atau ekor — bisa dipadukan bebas dengan sirip punggung.',
  rider: 'Penunggang menggenggam surai naga dan tubuhnya ikut condong saat menukik, naik, dan beratraksi.',
};

interface Card { key: string; name: string; sub?: string; active: boolean; badge?: string; pick: () => void; node: ReactNode }

export function Hangar({ save, onClose, sfx, onSkin, onParts, onRider, onRandom, onShine, onCustom }: {
  save: Save; onClose: () => void; sfx: () => void;
  onSkin: (id: string) => void; onParts: (p: Parts) => void; onRider: (id: string) => void; onRandom: () => void;
  onShine: (v: number) => void; onCustom: (c: string[]) => void;
}) {
  const [tab, setTab] = useState<HangarTab>('color');
  const skin = resolveSkin(save);
  const rider = riderById(save.rider);
  const parts = save.parts;

  let cards: Card[];
  if (tab === 'color') {
    const list: Skin[] = [...SKINS, customSkin(save.custom)];
    cards = list.map((s) => ({
      key: s.id, name: s.name, sub: s.title.split(' · ')[0], active: save.skin === s.id,
      badge: s.premium ? '✦ PREMIUM' : s.id === 'kustom' ? 'KUSTOM' : undefined,
      pick: () => onSkin(s.id),
      node: <LookThumb skin={s} parts={parts} rider={null} focus="all" width={96} height={56} />,
    }));
  } else if (tab === 'rider') {
    cards = RIDERS.map((r) => ({
      key: r.id, name: r.name, sub: r.title, active: save.rider === r.id, badge: r.isNew ? 'BARU' : undefined,
      pick: () => onRider(r.id),
      node: <LookThumb skin={skin} parts={parts} rider={r} focus="rider" width={96} height={56} />,
    }));
  } else {
    const k = tab;
    cards = PART_OPTIONS[k].map((o) => {
      const np = { ...parts, [k]: o.id } as Parts;
      return {
        key: o.id, name: o.name, active: parts[k] === o.id, badge: o.isNew ? 'BARU' : undefined,
        pick: () => onParts(np),
        node: <LookThumb skin={skin} parts={np} rider={null} focus={k as Focus} width={96} height={56} />,
      };
    });
  }

  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/30 backdrop-blur-[6px]">
      <div className="anim-rise relative flex h-[504px] w-[924px] flex-col rounded-[32px] border border-white/15 bg-white/[0.09] px-7 py-5 text-white shadow-[0_30px_80px_rgba(20,10,40,0.3)] backdrop-blur-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-medium tracking-[0.5em] text-white/50">RACIK NAGA & PENUNGGANGMU</div>
            <h2 className="font-title text-[36px] font-medium leading-none tracking-wide">Sanggar Naga</h2>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="soft" onClick={() => { sfx(); onRandom(); }}>⟳ Acak desain</Btn>
            <button onPointerDown={stop} onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-5">
          <div
            className="flex w-[350px] shrink-0 flex-col items-center justify-between rounded-3xl px-3 pb-3 pt-1"
            style={{ background: `radial-gradient(circle at 50% 40%, rgba(${skin.glow},0.3), rgba(255,255,255,0.03) 72%)` }}
          >
            <DragonPreview skin={skin} parts={parts} rider={rider} width={330} height={250} shine={save.shine} />
            <div className="text-center">
              <div className="text-[10px] font-medium tracking-[0.4em] text-white/55">{skin.title}</div>
              <div className="font-title text-[26px] font-medium leading-tight">{skin.name}</div>
              <div className="mt-1 text-[11px] leading-snug text-white/65">
                Tanduk {partName('horn', parts.horn)} · Mata {partName('eye', parts.eye)} · Sayap {partName('wing', parts.wing)}
                <br />Sirip {partName('fin', parts.fin)} · Ekor {partName('tail', parts.tail)} · Corak {partName('pattern', parts.pattern)}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] text-white/85">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: rider.scarf }} />
                Ditunggangi <b className="font-semibold">{rider.name}</b> · {rider.title}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {HANGAR_TABS.map((tb) => (
                <button
                  key={tb.id}
                  onPointerDown={stop}
                  onClick={() => { sfx(); setTab(tb.id); }}
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${tab === tb.id ? 'bg-white/90 text-[#4a3352]' : 'bg-white/[0.07] text-white/75 hover:bg-white/15 hover:text-white'}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <div className={`scroll-soft grid grid-cols-4 content-start gap-2 overflow-y-auto pr-1 ${tab === 'color' ? 'max-h-[232px]' : 'max-h-[300px]'}`}>
              {cards.map((c) => (
                <button
                  key={c.key}
                  onPointerDown={stop}
                  onClick={() => { sfx(); c.pick(); }}
                  className={`relative flex flex-col items-center rounded-2xl border px-1 pb-1.5 pt-1.5 transition duration-300 ${c.active ? 'border-white/60 bg-white/15' : 'border-white/10 bg-white/[0.05] hover:bg-white/10'}`}
                >
                  <div className="h-[56px] w-[96px] overflow-hidden rounded-xl bg-black/10">{c.node}</div>
                  <div className="mt-1 flex max-w-full items-center gap-1 truncate px-1 text-[11.5px] font-semibold">
                    {c.active && <Icon name="check" size={11} stroke={2.6} />}<span className="truncate">{c.name}</span>
                  </div>
                  {c.sub && <div className="max-w-full truncate px-1 text-[9px] tracking-wide text-white/50">{c.sub}</div>}
                  {c.badge && (
                    <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-[1px] text-[7.5px] font-bold tracking-wider ${c.badge.startsWith('✦') ? 'bg-amber-100/90 text-[#5a3a1a]' : 'bg-white/85 text-[#4a3352]'}`}>{c.badge}</span>
                  )}
                </button>
              ))}
            </div>
            {tab === 'color' ? (
              <div className="mt-3 flex items-center gap-5 rounded-2xl bg-white/[0.06] px-4 py-2.5" onPointerDown={stop}>
                <label className="flex-1">
                  <div className="mb-1 flex justify-between text-[10px] font-semibold tracking-[0.3em] text-white/55">
                    <span>INTENSITAS KILAU</span><span>{Math.round(save.shine * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={save.shine} onChange={(e) => onShine(Number(e.target.value))} className="w-full" />
                </label>
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.3em] text-white/55">GRADIEN KUSTOM</div>
                  <div className="flex items-center gap-1.5">
                    {save.custom.map((c, i) => (
                      <input
                        key={i}
                        type="color"
                        value={c}
                        onChange={(e) => { const nc = [...save.custom]; nc[i] = e.target.value; onCustom(nc); }}
                        className="h-8 w-8 cursor-pointer rounded-full border border-white/30 bg-transparent p-0"
                        aria-label={`Warna gradien ${i + 1}`}
                      />
                    ))}
                    <div className="ml-1 h-6 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${save.custom.join(',')})` }} />
                  </div>
                </div>
              </div>
            ) : (
              HANGAR_TIPS[tab] && <p className="mt-2.5 px-1 text-[11.5px] leading-relaxed text-white/60">{HANGAR_TIPS[tab]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. LAYAR UTAMA, HASIL & JEDA (SCREENS)
// ============================================================================
export type MenuTab = 'goals' | 'skins' | 'board' | 'settings';

export function MainMenu({ save, onPlay, onOpen, onToggleControl }: { save: Save; onPlay: () => void; onOpen: (t: MenuTab) => void; onToggleControl: () => void }) {
  const mode = save.control ?? 'ultra';
  const doneCount = save.done.filter(Boolean).length;
  const nav: { id: MenuTab; label: string; icon: IconName }[] = [
    { id: 'goals', label: 'Misi', icon: 'flag' },
    { id: 'skins', label: 'Naga', icon: 'dragon' },
    { id: 'board', label: 'Peringkat', icon: 'rank' },
    { id: 'settings', label: 'Setelan', icon: 'sliders' },
  ];
  return (
    <div className="absolute inset-0 cursor-pointer select-none text-white" onClick={onPlay}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 42% at 50% 30%, rgba(48,26,70,0.2), transparent 72%), linear-gradient(to top, rgba(34,20,52,0.3), transparent 30%)' }}
      />
      <Clouds />

      <div className="anim-fade pointer-events-none absolute left-9 top-7">
        <div className="text-[10px] font-medium tracking-[0.45em] text-white/60">LEVEL {save.level}</div>
        <div className="font-title text-[21px] font-medium leading-tight">{rankTitle(save.level)}</div>
        <div className="mt-1.5 flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${save.done[i] ? 'bg-amber-100' : 'bg-white/30'}`} />)}
        </div>
      </div>
      <div className="anim-fade pointer-events-none absolute right-9 top-7 text-right">
        <div className="text-[10px] font-medium tracking-[0.45em] text-white/60">TERBAIK</div>
        <div className="font-title text-[24px] font-medium leading-tight">{save.best.toLocaleString('id-ID')}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[96px] text-center">
        <div className="anim-rise text-[10px] font-medium tracking-[0.7em] text-white/75">龍 · A ZEN DRAGON JOURNEY</div>
        <h1 className="anim-rise title-glow font-title mt-3 text-[96px] font-medium leading-none" style={{ animationDelay: '.12s' }}>
          Into <span className="font-normal italic text-white/90">the</span> Clouds
        </h1>
        <div className="anim-rise mt-5 flex items-center justify-center gap-4 text-[12px] tracking-[0.3em] text-white/75" style={{ animationDelay: '.24s' }}>
          <span className="h-px w-12 bg-white/40" />perjalanan naga menembus langit<span className="h-px w-12 bg-white/40" />
        </div>
      </div>
      <Clouds front />

      <div className="pointer-events-none absolute inset-x-0 top-[330px] flex flex-col items-center gap-2.5">
        <div className="anim-breathe flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/[0.06]">
          <Icon name="play" size={16} className="ml-0.5" />
        </div>
        <div className="anim-breathe text-[10.5px] font-semibold tracking-[0.45em] text-white/85">KLIK UNTUK TERBANG</div>
        <button
          onPointerDown={stop}
          onClick={(e) => { e.stopPropagation(); onToggleControl(); }}
          className="pointer-events-auto mt-1 flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.07] px-4 py-1.5 backdrop-blur-sm transition hover:border-white/60 hover:bg-white/15"
          aria-label="Ganti mode kontrol"
        >
          <Icon name={mode === 'classic' ? 'wave' : mode === 'angle' ? 'target' : 'bolt'} size={13} className={mode === 'classic' ? 'text-amber-100' : mode === 'angle' ? 'text-sky-200' : 'text-emerald-200'} />
          <span className="text-[10px] font-bold tracking-[0.22em] text-white/85">
            {mode === 'classic' ? 'KLASIK' : mode === 'angle' ? 'SUDUT' : 'ULTRA MUDAH'}
          </span>
          <span className="text-[9px] font-medium tracking-wider text-white/50">
            {mode === 'classic' ? 'momentum' : mode === 'angle' ? 'kendali sudut' : 'kepala = skate'}
          </span>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-7 flex justify-center gap-9">
        {nav.map((n) => (
          <button
            key={n.id}
            onPointerDown={stop}
            onClick={(e) => { e.stopPropagation(); onOpen(n.id); }}
            className="group flex w-[72px] flex-col items-center gap-2 text-white/75 transition hover:text-white"
          >
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] backdrop-blur-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/60 group-hover:bg-white/15">
              <Icon name={n.icon} size={18} />
              {n.id === 'goals' && doneCount < 3 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-200" />}
            </span>
            <span className="text-[9.5px] font-semibold tracking-[0.28em]">{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export interface RunResult {
  stats: RunStats; goals: Goal[]; before: boolean[]; after: boolean[];
  leveledUp: boolean; oldLevel: number; newLevel: number;
  rank: number; total: number; isBest: boolean; best: number; date: number;
}

export function GameOver({ r, onRetry, onMenu, onBoard, onLevelFx }: { r: RunResult; onRetry: () => void; onMenu: () => void; onBoard: () => void; onLevelFx: () => void }) {
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / 1100);
      setScore(Math.round(r.stats.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const a = setTimeout(() => setPhase(1), 900);
    const b = setTimeout(() => { if (r.leveledUp) { setPhase(2); onLevelFx(); } }, 2300);
    return () => { cancelAnimationFrame(raf); clearTimeout(a); clearTimeout(b); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);
  const doneCount = r.after.filter(Boolean).length;

  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center text-white" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(30,18,50,0.22), rgba(30,18,50,0.5))' }}>
      <div className="w-[600px] text-center">
        <div className="anim-rise text-[10px] font-medium tracking-[0.5em] text-white/60">PERJALANAN SELESAI · {r.stats.biome.toUpperCase()}</div>
        <div className="anim-rise title-glow font-title mt-1 text-[96px] font-medium leading-none tabular-nums">{score.toLocaleString('id-ID')}</div>
        <div className="mt-1 h-6">
          {r.isBest ? (
            <span className="anim-stamp inline-block rounded-full bg-amber-100/90 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-[#5a3a1a]">✦ REKOR BARU</span>
          ) : (
            <span className="text-[11px] font-medium tracking-[0.3em] text-white/55">TERBAIK {r.best.toLocaleString('id-ID')}</span>
          )}
        </div>
        <div className="mx-auto mt-4 flex w-fit divide-x divide-white/15 rounded-full bg-white/[0.06] px-2 py-2">
          <Stat v={`${r.stats.distance} m`} l="jarak" />
          <Stat v={r.stats.rings} l="cincin" />
          <Stat v={r.stats.tricks} l="trik" />
          <Stat v={r.stats.stars} l="bintang" />
          <Stat v={`${r.stats.maxAlt} m`} l="tertinggi" />
          <Stat v={`×${r.stats.bestChain}`} l="aliran" />
        </div>
        <div className="mx-auto mt-5 min-h-[160px] w-[480px]">
          {phase < 2 ? (
            <div className="space-y-2 text-left">
              <div className="flex justify-between px-1 text-[10px] font-semibold tracking-[0.35em] text-white/50">
                <span>MISI · LEVEL {r.oldLevel}</span><span>{doneCount}/3</span>
              </div>
              {r.goals.map((g, i) => {
                const show = phase >= 1 ? r.after[i] : r.before[i];
                return <MissionRow key={i} goal={g} done={show} fresh={phase >= 1 && !r.before[i] && r.after[i]} progress={goalProgress(g, r.stats)} compact />;
              })}
            </div>
          ) : (
            <div className="anim-rise flex flex-col items-center pt-3">
              <div className="text-[10px] font-semibold tracking-[0.5em] text-amber-100">NAIK LEVEL</div>
              <div className="anim-stamp anim-glow font-title my-3 flex h-20 w-20 items-center justify-center rounded-full border border-amber-100/80 text-[40px] text-amber-50">{r.newLevel}</div>
              <div className="font-title text-[28px]">{rankTitle(r.newLevel)}</div>
              <div className="mt-1 text-[12px] text-white/60">Misi baru menunggumu di langit.</div>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Btn variant="primary" onClick={onRetry}>Terbang lagi</Btn>
          <Btn variant="soft" onClick={onMenu}>Menu</Btn>
          <Btn variant="ghost" onClick={onBoard}>Peringkat #{r.rank}</Btn>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="px-5">
      <div className="text-[17px] font-semibold leading-tight">{v}</div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">{l}</div>
    </div>
  );
}

export function PauseMenu({ goals, done, stats, onResume, onRestart, onMenu }: {
  goals: Goal[]; done: boolean[]; stats: RunStats | null; onResume: () => void; onRestart: () => void; onMenu: () => void;
}) {
  return (
    <div className="anim-fade absolute inset-0 flex items-center justify-center bg-[#1c1530]/35 text-white backdrop-blur-[6px]">
      <div className="w-[500px] text-center">
        <div className="text-[10px] font-medium tracking-[0.5em] text-white/55">JEDA</div>
        <h2 className="font-title text-[52px] font-medium leading-tight">Tarik napas</h2>
        <div className="mt-5 space-y-2 text-left">
          <div className="px-1 text-[10px] font-semibold tracking-[0.35em] text-white/50">MISI PERJALANAN INI</div>
          {goals.map((g, i) => <MissionRow key={i} goal={g} done={done[i]} progress={goalProgress(g, stats)} compact />)}
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Btn variant="primary" onClick={onResume}>Lanjutkan</Btn>
          <Btn variant="soft" onClick={onRestart}>Ulangi</Btn>
          <Btn variant="soft" onClick={onMenu}>Menu</Btn>
        </div>
      </div>
    </div>
  );
}

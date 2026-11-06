import { useCallback, useEffect, useRef, useState } from 'react';
import { Game, W } from './game/engine';
import { SKINS, clearSave, defaultSave, fullBoard, goalsForLevel, loadSave, persist, resolveSkin, type RunStats, type Save } from './game/progress';
import {
  GameOver, MainMenu, PauseMenu, GoalsPanel, LeaderboardPanel, SettingsPanel, Hangar, Icon, stop,
  type MenuTab, type RunResult,
} from './components/ui';
import { riderById } from './game/rider';
import { randomParts } from './game/dragon';

const applyLook = (g: Game | null, s: Save) => {
  g?.setLook(resolveSkin(s), s.parts, riderById(s.rider), s.shine);
  g?.setSteer(s.steer ?? 1);
  g?.setControlMode(s.control ?? 'ultra');
  g?.setHollowTheme(s.hollowTheme ?? 'safir');
};
const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

type Screen = 'menu' | 'playing' | 'paused' | 'over';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const screenRef = useRef<Screen>('menu');
  const panelRef = useRef<MenuTab | null>(null);
  const keys = useRef({ up: false, down: false, left: false, right: false });
  const lastTouch = useRef(0);
  const [save, setSave] = useState<Save>(loadSave);
  const saveRef = useRef(save);
  const runDoneRef = useRef<boolean[]>([false, false, false]);
  const [runDone, setRunDone] = useState<boolean[]>([false, false, false]);
  const [pauseStats, setPauseStats] = useState<RunStats | null>(null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [panel, setPanelState] = useState<MenuTab | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [highlight, setHighlight] = useState<number | undefined>();
  const [muted, setMuted] = useState(false);
  const [scale, setScale] = useState(1);
  const [portrait, setPortrait] = useState(false);

  const go = (s: Screen) => { screenRef.current = s; setScreen(s); };
  const setPanel = (p: MenuTab | null) => { panelRef.current = p; setPanelState(p); };
  const sfx = useCallback(() => gameRef.current?.audio.click(), []);

  const updateSave = useCallback((patch: Partial<Save> | ((s: Save) => Save)) => {
    const next = typeof patch === 'function' ? patch(saveRef.current) : { ...saveRef.current, ...patch };
    saveRef.current = next;
    persist(next);
    setSave(next);
    return next;
  }, []);

  // ---------- akhir perjalanan ----------
  const handleGameOver = useCallback((stats: RunStats) => {
    const s = saveRef.current;
    const goals = goalsForLevel(s.level);
    const before = [...s.done];
    const after = before.map((d, i) => d || runDoneRef.current[i]);
    const all = after.every(Boolean);
    const newLevel = all ? s.level + 1 : s.level;
    const date = Date.now();
    const entry = { name: s.name.trim() || 'Pengembara', score: stats.score, distance: stats.distance, rings: stats.rings, skin: s.skin, date, me: true };
    const board = [...s.board, entry].sort((a, b) => b.score - a.score).slice(0, 30);
    const isBest = stats.score > s.best;
    const ns = updateSave({
      ...s,
      seenTricks: true,
      level: newLevel,
      done: all ? [false, false, false] : after,
      best: Math.max(s.best, stats.score),
      bestDistance: Math.max(s.bestDistance, stats.distance),
      bestCombo: Math.max(s.bestCombo, stats.bestCombo),
      runs: s.runs + 1,
      totalDistance: s.totalDistance + stats.distance,
      totalRings: s.totalRings + stats.rings,
      board,
    });
    const fb = fullBoard(ns);
    const idx = fb.findIndex((e) => e.me && e.date === date);
    const rank = idx >= 0 ? idx + 1 : fb.filter((e) => e.score > stats.score).length + 1;
    setHighlight(date);
    setResult({ stats, goals, before, after, leveledUp: all, oldLevel: s.level, newLevel, rank, total: fb.length, isBest, best: ns.best, date });
    go('over');
  }, [updateSave]);

  const gameOverRef = useRef(handleGameOver);
  gameOverRef.current = handleGameOver;

  useEffect(() => {
    if (!canvasRef.current) return;
    const g = new Game(canvasRef.current, {
      onGameOver: (s) => gameOverRef.current(s),
      onGoal: (i) => {
        runDoneRef.current = runDoneRef.current.map((d, k) => d || k === i);
        setRunDone(runDoneRef.current);
      },
    });
    applyLook(g, saveRef.current);
    g.audio.setVolumes(saveRef.current.musicVol, saveRef.current.sfxVol);
    gameRef.current = g;
    g.run();
    const box = boxRef.current!;
    const ro = new ResizeObserver(() => setScale(box.getBoundingClientRect().width / W));
    ro.observe(box);
    const onR = () => setPortrait(window.innerHeight > window.innerWidth * 1.05);
    onR();
    window.addEventListener('resize', onR);
    const unlock = () => g.audio.init();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    const releaseMouse = (e: MouseEvent) => { if (e.button === 0) g.setHold(false); if (e.button === 2) g.trickUp(); };
    const releaseAll = () => { g.setHold(false); g.trickUp(); };
    window.addEventListener('mouseup', releaseMouse);
    window.addEventListener('blur', releaseAll);
    const vis = () => {
      if (document.hidden && screenRef.current === 'playing') {
        g.setPaused(true);
        setPauseStats(g.runStats());
        go('paused');
      }
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      g.destroy();
      ro.disconnect();
      window.removeEventListener('resize', onR);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('mouseup', releaseMouse);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  // ---------- aksi ----------
  const start = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = saveRef.current;
    g.audio.init();
    runDoneRef.current = [...s.done];
    setRunDone(runDoneRef.current);
    applyLook(g, s);
    g.setGoals(goalsForLevel(s.level), s.done);
    g.tutorial = s.runs < 3 || !s.seenTricks;
    g.start();
    setPanel(null);
    go('playing');
  }, []);

  const toMenu = useCallback(() => {
    sfx();
    gameRef.current?.toMenu();
    setPanel(null);
    go('menu');
  }, [sfx]);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (screenRef.current === 'playing') {
      g.setPaused(true);
      setPauseStats(g.runStats());
      go('paused');
      sfx();
    } else if (screenRef.current === 'paused') {
      g.setPaused(false);
      go('playing');
      sfx();
    }
  }, [sfx]);

  const toggleControl = useCallback(() => {
    const ns = updateSave((s) => {
      const cur = s.control ?? 'ultra';
      return { ...s, control: cur === 'ultra' ? 'angle' : cur === 'angle' ? 'classic' : 'ultra' };
    });
    gameRef.current?.setControlMode(ns.control ?? 'ultra');
    sfx();
  }, [updateSave, sfx]);

  useEffect(() => {
    const upd = () => {
      gameRef.current?.setKeyDir((keys.current.down ? 1 : 0) - (keys.current.up ? 1 : 0));
      gameRef.current?.setKeyDirX((keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0));
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) { keys.current.up = true; upd(); e.preventDefault(); }
      if (['ArrowDown', 'KeyS'].includes(e.code)) { keys.current.down = true; upd(); e.preventDefault(); }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { keys.current.left = true; upd(); e.preventDefault(); }
      if (['ArrowRight', 'KeyD'].includes(e.code)) { keys.current.right = true; upd(); e.preventDefault(); }
      if ((e.code === 'Space' || e.code.startsWith('Shift')) && screenRef.current === 'playing') { e.preventDefault(); gameRef.current?.setHold(true); }
      if ((e.code === 'KeyE' || e.code === 'KeyX') && screenRef.current === 'playing' && !e.repeat) gameRef.current?.trickDown();
      if ((e.code === 'KeyQ' || e.code === 'KeyC') && screenRef.current === 'playing' && !e.repeat) gameRef.current?.spin();
      if (e.code === 'KeyV' && !e.repeat && !panelRef.current) toggleControl();
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screenRef.current === 'playing' || screenRef.current === 'paused') togglePause();
        else if (panelRef.current) { setPanel(null); sfx(); }
      }
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        if ((screenRef.current === 'menu' || screenRef.current === 'over') && !panelRef.current) { e.preventDefault(); start(); }
        else if (screenRef.current === 'paused') { e.preventDefault(); togglePause(); }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keys.current.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keys.current.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
      if (e.code === 'Space' || e.code.startsWith('Shift')) gameRef.current?.setHold(false);
      if (e.code === 'KeyE' || e.code === 'KeyX') gameRef.current?.trickUp();
      upd();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [start, togglePause, sfx, toggleControl]);

  const track = (e: React.PointerEvent) => {
    if (screenRef.current !== 'playing') return;
    // jari yang menekan tombol (melesat/putar/pusar) tidak menggeser mutiara
    if ((e.target as HTMLElement | null)?.closest?.('button')) return;
    const r = boxRef.current!.getBoundingClientRect();
    gameRef.current?.setTarget((e.clientY - r.top) / r.height, (e.clientX - r.left) / r.width);
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    gameRef.current?.setMuted(m);
  };

  const openPanel = (t: MenuTab) => { sfx(); setPanel(t); };
  const closePanel = () => { sfx(); setPanel(null); };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0b0a18]">
      <div
        ref={boxRef}
        className="relative overflow-hidden shadow-2xl sm:rounded-2xl"
        style={{
          width: 'min(100vw, calc(100dvh * 16 / 9))',
          height: 'min(100dvh, calc(100vw * 9 / 16))',
          touchAction: 'none',
          cursor: screen === 'playing' ? 'none' : 'default',
        }}
        onPointerMove={track}
        onPointerDown={(e) => { track(e); if (e.pointerType === 'touch') lastTouch.current = performance.now(); }}
        onMouseDown={(e) => {
          if (screenRef.current !== 'playing' || performance.now() - lastTouch.current < 800) return;
          // klik kiri ditahan = melesat · klik kanan = putaran (tahan = putaran beruntun)
          if (e.button === 0) gameRef.current?.setHold(true);
          if (e.button === 2) gameRef.current?.trickDown();
        }}
        onWheel={() => { if (screenRef.current === 'playing') gameRef.current?.spin(); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <div className="absolute left-0 top-0 origin-top-left" style={{ width: 960, height: 540, transform: `scale(${scale})` }}>
          {screen === 'menu' && !panel && <MainMenu save={save} onPlay={start} onOpen={openPanel} onToggleControl={toggleControl} />}
          {screen === 'menu' && panel === 'goals' && <GoalsPanel save={save} onClose={closePanel} sfx={sfx} />}
          {screen === 'menu' && panel === 'skins' && (
            <Hangar
              save={save}
              onClose={closePanel}
              sfx={sfx}
              onSkin={(id) => applyLook(gameRef.current, updateSave({ skin: id }))}
              onParts={(p) => applyLook(gameRef.current, updateSave({ parts: p }))}
              onRider={(id) => applyLook(gameRef.current, updateSave({ rider: id }))}
              onRandom={() => applyLook(gameRef.current, updateSave({ parts: randomParts(), skin: SKINS[Math.floor(Math.random() * SKINS.length)].id }))}
              onShine={(v) => applyLook(gameRef.current, updateSave({ shine: v }))}
              onCustom={(c) => applyLook(gameRef.current, updateSave({ custom: c, skin: 'kustom' }))}
            />
          )}
          {screen === 'menu' && panel === 'settings' && (
            <SettingsPanel
              save={save}
              onClose={closePanel}
              sfx={sfx}
              onChange={(p) => {
                const ns = updateSave(p);
                gameRef.current?.audio.setVolumes(ns.musicVol, ns.sfxVol);
                gameRef.current?.setSteer(ns.steer ?? 1);
                gameRef.current?.setControlMode(ns.control ?? 'ultra');
                gameRef.current?.setHollowTheme(ns.hollowTheme ?? 'safir');
              }}
              onReset={() => {
                clearSave();
                const fresh = updateSave(defaultSave());
                applyLook(gameRef.current, fresh);
                gameRef.current?.audio.setVolumes(fresh.musicVol, fresh.sfxVol);
                sfx();
              }}
            />
          )}

          {screen === 'paused' && (
            <PauseMenu
              goals={goalsForLevel(save.level)}
              done={runDone}
              stats={pauseStats}
              onResume={togglePause}
              onRestart={() => { sfx(); start(); }}
              onMenu={toMenu}
            />
          )}

          {screen === 'over' && result && (
            <div className={panel === 'board' ? 'hidden' : ''}>
              <GameOver
                r={result}
                onRetry={() => { sfx(); start(); }}
                onMenu={toMenu}
                onBoard={() => { sfx(); setPanel('board'); }}
                onLevelFx={() => gameRef.current?.audio.levelUp()}
              />
            </div>
          )}
          {(screen === 'menu' || screen === 'over') && panel === 'board' && (
            <LeaderboardPanel save={save} onClose={closePanel} sfx={sfx} highlight={highlight} />
          )}

          {screen === 'playing' && (
            <button
              onPointerDown={stop}
              onClick={togglePause}
              className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20"
              style={{ cursor: 'pointer' }}
              aria-label="Jeda"
            >
              <Icon name="pause" size={14} />
            </button>
          )}

          {screen === 'playing' && (
            <button
              onPointerDown={stop}
              onClick={toggleControl}
              className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm transition hover:bg-white/20"
              style={{ cursor: 'pointer' }}
              aria-label="Ganti mode kontrol (V)"
              title="Ganti mode kontrol (V)"
            >
              <Icon name={(save.control ?? 'ultra') === 'classic' ? 'wave' : (save.control ?? 'ultra') === 'angle' ? 'target' : 'bolt'} size={12} className={(save.control ?? 'ultra') === 'classic' ? 'text-amber-100' : (save.control ?? 'ultra') === 'angle' ? 'text-sky-200' : 'text-emerald-200'} />
              <span className="text-[9px] font-bold tracking-[0.18em] text-white/85">
                {(save.control ?? 'ultra') === 'classic' ? 'KLASIK' : (save.control ?? 'ultra') === 'angle' ? 'SUDUT' : 'ULTRA'}
              </span>
            </button>
          )}

          {screen === 'playing' && isTouch && (
            <button
              onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); gameRef.current?.setHold(true); }}
              onPointerUp={() => gameRef.current?.setHold(false)}
              onPointerCancel={() => gameRef.current?.setHold(false)}
              className="absolute bottom-16 right-4 flex h-[72px] w-[72px] select-none flex-col items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm active:scale-95 active:bg-white/25"
              style={{ touchAction: 'none' }}
              aria-label="Tahan untuk melesat"
            >
              <span className="text-[22px] leading-none">⟫</span>
              <span className="mt-0.5 text-[8px] font-bold tracking-[0.2em]">MELESAT</span>
            </button>
          )}
          {screen === 'playing' && isTouch && (
            <div className="absolute bottom-[146px] right-[22px] flex flex-col gap-2">
              <button
                onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); gameRef.current?.trickDown(); }}
                onPointerUp={() => gameRef.current?.trickUp()}
                onPointerCancel={() => gameRef.current?.trickUp()}
                className="flex h-14 w-14 select-none flex-col items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm active:scale-95 active:bg-white/25"
                style={{ touchAction: 'none' }}
                aria-label="Putaran (tahan untuk beruntun)"
              >
                <span className="text-[20px] leading-none">↻</span>
                <span className="text-[7px] font-bold tracking-[0.18em]">PUTAR</span>
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); gameRef.current?.spin(); }}
                className="flex h-14 w-14 select-none flex-col items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm active:scale-95 active:bg-white/25"
                style={{ touchAction: 'none' }}
                aria-label="Pusaran naga"
              >
                <span className="text-[20px] leading-none">∿</span>
                <span className="text-[7px] font-bold tracking-[0.18em]">PUSAR</span>
              </button>
            </div>
          )}

          <button
            onPointerDown={stop}
            onClick={toggleMute}
            className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20"
            style={{ cursor: 'pointer' }}
            aria-label="Suara"
          >
            <Icon name={muted ? 'mute' : 'sound'} size={16} />
          </button>
        </div>
      </div>

      {portrait && (
        <div className="pointer-events-none fixed left-1/2 top-6 z-30 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md">
          ⟳ Putar perangkat ke mode landscape untuk pengalaman terbaik
        </div>
      )}
    </div>
  );
}

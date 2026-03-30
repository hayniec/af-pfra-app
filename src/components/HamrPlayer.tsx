import { useState, useRef, useEffect } from 'react';
import { HAMR_LEVELS, getHamrIntervalMs } from '../scoring';

type PlayerStatus = 'idle' | 'running' | 'done';

function scheduleBeep(ctx: AudioContext, time: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.start(time);
  osc.stop(time + dur + 0.01);
}

export function HamrPlayer() {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [display, setDisplay] = useState({ level: 1, shuttle: 1, total: 0 });

  const audioRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ levelIdx: 0, shuttle: 1, total: 0, active: false });

  // tickFnRef always holds the latest tick closure — avoids stale refs in setTimeout
  const tickFnRef = useRef<() => void>(() => {});

  const getCtx = () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
    return audioRef.current;
  };

  const playBeep = (isLevelEnd: boolean) => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    if (isLevelEnd) {
      scheduleBeep(ctx, t,        1047, 0.25);
      scheduleBeep(ctx, t + 0.35, 1047, 0.25);
      scheduleBeep(ctx, t + 0.70, 1047, 0.25);
    } else {
      scheduleBeep(ctx, t, 880, 0.20);
    }
  };

  tickFnRef.current = () => {
    const s = stateRef.current;
    if (!s.active) return;

    const lvl = HAMR_LEVELS[s.levelIdx];
    const shuttlesInLevel = lvl.end - lvl.start + 1;
    const isLevelEnd = s.shuttle >= shuttlesInLevel;

    playBeep(isLevelEnd);
    s.total++;

    if (isLevelEnd) {
      const next = s.levelIdx + 1;
      if (next >= HAMR_LEVELS.length) {
        s.active = false;
        setDisplay({ level: s.levelIdx + 1, shuttle: s.shuttle, total: s.total });
        setStatus('done');
        return;
      }
      s.levelIdx = next;
      s.shuttle = 1;
    } else {
      s.shuttle++;
    }

    setDisplay({ level: s.levelIdx + 1, shuttle: s.shuttle, total: s.total });

    const extra = isLevelEnd ? 350 : 0;
    timerRef.current = setTimeout(tickFnRef.current, getHamrIntervalMs(s.levelIdx) + extra);
  };

  const start = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stateRef.current = { levelIdx: 0, shuttle: 1, total: 1, active: true };
    setDisplay({ level: 1, shuttle: 1, total: 1 });
    setStatus('running');
    playBeep(false);
    timerRef.current = setTimeout(tickFnRef.current, getHamrIntervalMs(0));
  };

  const stop = () => {
    stateRef.current.active = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('idle');
  };

  const reset = () => {
    stateRef.current.active = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    stateRef.current = { levelIdx: 0, shuttle: 1, total: 0, active: false };
    setDisplay({ level: 1, shuttle: 1, total: 0 });
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      audioRef.current?.close();
    };
  }, []);

  const totalShuttlesInLevel = status !== 'idle'
    ? HAMR_LEVELS[Math.min(display.level - 1, HAMR_LEVELS.length - 1)].end -
      HAMR_LEVELS[Math.min(display.level - 1, HAMR_LEVELS.length - 1)].start + 1
    : 0;

  return (
    <div className="hamr-player">
      <div className="hamr-player-header">
        <span className="hamr-player-title">HAMR Beep Timer</span>
        {status === 'running' && (
          <span className="hamr-player-live">LIVE</span>
        )}
      </div>

      {(status === 'running' || status === 'done') && (
        <div className="hamr-player-stats">
          <div className="hamr-stat">
            <span className="hamr-stat-label">Level</span>
            <span className="hamr-stat-val">{display.level}</span>
          </div>
          <div className="hamr-stat">
            <span className="hamr-stat-label">Shuttle</span>
            <span className="hamr-stat-val">
              {display.shuttle}
              {status === 'running' && (
                <span className="hamr-stat-sub"> / {totalShuttlesInLevel}</span>
              )}
            </span>
          </div>
          <div className="hamr-stat">
            <span className="hamr-stat-label">Total</span>
            <span className="hamr-stat-val">{display.total}</span>
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="hamr-player-done">All 15 levels complete!</p>
      )}

      <div className="hamr-player-controls">
        {status !== 'running' ? (
          <button className="hamr-btn hamr-btn-start" onClick={start}>
            {status === 'done' ? '↺ Restart' : '▶ Start'}
          </button>
        ) : (
          <button className="hamr-btn hamr-btn-stop" onClick={stop}>
            ■ Stop
          </button>
        )}
        {status !== 'idle' && (
          <button className="hamr-btn hamr-btn-reset" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <p className="hamr-player-hint">
        Single beep = run to far end · Triple beep = level up
      </p>
    </div>
  );
}

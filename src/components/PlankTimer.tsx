import { useState, useRef, useEffect } from 'react';
import { hapticMedium, hapticSuccess, hapticHeavy, hapticLight } from '../utils/haptics';

interface PlankTimerProps {
  onApplyTime: (seconds: number) => void;
  initialSeconds?: number;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // AudioContext blocked or unavailable
  }
}

export function PlankTimer({ onApplyTime, initialSeconds = 0 }: PlankTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [lastAnnouncedInterval, setLastAnnouncedInterval] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = () => {
    playTone(660, 0.15);
    hapticHeavy();
    setIsActive(true);

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;

        // Check 15-second intervals (AFMAN 36-2905 A2.7.2)
        if (next > 0 && next % 15 === 0) {
          playTone(880, 0.25);
          hapticMedium();
          setLastAnnouncedInterval(next);
        }

        return next;
      });
    }, 1000);
  };

  const handlePause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    hapticMedium();
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setSeconds(0);
    setLastAnnouncedInterval(null);
    hapticLight();
  };

  const handleApply = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    hapticSuccess();
    onApplyTime(seconds);
  };

  const formatMinSec = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="plank-timer-card">
      <div className="plank-timer-header">
        <div className="plank-timer-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Official Plank Stopwatch</span>
        </div>
        <span className="plank-interval-label">15s Cues (AFMAN 36-2905)</span>
      </div>

      <div className="plank-timer-display-row">
        <div className="plank-timer-digit">
          {formatMinSec(seconds)}
        </div>
        {lastAnnouncedInterval !== null && (
          <div className="plank-milestone-pill" key={lastAnnouncedInterval}>
            ✓ {formatMinSec(lastAnnouncedInterval)} mark
          </div>
        )}
      </div>

      <div className="plank-timer-controls">
        {!isActive ? (
          <button
            type="button"
            className="btn-timer btn-timer-start"
            onClick={handleStart}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {seconds > 0 ? 'Resume' : 'Start Plank'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-timer btn-timer-pause"
            onClick={handlePause}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            Pause
          </button>
        )}

        {seconds > 0 && (
          <>
            <button
              type="button"
              className="btn-timer btn-timer-apply"
              onClick={handleApply}
              title="Apply time to calculator"
            >
              Use {formatMinSec(seconds)}
            </button>
            <button
              type="button"
              className="btn-timer btn-timer-reset"
              onClick={handleReset}
              title="Reset timer"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

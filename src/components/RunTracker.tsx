import { useState, useRef, useEffect } from 'react';

const TARGET_MILES = 2.0;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type Status = 'idle' | 'acquiring' | 'running' | 'done' | 'error';

export function RunTracker({ onComplete }: { onComplete: (seconds: number) => void }) {
  const [status, setStatus]   = useState<Status>('idle');
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const watchIdRef      = useRef<number | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef    = useRef(0);
  const timerStartedRef = useRef(false);
  const activeRef       = useRef(false);
  const totalDistRef    = useRef(0);
  const lastPosRef      = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const onCompleteRef   = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Always-fresh position handler — avoids stale closure in watchPosition callback
  const posHandlerRef = useRef<(pos: GeolocationPosition) => void>(() => {});

  posHandlerRef.current = (pos: GeolocationPosition) => {
    if (!activeRef.current) return;

    const { latitude: lat, longitude: lon, accuracy } = pos.coords;
    const now = Date.now();

    // First valid position starts the timer
    if (!timerStartedRef.current) {
      timerStartedRef.current = true;
      startTimeRef.current = now;
      setStatus('running');
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }

    // Skip low-accuracy readings
    if (accuracy > 30) return;

    if (lastPosRef.current) {
      const dist = haversine(lastPosRef.current.lat, lastPosRef.current.lon, lat, lon);
      const hrs  = (now - lastPosRef.current.time) / 3_600_000;
      const mph  = hrs > 0 ? dist / hrs : 0;

      // Skip GPS spikes (> 20 mph is unrealistic for a run)
      if (mph <= 20) {
        totalDistRef.current += dist;
        const newDist = totalDistRef.current;
        setDistance(newDist);

        if (newDist >= TARGET_MILES) {
          activeRef.current = false;
          const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
          cleanup();
          setElapsed(secs);
          setDistance(TARGET_MILES);
          setStatus('done');
          onCompleteRef.current(secs);
          return;
        }
      }
    }

    lastPosRef.current = { lat, lon, time: now };
  };

  const cleanup = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    if (!navigator.geolocation) {
      setErrorMsg('GPS is not available in this browser.');
      setStatus('error');
      return;
    }

    cleanup();
    activeRef.current       = true;
    timerStartedRef.current = false;
    totalDistRef.current    = 0;
    lastPosRef.current      = null;
    startTimeRef.current    = 0;
    setDistance(0);
    setElapsed(0);
    setErrorMsg(null);
    setStatus('acquiring');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => posHandlerRef.current(pos),
      (err) => {
        setErrorMsg(err.code === 1
          ? 'Location permission denied. Enable GPS in your browser settings.'
          : 'Unable to get GPS signal. Try moving outside.');
        setStatus('error');
        cleanup();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };

  const stop = () => {
    activeRef.current = false;
    cleanup();
    setStatus('idle');
  };

  useEffect(() => () => { cleanup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = Math.min(distance / TARGET_MILES, 1);

  return (
    <div className="run-tracker">
      <div className="run-tracker-header">
        <span className="run-tracker-title">GPS Run Tracker</span>
        {status === 'running' && <span className="hamr-player-live">LIVE</span>}
      </div>

      {status !== 'idle' && status !== 'error' && (
        <div className="run-tracker-stats">
          <div className="run-stat">
            <span className="run-stat-val">{distance.toFixed(2)}</span>
            <span className="run-stat-label">miles</span>
          </div>
          <div className="run-stat">
            <span className="run-stat-val">{fmtTime(elapsed)}</span>
            <span className="run-stat-label">time</span>
          </div>
        </div>
      )}

      {(status === 'running' || status === 'done') && (
        <div className="run-progress-track">
          <div className="run-progress-fill" style={{ width: `${progress * 100}%` }} />
          <span className="run-progress-pct">{Math.round(progress * 100)}%</span>
        </div>
      )}

      {status === 'acquiring' && (
        <p className="run-tracker-note">Acquiring GPS signal — move outside for best accuracy...</p>
      )}
      {status === 'done' && (
        <p className="run-tracker-done">2 miles reached — time filled above!</p>
      )}
      {errorMsg && (
        <p className="run-tracker-error">{errorMsg}</p>
      )}

      <div className="run-tracker-controls">
        {status === 'running' || status === 'acquiring' ? (
          <button className="hamr-btn hamr-btn-stop" onClick={stop}>■ Stop</button>
        ) : (
          <button className="hamr-btn hamr-btn-start" onClick={start}>
            {status === 'done' ? '↺ New Run' : '▶ Start Run'}
          </button>
        )}
      </div>

      <p className="run-tracker-hint">Keep screen on · Auto-stops at 2.0 miles</p>
    </div>
  );
}

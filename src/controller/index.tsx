/**
 * Controller surface — AI Factory.
 *
 * Phases:
 *  connecting → skeleton waiting screen
 *  idle       → join lobby (auto-request role on mount)
 *  lobby      → show assigned role, wait for host to start
 *  playing    → Power: tap; Data: sort; Security: Zip-Zap; Model: puzzle;
 *               Cooling: gyroscope spirit-level (with touch fallback)
 *  ended      → final result
 */
import { useAirJamController } from "@air-jam/sdk";
import { SurfaceViewport } from "@air-jam/sdk/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "../game/config/gameConfig";
import {
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_LABELS,
  ROLE_MINI_GAME,
  type PlayerRole,
} from "../game/domain/types";
import { useFactoryStore, type FactoryState } from "../game/store/factoryStore";

// ── Power mini-game ──────────────────────────────────────────────────

interface PowerGameProps {
  progress: number;
  status: string;
  score: number;
  onTap: () => void;
}

function PowerGame({ progress, status, score, onTap }: PowerGameProps) {
  const isComplete = status === "complete";
  const color = "#facc15";

  // Ripple state: each tap spawns a short-lived ripple element.
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Throttle guard: prevent dispatching faster than 80 ms (12 taps/s max).
  // Gives the network a chance to breathe while still feeling instant.
  const lastTapRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isComplete) return;

      const now = Date.now();
      if (now - lastTapRef.current < 80) return;
      lastTapRef.current = now;

      // Fire the networked action.
      onTap();

      // Spawn a ripple at the tap position relative to the button.
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = ++rippleId.current;
        setRipples((prev) => [...prev, { id, x, y }]);
        // Remove ripple after animation completes.
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      }
    },
    [isComplete, onTap],
  );

  // Circumference of the SVG progress ring.
  const radius = 90;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress / 100) * circ;

  if (isComplete) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-6"
        style={{ background: "radial-gradient(ellipse at center, #facc1520 0%, transparent 70%)" }}
      >
        {/* Completion glow ring */}
        <div
          className="power-complete-ring flex items-center justify-center rounded-full"
          style={{
            width: 220,
            height: 220,
            border: "4px solid #facc15",
            boxShadow: "0 0 60px #facc15aa, 0 0 120px #facc1540",
            animation: "powerComplete 1.5s ease-in-out infinite alternate",
          }}
        >
          <div style={{ fontSize: 80 }}>⚡</div>
        </div>
        <div
          className="text-3xl font-black uppercase tracking-widest"
          style={{ color: "#facc15", textShadow: "0 0 20px #facc15" }}
        >
          POWER ONLINE
        </div>
        <div className="text-sm text-slate-400">Department score: {score.toLocaleString()} pts</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-4">

      {/* Header stats */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Progress</div>
          <div className="font-mono text-2xl font-black" style={{ color }}>
            {progress}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
          <div className="font-mono text-lg font-bold text-sky-300">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Per Tap</div>
          <div className="font-mono text-lg font-bold text-slate-300">
            +{GAME_CONFIG.powerIncrementPerTap}%
          </div>
        </div>
      </div>

      {/* SVG progress ring + TAP button */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Ring */}
        <svg
          width={220}
          height={220}
          viewBox="0 0 220 220"
          className="absolute"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle cx={110} cy={110} r={radius} fill="none" stroke="#1e293b" strokeWidth={10} />
          {/* Fill */}
          <circle
            cx={110}
            cy={110}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.2s ease-out", filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* TAP button */}
        <button
          ref={btnRef}
          type="button"
          id="power-tap-btn"
          onPointerDown={handlePointerDown}
          className="relative overflow-hidden rounded-full select-none"
          style={{
            width: 160,
            height: 160,
            background: `radial-gradient(circle at 40% 35%, #facc1530, #facc1508)`,
            border: `3px solid ${color}80`,
            boxShadow: `0 0 30px ${color}40, inset 0 0 20px ${color}10`,
            WebkitTapHighlightColor: "transparent",
            touchAction: "none",
          }}
        >
          {/* Ripples */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className="power-ripple"
              style={{
                left: r.x,
                top: r.y,
              }}
            />
          ))}

          <div className="flex flex-col items-center gap-1 pointer-events-none">
            <span style={{ fontSize: 52 }}>⚡</span>
            <span
              className="text-lg font-black uppercase tracking-widest"
              style={{ color }}
            >
              TAP
            </span>
          </div>
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div className="w-full px-2">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Power Grid</span>
          <span>{progress} / 100%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #854d0e, ${color})`,
              boxShadow: `0 0 8px ${color}80`,
              transition: "width 0.15s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Cooling temperature dev panel ─────────────────────────────────────────

function CoolingDevPanel({
  temperature,
  onSet,
}: {
  temperature: number;
  onSet: (t: number) => void;
}) {
  const [localTemp, setLocalTemp] = useState(temperature);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-5xl font-black text-sky-300 font-mono">
        {localTemp.toFixed(0)}°C
      </div>
      <div className="text-sm text-slate-400">
        Safe zone: {GAME_CONFIG.coolingSafeMin}–{GAME_CONFIG.coolingSafeMax}°C
      </div>

      <input
        type="range"
        min={50}
        max={120}
        value={localTemp}
        onChange={(e) => {
          const t = Number(e.target.value);
          setLocalTemp(t);
          onSet(t);
        }}
        className="w-full accent-sky-400"
        style={{ touchAction: "none" }}
      />

      <div className="flex gap-3 w-full">
        <button
          type="button"
          className="ctrl-button flex-1 rounded-xl bg-sky-500/20 border border-sky-500/40 py-3 text-sky-300 font-bold text-lg hover:bg-sky-500/30 active:scale-95 transition-all"
          onClick={() => {
            const t = Math.max(50, localTemp - 5);
            setLocalTemp(t);
            onSet(t);
          }}
        >
          − Cool
        </button>
        <button
          type="button"
          className="ctrl-button flex-1 rounded-xl bg-orange-500/20 border border-orange-500/40 py-3 text-orange-300 font-bold text-lg hover:bg-orange-500/30 active:scale-95 transition-all"
          onClick={() => {
            const t = Math.min(120, localTemp + 5);
            setLocalTemp(t);
            onSet(t);
          }}
        >
          + Heat
        </button>
      </div>
    </div>
  );
}

// ── Data Cleaning mini-game ───────────────────────────────────────────────

type DataBucket = "numbers" | "ai_terms";

/** Determine which bucket a token belongs to. */
function correctBucket(token: string): DataBucket {
  return (GAME_CONFIG.dataTokensNumbers as readonly string[]).includes(token)
    ? "numbers"
    : "ai_terms";
}

interface DataGameProps {
  progress: number;
  status: string;
  score: number;
  onSort: (token: string, bucket: DataBucket, correct: boolean) => void;
}

interface DataToken {
  id: number;
  value: string;
  /** Transient feedback: undefined | 'correct' | 'wrong' */
  feedback?: "correct" | "wrong";
}

function DataCleaningGame({ progress, status, score, onSort }: DataGameProps) {
  const isComplete = status === "complete";
  const color = "#60a5fa";

  // Build a shuffled token pool from both categories.
  const allTokens = [
    ...(GAME_CONFIG.dataTokensNumbers as readonly string[]),
    ...(GAME_CONFIG.dataTokensAiTerms as readonly string[]),
  ];

  const tokenIdRef = useRef(0);
  const lastSortRef = useRef(0);

  /** Pick the next token at random, ensuring we keep rotating the pool. */
  const nextToken = useCallback((): DataToken => {
    const value = allTokens[Math.floor(Math.random() * allTokens.length)];
    return { id: ++tokenIdRef.current, value };
  }, []);

  // Queue of tokens visible on screen (we show 1 active at a time, queue = upcoming).
  const [activeToken, setActiveToken] = useState<DataToken>(() => nextToken());
  const [feedbackToken, setFeedbackToken] = useState<DataToken | null>(null);

  // Bucket shake feedback: null | 'numbers' | 'ai_terms'
  const [shakeBucket, setShakeBucket] = useState<DataBucket | null>(null);
  const [dragOver, setDragOver] = useState<DataBucket | null>(null);

  // Animate in new token on mount/change.
  const [tokenKey, setTokenKey] = useState(0);

  const handleDrop = useCallback(
    (bucket: DataBucket) => {
      const now = Date.now();
      if (now - lastSortRef.current < GAME_CONFIG.dataSortThrottleMs) return;
      lastSortRef.current = now;

      const token = activeToken;
      const isCorrect = correctBucket(token.value) === bucket;

      if (isCorrect) {
        // Show correct feedback briefly, then advance to next token.
        setFeedbackToken({ ...token, feedback: "correct" });
        setTimeout(() => {
          setFeedbackToken(null);
          setActiveToken(nextToken());
          setTokenKey((k) => k + 1);
        }, 420);
      } else {
        // Shake the wrong bucket, keep the same token.
        setShakeBucket(bucket);
        setTimeout(() => setShakeBucket(null), 380);
      }

      onSort(token.value, bucket, isCorrect);
    },
    [activeToken, nextToken, onSort],
  );

  // Touch-tap interaction for mobile: tap a bucket to sort the active token.
  const handleBucketTap = useCallback(
    (bucket: DataBucket) => {
      if (isComplete) return;
      handleDrop(bucket);
    },
    [isComplete, handleDrop],
  );

  // SVG progress ring.
  const radius = 72;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress / 100) * circ;

  if (isComplete) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-6"
        style={{ background: "radial-gradient(ellipse at center, #60a5fa20 0%, transparent 70%)" }}
      >
        {/* Completion glow ring */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 180,
            height: 180,
            border: "4px solid #60a5fa",
            boxShadow: "0 0 60px #60a5faaa, 0 0 120px #60a5fa40",
            animation: "dataComplete 1.5s ease-in-out infinite alternate",
          }}
        >
          <div style={{ fontSize: 64 }}>💾</div>
        </div>
        <div
          className="text-3xl font-black uppercase tracking-widest"
          style={{ color, textShadow: "0 0 20px #60a5fa" }}
        >
          DATA CLEAN
        </div>
        <div className="text-sm text-slate-400">Department score: {score.toLocaleString()} pts</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-4 gap-3">

      {/* Header stats */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Progress</div>
          <div className="font-mono text-2xl font-black" style={{ color }}>
            {progress}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
          <div className="font-mono text-lg font-bold text-sky-300">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Per Sort</div>
          <div className="font-mono text-lg font-bold text-slate-300">
            +{GAME_CONFIG.pointsPerDataSort}
          </div>
        </div>
      </div>

      {/* SVG progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 170, height: 170, flexShrink: 0 }}>
        <svg width={170} height={170} viewBox="0 0 170 170" className="absolute" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={85} cy={85} r={radius} fill="none" stroke="#1e293b" strokeWidth={8} />
          <circle
            cx={85} cy={85} r={radius} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.25s ease-out", filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        {/* Active token card */}
        <div
          key={`token-${tokenKey}`}
          className="data-token-enter relative z-10 flex flex-col items-center justify-center rounded-2xl select-none"
          style={{
            width: 120,
            height: 120,
            background: "rgba(15, 32, 53, 0.95)",
            border: `2px solid ${color}60`,
            boxShadow: `0 0 20px ${color}30`,
          }}
        >
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Sort this</div>
          <div
            className="font-mono font-black text-3xl"
            style={{ color }}
          >
            {activeToken.value}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">
            Tap a bucket
          </div>
        </div>

        {/* Correct feedback overlay */}
        {feedbackToken && (
          <div
            className="data-sort-correct absolute inset-0 flex items-center justify-center rounded-full pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <div className="text-4xl font-black text-green-400">✓</div>
          </div>
        )}
      </div>

      {/* Bucket tap targets */}
      <div className="flex w-full gap-3 px-2">
        {/* Numbers bucket */}
        <button
          id="data-bucket-numbers"
          type="button"
          onPointerDown={() => handleBucketTap("numbers")}
          onDragOver={(e) => { e.preventDefault(); setDragOver("numbers"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => { e.preventDefault(); setDragOver(null); handleDrop("numbers"); }}
          className={[
            "ctrl-button flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-5 transition-all active:scale-95",
            shakeBucket === "numbers" ? "data-bucket-shake" : "",
            dragOver === "numbers" ? "data-bucket-over" : "",
          ].join(" ")}
          style={{
            background: "rgba(96, 165, 250, 0.08)",
            borderColor: dragOver === "numbers" ? "#60a5fa" : "rgba(96, 165, 250, 0.35)",
          }}
        >
          <div className="text-2xl">🔢</div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>Numbers</div>
          <div className="text-[10px] text-slate-500">42, 7, 256…</div>
        </button>

        {/* AI Terms bucket */}
        <button
          id="data-bucket-ai-terms"
          type="button"
          onPointerDown={() => handleBucketTap("ai_terms")}
          onDragOver={(e) => { e.preventDefault(); setDragOver("ai_terms"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => { e.preventDefault(); setDragOver(null); handleDrop("ai_terms"); }}
          className={[
            "ctrl-button flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-5 transition-all active:scale-95",
            shakeBucket === "ai_terms" ? "data-bucket-shake" : "",
            dragOver === "ai_terms" ? "data-bucket-over" : "",
          ].join(" ")}
          style={{
            background: "rgba(96, 165, 250, 0.08)",
            borderColor: dragOver === "ai_terms" ? "#60a5fa" : "rgba(96, 165, 250, 0.35)",
          }}
        >
          <div className="text-2xl">🧠</div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>AI Terms</div>
          <div className="text-[10px] text-slate-500">AI, ML, GPU…</div>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full px-2">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Data Pipeline</span>
          <span>{progress} / 100%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #1e3a5f, ${color})`,
              boxShadow: `0 0 8px ${color}80`,
              transition: "width 0.2s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Zip-Zap Firewall mini-game ────────────────────────────────────────────────

type ZipZapStep = "ZIP" | "ZAP";

function generateSequence(length: number): ZipZapStep[] {
  const seq: ZipZapStep[] = [];
  // Guarantee it always alternates at least once then goes random.
  let last: ZipZapStep | null = null;
  for (let i = 0; i < length; i++) {
    // Bias toward alternating to keep it readable at any length.
    const options: ZipZapStep[] = last === "ZIP" ? ["ZAP", "ZAP", "ZIP"] : ["ZIP", "ZIP", "ZAP"];
    const next = options[Math.floor(Math.random() * options.length)];
    seq.push(next);
    last = next;
  }
  return seq;
}

interface ZipZapGameProps {
  progress: number;
  status: string;
  score: number;
  onZipZap: (hit: boolean) => void;
}

function ZipZapGame({ progress, status, score, onZipZap }: ZipZapGameProps) {
  const isComplete = status === "complete";
  const color = "#34d399"; // emerald — security role color

  // Local sequence state.
  const [sequence, setSequence] = useState<ZipZapStep[]>(() =>
    generateSequence(GAME_CONFIG.securitySequenceSeedLength),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [totalHits, setTotalHits] = useState(0);

  // Per-button animation class: null | 'correct' | 'wrong'
  const [zipAnim, setZipAnim] = useState<"correct" | "wrong" | null>(null);
  const [zapAnim, setZapAnim] = useState<"correct" | "wrong" | null>(null);

  const lastPressRef = useRef(0);
  const zipAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zapAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearZipAnim = useCallback(() => setZipAnim(null), []);
  const clearZapAnim = useCallback(() => setZapAnim(null), []);

  const handlePress = useCallback(
    (pressed: ZipZapStep) => {
      if (isComplete) return;

      const now = Date.now();
      if (now - lastPressRef.current < GAME_CONFIG.securityHitThrottleMs) return;
      lastPressRef.current = now;

      const expected = sequence[currentStep];
      const isHit = pressed === expected;

      onZipZap(isHit);

      if (isHit) {
        const nextHits = totalHits + 1;
        setTotalHits(nextHits);

        // Clear old animation then re-trigger (forces re-render so animation replays).
        if (pressed === "ZIP") {
          setZipAnim(null);
          requestAnimationFrame(() => setZipAnim("correct"));
          if (zipAnimTimer.current) clearTimeout(zipAnimTimer.current);
          zipAnimTimer.current = setTimeout(clearZipAnim, 380);
        } else {
          setZapAnim(null);
          requestAnimationFrame(() => setZapAnim("correct"));
          if (zapAnimTimer.current) clearTimeout(zapAnimTimer.current);
          zapAnimTimer.current = setTimeout(clearZapAnim, 380);
        }

        const nextStep = currentStep + 1;
        if (nextStep >= sequence.length) {
          // Sequence complete — generate a new (possibly longer) one.
          const growAt = GAME_CONFIG.securitySequenceGrowEvery;
          const newLen = GAME_CONFIG.securitySequenceSeedLength + Math.floor(nextHits / growAt);
          setSequence(generateSequence(Math.min(newLen, 10)));
          setCurrentStep(0);
        } else {
          setCurrentStep(nextStep);
        }
      } else {
        // Wrong press.
        if (pressed === "ZIP") {
          setZipAnim(null);
          requestAnimationFrame(() => setZipAnim("wrong"));
          if (zipAnimTimer.current) clearTimeout(zipAnimTimer.current);
          zipAnimTimer.current = setTimeout(clearZipAnim, 450);
        } else {
          setZapAnim(null);
          requestAnimationFrame(() => setZapAnim("wrong"));
          if (zapAnimTimer.current) clearTimeout(zapAnimTimer.current);
          zapAnimTimer.current = setTimeout(clearZapAnim, 450);
        }
      }
    },
    [isComplete, sequence, currentStep, totalHits, onZipZap, clearZipAnim, clearZapAnim],
  );

  // SVG progress ring.
  const radius = 72;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress / 100) * circ;

  // Completion screen.
  if (isComplete) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-6"
        style={{ background: "radial-gradient(ellipse at center, #34d39920 0%, transparent 70%)" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 180,
            height: 180,
            border: "4px solid #34d399",
            boxShadow: "0 0 60px #34d399aa, 0 0 120px #34d39940",
            animation: "securityComplete 1.5s ease-in-out infinite alternate",
          }}
        >
          <div style={{ fontSize: 64 }}>🛡</div>
        </div>
        <div
          className="text-3xl font-black uppercase tracking-widest"
          style={{ color, textShadow: "0 0 20px #34d399" }}
        >
          FIREWALL ACTIVE
        </div>
        <div className="text-sm text-slate-400">Department score: {score.toLocaleString()} pts</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-3 gap-2">

      {/* Header stats */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Progress</div>
          <div className="font-mono text-2xl font-black" style={{ color }}>
            {progress}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
          <div className="font-mono text-lg font-bold text-sky-300">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Hits</div>
          <div className="font-mono text-lg font-bold text-slate-300">
            {totalHits}
          </div>
        </div>
      </div>

      {/* Progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160, flexShrink: 0 }}>
        <svg width={160} height={160} viewBox="0 0 160 160" className="absolute" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={80} cy={80} r={radius} fill="none" stroke="#1e293b" strokeWidth={8} />
          <circle
            cx={80} cy={80} r={radius} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.3s ease-out", filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        {/* Shield icon center */}
        <div className="relative z-10 flex flex-col items-center">
          <span style={{ fontSize: 44 }}>🛡</span>
          <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color }}>FIREWALL</span>
        </div>
      </div>

      {/* Sequence bar */}
      <div className="w-full px-2">
        <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-500">
          Attack Sequence — press in order
        </div>
        {/* Threat scan animation container */}
        <div className="relative overflow-hidden rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
          {/* Scan-line threat effect */}
          <div
            className="threat-scan-line absolute inset-y-0 w-12 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.25), transparent)" }}
          />
          <div className="flex items-center justify-center gap-2 px-3 py-3 flex-wrap">
            {sequence.map((step, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <span
                  key={i}
                  className={isActive ? "zipzap-step-active" : ""}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 28,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    background: isDone
                      ? "rgba(52,211,153,0.08)"
                      : isActive
                        ? "rgba(52,211,153,0.25)"
                        : "rgba(15,32,53,0.8)",
                    border: isDone
                      ? "1px solid rgba(52,211,153,0.15)"
                      : isActive
                        ? "1.5px solid #34d399"
                        : "1px solid rgba(52,211,153,0.15)",
                    color: isDone ? "#34d39955" : isActive ? "#34d399" : "#64748b",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isDone ? "✓" : step}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ZIP / ZAP buttons */}
      <div className="flex w-full gap-3 px-2">
        <button
          id="security-zip-btn"
          type="button"
          onPointerDown={() => handlePress("ZIP")}
          className={[
            "ctrl-button flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-6 transition-all active:scale-95 select-none",
            zipAnim === "correct" ? "zipzap-correct" : "",
            zipAnim === "wrong" ? "zipzap-wrong" : "",
          ].join(" ")}
          style={{
            background:
              zipAnim === "correct"
                ? "rgba(52,211,153,0.22)"
                : zipAnim === "wrong"
                  ? "rgba(248,113,113,0.18)"
                  : "rgba(52,211,153,0.08)",
            borderColor:
              zipAnim === "correct"
                ? "#34d399"
                : zipAnim === "wrong"
                  ? "#f87171"
                  : "rgba(52,211,153,0.35)",
            WebkitTapHighlightColor: "transparent",
            touchAction: "none",
          }}
        >
          <div className="text-3xl font-black" style={{ color, fontFamily: "var(--font-mono)" }}>ZIP</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Block</div>
        </button>

        <button
          id="security-zap-btn"
          type="button"
          onPointerDown={() => handlePress("ZAP")}
          className={[
            "ctrl-button flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-6 transition-all active:scale-95 select-none",
            zapAnim === "correct" ? "zipzap-correct" : "",
            zapAnim === "wrong" ? "zipzap-wrong" : "",
          ].join(" ")}
          style={{
            background:
              zapAnim === "correct"
                ? "rgba(52,211,153,0.22)"
                : zapAnim === "wrong"
                  ? "rgba(248,113,113,0.18)"
                  : "rgba(52,211,153,0.08)",
            borderColor:
              zapAnim === "correct"
                ? "#34d399"
                : zapAnim === "wrong"
                  ? "#f87171"
                  : "rgba(52,211,153,0.35)",
            WebkitTapHighlightColor: "transparent",
            touchAction: "none",
          }}
        >
          <div className="text-3xl font-black" style={{ color: "#6ee7b7", fontFamily: "var(--font-mono)" }}>ZAP</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Zap</div>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full px-2">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Firewall</span>
          <span>{progress} / 100%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #064e3b, ${color})`,
              boxShadow: `0 0 8px ${color}80`,
              transition: "width 0.2s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── AI Core Puzzle mini-game ──────────────────────────────────────────────────

/** Each puzzle: the correct order of step labels + a theme label shown to the player. */
const AI_PUZZLES: { steps: readonly string[]; theme: string; hint: string }[] = [
  {
    steps: ["DATA", "TRAIN", "PREDICT", "DEPLOY"] as const,
    theme: "AI Pipeline",
    hint: "Collect data → train model → run predictions → ship to prod",
  },
  {
    steps: ["COLLECT", "CLEAN", "MODEL", "SHIP"] as const,
    theme: "ML Workflow",
    hint: "Raw data → cleaned dataset → trained model → deployed",
  },
  {
    steps: ["PROMPT", "ENCODE", "GENERATE", "OUTPUT"] as const,
    theme: "LLM Flow",
    hint: "User prompt → token encoding → text generation → response",
  },
  {
    steps: ["INGEST", "EMBED", "SEARCH", "RETRIEVE"] as const,
    theme: "RAG System",
    hint: "Load docs → create embeddings → vector search → fetch context",
  },
  {
    steps: ["SENSE", "ANALYSE", "DECIDE", "ACT"] as const,
    theme: "AI Agent",
    hint: "Perceive world → analyse state → choose action → execute",
  },
];

/** Fisher-Yates shuffle — guarantees the result is never already sorted. */
function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // If accidentally already sorted, do one guaranteed swap.
  const sorted = arr.every((v, i) => v === i);
  if (sorted && n > 1) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

interface AiCorePuzzleGameProps {
  progress: number;
  status: string;
  score: number;
  onSolve: () => void;
}

function AiCorePuzzleGame({ progress, status, score, onSolve }: AiCorePuzzleGameProps) {
  const isComplete = status === "complete";
  const color = "#c084fc"; // purple — model role color

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(4));
  const [selected, setSelected] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  // solving: animating the correct-solve flash before loading next puzzle
  const [solving, setSolving] = useState(false);

  const puzzle = AI_PUZZLES[puzzleIdx % AI_PUZZLES.length];

  const handleTap = useCallback(
    (pos: number) => {
      if (solving || isComplete) return;

      if (selected === null) {
        setSelected(pos);
        return;
      }
      if (selected === pos) {
        setSelected(null); // deselect
        return;
      }

      // Swap selected ↔ tapped.
      const next = [...order];
      [next[selected], next[pos]] = [next[pos], next[selected]];
      setOrder(next);
      setSelected(null);

      // Check if correctly ordered.
      const correct = next.every((v, i) => v === i);
      if (correct) {
        setSolving(true);
        onSolve();
        setTimeout(() => {
          setSolving(false);
          setSolvedCount((c) => c + 1);
          setPuzzleIdx((i) => i + 1);
          setOrder(shuffleIndices(4));
        }, 850);
      }
    },
    [selected, order, solving, isComplete, onSolve],
  );

  // Progress ring.
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress / 100) * circ;

  // ── Completion screen ─────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-6"
        style={{ background: "radial-gradient(ellipse at center, #c084fc20 0%, transparent 70%)" }}
      >
        {/* Glowing brain ring */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 180,
            height: 180,
            border: "4px solid #c084fc",
            boxShadow: "0 0 60px #c084fcaa, 0 0 120px #c084fc40",
            animation: "modelComplete 1.5s ease-in-out infinite alternate",
          }}
        >
          <div style={{ fontSize: 64 }}>🧠</div>
        </div>
        <div
          className="text-3xl font-black uppercase tracking-widest"
          style={{ color, textShadow: "0 0 20px #c084fc" }}
        >
          MODEL OPTIMISED
        </div>
        <div className="text-sm text-slate-400">Department score: {score.toLocaleString()} pts</div>
      </div>
    );
  }

  // ── Main puzzle UI ──────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-3 gap-3">

      {/* Header stats */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Progress</div>
          <div className="font-mono text-2xl font-black" style={{ color }}>
            {progress}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
          <div className="font-mono text-lg font-bold text-sky-300">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Solved</div>
          <div className="font-mono text-lg font-bold text-slate-300">
            {solvedCount}
          </div>
        </div>
      </div>

      {/* Progress ring + brain */}
      <div className="relative flex items-center justify-center" style={{ width: 130, height: 130, flexShrink: 0 }}>
        <svg width={130} height={130} viewBox="0 0 130 130" className="absolute" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={65} cy={65} r={radius} fill="none" stroke="#1e293b" strokeWidth={7} />
          <circle
            cx={65} cy={65} r={radius} fill="none"
            stroke={color} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.4s ease-out", filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span style={{ fontSize: 36 }}>🧠</span>
          <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color }}>AI CORE</span>
        </div>
      </div>

      {/* Puzzle area */}
      <div className="w-full px-2 flex flex-col gap-2 flex-1">
        {/* Theme + instruction */}
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
            {puzzle.theme}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Tap to select • tap another to swap • arrange in order →
          </div>
        </div>

        {/* Pipeline cards — vertical stack */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {order.map((stepIndex, pos) => {
            const label = puzzle.steps[stepIndex];
            const isSelected = selected === pos;
            const isCorrect = stepIndex === pos;
            return (
              <button
                key={`${puzzleIdx}-${pos}`}
                type="button"
                id={`puzzle-card-${pos}`}
                onPointerDown={() => handleTap(pos)}
                className={[
                  "ctrl-button w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all active:scale-98 select-none",
                  solving ? "puzzle-card-solve" : "",
                  isSelected && !solving ? "puzzle-card-selected" : "",
                ].join(" ")}
                style={{
                  background: solving
                    ? "rgba(192,132,252,0.12)"
                    : isSelected
                      ? "rgba(192,132,252,0.18)"
                      : "rgba(15,32,53,0.9)",
                  border: isSelected && !solving
                    ? "2px solid #c084fc"
                    : solving
                      ? "2px solid #4ade80"
                      : `1px solid rgba(192,132,252,${isCorrect ? "0.35" : "0.15"})`,
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "none",
                }}
              >
                {/* Position number */}
                <span
                  className="text-[11px] font-black font-mono w-5 text-center shrink-0"
                  style={{ color: isSelected ? color : "#475569" }}
                >
                  {pos + 1}
                </span>
                {/* Arrow connector */}
                <span className="text-slate-700 text-xs shrink-0">→</span>
                {/* Step label */}
                <span
                  className="flex-1 text-center font-black tracking-widest"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 18,
                    color: isSelected ? color : solving ? "#4ade80" : "#e2e8f0",
                    transition: "color 0.15s ease",
                  }}
                >
                  {label}
                </span>
                {/* Correct indicator (subtle — only when solving) */}
                {solving && (
                  <span className="text-green-400 text-lg shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint text */}
      <div className="w-full px-2 text-center">
        <div className="text-[9px] text-slate-600 leading-relaxed">{puzzle.hint}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full px-2">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>AI Core</span>
          <span>{progress} / 100%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #4a044e, ${color})`,
              boxShadow: `0 0 8px ${color}80`,
              transition: "width 0.35s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Cooling Engineer mini-game — Gyroscope spirit level ──────────────────

/**
 * Tries to request DeviceOrientationEvent permission (required on iOS 13+).
 * Resolves to 'granted' | 'denied' | 'unavailable'.
 */
async function requestOrientationPermission(): Promise<"granted" | "denied" | "unavailable"> {
  // iOS 13+ requires an explicit permission call.
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (DeviceOrientationEvent as any).requestPermission === "function"
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DeviceOrientationEvent as any).requestPermission();
      return result === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  // Android / desktop: event fires without a permission prompt.
  if (typeof DeviceOrientationEvent !== "undefined" && "ondeviceorientation" in window) {
    return "granted";
  }
  return "unavailable";
}

type OrientationState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface CoolingGameProps {
  temperature: number;
  progress: number;
  status: string;
  score: number;
  onTick: (centeredness: number) => void;
}

function CoolingGame({ temperature, progress, status, score, onTick }: CoolingGameProps) {
  const isComplete = status === "complete";
  const color = "#38bdf8"; // sky-400 — cooling role colour

  // ── Orientation permission state ────────────────────────────────────────
  const [orientState, setOrientState] = useState<OrientationState>("idle");

  // ── Live bubble position in normalised [-1, 1] x/y space ────────────────
  // x = left/right (gamma), y = front/back (beta)
  const bubblePosRef = useRef({ x: 0, y: 0 });
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });

  // ── Bounds circle ref (for touch coordinate mapping) ────────────────────
  const boundsRef = useRef<HTMLDivElement>(null);

  // ── Periodic network tick ───────────────────────────────────────────────
  const lastTickRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      const { x, y } = bubblePosRef.current;
      // centeredness: 0 = perfect centre, 1 = edge
      const centeredness = Math.min(1, Math.sqrt(x * x + y * y));
      onTick(centeredness);
    }, GAME_CONFIG.coolingTickThrottleMs);
    return () => clearInterval(id);
  }, [onTick]);

  // ── Device orientation event listener ───────────────────────────────────
  useEffect(() => {
    if (orientState !== "granted") return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left/right tilt, -90 to 90
      const beta = e.beta ?? 0;  // front/back tilt, -180 to 180

      const maxAngle = GAME_CONFIG.coolingMaxTiltAngle;
      const nx = Math.min(1, Math.max(-1, gamma / maxAngle));
      const ny = Math.min(1, Math.max(-1, (beta - 45) / maxAngle)); // 45° offset for natural hold

      bubblePosRef.current = { x: nx, y: ny };
      setBubblePos({ x: nx, y: ny });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [orientState]);

  // ── Touch drag fallback ─────────────────────────────────────────────────
  const touchActiveRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchActiveRef.current = true;
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchActiveRef.current || !boundsRef.current) return;
    e.preventDefault();
    const rect = boundsRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = rect.width / 2;
    const dx = (touch.clientX - cx) / r;
    const dy = (touch.clientY - cy) / r;
    // Clamp within unit circle.
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = len > 1 ? 1 / len : 1;
    const nx = dx * scale;
    const ny = dy * scale;
    bubblePosRef.current = { x: nx, y: ny };
    setBubblePos({ x: nx, y: ny });
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false;
    // Glide back to center on release.
    bubblePosRef.current = { x: 0, y: 0 };
    setBubblePos({ x: 0, y: 0 });
  }, []);

  // ── Request permission on button press ──────────────────────────────────
  const handleRequestPermission = useCallback(async () => {
    setOrientState("requesting");
    const result = await requestOrientationPermission();
    setOrientState(result);
  }, []);

  // Auto-attempt permission on mount for non-iOS (no prompt needed).
  useEffect(() => {
    if (orientState === "idle") {
      requestOrientationPermission().then((result) => {
        // On desktop/Android we get granted immediately without user gesture.
        // On iOS we stay 'idle' until the user taps.
        if (result !== "denied") {
          setOrientState(result);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived display values ──────────────────────────────────────────────
  const centeredness = Math.min(1, Math.sqrt(bubblePos.x ** 2 + bubblePos.y ** 2));
  const isCentered = centeredness <= GAME_CONFIG.coolingCenteredThreshold;
  const inSafeZone = temperature >= GAME_CONFIG.coolingSafeMin && temperature <= GAME_CONFIG.coolingSafeMax;

  // Bubble render: map [-1,1] to pixels within bounds circle.
  const BOUNDS_R = 110; // px radius of the bounds circle
  const BUBBLE_R = 28;  // px radius of the bubble
  const maxTravel = BOUNDS_R - BUBBLE_R;
  const bx = bubblePos.x * maxTravel;
  const by = bubblePos.y * maxTravel;

  // Temperature colour gradient: blue (cool) → orange (hot)
  const tempFraction = Math.min(1, Math.max(0, (temperature - 50) / 70)); // 50°=0, 120°=1
  const tempColor = inSafeZone ? "#34d399" : tempFraction > 0.7 ? "#f87171" : tempFraction > 0.45 ? "#fb923c" : "#38bdf8";

  // Progress ring.
  const ringRadius = 50;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (progress / 100) * ringCirc;

  // ── Completion screen ───────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-6"
        style={{ background: "radial-gradient(ellipse at center, #38bdf820 0%, transparent 70%)" }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 200,
            height: 200,
            border: "4px solid #38bdf8",
            boxShadow: "0 0 60px #38bdf8aa, 0 0 120px #38bdf840",
            animation: "dataComplete 1.5s ease-in-out infinite alternate",
          }}
        >
          <div style={{ fontSize: 72 }}>❄️</div>
        </div>
        <div
          className="text-3xl font-black uppercase tracking-widest"
          style={{ color, textShadow: "0 0 20px #38bdf8" }}
        >
          COOLING STABLE
        </div>
        <div className="text-sm text-slate-400">Department score: {score.toLocaleString()} pts</div>
      </div>
    );
  }

  // ── Permission gate — iOS needs a user-gesture tap ───────────────────────
  const needsPermissionTap = orientState === "idle" || orientState === "requesting";
  const showTouchFallback = orientState === "denied" || orientState === "unavailable";
  const showOrientUI = orientState === "granted";

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-3 gap-2" style={{ touchAction: "none" }}>

      {/* Header stats */}
      <div className="flex w-full items-center justify-between px-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Progress</div>
          <div className="font-mono text-2xl font-black" style={{ color }}>{progress}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Temp</div>
          <div className="font-mono text-xl font-black" style={{ color: tempColor }}>
            {temperature.toFixed(1)}°C
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
          <div className="font-mono text-lg font-bold text-sky-300">{score.toLocaleString()}</div>
        </div>
      </div>

      {/* Safe zone label */}
      <div
        className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
        style={{
          background: inSafeZone ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.1)",
          color: inSafeZone ? "#34d399" : "#f87171",
          border: `1px solid ${inSafeZone ? "#34d39940" : "#f8717140"}`,
          transition: "all 0.3s ease",
        }}
      >
        {inSafeZone ? `✓ Safe zone ${GAME_CONFIG.coolingSafeMin}–${GAME_CONFIG.coolingSafeMax}°C` : `Target: ${GAME_CONFIG.coolingSafeMin}–${GAME_CONFIG.coolingSafeMax}°C`}
      </div>

      {/* Spirit level / touch area */}
      <div className="relative flex items-center justify-center" style={{ flexShrink: 0 }}>
        {/* Outer bounds ring */}
        <div
          ref={boundsRef}
          onTouchStart={showTouchFallback ? handleTouchStart : undefined}
          onTouchMove={showTouchFallback ? handleTouchMove : undefined}
          onTouchEnd={showTouchFallback ? handleTouchEnd : undefined}
          style={{
            position: "relative",
            width: BOUNDS_R * 2,
            height: BOUNDS_R * 2,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, rgba(15,32,53,0.95) 75%)",
            border: `2px solid ${isCentered ? "#34d399" : "rgba(56,189,248,0.3)"}`,
            boxShadow: isCentered ? "0 0 24px #34d39960" : `0 0 12px rgba(56,189,248,0.15)`,
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            overflow: "hidden",
          }}
        >
          {/* Cross-hair centre marker */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}>
            {/* Centre ring target */}
            <div style={{
              width: BOUNDS_R * 2 * GAME_CONFIG.coolingCenteredThreshold * 2,
              height: BOUNDS_R * 2 * GAME_CONFIG.coolingCenteredThreshold * 2,
              borderRadius: "50%",
              border: `1.5px dashed ${isCentered ? "#34d399" : "rgba(56,189,248,0.4)"}`,
              transition: "border-color 0.3s ease",
            }} />
          </div>

          {/* Crosshair lines */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(56,189,248,0.12)",
            transform: "translateY(-0.5px)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(56,189,248,0.12)",
            transform: "translateX(-0.5px)",
            pointerEvents: "none",
          }} />

          {/* ── Bubble ── */}
          <div
            style={{
              position: "absolute",
              width: BUBBLE_R * 2,
              height: BUBBLE_R * 2,
              borderRadius: "50%",
              // Centre of bounds + offset
              left: BOUNDS_R - BUBBLE_R + bx,
              top: BOUNDS_R - BUBBLE_R + by,
              background: `radial-gradient(circle at 35% 35%, ${isCentered ? "#34d399" : tempColor}cc, ${isCentered ? "#34d399" : tempColor}44)`,
              border: `2px solid ${isCentered ? "#34d399" : tempColor}`,
              boxShadow: `0 0 18px ${isCentered ? "#34d399" : tempColor}88`,
              transition: orientState === "granted" ? "left 0.08s ease-out, top 0.08s ease-out" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 18 }}>❄️</span>
          </div>

          {/* iOS permission overlay */}
          {needsPermissionTap && (
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(5,10,20,0.82)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              zIndex: 10,
            }}>
              <div style={{ fontSize: 32 }}>🔄</div>
              <div className="text-xs text-sky-300 font-bold uppercase tracking-wider text-center px-4">
                {orientState === "requesting" ? "Requesting…" : "Tap to enable\nGyroscope"}
              </div>
            </div>
          )}

          {/* Touch fallback hint overlay */}
          {showTouchFallback && centeredness < 0.05 && (
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              pointerEvents: "none",
              zIndex: 5,
            }}>
              <div style={{ fontSize: 22, opacity: 0.5 }}>👆</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Drag to control</div>
            </div>
          )}
        </div>
      </div>

      {/* Mode label / permission button */}
      <div className="flex flex-col items-center gap-2 w-full px-4">
        {needsPermissionTap && (
          <button
            id="cooling-enable-gyro-btn"
            type="button"
            onClick={handleRequestPermission}
            disabled={orientState === "requesting"}
            className="ctrl-button w-full rounded-2xl py-3 text-sm font-bold uppercase tracking-wider active:scale-95 transition-all"
            style={{
              background: "rgba(56,189,248,0.12)",
              border: "2px solid rgba(56,189,248,0.4)",
              color: "#38bdf8",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            🎮 Enable Gyroscope
          </button>
        )}
        {showTouchFallback && (
          <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center">
            Touch fallback active — drag the bubble to centre
          </div>
        )}
        {showOrientUI && (
          <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center">
            Tilt your phone to centre the bubble
          </div>
        )}
      </div>

      {/* Progress ring + temperature */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120, flexShrink: 0 }}>
        <svg width={120} height={120} viewBox="0 0 120 120" className="absolute" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={60} cy={60} r={ringRadius} fill="none" stroke="#1e293b" strokeWidth={7} />
          <circle
            cx={60} cy={60} r={ringRadius} fill="none"
            stroke={color} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={ringCirc}
            strokeDashoffset={ringOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease-out", filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span style={{ fontSize: 28 }}>🌡️</span>
          <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color }}>COOLING</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full px-2">
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Coolant</span>
          <span>{progress} / 100%</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #0c4a6e, ${color})`,
              boxShadow: `0 0 8px ${color}80`,
              transition: "width 0.5s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Per-role dev test action buttons ─────────────────────────────────────

interface RoleDevPanelProps {
  role: PlayerRole;
  progress: number;
  status: string;
  actions: ReturnType<typeof useFactoryStore.useActions>;
  coolingTemp: number;
}

function RoleDevPanel({ role, progress, status, actions, coolingTemp }: RoleDevPanelProps) {
  const color = ROLE_COLORS[role];
  const amt = GAME_CONFIG.devIncrementAmount;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Progress display */}
      <div className="w-full factory-panel p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-widest text-slate-400">Progress</span>
          <span className="font-mono font-black text-2xl" style={{ color }}>{progress}%</span>
        </div>
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="progress-fill absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${progress}%`, background: color }}
          />
        </div>
        <div className="text-xs text-center text-slate-500 uppercase tracking-widest">{status}</div>
      </div>

      {/* Role-specific dev controls */}
      {role === "power" && (
        <button
          type="button"
          className="ctrl-button w-full rounded-2xl py-8 text-3xl font-black uppercase tracking-wider active:scale-95 transition-all"
          style={{ background: `${color}25`, border: `2px solid ${color}60`, color }}
          onClick={() => actions.devIncrementPower({ amount: amt })}
        >
          ⚡ TAP POWER
          <br />
          <span className="text-sm font-normal normal-case">+{amt}% per tap</span>
        </button>
      )}

      {role === "data" && (
        <button
          type="button"
          className="ctrl-button w-full rounded-2xl py-8 text-3xl font-black uppercase tracking-wider active:scale-95 transition-all"
          style={{ background: `${color}25`, border: `2px solid ${color}60`, color }}
          onClick={() => actions.devIncrementData({ amount: amt })}
        >
          💾 SORT DATA
          <br />
          <span className="text-sm font-normal normal-case">+{amt}% per sort</span>
        </button>
      )}

      {role === "security" && (
        <div className="flex gap-3 w-full">
          <button
            type="button"
            className="ctrl-button flex-1 rounded-2xl py-8 text-2xl font-black active:scale-95 transition-all"
            style={{ background: `${color}25`, border: `2px solid ${color}60`, color }}
            onClick={() => actions.devIncrementSecurity({ amount: amt })}
          >
            ZIP<br /><span className="text-xs font-normal">+{amt}%</span>
          </button>
          <button
            type="button"
            className="ctrl-button flex-1 rounded-2xl py-8 text-2xl font-black active:scale-95 transition-all"
            style={{ background: `${color}25`, border: `2px solid ${color}60`, color }}
            onClick={() => actions.devIncrementSecurity({ amount: amt })}
          >
            ZAP<br /><span className="text-xs font-normal">+{amt}%</span>
          </button>
        </div>
      )}

      {role === "model" && (
        <button
          type="button"
          className="ctrl-button w-full rounded-2xl py-8 text-3xl font-black uppercase tracking-wider active:scale-95 transition-all"
          style={{ background: `${color}25`, border: `2px solid ${color}60`, color }}
          onClick={() => actions.devIncrementModel({ amount: amt })}
        >
          🧠 OPTIMIZE
          <br />
          <span className="text-sm font-normal normal-case">+{amt}% per solve</span>
        </button>
      )}

      {role === "cooling" && (
        <CoolingDevPanel
          temperature={coolingTemp}
          onSet={(t) => actions.devSetCoolingTemp({ temperature: t })}
        />
      )}

      <div className="text-xs text-slate-600 text-center">
        DEV TEST MODE · Real mini-game in next milestone
      </div>
    </div>
  );
}

// ── Main Controller View ───────────────────────────────────────────────────

export function ControllerView() {
  const controller = useAirJamController();
  // Typed selector to avoid `state is unknown` TS error.
  const state = useFactoryStore((s: FactoryState) => s);
  const actions = useFactoryStore.useActions();
  const requestedRef = useRef(false);

  const myId = controller.controllerId;
  const myRole = myId ? (state.roleAssignments[myId] as PlayerRole | undefined) : undefined;
  const connected = controller.connectionStatus === "connected";
  const color = myRole ? ROLE_COLORS[myRole] : "#38bdf8";

  // Auto-request role once connected.
  useEffect(() => {
    if (connected && !myRole && !requestedRef.current) {
      requestedRef.current = true;
      actions.requestRole();
    }
  }, [connected, myRole, actions]);

  // ── Connecting ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <SurfaceViewport orientation="portrait" className="bg-[#050a14]">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 20,
            padding: 24,
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(56,189,248,0.05) 0%, #050a14 70%)",
          }}
        >
          {/* Animated logo */}
          <div
            style={{
              fontSize: 56,
              animation: "aiCorePulse 2.5s ease-in-out infinite",
              filter: "drop-shadow(0 0 16px rgba(56,189,248,0.5))",
            }}
          >
            🏭
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#38bdf8",
              textShadow: "0 0 20px rgba(56,189,248,0.5)",
            }}
          >
            AI FACTORY
          </div>
          {/* Dot loader */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#38bdf8",
                  animation: `activityDot 1.2s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#475569",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {controller.connectionStatus === "connecting"
              ? "Connecting to factory…"
              : "Reconnecting…"}
          </div>
          {controller.connectionStatus === "disconnected" && (
            <button
              type="button"
              className="ctrl-button"
              onClick={controller.reconnect}
              style={{
                marginTop: 8,
                borderRadius: 12,
                border: "1.5px solid rgba(56,189,248,0.35)",
                padding: "10px 28px",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
                background: "rgba(56,189,248,0.07)",
                letterSpacing: "0.06em",
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      </SurfaceViewport>
    );
  }

  // ── Waiting for role assignment ─────────────────────────────────────────
  if (!myRole) {
    return (
      <SurfaceViewport orientation="portrait" className="bg-[#050a14]">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 20,
            padding: 24,
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(56,189,248,0.05) 0%, #050a14 70%)",
          }}
        >
          <div
            style={{
              fontSize: 52,
              animation: "spinSlow 3s linear infinite",
              filter: "drop-shadow(0 0 12px rgba(56,189,248,0.4))",
            }}
          >
            ⚙️
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: "#38bdf8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Joining Factory…
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#475569",
                  animation: `activityDot 1.1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#334155",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Awaiting role assignment
          </div>
        </div>
      </SurfaceViewport>
    );
  }

  // ── Lobby ───────────────────────────────────────────────────────────────
  if (state.phase === "idle" || state.phase === "lobby") {
    const readyCount = Object.keys(state.roleAssignments).length;
    return (
      <SurfaceViewport orientation="portrait" className="bg-[#050a14]">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 24,
            padding: 24,
            background: `radial-gradient(ellipse at 50% 40%, ${color}08 0%, #050a14 65%)`,
          }}
        >
          {/* Role card */}
          <div
            style={{
              width: "100%",
              maxWidth: 300,
              background: `linear-gradient(145deg, rgba(13,24,37,0.95), rgba(15,32,53,0.98))`,
              border: `2px solid ${color}55`,
              borderLeft: `5px solid ${color}`,
              borderRadius: 18,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              boxShadow: `0 0 40px ${color}20, inset 0 1px 0 ${color}15`,
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: 64,
                filter: `drop-shadow(0 0 16px ${color}88)`,
                lineHeight: 1,
              }}
            >
              {ROLE_ICONS[myRole]}
            </div>

            {/* Role label */}
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${color}80`,
              }}
            >
              Your Role
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color,
                textShadow: `0 0 16px ${color}80`,
              }}
            >
              {ROLE_LABELS[myRole]}
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
              }}
            />

            {/* Mission */}
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {ROLE_MINI_GAME[myRole]}
            </div>
          </div>

          {/* Engineer count */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {readyCount} / {GAME_CONFIG.maxPlayers} engineers ready
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: "#38bdf8",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                animation: "warningPulse 2s ease-in-out infinite",
              }}
            >
              Waiting for host to launch…
            </div>
          </div>

          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "#1e293b",
              letterSpacing: "0.08em",
            }}
          >
            {myId?.slice(0, 12)}
          </div>
        </div>
      </SurfaceViewport>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────
  if (state.phase === "playing") {
    const deptState = state[myRole] as { progress: number; status: string };
    const myEvent = state.activeEvents.find((e) => e.affectedRole === myRole);
    const timerSecs = state.timeRemaining;
    const timerDanger = timerSecs < 30;
    const timerWarn = timerSecs < 60 && timerSecs >= 30;

    return (
      <SurfaceViewport orientation="portrait" className="bg-[#050a14]">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            gap: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${color}06 0%, #050a14 50%)`,
          }}
        >
          {/* ── Playing header bar ─────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderBottom: `1.5px solid ${myEvent ? "rgba(251,146,60,0.6)" : color + "30"}`,
              background:
                myEvent
                  ? "rgba(251,146,60,0.06)"
                  : `linear-gradient(180deg, ${color}08 0%, rgba(5,10,20,0.95) 100%)`,
              flexShrink: 0,
              transition: "border-color 0.3s ease, background 0.3s ease",
              animation: myEvent ? "warningPulse 0.9s ease-in-out infinite" : undefined,
            }}
          >
            {/* Role badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <span style={{ fontSize: 22, filter: `drop-shadow(0 0 8px ${color}88)` }}>
                {ROLE_ICONS[myRole]}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  Role
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color,
                    textShadow: `0 0 10px ${color}70`,
                  }}
                >
                  {ROLE_LABELS[myRole]}
                </div>
              </div>
            </div>

            {/* Timer */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 8,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Time
              </div>
              <div
                className={timerDanger ? "timer-danger" : ""}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 22,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: timerDanger
                    ? "#f87171"
                    : timerWarn
                      ? "#fb923c"
                      : "#f0f9ff",
                  transition: "color 0.4s ease",
                }}
              >
                {String(Math.floor(timerSecs / 60)).padStart(2, "0")}:
                {String(timerSecs % 60).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* ── Event warning ───────────────────────────────── */}
          {myEvent && (
            <div
              style={{
                padding: "8px 14px",
                background:
                  "repeating-linear-gradient(45deg, rgba(251,146,60,0.06) 0px, rgba(251,146,60,0.06) 8px, transparent 8px, transparent 18px)",
                borderBottom: "1px solid rgba(251,146,60,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                flexShrink: 0,
                animation: "warningPulse 0.9s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: 14 }}>⚠</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fb923c",
                  textAlign: "center",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textShadow: "0 0 10px rgba(251,146,60,0.6)",
                }}
              >
                {myEvent.message}
              </span>
              <span style={{ fontSize: 14 }}>⚠</span>
            </div>
          )}

          {/* ── Mini-game area ──────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 16px 16px" }}>
            {myRole === "power" ? (
              <PowerGame
                progress={deptState.progress}
                status={deptState.status}
                score={(state.power as { score: number }).score}
                onTap={() => actions.tapPower()}
              />
            ) : myRole === "data" ? (
              <DataCleaningGame
                progress={deptState.progress}
                status={deptState.status}
                score={(state.data as { score: number }).score}
                onSort={(token, bucket, correct) =>
                  actions.sortData({ token, bucket, correct })
                }
              />
            ) : myRole === "security" ? (
              <ZipZapGame
                progress={deptState.progress}
                status={deptState.status}
                score={(state.security as { score: number }).score}
                onZipZap={(hit) => actions.zipZap({ hit })}
              />
            ) : myRole === "model" ? (
              <AiCorePuzzleGame
                progress={deptState.progress}
                status={deptState.status}
                score={(state.model as { score: number }).score}
                onSolve={() => actions.solvePuzzle()}
              />
            ) : myRole === "cooling" ? (
              <CoolingGame
                temperature={state.cooling.temperature}
                progress={deptState.progress}
                status={deptState.status}
                score={(state.cooling as { score: number }).score}
                onTick={(centeredness) => actions.coolTick({ centeredness })}
              />
            ) : (
              <RoleDevPanel
                role={myRole}
                progress={deptState.progress}
                status={deptState.status}
                actions={actions}
                coolingTemp={state.cooling.temperature}
              />
            )}
          </div>
        </div>
      </SurfaceViewport>
    );
  }

  // ── Ended ───────────────────────────────────────────────────────────────
  const success = state.finalResult === "success";
  const myProgress = (state[myRole] as { progress: number }).progress;
  const myScore = (state[myRole] as { score: number }).score;
  const resultColor = success ? "#4ade80" : "#f87171";

  return (
    <SurfaceViewport orientation="portrait" className="bg-[#050a14]">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
          padding: 24,
          background: success
            ? "radial-gradient(ellipse at 50% 40%, rgba(74,222,128,0.07) 0%, #050a14 60%)"
            : "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.08) 0%, #050a14 60%)",
          overflow: "auto",
        }}
      >
        {/* Result icon */}
        <div
          className="result-reveal"
          style={{
            fontSize: 64,
            filter: `drop-shadow(0 0 20px ${resultColor}88)`,
            animation: success ? "aiCoreVictory 2s ease-in-out infinite" : undefined,
          }}
        >
          {success ? "🏭" : "💥"}
        </div>

        {/* Result headline */}
        <div
          className="result-reveal"
          style={{
            fontSize: 24,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: resultColor,
            textShadow: `0 0 30px ${resultColor}80`,
            textAlign: "center",
          }}
        >
          {success ? "AI Deployed!" : "Factory Failed"}
        </div>

        {/* Dept result card */}
        <div
          className="result-reveal result-reveal-delay-1"
          style={{
            width: "100%",
            maxWidth: 300,
            background: `linear-gradient(145deg, ${color}10, rgba(13,24,37,0.95))`,
            border: `2px solid ${color}50`,
            borderLeft: `5px solid ${color}`,
            borderRadius: 16,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Your Department
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28, filter: `drop-shadow(0 0 10px ${color}80)` }}>
              {ROLE_ICONS[myRole]}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color,
                }}
              >
                {ROLE_LABELS[myRole]}
              </div>
              <div style={{ fontSize: 9, color: "#475569" }}>{ROLE_MINI_GAME[myRole]}</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 32,
                fontWeight: 900,
                color,
                textShadow: `0 0 12px ${color}80`,
              }}
            >
              {myProgress}%
            </div>
          </div>
          {/* Mini progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: "#0f172a", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${myProgress}%`,
                borderRadius: 3,
                background: color,
                boxShadow: `0 0 8px ${color}80`,
                transition: "width 0.6s ease-out",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "#475569",
              textAlign: "right",
            }}
          >
            {myScore.toLocaleString()} pts
          </div>
        </div>

        {/* Factory stats */}
        <div
          className="result-reveal result-reveal-delay-2"
          style={{
            display: "flex",
            gap: 24,
            background: "rgba(13,24,37,0.85)",
            border: "1px solid rgba(56,189,248,0.12)",
            borderRadius: 14,
            padding: "14px 28px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Factory Health
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 900,
                color: state.factoryHealth >= 70 ? "#4ade80" : state.factoryHealth >= 45 ? "#fb923c" : "#f87171",
              }}
            >
              {state.factoryHealth}%
            </div>
          </div>
          <div style={{ width: 1, background: "rgba(56,189,248,0.1)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Team Score
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 900,
                color: "#38bdf8",
              }}
            >
              {state.teamScore.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </SurfaceViewport>
  );
}

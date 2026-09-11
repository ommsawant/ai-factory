/**
 * Host screen — AI Factory (Expo Polish Edition).
 *
 * Phases:
 *  idle    → Attract screen with hex grid + QR code + ambient particles
 *  lobby   → Player roster; Start Game when 5/5 filled
 *  playing → AI Control Room: hub-and-spoke, SVG pipelines, overlays
 *  ended   → Deploy animation → Success / Failure result screen
 */
import { useAirJamHost, useHostTick } from "@air-jam/sdk";
import { HostPreviewControllerWorkspace } from "@air-jam/sdk/preview";
import { RoomQrCode, SurfaceViewport } from "@air-jam/sdk/ui";
import { useEffect, useRef, useState } from "react";
import {
  ALL_ROLES,
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_LABELS,
  ROLE_MINI_GAME,
  type PlayerRole,
} from "../game/domain/types";
import { GAME_CONFIG } from "../game/config/gameConfig";
import { useFactoryStore, type FactoryState } from "../game/store/factoryStore";
import { HexGrid } from "./components/HexGrid";
import { AICore } from "./components/AICore";
import { DeptPanel } from "./components/DeptPanel";
import { PipelineOverlay } from "./components/PipelineOverlay";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function healthColor(health: number): string {
  if (health >= 70) return "#4ade80";
  if (health >= 45) return "#fb923c";
  return "#f87171";
}

// ── Ambient Particles (idle screen) ───────────────────────────────────────

function AmbientParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${4 + (i * 4.4) % 92}%`,
    bottom: `${(i * 11) % 38}%`,
    duration: `${2.8 + (i * 0.65) % 3.5}s`,
    delay: `${(i * 0.38) % 2.8}s`,
    size: i % 4 === 0 ? 6 : i % 4 === 1 ? 5 : i % 4 === 2 ? 3 : 4,
    color:
      i % 5 === 0 ? "rgba(250,204,21,0.65)" :
      i % 5 === 1 ? "rgba(192,132,252,0.55)" :
      i % 5 === 2 ? "rgba(52,211,153,0.55)" :
      i % 5 === 3 ? "rgba(96,165,250,0.6)" :
                    "rgba(56,189,248,0.65)",
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="idle-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── Success Particles ──────────────────────────────────────────────────────

function SuccessParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 360;
    const dist = 80 + (i % 3) * 50;
    const px = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
    const py = Math.round(-Math.abs(Math.sin((angle * Math.PI) / 180) * dist) - 30);
    const colors = ["#4ade80", "#facc15", "#38bdf8", "#c084fc", "#34d399"];
    return {
      id: i,
      color: colors[i % colors.length],
      size: 6 + (i % 3) * 4,
      delay: `${(i * 0.08) % 0.8}s`,
      px: `${px}px`,
      py: `${py}px`,
    };
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="success-particle"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDelay: p.delay,
            "--px": p.px,
            "--py": p.py,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Cyber-Attack Event Banner ──────────────────────────────────────────────

interface EventBannerProps {
  message: string;
}

function EventBanner({ message }: EventBannerProps) {
  return (
    <div
      className="event-banner-enter"
      style={{
        position: "relative",
        width: "100%",
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        overflow: "hidden",
        animation: "warningPulse 0.9s ease-in-out infinite",
        borderTop: "1.5px solid rgba(251,146,60,0.7)",
        borderBottom: "1.5px solid rgba(251,146,60,0.7)",
        background:
          "repeating-linear-gradient(45deg, rgba(251,146,60,0.07) 0px, rgba(251,146,60,0.07) 10px, transparent 10px, transparent 22px)",
        flexShrink: 0,
      }}
    >
      {/* Scan overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(251,146,60,0.15) 50%, transparent 100%)",
          animation: "threatScan 1.8s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Glitch clone text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#38bdf8",
            animation: "cyberGlitch 3s linear infinite 0.5s",
            opacity: 0.6,
          }}
        >
          {message}
        </span>
      </div>

      <span
        style={{
          fontSize: 16,
          zIndex: 1,
          animation: "warningPulse 0.6s ease-in-out infinite",
        }}
      >
        ⚠
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#fb923c",
          zIndex: 1,
          textShadow: "0 0 14px rgba(251,146,60,0.8)",
        }}
      >
        {message}
      </span>
      <span
        style={{
          fontSize: 16,
          zIndex: 1,
          animation: "warningPulse 0.6s ease-in-out infinite",
        }}
      >
        ⚠
      </span>
    </div>
  );
}

// ── Factory Health Bar (segmented) ─────────────────────────────────────────

function HealthBar({ health }: { health: number }) {
  const segments = 10;
  const filled = Math.ceil((health / 100) * segments);
  const color = healthColor(health);

  return (
    <div style={{ padding: "5px 20px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#334155",
            whiteSpace: "nowrap",
          }}
        >
          Factory Health
        </span>
        <div style={{ flex: 1, display: "flex", gap: 2 }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 2,
                background:
                  i < filled
                    ? color
                    : "rgba(15,23,42,0.9)",
                boxShadow: i < filled ? `0 0 6px ${color}70` : undefined,
                border: `1px solid ${i < filled ? color + "60" : "rgba(30,41,59,0.8)"}`,
                transition: "background 0.4s ease, box-shadow 0.4s ease",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 900,
            color,
            whiteSpace: "nowrap",
            transition: "color 0.4s ease",
          }}
        >
          {health}%
        </span>
      </div>
    </div>
  );
}

// ── Main Host View ─────────────────────────────────────────────────────────

export function HostView() {
  const host = useAirJamHost();
  const state = useFactoryStore((s: FactoryState) => s);
  const actions = useFactoryStore.useActions();

  // ── Per-role flash state ──────────────────────────────────────────────────
  const [flashes, setFlashes] = useState<Record<PlayerRole, boolean>>({
    power: false, data: false, security: false, model: false, cooling: false,
  });
  const flashTimers = useRef<Partial<Record<PlayerRole, ReturnType<typeof setTimeout>>>>({});

  function triggerFlash(role: PlayerRole, durationMs = 200) {
    if (flashTimers.current[role]) clearTimeout(flashTimers.current[role]);
    setFlashes((prev) => ({ ...prev, [role]: true }));
    flashTimers.current[role] = setTimeout(
      () => setFlashes((prev) => ({ ...prev, [role]: false })),
      durationMs,
    );
  }

  useFactoryStore.useHostActionListener(() => triggerFlash("power", 180),    { actionNames: ["tapPower"] });
  useFactoryStore.useHostActionListener(() => triggerFlash("data", 180),     { actionNames: ["sortData"] });
  useFactoryStore.useHostActionListener(() => triggerFlash("security", 180), { actionNames: ["zipZap"] });
  useFactoryStore.useHostActionListener(() => triggerFlash("model", 250),    { actionNames: ["solvePuzzle"] });
  useFactoryStore.useHostActionListener(() => triggerFlash("cooling", 350),  { actionNames: ["coolTick"] });

  // ── Host game loop ────────────────────────────────────────────────────────
  useHostTick({
    mode: "interval",
    intervalMs: 1000,
    onTick: () => {
      if (state.phase === "playing") actions.tickTimer();
    },
  });

  // ── Dev panel toggle ──────────────────────────────────────────────────────
  const [devOpen, setDevOpen] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const allComplete = (["power", "data", "security", "model", "cooling"] as PlayerRole[]).every(
    (r) => state[r].status === "complete",
  );
  const currentEvent = state.activeEvents[state.activeEvents.length - 1] ?? null;
  const timerDanger = state.timeRemaining < 30;
  const timerWarning = state.timeRemaining < 60 && state.timeRemaining >= 30;
  const isHot = state.cooling.temperature > 90;
  const isCritical = state.factoryHealth < 35;

  const statuses = {
    power:    state.power.status,
    data:     state.data.status,
    security: state.security.status,
    model:    state.model.status,
    cooling:  state.cooling.status,
  } as Record<PlayerRole, string>;

  // ── IDLE SCREEN ───────────────────────────────────────────────────────────
  if (state.phase === "idle") {
    return (
      <>
        <SurfaceViewport className="bg-[#050a14]">
          <div
            className="relative flex h-full w-full flex-col items-center justify-center gap-8 p-8 overflow-hidden"
          >
            <HexGrid />
            <AmbientParticles />
            <div className="scan-line absolute inset-0 pointer-events-none" />

            {/* Title block */}
            <div className="text-center z-10">
              <div
                style={{
                  fontSize: "clamp(3rem, 6vw, 5.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#38bdf8",
                  textShadow:
                    "0 0 40px rgba(56,189,248,0.7), 0 0 80px rgba(56,189,248,0.3), 0 0 120px rgba(56,189,248,0.1)",
                  lineHeight: 1,
                }}
              >
                AI FACTORY
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: "clamp(0.7rem, 1.2vw, 1rem)",
                  fontWeight: 600,
                  letterSpacing: "0.45em",
                  textTransform: "uppercase",
                  color: "#334155",
                }}
              >
                Build · Optimise · Deploy
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: "clamp(0.6rem, 1vw, 0.8rem)",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#38bdf8",
                  opacity: 0.65,
                }}
              >
                5-Player Cooperative Engineering Mission
              </div>
            </div>

            {/* QR Code panel with corner brackets */}
            <div
              className="qr-bracket z-10 flex flex-col items-center gap-4"
              style={{
                position: "relative",
                background: "rgba(13,24,37,0.92)",
                border: "1px solid rgba(56,189,248,0.2)",
                borderRadius: 16,
                padding: "28px 36px",
                boxShadow:
                  "0 0 60px rgba(56,189,248,0.1), inset 0 1px 0 rgba(56,189,248,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Corner accents (top-right, bottom-left) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 18,
                  height: 18,
                  borderTop: "2px solid rgba(56,189,248,0.7)",
                  borderRight: "2px solid rgba(56,189,248,0.7)",
                  borderRadius: "0 4px 0 0",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: 18,
                  height: 18,
                  borderBottom: "2px solid rgba(56,189,248,0.7)",
                  borderLeft: "2px solid rgba(56,189,248,0.7)",
                  borderRadius: "0 0 0 4px",
                }}
              />

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#38bdf8",
                }}
              >
                Scan to Join
              </div>
              {host.joinUrl ? (
                <div
                  style={{
                    padding: 12,
                    background: "white",
                    borderRadius: 10,
                    boxShadow: "0 0 40px rgba(56,189,248,0.35)",
                  }}
                >
                  <RoomQrCode value={host.joinUrl} size={200} />
                </div>
              ) : (
                <div className="h-[200px] w-[200px] flex items-center justify-center text-slate-600 text-sm">
                  Connecting…
                </div>
              )}
              <div style={{ fontSize: 11, color: "#334155" }}>
                Room:{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700 }}>
                  {host.roomId ?? "—"}
                </span>
              </div>
              {host.joinUrl && (
                <span data-testid="join-url" style={{ display: "none" }} aria-hidden="true">
                  {host.joinUrl}
                </span>
              )}
            </div>

            {/* Player count */}
            <div className="z-10 flex items-center gap-5">
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#f0f9ff",
                  lineHeight: 1,
                  textShadow: "0 0 20px rgba(240,249,255,0.3)",
                }}
              >
                {host.players.length}
              </div>
              <div style={{ color: "#1e3a5f", fontSize: 28, fontWeight: 300 }}>/</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#1e3a5f",
                  lineHeight: 1,
                }}
              >
                {GAME_CONFIG.maxPlayers}
              </div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "#334155",
                }}
              >
                Engineers
              </div>
            </div>

            {host.players.length > 0 && (
              <div
                className="z-10 text-xs animate-pulse"
                style={{
                  color: "#38bdf8",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Engineers joining… awaiting full crew
              </div>
            )}
          </div>
        </SurfaceViewport>
        <HostPreviewControllerWorkspace />
      </>
    );
  }

  // ── LOBBY SCREEN ──────────────────────────────────────────────────────────
  if (state.phase === "lobby") {
    const playerCount = Object.keys(state.roleAssignments).length;
    const allFilled = playerCount >= GAME_CONFIG.maxPlayers;

    return (
      <>
        <SurfaceViewport className="bg-[#050a14]">
          <div className="relative flex h-full w-full flex-col items-center gap-5 p-8 overflow-hidden">
            <HexGrid opacity={0.7} />
            <div className="scan-line absolute inset-0 pointer-events-none" />

            {/* Reset */}
            <button
              type="button"
              onClick={() => actions.resetGame()}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#f87171",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.08em",
                zIndex: 10,
              }}
              className="ctrl-button"
            >
              ↺ RESET
            </button>

            {/* Header */}
            <div className="text-center mt-2 z-10">
              <div
                style={{
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  fontWeight: 900,
                  color: "#38bdf8",
                  textShadow: "0 0 30px rgba(56,189,248,0.55)",
                  letterSpacing: "-0.01em",
                }}
              >
                AI FACTORY — LOBBY
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  color: "#334155",
                }}
              >
                {playerCount} / {GAME_CONFIG.maxPlayers} Engineers Ready
              </div>
            </div>

            {/* QR + Role roster side by side */}
            <div className="z-10 flex items-start gap-8 w-full max-w-3xl">
              {/* QR */}
              {host.joinUrl && (
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "16px",
                    background: "rgba(13,24,37,0.9)",
                    border: "1px solid rgba(56,189,248,0.18)",
                    borderRadius: 12,
                    boxShadow: "0 0 30px rgba(56,189,248,0.1)",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ padding: 10, background: "white", borderRadius: 8 }}>
                    <RoomQrCode value={host.joinUrl} size={110} />
                  </div>
                  <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em" }}>
                    Room: <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{host.roomId}</span>
                  </div>
                </div>
              )}

              {/* Role roster */}
              <div className="flex flex-col gap-2 flex-1">
                {ALL_ROLES.map((role) => {
                  const assignedPlayerId = Object.entries(state.roleAssignments).find(
                    ([, r]) => r === role,
                  )?.[0];
                  const player = host.players.find((p) => p.id === assignedPlayerId);
                  const filled = !!assignedPlayerId;
                  const color = ROLE_COLORS[role];

                  return (
                    <div
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${filled ? color + "65" : "rgba(56,189,248,0.08)"}`,
                        background: filled
                          ? `linear-gradient(90deg, ${color}12 0%, transparent 100%)`
                          : "rgba(13,24,37,0.7)",
                        transition: "all 0.35s ease",
                        boxShadow: filled ? `0 0 20px ${color}18` : "none",
                        borderLeft: `3px solid ${filled ? color : "rgba(56,189,248,0.1)"}`,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{ROLE_ICONS[role]}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color,
                          }}
                        >
                          {ROLE_LABELS[role]}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569" }}>{ROLE_MINI_GAME[role]}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {filled ? (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                              ✓ {player?.label ?? "Engineer"}
                            </div>
                            <div style={{ fontSize: 8, color: "#334155", fontFamily: "var(--font-mono)" }}>
                              {assignedPlayerId?.slice(0, 8)}
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              fontSize: 9,
                              color: "#334155",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              animation: "warningPulse 2s ease-in-out infinite",
                            }}
                          >
                            Waiting…
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start / waiting */}
            {allFilled ? (
              <button
                type="button"
                onClick={() => actions.startGame()}
                className="ctrl-button z-10"
                style={{
                  background: "linear-gradient(135deg, #0369a1, #38bdf8)",
                  border: "none",
                  borderRadius: 16,
                  padding: "16px 56px",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  boxShadow: "0 0 50px rgba(56,189,248,0.45), 0 4px 24px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
              >
                🚀 LAUNCH MISSION
              </button>
            ) : (
              <div
                className="z-10 animate-pulse text-sm"
                style={{
                  color: "#475569",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Awaiting {GAME_CONFIG.maxPlayers - playerCount} more engineer
                {GAME_CONFIG.maxPlayers - playerCount !== 1 ? "s" : ""}…
              </div>
            )}
          </div>
        </SurfaceViewport>
        <HostPreviewControllerWorkspace />
      </>
    );
  }

  // ── PLAYING SCREEN — AI Control Room ──────────────────────────────────────
  if (state.phase === "playing") {
    return (
      <>
        <SurfaceViewport className="bg-[#050a14]">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* ── Critical health vignette ─────────────────────────── */}
            {isCritical && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.18) 100%)",
                  animation: "criticalVignette 1s ease-in-out infinite",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            )}

            {/* ── Heat vignette ────────────────────────────────────── */}
            {isHot && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at center, transparent 50%, rgba(251,146,60,0.12) 100%)",
                  animation: "heatVignette 1.4s ease-in-out infinite",
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              />
            )}

            {/* Hex grid bg */}
            <HexGrid opacity={0.6} />

            {/* ── Top Bar ─────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 20px",
                borderBottom: "1px solid rgba(56,189,248,0.1)",
                background:
                  "linear-gradient(180deg, rgba(5,10,20,0.95) 0%, rgba(5,10,20,0.8) 100%)",
                flexShrink: 0,
                position: "relative",
                zIndex: 6,
              }}
            >
              {/* Brand */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#38bdf8",
                  textShadow: "0 0 20px rgba(56,189,248,0.55)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                AI FACTORY
              </div>

              {/* Stats cluster */}
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                {/* Timer */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 8,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    Time Remaining
                  </div>
                  <div
                    className={timerDanger ? "timer-danger" : ""}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 30,
                      fontWeight: 900,
                      color: timerDanger
                        ? "#f87171"
                        : timerWarning
                          ? "#fb923c"
                          : "#f0f9ff",
                      transition: "color 0.5s ease",
                      lineHeight: 1,
                      textShadow: timerDanger
                        ? "0 0 16px rgba(248,113,113,0.7)"
                        : timerWarning
                          ? "0 0 12px rgba(251,146,60,0.5)"
                          : undefined,
                    }}
                  >
                    {formatTime(state.timeRemaining)}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 36, background: "rgba(56,189,248,0.1)" }} />

                {/* Team Score */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 8,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    Team Score
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#38bdf8",
                      lineHeight: 1,
                      textShadow: "0 0 14px rgba(56,189,248,0.5)",
                    }}
                  >
                    {state.teamScore.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Event Banner ─────────────────────────────────────── */}
            {currentEvent && <EventBanner message={currentEvent.message} />}

            {/* ── Factory Health Bar (segmented) ───────────────────── */}
            <HealthBar health={state.factoryHealth} />

            {/* ── Hub-and-Spoke Factory Floor ──────────────────────── */}
            <div
              style={{
                position: "relative",
                flex: 1,
                minHeight: 0,
                zIndex: 2,
              }}
            >
              {/* SVG pipeline layer */}
              <PipelineOverlay flashes={flashes} statuses={statuses} />

              {/* Power — top left */}
              <div style={{ position: "absolute", top: "3%", left: "3%" }}>
                <DeptPanel
                  role="power"
                  progress={state.power.progress}
                  status={state.power.status}
                  score={state.power.score}
                  flashing={flashes.power}
                />
              </div>

              {/* Data — top right */}
              <div style={{ position: "absolute", top: "3%", right: "3%" }}>
                <DeptPanel
                  role="data"
                  progress={state.data.progress}
                  status={state.data.status}
                  score={state.data.score}
                  flashing={flashes.data}
                />
              </div>

              {/* Security — bottom left */}
              <div style={{ position: "absolute", bottom: "24%", left: "3%" }}>
                <DeptPanel
                  role="security"
                  progress={state.security.progress}
                  status={state.security.status}
                  score={state.security.score}
                  flashing={flashes.security}
                />
              </div>

              {/* Model — bottom right */}
              <div style={{ position: "absolute", bottom: "24%", right: "3%" }}>
                <DeptPanel
                  role="model"
                  progress={state.model.progress}
                  status={state.model.status}
                  score={state.model.score}
                  flashing={flashes.model}
                />
              </div>

              {/* Cooling — bottom centre */}
              <div
                style={{
                  position: "absolute",
                  bottom: "3%",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <DeptPanel
                  role="cooling"
                  progress={state.cooling.progress}
                  status={state.cooling.status}
                  score={state.cooling.score}
                  flashing={flashes.cooling}
                  extra={
                    <div
                      style={{
                        textAlign: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 800,
                        color:
                          state.cooling.temperature <= GAME_CONFIG.coolingSafeMax
                            ? "#34d399"
                            : state.cooling.temperature > 90
                              ? "#f87171"
                              : "#fb923c",
                        textShadow:
                          state.cooling.temperature > 90
                            ? "0 0 10px rgba(248,113,113,0.6)"
                            : undefined,
                        transition: "color 0.4s ease",
                      }}
                    >
                      {state.cooling.temperature.toFixed(1)}°C
                    </div>
                  }
                />
              </div>

              {/* AI Core — centre */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                <AICore
                  health={state.factoryHealth}
                  allComplete={allComplete}
                  temperature={state.cooling.temperature}
                  statuses={statuses}
                />
              </div>

              {/* All-systems-go ticker */}
              {allComplete && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    overflow: "hidden",
                    height: 22,
                    background: "rgba(74,222,128,0.08)",
                    borderTop: "1px solid rgba(74,222,128,0.25)",
                    zIndex: 8,
                  }}
                >
                  <div
                    style={{
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.28em",
                      color: "#4ade80",
                      lineHeight: "22px",
                      paddingLeft: "100%",
                      animation: "allSystemsTicker 8s linear infinite",
                    }}
                  >
                    ✓ ALL SYSTEMS OPERATIONAL · AI CORE READY FOR DEPLOYMENT · ✓ ALL SYSTEMS OPERATIONAL · AI CORE READY FOR DEPLOYMENT ·
                  </div>
                </div>
              )}
            </div>

            {/* ── Dev Panel ────────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => setDevOpen((o) => !o)}
              className="ctrl-button"
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.18)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 9,
                color: "#f59e0b",
                cursor: "pointer",
                zIndex: 20,
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              🔧 {devOpen ? "CLOSE" : "DEV"}
            </button>

            {devOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: 36,
                  right: 8,
                  background: "rgba(15,32,53,0.98)",
                  border: "1px solid rgba(245,158,11,0.28)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  zIndex: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minWidth: 260,
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#f59e0b",
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  🔧 Dev Test Panel
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(["power", "data", "security", "model"] as PlayerRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className="ctrl-button"
                      onClick={() => {
                        if (role === "power") actions.devIncrementPower({ amount: GAME_CONFIG.devIncrementAmount });
                        if (role === "data") actions.devIncrementData({ amount: GAME_CONFIG.devIncrementAmount });
                        if (role === "security") actions.devIncrementSecurity({ amount: GAME_CONFIG.devIncrementAmount });
                        if (role === "model") actions.devIncrementModel({ amount: GAME_CONFIG.devIncrementAmount });
                      }}
                      style={{
                        background: ROLE_COLORS[role] + "15",
                        border: `1px solid ${ROLE_COLORS[role]}40`,
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 10,
                        color: ROLE_COLORS[role],
                        cursor: "pointer",
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                    >
                      {ROLE_ICONS[role]} +{GAME_CONFIG.devIncrementAmount}%
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ctrl-button"
                    onClick={() =>
                      actions.devSetCoolingTemp({
                        temperature: Math.max(50, state.cooling.temperature - 5),
                      })
                    }
                    style={{
                      background: "#38bdf815",
                      border: "1px solid #38bdf840",
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 10,
                      color: "#38bdf8",
                      cursor: "pointer",
                      fontWeight: 700,
                      textAlign: "left",
                    }}
                  >
                    🌡 Cool −5°C
                  </button>
                  <button
                    type="button"
                    className="ctrl-button"
                    onClick={() => actions.resetGame()}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 10,
                      color: "#f87171",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>
                <div style={{ fontSize: 9, color: "#334155" }}>
                  {host.players.length} controller(s) · {Object.keys(state.roleAssignments).length} role(s)
                </div>
              </div>
            )}
          </div>
        </SurfaceViewport>
        <HostPreviewControllerWorkspace />
      </>
    );
  }

  // ── ENDED SCREEN ──────────────────────────────────────────────────────────
  return <EndedScreen state={state} actions={actions} />;
}

// ── Ended Screen ────────────────────────────────────────────────────────────

function EndedScreen({
  state,
  actions,
}: {
  state: FactoryState;
  actions: ReturnType<typeof useFactoryStore.useActions>;
}) {
  const success = state.finalResult === "success";
  const [deployPhase, setDeployPhase] = useState<"deploying" | "revealed">(
    success ? "deploying" : "revealed",
  );

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setDeployPhase("revealed"), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const criticalMin = GAME_CONFIG.criticalDeptMinimum;
  const deptResults = ALL_ROLES.map((role) => {
    const dept = state[role] as { progress: number; score: number; status: string };
    const passed = dept.progress >= criticalMin;
    return { role, progress: dept.progress, score: dept.score, passed };
  });

  // ── Deploying animation ────────────────────────────────────────────────
  if (deployPhase === "deploying") {
    return (
      <>
        <SurfaceViewport className="bg-[#050a14]">
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 28,
              padding: 40,
              overflow: "hidden",
            }}
          >
            <HexGrid opacity={0.5} />

            {/* Scan beam */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background:
                  "linear-gradient(90deg, transparent, #38bdf8cc, transparent)",
                animation: "deployScan 1.8s linear infinite",
                zIndex: 1,
              }}
            />

            {/* Main title */}
            <div
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "0.05em",
                color: "#38bdf8",
                textShadow: "0 0 50px rgba(56,189,248,0.75)",
                textAlign: "center",
                zIndex: 2,
                textTransform: "uppercase",
              }}
            >
              AI Core Deploying
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                animation: "warningPulse 1.1s ease-in-out infinite",
                zIndex: 2,
              }}
            >
              Initialising neural pathways…
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "min(520px, 90%)",
                background: "#0f172a",
                borderRadius: 8,
                height: 14,
                overflow: "hidden",
                border: "1px solid rgba(56,189,248,0.2)",
                boxShadow: "0 0 24px rgba(56,189,248,0.12)",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 8,
                  background:
                    "linear-gradient(90deg, #0369a1, #38bdf8, #4ade80)",
                  boxShadow: "0 0 16px rgba(56,189,248,0.7)",
                  animation: "deployFill 2.8s ease-out forwards",
                }}
              />
            </div>

            {/* Animated robot */}
            <div
              style={{
                fontSize: 72,
                zIndex: 2,
                animation: "aiCorePulse 2s ease-in-out infinite",
                filter: "drop-shadow(0 0 20px rgba(56,189,248,0.5))",
              }}
            >
              🤖
            </div>
          </div>
        </SurfaceViewport>
        <HostPreviewControllerWorkspace />
      </>
    );
  }

  // ── Revealed result ────────────────────────────────────────────────────
  return (
    <>
      <SurfaceViewport
        style={{
          background: success
            ? "radial-gradient(ellipse at 50% 30%, rgba(74,222,128,0.08) 0%, #050a14 65%)"
            : "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.1) 0%, #050a14 65%)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 20,
            padding: 32,
            overflow: "auto",
          }}
        >
          <HexGrid opacity={0.4} />
          {success && <SuccessParticles />}

          {/* Main result */}
          <div
            className="result-reveal"
            style={{ textAlign: "center", position: "relative", zIndex: 2 }}
          >
            <div
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                fontWeight: 900,
                letterSpacing: "0.03em",
                color: success ? "#4ade80" : "#f87171",
                textShadow: success
                  ? "0 0 60px rgba(74,222,128,0.75)"
                  : "0 0 60px rgba(239,68,68,0.75)",
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              {success ? "✓ AI FACTORY ONLINE" : "✗ AI FACTORY FAILED"}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: "clamp(0.9rem, 1.5vw, 1.25rem)",
                fontWeight: 700,
                color: success ? "#86efac" : "#fca5a5",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {success ? "AI Successfully Deployed 🚀" : "AI Deployment Unsuccessful"}
            </div>
          </div>

          {/* Score row */}
          <div
            className="result-reveal result-reveal-delay-1"
            style={{
              display: "flex",
              gap: 36,
              background: "rgba(13,24,37,0.85)",
              border: "1px solid rgba(56,189,248,0.12)",
              borderRadius: 18,
              padding: "18px 40px",
              backdropFilter: "blur(8px)",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Factory Health
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 42,
                  fontWeight: 900,
                  color: healthColor(state.factoryHealth),
                  textShadow: `0 0 20px ${healthColor(state.factoryHealth)}80`,
                }}
              >
                {state.factoryHealth}%
              </div>
            </div>
            <div style={{ width: 1, background: "rgba(56,189,248,0.1)" }} />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Team Score
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#38bdf8",
                  textShadow: "0 0 20px rgba(56,189,248,0.5)",
                }}
              >
                {state.teamScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Department breakdown */}
          <div
            className="result-reveal result-reveal-delay-2"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 10,
              width: "100%",
              maxWidth: 700,
              position: "relative",
              zIndex: 2,
            }}
          >
            {deptResults.map(({ role, progress, passed }) => {
              const color = ROLE_COLORS[role];
              return (
                <div
                  key={role}
                  style={{
                    textAlign: "center",
                    background: passed ? `${color}10` : "rgba(239,68,68,0.07)",
                    border: `2px solid ${passed ? color + "55" : "rgba(239,68,68,0.4)"}`,
                    borderRadius: 14,
                    padding: "14px 8px",
                    boxShadow: passed ? `0 0 16px ${color}25` : "0 0 10px rgba(239,68,68,0.15)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Top color bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: passed ? color : "#ef4444",
                    }}
                  />
                  <div style={{ fontSize: 24, marginBottom: 6 }}>
                    {ROLE_ICONS[role]}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: passed ? color : "#f87171",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    {ROLE_LABELS[role].replace(" Engineer", "")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 24,
                      fontWeight: 900,
                      color: passed ? color : "#f87171",
                      textShadow: passed ? `0 0 8px ${color}80` : undefined,
                    }}
                  >
                    {progress}%
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      marginTop: 4,
                      color: passed ? "#4ade80" : "#f87171",
                    }}
                  >
                    {passed ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Failure reason */}
          {!success && (
            <div
              className="result-reveal result-reveal-delay-3"
              style={{
                color: "#f87171",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                padding: "7px 18px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {state.factoryHealth < GAME_CONFIG.factorySuccessThreshold
                ? `Factory Health ${state.factoryHealth}% — Required ${GAME_CONFIG.factorySuccessThreshold}%`
                : `Critical dept below ${GAME_CONFIG.criticalDeptMinimum}% — ${
                    deptResults.find((d) => !d.passed)
                      ? ROLE_LABELS[deptResults.find((d) => !d.passed)!.role]
                      : "Unknown"
                  } failed`}
            </div>
          )}

          {/* Play Again */}
          <button
            type="button"
            onClick={() => actions.resetGame()}
            className="ctrl-button result-reveal result-reveal-delay-4"
            style={{
              background: success
                ? "linear-gradient(135deg, #14532d, #22c55e)"
                : "linear-gradient(135deg, #1e3a5f, #38bdf8)",
              border: "none",
              borderRadius: 18,
              padding: "16px 56px",
              fontSize: 20,
              fontWeight: 900,
              color: "white",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: success
                ? "0 0 50px rgba(74,222,128,0.35), 0 4px 24px rgba(0,0,0,0.4)"
                : "0 0 50px rgba(56,189,248,0.35), 0 4px 24px rgba(0,0,0,0.4)",
              position: "relative",
              zIndex: 2,
            }}
          >
            {success ? "🎉 Play Again" : "🔄 Try Again"}
          </button>
        </div>
      </SurfaceViewport>
      <HostPreviewControllerWorkspace />
    </>
  );
}

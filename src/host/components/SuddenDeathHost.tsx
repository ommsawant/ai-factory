/**
 * SuddenDeathHost — Golden Ticket Quiz screen shown on the host during the
 * "suddenDeath" phase.
 *
 * Displays:
 *   - Dramatic 10-second countdown
 *   - Current AI tool name (the "question")
 *   - Live leaderboard of all 5 players' quiz scores
 *
 * This component is purely presentational — all state lives in factoryStore.
 */
import type { FactoryStateData } from "../../game/domain/types";
import { AI_LOGOS } from "../../game/data/aiLogos";
import { ROLE_COLORS, ROLE_ICONS, ROLE_LABELS } from "../../game/domain/types";

interface SuddenDeathHostProps {
  state: FactoryStateData;
  /** Map from controllerId → player label from the AirJam host */
  playerLabels: Record<string, string>;
}

export function SuddenDeathHost({ state, playerLabels }: SuddenDeathHostProps) {
  const currentLogo = AI_LOGOS[state.currentQuizIndex];
  const timeLeft = state.timeRemaining;
  const isUrgent = timeLeft <= 5;

  // Build sorted leaderboard.
  const leaderboard = Object.entries(state.roleAssignments)
    .map(([id, role]) => ({
      id,
      role,
      label: playerLabels[id] ?? id.slice(0, 8),
      score: state.suddenDeathScores[id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "radial-gradient(ellipse at 50% 30%, rgba(250,204,21,0.12) 0%, #050a14 55%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "24px 32px",
        overflow: "hidden",
      }}
    >
      {/* Gold scanline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(250,204,21,0.02) 3px, rgba(250,204,21,0.02) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Header badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 28px",
          background: "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(245,158,11,0.1))",
          border: "1.5px solid rgba(250,204,21,0.5)",
          borderRadius: 40,
          boxShadow: "0 0 40px rgba(250,204,21,0.2)",
        }}
      >
        <span style={{ fontSize: 22 }}>🎫</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#facc15",
            textShadow: "0 0 20px rgba(250,204,21,0.8)",
          }}
        >
          Golden Ticket — Sudden Death
        </span>
        <span style={{ fontSize: 22 }}>🎫</span>
      </div>

      {/* Question area */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "rgba(250,204,21,0.5)",
            marginBottom: 6,
          }}
        >
          Tap this AI Tool
        </div>
        <div
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#facc15",
            textShadow:
              "0 0 40px rgba(250,204,21,0.7), 0 0 80px rgba(250,204,21,0.3)",
            lineHeight: 1.1,
          }}
        >
          {currentLogo?.name ?? "—"}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "rgba(250,204,21,0.45)",
            letterSpacing: "0.1em",
          }}
        >
          {currentLogo?.tagline}
        </div>
      </div>

      {/* Timer */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(4rem, 8vw, 7rem)",
          fontWeight: 900,
          lineHeight: 1,
          color: isUrgent ? "#f87171" : "#facc15",
          textShadow: isUrgent
            ? "0 0 50px rgba(248,113,113,0.8)"
            : "0 0 50px rgba(250,204,21,0.6)",
          animation: isUrgent ? "warningPulse 0.5s ease-in-out infinite" : undefined,
          transition: "color 0.3s ease",
        }}
      >
        {timeLeft}
      </div>

      {/* Live leaderboard */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(250,204,21,0.45)",
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          Live Leaderboard
        </div>
        {leaderboard.map((entry, rank) => {
          const color = ROLE_COLORS[entry.role as keyof typeof ROLE_COLORS] ?? "#38bdf8";
          const isLeading = rank === 0 && entry.score > 0;
          return (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 12,
                background: isLeading
                  ? "linear-gradient(90deg, rgba(250,204,21,0.12), transparent)"
                  : "rgba(13,24,37,0.7)",
                border: `1.5px solid ${isLeading ? "rgba(250,204,21,0.5)" : "rgba(56,189,248,0.08)"}`,
                transition: "all 0.3s ease",
                boxShadow: isLeading ? "0 0 20px rgba(250,204,21,0.12)" : "none",
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>
                {rank === 0 && entry.score > 0 ? "🥇" : ROLE_ICONS[entry.role as keyof typeof ROLE_ICONS]}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {ROLE_LABELS[entry.role as keyof typeof ROLE_LABELS]}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>{entry.label}</div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 28,
                  fontWeight: 900,
                  color: isLeading ? "#facc15" : color,
                  textShadow: isLeading ? "0 0 16px rgba(250,204,21,0.7)" : undefined,
                  minWidth: 40,
                  textAlign: "right",
                }}
              >
                {entry.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Question progress */}
      <div
        style={{
          fontSize: 10,
          color: "rgba(250,204,21,0.35)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Question {Math.min(state.currentQuizIndex + 1, 15)} / 15
      </div>
    </div>
  );
}

/**
 * SuddenDeathController — Golden Ticket Quiz screen shown on every
 * controller during the "suddenDeath" phase.
 *
 * Renders a 5×3 grid of all 15 AI tool logos.
 * The host tells all players which tool to find via state.currentQuizIndex.
 * The first player to tap the correct logo scores a point.
 *
 * Feedback:
 *   - Correct tap  → green flash on that tile
 *   - Wrong tap    → red flash on that tile
 */
import { useState, useCallback, useMemo } from "react";
import { AI_LOGOS } from "../../game/data/aiLogos";
import type { FactoryStateData } from "../../game/domain/types";

interface SuddenDeathControllerProps {
  state: FactoryStateData;
  onAnswer: (logoId: string) => void;
}

type TileFeedback = "correct" | "wrong" | null;

export function SuddenDeathController({ state, onAnswer }: SuddenDeathControllerProps) {
  const [feedback, setFeedback] = useState<Record<string, TileFeedback>>({});
  
  // Shuffle the logo grid once when this component mounts so each player gets a unique layout
  const shuffledLogos = useMemo(() => {
    const copy = [...AI_LOGOS];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  const timeLeft = state.timeRemaining;
  const isUrgent = timeLeft <= 5;
  const currentLogo = AI_LOGOS[state.currentQuizIndex];

  const handleTap = useCallback(
    (logoId: string) => {
      const isCorrect = logoId === currentLogo?.id;
      setFeedback((prev) => ({ ...prev, [logoId]: isCorrect ? "correct" : "wrong" }));
      onAnswer(logoId);
      // Clear feedback after a short visual flash.
      setTimeout(() => {
        setFeedback((prev) => {
          const next = { ...prev };
          delete next[logoId];
          return next;
        });
      }, 500);
    },
    [currentLogo?.id, onAnswer],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.08) 0%, #050a14 55%)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1.5px solid rgba(250,204,21,0.3)",
          background: "rgba(250,204,21,0.05)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎫</span>
          <div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(250,204,21,0.5)",
              }}
            >
              Golden Ticket
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#facc15",
                textShadow: "0 0 12px rgba(250,204,21,0.6)",
              }}
            >
              {currentLogo?.name ?? "—"}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 28,
            fontWeight: 900,
            color: isUrgent ? "#f87171" : "#facc15",
            textShadow: isUrgent
              ? "0 0 20px rgba(248,113,113,0.8)"
              : "0 0 20px rgba(250,204,21,0.6)",
            animation: isUrgent ? "warningPulse 0.5s ease-in-out infinite" : undefined,
          }}
        >
          {timeLeft}
        </div>
      </div>

      {/* Instruction */}
      <div
        style={{
          textAlign: "center",
          padding: "8px 14px 4px",
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(250,204,21,0.4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        Tap the logo →
      </div>

      {/* Logo grid — 5 columns × 3 rows */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
          padding: "6px 10px 12px",
          overflowY: "auto",
          alignContent: "start",
        }}
      >
        {shuffledLogos.map((logo) => {
          const fb = feedback[logo.id];
          const borderColor =
            fb === "correct"
              ? "#4ade80"
              : fb === "wrong"
                ? "#f87171"
                : "rgba(250,204,21,0.15)";
          const bgColor =
            fb === "correct"
              ? "rgba(74,222,128,0.2)"
              : fb === "wrong"
                ? "rgba(248,113,113,0.2)"
                : "rgba(13,24,37,0.8)";

          return (
            <button
              key={logo.id}
              type="button"
              onClick={() => handleTap(logo.id)}
              className="ctrl-button logo-quiz-btn"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                aspectRatio: "1",
                padding: 6,
                borderRadius: 10,
                border: `2px solid ${borderColor}`,
                background: bgColor,
                transition: "all 0.15s ease",
                cursor: "pointer",
                boxShadow:
                  fb === "correct"
                    ? "0 0 16px rgba(74,222,128,0.4)"
                    : fb === "wrong"
                      ? "0 0 16px rgba(248,113,113,0.4)"
                      : "none",
                transform: fb ? "scale(0.93)" : "scale(1)",
              }}
              aria-label={logo.name}
            >
              <img
                src={logo.logo}
                alt={logo.name}
                style={{
                  width: "60%",
                  height: "60%",
                  objectFit: "contain",
                  borderRadius: 4,
                }}
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

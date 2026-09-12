/**
 * AICore — centre hub of the factory floor.
 * Multi-ring orbital design with health ring fill, temperature readout,
 * and all-complete victory burst.
 */
import { type PlayerRole } from "../../game/domain/types";

interface AICoreProps {
  health: number;
  allComplete: boolean;
  statuses: Record<PlayerRole, string>;
}

function healthColor(h: number) {
  if (h >= 70) return "#4ade80";
  if (h >= 45) return "#fb923c";
  return "#f87171";
}

export function AICore({ health, allComplete, statuses }: AICoreProps) {
  const coreColor = allComplete ? "#4ade80" : healthColor(health);
  const isCritical = health < 35;

  // SVG ring fill for health
  const ringR = 66;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc - (health / 100) * ringCirc;

  // Count active departments
  const activeDepts = (Object.values(statuses) as string[]).filter(
    (s) => s === "working" || s === "stable",
  ).length;
  const completeDepts = (Object.values(statuses) as string[]).filter(
    (s) => s === "complete",
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        position: "relative",
      }}
    >
      {/* Outer ambient glow ring — pulsing */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outermost orbit ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${coreColor}22`,
            animation: allComplete
              ? "aiCoreVictory 2s ease-in-out infinite"
              : isCritical
                ? "criticalPulse 0.7s ease-in-out infinite"
                : "aiCorePulse 3s ease-in-out infinite",
          }}
        />

        {/* SVG health arc ring */}
        <svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            transform: "rotate(-90deg)",
            filter: `drop-shadow(0 0 6px ${coreColor}88)`,
          }}
        >
          {/* Track */}
          <circle
            cx={100}
            cy={100}
            r={ringR}
            fill="none"
            stroke={`${coreColor}18`}
            strokeWidth={5}
          />
          {/* Fill */}
          <circle
            cx={100}
            cy={100}
            r={ringR}
            fill="none"
            stroke={coreColor}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={ringCirc}
            strokeDashoffset={ringOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out, stroke 0.5s ease" }}
          />
        </svg>

        {/* Middle ring */}
        <div
          style={{
            position: "absolute",
            width: 148,
            height: 148,
            borderRadius: "50%",
            border: `1.5px solid ${coreColor}30`,
            animation: "spinSlow 12s linear infinite",
          }}
        >
          {/* Orbiting dot 1 */}
          <div
            style={{
              position: "absolute",
              top: -5,
              left: "50%",
              marginLeft: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: coreColor,
              boxShadow: `0 0 12px ${coreColor}`,
            }}
          />
        </div>

        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            width: 108,
            height: 108,
            borderRadius: "50%",
            border: `1.5px solid ${coreColor}20`,
            animation: "spinSlow 8s linear infinite reverse",
          }}
        >
          {/* Orbiting dot 2 */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              marginLeft: -4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: `${coreColor}cc`,
              boxShadow: `0 0 8px ${coreColor}`,
            }}
          />
        </div>

        {/* Core orb */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${coreColor}28, ${coreColor}08 70%, transparent)`,
            border: `2px solid ${coreColor}60`,
            boxShadow: `0 0 24px ${coreColor}40, inset 0 0 16px ${coreColor}10`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {/* Health value */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 20,
              fontWeight: 900,
              color: coreColor,
              lineHeight: 1,
              textShadow: `0 0 10px ${coreColor}`,
              transition: "color 0.5s ease",
            }}
          >
            {health}%
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.18em",
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            {allComplete ? "ONLINE" : "HEALTH"}
          </div>
        </div>
      </div>

      {/* Label row */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: coreColor,
            textShadow: `0 0 14px ${coreColor}80`,
            transition: "color 0.5s ease",
          }}
        >
          {allComplete ? "✓ ALL SYSTEMS GO" : "AI CORE"}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 9,
            color: "#475569",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
            transition: "color 0.4s ease",
          }}
        >
          {completeDepts}/5 DEPTS
        </div>
      </div>
    </div>
  );
}

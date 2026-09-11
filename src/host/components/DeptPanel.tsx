/**
 * DeptPanel — department card for the hub-and-spoke factory floor.
 * Larger, richer visual with animated progress, activity indicators,
 * completion burst, and status badges.
 */
import {
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_LABELS,
  type PlayerRole,
} from "../../game/domain/types";

interface DeptPanelProps {
  role: PlayerRole;
  progress: number;
  status: string;
  score: number;
  extra?: React.ReactNode;
  flashing?: boolean;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    inactive: "IDLE",
    working: "ACTIVE",
    stable: "STABLE",
    complete: "DONE",
    warning: "WARN",
    critical: "CRIT",
    failed: "FAIL",
  };
  return map[status] ?? status.toUpperCase();
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    inactive: "#4b5563",
    working: "#60a5fa",
    stable: "#34d399",
    complete: "#4ade80",
    warning: "#fb923c",
    critical: "#f87171",
    failed: "#ef4444",
  };
  return map[status] ?? "#64748b";
}

export function DeptPanel({
  role,
  progress,
  status,
  score,
  extra,
  flashing,
}: DeptPanelProps) {
  const color = ROLE_COLORS[role];
  const isComplete = status === "complete";
  const isActive = status === "working" || status === "stable";
  const isCritical = status === "critical" || status === "failed";
  const sColor = statusColor(status);

  // Glow intensity
  const glow = flashing
    ? `0 0 40px ${color}dd, 0 0 12px ${color}99, inset 0 0 20px ${color}18`
    : isComplete
      ? `0 0 24px ${color}66, 0 0 8px ${color}44`
      : isCritical
        ? `0 0 20px #f8717155`
        : `0 0 8px rgba(56,189,248,0.08)`;

  return (
    <div
      style={{
        position: "relative",
        background: `linear-gradient(145deg, rgba(15,32,53,0.96) 0%, rgba(13,24,37,0.98) 100%)`,
        border: `1.5px solid ${isComplete ? color : isCritical ? "#f87171" : color + "35"}`,
        borderRadius: 14,
        padding: "0 0 10px 0",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: 176,
        minHeight: 155,
        boxShadow: glow,
        transition: "box-shadow 0.18s ease-out, border-color 0.3s ease",
        backdropFilter: "blur(6px)",
        overflow: "hidden",
      }}
    >
      {/* Color header bar */}
      <div
        style={{
          height: 4,
          background: isComplete
            ? `linear-gradient(90deg, ${color}88, ${color}, ${color}88)`
            : `linear-gradient(90deg, transparent, ${color}60, transparent)`,
          transition: "background 0.4s ease",
          animation: isComplete ? undefined : isActive ? "headerBarPulse 2.5s ease-in-out infinite" : undefined,
        }}
      />

      {/* Content */}
      <div style={{ padding: "8px 12px 0 12px", display: "flex", flexDirection: "column", gap: 6 }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Icon */}
          <div
            style={{
              fontSize: 22,
              lineHeight: 1,
              filter: isComplete ? `drop-shadow(0 0 6px ${color})` : undefined,
              transition: "filter 0.4s ease",
            }}
          >
            {ROLE_ICONS[role]}
          </div>

          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ROLE_LABELS[role]}
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              borderRadius: 5,
              background: `${sColor}20`,
              color: sColor,
              border: `1px solid ${sColor}40`,
              whiteSpace: "nowrap",
              animation: isActive && !isComplete ? "statusBadgePulse 2s ease-in-out infinite" : undefined,
            }}
          >
            {isComplete ? "✓ DONE" : statusLabel(status)}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: "relative",
            height: 7,
            borderRadius: 4,
            background: "#0f172a",
            overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {/* Fill */}
          <div
            className="progress-fill"
            style={{
              position: "absolute",
              inset: "0 auto 0 0",
              width: `${progress}%`,
              borderRadius: 4,
              background: isComplete
                ? `linear-gradient(90deg, ${color}88, ${color})`
                : `linear-gradient(90deg, ${color}66, ${color}cc)`,
              boxShadow: `0 0 8px ${color}70`,
            }}
          />
          {/* Shimmer overlay when active */}
          {isActive && !isComplete && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${color}35 50%, transparent 100%)`,
                animation: "progressShimmer 1.8s linear infinite",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 26,
              fontWeight: 900,
              color,
              lineHeight: 1,
              textShadow: isComplete ? `0 0 12px ${color}` : undefined,
            }}
          >
            {progress}%
          </div>
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#475569" }}>
              {score.toLocaleString()}
            </div>
            <div style={{ fontSize: 7, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              pts
            </div>
          </div>
        </div>

        {/* Activity dots when active */}
        {isActive && !isComplete && (
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: color,
                  opacity: flashing ? 1 : 0.5,
                  animation: `activityDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Complete seal */}
        {isComplete && (
          <div
            style={{
              textAlign: "center",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color,
              textShadow: `0 0 8px ${color}`,
              animation: "completeSeal 2s ease-in-out infinite",
            }}
          >
            ✓ COMPLETE
          </div>
        )}

        {extra}
      </div>

      {/* Flash burst overlay */}
      {flashing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: `radial-gradient(ellipse at center, ${color}25 0%, transparent 70%)`,
            animation: "flashBurst 0.3s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

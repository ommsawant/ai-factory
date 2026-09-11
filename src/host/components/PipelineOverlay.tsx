/**
 * PipelineOverlay — SVG energy/data flow paths from each dept to AI Core.
 * Animated dash flow, completion glow, and action flash bursts.
 */
import { ROLE_COLORS, type PlayerRole } from "../../game/domain/types";

interface PipelineOverlayProps {
  flashes: Record<PlayerRole, boolean>;
  statuses: Record<PlayerRole, string>;
}

// Paths: dept card centre → AI core centre (in SVG % coords)
// Adjusted for larger dept panels and new layout
const PATHS: { role: PlayerRole; d: string }[] = [
  { role: "power",    d: "M 13% 22% C 28% 30%, 40% 44%, 50% 50%" },
  { role: "data",     d: "M 87% 22% C 72% 30%, 60% 44%, 50% 50%" },
  { role: "security", d: "M 13% 70% C 28% 63%, 40% 57%, 50% 50%" },
  { role: "model",    d: "M 87% 70% C 72% 63%, 60% 57%, 50% 50%" },
  { role: "cooling",  d: "M 50% 89% C 50% 76%, 50% 64%, 50% 50%" },
];

export function PipelineOverlay({ flashes, statuses }: PipelineOverlayProps) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <filter id="pipe-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pipe-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {PATHS.map(({ role, d }) => {
        const color = ROLE_COLORS[role];
        const status = statuses[role];
        const isComplete = status === "complete";
        const isActive = status === "working" || status === "stable";
        const isFlashing = flashes[role];
        const isInactive = status === "inactive";

        return (
          <g key={role}>
            {/* Base wire — always visible, very faint */}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={isInactive ? 0.06 : 0.18}
              style={{ transition: "stroke-opacity 0.6s ease" }}
            />

            {/* Active flow — animated dashes */}
            {isActive && !isComplete && (
              <>
                {/* Glow layer */}
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  strokeOpacity={0.15}
                  filter="url(#pipe-glow)"
                />
                {/* Moving dashes */}
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="10 16"
                  strokeOpacity={0.8}
                  style={{
                    animation: "pipelineFlow 1.8s linear infinite",
                    filter: "url(#pipe-glow)",
                  }}
                />
              </>
            )}

            {/* Complete — solid neon line */}
            {isComplete && (
              <>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={4}
                  strokeOpacity={0.25}
                  filter="url(#pipe-glow-strong)"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeOpacity={0.85}
                  filter="url(#pipe-glow)"
                  style={{ transition: "stroke-opacity 0.5s ease" }}
                />
              </>
            )}

            {/* Flash burst when player acts */}
            {isFlashing && (
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={5}
                strokeOpacity={1}
                filter="url(#pipe-glow-strong)"
                style={{ animation: "pipelineFlash 0.3s ease-out forwards" }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

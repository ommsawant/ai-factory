/**
 * IsometricFactoryFloor — Big-screen factory overview.
 *
 * Layout: AICore dead center. 5 dept panels arranged in a loose pentagon
 * around it so nothing overlaps. SVG lightning-bolt pipeline connectors
 * animated with flowing data pulses.
 *
 *         [DATA]          [COOLING]
 *                [AI CORE]
 *    [SECURITY]            [MODEL]
 *              [POWER]
 */

import { ROLE_COLORS, type PlayerRole } from "../../game/domain/types";
import { type FactoryState } from "../../game/store/factoryStore";
import { DeptPanel } from "./DeptPanel";
import { AICore } from "./AICore";
import { GAME_CONFIG } from "../../game/config/gameConfig";

interface IsometricFactoryFloorProps {
  state: FactoryState;
  statuses: Record<PlayerRole, string>;
  flashes: Record<PlayerRole, boolean>;
  allComplete: boolean;
}

// ── Viewport box ──────────────────────────────────────────────────────────
const VW = 960;
const VH = 530;
const CX = VW / 2;   // 480
const CY = 205;      // shifted up so Power panel line is fully visible

// Panel card dimensions
const PW = 172;
const PH = 155;

// ── Dept panel center positions (cx, cy) ─────────────────────────────────
// AICore is at CY=205. Panels arranged around it with Power well below.
const SLOT: Record<PlayerRole, { cx: number; cy: number }> = {
  data:     { cx: 230, cy:  60 }, // top-left
  knowledge: { cx: 730, cy:  60 }, // top-right
  security: { cx:  90, cy: 220 }, // left
  model:    { cx: 870, cy: 220 }, // right
  power:    { cx: 480, cy: 460 }, // bottom-center — clear below AICore
};

// ── Lightning zigzag path between two points ──────────────────────────────
// Generates an SVG path string with 3 random zigzag jags
function zigzagPath(
  x1: number, y1: number,
  x2: number, y2: number,
  jag: number = 22,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Perpendicular unit vector
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = -dy / len;
  const py = dx / len;

  // Three intermediate points with alternating jags
  const p1x = x1 + dx * 0.25 + px * jag;
  const p1y = y1 + dy * 0.25 + py * jag;
  const p2x = x1 + dx * 0.5  - px * jag;
  const p2y = y1 + dy * 0.5  - py * jag;
  const p3x = x1 + dx * 0.75 + px * jag;
  const p3y = y1 + dy * 0.75 + py * jag;

  return `M ${x1} ${y1} L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${x2} ${y2}`;
}

// ── Animated pipeline connector ───────────────────────────────────────────
function LightningPipeline({
  role,
  panelCx,
  panelCy,
  flashing,
}: {
  role: PlayerRole;
  panelCx: number;
  panelCy: number;
  flashing: boolean;
}) {
  const color = ROLE_COLORS[role];

  // Pull the line endpoint back toward the AICore by the panel half-size
  // so the line starts at the panel edge, not behind the panel
  const dx = CX - panelCx;
  const dy = CY - panelCy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const panelEdgeFrac = Math.min(PW, PH) / 2 / dist;
  const coreEdgeFrac  = 130 / dist; // AICore visual radius (enlarged to 270px → r≈135)

  const lx1 = panelCx + dx * panelEdgeFrac;
  const ly1 = panelCy + dy * panelEdgeFrac;
  const lx2 = CX      - dx * coreEdgeFrac;
  const ly2 = CY      - dy * coreEdgeFrac;

  const path = zigzagPath(lx1, ly1, lx2, ly2, 18);
  const dur = flashing ? "0.7s" : "1.6s";

  return (
    <g>
      {/* Dim base track */}
      <path
        d={path}
        fill="none"
        stroke={`${color}22`}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Animated pulse */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={flashing ? 3.5 : 1.8}
        strokeDasharray="14 22"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={flashing ? 0.95 : 0.45}
        style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease" }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-108"
          dur={dur}
          repeatCount="indefinite"
        />
      </path>
      {/* Travelling spark dot */}
      {flashing && (
        <circle r={4} fill={color} opacity={0.9}>
          <animateMotion path={path} dur="0.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

// ── Floor accent tile behind each panel ──────────────────────────────────
function FloorAccent({
  cx, cy, color, flashing, progress,
}: {
  cx: number; cy: number; color: string; flashing: boolean; progress: number;
}) {
  return (
    <g>
      <rect
        x={cx - PW / 2 - 8}
        y={cy - PH / 2 - 4}
        width={PW + 16}
        height={PH + 8}
        rx={16}
        fill={`${color}08`}
        stroke={`${color}${flashing ? "70" : "22"}`}
        strokeWidth={flashing ? 2 : 1}
        style={{ transition: "stroke 0.3s ease" }}
      />
      {/* Bottom progress underline */}
      <rect
        x={cx - PW / 2 - 8}
        y={cy + PH / 2 + 2}
        width={(PW + 16) * (progress / 100)}
        height={3}
        rx={2}
        fill={`${color}99`}
        style={{ transition: "width 0.6s ease" }}
      />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function IsometricFactoryFloor({
  state,
  statuses,
  flashes,
  allComplete,
}: IsometricFactoryFloorProps) {
  const deptRoles: PlayerRole[] = ["data", "security", "knowledge", "model", "power"];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      {/* Fixed viewport box */}
      <div
        style={{
          position: "relative",
          width: VW,
          height: VH,
          flexShrink: 0,
        }}
      >
        {/* ── SVG: floor accents + lightning pipelines ── */}
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
          {/* Floor accent tiles (below pipelines) */}
          {deptRoles.map((role) => (
            <FloorAccent
              key={role}
              cx={SLOT[role].cx}
              cy={SLOT[role].cy}
              color={ROLE_COLORS[role]}
              flashing={flashes[role]}
              progress={state[role].progress}
            />
          ))}

          {/* Central glow ring */}
          <ellipse
            cx={CX} cy={CY}
            rx={120} ry={120}
            fill="none"
            stroke={allComplete ? "#4ade8066" : "#38bdf830"}
            strokeWidth={allComplete ? 2.5 : 1}
            style={{ transition: "stroke 0.5s ease" }}
          />
          <ellipse
            cx={CX} cy={CY}
            rx={86} ry={86}
            fill="rgba(56,189,248,0.03)"
          />

          {/* Lightning pipeline connectors */}
          {deptRoles.map((role) => (
            <LightningPipeline
              key={role}
              role={role}
              panelCx={SLOT[role].cx}
              panelCy={SLOT[role].cy}
              flashing={flashes[role]}
            />
          ))}
        </svg>

        {/* ── Dept panels ── */}
        {deptRoles.map((role) => {
          const { cx, cy } = SLOT[role];
          return (
            <div
              key={role}
              style={{
                position: "absolute",
                left: cx - PW / 2,
                top: cy - PH / 2,
                width: PW,
                zIndex: 4,
              }}
            >
              <DeptPanel
                role={role}
                progress={state[role].progress}
                status={state[role].status}
                score={state[role].score}
                flashing={flashes[role]}
              />
            </div>
          );
        })}

        {/* ── AICore — enlarged and prominent ── */}
        <div
          style={{
            position: "absolute",
            left: CX - 135,
            top: CY - 135,
            width: 270,
            zIndex: 5,
            filter: "drop-shadow(0 0 32px rgba(56,189,248,0.5)) drop-shadow(0 0 64px rgba(56,189,248,0.25))",
          }}
        >
          <AICore
            health={state.factoryHealth}
            allComplete={allComplete}
            statuses={statuses}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Shared domain types for the AI Factory game.
 *
 * These are pure TypeScript — no SDK imports, no React.
 * They can be imported by store, logic, host, and controller layers.
 */

// ── Roles ──────────────────────────────────────────────────────────────────

export type PlayerRole =
  | "power"
  | "data"
  | "security"
  | "model"
  | "cooling";

export const ALL_ROLES: PlayerRole[] = [
  "power",
  "data",
  "security",
  "model",
  "cooling",
];

export const ROLE_LABELS: Record<PlayerRole, string> = {
  power: "Power Engineer",
  data: "Data Engineer",
  security: "Security Engineer",
  model: "AI Model Engineer",
  cooling: "Cooling Engineer",
};

export const ROLE_ICONS: Record<PlayerRole, string> = {
  power: "⚡",
  data: "💾",
  security: "🛡",
  model: "🧠",
  cooling: "🌡",
};

export const ROLE_COLORS: Record<PlayerRole, string> = {
  power: "#facc15",   // amber/yellow
  data: "#60a5fa",    // blue
  security: "#34d399", // emerald
  model: "#c084fc",   // purple
  cooling: "#38bdf8", // sky
};

export const ROLE_MINI_GAME: Record<PlayerRole, string> = {
  power: "Tap-Tap Power",
  data: "Data Cleaning",
  security: "Zip-Zap Firewall",
  model: "AI Core Puzzle",
  cooling: "Gyro Temperature Control",
};

// ── Game Phases ────────────────────────────────────────────────────────────

export type GamePhase = "idle" | "lobby" | "playing" | "ended";

// ── Department Statuses ────────────────────────────────────────────────────

export type DepartmentStatus =
  | "inactive"
  | "working"
  | "stable"
  | "complete"
  | "warning"
  | "critical"
  | "failed";

// ── Factory Events ─────────────────────────────────────────────────────────

export type FactoryEventType =
  | "power_surge"
  | "data_corruption"
  | "cyber_attack"
  | "model_drift"
  | "critical_temperature";

export interface FactoryEvent {
  id: string;
  type: FactoryEventType;
  message: string;
  affectedRole: PlayerRole;
  startedAt: number; // ms timestamp
}

// ── Per-Department State ───────────────────────────────────────────────────

export interface DepartmentState {
  progress: number;       // 0–100
  status: DepartmentStatus;
  score: number;          // accumulated department score
}

// ── Final Result ───────────────────────────────────────────────────────────

export type FinalResult = "success" | "failure" | null;

// ── Full Factory State Data (no actions) ──────────────────────────────────

export interface FactoryStateData {
  /** Current game phase */
  phase: GamePhase;

  /** Seconds remaining in the current round */
  timeRemaining: number;

  /** Lobby: controllerId → assigned role */
  roleAssignments: Record<string, PlayerRole>;

  /** Per-department states */
  power: DepartmentState;
  data: DepartmentState;
  security: DepartmentState;
  model: DepartmentState;
  cooling: DepartmentState & {
    /** Current temperature in °C */
    temperature: number;
  };

  /** Derived: average of all department progresses */
  factoryHealth: number;

  /** Accumulated team score across all departments */
  teamScore: number;

  /** Currently active factory events */
  activeEvents: FactoryEvent[];

  /** Final success/failure result (set when phase === "ended") */
  finalResult: FinalResult;
}

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
  | "knowledge";

export const ALL_ROLES: PlayerRole[] = [
  "power",
  "data",
  "security",
  "model",
  "knowledge",
];

export const ROLE_LABELS: Record<PlayerRole, string> = {
  power: "Power Engineer",
  data: "Data Engineer",
  security: "Security Engineer",
  model: "AI Model Engineer",
  knowledge: "AI Knowledge Engineer",
};

export const ROLE_ICONS: Record<PlayerRole, string> = {
  power: "⚡",
  data: "💾",
  security: "🛡",
  model: "🧠",
  knowledge: "🔤",
};

export const ROLE_COLORS: Record<PlayerRole, string> = {
  power: "#facc15",   // amber/yellow
  data: "#60a5fa",    // blue
  security: "#34d399", // emerald
  model: "#c084fc",   // purple
  knowledge: "#a78bfa", // violet/indigo
};

export const ROLE_MINI_GAME: Record<PlayerRole, string> = {
  power: "Tap-Tap Power",
  data: "Data Cleaning",
  security: "AI/ML Firewall",
  model: "AI Core Puzzle",
  knowledge: "AI Term Scramble",
};

// ── Game Phases ────────────────────────────────────────────────────────────

export type GamePhase = "idle" | "lobby" | "playing" | "suddenDeath" | "ended";

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
  | "knowledge_drift";

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
  knowledge: DepartmentState & {
    /** Number of AI terms successfully solved this game */
    solvedCount: number;
  };

  /** Derived: average of all department progresses */
  factoryHealth: number;

  /** Accumulated team score across all departments */
  teamScore: number;

  /** Currently active factory events */
  activeEvents: FactoryEvent[];

  /** Final success/failure result (set when phase === "ended") */
  finalResult: FinalResult;

  // ── Sudden Death Golden Ticket ───────────────────────────────────────────

  /**
   * Per-player score for the Sudden Death AI Logo Quiz.
   * Keyed by controllerId. Only populated during/after "suddenDeath" phase.
   */
  suddenDeathScores: Record<string, number>;

  /** controllerId of the Sudden Death winner (set when phase transitions to "ended"). */
  suddenDeathWinner: string | null;

  /**
   * Index into AI_LOGOS of the question currently shown on the host.
   * Advances when any player correctly identifies the current logo.
   */
  currentQuizIndex: number;
}

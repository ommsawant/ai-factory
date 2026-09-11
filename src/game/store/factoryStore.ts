/**
 * AI Factory — networked, host-authoritative game store.
 *
 * State lane. All authoritative game data lives here.
 * Host applies actions; controllers receive broadcast state.
 *
 * Action contract:
 *   - (ctx, payload) => void   for normal mutations
 *   - rejectAirJamAction(...)  must be returned OUTSIDE of set()
 *
 * Reducers use `set(state => ...)`.
 * Keep per-frame controller input OUT of this store — use the input lane.
 */
import {
  createAirJamStore,
  rejectAirJamAction,
  type AirJamActionContext,
} from "@air-jam/sdk";

import { GAME_CONFIG } from "../config/gameConfig";
import { calculateFactoryHealth, evaluateFinalResult } from "../domain/factoryHealth";
import type {
  DepartmentState,
  FactoryStateData,
  FactoryEvent,
  GamePhase,
  PlayerRole,
} from "../domain/types";
import { ALL_ROLES } from "../domain/types";

// ── Scripted factory events ───────────────────────────────────────────────
// Events fire when timeRemaining matches these values.
// Visual-only: they create urgency without penalising progress.

const EVENT_DURATION_MS = 20_000;

interface ScheduledEvent {
  type: FactoryEvent["type"];
  message: string;
  affectedRole: PlayerRole;
}

const SCHEDULED_EVENTS: Record<number, ScheduledEvent> = {
  135: {
    type: "power_surge",
    message: "⚡ POWER SURGE — Stabilise the power grid!",
    affectedRole: "power",
  },
  105: {
    type: "cyber_attack",
    message: "🛡 CYBER ATTACK — Firewall under assault!",
    affectedRole: "security",
  },
  75: {
    type: "data_corruption",
    message: "💾 DATA CORRUPTION — Incoming data contaminated!",
    affectedRole: "data",
  },
  45: {
    type: "model_drift",
    message: "🧠 MODEL DRIFT — AI accuracy dropping!",
    affectedRole: "model",
  },
  20: {
    type: "critical_temperature",
    message: "🔥 CRITICAL TEMPERATURE — AI Core overheating!",
    affectedRole: "cooling",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDept(progress = 0): DepartmentState {
  return { progress, status: "inactive", score: 0 };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function deriveStatus(progress: number): DepartmentState["status"] {
  if (progress >= 100) return "complete";
  if (progress >= 70) return "stable";
  if (progress > 0) return "working";
  return "inactive";
}

// ── Initial state ──────────────────────────────────────────────────────────

export function createInitialFactoryState(): FactoryStateData {
  return {
    phase: "idle",
    timeRemaining: GAME_CONFIG.gameDurationSeconds,
    roleAssignments: {},
    power: makeDept(),
    data: makeDept(),
    security: makeDept(),
    model: makeDept(),
    cooling: {
      ...makeDept(),
      temperature: GAME_CONFIG.coolingTempStart,
    },
    factoryHealth: 0,
    teamScore: 0,
    activeEvents: [],
    finalResult: null,
  };
}

// ── Store interface (state + actions) ──────────────────────────────────────

export interface FactoryState extends FactoryStateData {
  actions: {
    // ── Lobby ──
    /** Called by each controller when they join. Host assigns them a role. */
    requestRole: (ctx: AirJamActionContext, payload: undefined) => void;

    /** Host-only: start the game when all 5 roles are filled. */
    startGame: (ctx: AirJamActionContext, payload: undefined) => void;

    /** Host-only: reset the entire session back to idle. */
    resetGame: (ctx: AirJamActionContext, payload: undefined) => void;

    // ── Power mini-game: real tap action ──
    /** Sent by the Power Engineer controller on every tap. */
    tapPower: (ctx: AirJamActionContext, payload: undefined) => void;

    // ── Data mini-game: real sort action ──
    /** Sent by the Data Engineer controller for each data token placement. */
    sortData: (
      ctx: AirJamActionContext,
      payload: { token: string; bucket: "numbers" | "ai_terms"; correct: boolean },
    ) => void;

    // ── Security mini-game: real Zip-Zap action ──
    /**
     * Sent by the Security Engineer controller for each ZIP or ZAP button press.
     * `hit: true`  → the player pressed the correct button in the sequence.
     * `hit: false` → the player pressed the wrong button.
     * Sequence generation lives in the controller as local UI state.
     */
    zipZap: (ctx: AirJamActionContext, payload: { hit: boolean }) => void;

    // ── AI Model mini-game: pipeline puzzle solve ──
    /**
     * Sent by the AI Model Engineer controller when they correctly arrange
     * the pipeline steps. Always called on success only — controller owns
     * the puzzle validation locally.
     */
    solvePuzzle: (ctx: AirJamActionContext, payload: undefined) => void;

    // ── Dev/test: direct department increments ──
    devIncrementPower: (ctx: AirJamActionContext, payload: { amount: number }) => void;
    devIncrementData: (ctx: AirJamActionContext, payload: { amount: number }) => void;
    devIncrementSecurity: (ctx: AirJamActionContext, payload: { amount: number }) => void;
    devIncrementModel: (ctx: AirJamActionContext, payload: { amount: number }) => void;
    devSetCoolingTemp: (ctx: AirJamActionContext, payload: { temperature: number }) => void;

    // ── Cooling mini-game: gyroscope / touch tick ──
    /**
     * Sent by the Cooling Engineer controller periodically.
     * `centeredness` is 0 (perfect centre) → 1 (edge of bounds).
     * Host adjusts temperature and awards score accordingly.
     */
    coolTick: (ctx: AirJamActionContext, payload: { centeredness: number }) => void;

    // ── Game lifecycle (timer tick, driven by host loop) ──
    tickTimer: (ctx: AirJamActionContext, payload: undefined) => void;
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useFactoryStore = createAirJamStore<FactoryState>((set, get) => ({
  ...createInitialFactoryState(),

  actions: {
    // ── Lobby ────────────────────────────────────────────────────────────

    requestRole: ({ actorId, role }) => {
      // Only controllers may request a role.
      if (role !== "controller") {
        return rejectAirJamAction("host_cannot_request_role", "Host cannot request a player role.");
      }

      set((state) => {
        // Already has a role → keep it.
        if (actorId && state.roleAssignments[actorId]) return state;

        // Only assign roles while in idle or lobby phase.
        if (state.phase !== "idle" && state.phase !== "lobby") {
          return state;
        }

        const takenRoles = new Set(Object.values(state.roleAssignments));
        const nextRole = ALL_ROLES.find((r) => !takenRoles.has(r));

        if (!nextRole || !actorId) return state; // no free slot

        const newAssignments = { ...state.roleAssignments, [actorId]: nextRole };
        const newPhase: GamePhase = "lobby";

        return { ...state, roleAssignments: newAssignments, phase: newPhase };
      });
    },

    startGame: ({ role }) => {
      if (role !== "host") {
        return rejectAirJamAction("only_host", "Only the host can start the game.");
      }

      // Check player count BEFORE entering set to allow early rejection.
      const current = get();
      const playerCount = Object.keys(current.roleAssignments).length;
      if (playerCount < GAME_CONFIG.maxPlayers) {
        return rejectAirJamAction(
          "not_enough_players",
          `Need ${GAME_CONFIG.maxPlayers} players, have ${playerCount}.`,
        );
      }

      set((state) => ({
        ...state,
        phase: "playing",
        timeRemaining: GAME_CONFIG.gameDurationSeconds,
        power: { ...state.power, status: "working" },
        data: { ...state.data, status: "working" },
        security: { ...state.security, status: "working" },
        model: { ...state.model, status: "working" },
        cooling: { ...state.cooling, status: "working" },
      }));
    },

    resetGame: ({ role }) => {
      if (role !== "host") {
        return rejectAirJamAction("only_host", "Only the host can reset.");
      }
      set(() => ({ ...createInitialFactoryState() }));
    },

    // ── Power mini-game ───────────────────────────────────────────────────

    tapPower: ({ actorId, role }) => {
      // Only controllers may tap; host can also tap for dev convenience.
      // Must be in playing phase.
      const current = get();
      if (current.phase !== "playing") {
        return rejectAirJamAction("not_playing", "Game is not in playing phase.");
      }

      // Guard: only the assigned Power engineer (or host) may tap.
      if (role === "controller") {
        const assignedRole = actorId ? current.roleAssignments[actorId] : undefined;
        if (assignedRole !== "power") {
          return rejectAirJamAction(
            "wrong_role",
            "Only the Power Engineer may tap the power button.",
          );
        }
      }

      set((state) => {
        if (state.phase !== "playing") return state;
        // Cap at 100 — prevent overshoot.
        if (state.power.progress >= 100) return state;

        const newProgress = clamp(state.power.progress + GAME_CONFIG.powerIncrementPerTap);
        const bonus = GAME_CONFIG.pointsPerPowerTap;
        const newPower: DepartmentState = {
          ...state.power,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.power.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, power: newPower });
        return {
          ...state,
          power: newPower,
          teamScore: state.teamScore + bonus,
          factoryHealth,
        };
      });
    },

    // ── Data mini-game ────────────────────────────────────────────────────

    sortData: ({ actorId, role }, { correct }) => {
      // Must be in playing phase.
      const current = get();
      if (current.phase !== "playing") {
        return rejectAirJamAction("not_playing", "Game is not in playing phase.");
      }

      // Guard: only the assigned Data engineer (or host) may sort.
      if (role === "controller") {
        const assignedRole = actorId ? current.roleAssignments[actorId] : undefined;
        if (assignedRole !== "data") {
          return rejectAirJamAction(
            "wrong_role",
            "Only the Data Engineer may sort data.",
          );
        }
      }

      // Incorrect sort: no progress, no score — just acknowledge.
      if (!correct) return;

      set((state) => {
        if (state.phase !== "playing") return state;
        if (state.data.progress >= 100) return state;

        const newProgress = clamp(state.data.progress + GAME_CONFIG.dataIncrementPerSort);
        const bonus = GAME_CONFIG.pointsPerDataSort;
        const newData: DepartmentState = {
          ...state.data,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.data.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, data: newData });
        return {
          ...state,
          data: newData,
          teamScore: state.teamScore + bonus,
          factoryHealth,
        };
      });
    },

    // ── Security mini-game ─────────────────────────────────────────────────

    zipZap: ({ actorId, role }, { hit }) => {
      // Must be in playing phase.
      const current = get();
      if (current.phase !== "playing") {
        return rejectAirJamAction("not_playing", "Game is not in playing phase.");
      }

      // Guard: only the assigned Security engineer (or host) may zip-zap.
      if (role === "controller") {
        const assignedRole = actorId ? current.roleAssignments[actorId] : undefined;
        if (assignedRole !== "security") {
          return rejectAirJamAction(
            "wrong_role",
            "Only the Security Engineer may use the Zip-Zap firewall.",
          );
        }
      }

      set((state) => {
        if (state.phase !== "playing") return state;
        if (state.security.progress >= 100) return state;

        if (hit) {
          // Correct press — advance firewall.
          const newProgress = clamp(state.security.progress + GAME_CONFIG.securityIncrementPerHit);
          const bonus = GAME_CONFIG.pointsPerZipZapHit;
          const newSecurity: DepartmentState = {
            ...state.security,
            progress: newProgress,
            status: deriveStatus(newProgress),
            score: state.security.score + bonus,
          };
          const factoryHealth = calculateFactoryHealth({ ...state, security: newSecurity });
          return {
            ...state,
            security: newSecurity,
            teamScore: state.teamScore + bonus,
            factoryHealth,
          };
        } else {
          // Wrong press — apply penalty (no score change).
          const newProgress = clamp(state.security.progress - GAME_CONFIG.securityPenaltyPerMiss);
          const newSecurity: DepartmentState = {
            ...state.security,
            progress: newProgress,
            status: deriveStatus(newProgress),
          };
          const factoryHealth = calculateFactoryHealth({ ...state, security: newSecurity });
          return { ...state, security: newSecurity, factoryHealth };
        }
      });
    },

    // ── AI Model mini-game ──────────────────────────────────────────────────

    solvePuzzle: ({ actorId, role }) => {
      const current = get();
      if (current.phase !== "playing") {
        return rejectAirJamAction("not_playing", "Game is not in playing phase.");
      }

      // Guard: only the assigned AI Model engineer (or host) may solve.
      if (role === "controller") {
        const assignedRole = actorId ? current.roleAssignments[actorId] : undefined;
        if (assignedRole !== "model") {
          return rejectAirJamAction(
            "wrong_role",
            "Only the AI Model Engineer may solve the AI Core puzzle.",
          );
        }
      }

      set((state) => {
        if (state.phase !== "playing") return state;
        if (state.model.progress >= 100) return state;

        const newProgress = clamp(state.model.progress + GAME_CONFIG.modelIncrementPerSolve);
        const bonus = GAME_CONFIG.pointsPerPuzzleStep;
        const newModel: DepartmentState = {
          ...state.model,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.model.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, model: newModel });
        return {
          ...state,
          model: newModel,
          teamScore: state.teamScore + bonus,
          factoryHealth,
        };
      });
    },

    // ── Dev/test actions ──────────────────────────────────────────────────

    devIncrementPower: (_ctx, { amount }) => {
      set((state) => {
        if (state.phase !== "playing") return state;
        const newProgress = clamp(state.power.progress + amount);
        const bonus = amount * GAME_CONFIG.pointsPerPowerTap;
        const newPower = {
          ...state.power,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.power.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, power: newPower });
        return { ...state, power: newPower, teamScore: state.teamScore + bonus, factoryHealth };
      });
    },

    devIncrementData: (_ctx, { amount }) => {
      set((state) => {
        if (state.phase !== "playing") return state;
        const newProgress = clamp(state.data.progress + amount);
        const bonus = Math.round(amount * (GAME_CONFIG.pointsPerDataSort / 10));
        const newData = {
          ...state.data,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.data.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, data: newData });
        return { ...state, data: newData, teamScore: state.teamScore + bonus, factoryHealth };
      });
    },

    devIncrementSecurity: (_ctx, { amount }) => {
      set((state) => {
        if (state.phase !== "playing") return state;
        const newProgress = clamp(state.security.progress + amount);
        const bonus = Math.round(amount * (GAME_CONFIG.pointsPerZipZapHit / 10));
        const newSecurity = {
          ...state.security,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.security.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, security: newSecurity });
        return { ...state, security: newSecurity, teamScore: state.teamScore + bonus, factoryHealth };
      });
    },

    devIncrementModel: (_ctx, { amount }) => {
      set((state) => {
        if (state.phase !== "playing") return state;
        const newProgress = clamp(state.model.progress + amount);
        const bonus = Math.round(amount * (GAME_CONFIG.pointsPerPuzzleStep / 10));
        const newModel = {
          ...state.model,
          progress: newProgress,
          status: deriveStatus(newProgress),
          score: state.model.score + bonus,
        };
        const factoryHealth = calculateFactoryHealth({ ...state, model: newModel });
        return { ...state, model: newModel, teamScore: state.teamScore + bonus, factoryHealth };
      });
    },

    devSetCoolingTemp: (_ctx, { temperature }) => {
      set((state) => {
        if (state.phase !== "playing") return state;
        const temp = Math.max(50, Math.min(120, temperature));
        const inSafeZone =
          temp >= GAME_CONFIG.coolingSafeMin && temp <= GAME_CONFIG.coolingSafeMax;

        const safeCenter = (GAME_CONFIG.coolingSafeMin + GAME_CONFIG.coolingSafeMax) / 2;
        const maxDeviation = GAME_CONFIG.coolingTempStart - GAME_CONFIG.coolingSafeMin;
        const deviation = Math.abs(temp - safeCenter);
        const coolingProgress = clamp(Math.round(100 - (deviation / maxDeviation) * 100));

        const newCooling = {
          ...state.cooling,
          temperature: temp,
          progress: coolingProgress,
          status: (inSafeZone
            ? "stable"
            : temp > 80
              ? "warning"
              : "working") as DepartmentState["status"],
          score: inSafeZone
            ? state.cooling.score + GAME_CONFIG.pointsPerCoolingTick
            : state.cooling.score,
        };

        const factoryHealth = calculateFactoryHealth({ ...state, cooling: newCooling });
        return {
          ...state,
          cooling: newCooling,
          teamScore: inSafeZone
            ? state.teamScore + GAME_CONFIG.pointsPerCoolingTick
            : state.teamScore,
          factoryHealth,
        };
      });
    },

    // ── Cooling mini-game ──────────────────────────────────────────────────

    coolTick: ({ actorId, role }, { centeredness }) => {
      const current = get();
      if (current.phase !== "playing") {
        return rejectAirJamAction("not_playing", "Game is not in playing phase.");
      }

      // Guard: only the assigned Cooling engineer (or host) may send ticks.
      if (role === "controller") {
        const assignedRole = actorId ? current.roleAssignments[actorId] : undefined;
        if (assignedRole !== "cooling") {
          return rejectAirJamAction(
            "wrong_role",
            "Only the Cooling Engineer may send cooling ticks.",
          );
        }
      }

      set((state) => {
        if (state.phase !== "playing") return state;

        // Clamp centeredness 0–1 defensively (controller is untrusted network source).
        const c = Math.min(1, Math.max(0, centeredness));

        // Interpolate temperature change: perfectly centred = cool, fully off = heat.
        // At c=0 we subtract coolingTempDecreasePerTick;
        // at c=1 we add coolingTempIncreasePerTick.
        const delta =
          -GAME_CONFIG.coolingTempDecreasePerTick +
          c * (GAME_CONFIG.coolingTempDecreasePerTick + GAME_CONFIG.coolingTempIncreasePerTick);

        const rawTemp = state.cooling.temperature + delta;
        const temp = Math.max(50, Math.min(120, rawTemp));

        const inSafeZone =
          temp >= GAME_CONFIG.coolingSafeMin && temp <= GAME_CONFIG.coolingSafeMax;
        const isCentered = c <= GAME_CONFIG.coolingCenteredThreshold;
        const scoreBonus = isCentered ? GAME_CONFIG.pointsPerCoolingTick : 0;

        // Derive progress: full score when inside safe zone.
        const safeCenter = (GAME_CONFIG.coolingSafeMin + GAME_CONFIG.coolingSafeMax) / 2;
        const maxDeviation = GAME_CONFIG.coolingTempStart - GAME_CONFIG.coolingSafeMin;
        const deviation = Math.abs(temp - safeCenter);
        const coolingProgress = clamp(Math.round(100 - (deviation / maxDeviation) * 100));

        const newStatus: DepartmentState["status"] = inSafeZone
          ? "stable"
          : temp > 85
            ? "critical"
            : temp > 78
              ? "warning"
              : "working";

        const newCooling = {
          ...state.cooling,
          temperature: temp,
          progress: coolingProgress,
          status: newStatus,
          score: state.cooling.score + scoreBonus,
        };

        const factoryHealth = calculateFactoryHealth({ ...state, cooling: newCooling });
        return {
          ...state,
          cooling: newCooling,
          teamScore: state.teamScore + scoreBonus,
          factoryHealth,
        };
      });
    },

    // ── Timer tick ────────────────────────────────────────────────────────

    tickTimer: ({ role }) => {
      if (role !== "host") return;

      set((state) => {
        if (state.phase !== "playing") return state;

        const newTime = state.timeRemaining - 1;
        const now = Date.now();

        if (newTime <= 0) {
          const finalResult = evaluateFinalResult(
            state,
            GAME_CONFIG.factorySuccessThreshold,
            GAME_CONFIG.criticalDeptMinimum,
          );
          return { ...state, timeRemaining: 0, phase: "ended", finalResult, activeEvents: [] };
        }

        // Expire old events.
        const liveEvents = state.activeEvents.filter(
          (e) => now - e.startedAt < EVENT_DURATION_MS,
        );

        // Spawn a new scheduled event if one is due at this second.
        const scheduled = SCHEDULED_EVENTS[newTime];
        if (scheduled) {
          // Don't re-add the same event type if it's already active.
          const alreadyActive = liveEvents.some((e) => e.type === scheduled.type);
          if (!alreadyActive) {
            const newEvent: FactoryEvent = {
              id: `${scheduled.type}-${newTime}`,
              type: scheduled.type,
              message: scheduled.message,
              affectedRole: scheduled.affectedRole,
              startedAt: now,
            };
            liveEvents.push(newEvent);
          }
        }

        return { ...state, timeRemaining: newTime, activeEvents: liveEvents };
      });
    },
  },
}));

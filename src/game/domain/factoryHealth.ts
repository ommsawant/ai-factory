/**
 * Factory Health calculation.
 *
 * Isolated pure function — no SDK, no React, no side effects.
 * Tune balance here without touching any UI component.
 *
 * Initial MVP: simple average of all five department progresses.
 * Future: weighted departments, critical failures, event penalties.
 */
import type { FactoryStateData } from "./types";

/**
 * Compute factory health from the current state.
 * Returns a number 0–100.
 *
 * The Cooling department contributes via a "comfort score" derived from
 * how close the temperature is to the safe zone centre — so a perfect
 * temperature also gives 100% to the average.
 */
export function calculateFactoryHealth(state: FactoryStateData): number {
  const { power, data, security, model, cooling } = state;

  // Cooling contributes its explicit progress value (set by host when stable).
  const avg =
    (power.progress +
      data.progress +
      security.progress +
      model.progress +
      cooling.progress) /
    5;

  return Math.round(Math.min(100, Math.max(0, avg)));
}

/**
 * Determine whether the team has met the success conditions at game end.
 * Uses the configurable thresholds from gameConfig.
 */
export function evaluateFinalResult(
  state: FactoryStateData,
  successThreshold: number,
  criticalMinimum: number,
): "success" | "failure" {
  const health = calculateFactoryHealth(state);

  if (health < successThreshold) return "failure";

  const departments = [
    state.power.progress,
    state.data.progress,
    state.security.progress,
    state.model.progress,
    state.cooling.progress,
  ];

  const hasCriticalFailure = departments.some((p) => p < criticalMinimum);
  if (hasCriticalFailure) return "failure";

  return "success";
}

/**
 * Controller → host input schema (continuous input lane).
 *
 * The gyroscope fields below are retained to preserve the existing Air Jam
 * input registration shape, but are no longer actively consumed.
 * The AI Knowledge Engineer (formerly Cooling Engineer) now uses discrete
 * store actions (solveKnowledgeTerm) instead of a continuous input lane.
 *
 * All roles use discrete store actions. See docs/state-lanes-cookbook.md
 * for the decision rationale.
 */
import { z } from "zod";

export const gameInputSchema = z.object({
  /** Device orientation — retained for schema compatibility; currently unused. */
  alpha: z.number().nullable(),
  beta: z.number().nullable(),
  gamma: z.number().nullable(),
});

export type GameInput = z.infer<typeof gameInputSchema>;

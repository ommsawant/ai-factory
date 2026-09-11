/**
 * Controller → host input schema (continuous input lane).
 *
 * Only the Cooling Engineer needs per-frame continuous data
 * (device orientation / gyroscope tilt).
 *
 * All other roles use discrete store actions instead of the input lane.
 * See docs/state-lanes-cookbook.md for the decision rationale.
 *
 * If the device does not support orientation, the controller sends
 * { alpha: null, beta: null, gamma: null } and the host falls back to
 * the devSetCoolingTemp store action driven by touch controls.
 */
import { z } from "zod";

export const gameInputSchema = z.object({
  /** Device orientation — null when unsupported or permission denied. */
  alpha: z.number().nullable(),
  beta: z.number().nullable(),
  gamma: z.number().nullable(),
});

export type GameInput = z.infer<typeof gameInputSchema>;

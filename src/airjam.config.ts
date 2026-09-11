/**
 * Air Jam app config for AI Factory — Build • Break • Survive.
 *
 * Declares runtime topology, controller sub-route, input schema (Cooling gyro),
 * and the semantic agent contract.
 * `env.vite(...)` resolves topology from `VITE_AIR_JAM_*` env vars.
 */
import { createAirJamApp, env } from "@air-jam/sdk";
import { defineAirJamGameMetadata } from "@air-jam/sdk/metadata";
import { agentContract } from "./game/contracts/agent";
import { gameInputSchema } from "./game/input";

export const gameMetadata = defineAirJamGameMetadata({
  slug: "ai-factory",
  name: "AI Factory — Build • Break • Survive",
  tagline:
    "5-player cooperative game. Five engineers. One shared AI Factory. Deploy the AI before time runs out.",
  category: "party",
  minPlayers: 1,   // allow 1 for dev/testing
  maxPlayers: 5,
  inputModalities: ["buttons", "touch", "motion"],
  supportedSdkRange: "^1.0.0",
  maintainer: { name: "Antigravity" },
  ageRating: "all-ages",
  tags: ["cooperative", "engineering", "ai", "expo", "mobile"],
});

export const airjam = createAirJamApp({
  runtime: env.vite(import.meta.env),
  metadata: gameMetadata,
  controllerPath: "/controller",
  agent: agentContract,
  input: {
    schema: gameInputSchema,
  },
});

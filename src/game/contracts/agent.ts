/**
 * Semantic agent contract for AI Factory.
 *
 * Exposes a snapshot of the FactoryState for MCP tools and automated agents,
 * and declares the available semantic actions.
 */
import {
  agentAction,
  agentActionInput,
  agentStore,
  defineAirJamAgentContract,
  defineAirJamAgentStores,
} from "@air-jam/sdk";
import { z } from "zod";
import type { FactoryState } from "../store/factoryStore";

const stores = defineAirJamAgentStores({
  default: agentStore<FactoryState>(),
});

export const agentContract = defineAirJamAgentContract({
  stores,
  snapshotDescription:
    "AI Factory game state snapshot: phase, timer, department progresses, factory health, team score, and role assignments.",
  projectSnapshot: (context) => {
    const state = context.stores.default;
    if (!state) {
      return { available: false, summary: "Factory store not yet available." };
    }

    return {
      available: true,
      phase: state.phase,
      timeRemaining: state.timeRemaining,
      roleAssignments: state.roleAssignments,
      playerCount: Object.keys(state.roleAssignments).length,
      departments: {
        power: { progress: state.power.progress, status: state.power.status, score: state.power.score },
        data: { progress: state.data.progress, status: state.data.status, score: state.data.score },
        security: { progress: state.security.progress, status: state.security.status, score: state.security.score },
        model: { progress: state.model.progress, status: state.model.status, score: state.model.score },
        cooling: {
          progress: state.cooling.progress,
          status: state.cooling.status,
          score: state.cooling.score,
          temperature: state.cooling.temperature,
        },
      },
      factoryHealth: state.factoryHealth,
      teamScore: state.teamScore,
      activeEvents: state.activeEvents,
      finalResult: state.finalResult,
    };
  },
  actions: {
    start_game: agentAction.host(
      { actionName: "startGame" },
      {
        input: agentActionInput.none(),
        description: "Start the AI Factory game session. Requires all 5 roles to be filled.",
        availability: "Only when phase is 'lobby' and 5 players are connected.",
        resultDescription: "Phase transitions to 'playing'. All departments become active.",
      },
    ),
    reset_game: agentAction.host(
      { actionName: "resetGame" },
      {
        input: agentActionInput.none(),
        description: "Reset the entire session back to idle state.",
        availability: "Any time.",
        resultDescription: "All state is cleared. Phase returns to 'idle'.",
      },
    ),
    tap_power: agentAction.participant(
      { actionName: "tapPower" },
      {
        input: agentActionInput.none(),
        description:
          "Send a single power tap from the Power Engineer controller. Increments Power progress by the configured amount.",
        availability: "Only while phase is 'playing' and the caller is assigned the 'power' role.",
        resultDescription:
          "Power progress increases. Factory health and team score update. When progress reaches 100, Power is marked COMPLETE.",
      },
    ),
    sort_data: agentAction.participant(
      { actionName: "sortData" },
      {
        input: agentActionInput.zod(
          z.object({
            token: z.string().describe("The data token being sorted, e.g. '42' or 'AI'."),
            bucket: z.enum(["numbers", "ai_terms"]).describe("The bucket the player placed the token into."),
            correct: z.boolean().describe("True when the player placed the token in the correct bucket."),
          }),
        ),
        description:
          "Send a data sort action from the Data Engineer controller. Correct placements advance Data progress; incorrect ones are acknowledged with no penalty.",
        availability: "Only while phase is 'playing' and the caller is assigned the 'data' role.",
        resultDescription:
          "On correct=true: Data progress increases by dataIncrementPerSort, factory health and team score update. On correct=false: no state change.",
      },
    ),
    zip_zap: agentAction.participant(
      { actionName: "zipZap" },
      {
        input: agentActionInput.zod(
          z.object({
            hit: z
              .boolean()
              .describe(
                "True when the Security Engineer pressed the correct ZIP or ZAP button for the current sequence step. False when they pressed the wrong button.",
              ),
          }),
        ),
        description:
          "Send a Zip-Zap Firewall press from the Security Engineer controller. The controller owns the sequence and validates locally; the store receives only whether the press was correct.",
        availability: "Only while phase is 'playing' and the caller is assigned the 'security' role.",
        resultDescription:
          "On hit=true: Security progress increases by securityIncrementPerHit, factory health and team score update. On hit=false: Security progress decreases by securityPenaltyPerMiss (clamped to 0), no score change.",
      },
    ),
    solve_puzzle: agentAction.participant(
      { actionName: "solvePuzzle" },
      {
        input: agentActionInput.zod(z.object({})),
        description:
          "Send a puzzle solve action from the AI Model Engineer controller. This indicates the player successfully arranged the current AI pipeline puzzle. The puzzle validation is handled locally by the controller.",
        availability: "Only while phase is 'playing' and the caller is assigned the 'model' role.",
        resultDescription:
          "Model progress increases by modelIncrementPerSolve, factory health and team score update.",
      },
    ),
    dev_increment_power: agentAction.participant(
      { actionName: "devIncrementPower" },
      {
        input: agentActionInput.zod(
          z.object({ amount: z.number().int().min(1).max(100) }),
        ),
        description: "[DEV] Increment the Power department progress by the given amount.",
        availability: "Only while phase is 'playing'.",
        resultDescription: "Power progress, factory health, and team score update.",
      },
    ),
    dev_increment_data: agentAction.participant(
      { actionName: "devIncrementData" },
      {
        input: agentActionInput.zod(
          z.object({ amount: z.number().int().min(1).max(100) }),
        ),
        description: "[DEV] Increment the Data department progress.",
        availability: "Only while phase is 'playing'.",
        resultDescription: "Data progress, factory health, and team score update.",
      },
    ),
    dev_increment_security: agentAction.participant(
      { actionName: "devIncrementSecurity" },
      {
        input: agentActionInput.zod(
          z.object({ amount: z.number().int().min(1).max(100) }),
        ),
        description: "[DEV] Increment the Security department progress.",
        availability: "Only while phase is 'playing'.",
        resultDescription: "Security progress, factory health, and team score update.",
      },
    ),
    dev_increment_model: agentAction.participant(
      { actionName: "devIncrementModel" },
      {
        input: agentActionInput.zod(
          z.object({ amount: z.number().int().min(1).max(100) }),
        ),
        description: "[DEV] Increment the AI Model department progress.",
        availability: "Only while phase is 'playing'.",
        resultDescription: "Model progress, factory health, and team score update.",
      },
    ),
    dev_set_cooling_temp: agentAction.participant(
      { actionName: "devSetCoolingTemp" },
      {
        input: agentActionInput.zod(
          z.object({ temperature: z.number().min(50).max(120) }),
        ),
        description: "[DEV] Set the Cooling department temperature directly.",
        availability: "Only while phase is 'playing'.",
        resultDescription: "Cooling temperature, progress, and factory health update.",
      },
    ),
  },
});

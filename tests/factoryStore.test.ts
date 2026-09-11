import { describe, expect, it, beforeEach } from "vitest";
import { useFactoryStore } from "../src/game/store/factoryStore";
import { GAME_CONFIG } from "../src/game/config/gameConfig";
import type { AirJamActionContext } from "@air-jam/sdk";

// Helper to create mock context
const mockCtx = (role: "host" | "controller", actorId?: string): AirJamActionContext => ({
  role,
  actorId: actorId ?? "",
  connectedPlayerIds: [],
});

describe("factoryStore - Data Engineer", () => {
  beforeEach(() => {
    // Reset store before each test using the host action
    const actions = useFactoryStore.getState().actions;
    actions.resetGame(mockCtx("host", "host"), undefined);
  });

  const setupPlayingPhase = () => {
    const actions = useFactoryStore.getState().actions;
    // Request roles to fill the lobby
    actions.requestRole(mockCtx("controller", "player1"), undefined); // power
    actions.requestRole(mockCtx("controller", "player2"), undefined); // data
    actions.requestRole(mockCtx("controller", "player3"), undefined); // security
    actions.requestRole(mockCtx("controller", "player4"), undefined); // model
    actions.requestRole(mockCtx("controller", "player5"), undefined); // cooling
    
    // Start game
    actions.startGame(mockCtx("host", "host"), undefined);
  };

  it("should not allow sorting when not in playing phase", () => {
    const actions = useFactoryStore.getState().actions;
    
    // Store starts in 'idle'
    actions.sortData(mockCtx("controller", "player1"), { token: "42", bucket: "numbers", correct: true });
    
    expect(useFactoryStore.getState().data.progress).toBe(0);
  });

  it("should not allow non-data role to sort", () => {
    setupPlayingPhase();
    const actions = useFactoryStore.getState().actions;
    
    // player1 is power, player2 is data
    actions.sortData(mockCtx("controller", "player1"), { token: "42", bucket: "numbers", correct: true });
    
    // Progress should remain 0
    expect(useFactoryStore.getState().data.progress).toBe(0);
  });

  it("should increment data progress and score on correct sort by data engineer", () => {
    setupPlayingPhase();
    const actions = useFactoryStore.getState().actions;
    
    // player2 is data engineer
    actions.sortData(mockCtx("controller", "player2"), { token: "42", bucket: "numbers", correct: true });
    
    const state = useFactoryStore.getState();
    expect(state.data.progress).toBe(GAME_CONFIG.dataIncrementPerSort);
    expect(state.data.score).toBe(GAME_CONFIG.pointsPerDataSort);
    expect(state.teamScore).toBe(GAME_CONFIG.pointsPerDataSort);
    expect(state.factoryHealth).toBeGreaterThan(0);
  });

  it("should ignore incorrect sorts", () => {
    setupPlayingPhase();
    const actions = useFactoryStore.getState().actions;
    
    // player2 is data engineer
    actions.sortData(mockCtx("controller", "player2"), { token: "42", bucket: "ai_terms", correct: false });
    
    const state = useFactoryStore.getState();
    expect(state.data.progress).toBe(0);
    expect(state.data.score).toBe(0);
  });
});

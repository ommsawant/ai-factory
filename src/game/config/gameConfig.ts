/**
 * Central game configuration.
 *
 * All tuning constants live here. Never scatter these values across components.
 * When playtesting reveals balance issues, change values here only.
 */
export const GAME_CONFIG = {
  // --- Session ---
  maxPlayers: 5,
  gameDurationSeconds: 60, // 1 minute

  // --- Department targets ---
  powerTarget: 100,
  dataTarget: 100,
  securityTarget: 100,
  modelTarget: 100,

  // --- Cooling safe range (°C) ---
  coolingTempStart: 95,   // starting temperature
  coolingSafeMin: 70,
  coolingSafeMax: 75,

  // --- Cooling Engineer gyroscope mini-game ---
  /** Max tilt angle (degrees) that maps to the edge of the spirit-level bounds. */
  coolingMaxTiltAngle: 30,
  /** °C decrease per tick when bubble is perfectly centred (centeredness = 0). */
  coolingTempDecreasePerTick: 1.5,
  /** °C increase per tick when bubble is fully off-centre (centeredness = 1). */
  coolingTempIncreasePerTick: 2.0,
  /**
   * Fraction of the bounds radius within which the bubble is considered
   * "centred" and earns score.  0.25 = inner 25 % of the circle.
   */
  coolingCenteredThreshold: 0.25,
  /** How often the controller syncs its centeredness to the host (ms). */
  coolingTickThrottleMs: 500,

  // --- Scoring ---
  pointsPerPowerTap: 10,
  pointsPerDataSort: 25,    // correct sort
  pointsPerDataMissort: 0,  // incorrect sort (no penalty, just no gain)
  pointsPerZipZapHit: 15,
  pointsPerPuzzleStep: 50,  // awarded per completed puzzle round
  pointsPerCoolingTick: 5,

  // --- Factory health thresholds ---
  factorySuccessThreshold: 70, // factory health % required to win
  criticalDeptMinimum: 40,     // no dept may fall below this to win

  // --- Power mini-game ---
  /** Progress awarded for every valid controller tap (50 taps to complete). */
  powerIncrementPerTap: 2,

  // --- Data cleaning mini-game ---
  /** Progress awarded per correct sort (20 correct sorts to complete). */
  dataIncrementPerSort: 5,
  /** Throttle: min ms between sort submissions to prevent spam. */
  dataSortThrottleMs: 300,
  /** Number categories — these map to bucket 'numbers' */
  dataTokensNumbers: ["42", "7", "18", "91", "256", "3", "99", "1024", "0", "64"] as const,
  /** AI term categories — these map to bucket 'ai_terms' */
  dataTokensAiTerms: ["AI", "ML", "DL", "GPU", "NLP", "LLM", "CNN", "GAN", "BERT", "API"] as const,

  // --- Zip-Zap Firewall mini-game (Security Engineer) ---
  /** Progress awarded per correct button press (≈ 34 correct presses to complete). */
  securityIncrementPerHit: 3,
  /** Progress deducted per wrong button press (clamped to 0). */
  securityPenaltyPerMiss: 2,
  /** Starting length of the ZIP/ZAP sequence. */
  securitySequenceSeedLength: 4,
  /** Grow the sequence by 1 after every N correct hits. */
  securitySequenceGrowEvery: 6,
  /** Throttle: minimum ms between accepted inputs to prevent mashing. */
  securityHitThrottleMs: 150,

  // --- AI Core Puzzle mini-game (AI Model Engineer) ---
  /** Progress awarded per completed puzzle round (5 solves to reach 100%). */
  modelIncrementPerSolve: 20,

  // --- Dev/test increments (used by the dev test interface) ---
  devIncrementAmount: 10,
} as const;

export type GameConfig = typeof GAME_CONFIG;

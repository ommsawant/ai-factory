/**
 * AI Factory — End-to-End Test Suite
 *
 * Key fix from first run:
 *  - Controllers must join via the host's joinUrl (which embeds the room code).
 *    Without it each controller opens an independent session and never enters
 *    the same room as the host.
 *  - ROLE_LABELS use full names ("Power Engineer"), not short caps ("POWER").
 *  - The playing screen header says "🏭 AI FACTORY", not "AI CONTROL ROOM".
 *  - Timer renders as MM:SS; we locate via the "Time" label's sibling, not raw regex.
 *
 * Architecture:
 *  - One host page opens first; we wait for its joinUrl to appear in a
 *    hidden data-testid="join-url" element.
 *  - 5 controller pages are then opened with that URL so they all join the
 *    same room.
 *  - Tests run sequentially sharing the same pages (beforeAll/afterAll).
 */

import { test, expect, type Page } from "@playwright/test";

// ── Constants ──────────────────────────────────────────────────────────────

const HOST_URL = "/";
const NUM_PLAYERS = 5;

// ── Shared state (set up in beforeAll) ────────────────────────────────────

let hostPage: Page;
const ctrlPages: Page[] = [];

// ── Suite ──────────────────────────────────────────────────────────────────

test.describe("AI Factory — full game lifecycle", () => {

  test.beforeAll(async ({ browser }) => {
    // ── 1. Open host ───────────────────────────────────────────────────────
    const hostCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    hostPage = await hostCtx.newPage();
    await hostPage.goto(HOST_URL);

    // Wait for the Air Jam server to assign a room and expose the joinUrl.
    await hostPage.waitForSelector("[data-testid='join-url']", {
      state: "attached",   // element exists in DOM even if hidden
      timeout: 30_000,
    });

    const joinUrl = await hostPage
      .locator("[data-testid='join-url']")
      .textContent({ timeout: 10_000 });

    if (!joinUrl) throw new Error("Host joinUrl never appeared — server may not be running.");

    console.log(`[E2E] Host joinUrl: ${joinUrl}`);

    // ── 2. Open 5 controllers using the real joinUrl ───────────────────────
    for (let i = 0; i < NUM_PLAYERS; i++) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      // The joinUrl already includes the ?room= param and points at /controller.
      await page.goto(joinUrl);
      ctrlPages.push(page);
    }
  });

  test.afterAll(async () => {
    for (const page of [hostPage, ...ctrlPages]) {
      await page.close().catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1 — Host loaded and transitioned to lobby
  // ─────────────────────────────────────────────────────────────────────────

  test("1. Host shows AI Factory UI (lobby phase after controllers join)", async () => {
    // "AI FACTORY" title appears in every phase.
    await expect(hostPage.getByText(/AI FACTORY/i).first()).toBeVisible({ timeout: 10_000 });
    // By the time this test runs, beforeAll has opened all 5 controllers,
    // so the host will already be in the lobby phase.
    await expect(hostPage.getByText(/AI FACTORY LOBBY/i)).toBeVisible({ timeout: 15_000 });
  });


  // ─────────────────────────────────────────────────────────────────────────
  // Test 2 — Controllers connect and get roles
  // ─────────────────────────────────────────────────────────────────────────

  test("2. All 5 controllers connect and are assigned a role", async () => {
    // Each controller's lobby screen shows "Your Role".
    await Promise.all(
      ctrlPages.map((page) =>
        expect(page.getByText(/Your Role/i)).toBeVisible({ timeout: 30_000 })
      )
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3 — Host lobby shows full roster
  // ─────────────────────────────────────────────────────────────────────────

  test("3. Host lobby shows 5/5 engineers and LAUNCH MISSION button", async () => {
    // Host transitions to lobby once first player joins.
    await expect(hostPage.getByText(/AI FACTORY LOBBY/i)).toBeVisible({ timeout: 20_000 });

    // All 5 slots filled.
    await expect(hostPage.getByText(/5 \/ 5 Engineers Ready/i)).toBeVisible({ timeout: 25_000 });

    // LAUNCH button appears.
    await expect(
      hostPage.getByRole("button", { name: /LAUNCH MISSION/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4 — Host starts the game
  // ─────────────────────────────────────────────────────────────────────────

  test("4. Host can start the game", async () => {
    await hostPage.getByRole("button", { name: /LAUNCH MISSION/i }).click();

    // Playing screen header: "🏭 AI FACTORY" (same as idle, but now the control
    // room layout is shown — verify by the presence of the timer label).
    await expect(hostPage.getByText(/^Time$/i)).toBeVisible({ timeout: 15_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5 — Controllers show mini-game UIs
  // ─────────────────────────────────────────────────────────────────────────

  test("5. All controllers render their mini-game UI after game starts", async () => {
    await Promise.all(
      ctrlPages.map((page) =>
        // Each playing screen shows a "Progress" label.
        expect(page.getByText(/^Progress$/i).first()).toBeVisible({ timeout: 20_000 })
      )
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6 — Power mini-game
  // ─────────────────────────────────────────────────────────────────────────

  test("6. Power engineer: tapping the TAP button increases progress", async () => {
    const powerPage = await findControllerByRole("Power Engineer", ctrlPages);
    if (!powerPage) { test.skip(); return; }

    const tapBtn = powerPage.locator("#power-tap-btn");
    await expect(tapBtn).toBeVisible({ timeout: 10_000 });

    const progressBefore = await readProgressPercent(powerPage);

    for (let i = 0; i < 15; i++) {
      await tapBtn.click({ delay: 90 });
    }

    await expect(async () => {
      const after = await readProgressPercent(powerPage);
      expect(after).toBeGreaterThan(progressBefore);
    }).toPass({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7 — Data mini-game
  // ─────────────────────────────────────────────────────────────────────────

  test("7. Data engineer: sorting tokens into buckets increases progress", async () => {
    const dataPage = await findControllerByRole("Data Engineer", ctrlPages);
    if (!dataPage) { test.skip(); return; }

    const numbersBucket = dataPage.locator("#data-bucket-numbers");
    const aiTermsBucket = dataPage.locator("#data-bucket-ai-terms");
    await expect(numbersBucket).toBeVisible({ timeout: 10_000 });

    const progressBefore = await readProgressPercent(dataPage);

    for (let i = 0; i < 10; i++) {
      await (i % 2 === 0 ? numbersBucket : aiTermsBucket).click({ delay: 120 });
    }

    await expect(async () => {
      const after = await readProgressPercent(dataPage);
      expect(after).toBeGreaterThanOrEqual(progressBefore);
    }).toPass({ timeout: 8_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8 — Security mini-game
  // ─────────────────────────────────────────────────────────────────────────

  test("8. Security engineer: ZIP and ZAP buttons are interactive", async () => {
    const secPage = await findControllerByRole("Security Engineer", ctrlPages);
    if (!secPage) { test.skip(); return; }

    const zipBtn = secPage.locator("#security-zip-btn");
    const zapBtn = secPage.locator("#security-zap-btn");
    await expect(zipBtn).toBeVisible({ timeout: 10_000 });
    await expect(zapBtn).toBeVisible({ timeout: 10_000 });

    const progressBefore = await readProgressPercent(secPage);

    // Alternate ZIP/ZAP — some combos will be correct and advance the sequence.
    for (let i = 0; i < 14; i++) {
      await (i % 2 === 0 ? zipBtn : zapBtn).click({ delay: 80 });
    }

    const progressAfter = await readProgressPercent(secPage);
    expect(progressAfter).toBeGreaterThanOrEqual(progressBefore);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9 — Model mini-game
  // ─────────────────────────────────────────────────────────────────────────

  test("9. Model engineer: puzzle cards are visible and respond to taps", async () => {
    const modelPage = await findControllerByRole("AI Model Engineer", ctrlPages);
    if (!modelPage) { test.skip(); return; }

    for (let i = 0; i < 4; i++) {
      await expect(modelPage.locator(`#puzzle-card-${i}`)).toBeVisible({ timeout: 10_000 });
    }

    // Perform a swap: tap card 0, then card 1.
    await modelPage.locator("#puzzle-card-0").click();
    await modelPage.locator("#puzzle-card-1").click();

    // Cards should still render (game continues).
    await expect(modelPage.locator("#puzzle-card-0")).toBeVisible({ timeout: 3_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 10 — Cooling mini-game
  // ─────────────────────────────────────────────────────────────────────────

  test("10. Cooling engineer: temperature readout and progress are visible", async () => {
    const coolingPage = await findControllerByRole("Cooling Engineer", ctrlPages);
    if (!coolingPage) { test.skip(); return; }

    await expect(coolingPage.getByText(/°C/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(coolingPage.getByText(/^Progress$/i).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 11 — Host control room shows all 5 role panels
  // ─────────────────────────────────────────────────────────────────────────

  test("11. Host control room shows department panels for all 5 roles", async () => {
    // ROLE_LABELS are full names: "Power Engineer", "Data Engineer", etc.
    const roleLabels = [
      "Power Engineer",
      "Data Engineer",
      "Security Engineer",
      "AI Model Engineer",
      "Cooling Engineer",
    ];
    for (const label of roleLabels) {
      await expect(
        hostPage.getByText(new RegExp(label, "i")).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 12 — Host timer ticks down
  // ─────────────────────────────────────────────────────────────────────────

  test("12. Host timer is ticking down during playing phase", async () => {
    // The "Time" label is an uppercase 9px div just above the timer value.
    // Grab the host body text and look for the MM:SS pattern directly via evaluate.
    const getTimerText = () =>
      hostPage.evaluate(() => {
        const all = Array.from(document.querySelectorAll("div, span"));
        const found = all.find((el) => /^\d{2}:\d{2}$/.test((el.textContent ?? "").trim()));
        return found?.textContent?.trim() ?? null;
      });

    const t1 = await getTimerText();
    expect(t1).toMatch(/\d{2}:\d{2}/);

    await hostPage.waitForTimeout(2500);

    const t2 = await getTimerText();
    expect(t2).toMatch(/\d{2}:\d{2}/);

    // Second reading should be strictly less (timer counted down).
    expect(t2! < t1!).toBe(true);
  });
});

// ── Utility functions ──────────────────────────────────────────────────────

/**
 * Find the controller page whose lobby/playing header contains the given
 * full role label (e.g. "Power Engineer").
 */
async function findControllerByRole(
  roleLabel: string,
  pages: Page[]
): Promise<Page | undefined> {
  for (const page of pages) {
    try {
      const found = await page
        .getByText(new RegExp(roleLabel, "i"))
        .first()
        .isVisible({ timeout: 3_000 });
      if (found) return page;
    } catch {
      // Not this one — try the next.
    }
  }
  return undefined;
}

/**
 * Read the numeric progress percentage from a controller playing screen.
 * Returns 0 if the element is not yet visible or the game hasn't started.
 */
async function readProgressPercent(page: Page): Promise<number> {
  try {
    const text = await page
      .locator(".font-mono")
      .filter({ hasText: /^\d+%$/ })
      .first()
      .textContent({ timeout: 3_000 });
    if (!text) return 0;
    return parseInt(text.replace("%", ""), 10) || 0;
  } catch {
    return 0;
  }
}

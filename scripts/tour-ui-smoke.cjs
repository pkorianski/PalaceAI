// Run after expo export --platform web --output-dir dist-preview.
// CI supplies Playwright; it is not a runtime dependency of PalaceAI.
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve("dist-preview");
const out = path.resolve("screenshots/tour-preview");
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(root, "index.html");
  res.setHeader(
    "Content-Type",
    {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".ttf": "font/ttf",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[path.extname(file)] || "application/octet-stream",
  );
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise((resolve) => server.listen(18081, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PALACE_CHROMIUM_PATH || undefined });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const capture = async (name) => {
      await page.waitForTimeout(450);
      return page.screenshot({ path: path.join(out, name + ".png") });
    };
    const checkMenuBack = async () => {
      const button = page.getByRole("button", { name: "Back", exact: true });
      await button.waitFor();
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.y >= 0, "Menu Back has a visible 44-point target");
      assert.equal(await page.getByRole("button", { name: "Back", exact: true }).count(), 1, "One shared Back control, without a duplicate native header");
    };
    // Verify the real root overlay in both accessibility modes before gameplay.
    const normal = await browser.newContext({
      viewport: { width: 320, height: 693 },
      reducedMotion: "no-preference",
    });
    const launch = await normal.newPage();
    launch.on("pageerror", (error) => errors.push(error.message));
    await launch.goto("http://127.0.0.1:18081", { waitUntil: "domcontentloaded" });
    await launch.getByRole("button", { name: "Skip studio intro" }).waitFor();
    await launch.getByTestId("studio-intro").waitFor({ state: "hidden", timeout: 3000 });
    await launch.getByRole("button", { name: "Continue Palace Tour" }).click();
    await launch.getByRole("button", { name: /^Joey, Two Times\./ }).waitFor();
    assert.equal(await launch.getByTestId("studio-intro").count(), 0, "Navigation must not replay the intro");
    await launch.reload({ waitUntil: "domcontentloaded" });
    await launch.getByRole("button", { name: "Skip studio intro" }).click();
    assert.equal(await launch.getByTestId("studio-intro").count(), 0, "Skip dismisses immediately");
    await launch.getByRole("button", { name: /^Joey, Two Times\./ }).waitFor();
    await normal.close();

    await page.goto("http://127.0.0.1:18081", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Skip studio intro" }).waitFor();
    await page.getByText("KORI", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, "00-studio-intro.png") });
    await page.getByTestId("studio-intro").waitFor({ state: "hidden", timeout: 3000 });
    await page
      .getByRole("button", { name: "Continue Palace Tour" })
      .waitFor({ timeout: 30000 });
    await capture("01-home");
    await page.getByRole("button", { name: "Statistics", exact: true }).click();
    await page.getByRole("heading", { name: "Statistics", exact: true }).waitFor();
    await checkMenuBack(); await capture("27-back-statistics");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Quick Play", exact: true }).waitFor();
    await page.getByRole("button", { name: "Achievements and mastery", exact: true }).click();
    await page.getByRole("tab", { name: "Mastery", exact: true }).waitFor();
    await checkMenuBack(); await capture("28-back-progress");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "How to Play", exact: true }).click();
    await page.getByRole("heading", { name: "How to Play", exact: true }).waitFor();
    await checkMenuBack(); await capture("29-back-rules");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    // A direct route has no app screen to return to, so Back falls back to Home.
    const direct = await browser.newContext({ viewport: {width:390,height:844}, reducedMotion:"reduce" });
    const entry = await direct.newPage();
    await entry.goto("http://127.0.0.1:18081/stats");
    await entry.getByTestId("studio-intro").waitFor({state:"hidden"});
    await entry.getByTestId("menu-back").click();
    await entry.getByRole("button", {name:"Quick Play",exact:true}).waitFor();
    assert.equal(new URL(entry.url()).pathname,"/", "Direct-entry Back falls back to Home");
    await direct.close();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const haptics = page.getByRole("switch", { name: "Haptics", exact: true });
    await haptics.waitFor();
    await checkMenuBack();
    await capture("09-settings");
    await haptics.click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("palace_preferences_v1"))?.haptics === false);
    await page.getByRole("switch", { name: "Reduce motion", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("palace_preferences_v1"))?.reduceMotion === true);
    await page.reload();
    await page.getByTestId("studio-intro").waitFor({ state: "hidden", timeout: 3000 });
    assert.equal(await haptics.isChecked(), false, "Haptics preference survives reload");
    assert.equal(await page.getByRole("switch", { name: "Reduce motion", exact: true }).isChecked(), true);
    // A real storage write failure must not show a saved toggle value.
    await page.evaluate(() => {
      window.__originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === "palace_preferences_v1") throw new Error("QA disk failure");
        return window.__originalSetItem.call(this, key, value);
      };
    });
    await haptics.click();
    await page.getByText("That change could not save.", { exact: false }).waitFor();
    assert.equal(await haptics.isChecked(), false);
    await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; });
    await page.getByRole("button", { name: "Retry settings", exact: true }).click();
    await page.getByRole("button", { name: "Learn Palace", exact: true }).click();
    await page.getByText("Build your palace.", { exact: true }).waitFor();
    await checkMenuBack();
    await capture("10-guide");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Back to settings", exact: true }).click();
    // Web exports lazy route chunks; native exports bundle all these screens.
    // Load each web screen before testing its offline content/navigation.
    await page.getByRole("button", { name: "Privacy policy", exact: true }).click();
    await page.getByText("Your game. Your device.", { exact: true }).waitFor();
    await context.setOffline(true);
    await checkMenuBack();
    await capture("11-privacy");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("switch", { name: "Haptics", exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/settings", "Privacy returns to Settings, not Home");
    await context.setOffline(false);
    await page.getByRole("button", { name: "Help & support", exact: true }).click();
    await page.getByText("Need a hand?", { exact: true }).waitFor();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Email support", exact: true }).waitFor();
    await checkMenuBack();
    await capture("12-support");
    await context.setOffline(false);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Continue Palace Tour" }).click();
    await page.getByRole("button", { name: /^Joey, Two Times\./ }).waitFor();
    await checkMenuBack();
    await capture("02-map");
    await page.getByRole("button", { name: /^Joey, Two Times\./ }).click();
    await page
      .getByRole("button", { name: "Take your seat", exact: true })
      .waitFor();
    await capture("03-rival");
    await page
      .getByRole("button", { name: "Take your seat", exact: true })
      .click();
    await page.getByText("Confirm Palace (0/3)", { exact: true }).waitFor();
    await capture("04-game");
    const before = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("palace_tour_v1")),
    );
    assert.ok(before.active.game);
    await page.reload();
    await page.getByText("Confirm Palace (0/3)", { exact: true }).waitFor();
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("palace_tour_v1")),
    );
    assert.deepEqual(
      after.active.game,
      before.active.game,
      "Reload should resume the same deal",
    );
    await page.goto("http://127.0.0.1:18081/tour");
    await page.getByRole("tab", { name: "Trophy room", exact: true }).click();
    await page.getByText("A room for legends.", { exact: true }).waitFor();
    await capture("05-cabinet");
    await page
      .getByRole("tab", { name: "Weekly circuit", exact: true })
      .click();
    await page.getByText("THE WEEKLY SOLO CIRCUIT", { exact: false }).waitFor();
    await capture("06-circuit");
    // Explicit QA fixture: exercise result rendering and idempotent award.
    await page.evaluate(() => {
      const c = JSON.parse(localStorage.getItem("palace_tour_v1"));
      c.active.game.phase = "game_over";
      c.active.game.winner = "human";
      localStorage.setItem("palace_tour_v1", JSON.stringify(c));
    });
    await page.goto("http://127.0.0.1:18081/tour-match");
    await page.getByText("A title to your name.", { exact: true }).waitFor();
    await capture("07-victory-fixture");
    const result = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("palace_tour_v1")),
    );
    assert.equal(result.trophies["quarter-joey"], 1);
    assert.equal(result.receipts.length, 1);
    assert.equal(result.active, null);
    await page
      .getByRole("button", { name: "Back to the tour", exact: true })
      .click();
    await page.getByRole("tab", { name: "Trophy room", exact: true }).click();
    await capture("08-earned-trophy");
    // Explicit veteran migration fixture; never presented as real earned play.
    await page.evaluate(() => {
      localStorage.setItem("palace_stats", JSON.stringify({ wins: 100, losses: 150, gamesPlayed: 250, winStreak: 0, bestStreak: 5, totalBurns: 600, bestWinTurns: 20, comebackWins: 20, cleanWins: 30, maxBurnsInGame: 8 }));
      localStorage.setItem("palace_achievements", JSON.stringify(["wins_bronze", "wins_silver", "wins_gold"]));
      localStorage.removeItem("palace_mastery_v1");
    });
    await page.goto("http://127.0.0.1:18081/achievements");
    await page.getByRole("tab", { name: "Mastery", exact: true }).waitFor();
    await page.getByText("The long game", { exact: true }).waitFor();
    await capture("14-mastery-migration-fixture");
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem("palace_mastery_v1")));
    assert.equal(migrated.stats.wins, 100);
    assert.equal(migrated.stats.gamesPlayed, 250);
    assert.deepEqual(migrated.days, []);
    assert.equal(migrated.weekly.games, 0);
    await page.getByRole("tab", { name: "Weekly quests", exact: true }).click();
    await page.getByText("A fresh week. A lasting mark.", { exact: true }).waitFor();
    await capture("15-weekly-quests-fixture");
    await page.getByRole("tab", { name: "Starter badges", exact: true }).click();
    await page.getByText("The original collection.", { exact: true }).waitFor();
    await page.getByText("First Victory", { exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("palace_achievements"))), ["wins_bronze", "wins_silver", "wins_gold"]);
    await page.getByRole("tab", { name: "Rewards", exact: true }).click();
    await page.getByRole("button", { name: "Equip The Regular", exact: true }).click();
    await page.getByRole("button", { name: "The Regular equipped", exact: true }).waitFor();
    await page.getByRole("button", { name: "Equip Midnight Ink", exact: true }).click();
    await page.getByRole("button", { name: "Midnight Ink equipped", exact: true }).waitFor();
    await capture("16-rewards-fixture");
    await page.goto("http://127.0.0.1:18081/game");
    await page.getByText("The Regular", { exact: true }).waitFor();
    await page.getByText("Confirm Palace (0/3)", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("game-table").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(16, 26, 48)");
    await capture("17-equipped-table-fixture");
    const savedMastery = await page.evaluate(() => localStorage.getItem("palace_mastery_v1"));
    await page.evaluate(() => localStorage.setItem("palace_mastery_v1", '{"version":999}'));
    await page.goto("http://127.0.0.1:18081/achievements");
    await page.getByText("Your progress could not load.", { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("palace_mastery_v1")), '{"version":999}');
    await page.evaluate(raw => localStorage.setItem("palace_mastery_v1", raw), savedMastery);
    await page.getByRole("button", { name: "Retry progress", exact: true }).click();
    await page.getByText("The long game", { exact: true }).waitFor();
    await page.goto("http://127.0.0.1:18081");
    await page.getByTestId("studio-intro").waitFor({ state: "hidden", timeout: 3000 });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.evaluate(() => localStorage.setItem("unrelated_qa", "keep"));
    const savedTour = await page.evaluate(() => localStorage.getItem("palace_tour_v1"));
    await page.getByRole("button", { name: "Reset game progress", exact: true }).click();
    await capture("13-reset-confirmation");
    await page.getByRole("button", { name: "Keep my progress", exact: true }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("palace_tour_v1")), savedTour, "Cancel preserves the save");
    await page.getByRole("button", { name: "Reset game progress", exact: true }).click();
    await page.getByRole("button", { name: "Erase game progress", exact: true }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
    const resetState = await page.evaluate(() => ({
      tour: localStorage.getItem("palace_tour_v1"),
      stats: localStorage.getItem("palace_stats"),
      achievements: localStorage.getItem("palace_achievements"),
      tutorial: localStorage.getItem("palace_tutorial_done"),
      preferences: JSON.parse(localStorage.getItem("palace_preferences_v1")),
      unrelated: localStorage.getItem("unrelated_qa"),
      mastery: JSON.parse(localStorage.getItem("palace_mastery_v1")),
    }));
    assert.equal(resetState.tour, null);
    assert.equal(resetState.stats, null);
    assert.equal(resetState.achievements, null);
    assert.equal(resetState.tutorial, null);
    assert.deepEqual(resetState.preferences, { version: 1, haptics: false, reduceMotion: true });
    assert.equal(resetState.unrelated, "keep");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("palace_mastery_v1"))?.stats.gamesPlayed === 0);
    const clearedMastery = await page.evaluate(() => JSON.parse(localStorage.getItem("palace_mastery_v1")));
    assert.equal(clearedMastery.xp, 0);
    assert.deepEqual(clearedMastery.seals, []);
    assert.deepEqual(clearedMastery.receipts, []);
    assert.deepEqual(errors, [], "No uncaught browser errors");
    fs.writeFileSync(
      path.join(out, "README.txt"),
      "Phone-sized Chromium web captures (390x844), not Expo Go device screenshots.\n07 uses a completed-round QA fixture. 14–17 use an explicitly seeded veteran migration/equipment fixture. These are not claimed human playthroughs.\nAssertions: navigation, identical saved deal on reload, exactly one trophy award, cabinet, and no uncaught JS errors.\n",
    );
    console.log("Tour browser smoke passed; screenshots:", out);
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

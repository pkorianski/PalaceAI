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
    browser = await chromium.launch({ headless: true });
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
    await page.getByText("KORIANSKI", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, "00-studio-intro.png") });
    await page.getByTestId("studio-intro").waitFor({ state: "hidden", timeout: 3000 });
    await page
      .getByRole("button", { name: "Continue Palace Tour" })
      .waitFor({ timeout: 30000 });
    await capture("01-home");
    await page.getByRole("button", { name: "Continue Palace Tour" }).click();
    await page.getByRole("button", { name: /^Joey, Two Times\./ }).waitFor();
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
    assert.deepEqual(errors, [], "No uncaught browser errors");
    fs.writeFileSync(
      path.join(out, "README.txt"),
      "Phone-sized Chromium web captures (390x844), not Expo Go device screenshots.\n07 uses a completed-round QA fixture; it is not a claimed human playthrough.\nAssertions: navigation, identical saved deal on reload, exactly one trophy award, cabinet, and no uncaught JS errors.\n",
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

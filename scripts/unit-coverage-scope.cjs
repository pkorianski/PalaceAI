const path = require("node:path");
// Explicit, stable scope for executable game/progress logic; UI/native adapters remain in the all-app report.
const CORE_FILES = [
  "lib/palace-engine.ts",
  "lib/game-presentation.ts",
  "lib/daily-progress.ts",
  "lib/player-storage-queue.ts",
  "lib/preferences-model.ts",
  "lib/mastery/model.ts",
  "lib/mastery/repository.ts",
  "lib/tour/model.ts",
  "lib/tour/ai.ts",
];
function filesFrom(summary) {
  return Object.fromEntries(
    Object.entries(summary)
      .filter(([name]) => name !== "total")
      .map(([name, value]) => [
        path
          .relative(path.resolve(__dirname, ".."), name)
          .split(path.sep)
          .join("/"),
        value,
      ]),
  );
}
function aggregate(files, names = Object.keys(files)) {
  const out = {};
  for (const metric of ["lines", "branches"]) {
    let total = 0,
      covered = 0;
    for (const name of names) {
      if (!files[name])
        throw Error(`Missing production coverage file: ${name}`);
      total += files[name][metric].total;
      covered += files[name][metric].covered;
    }
    out[metric] = {
      covered,
      total,
      pct: total ? Math.floor((covered / total) * 10000) / 100 : 100,
    };
  }
  return out;
}
module.exports = { CORE_FILES, filesFrom, aggregate };

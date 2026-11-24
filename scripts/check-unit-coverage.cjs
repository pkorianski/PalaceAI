const fs = require("node:fs"),
  path = require("node:path");
const {
  CORE_FILES,
  filesFrom,
  aggregate,
} = require("./unit-coverage-scope.cjs");
const input = process.argv[2] || "coverage/coverage-summary.json";
const core = aggregate(
  filesFrom(JSON.parse(fs.readFileSync(path.resolve(input), "utf8"))),
  CORE_FILES,
);
for (const [metric, minimum] of [
  ["lines", 95],
  ["branches", 90],
]) {
  console.log(
    `Critical logic ${metric}: ${core[metric].pct}% (minimum ${minimum}%)`,
  );
  if (core[metric].pct < minimum) process.exitCode = 1;
}

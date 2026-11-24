// Exercise process isolation and timezone assumptions; no retries of failing tests.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
const count = Number(process.argv[2] ?? 10);
if (!Number.isInteger(count) || count < 1 || count > 100)
  throw Error("Use an integer run count from 1 to 100");
const files = fs
  .readdirSync(path.join(root, "tests"))
  .filter((n) => /\.test\.(ts|cjs)$/.test(n))
  .sort()
  .map((n) => `tests/${n}`);
const zones = ["UTC", "America/New_York", "Pacific/Auckland"];
for (let i = 0; i < count; i++) {
  const zone = zones[i % zones.length],
    concurrency = i % 2 ? 4 : 1;
  const r = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--test",
      `--test-concurrency=${concurrency}`,
      ...files,
    ],
    { cwd: root, env: { ...process.env, TZ: zone }, encoding: "utf8" },
  );
  if (r.error) throw r.error;
  if (r.status !== 0) {
    process.stderr.write((r.stdout || "") + (r.stderr || ""));
    process.exit(r.status || 1);
  }
  const tests = r.stdout.match(/(?:ℹ|#) tests (\d+)/)?.[1] ?? "all";
  console.log(
    `Run ${i + 1}/${count}: ${tests} tests passed; TZ=${zone}; file concurrency=${concurrency}`,
  );
}

const fs = require("node:fs");
const path = require("node:path");
const {
  CORE_FILES,
  filesFrom,
  aggregate,
} = require("./unit-coverage-scope.cjs");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "coverage");
const before = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs/testing/unit-coverage-baseline.json"),
    "utf8",
  ),
);
const current = filesFrom(
  JSON.parse(fs.readFileSync(path.join(out, "coverage-summary.json"), "utf8")),
);
const testsXml = fs.readFileSync(path.join(out, "unit-tests.xml"), "utf8");
const testCount = [...testsXml.matchAll(/<testcase(?:\s|>)/g)].length;
const scopes = {
  "Whole app": () => true,
  "Critical logic": (n) => CORE_FILES.includes(n),
  "UI routes and components": (n) =>
    n.startsWith("app/") || n.startsWith("components/"),
  "All library modules": (n) => n.startsWith("lib/"),
};
const summary = Object.fromEntries(
  Object.entries(scopes).map(([label, matches]) => [
    label,
    {
      before: aggregate(
        before.files,
        Object.keys(before.files).filter(matches),
      ),
      after: aggregate(current, Object.keys(current).filter(matches)),
    },
  ]),
);
const comparison = {
  schemaVersion: 1,
  baselineCommit: before.sourceCommit,
  baselineTests: before.testCount,
  tests: testCount,
  node: process.version,
  c8: require("c8/package.json").version,
  scopes: summary,
  files: Object.fromEntries(
    [...new Set([...Object.keys(before.files), ...Object.keys(current)])]
      .sort()
      .map((n) => [n, { before: before.files[n], after: current[n] }]),
  ),
};
fs.writeFileSync(
  path.join(out, "comparison.json"),
  JSON.stringify(comparison, null, 2) + "\n",
);
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const metric = (m) => `${m.pct.toFixed(2)}%`;
const cell = (m) =>
  m ? `<td title="${m.covered} / ${m.total}">${metric(m)}</td>` : "<td>—</td>";
const rows = Object.entries(comparison.files)
  .map(
    ([name, s]) =>
      `<tr data-file="${escape(name)}"><td>${escape(name)}${s.after?.lines.covered === 0 ? ' <span class="badge">Untested</span>' : ""}</td>${cell(s.before?.lines)}${cell(s.after?.lines)}${cell(s.before?.branches)}${cell(s.after?.branches)}</tr>`,
  )
  .join("\n");
const scopeRows = Object.entries(summary)
  .map(
    ([name, s]) =>
      `<tr><td>${name}</td>${cell(s.before?.lines)}${cell(s.after?.lines)}${cell(s.before?.branches)}${cell(s.after?.branches)}</tr>`,
  )
  .join("\n");
const head =
  "<tr><th>Scope / file</th><th>Lines before</th><th>Lines after</th><th>Branches before</th><th>Branches after</th></tr>";
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Palace unit test coverage</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c1916;color:#e5eee9;font:16px/1.55 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:40px 24px}h1{font-size:36px;line-height:1.15;margin:10px 0 20px}h2{margin:36px 0 12px}p{max-width:920px;color:#c0d1c7}.eyebrow{color:#efc778;letter-spacing:2px;font-size:13px}.notice{padding:20px;background:#263c31;border-left:4px solid #efc778;border-radius:8px}.stats{display:flex;gap:18px;flex-wrap:wrap}.stat{flex:1;min-width:220px;background:#173027;padding:20px;border-radius:12px}.value{font-size:30px;color:#efc778;display:block}.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:11px 13px;text-align:right;border-bottom:1px solid #294338;white-space:nowrap}th:first-child,td:first-child{text-align:left}th{color:#efc778;background:#173027}tr:hover{background:#163026}code{color:#efc778}.badge{color:#f0b9a0;font-size:12px}input{padding:12px;font:inherit;max-width:100%;width:420px;border:1px solid #668776;background:#152a22;color:white;border-radius:8px;margin:8px 0 16px}li{margin:8px 0}.muted{font-size:13px;color:#a3b5a8}a{color:#efc778}</style><main>
<div class="eyebrow">KORI GAMES / PALACE</div><h1>Unit test coverage: before and after</h1>
<p>${before.testCount} existing tests → ${testCount} tests. Baseline source <code>${before.sourceCommit.slice(0, 7)}</code>. Measured with c8 ${comparison.c8}, Node ${process.version}, V8 coverage and tsx source maps.</p>
<div class="notice"><strong>High branch coverage does not mean the UI is covered.</strong> The unit runner does not mount React Native screens. Unloaded files remain at 0% in the report, but V8/c8 cannot enumerate all of their real branches until they execute. Branch totals can change as more paths load. These are runtime block/branch metrics, not condition/MC/DC or browser end-to-end coverage.</div>
<div class="stats"><div class="stat">Critical logic · lines<span class="value">${metric(summary["Critical logic"].before.lines)} → ${metric(summary["Critical logic"].after.lines)}</span></div><div class="stat">Critical logic · branches<span class="value">${metric(summary["Critical logic"].before.branches)} → ${metric(summary["Critical logic"].after.branches)}</span></div><div class="stat">Whole app · lines<span class="value">${metric(summary["Whole app"].before.lines)} → ${metric(summary["Whole app"].after.lines)}</span></div></div>
<h2>Coverage by scope</h2><div class="scroll"><table><thead>${head}</thead><tbody>${scopeRows}</tbody></table></div>
<p>Whole-app scope explicitly includes every production TS/TSX file in <code>app/</code>, <code>components/</code> and <code>lib/</code>, including files never imported by the tests. Tests, helpers, build scripts, declarations, server code and dependencies are outside that client-app scope. TypeScript/JSX mapping and c8's synthesized zero-coverage entries have the usual line-count limitations.</p>
<h2>What the new tests protect</h2><ul><li>Visible play legality, refill order, hand → face-up → face-down transitions, pickup restoration, blind-card holes, reset/burn/win precedence and AI choices.</li><li>All daily-challenge types, success/failure thresholds, overshoot caps, zero-progress receipts and retry protection.</li><li>Corrupt and future saves, stale/duplicate rounds, equipment gates, weekly rollover, circuit completion, migration failures and preservation of original saves.</li><li>FIFO writes, blocked writes, duplicate concurrent settlement, read/write failures and queue recovery.</li></ul>
<h2>Flakiness controls</h2><p>Fixed card fixtures, seeded deals and injected AI randomness; explicit UTC timestamps and scoped clock mocks for defaults; isolated in-memory storage; promise gates instead of sleep-based assertions. Existing browser timing tests are separate. Ten local suite runs passed across UTC, America/New_York and Pacific/Auckland, alternating serial and four-worker file execution. This is evidence of stability, not a guarantee.</p>
<h2>Remaining gaps</h2><ul><li><strong>React Native screens/components:</strong> no component unit tests yet. Existing Playwright flows test real browser navigation separately, without being included in unit percentages.</li><li><strong>Native adapters:</strong> AsyncStorage wrappers, haptics, Linking and network glue remain unit-uncovered. The storage repository is tested through an injected memory adapter; that is not proof of native disk integration.</li><li><strong>Unreachable/defensive code:</strong> the Quick Play AI's single-card fallback follows a failed same-rank group legality check and is unreachable for valid cards. No fabricated inputs or ignore directives were used to cover it.</li></ul>
<h2>Per-file line and branch coverage</h2><label for="filter">Filter files</label><br><input id="filter" placeholder="e.g. palace-engine or components/"><div class="scroll"><table><thead>${head}</thead><tbody id="files">${rows}</tbody></table></div>
<h2>Reproduce</h2><p><code>npm ci</code><br><code>npm run test:coverage</code><br><code>npm run test:stability -- 10</code></p><p>Coverage CI requires at least 95% lines and 90% branches in the explicitly listed nine critical logic modules. The full-app report stays unfiltered; a passing critical-logic gate is not a whole-app threshold. See <code>scripts/unit-coverage-scope.cjs</code> for that exact list.</p><p>For annotated source and missed paths, open the accompanying c8 <a href="index.html">HTML coverage report</a> from the complete downloaded ZIP. This summary itself is standalone.</p><p class="muted">Counts are visible on hover. Baseline and current data, LCOV and annotated HTML are included in the report archive.</p></main><script>document.getElementById('filter').addEventListener('input',function(){const value=this.value.toLowerCase();document.querySelectorAll('#files tr').forEach(row=>row.hidden=!row.dataset.file.toLowerCase().includes(value));});</script></html>`;
fs.writeFileSync(path.join(out, "Palace-Unit-Test-Coverage.html"), html);
console.log(
  `Built coverage/Palace-Unit-Test-Coverage.html for ${testCount} tests`,
);

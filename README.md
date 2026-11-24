# PalaceAI

Single-player Palace, built with Expo SDK 58. The game runs locally on the
phone; no backend or API environment variables are needed.

## Test from your iPhone

Open this repository/PR branch in your existing Codespace. Stop the previous
Metro process (Ctrl-C), then run:

```sh
npm run phone
```

This installs the committed dependency versions, and starts
Expo Go mode with a tunnel. The Metro cache is retained so restarts stay faster. Open the new `exp://` link
in Expo Go. Keep the terminal running. If Expo asks for authentication, use the
same Expo account in the terminal and Expo Go. From an iPhone-only Codespace,
use `npx expo login --no-browser` to avoid a localhost browser callback. Use the current App Store Expo Go supporting SDK 58, as shown on the device. Older SDK 57 projects cannot open in that client.

For later restarts without reinstalling, use `npm run start:tunnel`.

## Palace Tour (#9)

Home now includes the Tour alongside Quick Play. Four illustrated locations
contain 16 rivals and 48 Bronze/Silver/Gold mastery titles. Bronze is one match,
Silver best-of-three and Gold best-of-five. Defeat the three local rivals to
challenge a champion. The next chapter requires that championship plus six
mastery trophies in the previous chapter. Silver and Gold rematches count.

Tour deals and series scores resume automatically. Leaving a match saves it;
explicitly abandoning a series clears only that series. Trophies never regress.
Championship wins unlock card/table themes in the Trophy room. Weekly Circuit
unlocks at three trophies, rotates AI rivals, and awards permanent weekly ribbons
at six, twelve and eighteen wins. It is local solo competition, not multiplayer
or an online leaderboard. Weekly runs reset on Monday at 00:00 UTC.

All content is local and has no paid-service dependencies. Progress lives on the
current device, separately from existing stats; deleting app data removes it.
See [the build plan](docs/PALACE_TOUR_PLAN.md) for architecture and expansion.

For this release, test on iPhone: Quick Play still works; start Joey's Bronze
challenge; leave and resume the same deal; finish a series; check the Trophy room;
try locked tiers/locations; earn and equip a championship theme. Phone-sized browser previews are captured by GitHub Actions under the
`palace-tour-phone-previews` artifact. The victory image uses a labeled QA fixture.
Native visual/interaction QA remains required; browser previews are not device screenshots.

## SDK 58 upgrade (#7)

The iPhone now reports that its installed Expo Go supports SDK 58 only. The app
and all Expo-managed native dependencies are upgraded together to SDK 58.
React Native is 0.88.1 and React is 19.3.0; the committed lockfile makes installs
reproducible. Node 22.13+ on the 22 line, 24.3+ on the 24 line, or 26+ is required.
Codespaces and CI already use Node 22.

The SDK 57 CLI patch is removed: SDK 58's upstream forwarded-header parser
handles proxy protocol lists and normalizes exp/exps to HTTP/HTTPS. Regression
tests retain coverage of those inputs, alongside Palace rules/setup/burns.
The SDK migration preserved gameplay. Tour additions are described above. The prior app.json removals of
`newArchEnabled` and `splash` remain intact.

### Update an existing Codespace on main

Stop Metro (Ctrl-C), then:

```sh
git pull --ff-only && npm run phone
```

If a local deletion of the lockfile prevents installation, restore only that
generated file from the fetched main branch:

```sh
git fetch origin && git restore --source=origin/main -- package-lock.json && npm run phone
```

Physical iPhone verification is still required: open Home, start a game, select
palace cards, play through human/AI turns, then restart. A successful Doctor or
bundle cannot certify native startup. If Expo Go still exits, retain its version
and the matching iOS Analytics `.ips` crash report before changing dependencies.

Validation:

```sh
npm ci
npm test
npm run typecheck
npx expo install --check
npm run doctor
npx expo export --platform ios
```

References:
- [SDK 58 release notes](https://expo.dev/changelog/sdk-58)
- [Expo Go login requirements](https://expo.dev/changelog/expo-go-57-login)

### Unit coverage

Run `npm run test:coverage` for line/branch coverage and a before/after HTML report in `coverage/`. Run `npm run test:stability -- 10` to repeat tests across time zones and worker counts. See [coverage scope, results and remaining gaps](docs/testing/UNIT_TEST_COVERAGE.md). CI publishes annotated coverage and enforces a minimum for the explicitly scoped critical logic modules.

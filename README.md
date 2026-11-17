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
Expo Go mode with a tunnel and cleared Metro cache. Open the new `exp://` link
in Expo Go. Keep the terminal running. If Expo asks for authentication, use the
same Expo account in the terminal and Expo Go. Use the current App Store Expo Go supporting SDK 58, as shown on the device. Older SDK 57 projects cannot open in that client.

For later restarts without reinstalling, use `npm run start:tunnel`.

## SDK 58 upgrade (#7)

The iPhone now reports that its installed Expo Go supports SDK 58 only. The app
and all Expo-managed native dependencies are upgraded together to SDK 58.
React Native is 0.88.1 and React is 19.3.0; the committed lockfile makes installs
reproducible. Node 22.13+ on the 22 line, 24.3+ on the 24 line, or 26+ is required.
Codespaces and CI already use Node 22.

The SDK 57 CLI patch is removed: SDK 58's upstream forwarded-header parser
handles proxy protocol lists and normalizes exp/exps to HTTP/HTTPS. Regression
tests retain coverage of those inputs, alongside Palace rules/setup/burns.
No gameplay or screen source files changed. The prior app.json removals of
`newArchEnabled` and `splash` remain intact.

### Update an existing Codespace on main

Stop Metro (Ctrl-C), then:

```sh
git pull --rebase --autostash && npm run phone
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

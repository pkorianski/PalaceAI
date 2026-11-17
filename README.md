# PalaceAI

Single-player Palace, built with Expo SDK 57. The game runs locally on the
phone; no backend or API environment variables are needed.

## Test from your iPhone

Open this repository/PR branch in your existing Codespace. Stop the previous
Metro process (Ctrl-C), then run:

```sh
npm run phone
```

This installs the committed dependency versions, applies the CLI fix, and starts
Expo Go mode with a tunnel and cleared Metro cache. Open the new `exp://` link
in Expo Go. Keep the terminal running. If Expo asks for authentication, use the
same Expo account in the terminal and Expo Go. Use an SDK-57-compatible Expo Go;
57.0.5 has a known Worklets crash fixed in 57.0.6. Do not downgrade Reanimated
or Worklets to accommodate that old client.

For later restarts without reinstalling, use `npm run start:tunnel`.

## Startup investigation (#5)

Confirmed in this checkout:

- The previous lockfile still resolved Expo 54 / React Native 0.81 despite
  package.json declaring SDK 57 / React Native 0.86. `npm ci` failed. The lockfile
  is now regenerated, and CI/Codespaces use `npm ci` to prevent silent drift.
- Expo CLI 57.0.34 passes `x-forwarded-proto` verbatim into bundle URL construction.
  A proxy chain supplying `https, http` creates `https, http://host/...`.
  Asset resolution then executes `bundleUrl.match(/^https?:\/\/.*?\//)[0]`,
  reproducing both reported warnings exactly. The malformed launch URL can also
  prevent the native client from loading the bundle even when Metro bundles it.
- The postinstall patch selects the first forwarded protocol and accepts only
  HTTP/HTTPS. It fixes the manifest source, rather than hiding the warning or
  deleting artwork. Normal HTTP/HTTPS requests keep their existing behavior.
- The PNG assets decode successfully. The user's removal of `newArchEnabled`
  and the legacy `splash` block is reflected in app.json. No game/UI logic changed.
- Removed the unused direct SDK-54 `@react-native/virtualized-lists` dependency;
  React Native supplies its matching version.

The original phone's request headers and native crash report are unavailable.
The proxy failure is reproduced and fixed, but it is **not yet proven** to be
that device's only crash cause. Doctor and a successful bundle cannot certify
native startup. Physical iPhone verification remains required: open Home,
start a game, select palace cards, play through human/AI turns, then restart.
If Expo Go still exits, retain its installed version and the matching iOS
Analytics `.ips` crash report before making further dependency changes.

Patch maintenance: `patches/expo++@expo+cli+57.0.34.patch` is applied automatically
by the existing patch-package postinstall. Revalidate it when upgrading Expo CLI;
remove it when upstream handles proxy protocol lists. Do not ignore patch errors.

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
- [Expo Go Worklets mismatch, fixed in 57.0.6](https://github.com/expo/expo/issues/48390)
- [Expo Go login requirements](https://expo.dev/changelog/expo-go-57-login)

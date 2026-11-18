# Palace iOS release

## What this change prepares

Settings, persisted haptics/reduced-motion preferences, the replayable visual guide, accessible card names, safe modal dismissal, AI pause while backgrounded or in a game menu, local-data reset, offline privacy/support screens, public policy/support URLs, native permission cleanup, production EAS configuration and store copy.

Preserved: Quick Play/Tour rules, local Tour saves and trophies, existing artwork, the larger Ignition intro, and removal of `newArchEnabled`/legacy `splash` config. Quick Play is intentionally a fresh deal when reopened; only Tour resumes a saved match. There is no account, advertising, multiplayer, purchase, push notification, cloud sync or online leaderboard.

## First TestFlight build from your iPhone

Use the existing Codespace terminal where Expo is already signed in. Stop Metro with Ctrl+C, update main, then:

```sh
git pull --ff-only
npm ci
npm run ios:testflight
```

The command validates the app, then asks Expo to create a signed store build and upload it to TestFlight. EAS runs the macOS/Xcode build in the cloud; a local Mac is not required. This is not a claim that an IPA has already been built or uploaded.

One-time prerequisites that cannot be supplied by source code:

1. An active paid Apple Developer Program membership and accepted Apple agreements.
2. Expo CLI access to your own `pkorianski` account. If needed, `npx expo login --no-browser` avoids the phone-to-Codespace localhost callback problem.
3. Follow EAS prompts to link/create the Expo project and let EAS manage your Apple signing credentials. Enter credentials only in the official CLI flow, not in chat or Git files.
4. Create/select the Palace App Store Connect app using `com.palace.cardgame`. Use your actual legal account/team. Supply its numeric Apple ID when prompted for submission.
5. Persist the generated `expo.extra.eas.projectId` and set `submit.production.ios.ascAppId` in `eas.json` after the first setup. These are identifiers, not secrets. Do not invent an ID.

The repository deliberately contains no invented Expo project, Apple app ID, team ID, certificate or credentials. `production` is a Release/store profile, with remote build numbers and automatic increments; `simulator` is a separate unsigned simulator profile. No dev-client dependency is required. Expo Go's icon/build version and native permissions are not proof of the standalone app's behavior.

If upload must be retried after a successful build:

```sh
npm run ios:submit
```

Uploads appear in App Store Connect/TestFlight after Apple processing. Add an internal test group first. External testers may require Beta App Review. Uploading a build does not publish the app to the App Store.

## Later builds without typing commands

After initial project/signing/submission setup, add an Expo personal access token as the GitHub Actions `EXPO_TOKEN` secret (never commit it). The manually triggered **Queue iOS TestFlight build** workflow checks that the project and App Store app IDs exist, validates the app, then queues EAS Build with automatic submission. No build is triggered on every push and no paid service upgrade is configured. The workflow reports queue success; EAS/Apple build and processing status must still be checked.

Cloud builds use the existing Expo account's quota and billing settings. Apple membership is separate from ChatGPT/Expo. Do not enable automatic paid quota upgrades without deciding to do so.

## Verified locally / in CI

Run `npm run release:check`, web/iOS production exports, and the browser startup/Tour/settings smoke test. Browser offline checks cover already-loaded web routes, because web exports load route chunks on demand. The iOS export bundles these screens; a true offline cold launch remains a signed-device test. Native generation uses `npx expo prebuild --platform ios --no-install`; generated `ios/` remains ignored for managed Expo builds. Generated Info.plist has no sensitive `*UsageDescription` keys after unused location/image-picker modules are removed. The manifest declares no tracking/data collection, plus required API reasons from the included React Native, Expo and AsyncStorage privacy manifests. This is a source/generated-project inspection, not a signed-IPA privacy certification. Recheck the archive and Apple's processing report.

Public URLs:

- Privacy: https://github.com/pkorianski/PalaceAI/blob/main/docs/PRIVACY.md
- Support: https://github.com/pkorianski/PalaceAI/blob/main/docs/SUPPORT.md
- Contact: pkorianski.engr@gmail.com (existing public portfolio contact).

Policy source is `lib/release-content.ts`. Run `npm run website:build` after policy edits to regenerate the public Markdown and optional standalone HTML. The HTML under `website/palace` is source for future hosting; the working release URLs above are the rendered public GitHub pages. The portfolio repository is not writable through the current integration.

## Before inviting external testers

- Install the signed build on an actual iPhone. Cold launch, force-quit/resume Tour, background during an AI turn, airplane mode, and update from the previous TestFlight build without losing trophies.
- Check the smallest supported iPhone, large text, VoiceOver card labels/order, device Reduce Motion, Settings preferences after relaunch, and Cancel on destructive reset.
- In Settings, verify Privacy and Support links, email handoff and fallback address. Reset a disposable test profile, never your only useful save.
- Check the actual native archive's privacy report and permission output. Resolve App Store Connect privacy warnings before external release.
- Complete export compliance, current age/content questionnaire, review contact info and agreements in App Store Connect. Draft app privacy answer is no app data collected based on the current offline code/SDK audit; verify against the actual binary and current Apple definitions before attesting.
- Use real, current native screenshots from this release. Browser QA captures are development evidence, not App Store device screenshots. Do not claim accessibility features without testing them.

## Store release

Copy is in `docs/APP_STORE_COPY.md`. Confirm app-name availability, legal seller details, categories, current screenshot sizes and pricing/territories. App Review needs no demo login: all gameplay is available offline. Submit for review only after TestFlight device validation. Choose a release method in App Store Connect; nothing in this repository automatically releases a reviewed build.

References: [Expo iOS submission](https://docs.expo.dev/submit/ios/), [EAS configuration](https://docs.expo.dev/eas/json/), [Expo privacy manifests](https://docs.expo.dev/guides/apple-privacy/), [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).

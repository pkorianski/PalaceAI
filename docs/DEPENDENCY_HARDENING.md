# Dependency hardening — November 24, 2026

Task: address npm ci deprecations and 15 audit findings without breaking the Expo SDK or phone workflow.
Acceptance criteria: retain Expo SDK 58 alignment and existing game behavior; eliminate reported vulnerabilities; verify clean installation, coverage, native/web bundling and the consumers of security overrides; document any remaining warnings.

## Audit result

Original: 15 findings (12 moderate, 3 high). After a fresh `npm ci`: **0 vulnerabilities** across the complete dependency graph, including development dependencies. The audit passes at the low-severity threshold. Three obsolete-package deprecation warnings are removed; the ESLint warning below remains.

## Changes

- Remove unused database scaffolding (`drizzle.config.ts`, `shared/schema.ts`, `server/storage.ts`, `db:push`) and its Drizzle/PostgreSQL/Zod dependencies. Neither the app nor the server's empty route registrar imports this scaffolding. The game continues to use local AsyncStorage; existing Express/static-server commands remain supported.
- Add esbuild as an explicit development dependency for the existing `server:build` command; previously it worked only through Drizzle's transitive installation. Allow its exact locked version's binary installation script for npm versions that require explicit install-script approval.
- Refresh React Hooks' Zod/validation-error transitive dependencies within their declared supported ranges. This removes the high-severity Zod finding and fixes the old `zod-validation-error/v4` resolution crash when starting lint.
- Pin scoped security overrides: ngrok → uuid 11.1.1 (CommonJS with the v4 API ngrok uses); Expo fingerprint → minimatch 11.0.9; test-exclude → glob 14.0.6 and minimatch 11.0.9. Old minimatch 3 consumers are deliberately untouched: a global minimatch override would break older APIs such as `makeRe`.
- Run dependency audit and actual consumer compatibility checks in CI. Coverage continues to exercise the file enumeration used by c8; the additional check generates a real Expo iOS fingerprint. Tunnel checks verify module loading and the CommonJS v4 interface, without opening a live internet tunnel.

## Remaining deprecation warning

ESLint 9.39.5 is end-of-life. ESLint 10 is current, but Expo SDK 58's `eslint-plugin-react` and `eslint-plugin-import` dependencies declare peer support only through ESLint 9. There are documented runtime failures with ESLint 10. Keep this explicit development-tool limitation until the Expo lint stack supports a coordinated update. Do not force installation, suppress npm warnings or disable peer validation merely to remove the message.

The linter can now run and exposes 34 errors and 3 warnings in existing app/component code, primarily React Hooks/Compiler rules around animation refs. This task does not change those components or claim a clean lint run. Lint rule cleanup remains separate from dependency remediation.

`npm fund` is informational. npm's own upgrade notice concerns the developer's installed npm version, not an app dependency; no global npm change is required by this patch.

## Reproduce

```sh
npm ci
npm run audit:dependencies
npm run check:dependency-tooling
npm run test:coverage
npm run typecheck
npx expo install --check
npm run server:build
npx expo export --platform ios --output-dir /tmp/palace-ios-export
npx expo export --platform web --output-dir /tmp/palace-web-export
```

`check:dependency-tooling` is an integration smoke check for the overrides, not a game unit test. It has no live service dependency and does not assert a fixed fingerprint hash.

Source verification does not replace installing the simulator build or physical iPhone testing. The npm dependency graph also does not certify native CocoaPods or globally installed EAS tools.

## References

- [ESLint support policy](https://eslint.org/version-support/)
- [Expo ESLint 10 compatibility report](https://github.com/expo/expo/issues/46717)
- [UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [Minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [Glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
- [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [Expo fingerprint API](https://docs.expo.dev/versions/latest/sdk/fingerprint/)

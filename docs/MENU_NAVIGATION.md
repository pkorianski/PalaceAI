# Consistent menu Back control

Task: standardize menu navigation on the Tour's rounded green button with a white arrow.

Acceptance criteria:
- Tour, Achievements/Progress, Statistics, How to Play, Settings, Learn Palace, Help & support, and Privacy policy share one MenuHeader component.
- Every header uses the same arrow, color, 44x44-point target, hit slop, horizontal position and spacing. Titles wrap with larger text.
- Back uses the previous app screen when present. Direct entry without a prior screen falls back to Home. Nested Settings pages return to Settings.
- Remove duplicate native headers from Statistics and Achievements and apply safe-area padding once. Preserve screen contents, screen animations, game exit confirmations and persistence.

Validation: TypeScript, Expo dependency alignment and model tests. Browser regression checks exercise each menu header, size and uniqueness; Statistics and Progress return Home, Privacy returns Settings offline, and direct Statistics entry has a Home fallback. CI artifacts include actual phone-size captures of the different screens for visual review. Native iOS gestures and VoiceOver remain real-device checks.

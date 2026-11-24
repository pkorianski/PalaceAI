import { mkdirSync, writeFileSync } from "node:fs";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED, SUPPORT_EMAIL } from "../lib/release-content";
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function page(title: string, description: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#0b201c"><title>${escape(title)} · Palace · Kori Games</title><link rel="stylesheet" href="../style.css"></head>
<body><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="../support/" aria-label="Kori Games support"><svg width="32" height="36" viewBox="0 0 88 96" aria-hidden="true"><path d="M23 84V11M23 49L68 9M23 49L65 84" fill="none" stroke="#c0ffe9" stroke-width="14" stroke-linecap="round"/></svg><span>KORI <small>GAMES</small></span></a><nav aria-label="Main"><a href="../support/">Support</a><a href="../privacy/">Privacy</a></nav></header><main id="main"><p class="eyebrow">PALACE · THE CARD GAME</p><h1>${escape(title)}</h1><p class="intro">${escape(description)}</p>${content}</main><footer>Palace by Kori Games · <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></footer></body></html>\n`;
}
mkdirSync("website/palace/privacy", { recursive: true });
mkdirSync("website/palace/support", { recursive: true });
writeFileSync("website/palace/privacy/index.html", page("Privacy policy", "Your game. Your device.", `<p class="updated">Updated ${PRIVACY_UPDATED}</p>${PRIVACY_SECTIONS.map(s => `<section><h2>${escape(s.title)}</h2><p>${escape(s.body)}</p></section>`).join("\n")}<section><h2>Contact and privacy requests</h2><p>Email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> with privacy questions or requests to delete support correspondence.</p><p><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub’s privacy statement</a></p></section>`));
writeFileSync("website/palace/support/index.html", page("Need a hand?", "Help, feedback and support for Palace.", `<section class="contact"><h2>Contact Kori Games</h2><p>Questions, feedback, or a hand that didn’t play right? Email us and tell us what happened.</p><a class="button" href="mailto:${SUPPORT_EMAIL}?subject=Palace%20support">Email support</a><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p><p>Include your device model, app version, what happened and the steps that led to it. Screenshots help. Please do not send passwords or sensitive information.</p></section><section><h2>Where is my progress saved?</h2><p>Your Tour, trophies, starter badges, mastery XP, weekly quests and seals, statistics and preferences are stored locally on your device. Tour can resume your saved deal. Quick Play starts a fresh deal when reopened. Cloud sync and cross-device restore are not available. Deleting the app or choosing Reset game progress removes local progress; we cannot recover it.</p></section><section><h2>Can I play offline?</h2><p>The installed App Store/TestFlight app can play offline. Support email and external websites need an internet connection. Expo Go used during development also needs the development server.</p></section><section><h2>Are these online opponents?</h2><p>No. Quick Play, Tour rivals and the weekly circuit all use local computer opponents. The weekly circuit refreshes on Mondays at 00:00 UTC. Multiplayer is not included.</p></section><section><h2>How do I turn off vibrations or animation?</h2><p>Open Settings from the home screen. Turn Haptics off, or enable Reduce motion. Your device’s Reduce Motion setting is always respected.</p></section><section><h2>Privacy and deletion</h2><p>See our <a href="../privacy/">privacy policy</a> for local data controls, backup information and support correspondence deletion.</p></section>`));
writeFileSync("docs/PRIVACY.md", `# Palace privacy policy

Updated ${PRIVACY_UPDATED}

${PRIVACY_SECTIONS.map(s => `## ${s.title}\n\n${s.body}`).join("\n\n")}

## Contact

[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})

[GitHub privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) · [Palace support](SUPPORT.md)
`);
console.log("Generated matching in-app, public Markdown and optional standalone privacy pages.");

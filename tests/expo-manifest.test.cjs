const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const cliRoot = path.dirname(require.resolve('@expo/cli/package.json', {
  paths: [path.dirname(require.resolve('expo/package.json'))],
}));
const { ExpoGoManifestHandlerMiddleware } = require(path.join(cliRoot,
  'build/src/start/server/middleware/ExpoGoManifestHandlerMiddleware.js'));

for (const [header, expected] of [
  [undefined, undefined], ['http', 'http'], ['https', 'https'],
  ['https, http', 'https'], [' HTTPS , http', 'https'],
  [['https', 'http'], 'https'], ['exp', undefined], ['', undefined],
]) {
  test(`manifest protocol ${JSON.stringify(header)} -> ${expected}`, () => {
    const headers = { host: 'example.exp.direct', 'expo-platform': 'ios',
      accept: 'application/expo+json' };
    if (header !== undefined) headers['x-forwarded-proto'] = header;
    const result = ExpoGoManifestHandlerMiddleware.prototype.getParsedHeaders({ headers, url: "/" });
    assert.equal(result.protocol, expected);
  });
}

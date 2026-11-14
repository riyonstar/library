// Web Push 用の VAPID 鍵ペアを作ります。  実行: node generate-vapid.mjs
// ・公開鍵(PUBLIC) → config.js の VAPID_PUBLIC_KEY と、wrangler.toml の VAPID_PUBLIC_KEY に書く(公開してOK)
// ・秘密鍵(PRIVATE) → 絶対にコミットしない。 `npx wrangler secret put VAPID_PRIVATE_KEY` で Cloudflare に登録する
import { generateKeyPairSync } from 'node:crypto';

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = privateKey.export({ format: 'jwk' });
const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url');

console.log('VAPID_PUBLIC_KEY  (公開してOK) :', pub);
console.log('VAPID_PRIVATE_KEY (秘密・非公開):', jwk.d);
console.log('\n※ 秘密鍵はこの画面以外に保存・共有しないでください(GitHubに載せない)。');

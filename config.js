/* アプリ設定(公開されても問題ない値だけを書くこと。APIキー・秘密鍵は絶対に書かない)
 *
 * BACKEND_URL     : Cloudflare Worker(worker.js)のURL。例 "https://kita-library.<あなた>.workers.dev"
 *                   空のままなら「モックモード」(仮データ)で動きます。
 * VAPID_PUBLIC_KEY: Web Push用の「公開鍵」(generate-vapid.mjs で作成)。公開鍵なので書いてOK。秘密鍵は書かない。
 */
(self.APP_CONFIG = {
  BACKEND_URL: "",
  VAPID_PUBLIC_KEY: "",
  // 画面に表示する図書館データの出典
  ATTRIBUTION: { name: "カーリル図書館API", url: "https://calil.jp/" }
});

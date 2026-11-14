# 図書館の本を探す(北区) — くもんのすいせん図書 在架チェッカー

くもんのすいせん図書(2026年度版・650冊)が、北区立中央図書館・東十条図書館で「在架 / 貸出中 / 不明」のどれかを確認し、お気に入りが「貸出中→在架」になったら通知するPWAです。

## いまの状態(重要)

| 項目 | 状態 |
|---|---|
| 画面・検索・お気に入り・状態履歴・変化検知・アプリ内通知 | ✅ 完成(`index.html` を開くだけで動作) |
| 推薦図書650冊の書誌データ | ✅ 実データ(PDFから抽出) |
| 図書館の在架状況 | 🧪 **現在はモックデータ**(画面に「仮」と常時表示)。実データ接続には下記のバックエンド公開が必要 |
| バックエンド(`worker.js`) | ✅ 実装・単体テスト済み(38件) / ⚠ **実際のカーリルAPI・北区への接続は未検証**(APIキーが必要でこの環境からは試せない) |
| Web Push | ✅ 実装済み / ⚠ 実機(iPhone)での受信は未検証 |

> 「実データ接続」には、あなた側で ①カーリルのAPIキー取得 ②Cloudflare Workersへの公開 が必要です。完了すると、画面のバナーが「モック」から「実データ」に変わります。

## ファイル一覧(すべて同じフォルダ・サブフォルダなし)

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の土台 |
| `style.css` | 本棚デザイン |
| `app.js` | 画面・お気に入り・履歴・変化検知・通知 |
| `config.js` | `BACKEND_URL` と公開鍵(秘密情報は置かない) |
| `books.json` | くもん推薦図書650冊(書名・検索用書名・著者・出版社・レベル) |
| `libraries.json` | 図書館ごとの設定(追加はここに1件足すだけ) |
| `data.js` | 上2つをまとめたもの(`file://`で開けるように。`node build-data.mjs`で再生成) |
| `manifest.json` / `service-worker.js` | PWA(ホーム画面追加・オフライン・Push受信) |
| `icon-*.png` / `apple-touch-icon.png` | アイコン(`make-icons.py`で生成) |
| `worker.js` / `wrangler.toml` | バックエンド(Cloudflare Workers・無料) |
| `generate-vapid.mjs` | Web Push用の鍵作成 |
| `SECRETS.md` | **APIキーの置き場所と設定方法(まず読む)** |
| `check-secrets.mjs` | 秘密情報の直書きチェック |
| `.dev.vars.example` | ローカル用の秘密情報の雛形(実際の `.dev.vars` はコミット禁止) |
| `.github/workflows/deploy-worker.yml` | GitHub Secrets を使ったWorkerの自動デプロイ(GitHubの仕様上このフォルダ必須) |
| `test-worker.mjs` | バックエンドの単体テスト(`node test-worker.mjs`) |

## 使い方
- ホーム: 検索ボックス+4つのメニュー(推薦図書 / 検索 / お気に入り / 図書館)。
- 本の右の ♡ でお気に入り。詳細画面で各館の状態と最終確認時刻、「最新情報を確認」ボタン。
- 在架状況は 🟢在架 / 🔴貸出中 / ⚪不明 をアイコン+文字+枠線の形で表示(色だけに頼りません)。
- 通信失敗は必ず ⚪不明(「情報取得失敗」と原因を表示)。**貸出中と誤表示しません。**

## ローカルで確認
`index.html` をブラウザで開くだけ(モックモード)。

## 実データ取得の仕組み
```
iPhone(GitHub Pages上のPWA) → Cloudflare Worker → カーリル図書館API → 北区立図書館
```
- 北区立図書館の公式サイトにはブラウザから使える公開APIがなく、PWAから直接アクセスするとCORSで拒否される可能性が高いため、**Workerを中継**にします。公式サイトのスクレイピングは行いません。
- 蔵書の照会は、カーリル図書館API(無料・要アプリケーションキー・出典表示あり)を使います。APIキーはWorkerのシークレットにのみ置きます。
- 書名→ISBNは国立国会図書館サーチ(OpenSearch)で解決し、結果はKVに保存。書名・著者・出版社が合う版だけ採用します。
- カーリルの状態の対応: 貸出可→在架 / 貸出中・予約中→貸出中 / 館内のみ・蔵書あり・準備中・休館中・その他・取得失敗→不明。
- 図書館への負荷: 画面からの照会は10分キャッシュ、強制更新でも同じ本は2分に1回まで。定期チェックは毎時1回、お気に入りの本だけ(複数ユーザーでも重複排除)。

### 公開手順(すべて無料枠)
**APIキーの扱いは `SECRETS.md` を参照**(チャット・ファイルには書かず、GitHub Secrets または `wrangler secret put` で登録)。以下は手元コマンドで行う場合の流れです。
1. GitHubにこのフォルダの中身をそのまま置き、Settings → Pages で公開(ブランチのルート)。
2. カーリルのAPIキーを取得(https://calil.jp/doc/api_ref.html )。利用条件も確認してください。
3. `npm i -g wrangler`(または `npx wrangler`)→ `npx wrangler login`
4. `npx wrangler kv namespace create KV` で出たIDを `wrangler.toml` に記入。`ALLOWED_ORIGIN` `BOOKS_URL` `LIBRARIES_URL` `VAPID_SUBJECT` も自分の値に。
5. `node generate-vapid.mjs` で鍵を作成。公開鍵を `wrangler.toml` と `config.js` に、秘密鍵は `npx wrangler secret put VAPID_PRIVATE_KEY` で登録(**コミット禁止**)。
6. `npx wrangler secret put CALIL_APPKEY`
7. `npx wrangler deploy` → 表示されたURLを `config.js` の `BACKEND_URL` に記入して再アップロード。
8. **館名の照合確認(必須)**: `https://<worker>/api/health` を開き、`libraryMatch` で2館の `matchedAlias` が入っているか確認。`null` のままなら、一度検索した後に `learnedLibkeys` に出る実際の館名を `libraries.json` の `calil.libkeys` に追記します。照合できない間は「不明」と表示し、誤って「貸出中」「蔵書なし」とは表示しません。

## お気に入り・履歴・変化検知
- お気に入りは端末の localStorage に保存(`Favorite {bookId, addedAt}`。将来のクラウド同期に備えた形)。
- 確認のたびに「前回の既知状態」を保存。**不明は前回状態を上書きしません**ので、通信失敗を挟んでも誤検知しません。
- 通知は「前回=貸出中 かつ 今回=在架」のときだけ。在架のままなら再通知せず、在架→貸出中→在架でまた通知(ブラウザ上で検証済み)。

## 通知(Web Push)
- 構成: Cron(毎時)→ お気に入りの状態比較 → 貸出中→在架を検知 → Web Push → 端末のService Workerが本文を取得して表示。
- iPhoneは **iOS 16.4以降かつ「ホーム画面に追加」したアプリから**のみ使えます(Safariのタブでは不可)。設定画面でオンにしてください。
- Pushが使えない環境では、アプリを開いたときのアプリ内通知(🔔)になります。
- 追加費用なし(Cloudflare・GitHub Pagesの無料枠)。LINE通知は含めていません。

## 図書館を追加する
`libraries.json` に1件足して `enabled: true` にし、`node build-data.mjs` を実行。赤羽・滝野川・田端は `enabled:false` で登録済みです。

## 未実装・要確認
- 実際のカーリルAPI・北区への接続は、APIキーがなく**未検証**。
- iPhone実機でのPush受信は未検証。
- `libraries.json` の公式URLは暫定(`officialUrlVerified:false`)。北区公式の蔵書検索への直リンクは未設定。
- 北区の利用規約・robots.txtの確認は、調査時の取得結果が得られなかったため**未確認**。公開前にご自身でも確認してください。
- 書名からのISBN特定は、表記ゆれで失敗する本があり得ます(その場合は「不明」)。
- 推薦図書以外の自由検索は、実データ接続後にのみ利用可(NDLサーチ経由)。
- 推薦図書データの一部は、PDFの表記ゆれを手で補正しています。全650冊の目視確認はしていません。

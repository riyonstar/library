# APIキー・秘密情報の置き場所と設定方法

## 原則
- **APIキーをチャット・コード・GitHubのファイルに書かない。** GitHub Pages(フロントエンド)は全部公開されるので、キーは必ずバックエンド(Cloudflare Worker)側にだけ置く。
- ブラウザ(`app.js`)はキーを一切持たず、Worker の `/api/...` を呼ぶだけ。Worker がキーを付けてカーリルへ問い合わせる。

```
iPhone/PWA(キーなし) → Worker(キーを保持) → カーリルAPI
```

## どの値をどこに置くか

| 値 | 秘密? | 置き場所 |
|---|---|---|
| `CALIL_APPKEY`(カーリルのAPIキー) | **秘密** | GitHub Secrets / Cloudflareのシークレット / ローカルは `.dev.vars` |
| `VAPID_PRIVATE_KEY`(Push秘密鍵) | **秘密** | 同上 |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | **秘密** | GitHub Secrets のみ |
| `VAPID_PUBLIC_KEY`(Push公開鍵) | 公開OK | `wrangler.toml` と `config.js` |
| `BACKEND_URL`、`ALLOWED_ORIGIN`、`BOOKS_URL` など | 公開OK | `config.js` / `wrangler.toml` |

## 設定方法A: GitHub Secrets 経由(おすすめ・自動デプロイ)
1. GitHubのリポジトリ → Settings → Secrets and variables → Actions → New repository secret で次の4つを登録(値は画面に直接入力。チャットには貼らない)。
   - `CALIL_APPKEY` / `VAPID_PRIVATE_KEY` / `CLOUDFLARE_API_TOKEN`(権限は「Edit Cloudflare Workers」テンプレート) / `CLOUDFLARE_ACCOUNT_ID`
2. `wrangler.toml` の公開してよい値(KV ID、`ALLOWED_ORIGIN`、`BOOKS_URL`、`LIBRARIES_URL`、`VAPID_PUBLIC_KEY`)を自分の値にする。
3. Actions タブ → `deploy-worker` → Run workflow。実行時に秘密の直書きチェックとテストが走り、通れば Worker をデプロイして2つのシークレットを Cloudflare に登録する。
4. 表示された Worker のURLを `config.js` の `BACKEND_URL` に書いて push。

## 設定方法B: 手元のコマンド(GitHubを使わない)
```
npx wrangler login
npx wrangler secret put CALIL_APPKEY        # 入力プロンプトに貼り付け(履歴に残らない)
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler deploy
```

## ローカルでの試験
`.dev.vars.example` を `.dev.vars` にコピーして値を入れ、`npx wrangler dev`。`.dev.vars` は `.gitignore` 済み。

## 漏えい防止
- push の前に `node check-secrets.mjs`(キーの直書きを検出。Actionsでも自動実行)。
- 万一キーを貼ってしまったら、**カーリルのキーを再発行**し、GitHub Secrets を差し替える(Git履歴からは消えないため、再発行が確実)。
- アプリはキーを localStorage にも保存しない。

## APIキーなしで今できること / キー設定後にできること
- **今できる**: 全画面、検索、お気に入り、履歴・変化検知、アプリ内通知(モックデータ)。バックエンドをデプロイすれば、キー未設定でも書名→ISBN解決と推薦図書以外の検索(NDLサーチ)は動く。在架状況は「⚪不明(APIキー未設定)」と表示し、貸出中とは表示しない。
- **キー設定後**: カーリル経由の実際の在架・貸出中、定期チェック、Web Push通知。設定確認は `https://<worker>/api/health` の `config.calilKey` が `true` になること。

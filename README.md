# AIクリエイターズ・スタジオ 投票アプリ

## セットアップ手順

### 1. Notionデータベースの作成

1. Notionで新しいデータベースを作成
2. 以下のプロパティを追加：
   - **投票者ID** (タイトル)
   - **投票テーマ** (マルチセレクト) 
   - **投票日時** (日付)
   - **投票数** (数値)

### 2. Notion APIの設定

1. [Notion Developers](https://www.notion.so/my-integrations)にアクセス
2. 「New integration」をクリック
3. 必要な情報を入力してインテグレーションを作成
4. 「Internal Integration Token」をコピー

### 3. データベースへのアクセス権限設定

1. Notionで作成したデータベースを開く
2. 右上の「...」メニューから「Connections」を選択
3. 作成したインテグレーションを追加

### 4. 環境変数の設定

1. `.env.example`を`.env`にコピー
```bash
cp .env.example .env
```

2. `.env`ファイルを編集：
```
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
```

※データベースIDは、データベースのURLから取得できます：
`https://www.notion.so/xxxxx?v=yyyyy` の `xxxxx` の部分

### 5. ローカル開発

```bash
# 依存関係のインストール
npm install

# サーバーの起動
node server.js
```

アプリケーションは http://localhost:3000 で起動します。

## Vercelにデプロイ

### 1. Vercelプロジェクトを作成

1. [Vercel](https://vercel.com/)にログイン
2. GitHubリポジトリをインポート
3. プロジェクト設定で以下を確認：
   - Framework Preset: Other
   - Build Command: (空のまま)
   - Output Directory: (空のまま)

### 2. 環境変数をVercelに設定

Vercelのプロジェクト設定で以下の環境変数を追加：

- `NOTION_TOKEN`: NotionのIntegration Token
- `NOTION_DATABASE_ID`: NotionデータベースのID

設定方法：
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 上記の環境変数を追加
3. Production、Preview、Developmentすべてにチェック

### 3. デプロイ

環境変数設定後、自動的にデプロイされます。

## 使い方

1. デプロイされたURLにアクセス
2. 興味のあるテーマを最大2つまで選択
3. 「投票を送信」ボタンをクリック
4. 投票データがNotionデータベースに保存されます
# Notion投票システム セットアップガイド

## 1. Notion データベースIDの取得方法

NotionのデータベースIDは、URLから取得できます。

### URLの形式:
```
https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=xxxxxxxxxxxxxxxxxxxx
                      ↑ここの32文字がデータベースID
```

## 2. .envファイルの作成

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の内容を記入してください：

```env
# Notion API設定
NOTION_TOKEN=あなたのNotion統合トークン
NOTION_DATABASE_ID=あなたのNotionデータベースID

# サーバー設定
PORT=3000
```

## 3. Notion統合トークンの取得方法

1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」をクリック
3. 名前を入力して作成
4. 「内部インテグレーショントークン」をコピー
5. `.env`ファイルの`NOTION_TOKEN=`の後に貼り付け

## 4. データベースへのアクセス権限付与

1. Notionでデータベースページを開く
2. 右上の「...」メニューから「接続」を選択
3. 作成した統合を検索して選択
4. 「確認」をクリック

## 5. 必要なNotionデータベースプロパティ

以下のプロパティがデータベースに設定されている必要があります：

- **投票者ID** (タイトル/Title型)
- **投票テーマ** (マルチセレクト/Multi-select型)
  - 選択肢:
    - AI音楽アーティスト制作
    - Difyでアプリ開発
    - タスク管理をAIで効率化
    - バイブコーディングその３
- **投票日時** (日付/Date型)
- **投票数** (数値/Number型)
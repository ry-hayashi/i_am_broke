# 出費管理アプリ — Expense Manager PWA

月別の支出と資産を管理するモバイルファースト PWA アプリケーション。

## 機能

- **月の管理**: 年月を指定して月を作成。前月の項目を自動引き継ぎ
- **支出項目**: 固定費/変動費の管理、ドラッグ＆ドロップ並べ替え
- **資産チェック**: 現在の資産額と支出合計の差額を表示
- **バックアップ**: JSON形式のエクスポート/インポート（マージのみ）
- **オフライン対応**: Service Worker によるキャッシュ、IndexedDB によるローカルストレージ
- **PWA**: ホーム画面に追加可能、スタンドアロン表示

## 技術スタック

- Next.js 14 + TypeScript
- Tailwind CSS
- IndexedDB (idb ライブラリ)
- Service Worker (手動)

## ローカル開発

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## Render へのデプロイ

### 手順

1. GitHub リポジトリにコードをプッシュ
2. [Render](https://render.com) にログインし、「New Web Service」を選択
3. リポジトリを接続
4. 以下の設定を入力:

| 設定項目 | 値 |
|---|---|
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | 18 以上 |

5. 「Create Web Service」をクリック

### 環境変数（任意）

特に必要な環境変数はありません。データはすべてクライアント側の IndexedDB に保存されます。

### 注意事項

- `next.config.js` で `output: 'standalone'` を設定済み
- `engines.node` は `>=18` を指定済み
- HTTPS は Render が自動で提供（PWA に必要）

## プロジェクト構造

```
expense-app/
├── app/
│   ├── globals.css          # グローバルCSS + Tailwind
│   ├── layout.tsx           # ルートレイアウト + PWAメタタグ
│   └── page.tsx             # メインページ（状態管理）
├── components/
│   ├── ConfirmDialog.tsx    # 削除確認ダイアログ
│   ├── CreateMonthModal.tsx # 月作成モーダル
│   ├── ExpenseRow.tsx       # 支出項目行
│   ├── Modal.tsx            # 汎用モーダル
│   ├── MonthDetail.tsx      # 月詳細画面
│   ├── MonthList.tsx        # 月一覧画面
│   └── Toast.tsx            # トースト通知
├── lib/
│   ├── db.ts                # IndexedDB操作
│   ├── types.ts             # TypeScript型定義
│   └── utils.ts             # ユーティリティ関数
├── public/
│   ├── icons/
│   │   ├── icon-192.png     # PWAアイコン 192x192
│   │   └── icon-512.png     # PWAアイコン 512x512
│   ├── manifest.json        # Web App Manifest
│   └── sw.js                # Service Worker
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── postcss.config.js
```

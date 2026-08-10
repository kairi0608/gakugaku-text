# セキュリティ

- 新規登録で選べるロールは `personal`、`student`、`teacher` のみ。
- `admin` は公開登録のschemaとDB Triggerの許可リストから除外し、管理者専用APIまたは信頼できる初回SQLだけで設定。
- Middleware、ページ/API guard、Postgres RLSの三層で認可。
- 通常ユーザーCRUDはセッション付きSupabase clientを使用。
- OpenAIキーとService Roleはサーバー専用で、画面・レスポンス・クライアントbundleへ含めない。
- Private Storageは `users/<auth.uid()>/...` の所有パスだけを許可。
- 画像UploadはPNG/JPEG/WebP、10MB以下、decode・寸法検査後にWebP再エンコード。
- EXPは完了済みAttemptからサーバー計算し、dedupe keyで二重付与を防止。
- AIキー不足時は503。偽データやサンプルへの切替なし。

`tests/security.test.ts` がmigrationの非破壊性、所有者ポリシー、ロール制限、Private bucket、クライアント秘密値参照を検査します。

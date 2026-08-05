# セキュリティ

新規roleは常にpersonalです。teacher/adminはDB管理操作だけで付与し、profile triggerが自己変更を拒否します。全publicテーブルでRLSを有効化し、owner・所属クラス・担当教師・本人提出に限定します。Action API key、service role、claim secretはサーバー専用です。claim tokenは256bit乱数で、secret付きSHA-256だけをDBに保存し、24時間・一度限りのRPCで処理します。Storage bucketは非公開で、PNG/JPEG/WebP、15MB以下に制限します。アプリ側アップロード処理ではdecode、512〜8192px検査、再エンコード、メタデータ除去を行う前提です。

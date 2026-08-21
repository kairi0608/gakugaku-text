# 地頭塾パイロット版

## 適用

既存Supabaseへ `supabase/migrations/006_jitojuku_pilot.sql` をSQL Editorで1回実行します。既存の002〜005を適用済みであることが前提です。006は既存テーブルをDROP/TRUNCATEせず、Learning Session、日次Mood、教材Review、Special Event、What If参加、画像分類とRLSを追加します。

Vercelには従来どおり次の環境変数が必要です。

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_IMAGE_MODEL`

## 教師確認

1. 教師で教材を生成し、生成直後が「要確認（draft）」になる。
2. Review画面で問題・正答・解説・画像・難易度を確認する。
3. 承認後だけ課題候補へ表示される。
4. 課題公開後に生徒画面へ表示され、固定MaterialVersionを1問ずつ回答できる。
5. What Ifイベントを日時指定または連続ログイン条件で作成できる。

## 生徒確認

1. ログイン後、今日の気分へ回答または「あとで」を選べる。
2. 課題はGAME STARTから1問ずつ進み、終了後にまとめフィードバックが出る。
3. 自主チャレンジは興味・見せ方・3/5/10問を選べる。
4. 自主チャレンジでは回答保存後に次の典型問題が生成される。AI失敗時は明示された安全な定型問題へ切り替わる。
5. What Ifは通常採点と分離され、自由回答、短い応答、参加EXP、履歴が保存される。

## 実サービスE2E

コード品質ゲートだけではSupabase RLS、OpenAI、Storage、メール、ブラウザの実接続を保証できません。Productionとは別の検証環境で教師A/教師B、生徒A/生徒Bを用意し、他者Session・他教師Review・他クラスEventが拒否されること、Private Storage URLが所有権/RLSに従うこと、AI生成失敗時にも回答が残ることを確認してください。

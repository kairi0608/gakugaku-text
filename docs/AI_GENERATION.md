# AI生成

AI機能はすべてサーバーからOpenAI SDKを呼びます。モデル名は `OPENAI_TEXT_MODEL` と `OPENAI_IMAGE_MODEL` で指定し、コードへ固定しません。キーまたはモデルが不足している場合はHTTP 503と設定案内を返し、サンプル教材や偽画像へ切り替えません。

## 教材

`POST /api/materials/generate` は入力をZodで検証し、Responses APIのJSON Schema structured outputで `MaterialDocument` と画像briefを生成します。問題数、学年、教科、単元、ID参照、選択肢、画像参照を再検証してから保存します。画像はImages APIで生成し、sharpでWebPへ正規化し、Private Storageへ保存します。

教材画像の再生成は `POST /api/materials/[id]/assets`、教材本文の改訂は `POST /api/materials/[id]/regenerate` です。どちらもRLSで教材所有者を確認し、新しい教材バージョンを追加します。

## 評価

`POST /api/attempts/[id]/evaluate` はAttemptが参照する教材バージョンから問題、正答、rubric、feedback policyを取得します。クライアントの正答は信用しません。結果は `verdict / score / goodPoint / improvement / hint / modelAnswer` をZod検証し、`revealAnswer=false` なら回答例を返しません。フィードバックは `hub_feedback` に `source=ai` で保存します。

## 画像

用途は教材背景、教材場面、タマゴ、こども、学習パートナー、アプリ背景に限定します。画像内の文字・ロゴ・透かし、既存作品への模倣、怖い表現をpromptで禁止します。生成結果はbase64から直接検証し、外部URLを背景として保存しません。

全生成は `hub_ai_generations` に開始・成功・失敗を記録し、管理画面では状態とエラー種別だけを表示します。APIキー値は表示しません。

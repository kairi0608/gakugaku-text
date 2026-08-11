# アーキテクチャ

Next.js App RouterのServer ComponentsとRoute Handlersを中心に構成します。ブラウザ認証は `@supabase/ssr`、サーバーDB操作はセッション付きSupabase clientとRLSを使います。Service Roleは `/admin` の集計とロール変更に限定します。

教材は `hub_materials` と不変の `hub_material_versions`、回答はAttempt / Answer / Feedback、画像はPrivate Storageとasset metadataへ分けて保存します。課題は `material_version_id` に固定されるため、後から教材を編集しても配布済み内容は変わりません。

AIはサーバー内のProvider層を通し、Zod/JSON Schema検証、sharp画像正規化、Storage保存、DB保存の順で処理します。キー不足時は明示的に停止し、固定サンプルへ切り替えません。

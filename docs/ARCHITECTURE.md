# アーキテクチャ

Next.js App RouterのServer ComponentとRoute Handlerだけが`lib/supabase/admin.ts`を通じてSupabaseへ接続します。service role keyはサーバー専用です。ブラウザは教材生成・回答APIを呼びますが、DBキーを受け取りません。教材内容は不変の`hub_material_versions`へ保存され、教材は現在版IDを参照します。

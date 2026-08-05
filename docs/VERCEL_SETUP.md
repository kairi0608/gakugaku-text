# Vercelセットアップ

GitHubへpushしてVercelでImportし、Framework PresetをNext.js、Install Commandを`pnpm install --frozen-lockfile`にします。`.env.example`の全値をPreview/Productionごとに登録し、Productionでは実URLを設定します。Supabase Authにも両環境のcallback URLを追加します。PreviewとProductionは秘密値を分け、ログへtokenやclaim URLを出さないでください。

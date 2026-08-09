# Vercelセットアップ

GitHubリポジトリをImportし、Root Directoryを`.`、Framework PresetをNext.js、Install Commandを`pnpm install --frozen-lockfile`、Build Commandを`pnpm build`、Output Directoryを空欄にします。

Environment Variablesへ`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`をProduction/Previewごとに設定します。設定後は新しいDeploymentを作成してください。

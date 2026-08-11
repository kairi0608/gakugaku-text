# ロール認証移行

ロール選択だけだった旧UIは、Supabase Authと `profiles.role` を正本とする構成へ移行済みです。`?from=` は過去リンクとの表示互換だけに残り、認可には使いません。

通常DB処理からService Roleを外し、所有者列とRLSでユーザーを分離しました。003以前の所有者不明行は自動割当せず、管理者監査後に個別移行します。詳細は `AUTH_SETUP.md`、`ROLE_MODEL.md`、`RLS.md` を参照してください。

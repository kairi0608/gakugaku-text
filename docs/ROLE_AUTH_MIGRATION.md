# Role・Auth移行計画

## 現在の位置づけ

`personal`、`student`、`teacher`は、画面と導線を分けるための`ExperienceRole`です。本人確認済みの権限を表す`AuthRole`ではありません。

現在はサーバー側の`createAdminClient()`がSupabase Service Roleを使用しており、`hub_materials`、`hub_attempts`、`hub_characters`などは利用者ごとに分離されていません。したがって、現在のUIだけをデータ保護境界として扱うことはできません。

## 次フェーズのデータモデル

1. Supabase Authを導入し、すべての利用者を認証する。
2. `profiles`テーブルを追加し、Authの`user_id`とアプリプロフィールを関連付ける。
3. `profiles.role`に`personal`、`student`、`teacher`等の認証済みroleを保存する。
4. 教材・キャラクター等へ`owner_id`を追加する。
5. 学習履歴・回答へ`student_id`を追加する。
6. 教材・クラス・課題へ`teacher_id`を追加する。
7. `classroom`と所属関係を表すテーブルを追加する。
8. `assignment`と配布対象・期限・提出状態を表すテーブルを追加する。

## RLS方針

- 生徒は自分に配布された課題、自分の回答・履歴だけを参照できること。
- 教師は担当するクラス、教材、課題、提出だけを参照・更新できること。
- 個人利用者は自分が所有する教材・履歴・キャラクターだけを参照・更新できること。
- Service Roleは管理・バックアップなど必要なサーバー処理だけに限定すること。
- ブラウザからService Roleキーを使用しないこと。

## アプリケーション移行

- Authセッションから`AuthRole`を取得し、現在の`ExperienceRole`判定を置き換える。
- URLの`from`は戻り先の表示目的だけに限定し、アクセス制御には使用しない。
- Server Components、Route Handlers、Supabase RPCのすべてで認証と所有権を検証する。
- クラス・課題・提出ページは、RLSとAPIが完成してからNavigationへ追加する。
- 既存データには移行時に所有者を割り当て、所有者不明データを公開しない。

## 完了判定

- personal、student、teacher間で他者データを読み書きできないテストがある。
- RLSを無効にしなくても主要機能が動作する。
- 認証roleと画面表示が不一致でも、サーバー側で不正アクセスを拒否する。
- クラス所属、課題配布、提出確認が実データで動作する。

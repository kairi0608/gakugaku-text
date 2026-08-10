# キャラクター成長

キャラクター作成時に、structured outputで `CharacterDesign` を生成し、そのデザインからタマゴ画像を実生成します。画像と履歴は `hub_visual_assets` / `hub_character_assets` に保存します。

EXPルールはサーバー固定です。

- 教材完了: +20
- 正解: 1問ごとに +5
- その日の最初の学習: +10

`hub_activity_logs(user_id, dedupe_key)` が一意なので、同じAttemptや同じ日のイベントを再送しても二重付与されません。Levelは `floor(EXP / 100) + 1` です。

成長段階は `egg`（0 EXP）、`child`（100 EXP）、`learning-partner`（300 EXP）です。閾値到達後も画像は自動置換しません。ユーザーが進化画像を生成し、プレビューを確認して適用します。過去画像は削除せず、条件を満たす限り以前の姿へ戻せます。

# データモデル

教材本体は所有権と現在版を持つ`materials`、内容スナップショットを持つ`material_versions`、private Storage参照を持つ`material_assets`から成ります。公開版はtriggerで更新・削除を拒否します。`assignments.material_version_id`と提出回答により、後の教材編集が既存課題へ影響しません。クラス、所属、課題、提出、回答、フィードバック、教師コメントは別テーブルです。外部下書き、Action冪等性、claim tokenも分離しています。

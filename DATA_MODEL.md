# Data model

`materials` は教材の論理ID、`material_versions` は変更不能な版を持ちます。attemptは常に回答時のversionを参照します。画像はDBに相対パスのみ保存します。charactersはstage・level・expを持ち、attemptの`exp_awarded`で重複付与を防ぎます。


# 45P Batch Automatic Censoring — ヴェール

イラスト・実写の対象を検出して、ローカルでモザイク処理するツールです。
最新版のオフライン版は **`veil_offline` フォルダ**にあります。

## Windowsで使う

1. このリポジトリを取得する（GitHubの **Code → Download ZIP**、またはgit clone）。
2. `veil_offline/run.bat` を実行する。Python 3.10以上が必要です。
3. 初回のみ `veil_offline/.venv` にライブラリを導入します。画像処理はこのPC内で行います。

検出モデル2つは `veil_offline/models` に含まれています。起動用ファイルと同じフォルダ構成を維持してください。

## 今回追加した機能

- 輪郭に沿うモザイク：簡易方式（GrabCut）／SAMを選択
- 輪郭の余白調整、検出済み周辺の拡大再検出
- Canvasで検出漏れを囲んで再検出し、見つかった対象だけを処理
- ペン・消しゴム・戻す・範囲クリア・拡大縮小
- 手動修正結果を比較画像・ZIP・指定した保存先へ反映
- SAM vit_bの自動ダウンロードと、モデル種類に応じた自動読み込み

## SAMモデルの入手先

`veil_offline/install_sam.bat` はSAMライブラリと **vit_b** を導入します（Git・ネット接続が必要）。vit_l・vit_hは手動でダウンロードしてください。

| 画面で選ぶ種類 | 公式モデル | ファイル容量の目安 |
| --- | --- | --- |
| `vit_b` | [sam_vit_b_01ec64.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth) | 約375MB |
| `vit_l` | [sam_vit_l_0b3195.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth) | 約1.2GB |
| `vit_h` | [sam_vit_h_4b8939.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth) | 約2.4GB |

ファイル名を変えずに **`veil_offline/models`** に入れ、画面で対応する種類を選びます。パス入力は不要です。対応するのは初代SAMです。

詳しい使い方・GPU設定・モデル配置は [オフライン版README](veil_offline/README.md)、変更点と検証範囲は [UPDATE.md](veil_offline/UPDATE.md) を参照してください。

`artifacts/veil-offline.zip` は従来版のアーカイブです。最新版はこのリポジトリの `veil_offline` を使用してください。

## 検証

```bash
python -m unittest discover -s veil_offline -p "test_*.py" -v
```

25項目の自動テストを実施しています。Canvasの操作再現、Gradioの入力チェックを通した保存・ZIP更新も確認しています。実モデルによる精度の定量評価とWindows実機の確認は未実施です。

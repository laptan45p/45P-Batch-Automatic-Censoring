# ヴェール：オフライン画像モザイクツール

画像をローカルで検出し、モザイクをかけるツールです。輪郭に沿った処理と、検出漏れを囲んで再検出する手動修正に対応します。

## 起動・更新

Windowsでは `run.bat` を実行してください。Python 3.10以上が必要です。初回はこのフォルダの `.venv` に必要なライブラリを導入するため、ネット接続が必要です。

差し替え用ZIPを使用する場合は、現在使っているフォルダへ中身を上書きしてください。検出モデルは差し替え用ZIPに含まれていないため、既存の `models` を引き継ぎます。別の人へ配布するときは検出モデルを追加し、`.venv` は配布先のPCで作成してください。

検出に必要なファイル：

- `models/anime-censor-n.onnx`：イラスト用
- `models/nudenet-320n.onnx`：実写用

## SAMモデルの入手先と配置

SAMは輪郭を切り抜くための追加AIです。簡易方式では不要です。このツールは**初代SAM**の以下3種類に対応します。SAM 2のモデルは使用できません。

最初に `run.bat` で環境を作り、Gitを導入済みの環境で `install_sam.bat` を実行してください。SAMのライブラリに加えて、軽量な **vit_b** モデルを `models` に自動ダウンロードします。**vit_l・vit_hは下のリンクから手動ダウンロード**してください。手動でモデルを入れた場合もSAMのライブラリ導入は必要です。

| 画面で選ぶ種類 | 公式ダウンロード | ファイル容量の目安 |
| --- | --- | --- |
| `vit_b` | [sam_vit_b_01ec64.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth) | 約375MB |
| `vit_l` | [sam_vit_l_0b3195.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth) | 約1.2GB |
| `vit_h` | [sam_vit_h_4b8939.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth) | 約2.4GB |

公式説明：[facebookresearch/segment-anything](https://github.com/facebookresearch/segment-anything)

ダウンロードしたファイルは**名前を変えずに、`app.py` と同じ階層にある `models` フォルダへ入れてください。** 3種類すべてをそろえる必要はありません。

```text
veil-offline/
├─ app.py
├─ run.bat
├─ install_sam.bat
└─ models/
   ├─ anime-censor-n.onnx
   ├─ nudenet-320n.onnx
   ├─ sam_vit_b_01ec64.pth
   ├─ sam_vit_l_0b3195.pth
   └─ sam_vit_h_4b8939.pth
```

例えば、ツールを `F:\veil-offline` に置いている場合、vit_lは `F:\veil-offline\models\sam_vit_l_0b3195.pth` に配置します。

画面で形状を「輪郭」、輪郭抽出方法を「SAM（追加モデル）」にし、入れたファイルに対応するモデル種類を選びます。パスの入力は不要です。

SAMの実行環境はCPUとGPU（CUDA）から選べます。GPUを使用するにはCUDA対応PyTorchが必要です。導入方法は[PyTorch公式](https://pytorch.org/get-started/locally/)で確認してください。対象検出と拡大再検出はCPUで行います。表の容量はモデルファイルの大きさで、必要なRAM・VRAM量とは異なります。

## 手動修正

自動処理の結果から画像を選び、漏れた場所をペンで閉じた線で囲みます。「範囲内を再検出」を選んで「選択した範囲を処理して保存」を押すと、見つかった対象だけにモザイクを追加します。検出されなければ、必要に応じて「範囲全体にかける」へ切り替えられます。

拡大・縮小は＋／−またはCtrl＋ホイールで操作できます。修正後はZIPと指定した保存先にも反映されます。

詳しい変更内容・設定・検証範囲は [UPDATE.md](UPDATE.md) を参照してください。

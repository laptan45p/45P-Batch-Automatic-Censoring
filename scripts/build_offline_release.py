"""Build a distributable ZIP from repository sources and the original ONNX models."""
import argparse
import hashlib
from pathlib import Path
import re
import zipfile

MODEL_HASHES = {
    "anime-censor-n.onnx": "eecc31f441272b11080e6d626303d665c52bfc78",
    "nudenet-320n.onnx": "fd02bc75d0df296784c9da910f1960f852c40352",
}
REQUIRED = {"app.py","engine.py","contour.py","manual.py","canvas_editor.py",
            "canvas_editor.js","download_sam.py","install_sam.bat","run.bat",
            "requirements.txt","README.md","UPDATE.md"}


def git_blob_hash(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def build_package(root, destination, version, model_hashes=None):
    root,destination=Path(root),Path(destination)
    if not re.fullmatch(r"v\d+\.\d+\.\d+",version):
        raise ValueError("Invalid release version")
    source=root/"veil_offline"
    missing=[name for name in sorted(REQUIRED) if not (source/name).is_file()]
    if missing:
        raise FileNotFoundError("Missing application files: " + ", ".join(missing))
    model_hashes=MODEL_HASHES if model_hashes is None else model_hashes
    for name,expected in model_hashes.items():
        data=(source/"models"/name).read_bytes()
        if git_blob_hash(data)!=expected:
            raise ValueError("Original detection model does not match: " + name)
    destination.mkdir(parents=True,exist_ok=True)
    archive=destination/"veil-offline.zip"
    files=sorted(p for p in source.iterdir() if p.is_file() and p.suffix in
                 {".py",".js",".md",".txt",".bat",".sh"})
    files += [source/"models"/name for name in sorted(model_hashes)]
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as zf:
        for path in files:
            relative=Path("veil-offline")/path.relative_to(source)
            if path.suffix==".bat":
                zf.writestr(str(relative),path.read_text(encoding="utf-8").replace("\n","\r\n"))
            else:
                zf.write(path,str(relative))
        zf.writestr("veil-offline/VERSION.txt",version+"\n")
    with zipfile.ZipFile(archive) as zf:
        if zf.testzip() is not None:
            raise RuntimeError("ZIP verification failed")
        for name in model_hashes:
            if git_blob_hash(zf.read("veil-offline/models/"+name))!=model_hashes[name]:
                raise RuntimeError("Packaged model verification failed")
    checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
    (destination/"SHA256SUMS.txt").write_text(checksum+"  veil-offline.zip\n",encoding="ascii")
    return archive


def release_notes(version):
    return f"""# ヴェール {version} — 検出モデル同梱版

**Assetsの `veil-offline.zip` をダウンロードして解凍し、`veil-offline/run.bat` を実行してください。**
GitHubが自動生成するSource codeのZIPではなく、配布用の `veil-offline.zip` を使用できます。

## 必要なもの

- Python 3.10以上（WindowsではAdd python.exe to PATHを有効にしてください）
- 初回起動時のネット接続：このフォルダの `.venv` に必要なライブラリを導入します
- GPUは必須ではありません。通常の検出と簡易輪郭はCPUで動作します

## 同梱内容

- 最新のアプリ本体・Canvas描画コード・起動用ファイル
- 元の検出モデル2つ：`anime-censor-n.onnx`、`nudenet-320n.onnx`
- README・UPDATE.md・SAMモデルの公式ダウンロード案内

SAMの `.pth` モデルは任意のため別途導入します。`install_sam.bat` で追加ライブラリとvit_bを導入できます（Gitが必要）。vit_l・vit_hの入手先はREADMEに記載しています。

## 主な変更

- 輪郭に沿ったモザイク（GrabCut／初代SAM）と余白調整
- Canvasで検出漏れを囲んで再検出し、指定範囲内だけにモザイクを追加
- リアルタイムのペン表示、消しゴム、戻す、拡大縮小
- 手動修正のZIP・保存先への反映、保存と読み直しの不具合修正

25項目の自動テスト、Canvas操作再現、Gradio API経由の保存処理を確認しています。
実際のWindows環境での起動・操作は利用者による確認がありますが、こちらでのWindows実機検証は未実施です。検出は完全ではないため、仕上がりを確認してください。

`SHA256SUMS.txt` は配布ZIPのSHA-256です。検出モデルは元のリポジトリのファイルと一致することを確認して梱包します。
"""


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output",type=Path,default=Path("dist"))
    args=parser.parse_args()
    version=(args.root/"release-version.txt").read_text(encoding="ascii").strip()
    archive=build_package(args.root,args.output,version)
    (args.output/"release-notes.md").write_text(release_notes(version),encoding="utf-8")
    print(f"Built {archive} ({archive.stat().st_size} bytes), {version}")

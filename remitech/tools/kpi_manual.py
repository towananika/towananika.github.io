"""更新ボタン専用。公開済みのデータを取得し、KPIだけを隔離して公開する。"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent


def git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True,
                          capture_output=True, text=True, encoding="utf-8")


def run():
    # 開発中のコミットを一緒にpushしないよう、公開ブランチの一時cloneで記録する。
    remote = git(ROOT, "remote", "get-url", "origin").stdout.strip()
    with tempfile.TemporaryDirectory(prefix="remitech-kpi-") as tmp:
        repo = Path(tmp) / "repo"
        git(ROOT, "clone", "--quiet", "--depth", "1", "--branch", "main", remote, str(repo))
        # remitech/ はリポジトリの中のフォルダ（2026-11-21 から）。clone 側でも同じフォルダを使う
        top = Path(git(ROOT, "rev-parse", "--show-toplevel").stdout.strip()).resolve()
        sub = ROOT.relative_to(top).as_posix() if ROOT != top else ""
        data = repo / sub if sub else repo
        kpi_rel = (sub + "/kpi.json") if sub else "kpi.json"
        for field in ("user.name", "user.email"):
            value = subprocess.run(["git", "config", "--get", field], cwd=ROOT,
                                   capture_output=True, text=True, encoding="utf-8")
            if value.returncode == 0 and value.stdout.strip():
                git(repo, "config", field, value.stdout.strip())
        env = dict(os.environ, PYTHONIOENCODING="utf-8")
        browsers = Path.home() / ".ms-playwright"
        if browsers.is_dir():
            env["PLAYWRIGHT_BROWSERS_PATH"] = str(browsers)
        result = subprocess.run([sys.executable, str(ROOT / "tools" / "kpi_fetch.py"),
                                 "--manual", "--root", str(data)], cwd=repo, env=env,
                                capture_output=True, text=True, encoding="utf-8", timeout=600)
        if result.returncode:
            return False, "KPIを取得できませんでした。以前の記録を保持しています。"
        data = json.loads((data / "kpi.json").read_text(encoding="utf-8"))
        summary = data["refreshSummary"]
        git(repo, "add", kpi_rel)
        git(repo, "commit", "-m", "KPI: update on button request", "--", kpi_rel)
        git(repo, "pull", "--rebase", "origin", "main")
        git(repo, "push", "origin", "HEAD:refs/heads/main")
        return True, "%d件更新・取得できなかった項目 %d件。X・Facebookは手入力です。" % (
            summary["updated"], summary["warnings"])


if __name__ == "__main__":
    print("HUBの更新ボタンから tools/posts_poll.py 経由で実行してください。")

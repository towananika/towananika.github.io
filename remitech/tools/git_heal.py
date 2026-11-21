"""自動タスクの前に、リポジトリを「main の上でふつうに作業できる状態」に戻す（2026-10-26）。

OneDrive が .git/rebase-merge をつかんでいると、pull --rebase の後始末が失敗して
「リベースの途中・ブランチなし（detached HEAD）」のまま残る。その上に自動コミットが積まれ、
pull も push も「You are not currently on a branch」で止まり続けた（10/23〜10/26）。
自動で作るのは posts_check.json・kpi.json だけで、次の実行で取り直せるので、
途中のリベースは捨てて main に戻してよい。消えたコミットは backup/auto-… に残す。
"""
import datetime
import os
import shutil
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 2026-11-21 から remitech/ は towananika.github.io の中のフォルダ。.git は親にあるので git に聞く
def _git_dir():
    r = subprocess.run(["git", "rev-parse", "--absolute-git-dir"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8")
    return r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else os.path.join(ROOT, ".git")


GIT_DIR = _git_dir()


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")


def heal():
    """直したことを文の配列で返す（何もなければ空）"""
    notes = []
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    head = git("rev-parse", "HEAD").stdout.strip()
    for name in ("rebase-merge", "rebase-apply"):
        d = os.path.join(GIT_DIR, name)
        if not os.path.isdir(d):
            continue
        if head:
            git("branch", "backup/auto-" + stamp, head)
        git("rebase", "--abort")
        if os.path.isdir(d):
            # abort でも消えない残りかす（OneDrive のロック）は消す
            shutil.rmtree(d, ignore_errors=True)
        notes.append("heal: 止まっていた %s を片付けた（元の位置は backup/auto-%s）" % (name, stamp))
    if git("symbolic-ref", "-q", "HEAD").returncode != 0:
        head = git("rev-parse", "HEAD").stdout.strip()
        git("branch", "-f", "backup/auto-" + stamp, head)
        c = git("checkout", "main")
        notes.append("heal: ブランチなしだったので main に戻した" + ("" if c.returncode == 0 else "（失敗: " + c.stderr.strip()[-200:] + "）"))
    return notes

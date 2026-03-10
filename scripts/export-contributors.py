#!/usr/bin/env python3
"""
Export git contributors to contributors.json for ff-contributions import.

SETUP
-----
Copy this script to your work folder, e.g.:
  ~/work/contributors.py

Your projects should live as subdirectories in the same folder:
  ~/work/frontendFramework/
  ~/work/prime-live/
  ~/work/cep/
  ...

USAGE
-----
  python3 contributors.py                       # use current directory as git repo
  python3 contributors.py frontend-framework     # use ~/work/frontend-framework/
  python3 contributors.py prime-live
  python3 contributors.py cep

Output is always written to contributors.json next to this script (overwritten each run).
Import that file via the "↑ import data" button in the ff-contributions app.

OPTIONS
-------
  project            Project folder name inside the work directory
  --work-dir PATH    Override the base work directory (default: directory of this script)
"""

import subprocess
import json
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent.resolve()
DEFAULT_OUTPUT = SCRIPT_DIR / "contributors.json"


def run(cmd: list[str], cwd: Path) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL, cwd=cwd)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export git contributors to contributors.json.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "project",
        nargs="?",
        help="Project folder name inside the work directory (default: current directory)",
    )
    parser.add_argument(
        "--work-dir",
        default=str(SCRIPT_DIR),
        metavar="PATH",
        help=f"Base work directory (default: {SCRIPT_DIR})",
    )
    args = parser.parse_args()

    work_dir = Path(args.work_dir).expanduser().resolve()

    if args.project:
        repo_dir = work_dir / args.project
        if not repo_dir.is_dir():
            print(f"error: '{repo_dir}' is not a directory", file=sys.stderr)
            available = [d.name for d in work_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
            if available:
                print(f"  available projects: {', '.join(sorted(available))}", file=sys.stderr)
            sys.exit(1)
    else:
        repo_dir = Path.cwd()

    # Verify it's actually a git repository
    try:
        run(["git", "rev-parse", "--git-dir"], cwd=repo_dir)
    except subprocess.CalledProcessError:
        print(f"error: '{repo_dir}' is not a git repository", file=sys.stderr)
        sys.exit(1)

    print(f"reading  {repo_dir}", file=sys.stderr)

    # ── 1. Commit counts + emails ─────────────────────────────────────────────
    shortlog = run(["git", "shortlog", "-sne", "--all", "--no-merges"], cwd=repo_dir)

    identities: list[dict] = []
    for line in shortlog.strip().splitlines():
        m = re.match(r"^\s*(\d+)\s+(.+?)\s*(?:<([^>]+)>)?\s*$", line)
        if not m:
            continue
        identities.append({
            "name": m.group(2).strip(),
            "email": m.group(3) or None,
            "commits": int(m.group(1)),
        })

    # ── 2. Last commit date per identity ─────────────────────────────────────
    # Use email as the --author filter when available (more precise than name).
    total = len(identities)
    for i, identity in enumerate(identities, 1):
        print(f"  last commit [{i}/{total}] {identity['name']}", file=sys.stderr, end="\r")
        author_filter = identity["email"] or identity["name"]
        try:
            last = run(
                ["git", "log", "--all", f"--author={author_filter}", "-1", "--format=%ai"],
                cwd=repo_dir,
            ).strip()
            if last:
                identity["lastCommit"] = last[:10]  # YYYY-MM-DD only
        except Exception:
            pass
    print(" " * 60, file=sys.stderr, end="\r")  # clear progress line

    # ── 3. Write output ───────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    result = {
        "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "date": now.strftime("%Y-%m-%d"),
        "project": args.project or repo_dir.name,
        "identities": identities,
    }

    DEFAULT_OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✓ {len(identities)} identities → {DEFAULT_OUTPUT}", file=sys.stderr)


if __name__ == "__main__":
    main()

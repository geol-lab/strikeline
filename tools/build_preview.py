"""
build_preview.py — prepares the site for the shared live preview.

The preview host wraps each page in its own <html>/<head>/<body>, so the
entry page is published without those wrappers. Every other file is
published as is, at the same relative path, so links keep working.

Usage:  python3 tools/build_preview.py      → writes dist/index.html
"""

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def strip_wrappers(html: str) -> str:
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
    # Keep the title, stylesheets and scripts; the host supplies charset/viewport.
    keep = [
        line for line in head.splitlines()
        if not re.search(r'<meta (charset|name="viewport")', line)
    ]
    return "\n".join(keep).strip() + "\n" + body.strip() + "\n"


def main() -> None:
    DIST.mkdir(exist_ok=True)
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    (DIST / "index.html").write_text(strip_wrappers(src), encoding="utf-8")
    print("wrote", DIST / "index.html")


if __name__ == "__main__":
    main()

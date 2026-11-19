#!/usr/bin/env python3
"""Freeze the current HTML pages as a browsable archive version.

    python3 tools/archive_version.py v1 "Version 1 (before the Nov 2026 revamp)"

Copies every .html page (except archive/ and tools/) into archive/<label>/,
keeping the folder layout, plus assets/*.css and *.js so the archived look
never changes. Large shared files under assets/files/ are not copied; links
to them are pointed back at the live copy. Each archived page gets a
noindex tag and a banner linking to the current version, and the version is
listed on archive/index.html. Extra files (e.g. a .docx) can be added with
--extra path [path ...].
"""
import argparse, html, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'archive', 'tools', '.git', 'node_modules'}

BANNER = ('<div role="note" style="background:#fff7ed;border-bottom:2px solid #ea580c;'
          'color:#7c2d12;padding:10px 16px;font:600 15px/1.4 system-ui,sans-serif;text-align:center">'
          'Archived page: {title}. Kept for reference and no longer current. '
          '<a href="{current}" style="color:#9a3412">Open the current version</a> · '
          '<a href="{index}" style="color:#9a3412">All versions</a></div>')


def pages():
    for p in sorted(ROOT.rglob('*.html')):
        rel = p.relative_to(ROOT)
        if rel.parts[0] in SKIP:
            continue
        yield rel


def archive(label, title, extras):
    dest = ROOT / 'archive' / label
    if dest.exists():
        raise SystemExit(f'{dest} already exists; versions are never overwritten')
    for rel in pages():
        depth = len(rel.parts) - 1
        up = '../' * (depth + 2)          # from the archived page back to the repo root
        s = (ROOT / rel).read_text(encoding='utf-8')
        s = re.sub(r'((?:href|src)=")((?:\.\./)*)(assets/files/)',
                   lambda m: m.group(1) + '../../' + m.group(2) + m.group(3), s)
        # links to the live archive index point at the archive's own index instead
        s = re.sub(r'((?:href)=")((?:\.\./)*)archive/index\.html"',
                   lambda m: m.group(1) + '../' * (depth + 1) + 'index.html"', s)
        s = s.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1)
        banner = BANNER.format(title=html.escape(title), current=up + rel.as_posix(),
                               index='../' * (depth + 1) + 'index.html')
        s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + banner, s, count=1)
        out = dest / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(s, encoding='utf-8')
    for a in (ROOT / 'assets').glob('*'):
        if a.is_file() and a.suffix in {'.css', '.js'}:
            (dest / 'assets').mkdir(parents=True, exist_ok=True)
            shutil.copy2(a, dest / 'assets' / a.name)
    for e in extras:
        src = ROOT / e
        (dest / e).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest / e)
    write_index(label, title)
    print(f'archived {sum(1 for _ in dest.rglob("*.html"))} pages to {dest.relative_to(ROOT)}')


def write_index(label, title):
    idx = ROOT / 'archive' / 'index.html'
    item = f'  <li><a href="{label}/index.html">{html.escape(title)}</a> <code>{label}</code></li>\n'
    if idx.exists():
        s = idx.read_text(encoding='utf-8').replace('<!-- versions -->\n', '<!-- versions -->\n' + item, 1)
    else:
        s = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
             '<meta name="robots" content="noindex">\n<title>Previous versions</title>\n'
             '<link rel="stylesheet" href="../assets/course.css">\n</head>\n<body>\n<main id="main">\n'
             '<p><a href="../index.html">← Current version</a></p>\n<h1>Previous versions</h1>\n'
             '<p>Frozen copies of the pages as they were before each major change. Newest first.</p>\n'
             '<ul>\n<!-- versions -->\n' + item + '</ul>\n</main>\n</body>\n</html>\n')
    idx.write_text(s, encoding='utf-8')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('label')
    ap.add_argument('title')
    ap.add_argument('--extra', nargs='*', default=[])
    a = ap.parse_args()
    archive(a.label, a.title, a.extra)

#!/usr/bin/env python3
"""
Check the AI 410 student site before you push. Standard library only.

    python3 tools/check_site.py              # every page
    python3 tools/check_site.py --videos     # also confirm each YouTube video still exists (needs network)

Fails (exit 1) if any page:
  - links to a file or #anchor that doesn't exist
  - contains instructor-only content or links to instructor pages
  - misses a basic accessibility requirement (lang, title, alt text, iframe title,
    SVG text alternative, form labels, role="tablist", zoom-blocking viewport)

The full accessibility audit (axe-core in a browser, light and dark, 320px reflow)
is described in README.md.
"""

import argparse
import posixpath
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATTR = re.compile(r'(\b(?:href|src)=")([^"]+)(")')
ID = re.compile(r'\bid="([^"]+)"')

# Text that must never appear on a student page.
FORBIDDEN = [
    (r'class="faculty"', "faculty notes block"),
    (r'>\s*Teaching note\s*<', "instructor teaching note"),
    (r'(teaching-guide|instructor|ac-exemplars|ac-faculty-notes)\.html', "link to an instructor page"),
    (r'AI-410-syllabus[\w-]*\.html', "link to the site syllabus (students get the docx in Brightspace)"),
    (r'bsai-course-design-constraints\.html', "link to internal design constraints"),
    (r'(?:href|src)="https?://(?:localhost|127\.0\.0\.1)', "link to a localhost URL"),
]


def is_external(u):
    return bool(re.match(r"^(?:[a-z][a-z0-9+.-]*:|//)", u, re.I))


def a11y_problems(text):
    """Static accessibility checks (WCAG 2.2 AA basics) that every published page must pass.
    They catch regressions cheaply; the full audit is axe-core in a browser (see README)."""
    out = []
    if not re.search(r'<html[^>]*\blang="[a-z]', text):
        out.append("<html> has no lang attribute")
    if not re.search(r"<title>[^<]+</title>", text):
        out.append("page has no <title>")
    for m in re.finditer(r"<img\b[^>]*>", text):
        if not re.search(r'\balt="', m.group(0)):
            out.append(f"image without alt text: {m.group(0)[:80]}")
    for m in re.finditer(r"<iframe\b[^>]*>", text):
        if not re.search(r'\btitle="[^"]+"', m.group(0)):
            out.append(f"iframe without a title: {m.group(0)[:80]}")
    for m in re.finditer(r"<svg\b[^>]*>", text):
        tag = m.group(0)
        if not re.search(r'\b(aria-label|aria-labelledby|aria-hidden)="', tag) and "<title" not in text[m.end():m.end() + 200]:
            out.append(f"svg without a text alternative (aria-label, <title>, or aria-hidden): {tag[:80]}")
    for m in re.finditer(r'<input\b(?![^>]*type="(?:hidden|checkbox|radio|button|submit)")[^>]*>|<textarea\b[^>]*>|<select\b[^>]*>', text):
        tag = m.group(0)
        idm = re.search(r'\bid="([^"]+)"', tag)
        if re.search(r"\baria-label(?:ledby)?=", tag) or (idm and re.search(rf'<label[^>]*\bfor="{re.escape(idm.group(1))}"', text)):
            continue
        out.append(f"form field without a label: {tag[:80]}")
    if 'role="tablist"' in text:
        out.append('role="tablist" without full tab keyboard support; use a role="group" of aria-pressed buttons')
    if re.search(r"maximum-scale|user-scalable\s*=\s*no", text):
        out.append("viewport blocks zoom")
    return out


YT = re.compile(r"(?:youtube(?:-nocookie)?\.com/(?:watch\?v=|embed/)|youtu\.be/)([\w-]{11})")


def check_videos(sources):
    """A YouTube video that was removed or made private makes oEmbed return an error."""
    import json
    import urllib.error
    import urllib.request
    found = {}
    for src, text in sources.items():
        for vid in YT.findall(text):
            found.setdefault(vid, src)
    problems = []
    for vid, src in sorted(found.items()):
        url = "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + vid
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                title = json.load(r).get("title", "")
            print(f"video ok: {vid} {title}")
        except urllib.error.HTTPError as e:
            problems.append(f"{src}: YouTube video {vid} is unavailable (HTTP {e.code})")
        except OSError as e:
            problems.append(f"{src}: couldn't reach YouTube to check video {vid} ({e})")
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--videos", action="store_true", help="also check YouTube videos (needs network)")
    a = ap.parse_args()
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
    texts = {p.relative_to(ROOT).as_posix(): p.read_text(encoding="utf-8") for p in pages}
    ids = {rel: set(ID.findall(t)) for rel, t in texts.items()}
    errors = []
    for rel, text in texts.items():
        here = posixpath.dirname(rel)
        for pat, why in FORBIDDEN:
            for m in re.finditer(pat, text):
                errors.append(f"{rel}:{text.count(chr(10), 0, m.start()) + 1}: {why}: {m.group(0)!r}")
        for why in a11y_problems(text):
            errors.append(f"{rel}: accessibility: {why}")
        for m in ATTR.finditer(text):
            url = m.group(2)
            if is_external(url) or url.startswith("data:"):
                continue
            path, _, frag = url.partition("#")
            if not path:
                if frag and frag not in ids[rel]:
                    errors.append(f"{rel}: #{frag} has no matching id on this page")
                continue
            target = posixpath.normpath(posixpath.join(here, path.split("?")[0]))
            if target.endswith("/") or (ROOT / target).is_dir():
                target = posixpath.join(target, "index.html")
            if not (ROOT / target).exists():
                errors.append(f"{rel}: link {url!r} -> missing file {target}")
            elif frag and target in ids and frag not in ids[target]:
                errors.append(f"{rel}: link {url!r} -> {target} has no #{frag}")
    if a.videos:
        errors += check_videos(texts)
    if errors:
        print(f"CHECK FAILED: {len(errors)} problem(s)", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        sys.exit(1)
    print(f"OK: {len(pages)} pages")


if __name__ == "__main__":
    main()

# AI 410: AI Engineering · student site

The interactive lessons, hands-on guides, simulators and reference pages for **AI 410: AI Engineering** (City University of Seattle, School of Technology & Computing).

**Live site:** https://cityuseattle.github.io/ai410/

Students reach these pages from Brightspace. All graded work is submitted in Brightspace; builds happen in GitHub Codespaces through each module's GitHub Classroom repository.

## What's where

| Path | Page |
|---|---|
| `index.html` | Course home |
| `start-here/accounts.html` | Account & service setup |
| `start-here/tools.html` | Tools you'll use all term |
| `module-N/index.html` | Module N lesson (N = 1–4) |
| `module-N/hos-guide.html` | HOS N (Hands-On Skill) guide |
| `module-N/simulator.html` | Module N simulator |
| `module-N/application-challenge.html` | Application Challenge N |
| `module-5/index.html` | Term Project |
| `reference/` | Concept Companion, starter-code walkthrough, Concept Debate example |
| `assets/` | Shared `course.css` and `course.js`, images |
| `tools/check_site.py` | Pre-push checker |

Starter code lives in the private template repositories `cityuseattle/AI410-HOS01`–`04` and `AI410-AC01`–`04`; students copy them through the Classroom50 invites linked from each lesson. Instructor material (teaching guide, answer keys, example answers) is not in this repository.

## Editing

Every page is a standalone HTML file. Edit it directly, then:

```bash
python3 tools/check_site.py            # links, anchors, accessibility basics, no instructor content
python3 tools/check_site.py --videos   # also confirm embedded YouTube videos still exist
```

Push to `main` and GitHub Pages republishes in a few minutes.

**Brightspace links depend on these paths and `#section` ids.** Don't rename a page or a section `id` without updating the Brightspace links that point to it.

## Conventions

- **Layout:** every page uses the lesson layout: header, hero, sticky section nav, and `section.module.card` blocks. Shared styles are in `assets/course.css`.
- **Accessibility target: WCAG 2.2 AA.**
  - Links use `var(--link)`.
  - Week and module switchers are `role="group"` buttons with `aria-pressed`, not tabs.
  - Scrolling tables, diagrams and `<pre>` get `tabindex="0"`.
  - Inline SVG diagrams need `role="img"` and an `aria-label`.
  - Live updates go through a `.sr-only` `aria-live` element.
  - Smooth scrolling is `html:focus-within` only, so `#section` links from Brightspace land correctly.
- **Videos:** "Watch first" videos must have human captions. Videos with only auto-generated captions are labelled "Optional video", and the notes cover the same material.
- **Free tiers only:** everything runs in GitHub Codespaces on free tiers. Anything that needs a paid key is optional.

### Full accessibility audit (each term)

Run axe-core (WCAG 2.2 AA rules) on every page in light and dark mode with all week panels and `<details>` open. Check that nothing scrolls sideways at 320 px, and that the focus ring is visible when tabbing through a lesson and a simulator.

## License

Course materials: [CC BY 4.0](LICENSE.md), © 2026 Clark Ngo. Third-party videos, screenshots and the CityU name and logo are not covered. Starter code: MIT (in the template repositories).

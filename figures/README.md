# Interactive figures

Lessons can carry an interactive isometric figure that explains a mechanism by drawing it as a machine you step through. Each one is built by a Node script here and written inline into its lesson, between markers:

```html
<!-- anatomy:rag-pipeline (built by figures/rag-pipeline/build.mjs; edit that, not this) -->
…
<!-- /anatomy:rag-pipeline -->
```

Don't edit inside the markers: the next build overwrites them.

| Figure | Lesson | Notes |
|---|---|---|
| `language-model/` | Module 1, Lecture Part 2 | How a model picks the next word: score, softmax with temperature, sample. Adapted from [clarkngo/anatomy-of](https://github.com/clarkngo/anatomy-of). |
| `rag-pipeline/` | Module 2, Lecture Part 3 | Ingest once (chunk, embed, store), then every question (embed, score, top-k, prompt, answer). `model.mjs` reads the documents, tokenizer and cosine straight from `module-2/simulator.html`, so the figure and the simulator always agree. |
| `guardrail/` | Module 3, Lecture Part 2 | Validate, retry with the error, fail to data. AIC 3's `CalculateArgs`, `max_retries` (0–4) and blind vs fed-back retries; the odds panel is the lecture's arithmetic (30% invalid first attempts). |
| `push-chain/` | Module 4, Lecture Part 2 | The six push links as knife switches; the backend's meter reads 200 even when the body says `DeviceNotRegistered`. Scenarios are the Module 4 simulator's. |

## Rebuild

Node 18 or later, no packages.

```bash
node figures/language-model/build.mjs
node figures/rag-pipeline/build.mjs
node figures/guardrail/build.mjs
node figures/push-chain/build.mjs
python3 tools/check_site.py
```

Add `--preview DIR` to also write standalone light and dark preview pages to `DIR` (keep them out of the repo).

## How a figure fits the site

`embed.mjs` is shared by every figure:

- The figure sits in `<div class="iso anatomy-embed">`, and every style is scoped to it.
- Its theme follows the site's toggle: light by default, dark when the reader picks it. The id `fig-<slug>` lets a lesson link to it.
- Keys such as the arrows, `F` (expand) and `Q` only act while focus is inside the figure, so typing elsewhere on the page is never intercepted.
- The parts list is the text alternative: a collapsed **The parts** list under each figure, with a live text readout announced through `aria-live`.

All four figures pass axe-core (WCAG 2.2 AA) in light and dark and reflow at 320 px. Rerun that audit after changing one; see the main README.

## Credits

Drawn with the Anatomy kit, vendored in `kit/` under the MIT license (see `kit/LICENSE`). The figures' own code is MIT, like the rest of the site's code; their text is CC BY 4.0 with the course materials.

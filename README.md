# BacSelect

**Bacterial genome diversity, at the scale you need.**

BacSelect is a developing resource for deterministic selection of compact bacterial genome panels that span genome architecture without hand-picking organisms by name, clinical importance or expected tool performance.

This repository hosts the BacSelect website at <https://bacselect.github.io/>.

## Current status

The site is an intentionally labelled development preview. The interface and deployment scaffold are ready; the general N-selector and first independent BacSelect source universe have not yet been frozen or released.

The initial design grew from Project Finch Experiment 0, whose frozen source analysis contained:

- 55,306 eligible genomes;
- 13,765 species groups; and
- 12 sequence-derived structural features.

These figures are foundation/provenance values, not a BacSelect release.

## Repository structure

```text
.
├── index.html
├── assets/
│   ├── app.js
│   ├── mark.svg
│   └── styles.css
├── data/
│   └── site.json
└── .github/workflows/
    └── pages.yml
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deployment

The `pages.yml` workflow deploys the repository root to GitHub Pages on pushes to `main`. The repository must be named `bacselect.github.io` under the GitHub organisation/user `BacSelect` to resolve at <https://bacselect.github.io/>.

## Scientific boundary

BacSelect is intended to provide identity-blind, deterministic, diversity-seeking selection across bacterial genome architecture. It is not described as an unbiased sample of bacterial life, and no public panel should be produced until the general N-selection specification and validation criteria are frozen.

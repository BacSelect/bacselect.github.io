# BacSelect

**Bacterial genome diversity, at the scale you need.**

BacSelect is a developing resource for deterministic selection of compact bacterial genome panels that span genome architecture without hand-picking organisms by name, clinical importance or expected tool performance.

This repository hosts the BacSelect website at <https://bacselect.github.io/>.

## Current status

The site is intentionally labelled as a development preview. The public interface is deployed, while selector-v1 validation is still in progress. No BacSelect panel or independent BacSelect source-universe release has yet been published.

The initial design grew from a practical bacterial-genome benchmarking problem. Its frozen development universe contained:

- 55,306 eligible genomes;
- 13,765 species groups; and
- 12 sequence-derived structural features.

These figures are foundation/provenance values, not a BacSelect release.

## Project context

BacSelect is developed by Rhys White, Genomics & Bioinformatics, PHF Science,
Aotearoa New Zealand.

The resource originated from a practical bacterial-genome selection problem
explored with support from Genomics Aotearoa.

BacSelect is intended to remain free to use. BacSelect-authored code and
website content in this repository are released under the MIT License.
Third-party genome records, including records obtained from INSDC/GenBank,
retain their upstream terms and are not relicensed by BacSelect.

## Licence

BacSelect-authored material in this repository is released under the
[MIT License](LICENSE).

This licence does not change the terms applying to third-party source data.
In particular, BacSelect does not claim ownership of or relicense underlying
INSDC/GenBank genome sequence records.

## Repository structure

```text
.
├── LICENSE
├── README.md
├── index.html
├── assets/
│   ├── app.js
│   ├── mark.svg
│   ├── nearest-distance.svg
│   ├── nested-panels.svg
│   ├── release-change.svg
│   ├── universe-to-panel.svg
│   └── styles.css
├── data/
│   └── site.json
├── docs/
│   ├── product-specification.md
│   └── scientific-specification.md
└── .github/
    └── workflows/
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

BacSelect is intended to provide identity-blind, deterministic, diversity-seeking selection across bacterial genome architecture. It is not described as an unbiased sample of bacterial life. Public panels remain unavailable while the selector and structural-feature schema are under prospective validation.

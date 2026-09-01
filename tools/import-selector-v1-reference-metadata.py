#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path


EXPECTED_SOURCE_COMMIT = (
    "abefc3b70d7fe7e079eeb52b762542dae565edf6"
)

EXPECTED = {
    "selector-v1-reference-metadata-ladder-n500.tsv": (
        "c1b74d0617722a61c5828c690d4ec8e9dbcdd308895a0962506722a1cc3e3c2f",
        210236,
    ),
    "reference-public-metadata-publication.json": (
        "21a171e73a54d4295eeb94821baea8143bfc325ebb7de0137106b3b8f1c0a0e2",
        1542,
    ),
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as handle:
        for block in iter(
            lambda: handle.read(1024 * 1024),
            b"",
        ):
            digest.update(block)

    return digest.hexdigest()


def git_value(
    repo: Path,
    *args: str,
) -> str:
    return subprocess.check_output(
        [
            "git",
            "-C",
            str(repo),
            *args,
        ],
        text=True,
    ).strip()


def main() -> None:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--science-repo",
        type=Path,
        default=Path.home() / "github" / "bacselect",
    )

    parser.add_argument(
        "--website-repo",
        type=Path,
        default=Path.cwd(),
    )

    args = parser.parse_args()

    science = args.science_repo.resolve()
    website = args.website_repo.resolve()

    source = (
        science
        / "validation"
        / "selector-v1"
        / "reference-public-metadata"
    )

    destination = (
        website
        / "data"
        / "reference-v1"
    )

    if git_value(
        science,
        "rev-parse",
        "HEAD",
    ) != EXPECTED_SOURCE_COMMIT:
        raise SystemExit(
            "ERROR | scientific repository HEAD does not match "
            "frozen metadata publication commit"
        )

    if git_value(
        science,
        "rev-parse",
        "origin/main",
    ) != EXPECTED_SOURCE_COMMIT:
        raise SystemExit(
            "ERROR | scientific repository origin/main does not match "
            "frozen metadata publication commit"
        )

    if git_value(
        science,
        "status",
        "--porcelain",
    ):
        raise SystemExit(
            "ERROR | scientific repository is not clean"
        )

    if not source.is_dir():
        raise SystemExit(
            f"ERROR | metadata source directory missing: {source}"
        )

    if not destination.is_dir():
        raise SystemExit(
            f"ERROR | website reference directory missing: {destination}"
        )

    print(
        "===== validate selector-v1 reference metadata publication ====="
    )

    for name, (
        expected_sha,
        expected_bytes,
    ) in EXPECTED.items():
        path = source / name

        if not path.is_file():
            raise SystemExit(
                f"ERROR | missing source artefact: {path}"
            )

        observed_sha = sha256_file(
            path
        )

        observed_bytes = path.stat().st_size

        if observed_sha != expected_sha:
            raise SystemExit(
                f"ERROR | SHA256 mismatch: {name}: {observed_sha}"
            )

        if observed_bytes != expected_bytes:
            raise SystemExit(
                f"ERROR | byte-size mismatch: {name}: {observed_bytes}"
            )

        print(
            f"PASS | {name} | {observed_sha} | "
            f"{observed_bytes} bytes"
        )

    publication = json.loads(
        (
            source
            / "reference-public-metadata-publication.json"
        ).read_text(
            encoding="utf-8"
        )
    )

    required = {
        "panel_identity":
            "selector-v1-reference",
        "monthly_release_assigned":
            False,
        "row_count":
            500,
        "column_count":
            19,
        "metadata_ladder_sha256":
            EXPECTED[
                "selector-v1-reference-metadata-ladder-n500.tsv"
            ][0],
        "generator_git_commit":
            "b1d664c429c5300eadd81709284cd7ee3fb9cb60",
        "selector_execution_git_commit":
            "3ebce24ac4d1c620e9dde8c84f0c92fea9cc9e01",
    }

    for key, expected in required.items():
        if publication.get(
            key
        ) != expected:
            raise SystemExit(
                f"ERROR | publication binding mismatch: {key}"
            )

    for name in EXPECTED:
        target = destination / name

        if target.exists():
            raise SystemExit(
                f"ERROR | refusing overwrite: {target}"
            )

    for name in EXPECTED:
        shutil.copyfile(
            source / name,
            destination / name,
        )

    print()
    print(
        "PASS | selector-v1 reference metadata imported"
    )


if __name__ == "__main__":
    main()

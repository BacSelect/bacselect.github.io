#!/usr/bin/env python3
"""Publish the already-validated BacSelect selector-v1 reference artifacts."""
from __future__ import annotations
import argparse, hashlib, json, os, shutil, sys
from pathlib import Path

DEFAULT_SOURCE = Path(
    "/NGS/scratch/EXT/Rhys_wkdir/bacselect/selector-v1/"
    "official-panel-generation/3ebce24ac4d1c620e9dde8c84f0c92fea9cc9e01"
)

EXPECTED = {
    "panel-content-manifest.tsv": ("f7e8f4c8888ff41d841c0bd373f6334689a00da3385283854c467fe040acb31f", 975),
    "panel-generation-provenance.json": ("97f5c1b7a524e8bb3081a1ab7cb52d96fef38d0a63e86719dc0eb91c81335f36", 1635),
    "panel-generation-summary.json": ("c5d3760cd5190c818348c3caf341bbecb3af514b31e8bfca4742db6ea625dc0f", 757),
    "panel-membership-manifest.tsv": ("9e104c2803304f69b0940dd77bc17bebd036ffef85aaca7c953e98d6cda3bfcd", 478),
    "panel-n10.txt": ("d8b997e50781abffd8f43685997f88241576532185e78fa8050fb1f4ab9e15b2", 160),
    "panel-n20.txt": ("c534e91143aa2f3b544e96be84e10e2ae03505572aff019390f0971beb6fecb9", 320),
    "panel-n50.txt": ("420b046c1fd3b7d23ff51c62e2b91e52b083e0ac38d4f9073f56bbbaf5237a7f", 800),
    "panel-n100.txt": ("8bb68b753a236fd2a0120105c6a340e48529940e36308016029ee264cfd7dd6e", 1600),
    "panel-n200.txt": ("9d12cba38efde77d1c6f062e3c90ccbfa618e2f257ebe8835e0e20551f4ebbd3", 3200),
    "panel-n500.txt": ("9f547080cabc0c6ed8c0b53e279d1dde7c61cd3d4898643335908d983e5a3077", 8000),
    "selector-v1-winning-ladder-n500.tsv": ("8248be8c69ec1433886c55649cdce3149cde17dc11f0f3ac8677c5052f58caf6", 11878),
}

def sha256_file(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()

def main(argv=None) -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--website-root', type=Path, default=Path(__file__).resolve().parents[1])
    args=parser.parse_args(argv)
    source=args.source_root.expanduser().resolve()
    website=args.website_root.expanduser().resolve()
    destination=website/'data/reference-v1'

    if not source.is_dir():
        raise SystemExit(f'ERROR | validated source root not found: {source}')
    if destination.exists():
        raise SystemExit(f'ERROR | destination already exists; refusing overwrite: {destination}')

    print('===== validate frozen selector-v1 reference artifacts =====')
    for name,(expected_sha,expected_bytes) in EXPECTED.items():
        path=source/name
        if not path.is_file(): raise SystemExit(f'ERROR | missing artifact: {path}')
        observed_sha=sha256_file(path); observed_bytes=path.stat().st_size
        if observed_sha != expected_sha: raise SystemExit(f'ERROR | SHA256 mismatch: {name}: {observed_sha}')
        if observed_bytes != expected_bytes: raise SystemExit(f'ERROR | byte-size mismatch: {name}: {observed_bytes}')
        print(f'PASS | {name} | {observed_sha} | {observed_bytes} bytes')

    tmp=website/'data/.reference-v1.tmp'
    if tmp.exists(): raise SystemExit(f'ERROR | temporary destination already exists: {tmp}')
    tmp.mkdir(mode=0o755)
    try:
        for name in sorted(EXPECTED):
            target=tmp/name
            shutil.copyfile(source/name, target)
            os.chmod(target,0o644)
            expected_sha, expected_bytes=EXPECTED[name]
            if sha256_file(target)!=expected_sha or target.stat().st_size!=expected_bytes:
                raise SystemExit(f'ERROR | copied artifact verification failed: {name}')
        publication={
            'schema_version':'bacselect-selector-v1-reference-publication-v1',
            'identity':'selector-v1-reference',
            'monthly_release_assigned':False,
            'selector':'OPS',
            'selector_version':'1.0.0',
            'architecture_schema_version':1,
            'winning_ladder_sha256':'c81d9fd30cda2d49f0f6c81d4bf99dace9fff811c7612036d9265ef90707fa13',
            'content_manifest_sha256':'f7e8f4c8888ff41d841c0bd373f6334689a00da3385283854c467fe040acb31f',
            'completion_evidence_sha256':'c767483ca238e76f5448decc5d7810608cbf3da7642c060e1566ec630141ff53',
            'artifacts':{name:{'sha256':sha,'bytes':size} for name,(sha,size) in sorted(EXPECTED.items())},
        }
        (tmp/'reference-panel-publication.json').write_text(json.dumps(publication,indent=2,sort_keys=True)+'\n',encoding='utf-8')
        os.chmod(tmp/'reference-panel-publication.json',0o644)
        tmp.replace(destination)
    except BaseException:
        if tmp.exists(): shutil.rmtree(tmp)
        raise

    print()
    print('PASS | selector-v1 reference artifacts published into website data/reference-v1')
    print('PASS | no YYYY.MM monthly release identity assigned')
    print(f'website_destination={destination}')
    return 0

if __name__=='__main__':
    raise SystemExit(main())

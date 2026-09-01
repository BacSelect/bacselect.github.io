#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import struct
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = "https://bacselect.github.io/"
EXPECTED_TITLE = "BacSelect | Bacterial genome panel selection"
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def png_size(path: Path) -> tuple[int, int] | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if (
        len(data) < 24
        or data[:8] != b"\x89PNG\r\n\x1a\n"
        or data[12:16] != b"IHDR"
    ):
        return None
    return struct.unpack(">II", data[16:24])


text = (ROOT / "index.html").read_text(encoding="utf-8")

if "noindex" in text.lower():
    fail("index.html contains noindex")
if text.count('<link rel="canonical" href="https://bacselect.github.io/">') != 1:
    fail("expected exactly one canonical homepage URL")
if text.count(f"<title>{EXPECTED_TITLE}</title>") != 1:
    fail("expected exactly one SEO title")
if text.count('<meta name="robots" content="index,follow,max-image-preview:large">') != 1:
    fail("expected exactly one robots meta tag")
if text.count('property="og:url"') != 1:
    fail("expected exactly one og:url")
if text.count('property="og:description"') != 1:
    fail("expected exactly one og:description")
if text.count('name="twitter:card" content="summary_large_image"') != 1:
    fail("expected summary_large_image Twitter card")
if "https://bacselect.github.io/assets/social-card.png" not in text:
    fail("absolute social-card URL missing")

json_blocks = re.findall(
    r'<script\s+type="application/ld\+json">\s*(.*?)\s*</script>',
    text,
    flags=re.S,
)
website_ok = False
for raw in json_blocks:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON-LD: {exc}")
        continue

    candidates: list[object] = []
    if isinstance(payload, dict):
        candidates.append(payload)
        graph = payload.get("@graph")
        if isinstance(graph, list):
            candidates.extend(graph)

    for item in candidates:
        if not isinstance(item, dict):
            continue
        if item.get("@type") == "WebSite":
            if item.get("name") == "BacSelect" and item.get("url") == CANONICAL:
                website_ok = True
if not website_ok:
    fail("valid BacSelect WebSite JSON-LD missing")

if png_size(ROOT / "assets" / "favicon-512.png") != (512, 512):
    fail("assets/favicon-512.png is missing or not 512x512 PNG")
if png_size(ROOT / "assets" / "social-card.png") != (1200, 630):
    fail("assets/social-card.png is missing or not 1200x630 PNG")

robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
if "User-agent: *" not in robots or "Allow: /" not in robots:
    fail("robots.txt does not explicitly allow crawling")
if f"Sitemap: {CANONICAL}sitemap.xml" not in robots:
    fail("robots.txt sitemap declaration missing")

try:
    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = tree.findall("sm:url", ns)
    entries = [
        u.findtext("sm:loc", default="", namespaces=ns)
        for u in urls
    ]
    if entries.count(CANONICAL) != 1:
        fail("expected exactly one canonical homepage in sitemap.xml")
except ET.ParseError as exc:
    fail(f"invalid sitemap.xml: {exc}")

key_path = ROOT / "indexnow-key.txt"
if not key_path.is_file():
    fail("indexnow-key.txt missing")
else:
    key = key_path.read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"[A-Za-z0-9-]{8,128}", key):
        fail("IndexNow key does not match protocol constraints")

if errors:
    print("SEO validation: FAIL", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    raise SystemExit(1)

print("SEO validation: PASS")

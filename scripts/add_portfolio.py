#!/usr/bin/env python3
"""
add_portfolio.py — add photos to the Portfolio page on the JTran Shootz website.

Unlike add_event.py (which replaces an event's photos each time), this script
ADDS to the existing portfolio — run it again later with a new folder of
photos to add more, and the older ones stay put.

USAGE
  python3 scripts/add_portfolio.py /path/to/best/photos

EXAMPLE
  python3 scripts/add_portfolio.py ~/Desktop/portfolio-picks

  This copies and numbers those photos into assets/portfolio/, continuing
  the numbering after whatever's already there, and appends them to
  data/portfolio.json.

AFTER RUNNING
  Upload the new photos (in assets/portfolio/) and the updated
  data/portfolio.json the same way you upload event photos — see README.md.
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
PORTFOLIO_DIR = SITE_ROOT / "assets" / "portfolio"
PORTFOLIO_JSON = SITE_ROOT / "data" / "portfolio.json"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def load_json(path: Path, default):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description="Add photos to the portfolio page.")
    parser.add_argument("photos_folder", help="Path to a folder containing photos to add")
    args = parser.parse_args()

    photos_folder = Path(args.photos_folder).expanduser()
    if not photos_folder.is_dir():
        sys.exit(f"Error: '{photos_folder}' is not a folder.")

    source_photos = sorted(
        [p for p in photos_folder.iterdir() if p.suffix.lower() in VALID_EXTENSIONS],
        key=lambda p: p.name.lower(),
    )

    if not source_photos:
        sys.exit(f"Error: no photos found in '{photos_folder}'. Supported types: {', '.join(sorted(VALID_EXTENSIONS))}")

    PORTFOLIO_DIR.mkdir(parents=True, exist_ok=True)

    existing = load_json(PORTFOLIO_JSON, [])
    start_number = max([p.get("number", 0) for p in existing], default=0) + 1

    new_records = []
    for i, src in enumerate(source_photos, start=start_number):
        ext = src.suffix.lower()
        filename = f"{i:03d}{ext}"
        dest_path = PORTFOLIO_DIR / filename
        shutil.copy2(src, dest_path)
        new_records.append({
            "number": i,
            "file": f"assets/portfolio/{filename}",
        })
        print(f"  [{i:03d}] {src.name} -> {dest_path.relative_to(SITE_ROOT)}")

    combined = existing + new_records
    save_json(PORTFOLIO_JSON, combined)

    print()
    print(f"Done! Added {len(new_records)} photo(s) to the portfolio (total now {len(combined)}).")
    print("Next step: upload the new photos + updated data/portfolio.json to GitHub (see README.md).")


if __name__ == "__main__":
    main()

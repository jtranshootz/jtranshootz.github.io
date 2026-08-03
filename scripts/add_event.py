#!/usr/bin/env python3
"""
add_event.py — add or update an event album on the JTran Shootz website.

WHAT THIS DOES
  1. Copies all photos from a folder you point it to into the site's
     assets/events/<slug>/ folder, renaming them 001.jpg, 002.jpg, etc.
     (this is how each photo gets numbered on the website).
  2. Writes/updates data/events/<slug>.json (the photo list for that album).
  3. Updates data/events.json (the list of albums shown on the Events page).

USAGE
  python3 scripts/add_event.py "Sarah & Mike's Wedding" 2026-07-18 /path/to/photo/folder

  Optional flags:
    --slug my-custom-slug     use a specific URL slug instead of one made from the title
    --cover 3                 use photo number 3 as the album cover (default: 1)

EXAMPLE
  python3 scripts/add_event.py "Nguyen Family Portraits" 2026-08-01 ~/Desktop/nguyen-photos

  This creates:
    assets/events/nguyen-family-portraits/001.jpg, 002.jpg, ...
    data/events/nguyen-family-portraits.json
  and adds an entry for it to data/events.json.

  Run this again with the SAME title/slug and a folder of new photos to
  replace that album's photos (e.g. if you need to fix or re-upload it).

AFTER RUNNING
  Commit and push the changes to GitHub (see README.md) to publish them.
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = SITE_ROOT / "assets" / "events"
DATA_DIR = SITE_ROOT / "data"
EVENTS_JSON = DATA_DIR / "events.json"
EVENTS_DATA_DIR = DATA_DIR / "events"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


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
    parser = argparse.ArgumentParser(description="Add or update an event album.")
    parser.add_argument("title", help="Event title, e.g. \"Sarah & Mike's Wedding\"")
    parser.add_argument("date", help="Event date in YYYY-MM-DD format")
    parser.add_argument("photos_folder", help="Path to a folder containing the event's photos")
    parser.add_argument("--slug", help="Custom URL slug (default: generated from title)")
    parser.add_argument("--cover", type=int, default=1, help="Photo number to use as the album cover (default: 1)")
    args = parser.parse_args()

    photos_folder = Path(args.photos_folder).expanduser()
    if not photos_folder.is_dir():
        sys.exit(f"Error: '{photos_folder}' is not a folder.")

    slug = args.slug or slugify(args.title)
    if not slug:
        sys.exit("Error: could not generate a valid slug from the title. Pass --slug explicitly.")

    try:
        # Validate date format early
        year, month, day = args.date.split("-")
        assert len(year) == 4
    except Exception:
        sys.exit(f"Error: date '{args.date}' must be in YYYY-MM-DD format, e.g. 2026-07-18.")

    source_photos = sorted(
        [p for p in photos_folder.iterdir() if p.suffix.lower() in VALID_EXTENSIONS],
        key=lambda p: p.name.lower(),
    )

    if not source_photos:
        sys.exit(f"Error: no photos found in '{photos_folder}'. Supported types: {', '.join(sorted(VALID_EXTENSIONS))}")

    dest_dir = ASSETS_DIR / slug
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Clear out old numbered files so removed/replaced photos don't linger
    for old_file in dest_dir.glob("*"):
        if old_file.is_file():
            old_file.unlink()

    photo_records = []
    for i, src in enumerate(source_photos, start=1):
        ext = src.suffix.lower()
        filename = f"{i:03d}{ext}"
        dest_path = dest_dir / filename
        shutil.copy2(src, dest_path)
        photo_records.append({
            "number": i,
            "file": f"assets/events/{slug}/{filename}",
        })
        print(f"  [{i:03d}] {src.name} -> {dest_path.relative_to(SITE_ROOT)}")

    # Write per-event JSON
    event_detail = {
        "slug": slug,
        "title": args.title,
        "date": args.date,
        "photos": photo_records,
    }
    save_json(EVENTS_DATA_DIR / f"{slug}.json", event_detail)

    # Update the master events list
    events = load_json(EVENTS_JSON, [])
    cover_index = max(1, min(args.cover, len(photo_records))) - 1
    cover_path = photo_records[cover_index]["file"]

    existing = next((e for e in events if e.get("slug") == slug), None)
    entry = {
        "slug": slug,
        "title": args.title,
        "date": args.date,
        "cover": cover_path,
        "count": len(photo_records),
    }
    if existing:
        events[events.index(existing)] = entry
    else:
        events.append(entry)

    save_json(EVENTS_JSON, events)

    print()
    print(f"Done! Added {len(photo_records)} photo(s) to album '{args.title}' ({slug}).")
    print("Next step: commit and push to GitHub to publish (see README.md).")


if __name__ == "__main__":
    main()

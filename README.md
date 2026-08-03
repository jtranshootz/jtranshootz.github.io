# JTran Shootz Photography — Website

A simple, free photography website with a home page, About section, Contact
section, and an Events section where each event gets its own numbered photo
album with a click-to-fullscreen viewer.

There's no backend and no monthly cost — it's a set of plain HTML/CSS/JS
files, hosted for free on **GitHub Pages**.

---

## 1. Try it locally first

Because the pages load photo data with JavaScript, you can't just
double-click `index.html` — browsers block that for security reasons. Run a
tiny local server instead (one line, nothing to install if you have Python):

```
cd jtran-shootz-site
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser. Press `Ctrl+C` in the
terminal to stop the server when you're done.

A sample "Sample Wedding" album with 6 placeholder photos is included so you
can see how everything looks and works before adding real photos.

---

## 2. Put the site on the internet for free (GitHub Pages)

1. Create a free account at [github.com](https://github.com) if you don't
   have one.
2. Create a new repository (e.g. `jtran-shootz-site`). Keep it **Public**
   (required for free GitHub Pages) and don't add a README when prompted —
   you already have one.
3. Upload this whole `jtran-shootz-site` folder's contents to that
   repository. Easiest way: install
   [GitHub Desktop](https://desktop.github.com/), clone your new empty repo,
   copy all these files into that folder, then commit and push.
   (If you're comfortable with the command line instead, `git add .`,
   `git commit -m "Initial site"`, `git push` works too.)
4. On GitHub, go to your repo's **Settings → Pages**. Under "Build and
   deployment", set Source to **Deploy from a branch**, branch **main**,
   folder **/ (root)**. Save.
5. GitHub will give you a live URL, usually
   `https://your-username.github.io/jtran-shootz-site/`. It can take a
   minute or two to go live the first time.

That's it — the site is now free, public, and stays up as long as you like.

---

## 3. Adding a new event album

You don't need to touch any code. Use the included script:

1. Put all the photos for the event into one folder on your computer (any
   order — they'll be numbered in filename order).
2. Open a terminal in the `jtran-shootz-site` folder and run:

   ```
   python3 scripts/add_event.py "Sarah & Mike's Wedding" 2026-07-18 /path/to/photo/folder
   ```

   - First argument: the event title (in quotes).
   - Second argument: the event date, `YYYY-MM-DD`.
   - Third argument: the folder of photos.

3. The script copies and numbers the photos into
   `assets/events/<event-name>/`, and updates the two JSON files that
   power the Events page and the album page. You'll see a confirmation
   like:

   ```
   Done! Added 24 photo(s) to album 'Sarah & Mike's Wedding' (sarah-mikes-wedding).
   ```

4. Commit and push the new/changed files to GitHub (via GitHub Desktop:
   review changes, write a commit message like "Add Sarah & Mike wedding
   album", click Commit, then Push). The live site updates automatically
   within a minute or two.

**To replace an album's photos** (e.g. fix or re-upload), just run the same
command again with the same title and a folder of the new photos — it will
overwrite that album's photos.

**Removing an album:** delete its folder from `assets/events/`, delete its
file from `data/events/`, and remove its entry from `data/events.json`.

---

## 4. How clients pick their photos

Every album page has a small heart button on each photo (and inside the
fullscreen view) that clients can click to add it to their "Picks" list —
no account or checkout needed. A floating button in the bottom-right corner
shows how many they've picked; clicking it opens a panel where they can
review their list and either:

- **Email My Picks** — opens their email app with a message already
  addressed to you, listing the photo numbers they chose, or
- **Copy List** — copies the same list to their clipboard to paste anywhere
  (text, DM, etc.)

From there you just work out payment directly with them (e.g. Venmo) — the
site itself never handles checkout or payment.

Picks are saved in the visitor's own browser (not on a server), so if they
close the tab and come back later on the same device, their picks are still
there. Different visitors never see each other's picks.

**To change where "Email My Picks" sends to:** open `js/event.js` and edit
the `CONTACT_EMAIL` constant near the top. Keep it matching the email shown
on `contact.html`.

---

## 5. Editing the About and Contact pages

Open `about.html` and `contact.html` in any text editor — look for the bio
text, email, phone, city, and social link. Save, then commit + push to
publish. Contact is kept simple on purpose — no form, no backend — just the
email, phone, and Instagram link so people can reach out directly.

---

## File structure

```
jtran-shootz-site/
├── index.html            Home page
├── about.html             About page
├── contact.html           Contact page
├── events.html            Grid of all event albums
├── event.html             Single album viewer (reads ?slug=... from the URL)
├── css/style.css          All site styling
├── js/
│   ├── main.js            Shared nav behavior
│   ├── events.js          Loads and renders the album grid
│   └── event.js            Loads a single album + powers the lightbox
├── data/
│   ├── events.json         List of all albums (auto-generated)
│   └── events/*.json       One file per album (auto-generated)
├── assets/
│   ├── images/logo.png     Site logo
│   └── events/<slug>/      Numbered photos per album (auto-generated)
└── scripts/add_event.py   Script to add/update an album
```

You generally only ever need to touch `about.html`, `contact.html`, and run
`add_event.py` — everything else is handled for you.

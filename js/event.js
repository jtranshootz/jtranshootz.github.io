// Loads a single event's photos and powers the numbered thumbnail grid,
// lightbox, and client "picks" (favorites) list.

// EDIT ME: where the "Email My Picks" button sends the message.
// Keep this in sync with the address shown on contact.html.
const CONTACT_EMAIL = "jaxontran2012@gmail.com";

let photos = [];
let currentIndex = 0;
let eventSlug = null;
let eventTitle = "";
let eventDate = "";
let favorites = new Set();

async function loadEvent() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const grid = document.getElementById("photo-grid");
  const headerTitle = document.getElementById("event-title");
  const headerDate = document.getElementById("event-date");
  const headerMeta = document.getElementById("event-meta");

  if (!slug) {
    grid.innerHTML = `<p class="empty-state">No event specified.</p>`;
    return;
  }

  eventSlug = slug;

  try {
    const res = await fetch(`data/events/${encodeURIComponent(slug)}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("Album not found");
    const event = await res.json();

    photos = event.photos || [];
    eventTitle = event.title;
    eventDate = event.date;
    favorites = loadFavorites(slug);

    headerTitle.textContent = event.title;
    headerDate.textContent = formatDate(event.date);
    headerMeta.textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"}`;
    document.title = `${event.title} — JTran Shootz Photography`;

    if (!photos.length) {
      grid.innerHTML = `<p class="empty-state">No photos in this album yet.</p>`;
      return;
    }

    grid.innerHTML = photos
      .map(
        (p, i) => `
        <div class="photo-thumb" data-index="${i}">
          <span class="photo-number">${String(p.number).padStart(2, "0")}</span>
          <button class="fav-toggle" data-number="${p.number}" aria-label="Add photo ${p.number} to picks">&#9825;</button>
          <img src="${p.file}" alt="Photo ${p.number} from ${escapeHtml(event.title)}" loading="lazy" />
        </div>`
      )
      .join("");

    grid.querySelectorAll(".photo-thumb").forEach((el) => {
      el.addEventListener("click", () => openLightbox(parseInt(el.dataset.index, 10)));
    });

    grid.querySelectorAll(".fav-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(parseInt(btn.dataset.number, 10));
      });
    });

    refreshFavoriteUI();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load this album. If you're viewing this file directly on your computer, run a local server first (see README).</p>`;
    console.error(err);
  }
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Lightbox ----------

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}

function renderLightbox() {
  const photo = photos[currentIndex];
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  img.src = photo.file;
  img.alt = `Photo ${photo.number}`;
  caption.textContent = `Photo ${photo.number} of ${photos.length}`;

  const favBtn = document.getElementById("lightbox-fav");
  const isFav = favorites.has(photo.number);
  favBtn.innerHTML = isFav ? "&#9829;" : "&#9825;";
  favBtn.classList.toggle("active", isFav);
}

function showPrev() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  renderLightbox();
}

function showNext() {
  currentIndex = (currentIndex + 1) % photos.length;
  renderLightbox();
}

// ---------- Favorites / picks list ----------

function favoritesKey(slug) {
  return `jtranshootz-picks-${slug}`;
}

function loadFavorites(slug) {
  try {
    const raw = localStorage.getItem(favoritesKey(slug));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (err) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(favoritesKey(eventSlug), JSON.stringify([...favorites]));
  } catch (err) {
    console.error("Couldn't save picks locally:", err);
  }
}

function toggleFavorite(number) {
  if (favorites.has(number)) {
    favorites.delete(number);
  } else {
    favorites.add(number);
  }
  saveFavorites();
  refreshFavoriteUI();
}

function refreshFavoriteUI() {
  // Thumbnail heart buttons
  document.querySelectorAll(".fav-toggle").forEach((btn) => {
    const num = parseInt(btn.dataset.number, 10);
    const isFav = favorites.has(num);
    btn.innerHTML = isFav ? "&#9829;" : "&#9825;";
    btn.classList.toggle("active", isFav);
  });

  // Lightbox heart, if currently open
  const lb = document.getElementById("lightbox");
  if (lb && lb.classList.contains("open")) {
    const favBtn = document.getElementById("lightbox-fav");
    const photo = photos[currentIndex];
    const isFav = photo && favorites.has(photo.number);
    favBtn.innerHTML = isFav ? "&#9829;" : "&#9825;";
    favBtn.classList.toggle("active", isFav);
  }

  // Floating picks bar
  const bar = document.getElementById("picks-bar");
  const count = document.getElementById("picks-count");
  count.textContent = favorites.size;
  bar.classList.toggle("visible", favorites.size > 0);

  // Panel, if currently open
  const overlay = document.getElementById("picks-overlay");
  if (overlay && overlay.classList.contains("open")) {
    renderPicksPanel();
  }
}

function sortedFavoriteNumbers() {
  return [...favorites].sort((a, b) => a - b);
}

function renderPicksPanel() {
  const list = document.getElementById("picks-list");
  const actions = document.getElementById("picks-actions");
  const numbers = sortedFavoriteNumbers();

  if (!numbers.length) {
    list.innerHTML = `<p class="picks-empty">No picks yet — click the heart on any photo to add it here.</p>`;
    actions.innerHTML = "";
    return;
  }

  list.innerHTML = numbers
    .map((num) => {
      const photo = photos.find((p) => p.number === num);
      return `
        <li>
          <img src="${photo.file}" alt="Photo ${num}" />
          <span class="pick-label">Photo ${String(num).padStart(2, "0")}</span>
          <button class="pick-remove" data-number="${num}" aria-label="Remove photo ${num} from picks">&times;</button>
        </li>`;
    })
    .join("");

  list.querySelectorAll(".pick-remove").forEach((btn) => {
    btn.addEventListener("click", () => toggleFavorite(parseInt(btn.dataset.number, 10)));
  });

  const listText = numbers.map((n) => `Photo ${n}`).join(", ");
  const subject = encodeURIComponent(`Photo picks — ${eventTitle}`);
  const body = encodeURIComponent(
    `Hi! From the "${eventTitle}" album (${formatDate(eventDate)}), I'd love these photos:\n\n${listText}\n\nThanks!`
  );
  const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  actions.innerHTML = `
    <a class="btn filled" href="${mailtoLink}">Email My Picks</a>
    <button class="btn" id="picks-copy" type="button">Copy List</button>
    <button class="picks-clear" id="picks-clear" type="button">Clear All</button>
  `;

  document.getElementById("picks-copy").addEventListener("click", () => copyPicksToClipboard(listText));
  document.getElementById("picks-clear").addEventListener("click", () => {
    favorites.clear();
    saveFavorites();
    refreshFavoriteUI();
  });
}

function copyPicksToClipboard(text) {
  const fullText = `${eventTitle} — ${text}`;
  const btn = document.getElementById("picks-copy");

  const done = () => {
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = original), 1500);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).then(done).catch(() => fallbackCopy(fullText, done));
  } else {
    fallbackCopy(fullText, done);
  }
}

function fallbackCopy(text, done) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    done();
  } catch (err) {
    console.error("Copy failed:", err);
  }
  document.body.removeChild(textarea);
}

function openPicksPanel() {
  renderPicksPanel();
  document.getElementById("picks-overlay").classList.add("open");
}

function closePicksPanel() {
  document.getElementById("picks-overlay").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  loadEvent();

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", showPrev);
  document.getElementById("lightbox-next").addEventListener("click", showNext);
  document.getElementById("lightbox-fav").addEventListener("click", () => {
    const photo = photos[currentIndex];
    if (photo) toggleFavorite(photo.number);
  });

  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    const lb = document.getElementById("lightbox");
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });

  document.getElementById("picks-bar").addEventListener("click", openPicksPanel);
  document.getElementById("picks-panel-close").addEventListener("click", closePicksPanel);
  document.getElementById("picks-overlay").addEventListener("click", (e) => {
    if (e.target.id === "picks-overlay") closePicksPanel();
  });
});

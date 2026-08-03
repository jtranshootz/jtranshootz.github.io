// Loads data/events.json and renders the album grid on events.html

async function loadEvents() {
  const grid = document.getElementById("events-grid");
  if (!grid) return;

  try {
    const res = await fetch("data/events.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load events.json");
    const events = await res.json();

    if (!events.length) {
      grid.innerHTML = `<p class="empty-state">No event albums yet — check back soon.</p>`;
      return;
    }

    // Newest first
    events.sort((a, b) => (a.date < b.date ? 1 : -1));

    grid.innerHTML = events
      .map(
        (ev) => `
        <a class="event-card" href="event.html?slug=${encodeURIComponent(ev.slug)}">
          <img src="${ev.cover}" alt="${escapeHtml(ev.title)}" loading="lazy" />
          <div class="event-card-overlay">
            <span class="event-date">${formatDate(ev.date)}</span>
            <h3>${escapeHtml(ev.title)}</h3>
            <span class="event-count">${ev.count} photo${ev.count === 1 ? "" : "s"}</span>
          </div>
        </a>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load albums. If you're viewing this file directly on your computer, run a local server first (see README).</p>`;
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

document.addEventListener("DOMContentLoaded", loadEvents);

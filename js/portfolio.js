// Loads data/portfolio.json and renders the portfolio grid + lightbox
// (No numbering badges, no picks/favorites — just a clean viewing gallery.)

let photos = [];
let currentIndex = 0;

async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");

  try {
    const res = await fetch("data/portfolio.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load portfolio.json");
    photos = await res.json();

    if (!photos.length) {
      grid.innerHTML = `<p class="empty-state">Portfolio coming soon — check back shortly.</p>`;
      return;
    }

    grid.innerHTML = photos
      .map(
        (p, i) => `
        <div class="photo-thumb portfolio-thumb" data-index="${i}">
          <img src="${p.file}" alt="Portfolio photo ${i + 1}" loading="lazy" />
        </div>`
      )
      .join("");

    grid.querySelectorAll(".photo-thumb").forEach((el) => {
      el.addEventListener("click", () => openLightbox(parseInt(el.dataset.index, 10)));
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load the portfolio. If you're viewing this file directly on your computer, run a local server first (see README).</p>`;
    console.error(err);
  }
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
  img.src = photo.file;
  img.alt = `Portfolio photo ${currentIndex + 1}`;
}

function showPrev() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  renderLightbox();
}

function showNext() {
  currentIndex = (currentIndex + 1) % photos.length;
  renderLightbox();
}

document.addEventListener("DOMContentLoaded", () => {
  loadPortfolio();

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", showPrev);
  document.getElementById("lightbox-next").addEventListener("click", showNext);

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
});

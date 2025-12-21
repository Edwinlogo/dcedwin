// ==========================
// CONFIG
// ==========================

const CSV_QUEUE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=2110876662&single=true&output=csv";

const CSV_AWARDED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=257425403&single=true&output=csv";

const ORIGIN = "Palm Coast, FL";

// =====================
let projects = [];
let calendar;
let map;
let markers = [];

// =====================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCalendar();
  initMap();
  loadCSV(CSV_QUEUE_URL, "queue");
  loadCSV(CSV_AWARDED_URL, "awarded");

  document.getElementById("layoutSelector").onchange =
    e => document.body.dataset.layout = e.target.value;
});

// =====================
// CSV
// =====================
function loadCSV(url, status) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: res => {
      res.data.forEach(row => {
        if (!row["Project Name"]) return;
        projects.push({ ...row, status });
      });
      renderAll();
    }
  });
}

// =====================
// RENDER
// =====================
function renderAll() {
  renderProjects();
  renderCalendar();
  populateGCFilter();
}

function renderProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  projects.forEach(p => {
    const days = daysUntil(p["Bid due date"]);
    const cls = days < 3 ? "due-soon" : days < 7 ? "due-mid" : "due-ok";

    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h4>${p["Project Name"]}</h4>
      <div class="muted">📍 ${p["Location"]}</div>
      <div class="${cls}">⏰ ${p["Bid due date"]}</div>
    `;
    card.onclick = () => showDetail(p);
    list.appendChild(card);
  });
}

// =====================
// DETAIL PANEL
// =====================
function showDetail(p) {
  const panel = document.getElementById("detailPanel");
  const c = document.getElementById("detailContent");

  c.innerHTML = `
    <h3>${p["Project Name"]}</h3>
    <p><b>GC:</b> ${p["General Contractor"]}</p>
    <p><b>Location:</b> ${p["Location"]}</p>
    <p><b>Bid Due:</b> ${p["Bid due date"]}</p>
    <p>${p["Note"] || ""}</p>
    <hr>
    ${linkBtn("Plans", p["Plans"])}
    ${linkBtn("Takeoffs", p["Takeoffs"])}
    ${linkBtn("Pricing", p["Pricings"])}
    ${linkBtn("Proposal", p["Proposal"])}
  `;
  panel.classList.remove("hidden");
}

// =====================
// CALENDAR
// =====================
function initCalendar() {
  calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    { initialView: "timeGridWeek" }
  );
  calendar.render();
}

function renderCalendar() {
  calendar.removeAllEvents();
  projects.forEach(p => {
    calendar.addEvent({
      title: p["Project Name"],
      start: p["Bid due date"],
      color: p.status === "awarded" ? "#10b981" : "#f59e0b"
    });
  });
}

function setCalendarView(v) {
  calendar.changeView(v === "week" ? "timeGridWeek" : "dayGridMonth");
}

// =====================
// MAP
// =====================
function initMap() {
  map = L.map("map").setView([29.5845, -81.2079], 8); // Palm Coast
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// =====================
// HELPERS
// =====================
function daysUntil(d) {
  return (new Date(d) - new Date()) / 86400000;
}

function linkBtn(label, url) {
  return url ? `<a href="${url}" target="_blank">${label}</a><br>` : "";
}

function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (localStorage.theme === "dark") document.body.classList.add("dark");
  btn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.theme = document.body.classList.contains("dark") ? "dark" : "light";
  };
}
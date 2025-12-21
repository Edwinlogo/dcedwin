// ==========================
// CSV LINKS
// ==========================

const CSV_QUEUE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=2110876662&single=true&output=csv";

const CSV_AWARDED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=257425403&single=true&output=csv";

const ORIGIN_ADDRESS = "Palm Coast, FL";

let queueTable, awardedTable;
let calendar;
let calendarEvents = [];
const gcSet = new Set();

/* ==========================
   INIT
========================== */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCalendar();
  loadAllData();
});

/* ==========================
   CSV LOAD
========================== */
function parseCSV(url, callback) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: results => callback(results.data)
  });
}

function loadAllData() {
  gcSet.clear();
  calendarEvents = [];

  parseCSV(CSV_QUEUE_URL, loadQueue);
  parseCSV(CSV_AWARDED_URL, loadAwarded);
}

/* ==========================
   EN COLA
========================== */
function loadQueue(data) {
  const tbody = document.querySelector("#queueTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    if (!row["Project Name"]) return;

    gcSet.add(row["General Contractor"]);

    calendarEvents.push({
      title: row["Project Name"],
      start: row["Bid due date"],
      color: "#ffc107"
    });

    tbody.innerHTML += `
      <tr>
        <td>${row["Project Name"]}</td>
        <td>${row["General Contractor"]}</td>
        <td>${mapLink(row["Location"])}</td>
        <td>${row["Receipt"]}</td>
        <td>${row["Bid due date"]}</td>
        <td>${row["Note"] || ""}</td>
        <td>${links({
          plans: row["Plans"],
          proposal: row["Proposal"]
        })}</td>
      </tr>`;
  });

  if (queueTable) queueTable.destroy();
  queueTable = new DataTable("#queueTable");

  populateGCFilter();
  updateCalendar();
}

/* ==========================
   APOSTADOS
========================== */
function loadAwarded(data) {
  const tbody = document.querySelector("#awardedTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    if (!row["Project Name"]) return;

    gcSet.add(row["General Contractor"]);

    calendarEvents.push({
      title: row["Project Name"],
      start: row["Bid due date"],
      color: "#198754"
    });

    tbody.innerHTML += `
      <tr>
        <td>${row["Project Name"]}</td>
        <td>${row["General Contractor"]}</td>
        <td>${mapLink(row["Location"])}</td>
        <td>${row["Receipt"]}</td>
        <td>${row["Bid due date"]}</td>
        <td>${row["Submission date"] || ""}</td>
        <td>$${Number(row[" Total Cost (USD) "] || 0).toLocaleString()}</td>
        <td>${row["Note"] || ""}</td>
        <td>${links({
          draft: row["Draft Plans"],
          plans: row["Plans"],
          takeoffs: row["Takeoffs"],
          pricing: row["Pricings"],
          proposal: row["Proposal"]
        })}</td>
      </tr>`;
  });

  if (awardedTable) awardedTable.destroy();
  awardedTable = new DataTable("#awardedTable");

  populateGCFilter();
  updateCalendar();
}

/* ==========================
   CALENDAR
========================== */
function initCalendar() {
  calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    { initialView: "dayGridMonth", height: "auto" }
  );
  calendar.render();
}

function updateCalendar() {
  calendar.removeAllEvents();
  calendar.addEventSource(calendarEvents);
}

/* ==========================
   GC FILTER
========================== */
function populateGCFilter() {
  const select = document.getElementById("gcFilter");
  select.innerHTML = `<option value="">Todos</option>`;
  [...gcSet].sort().forEach(gc => {
    select.innerHTML += `<option value="${gc}">${gc}</option>`;
  });
}

document.getElementById("gcFilter").addEventListener("change", e => {
  queueTable.column(1).search(e.target.value).draw();
  awardedTable.column(1).search(e.target.value).draw();
});

/* ==========================
   THEME
========================== */
function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (localStorage.theme === "dark") document.body.classList.add("dark");

  btn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.theme = document.body.classList.contains("dark") ? "dark" : "light";
  };
}

/* ==========================
   HELPERS
========================== */
function links(obj) {
  return Object.entries(obj)
    .filter(([_, v]) => v)
    .map(([k, v]) => `<a href="${v}" target="_blank">${k}</a>`)
    .join(" | ");
}

function mapLink(location) {
  if (!location) return "";
  return `<a href="https://www.google.com/maps/dir/${ORIGIN_ADDRESS}/${location}"
    target="_blank">📍 ${location}</a>`;
}

// ==========================
// CSV LINKS
// ==========================

const CSV_QUEUE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=2110876662&single=true&output=csv";

const CSV_AWARDED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLj-BgbhSnjNKbjIpNcuva7T0-8kuFVNpT-SYld80Q8DogUK05dL5ljOOC7FYyUSahsk8AcV3BTYh5/pub?gid=257425403&single=true&output=csv";

// Empresa
const ORIGIN_ADDRESS = "Palm Coast, FL";

// ==========================

let queueTable, awardedTable;
let calendar;
let calendarEvents = [];
const gcSet = new Set();

document.addEventListener("DOMContentLoaded", () => {
  initCalendar();
  loadAllData();
  setInterval(loadAllData, 300000); // 5 min
});

/* ==========================
   DATA LOADING
========================== */
async function loadAllData() {
  gcSet.clear();
  calendarEvents = [];

  await loadQueue();
  await loadAwarded();

  populateGCFilter();
  updateCalendar();

  document.getElementById("lastUpdate").textContent =
    new Date().toLocaleString();
}

async function fetchCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return text
    .split("\n")
    .slice(1)
    .map(r => r.split(","));
}

/* ==========================
   EN COLA
========================== */
async function loadQueue() {
  const data = await fetchCSV(CSV_QUEUE_URL);
  const tbody = document.querySelector("#queueTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    if (!row[0]) return;

    gcSet.add(row[1]);

    calendarEvents.push({
      title: row[0],
      start: row[4],
      color: "#ffc107",
      extendedProps: {
        tooltip: `${row[0]} | ${row[1]} | ${row[2]}`
      }
    });

    tbody.innerHTML += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${mapLink(row[2])}</td>
        <td>${row[3]}</td>
        <td>${dueBadge(row[4])}</td>
        <td>${row[8]}</td>
        <td>${links({
          plans: row[10],
          proposal: row[13]
        })}</td>
      </tr>`;
  });

  if (queueTable) queueTable.destroy();
  queueTable = new DataTable("#queueTable");
}

/* ==========================
   APOSTADOS
========================== */
async function loadAwarded() {
  const data = await fetchCSV(CSV_AWARDED_URL);
  const tbody = document.querySelector("#awardedTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    if (!row[0]) return;

    gcSet.add(row[1]);

    calendarEvents.push({
      title: row[0],
      start: row[4],
      color: "#198754",
      extendedProps: {
        tooltip: `${row[0]} | ${row[1]} | ${row[2]}`
      }
    });

    tbody.innerHTML += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${mapLink(row[2])}</td>
        <td>${row[3]}</td>
        <td>${dueBadge(row[4])}</td>
        <td>${row[5]}</td>
        <td>$${Number(row[6]).toLocaleString()}</td>
        <td>${row[8]}</td>
        <td>${links({
          draft: row[9],
          plans: row[10],
          takeoffs: row[11],
          pricing: row[12],
          proposal: row[13]
        })}</td>
      </tr>`;
  });

  if (awardedTable) awardedTable.destroy();
  awardedTable = new DataTable("#awardedTable");
}

/* ==========================
   CALENDARIO
========================== */
function initCalendar() {
  calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {
      initialView: "dayGridMonth",
      height: "auto",
      eventDidMount(info) {
        info.el.title = info.event.extendedProps.tooltip;
      }
    }
  );
  calendar.render();
}

function updateCalendar() {
  calendar.removeAllEvents();
  calendar.addEventSource(calendarEvents);
}

/* ==========================
   FILTRO GC
========================== */
function populateGCFilter() {
  const select = document.getElementById("gcFilter");
  select.innerHTML = `<option value="">Todos</option>`;

  [...gcSet].sort().forEach(gc => {
    select.innerHTML += `<option value="${gc}">${gc}</option>`;
  });
}

document.getElementById("gcFilter").addEventListener("change", function () {
  const val = this.value;
  queueTable.column(1).search(val).draw();
  awardedTable.column(1).search(val).draw();
});

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

function dueBadge(dateStr) {
  if (!dateStr) return "";
  const days =
    (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);

  let cls = "badge-ok";
  if (days < 3) cls = "badge-soon";
  else if (days < 7) cls = "badge-mid";

  return `<span class="badge ${cls}">${dateStr}</span>`;
}

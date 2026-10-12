import { getTodayIso } from "../shared/visit-dates.js";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Monatskalender mit beliebig vielen auswählbaren Tagen (Datumswerte als YYYY-MM-DD)
export function createDatePicker(root, { onChange } = {}) {
  const selected = new Set();
  const today = getTodayIso();
  let viewYear = Number(today.slice(0, 4));
  let viewMonth = Number(today.slice(5, 7)) - 1;

  function getDates() {
    return [...selected].sort();
  }

  function shiftMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();
    render();
  }

  function toggle(iso) {
    if (selected.has(iso)) selected.delete(iso);
    else selected.add(iso);
    render();
    if (onChange) onChange(getDates());
  }

  function buildSummary() {
    const dates = getDates();
    if (!dates.length) {
      return "Kein Besuchstag gewählt – der Besucher wird im Kiosk nicht angezeigt.";
    }
    const list = dates.map(formatDisplay).join(", ");
    return `${dates.length} ${dates.length === 1 ? "Tag" : "Tage"}: ${list}${selected.has(today) ? " (heute sichtbar)" : ""}`;
  }

  function render() {
    const head = createEl("div", "date-picker-head");
    const prev = createEl("button", "date-picker-nav", "‹");
    prev.type = "button";
    prev.setAttribute("aria-label", "Vorheriger Monat");
    prev.addEventListener("click", () => shiftMonth(-1));
    const next = createEl("button", "date-picker-nav", "›");
    next.type = "button";
    next.setAttribute("aria-label", "Nächster Monat");
    next.addEventListener("click", () => shiftMonth(1));
    head.append(prev, createEl("span", "", `${MONTHS[viewMonth]} ${viewYear}`), next);

    const grid = createEl("div", "date-picker-grid");
    WEEKDAYS.forEach(name => grid.appendChild(createEl("span", "date-picker-weekday", name)));

    const leadingBlanks = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Woche beginnt am Montag
    for (let i = 0; i < leadingBlanks; i++) grid.appendChild(createEl("span"));

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(viewYear, viewMonth, day);
      const button = createEl("button", "date-picker-day", String(day));
      button.type = "button";
      button.setAttribute("aria-pressed", String(selected.has(iso)));
      button.classList.toggle("selected", selected.has(iso));
      button.classList.toggle("today", iso === today);
      button.addEventListener("click", () => toggle(iso));
      grid.appendChild(button);
    }

    const foot = createEl("div", "date-picker-foot");
    const clear = createEl("button", "date-picker-clear", "Alle entfernen");
    clear.type = "button";
    clear.disabled = selected.size === 0;
    clear.addEventListener("click", () => {
      selected.clear();
      render();
      if (onChange) onChange(getDates());
    });
    foot.append(createEl("span", "", buildSummary()), clear);

    root.replaceChildren(head, grid, foot);
  }

  // Setzt die Auswahl von außen (ohne onChange) und springt zum ersten Besuchstag
  function setDates(dates) {
    selected.clear();
    (dates || []).forEach(iso => selected.add(iso));
    const first = getDates()[0] || today;
    viewYear = Number(first.slice(0, 4));
    viewMonth = Number(first.slice(5, 7)) - 1;
    render();
  }

  render();
  return { getDates, setDates };
}

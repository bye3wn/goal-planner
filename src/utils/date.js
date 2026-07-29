// Small, pure date helpers. No state, no side effects — easy to test and
// easy to reuse if you add a week/month view later.

export function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function formatHour(h) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${String(hr).padStart(2, "0")}:00 ${period}`;
}

// Formats a decimal hour (9.5 -> "9:30 AM") for start-time labels on events
// and the time picker in the create/edit modal.
export function formatTime(decimalHour) {
  const period = decimalHour >= 12 ? "PM" : "AM";
  const hr24 = Math.floor(decimalHour);
  const hr = hr24 % 12 === 0 ? 12 : hr24 % 12;
  const minutes = Math.round((decimalHour % 1) * 60);
  return `${hr}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return "1 hr";
  return Number.isInteger(hours) ? `${hours} hrs` : `${hours} hrs`;
}

// Zero-padded 12-hour label used for the time-input autocomplete list, e.g.
// 1.25 -> "01:15 AM". The leading zero matters here — it's what makes
// typing "01" match every quarter-hour in the 1 o'clock hour.
// Accepts pretty much anything reasonable a person might type — "1:15 PM",
// "01:15pm", "13:15", "9", "9am" — and returns a decimal hour, or null if
// it genuinely can't be parsed (the caller should keep the previous value
// in that case rather than accepting garbage).
export function parseTimeInput(str) {
  const s = str.trim().toLowerCase();
  if (!s) return null;

  const withMeridiem = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (withMeridiem) {
    let [, h, m, period] = withMeridiem;
    h = Number(h);
    m = m ? Number(m) : 0;
    if (h < 1 || h > 12 || m > 59) return null;
    let hour24 = h % 12;
    if (period === "pm") hour24 += 12;
    return hour24 + m / 60;
  }

  const bare24 = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (bare24) {
    const h = Number(bare24[1]);
    const m = bare24[2] ? Number(bare24[2]) : 0;
    if (h > 23 || m > 59) return null;
    return h + m / 60;
  }

  return null;
}

// Converts to/from the "HH:MM" strings native <input type="time"> uses.
export function decimalToTimeString(decimalHour) {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToDecimal(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

export function formatDateHeading(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

// Whole days between two dates (b - a), floor'd to ignore time-of-day.
// Used to turn a goal deadline into "how many days total" for a
// daily-habit-until-deadline milestone.
export function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end - start) / msPerDay);
}

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

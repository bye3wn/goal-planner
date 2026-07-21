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

// Pure helpers for computing what dates a given calendar view spans, and
// for navigating between views. No React, no state.

import { addDays, dateKey } from "./date";

export function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday start
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// 7 Date objects, Sunday through Saturday, for the week containing `date`.
export function getWeekDates(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Every day that's actually IN the month (28-31 entries) — used for
// aggregating tasks, not for rendering the grid (which needs padding days).
export function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => new Date(year, month, i + 1));
}

// Always 42 days (6 full weeks) so the month grid renders as a clean
// rectangle, including the leading/trailing days from adjacent months.
export function getMonthGridDates(date) {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// 12 Date objects, first-of-month for each month in the year containing `date`.
export function getYearMonths(date) {
  const year = date.getFullYear();
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}

export function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(d) {
  return isSameDate(d, new Date());
}

// Moves `date` forward/back by one unit of the given view.
export function shiftByView(date, view, delta) {
  const d = new Date(date);
  if (view === "day") d.setDate(d.getDate() + delta);
  else if (view === "week") d.setDate(d.getDate() + delta * 7);
  else if (view === "month") d.setMonth(d.getMonth() + delta);
  else if (view === "year") d.setFullYear(d.getFullYear() + delta);
  return d;
}

// All date KEYS (strings) a given view needs data loaded for — day: 1,
// week: 7, month: up to 42 (the padded grid), year: every day across all
// 12 months. Used both to pre-generate repeating-task instances for the
// visible range and to know which items belong on screen.
export function getViewDateKeys(date, view) {
  if (view === "day") return [dateKey(date)];
  if (view === "week") return getWeekDates(date).map(dateKey);
  if (view === "month") return getMonthGridDates(date).map(dateKey);
  if (view === "year") return getYearMonths(date).flatMap((m) => getMonthDates(m).map(dateKey));
  return [dateKey(date)];
}

export function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatWeekRange(date) {
  const [start, end] = [getWeekDates(date)[0], getWeekDates(date)[6]];
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(undefined, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
  return `${startStr} – ${endStr}, ${end.getFullYear()}`;
}

export function formatDayShort(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

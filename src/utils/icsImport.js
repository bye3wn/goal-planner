// A deliberately small .ics (iCalendar) parser — just enough to pull
// events out of a Google/Outlook/Apple calendar export and drop them into
// Waypoint's day-bucketed data model. Not a full RFC 5545 implementation;
// see the limitations noted inline. Anything it can't confidently
// represent gets imported as a best-effort single occurrence rather than
// dropped, with a note in the parse summary explaining what was simplified.

const BYDAY_TO_DOW = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function unescapeText(s) {
  return s.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

// Unfolds RFC 5545 line folding (continuation lines start with a space or
// tab) and splits into logical property lines.
function unfoldLines(text) {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else if (line.trim() !== "") {
      lines.push(line);
    }
  }
  return lines;
}

// "DTSTART;TZID=America/New_York:20260315T090000" -> { name, params, value }
function parseLine(line) {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const left = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const [name, ...paramParts] = left.split(";");
  return { name: name.toUpperCase(), params: paramParts, value };
}

// Parses a DTSTART/DTEND value into { date: "YYYY-MM-DD", hour: decimal|null }.
// hour is null for all-day (VALUE=DATE) values. Time zones are NOT
// converted — the wall-clock digits in the file are used as-is, which
// matches the file's own local time in the common case but can be off if
// the source calendar's timezone differs from yours.
function parseDateValue(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?Z?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = `${y}-${mo}-${d}`;
  if (h === undefined) return { date, hour: null };
  return { date, hour: Number(h) + Number(mi) / 60 };
}

function parseISODuration(value) {
  const m = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const [, days, hours, mins] = m;
  return (Number(days) || 0) * 24 + (Number(hours) || 0) + (Number(mins) || 0) / 60;
}

function parseRRule(value) {
  const parts = {};
  for (const pair of value.split(";")) {
    const [k, v] = pair.split("=");
    if (k) parts[k.toUpperCase()] = v;
  }
  return parts;
}

// Returns { events, warnings } where events are ready to hand to
// usePlanner's importEvents, and warnings is a short list of things that
// got simplified (shown to the person before they confirm the import).
export function parseICS(text) {
  const lines = unfoldLines(text);
  const events = [];
  let simplifiedCount = 0;
  let skippedCount = 0;

  let current = null;
  for (const rawLine of lines) {
    const line = parseLine(rawLine);
    if (!line) continue;

    if (rawLine.startsWith("BEGIN:VEVENT")) {
      current = {};
      continue;
    }
    if (rawLine.startsWith("END:VEVENT")) {
      if (current) {
        const parsed = finalizeEvent(current);
        if (parsed) {
          events.push(parsed.event);
          if (parsed.simplified) simplifiedCount++;
        } else {
          skippedCount++;
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    if (line.name === "SUMMARY") current.title = unescapeText(line.value);
    else if (line.name === "DTSTART") current.dtstart = parseDateValue(line.value);
    else if (line.name === "DTEND") current.dtend = parseDateValue(line.value);
    else if (line.name === "DURATION") current.durationHours = parseISODuration(line.value);
    else if (line.name === "RRULE") current.rrule = parseRRule(line.value);
  }

  const warnings = [];
  if (simplifiedCount > 0) {
    warnings.push(`${simplifiedCount} recurring event${simplifiedCount === 1 ? "" : "s"} could only be imported as a single occurrence (complex recurrence patterns aren't fully supported).`);
  }
  if (skippedCount > 0) {
    warnings.push(`${skippedCount} event${skippedCount === 1 ? "" : "s"} couldn't be read and ${skippedCount === 1 ? "was" : "were"} skipped.`);
  }

  return { events, warnings };
}

function finalizeEvent(raw) {
  if (!raw.dtstart || !raw.title) return null;

  const allDay = raw.dtstart.hour === null;
  let duration = 1;
  if (!allDay) {
    if (raw.dtend && raw.dtend.hour !== null) {
      const startTotal = raw.dtstart.hour;
      const sameDay = raw.dtend.date === raw.dtstart.date;
      duration = sameDay ? Math.max(0.25, raw.dtend.hour - startTotal) : 24 - startTotal; // multi-day: clip to end of start day
    } else if (raw.durationHours != null) {
      duration = Math.max(0.25, raw.durationHours);
    }
  }

  let repeat = null;
  let simplified = false;
  if (raw.rrule) {
    const { FREQ, BYDAY, INTERVAL, UNTIL, COUNT } = raw.rrule;
    const simpleInterval = !INTERVAL || INTERVAL === "1";
    if (simpleInterval && FREQ === "DAILY") {
      repeat = { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
    } else if (simpleInterval && FREQ === "WEEKLY" && BYDAY) {
      const days = BYDAY.split(",").map((d) => BYDAY_TO_DOW[d]).filter((d) => d !== undefined);
      if (days.length > 0) repeat = { daysOfWeek: days };
    }
    if (repeat && UNTIL) {
      const until = parseDateValue(UNTIL);
      if (until) repeat.endDate = until.date;
    }
    if (!repeat || COUNT) simplified = true; // unsupported pattern, or COUNT ignored (unbounded instead)
  }

  return {
    simplified,
    event: {
      title: raw.title,
      date: raw.dtstart.date,
      allDay,
      start: allDay ? null : raw.dtstart.hour,
      duration: allDay ? null : duration,
      repeat: repeat && !simplified ? repeat : null,
    },
  };
}

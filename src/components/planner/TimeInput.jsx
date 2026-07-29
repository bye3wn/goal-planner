import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../../constants/theme";
import { formatTime } from "../../utils/date";

// Every quarter-hour across a full day, used as the suggestion pool.
const ALL_QUARTER_HOURS = Array.from({ length: 96 }, (_, i) => i * 0.25);

// Two digit-only forms per time — with and without a leading zero on the
// hour — so typing "1" matches 1:00/1:15/etc AND typing "01" ALSO matches
// just the 1 o'clock hour (not 10, 11, 12), the way the person asked for.
function digitForms(decimalHour) {
  const hr24 = Math.floor(decimalHour);
  const hr12 = hr24 % 12 === 0 ? 12 : hr24 % 12;
  const min = Math.round((decimalHour % 1) * 60);
  const mm = String(min).padStart(2, "0");
  return { noLeadingZero: `${hr12}${mm}`, withLeadingZero: `${String(hr12).padStart(2, "0")}${mm}` };
}

function matchesTyped(decimalHour, digits) {
  if (!digits) return true;
  const { noLeadingZero, withLeadingZero } = digitForms(decimalHour);
  return noLeadingZero.startsWith(digits) || withLeadingZero.startsWith(digits);
}

// Accepts pretty much anything reasonable: "1", "1:07", "1:07am", "1 07 pm",
// "13:07". No am/pm given is treated as a literal 24-hour value (so "13"
// means 1pm, "1" means 1am) — matches how the suggestion list itself is
// built from 24-hour decimal values under the hood.
function parseFreeText(text) {
  const t = text.trim().toLowerCase();
  const m = t.match(/^(\d{1,2})[:\s]?(\d{2})?\s*(a|am|p|pm)?$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const suffix = m[3];
  if (hour > 23 || minute > 59) return null;
  if (suffix) {
    const isPM = suffix.startsWith("p");
    hour = hour % 12;
    if (isPM) hour += 12;
  }
  return hour + minute / 60;
}

// A typeable time field: shows "9:00 AM" style text, but you can type any
// exact minute (not just the suggested quarter-hours) and it's accepted.
// Typing narrows a dropdown of quarter-hour matches — e.g. "01" suggests
// 1:00, 1:15, 1:30, 1:45 (both AM and PM).
export default function TimeInput({ value, onChange, label }) {
  const [text, setText] = useState(formatTime(value));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(formatTime(value));
  }, [value]);

  const digits = text.replace(/[^0-9]/g, "");
  const suggestions = open ? ALL_QUARTER_HOURS.filter((s) => matchesTyped(s, digits)).slice(0, 40) : [];

  function commit(decimalHour) {
    onChange(decimalHour);
    setText(formatTime(decimalHour));
    setOpen(false);
  }

  function handleBlur() {
    // Delayed so a click on a suggestion (which blurs the input first)
    // still registers before we decide what to do with the typed text.
    setTimeout(() => {
      setOpen(false);
      const parsed = parseFreeText(text);
      if (parsed != null) commit(parsed);
      else setText(formatTime(value));
    }, 120);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) commit(suggestions[highlight] ?? suggestions[0]);
      else {
        const parsed = parseFreeText(text);
        if (parsed != null) commit(parsed);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setText(formatTime(value));
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    }
  }

  return (
    <div className="relative">
      {label && (
        <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        value={text}
        onFocus={(e) => {
          setOpen(true);
          setHighlight(0);
          e.target.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-sm px-3 py-2 rounded-md border outline-none"
        style={{ borderColor: COLORS.line }}
      />
      {open && suggestions.length > 0 && (
        <div
          className="absolute z-20 mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-md border shadow-lg"
          style={{ background: COLORS.panel, borderColor: COLORS.line }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(s)}
              className="w-full text-left px-3 py-1.5 text-sm"
              style={{ background: i === highlight ? COLORS.canvas : "transparent", color: COLORS.ink }}
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

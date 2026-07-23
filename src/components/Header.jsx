import React from "react";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS, CALENDAR_VIEWS } from "../constants/theme";
import { formatDateHeading } from "../utils/date";
import { formatMonthYear, formatWeekRange } from "../utils/calendarRange";

function rangeLabel(date, view) {
  if (view === "day") return formatDateHeading(date);
  if (view === "week") return formatWeekRange(date);
  if (view === "month") return formatMonthYear(date);
  if (view === "year") return String(date.getFullYear());
  return "";
}

export default function Header({ currentDate, view, onSetView, onPrev, onNext, onToday }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0 flex-wrap gap-3"
      style={{ borderBottom: `1px solid ${COLORS.line}` }}
    >
      <div className="flex items-center gap-2">
        <Flag size={20} color={COLORS.blaze} strokeWidth={2.5} />
        <span className="font-display text-xl" style={{ color: COLORS.forest }}>
          Waypoint
        </span>
      </div>

      <div className="flex items-center gap-3 font-mono text-sm" style={{ color: COLORS.inkFaint }}>
        <button onClick={onPrev} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" aria-label="Previous">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[180px] text-center" style={{ color: COLORS.ink }}>
          {rangeLabel(currentDate, view)}
        </span>
        <button onClick={onNext} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" aria-label="Next">
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onToday}
          className="ml-1 px-2.5 py-1 rounded-md border text-xs hover:bg-black/5 transition-colors"
          style={{ borderColor: COLORS.line }}
        >
          Today
        </button>
      </div>

      <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: COLORS.line }}>
        {CALENDAR_VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => onSetView(v)}
            className="px-3 py-1.5 text-xs capitalize transition-colors"
            style={{
              background: view === v ? COLORS.forest : "transparent",
              color: view === v ? "#fff" : COLORS.inkFaint,
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </header>
  );
}

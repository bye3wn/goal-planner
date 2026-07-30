import React from "react";
import { Flag, ChevronLeft, ChevronRight, Moon, Upload } from "lucide-react";
import { COLORS, CALENDAR_VIEWS } from "../constants/theme";
import { formatDateHeading } from "../utils/date";
import { formatMonthYear, formatWeekRange } from "../utils/calendarRange";

export function rangeLabel(date, view) {
  if (view === "day") return formatDateHeading(date);
  if (view === "week") return formatWeekRange(date);
  if (view === "month") return formatMonthYear(date);
  if (view === "year") return String(date.getFullYear());
  return "";
}

// compact: true on mobile — the date nav and view switcher move into the
// Calendar tab's own header there instead (they're only relevant on that
// one tab, whereas this header is shared across all tabs), so this just
// shows the logo and the two global actions.
export default function Header({ currentDate, view, onSetView, onPrev, onNext, onToday, onOpenSleepSchedule, onOpenImport, compact }) {
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

      {!compact && (
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
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenImport}
          className="p-1.5 rounded-md border hover:bg-black/5 transition-colors"
          style={{ borderColor: COLORS.line }}
          title="Import a calendar (.ics)"
          aria-label="Import a calendar"
        >
          <Upload size={16} color={COLORS.inkFaint} />
        </button>
        <button
          onClick={onOpenSleepSchedule}
          className="p-1.5 rounded-md border hover:bg-black/5 transition-colors"
          style={{ borderColor: COLORS.line }}
          title="Set sleep schedule"
          aria-label="Set sleep schedule"
        >
          <Moon size={16} color={COLORS.inkFaint} />
        </button>
        {!compact && (
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
        )}
      </div>
    </header>
  );
}

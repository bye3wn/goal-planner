import React from "react";
import { COLORS, WEEKDAY_FULL } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { isToday } from "../../utils/calendarRange";

const MAX_CHIPS = 3;

// A standard month grid — always 6 full weeks so the layout never jumps
// between months. Clicking a day's empty space drills into day view for
// that date (the natural place to add something); clicking an event chip
// opens it for editing directly, without navigating away.
export default function MonthGrid({ gridDates, currentMonth, allItems, goalColor, onDayClick, onEventClick }) {
  const weeks = [];
  for (let i = 0; i < gridDates.length; i += 7) weeks.push(gridDates.slice(i, i + 7));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_FULL.map((w) => (
          <div key={w} className="text-center font-mono text-[10px] uppercase py-1" style={{ color: COLORS.inkFaint }}>
            {w}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1" style={{ minHeight: 96 }}>
            {week.map((d) => {
              const dk = dateKey(d);
              const inMonth = d.getMonth() === currentMonth.getMonth();
              const dayEvents = allItems.filter((i) => i.date === dk && i.kind === "event").sort((a, b) => a.start - b.start);
              const overflow = dayEvents.length - MAX_CHIPS;

              return (
                <button
                  key={dk}
                  onClick={() => onDayClick(d)}
                  className="text-left rounded-md p-1.5 flex flex-col gap-0.5 hover:bg-black/5 transition-colors"
                  style={{ border: `1px solid ${COLORS.line}`, opacity: inMonth ? 1 : 0.4 }}
                >
                  <span
                    className="text-xs font-mono inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                    style={{ background: isToday(d) ? COLORS.forest : "transparent", color: isToday(d) ? "#fff" : COLORS.ink }}
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, MAX_CHIPS).map((ev) => (
                      <span
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev, d);
                        }}
                        className="text-[10px] truncate px-1 py-0.5 rounded"
                        style={{
                          background: ev.isSleep ? COLORS.sleep : COLORS.canvas,
                          color: ev.isSleep ? "#E7E9E3" : COLORS.ink,
                          borderLeft: `2px solid ${ev.isSleep ? COLORS.sleep : goalColor(ev.goalId)}`,
                          textDecoration: ev.done && !ev.isSleep ? "line-through" : "none",
                        }}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[10px]" style={{ color: COLORS.inkFaint }}>
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

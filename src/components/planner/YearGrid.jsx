import React from "react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getMonthGridDates, isToday } from "../../utils/calendarRange";

// 12 compact mini-months. Days with anything on them get a small dot —
// enough to spot a busy stretch at a glance without trying to cram real
// event titles into a box this small. Click a day to jump to it in day
// view; click a month name to jump to month view for a closer look.
export default function YearGrid({ yearMonths, allItems, onDayClick, onMonthClick }) {
  const busyDates = new Set(allItems.map((i) => i.date));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <div className="grid grid-cols-3 gap-6">
        {yearMonths.map((monthStart) => {
          const gridDates = getMonthGridDates(monthStart);
          return (
            <div key={monthStart.getMonth()}>
              <button
                onClick={() => onMonthClick(monthStart)}
                className="font-display text-sm mb-1.5 hover:underline"
                style={{ color: COLORS.forest }}
              >
                {MONTH_LABELS[monthStart.getMonth()]}
              </button>
              <div className="grid grid-cols-7 gap-y-0.5">
                {gridDates.map((d) => {
                  const dk = dateKey(d);
                  const inMonth = d.getMonth() === monthStart.getMonth();
                  const busy = busyDates.has(dk);
                  return (
                    <button
                      key={dk}
                      onClick={() => onDayClick(d)}
                      className="flex flex-col items-center justify-center"
                      style={{ opacity: inMonth ? 1 : 0.3, height: 22 }}
                    >
                      <span
                        className="text-[10px] font-mono inline-flex items-center justify-center w-5 h-5 rounded-full"
                        style={{ background: isToday(d) ? COLORS.forest : "transparent", color: isToday(d) ? "#fff" : COLORS.ink }}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full mt-0.5"
                        style={{ background: busy && inMonth ? COLORS.blaze : "transparent" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

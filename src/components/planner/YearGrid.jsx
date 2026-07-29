import React, { useMemo } from "react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getMonthGridDates, isToday } from "../../utils/calendarRange";

const MAX_DOTS = 4;

// 12 compact mini-months. Days with tasks get a small dot per distinct
// long-term goal that has a task that day — one dot for one goal, several
// small dots side by side when multiple goals are active the same day, so
// a busy multi-goal day is visually distinguishable from a single-goal
// one even at this tiny size. Tasks with no goal attached fall back to a
// single neutral dot. Click a day to jump to it in day view; click a
// month name to jump to month view for a closer look.
export default function YearGrid({ yearMonths, allItems, goalColor, onDayClick, onMonthClick }) {
  // Precomputed once instead of filtering allItems per day cell (365+
  // cells x a full item scan each would add up).
  const goalIdsByDate = useMemo(() => {
    const map = new Map();
    for (const i of allItems) {
      if (i.kind !== "task") continue;
      if (!map.has(i.date)) map.set(i.date, new Set());
      map.get(i.date).add(i.goalId || null);
    }
    return map;
  }, [allItems]);

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
                  const goalIds = Array.from(goalIdsByDate.get(dk) || []).slice(0, MAX_DOTS);

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
                      <span className="flex items-center gap-[2px] mt-0.5" style={{ height: 4 }}>
                        {inMonth &&
                          goalIds.map((gid, idx) => (
                            <span key={idx} className="w-1 h-1 rounded-full" style={{ background: goalColor(gid) }} />
                          ))}
                      </span>
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

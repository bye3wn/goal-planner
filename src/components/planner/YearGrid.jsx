import React, { useMemo } from "react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getMonthGridDates, isToday } from "../../utils/calendarRange";

// 12 compact mini-months. A day with any tasks gets a single dot, colored
// by whichever goal comes first for that day — and if more than one goal
// is active that day, a small "+N" next to it for the rest, rather than
// stacking a dot per goal. Stacked dots overlapped once a day had 3+ goals
// (worse on narrow phone widths, but desktop hit the same wall around 4) —
// a fixed dot-plus-count reads clearly at any width, however many goals
// pile onto one day. Tasks with no goal attached count as a neutral dot.
// Click a day to jump to it in day view; click a month name to jump to
// month view for a closer look.
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
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
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
                  const goalIds = Array.from(goalIdsByDate.get(dk) || []);
                  const extra = goalIds.length - 1;

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
                      <span className="flex items-center justify-center gap-0.5 mt-0.5" style={{ height: 8 }}>
                        {inMonth && goalIds.length > 0 && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: goalColor(goalIds[0]) }} />
                            {extra > 0 && (
                              <span className="text-[7px] font-mono leading-none" style={{ color: COLORS.inkFaint }}>
                                +{extra}
                              </span>
                            )}
                          </>
                        )}
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

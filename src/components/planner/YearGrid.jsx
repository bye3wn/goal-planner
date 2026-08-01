import React, { useMemo } from "react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getMonthGridDates, isToday } from "../../utils/calendarRange";

// Builds the CSS background for one day's dot: a solid color for a single
// goal, a conic-gradient sliced into even wedges for 2-4 goals (a real
// pie chart, not stacked dots — nothing to overlap regardless of screen
// width), and a fixed rainbow gradient for 5+ (past 4 there's no useful
// way to keep slices individually readable at this size, so it just signals
// "a lot going on" rather than trying to represent each one).
function dotBackground(goalIds, goalColor) {
  const colors = goalIds.map((id) => goalColor(id));
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];
  if (colors.length <= 4) {
    const slice = 360 / colors.length;
    const stops = colors.map((c, i) => `${c} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");
    return `conic-gradient(${stops})`;
  }
  return "conic-gradient(red, orange, yellow, green, blue, indigo, violet, red)";
}

// 12 compact mini-months. A day with any tasks gets a small dot — solid if
// only one goal is active that day, split into pie-chart wedges (one per
// goal, up to 4) if several are, and a rainbow dot beyond that. This reads
// clearly at any width, since it's always exactly one small circle no
// matter how many goals land on the same day — nothing to overlap the way
// stacked dots did. Tasks with no goal attached count as a neutral wedge.
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
                  const background = inMonth ? dotBackground(goalIds, goalColor) : null;

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
                      <span className="flex items-center justify-center mt-0.5" style={{ height: 8 }}>
                        {background && <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background }} />}
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

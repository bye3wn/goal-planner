import React, { useRef, useEffect } from "react";
import { COLORS, HOURS, HOUR_HEIGHT_PX, DAY_START_HOUR } from "../../constants/theme";
import { formatHour, formatTime, dateKey } from "../../utils/date";
import { isToday } from "../../utils/calendarRange";

const DEFAULT_SCROLL_HOUR = 7;

// A lighter-weight sibling of the day grid: 7 columns instead of 1, no
// drag-to-reschedule (that stays a day-view-only interaction — moving
// something to a different DAY, not just a different time, is a bigger
// action than this view is built for). Click empty space to create,
// click an event to edit, click a day header to drill into that day.
export default function WeekGrid({ weekDates, allItems, goalColor, onSlotClick, onEventClick, onDayHeaderClick }) {
  const scrollRef = useRef(null);
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_HEIGHT_PX;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <div className="flex" style={{ minWidth: 720 }}>
        <div className="w-14 flex-shrink-0" />
        {weekDates.map((d) => (
          <button
            key={dateKey(d)}
            onClick={() => onDayHeaderClick(d)}
            className="flex-1 text-center py-2 rounded-md hover:bg-black/5 transition-colors"
          >
            <div className="font-mono text-[10px] uppercase" style={{ color: COLORS.inkFaint }}>
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div
              className="text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mx-auto mt-0.5"
              style={{ background: isToday(d) ? COLORS.forest : "transparent", color: isToday(d) ? "#fff" : COLORS.ink }}
            >
              {d.getDate()}
            </div>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex overflow-y-auto" style={{ minWidth: 720, maxHeight: "calc(100vh - 220px)" }}>
        <div className="w-14 flex-shrink-0" style={{ height: gridHeight }}>
          {HOURS.map((h) => (
            <div key={h} className="font-mono text-[10px] text-right pr-2" style={{ height: HOUR_HEIGHT_PX, color: COLORS.inkFaint, transform: "translateY(-6px)" }}>
              {formatHour(h)}
            </div>
          ))}
        </div>

        {weekDates.map((d) => {
          const dk = dateKey(d);
          const dayEvents = allItems.filter((i) => i.date === dk && i.kind === "event");
          return (
            <div
              key={dk}
              className="relative flex-1 cursor-pointer"
              style={{ height: gridHeight, borderLeft: `1px solid ${COLORS.line}` }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const rawHour = DAY_START_HOUR + (e.clientY - rect.top) / HOUR_HEIGHT_PX;
                onSlotClick(d, Math.round(rawHour * 4) / 4);
              }}
            >
              {HOURS.map((h, idx) => (
                <div key={h} className="absolute left-0 right-0" style={{ top: idx * HOUR_HEIGHT_PX, borderTop: `1px solid ${COLORS.line}` }} />
              ))}
              {dayEvents.map((ev) => {
                const top = (ev.start - DAY_START_HOUR) * HOUR_HEIGHT_PX;
                const height = Math.max(18, ev.duration * HOUR_HEIGHT_PX - 2);
                return (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev, d);
                    }}
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden"
                    style={{
                      top,
                      height,
                      background: ev.done ? "#F4F3EE" : COLORS.panel,
                      border: `1px solid ${COLORS.line}`,
                      borderLeft: `3px solid ${goalColor(ev.goalId)}`,
                      opacity: ev.done ? 0.6 : 1,
                    }}
                  >
                    <div className="text-[11px] font-medium truncate" style={{ textDecoration: ev.done ? "line-through" : "none" }}>
                      {ev.title}
                    </div>
                    {height > 30 && (
                      <div className="font-mono text-[9px]" style={{ color: COLORS.inkFaint }}>
                        {formatTime(ev.start)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

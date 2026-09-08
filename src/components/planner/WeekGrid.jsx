import React, { useRef, useEffect, useState } from "react";
import { COLORS, HOURS, HOUR_HEIGHT_PX, DAY_START_HOUR } from "../../constants/theme";
import { formatHour, formatTime, dateKey } from "../../utils/date";
import { isToday } from "../../utils/calendarRange";
import { snapToQuarterHour } from "../../utils/scheduling";

const DEFAULT_SCROLL_HOUR = 7;

function readDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData("application/json"));
  } catch {
    return null;
  }
}

// A lighter-weight sibling of the day grid: 7 columns instead of 1. Click
// empty space to create, click an event to edit, click a day header to
// drill into that day. Drag-and-drop uses native HTML5 DnD (not the day
// grid's pointer-capture approach) since it needs to track motion across
// columns, not just up and down one: dragging an event block moves it to
// wherever it's dropped (a new day/time if the target is empty space, or a
// full swap with whatever event it lands on), and dragging a card in from
// EventPresetsPanel stamps out a new event at the drop point.
//
// One scroll container for both the day-header row and the hour grid (not
// two separate ones) — otherwise scrolling either one horizontally would
// desync the day labels from the columns underneath them. It's sized with
// flex-1 + min-h-0, which only works correctly if THIS component's own
// parent is a real flex container with a bounded height; a plain
// height:auto ancestor makes flex-1 a no-op and the grid overflows its
// box instead of scrolling, which is what caused hours to get clipped.
export default function WeekGrid({ weekDates, allItems, goalColor, onSlotClick, onEventClick, onDayHeaderClick, onDropPreset, onMoveEvent, onSwapEvents }) {
  const scrollRef = useRef(null);
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX;

  // Which day column (by date key) is currently being dragged over, purely
  // for the highlight — the actual drop logic doesn't need it.
  const [dragOverDay, setDragOverDay] = useState(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_HEIGHT_PX;
  }, []);

  function snappedHourFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawHour = DAY_START_HOUR + (e.clientY - rect.top) / HOUR_HEIGHT_PX;
    return Math.max(DAY_START_HOUR, snapToQuarterHour(rawHour));
  }

  function handleColumnDrop(e, d) {
    e.preventDefault();
    setDragOverDay(null);
    const payload = readDragPayload(e);
    if (!payload) return;
    const hour = snappedHourFromEvent(e);
    const dk = dateKey(d);
    if (payload.type === "preset" && onDropPreset) onDropPreset(payload.presetId, dk, hour);
    else if (payload.type === "event" && onMoveEvent) onMoveEvent(payload.eventId, dk, hour);
  }

  function handleEventDrop(e, targetEvent, d) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);
    const payload = readDragPayload(e);
    if (!payload) return;
    if (payload.type === "event" && onSwapEvents) {
      if (payload.eventId !== targetEvent.id) onSwapEvents(payload.eventId, targetEvent.id);
    } else if (payload.type === "preset" && onDropPreset) {
      // Dropped a preset directly onto an existing event — schedule it at
      // that event's start time rather than requiring pixel-perfect aim.
      onDropPreset(payload.presetId, dateKey(d), targetEvent.start);
    }
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto px-4 py-3">
      <div style={{ minWidth: 720 }}>
        <div className="flex" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
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

        <div className="flex">
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
                style={{
                  height: gridHeight,
                  borderLeft: `1px solid ${COLORS.line}`,
                  background: dragOverDay === dk ? "rgba(31,61,46,0.06)" : "transparent",
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rawHour = DAY_START_HOUR + (e.clientY - rect.top) / HOUR_HEIGHT_PX;
                  onSlotClick(d, Math.round(rawHour * 4) / 4);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverDay(dk)}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setDragOverDay(null);
                }}
                onDrop={(e) => handleColumnDrop(e, d)}
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
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("application/json", JSON.stringify({ type: "event", eventId: ev.id }));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => handleEventDrop(e, ev, d)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev, d);
                      }}
                      className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing"
                      style={{
                        top,
                        height,
                        background: ev.isSleep ? COLORS.sleep : ev.done ? "#F4F3EE" : COLORS.panel,
                        border: `1px solid ${ev.isSleep ? COLORS.sleep : COLORS.line}`,
                        borderLeft: `3px solid ${ev.isSleep ? COLORS.sleep : goalColor(ev.goalId)}`,
                        opacity: ev.done && !ev.isSleep ? 0.6 : 1,
                        color: ev.isSleep ? "#E7E9E3" : COLORS.ink,
                      }}
                    >
                      <div className="text-[11px] font-medium truncate" style={{ textDecoration: ev.done && !ev.isSleep ? "line-through" : "none" }}>
                        {ev.title}
                      </div>
                      {height > 30 && (
                        <div className="font-mono text-[9px]" style={{ color: ev.isSleep ? "#9BA39A" : COLORS.inkFaint }}>
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
    </div>
  );
}

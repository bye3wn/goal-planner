import React from "react";
import { Plus } from "lucide-react";
import { COLORS, HOURS, HOUR_HEIGHT_PX, DAY_START_HOUR } from "../../constants/theme";
import { formatHour } from "../../utils/date";
import EventBlock from "./EventBlock";

// Google Calendar-style day grid: fixed-height hourlines, events absolutely
// positioned and sized by duration rather than one item per row. Clicking
// empty space opens the item modal pre-filled with the clicked time;
// clicking an event opens it for editing.
export default function CalendarGrid({ events, goalColor, onDrop, onDragStartEvent, onSlotClick, onEventClick }) {
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX;

  function handleGridClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawHour = DAY_START_HOUR + offsetY / HOUR_HEIGHT_PX;
    const snapped = Math.round(rawHour * 2) / 2; // snap to nearest 30 min
    onSlotClick(Math.max(DAY_START_HOUR, Math.min(HOURS[HOURS.length - 1], snapped)));
  }

  function handleDrop(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawHour = DAY_START_HOUR + offsetY / HOUR_HEIGHT_PX;
    const snapped = Math.round(rawHour * 2) / 2;
    onDrop(Math.max(DAY_START_HOUR, Math.min(HOURS[HOURS.length - 1], snapped)));
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-2xl flex">
        {/* Hour labels */}
        <div className="w-16 flex-shrink-0" style={{ height: gridHeight }}>
          {HOURS.map((h) => (
            <div key={h} className="font-mono text-[11px] text-right pr-3" style={{ height: HOUR_HEIGHT_PX, color: COLORS.inkFaint, transform: "translateY(-6px)" }}>
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Grid + events */}
        <div
          className="relative flex-1 cursor-pointer"
          style={{ height: gridHeight }}
          onClick={handleGridClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {HOURS.map((h, idx) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start justify-end group"
              style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX, borderTop: `1px solid ${COLORS.line}` }}
            >
              <Plus
                size={13}
                color={COLORS.inkFaint}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 mr-1"
              />
            </div>
          ))}

          {events.map((ev) => (
            <EventBlock
              key={ev.id}
              event={ev}
              color={goalColor(ev.goalId)}
              dayStartHour={DAY_START_HOUR}
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStartEvent(ev.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

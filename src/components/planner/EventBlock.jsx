import React from "react";
import { Repeat } from "lucide-react";
import { COLORS, HOUR_HEIGHT_PX } from "../../constants/theme";
import { formatTime } from "../../utils/date";

// Absolutely positioned within the grid — top and height are computed from
// start/duration so the block's size visually matches how long it takes,
// the way Google Calendar renders events.
export default function EventBlock({ event, color, dayStartHour, onDragStart, onClick }) {
  const top = (event.start - dayStartHour) * HOUR_HEIGHT_PX;
  const height = Math.max(22, event.duration * HOUR_HEIGHT_PX - 2);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="absolute left-1 right-1 rounded-md px-2 py-1 cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        top,
        height,
        background: event.done ? "#F4F3EE" : COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `3px solid ${color}`,
        opacity: event.done ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-1">
        <span
          className="text-xs font-medium truncate flex-1"
          style={{ textDecoration: event.done ? "line-through" : "none" }}
        >
          {event.title}
        </span>
        {event.templateId && <Repeat size={11} color={COLORS.inkFaint} className="flex-shrink-0" />}
      </div>
      {height > 34 && (
        <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
          {formatTime(event.start)}
        </span>
      )}
    </div>
  );
}

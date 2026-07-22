import React from "react";
import { Repeat } from "lucide-react";
import { COLORS, HOUR_HEIGHT_PX } from "../../constants/theme";
import { formatTime } from "../../utils/date";

// Absolutely positioned within the grid — top and height are computed from
// start/duration so the block's size visually matches how long it takes.
// Dragging is pointer-based (not native HTML5 DnD) so the parent grid can
// track motion continuously and animate other events out of the way live.
export default function EventBlock({ event, color, dayStartHour, isDragging, onPointerDownEvent }) {
  const top = (event.start - dayStartHour) * HOUR_HEIGHT_PX;
  const height = Math.max(22, event.duration * HOUR_HEIGHT_PX - 2);

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDownEvent(e, event, top);
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden select-none"
      style={{
        top,
        height,
        background: event.done ? "#F4F3EE" : COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `3px solid ${color}`,
        opacity: event.done ? 0.6 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 8px 20px rgba(35,41,32,0.18)" : "none",
        zIndex: isDragging ? 20 : 1,
        // The dragged block tracks the pointer instantly; everything else
        // (including the dragged one on drop) eases into its new slot.
        transition: isDragging ? "none" : "top 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium truncate flex-1" style={{ textDecoration: event.done ? "line-through" : "none" }}>
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

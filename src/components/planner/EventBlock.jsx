import React from "react";
import { Repeat, ListChecks, Moon } from "lucide-react";
import { COLORS, HOUR_HEIGHT_PX } from "../../constants/theme";
import { formatTime } from "../../utils/date";

// Absolutely positioned within the grid — top and height are computed from
// start/duration so the block's size visually matches how long it takes.
// Dragging is pointer-based (not native HTML5 DnD) so the parent grid can
// track motion continuously and animate other events out of the way live.
export default function EventBlock({ event, color, dayStartHour, isDragging, linkedStats, onPointerDownEvent }) {
  const top = (event.start - dayStartHour) * HOUR_HEIGHT_PX;
  const height = Math.max(22, event.duration * HOUR_HEIGHT_PX - 2);
  const textColor = event.isSleep ? "#E7E9E3" : COLORS.ink;
  const faintColor = event.isSleep ? "#9BA39A" : COLORS.inkFaint;

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
        background: event.isSleep ? COLORS.sleep : event.done ? "#F4F3EE" : COLORS.panel,
        border: `1px solid ${event.isSleep ? COLORS.sleep : COLORS.line}`,
        borderLeft: event.isSleep ? `3px solid ${COLORS.sleep}` : `3px solid ${color}`,
        opacity: event.done && !event.isSleep ? 0.6 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 8px 20px rgba(35,41,32,0.18)" : "none",
        zIndex: isDragging ? 20 : 1,
        color: textColor,
        // The dragged block tracks the pointer instantly; everything else
        // (including the dragged one on drop) eases into its new slot.
        transition: isDragging ? "none" : "top 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div className="flex items-center gap-1">
        {event.isSleep && <Moon size={11} className="flex-shrink-0" />}
        <span className="text-xs font-medium truncate flex-1" style={{ textDecoration: event.done && !event.isSleep ? "line-through" : "none" }}>
          {event.title}
        </span>
        {event.templateId && !event.isSleep && <Repeat size={11} color={faintColor} className="flex-shrink-0" />}
      </div>
      {height > 34 && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: faintColor }}>
            {formatTime(event.start)}
          </span>
          {linkedStats && linkedStats.total > 0 && (
            <span className="flex items-center gap-0.5 font-mono text-[10px]" style={{ color: faintColor }}>
              <ListChecks size={10} /> {linkedStats.done}/{linkedStats.total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

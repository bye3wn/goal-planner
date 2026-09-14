import React from "react";
import { Repeat, ListChecks, Moon, MapPin, Lock, AlignLeft, Car, Circle, CheckCircle2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { formatTime } from "../../utils/date";
import { readDragPayload } from "../../utils/dnd";

const MAX_VISIBLE_TASK_CHIPS = 3;

// Absolutely positioned within the grid — top/height are computed by the
// PARENT grid (see scheduling.layoutEventBlocks) rather than here, since
// getting them right requires knowing about neighboring events: a short
// event still needs a minimum height to stay legible, but that floor has
// to be capped at whatever room is actually free before the next event
// starts, or it visually bleeds into it even though the real data doesn't
// overlap at all. zoom is passed alongside purely for scaling text/icons —
// position and size are already baked into top/height by the time they get
// here.
//
// linkedTasks (the task objects this event's linkedTaskIds point to, not
// just a count) render as small draggable chips once there's enough room —
// dragging one onto a DIFFERENT event reassigns it there via onAssignTask
// (see usePlanner.assignTaskToEvent), which is how a task gets "grabbed
// from one event to another." Each chip stops both pointerdown and
// dragstart from bubbling to this block's own handlers below, since
// without that, starting a drag on a chip would ALSO kick off this
// block's own pointer-based reschedule drag (same mousedown, two
// unrelated drag systems reacting to it) and/or overwrite the chip's
// dataTransfer payload with this event's own "move me" payload.
//
// Dragging is pointer-based (not native HTML5 DnD) so the parent grid can
// track motion continuously and animate other events out of the way live.
// Locked events (fixed-time — a class, a meeting) never start a drag; the
// grid's push-layout math also keeps everything else from landing on them.
export default function EventBlock({ event, color, top, height, zoom = 1, isDragging, linkedTasks, onPointerDownEvent, onEventClick, onAssignTask }) {
  const textColor = event.isSleep ? "#E7E9E3" : COLORS.ink;
  const faintColor = event.isSleep ? "#9BA39A" : COLORS.inkFaint;
  // Scales gently with zoom (clamped) so zoomed-in events read as visibly
  // bigger/easier to read, not just taller.
  const titleSize = Math.round(Math.min(15, Math.max(11, 12 * zoom)));
  const tasks = linkedTasks || [];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        if (event.locked) return;
        onPointerDownEvent(e, event, top);
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Locked events skip the pointer-drag machinery entirely (see
        // onPointerDown above), so they never get a drag session whose
        // pointerup would normally open the edit modal on a non-drag
        // click — handle that click directly instead.
        if (event.locked) onEventClick(event);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const payload = readDragPayload(e);
        if (payload?.type === "task" && onAssignTask) onAssignTask(payload.taskId, event.id);
      }}
      className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden select-none"
      style={{
        top,
        height,
        background: event.isTransit
          ? `repeating-linear-gradient(135deg, ${COLORS.panel}, ${COLORS.panel} 5px, ${COLORS.canvas} 5px, ${COLORS.canvas} 10px)`
          : event.isSleep
          ? COLORS.sleep
          : event.done
          ? "#F4F3EE"
          : COLORS.panel,
        border: `1px ${event.isTransit ? "dashed" : "solid"} ${event.isSleep ? COLORS.sleep : COLORS.line}`,
        borderLeft: event.isSleep ? `3px solid ${COLORS.sleep}` : `3px ${event.isTransit ? "dashed" : "solid"} ${event.isTransit ? COLORS.inkFaint : color}`,
        opacity: event.done && !event.isSleep ? 0.6 : 1,
        cursor: event.locked ? "default" : isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 8px 20px rgba(35,41,32,0.18)" : "none",
        zIndex: isDragging ? 20 : 1,
        color: textColor,
        // The dragged block tracks the pointer instantly; everything else
        // (including the dragged one on drop) eases into its new slot.
        transition: isDragging ? "none" : "top 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div className="flex items-center gap-1">
        {event.isSleep && <Moon size={Math.round(11 * zoom)} className="flex-shrink-0" />}
        {event.isTransit && <Car size={Math.round(11 * zoom)} color={faintColor} className="flex-shrink-0" />}
        <span
          className="font-medium truncate flex-1"
          style={{ fontSize: titleSize, textDecoration: event.done && !event.isSleep ? "line-through" : "none" }}
        >
          {event.title}
        </span>
        {event.locked && <Lock size={10} color={faintColor} className="flex-shrink-0" />}
        {event.templateId && !event.isSleep && <Repeat size={11} color={faintColor} className="flex-shrink-0" />}
      </div>
      {height > 34 && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: faintColor }}>
            {formatTime(event.start)}
          </span>
          {/* Below the chip-list threshold, just show the fraction — once
              there's enough room the individual chips below make this
              redundant. */}
          {tasks.length > 0 && height <= 60 && (
            <span className="flex items-center gap-0.5 font-mono text-[10px]" style={{ color: faintColor }}>
              <ListChecks size={10} /> {doneCount}/{tasks.length}
            </span>
          )}
        </div>
      )}
      {height > 50 && event.location && (
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} color={faintColor} className="flex-shrink-0" />
          <span className="text-[10px] truncate" style={{ color: faintColor }}>
            {event.location}
          </span>
        </div>
      )}
      {/* Only surfaces once there's enough room to not just be clutter —
          i.e. zoomed in far enough on a long-enough event. */}
      {height > 90 && event.description && (
        <div className="flex items-start gap-1 mt-1">
          <AlignLeft size={9} color={faintColor} className="flex-shrink-0 mt-0.5" />
          <span className="text-[10px] line-clamp-2" style={{ color: faintColor }}>
            {event.description}
          </span>
        </div>
      )}
      {/* Individual draggable task chips — only once there's real room for
          them; below that the fraction badge above covers it. Each one can
          be dragged straight to a different event to reassign it there. */}
      {height > 60 && tasks.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-1">
          {tasks.slice(0, MAX_VISIBLE_TASK_CHIPS).map((t) => (
            <div
              key={t.id}
              draggable
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("application/json", JSON.stringify({ type: "task", taskId: t.id }));
              }}
              className="flex items-center gap-1 rounded px-1 cursor-grab"
              style={{ background: "rgba(0,0,0,0.04)" }}
              title="Drag to move this task to another event"
            >
              {t.done ? <CheckCircle2 size={9} color={faintColor} /> : <Circle size={9} color={faintColor} />}
              <span className="text-[10px] truncate" style={{ color: faintColor, textDecoration: t.done ? "line-through" : "none" }}>
                {t.title}
              </span>
            </div>
          ))}
          {tasks.length > MAX_VISIBLE_TASK_CHIPS && (
            <span className="text-[9px]" style={{ color: faintColor }}>
              +{tasks.length - MAX_VISIBLE_TASK_CHIPS} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

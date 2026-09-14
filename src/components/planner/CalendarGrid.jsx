import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Car } from "lucide-react";
import { COLORS, HOURS, HOUR_HEIGHT_PX, DAY_START_HOUR, DAY_END_HOUR } from "../../constants/theme";
import { formatHour, formatTime, formatDuration } from "../../utils/date";
import { snapToQuarterHour, computePushLayout, layoutEventBlocks, findTransitGaps } from "../../utils/scheduling";
import EventBlock from "./EventBlock";

// A small pixel threshold before a pointerdown-then-move counts as a drag
// rather than a click. Below this, releasing opens the edit modal instead.
const DRAG_THRESHOLD_PX = 4;

// The day now spans all 24 hours, so on first render we scroll to a
// reasonable starting point instead of dropping you at midnight.
const DEFAULT_SCROLL_HOUR = 7;

// The floor every event block gets before scaling with zoom — see
// scheduling.layoutEventBlocks for why this has to be capped against
// whatever room is actually free before the next event.
const MIN_EVENT_HEIGHT_PX = 22;

// Google Calendar-style day grid. Dragging an event tracks the pointer
// continuously (not native HTML5 DnD), snaps to 15-minute increments, and
// live-previews a "push everything below out of the way" layout so you can
// see exactly where things will land before you let go.
//
// zoom is a multiplier on HOUR_HEIGHT_PX (see theme.ZOOM_LEVELS) — every
// pixel measurement in this component is derived from the resulting
// hourHeight rather than the fixed constant, so zooming in/out widens or
// narrows the hour rows AND scales event blocks (and, via EventBlock's own
// height thresholds, how much detail they show) together.
export default function CalendarGrid({ events, dayTasks, goalColor, onRescheduleEvents, onSlotClick, onEventClick, onAddTransit, onAssignTask, zoom = 1 }) {
  const gridRef = useRef(null);
  const scrollRef = useRef(null);
  const hourHeight = HOUR_HEIGHT_PX * zoom;
  const gridHeight = HOURS.length * hourHeight;

  // On mount, start at a reasonable hour instead of dropping you at
  // midnight. On every later change (only zoom changes hourHeight after
  // mount), rescale the scroll position by the same ratio instead of
  // jumping back to DEFAULT_SCROLL_HOUR, so zooming keeps roughly the same
  // hours in view rather than relocating you.
  const prevHourHeightRef = useRef(hourHeight);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevHourHeightRef.current === hourHeight) {
      el.scrollTop = DEFAULT_SCROLL_HOUR * hourHeight;
    } else {
      el.scrollTop *= hourHeight / prevHourHeightRef.current;
    }
    prevHourHeightRef.current = hourHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourHeight]);

  // drag: { id, duration, pointerOffsetY, startClientY, currentStart, moved }
  const [drag, setDrag] = useState(null);

  // The browser fires a native "click" right after pointerup, even when
  // that pointerup ended a drag — and by then `drag` state has already
  // reset to null, so checking `drag` alone doesn't block it. This ref
  // survives that timing gap and suppresses exactly one click after a
  // real drag, which is what was causing a drop to occasionally pop open
  // "create new event" right after.
  const suppressNextClickRef = useRef(false);

  const displayEvents = useMemo(() => {
    if (!drag) return events;
    return computePushLayout(events, drag.id, drag.currentStart, drag.duration);
  }, [events, drag]);

  const eventLayout = useMemo(
    () => layoutEventBlocks(displayEvents, { hourHeight, dayStartHour: DAY_START_HOUR, minHeightPx: MIN_EVENT_HEIGHT_PX, zoom }),
    [displayEvents, hourHeight, zoom]
  );

  // Gaps worth offering an "add transit" shortcut for — computed from the
  // stable `events` (not the live drag preview) and hidden entirely while
  // dragging, so the affordance doesn't flicker in and out as a dragged
  // event temporarily opens and closes gaps on its way to a drop point.
  const transitGaps = useMemo(() => (drag ? [] : findTransitGaps(events)), [events, drag]);

  function clientYToHour(clientY) {
    const rect = gridRef.current.getBoundingClientRect();
    return DAY_START_HOUR + (clientY - rect.top) / hourHeight;
  }

  function handleEventPointerDown(e, event, blockTopPx) {
    const rect = gridRef.current.getBoundingClientRect();
    const pointerOffsetY = e.clientY - rect.top - blockTopPx;
    gridRef.current.setPointerCapture(e.pointerId);
    setDrag({
      id: event.id,
      pointerId: e.pointerId,
      duration: event.duration,
      pointerOffsetY,
      startClientY: e.clientY,
      currentStart: event.start,
      moved: false,
    });
  }

  function handlePointerMove(e) {
    if (!drag) return;
    const movedPx = Math.abs(e.clientY - drag.startClientY);
    const rect = gridRef.current.getBoundingClientRect();
    const topPx = e.clientY - rect.top - drag.pointerOffsetY;
    const rawHour = DAY_START_HOUR + topPx / hourHeight;
    const snapped = Math.max(DAY_START_HOUR, Math.min(DAY_END_HOUR - 0.25, snapToQuarterHour(rawHour)));
    setDrag((d) => (d ? { ...d, currentStart: snapped, moved: d.moved || movedPx > DRAG_THRESHOLD_PX } : d));
  }

  function handlePointerUp() {
    if (!drag) return;
    gridRef.current?.releasePointerCapture(drag.pointerId);
    // setPointerCapture means the browser's native "click" that follows
    // this pointerup targets the grid itself, not the event block the
    // pointerdown actually started on — so it always needs suppressing
    // here, not just after a real drag. Without this, a plain click on an
    // event opened its edit modal via onEventClick below, and then that
    // phantom grid click immediately fired handleGridClick right after,
    // overwriting it with a brand new "create event" modal.
    suppressNextClickRef.current = true;
    if (drag.moved) {
      onRescheduleEvents(computePushLayout(events, drag.id, drag.currentStart, drag.duration));
    } else {
      const original = events.find((ev) => ev.id === drag.id);
      if (original) onEventClick(original);
    }
    setDrag(null);
  }

  function handleGridClick(e) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (drag) return; // a drag's pointerup already handled this
    const snapped = Math.max(DAY_START_HOUR, Math.min(DAY_END_HOUR - 0.25, snapToQuarterHour(clientYToHour(e.clientY))));
    onSlotClick(snapped);
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
      <div className="max-w-2xl flex">
        {/* Hour labels */}
        <div className="w-16 flex-shrink-0" style={{ height: gridHeight }}>
          {HOURS.map((h) => (
            <div key={h} className="font-mono text-[11px] text-right pr-3" style={{ height: hourHeight, color: COLORS.inkFaint, transform: "translateY(-6px)" }}>
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Grid + events */}
        <div
          ref={gridRef}
          className="relative flex-1 cursor-pointer"
          style={{ height: gridHeight }}
          onClick={handleGridClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          // A task dragged from the tasks panel can only be dropped ONTO an
          // event (see EventBlock's own onDrop) — dropping it on empty grid
          // space here is a no-op rather than an assignment. Still needs
          // preventDefault so the browser doesn't fall back to its default
          // drop behavior (e.g. trying to navigate to the dragged JSON text).
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          {HOURS.map((h, idx) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start justify-end group"
              style={{ top: idx * hourHeight, height: hourHeight, borderTop: `1px solid ${COLORS.line}` }}
            >
              <Plus size={13} color={COLORS.inkFaint} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 mr-1" />
            </div>
          ))}

          {eventLayout.map(({ event: ev, top, height }) => {
            const linkedTasks = ev.linkedTaskIds?.length
              ? (dayTasks || []).filter((t) => ev.linkedTaskIds.includes(t.id))
              : [];
            return (
              <EventBlock
                key={ev.id}
                event={ev}
                color={goalColor(ev.goalId)}
                top={top}
                height={height}
                zoom={zoom}
                isDragging={drag?.id === ev.id}
                linkedTasks={linkedTasks}
                onPointerDownEvent={handleEventPointerDown}
                onEventClick={onEventClick}
                onAssignTask={onAssignTask}
              />
            );
          })}

          {/* "Add transit" shortcut — one per gap between two events that's
              long enough to plausibly be a commute (see findTransitGaps). A
              small pill centered in the gap rather than a button spanning
              its whole height: opacity-0-until-hover still leaves it fully
              clickable at all times (invisible elements aren't removed from
              hit-testing), so covering the ENTIRE gap meant a normal
              click-to-create-event anywhere in a long gap silently hit this
              instead. Keeping it small confines that to one deliberate spot
              instead of the whole gap. stopPropagation keeps a click here
              from also triggering the grid's click-to-create handler. */}
          {onAddTransit &&
            transitGaps.map((gap) => {
              const gapPx = gap.duration * hourHeight;
              const MIN_GAP_PX = 14;
              if (gapPx < MIN_GAP_PX) return null;
              const pillHeight = Math.min(22, gapPx - 2);
              const gapTop = (gap.start - DAY_START_HOUR) * hourHeight;
              return (
                <button
                  key={`gap-${gap.start}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTransit(gap.start, gap.duration);
                  }}
                  className="absolute left-8 right-8 flex items-center justify-center gap-1.5 rounded-full overflow-hidden opacity-0 hover:opacity-100 transition-opacity"
                  style={{
                    top: gapTop + gapPx / 2 - pillHeight / 2,
                    height: pillHeight,
                    background: COLORS.panel,
                    border: `1px dashed ${COLORS.inkFaint}`,
                    boxShadow: "0 1px 4px rgba(35,41,32,0.12)",
                  }}
                  title={`Add ${formatDuration(gap.duration)} of transit time`}
                >
                  <Car size={12} color={COLORS.inkFaint} className="flex-shrink-0" />
                  <span className="text-[11px] font-medium truncate" style={{ color: COLORS.inkFaint }}>
                    Add transit · {formatDuration(gap.duration)}
                  </span>
                </button>
              );
            })}

          {/* Live time readout while dragging, so it's clear exactly where it'll
              land — needs a z-index above every EventBlock (dragged one included,
              which uses 20) or it gets hidden behind whatever it's dragged near. */}
          {drag && (
            <div
              className="absolute right-2 font-mono text-[11px] px-2 py-0.5 rounded pointer-events-none"
              style={{
                top: (drag.currentStart - DAY_START_HOUR) * hourHeight - 20,
                background: COLORS.forest,
                color: "#fff",
                zIndex: 30,
              }}
            >
              {formatTime(drag.currentStart)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

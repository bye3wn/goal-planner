import React, { useRef, useEffect, useState } from "react";
import { Lock, Car, Circle, CheckCircle2 } from "lucide-react";
import { COLORS, HOURS, HOUR_HEIGHT_PX, DAY_START_HOUR } from "../../constants/theme";
import { formatHour, formatTime, formatDuration, dateKey } from "../../utils/date";
import { isToday } from "../../utils/calendarRange";
import { snapToQuarterHour, overlapsLocked, layoutEventBlocks, findTransitGaps } from "../../utils/scheduling";
import { readDragPayload } from "../../utils/dnd";

const DEFAULT_SCROLL_HOUR = 7;
const MIN_EVENT_HEIGHT_PX = 18;
// Narrower than the day view's — a column here is only ~90-130px wide, no
// room for a text label, so this just gates whether the icon-only "add
// transit" affordance is worth showing at all at the current zoom.
const MIN_GAP_PX = 10;
const MAX_VISIBLE_TASK_CHIPS = 2;

// A lighter-weight sibling of the day grid: 7 columns instead of 1. Click
// empty space to create, click an event to edit, click a day header to
// drill into that day. Drag-and-drop uses native HTML5 DnD (not the day
// grid's pointer-capture approach) since it needs to track motion across
// columns, not just up and down one: dragging an event block moves it to
// wherever it's dropped (a new day/time if the target is empty space, or a
// swap with whatever event it lands on), and dragging a card in from
// EventPresetsPanel stamps out a new event at the drop point.
//
// Native DnD's dataTransfer payload is only readable at drop time, not
// during dragover — so a continuous drop preview (what you're dragging,
// sized and positioned where it would actually land) needs its own state,
// tracked separately here: `dragGhost` for an event being dragged from
// WITHIN this grid, `draggingPreset` (passed down from App, since
// EventPresetsPanel is a sibling, not a descendant) for one coming from the
// presets list. `hover` is the live snapped drop target, recomputed on
// every dragover. Locked events (fixed-time — a class, a meeting) are
// immovable: they don't start a drag, and a hover that would land on or
// overlap one shows as invalid rather than pretending it'll fit — see
// scheduling.placeWithPush for how everything else routes around them once
// a valid drop actually lands.
//
// One scroll container for both the day-header row and the hour grid (not
// two separate ones) — otherwise scrolling either one horizontally would
// desync the day labels from the columns underneath them. It's sized with
// flex-1 + min-h-0, which only works correctly if THIS component's own
// parent is a real flex container with a bounded height; a plain
// height:auto ancestor makes flex-1 a no-op and the grid overflows its
// box instead of scrolling, which is what caused hours to get clipped.
export default function WeekGrid({
  weekDates,
  allItems,
  goalColor,
  onSlotClick,
  onEventClick,
  onDayHeaderClick,
  onDropPreset,
  onMoveEvent,
  onSwapEvents,
  onAddTransit,
  onAssignTask,
  draggingPreset,
  zoom = 1,
}) {
  const scrollRef = useRef(null);
  const hourHeight = HOUR_HEIGHT_PX * zoom;
  const gridHeight = HOURS.length * hourHeight;
  const titleSize = Math.round(Math.min(13, Math.max(10, 11 * zoom)));

  // The event (if any) currently being dragged FROM this grid.
  const [dragEvent, setDragEvent] = useState(null); // null | { id, duration }
  // Live snapped drop target, updated continuously while dragging over a
  // column — this is what makes the preview a preview instead of a guess.
  const [hover, setHover] = useState(null); // null | { dateKey, hour }

  const ghost = draggingPreset
    ? { id: null, duration: draggingPreset.duration, title: draggingPreset.title }
    : dragEvent;

  const hoverDayEvents = hover ? allItems.filter((i) => i.date === hover.dateKey && i.kind === "event" && i.id !== ghost?.id) : [];
  const hoverInvalid = hover && ghost ? overlapsLocked(hover.hour, ghost.duration, hoverDayEvents) : false;

  // Same reasoning as CalendarGrid: only reset to the default scroll hour
  // on mount, rescale proportionally on every later hourHeight change (i.e.
  // a zoom change) so zooming doesn't relocate you to a different part of
  // the day.
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

  function snappedHourFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawHour = DAY_START_HOUR + (e.clientY - rect.top) / hourHeight;
    return Math.max(DAY_START_HOUR, snapToQuarterHour(rawHour));
  }

  function handleColumnDragOver(e, dk) {
    e.preventDefault();
    const hour = snappedHourFromEvent(e);
    setHover((h) => (h && h.dateKey === dk && h.hour === hour ? h : { dateKey: dk, hour }));
  }

  function finishDrag() {
    setHover(null);
    setDragEvent(null);
  }

  function handleColumnDrop(e, d) {
    e.preventDefault();
    const payload = readDragPayload(e);
    const dk = dateKey(d);
    const hour = snappedHourFromEvent(e);
    if (payload) {
      const dayEvents = allItems.filter((i) => i.date === dk && i.kind === "event" && i.id !== payload.eventId);
      const duration = payload.type === "preset" ? draggingPreset?.duration : dragEvent?.duration;
      const blocked = duration != null && overlapsLocked(hour, duration, dayEvents);
      if (!blocked) {
        if (payload.type === "preset" && onDropPreset) onDropPreset(payload.presetId, dk, hour);
        else if (payload.type === "event" && onMoveEvent) onMoveEvent(payload.eventId, dk, hour);
      }
    }
    finishDrag();
  }

  function handleEventDrop(e, targetEvent, d) {
    e.preventDefault();
    e.stopPropagation();
    const payload = readDragPayload(e);
    if (payload) {
      // Assigning a task doesn't move or reschedule the event it lands on,
      // so it's fine on a locked (fixed-time) event too — only the
      // swap/preset-schedule branches below need to respect locking.
      if (payload.type === "task" && onAssignTask) {
        onAssignTask(payload.taskId, targetEvent.id);
      } else if (!targetEvent.locked) {
        if (payload.type === "event" && onSwapEvents) {
          if (payload.eventId !== targetEvent.id) onSwapEvents(payload.eventId, targetEvent.id);
        } else if (payload.type === "preset" && onDropPreset) {
          // Dropped a preset directly onto an existing event — schedule it
          // at that event's start time rather than requiring pixel-perfect aim.
          onDropPreset(payload.presetId, dateKey(d), targetEvent.start);
        }
      }
    }
    finishDrag();
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
              <div key={h} className="font-mono text-[10px] text-right pr-2" style={{ height: hourHeight, color: COLORS.inkFaint, transform: "translateY(-6px)" }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {weekDates.map((d) => {
            const dk = dateKey(d);
            const dayEvents = allItems.filter((i) => i.date === dk && i.kind === "event");
            // Not date-scoped: a linked task can live on a different day
            // than its event (e.g. dragged across days), so resolving
            // linkedTaskIds has to search every task, not just this day's.
            const linkableTasks = allItems.filter((i) => i.kind === "task");
            const dayEventLayout = layoutEventBlocks(dayEvents, {
              hourHeight,
              dayStartHour: DAY_START_HOUR,
              minHeightPx: MIN_EVENT_HEIGHT_PX,
              zoom,
            });
            const dayTransitGaps = onAddTransit ? findTransitGaps(dayEvents) : [];
            const showGhostHere = ghost && hover && hover.dateKey === dk;
            return (
              <div
                key={dk}
                className="relative flex-1 cursor-pointer"
                style={{
                  height: gridHeight,
                  borderLeft: `1px solid ${COLORS.line}`,
                  background: hover?.dateKey === dk ? "rgba(31,61,46,0.06)" : "transparent",
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rawHour = DAY_START_HOUR + (e.clientY - rect.top) / hourHeight;
                  onSlotClick(d, Math.round(rawHour * 4) / 4);
                }}
                onDragOver={(e) => handleColumnDragOver(e, dk)}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setHover((h) => (h?.dateKey === dk ? null : h));
                }}
                onDrop={(e) => handleColumnDrop(e, d)}
              >
                {HOURS.map((h, idx) => (
                  <div key={h} className="absolute left-0 right-0" style={{ top: idx * hourHeight, borderTop: `1px solid ${COLORS.line}` }} />
                ))}

                {dayEventLayout.map(({ event: ev, top, height }) => {
                  const linkedTasks = ev.linkedTaskIds?.length
                    ? linkableTasks.filter((t) => ev.linkedTaskIds.includes(t.id))
                    : [];
                  const doneCount = linkedTasks.filter((t) => t.done).length;
                  return (
                    <div
                      key={ev.id}
                      draggable={!ev.locked}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("application/json", JSON.stringify({ type: "event", eventId: ev.id }));
                        setDragEvent({ id: ev.id, duration: ev.duration, title: ev.title });
                      }}
                      onDragEnd={finishDrag}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleEventDrop(e, ev, d)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev, d);
                      }}
                      className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden"
                      style={{
                        top,
                        height,
                        background: ev.isTransit
                          ? `repeating-linear-gradient(135deg, ${COLORS.panel}, ${COLORS.panel} 5px, ${COLORS.canvas} 5px, ${COLORS.canvas} 10px)`
                          : ev.isSleep
                          ? COLORS.sleep
                          : ev.done
                          ? "#F4F3EE"
                          : COLORS.panel,
                        border: `1px ${ev.isTransit ? "dashed" : "solid"} ${ev.isSleep ? COLORS.sleep : COLORS.line}`,
                        borderLeft: ev.isSleep
                          ? `3px solid ${COLORS.sleep}`
                          : `3px ${ev.isTransit ? "dashed" : "solid"} ${ev.isTransit ? COLORS.inkFaint : goalColor(ev.goalId)}`,
                        opacity: ev.done && !ev.isSleep ? 0.6 : 1,
                        color: ev.isSleep ? "#E7E9E3" : COLORS.ink,
                        cursor: ev.locked ? "default" : "grab",
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {ev.isTransit && <Car size={10} color={ev.isSleep ? "#9BA39A" : COLORS.inkFaint} className="flex-shrink-0" />}
                        <span
                          className="font-medium truncate flex-1"
                          style={{ fontSize: titleSize, textDecoration: ev.done && !ev.isSleep ? "line-through" : "none" }}
                        >
                          {ev.title}
                        </span>
                        {ev.locked && <Lock size={9} color={ev.isSleep ? "#9BA39A" : COLORS.inkFaint} className="flex-shrink-0" />}
                      </div>
                      {height > 30 && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px]" style={{ color: ev.isSleep ? "#9BA39A" : COLORS.inkFaint }}>
                            {formatTime(ev.start)}
                          </span>
                          {linkedTasks.length > 0 && height <= 45 && (
                            <span className="font-mono text-[9px]" style={{ color: ev.isSleep ? "#9BA39A" : COLORS.inkFaint }}>
                              {doneCount}/{linkedTasks.length}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Individual draggable task chips once there's real
                          room — a week column is narrow, so this needs more
                          height than the day view's equivalent before it's
                          worth showing over the compact fraction above. */}
                      {height > 45 && linkedTasks.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {linkedTasks.slice(0, MAX_VISIBLE_TASK_CHIPS).map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onClick={(e) => e.stopPropagation()}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("application/json", JSON.stringify({ type: "task", taskId: t.id }));
                              }}
                              className="flex items-center gap-0.5 rounded px-0.5 cursor-grab"
                              style={{ background: "rgba(0,0,0,0.04)" }}
                              title="Drag to move this task to another event"
                            >
                              {t.done ? <CheckCircle2 size={8} color={COLORS.inkFaint} /> : <Circle size={8} color={COLORS.inkFaint} />}
                              <span
                                className="text-[9px] truncate"
                                style={{ color: COLORS.inkFaint, textDecoration: t.done ? "line-through" : "none" }}
                              >
                                {t.title}
                              </span>
                            </div>
                          ))}
                          {linkedTasks.length > MAX_VISIBLE_TASK_CHIPS && (
                            <span className="text-[8px]" style={{ color: COLORS.inkFaint }}>
                              +{linkedTasks.length - MAX_VISIBLE_TASK_CHIPS} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Icon-only "add transit" affordance — a week column is too
                    narrow for the day view's text label. A small pill
                    centered in the gap rather than spanning its whole
                    height: opacity-0-until-hover doesn't remove it from
                    hit-testing, so covering the entire gap meant a normal
                    click-to-create-event anywhere in a long gap silently
                    hit this instead — see CalendarGrid's version of this
                    same fix for the full story. */}
                {dayTransitGaps.map((gap) => {
                  const gapPx = gap.duration * hourHeight;
                  if (gapPx < MIN_GAP_PX) return null;
                  const pillHeight = Math.min(18, gapPx - 2);
                  const gapTop = (gap.start - DAY_START_HOUR) * hourHeight;
                  return (
                    <button
                      key={`gap-${gap.start}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTransit(d, gap.start, gap.duration);
                      }}
                      className="absolute left-1.5 right-1.5 flex items-center justify-center rounded-full overflow-hidden opacity-0 hover:opacity-100 transition-opacity"
                      style={{
                        top: gapTop + gapPx / 2 - pillHeight / 2,
                        height: pillHeight,
                        background: COLORS.panel,
                        border: `1px dashed ${COLORS.inkFaint}`,
                        boxShadow: "0 1px 4px rgba(35,41,32,0.12)",
                      }}
                      title={`Add ${formatDuration(gap.duration)} of transit time`}
                    >
                      <Car size={10} color={COLORS.inkFaint} />
                    </button>
                  );
                })}

                {showGhostHere && (
                  <div
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden pointer-events-none"
                    style={{
                      top: (hover.hour - DAY_START_HOUR) * hourHeight,
                      height: Math.max(18 * zoom, ghost.duration * hourHeight - 2),
                      background: hoverInvalid ? "rgba(226,102,31,0.15)" : "rgba(31,61,46,0.12)",
                      border: `2px dashed ${hoverInvalid ? COLORS.blaze : COLORS.forest}`,
                      zIndex: 5,
                    }}
                  >
                    <div className="text-[11px] font-medium truncate" style={{ color: hoverInvalid ? COLORS.blaze : COLORS.forest }}>
                      {hoverInvalid ? "Can't drop on a fixed-time event" : ghost.title || "New event"}
                    </div>
                    <div className="font-mono text-[9px]" style={{ color: hoverInvalid ? COLORS.blaze : COLORS.forest }}>
                      {formatTime(hover.hour)} · {formatDuration(ghost.duration)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

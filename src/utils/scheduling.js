// Pure scheduling math for the calendar grid's drag interaction. No React,
// no state — just: given a set of events and where you're dragging one to,
// what should everything look like?

// Snaps a decimal hour to the nearest 15 minutes (0.25h), e.g. 9.83 -> 9.75.
export function snapToQuarterHour(hour) {
  return Math.round(hour * 4) / 4;
}

// Places `draggedId` at `newStart`, then pushes every event that was at or
// after that point later in time so nothing overlaps — like inserting a
// card into a stack. Events entirely before the insertion point are left
// alone; if the insertion point lands inside one of those, the dragged
// event is bumped to right after it instead of overlapping it.
//
// Returns a new array (same events, only `start` changes) in no particular
// order — safe to render directly or diff against the original for saving.
export function computePushLayout(events, draggedId, newStart, duration) {
  const dragged = events.find((e) => e.id === draggedId);
  if (!dragged) return events;

  const others = events.filter((e) => e.id !== draggedId);
  const earlier = others.filter((e) => e.start < newStart).sort((a, b) => a.start - b.start);
  const later = others.filter((e) => e.start >= newStart).sort((a, b) => a.start - b.start);

  let cursor = newStart;
  if (earlier.length) {
    const last = earlier[earlier.length - 1];
    const lastEnd = last.start + last.duration;
    if (cursor < lastEnd) cursor = lastEnd; // can't overlap something already placed before us
  }

  const placedDragged = { ...dragged, start: cursor };

  let pushCursor = cursor + duration;
  const placedLater = later.map((e) => {
    const start = Math.max(e.start, pushCursor);
    pushCursor = start + e.duration;
    return { ...e, start };
  });

  return [...earlier, placedDragged, ...placedLater];
}

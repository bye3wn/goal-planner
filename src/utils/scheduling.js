// Pure scheduling math for the calendar grid's drag interaction. No React,
// no state — just: given a set of events and where you're dragging one to,
// what should everything look like?

// Snaps a decimal hour to the nearest 15 minutes (0.25h), e.g. 9.83 -> 9.75.
export function snapToQuarterHour(hour) {
  return Math.round(hour * 4) / 4;
}

// Places `dragged` (an event-shaped object — needs at least start/duration/
// locked) at its own `start` among `others`, then pushes every one of
// `others` that was at or after that point later in time so nothing
// overlaps — like inserting a card into a stack. Events entirely before the
// insertion point are left alone; if the insertion point lands inside one
// of those, the dragged event is bumped to right after it instead of
// overlapping it.
//
// Locked events are immovable obstacles rather than participants in the
// push: they never change position, and nothing (including the dragged
// event itself) is allowed to land on top of one — the push just routes
// around them, jumping the cursor to right after a locked block instead of
// pushing it. That's what "fixed time — can't be changed" means for a
// class or meeting: everything else negotiates around it, it never moves.
//
// Returns a new array (`others` plus the placed dragged event) in no
// particular order — safe to render directly or diff against the original
// for saving. `dragged` does not need to already be a member of `others`
// (it's fine to place a brand-new event that doesn't have an id in the
// list yet).
export function placeWithPush(dragged, others) {
  const earlier = others.filter((e) => e.start < dragged.start).sort((a, b) => a.start - b.start);
  const later = others.filter((e) => e.start >= dragged.start).sort((a, b) => a.start - b.start);
  const lockedEvents = others.filter((e) => e.locked);

  // Nudges `start` forward past any locked event that a block of `duration`
  // starting there would overlap, repeating in case that lands on another
  // locked block right after (back-to-back locked events). Used both for
  // the dragged event's own placement AND for every event it cascades a
  // push onto below — without the latter, an event landing right before a
  // locked one could get pushed just far enough to overlap it instead of
  // routing around it.
  function avoidLocked(start, duration) {
    let s = start;
    let adjusted = true;
    while (adjusted) {
      adjusted = false;
      for (const e of lockedEvents) {
        const lockedEnd = e.start + e.duration;
        if (s < lockedEnd && s + duration > e.start) {
          s = lockedEnd;
          adjusted = true;
        }
      }
    }
    return s;
  }

  let cursor = dragged.start;
  if (earlier.length) {
    const last = earlier[earlier.length - 1];
    const lastEnd = last.start + last.duration;
    if (cursor < lastEnd) cursor = lastEnd; // can't overlap something already placed before us
  }
  cursor = avoidLocked(cursor, dragged.duration);

  const placedDragged = { ...dragged, start: cursor };

  let pushCursor = cursor + dragged.duration;
  const placedLater = later.map((e) => {
    if (e.locked) {
      // Doesn't move, but still occupies time — later pushes must clear it.
      pushCursor = Math.max(pushCursor, e.start + e.duration);
      return e;
    }
    const start = avoidLocked(Math.max(e.start, pushCursor), e.duration);
    pushCursor = start + e.duration;
    return { ...e, start };
  });

  return [...earlier, placedDragged, ...placedLater];
}

// Convenience wrapper for the day view's live drag preview, where the
// dragged event already exists in `events` (looked up by id rather than
// passed directly).
export function computePushLayout(events, draggedId, newStart, duration) {
  const dragged = events.find((e) => e.id === draggedId);
  if (!dragged) return events;
  const others = events.filter((e) => e.id !== draggedId);
  return placeWithPush({ ...dragged, start: newStart, duration }, others);
}

// True if placing an event of `duration` starting at `start` would overlap
// any locked event in `events` — used to reject a drop outright (rather
// than silently displacing it) when it's aimed squarely at a locked block.
export function overlapsLocked(start, duration, events) {
  const end = start + duration;
  return events.some((e) => e.locked && start < e.start + e.duration && end > e.start);
}

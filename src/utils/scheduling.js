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

// Below this, a gap is just the normal small buffer between things — not
// worth offering a "add transit" shortcut for. Above the max, it reads as
// genuinely open/free time rather than a commute between two places.
export const MIN_TRANSIT_GAP_HOURS = 5 / 60;
export const MAX_TRANSIT_GAP_HOURS = 3;

// Finds open stretches between consecutive events (by start time) that are
// long enough to plausibly be "getting from one thing to the next" but not
// so long they're just open time — used to offer a one-click "add transit"
// shortcut in exactly those gaps instead of cluttering every blank part of
// the day. Returns [{ start, duration }, ...] in chronological order.
export function findTransitGaps(events, minHours = MIN_TRANSIT_GAP_HOURS, maxHours = MAX_TRANSIT_GAP_HOURS) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const end = sorted[i].start + sorted[i].duration;
    const nextStart = sorted[i + 1].start;
    const gapDuration = nextStart - end;
    if (gapDuration >= minHours && gapDuration <= maxHours) {
      gaps.push({ start: end, duration: gapDuration });
    }
  }
  return gaps;
}

// Computes each event's on-screen top/height in pixels, sorted by start,
// with one important constraint beyond the obvious duration*hourHeight:
// every block gets a minimum height (minHeightPx, scaled by zoom) so short
// events stay legible instead of collapsing to a hairline — but that floor
// is capped at whatever room is actually available before the NEXT event
// starts. Without that cap, a 10-minute event's enforced minimum height
// (meant for readability) visually extends past its real end time and
// bleeds into whatever comes right after it, even though the underlying
// data has no overlap at all — it only ever looked like one.
export function layoutEventBlocks(events, { hourHeight, dayStartHour, minHeightPx, zoom = 1 }) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  return sorted.map((event, idx) => {
    const top = (event.start - dayStartHour) * hourHeight;
    const natural = event.duration * hourHeight - 2;
    const desired = Math.max(minHeightPx * zoom, natural);
    const next = sorted[idx + 1];
    const available = next ? (next.start - dayStartHour) * hourHeight - top - 1 : Infinity;
    const height = Math.max(4, Math.min(desired, available));
    return { event, top, height };
  });
}

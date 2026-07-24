import { useEffect, useMemo, useState } from "react";
import { seedItemsFor, seedTemplates } from "../data/seed";
import { dateKey } from "../utils/date";
import { getViewDateKeys, shiftByView } from "../utils/calendarRange";
import { makeId } from "../utils/id";

function instanceFromTemplate(template) {
  return {
    id: makeId("i"),
    kind: template.kind,
    title: template.title,
    start: template.start,
    duration: template.duration,
    goalId: template.goalId,
    milestoneId: template.milestoneId,
    contributionAmount: template.contributionAmount,
    templateId: template.id,
    done: false,
    isSleep: template.isSleep || false,
    // Which day's tasks to complete during this event — a fresh empty list
    // each day, since which tasks exist that day is different every time a
    // repeating event regenerates.
    linkedTaskIds: template.kind === "event" ? [] : undefined,
  };
}

// Everything to do with the planner — the current view (day/week/month/
// year), calendar events, checklist tasks, repeating templates, and
// rescheduling — lives here.
//
// Items are stored per calendar date (itemsByDate), same as before — but
// now that week/month/year views show many dates at once, most operations
// (toggle/delete/save) need to find which date an item lives on rather
// than assuming "today", so they search across itemsByDate instead of
// only touching the currently-focused day.
//
// onItemContribution(goalId, milestoneId, delta) is called whenever an item
// tied to a manual-countdown milestone gets checked/unchecked, so App.jsx
// can forward it to useGoals(). Kept as a callback so this hook doesn't
// need to know goals exist.
export function usePlanner({ onItemContribution } = {}) {
  const [view, setView] = useState("day"); // "day" | "week" | "month" | "year"
  const [currentDate, setCurrentDate] = useState(new Date());
  const key = dateKey(currentDate);

  const [templates, setTemplates] = useState(seedTemplates);
  const [itemsByDate, setItemsByDate] = useState(() => ({
    [key]: [...seedItemsFor(key), ...seedTemplates.map(instanceFromTemplate)],
  }));

  const items = itemsByDate[key] || [];
  const events = useMemo(() => items.filter((i) => i.kind === "event"), [items]);
  const tasks = useMemo(() => items.filter((i) => i.kind === "task"), [items]);

  // Every item across every date, each tagged with its date key. Used for
  // milestone-completion math, week/month/year rendering, and the
  // range-aware tasks panel.
  const allItems = useMemo(
    () => Object.entries(itemsByDate).flatMap(([date, arr]) => arr.map((i) => ({ ...i, date }))),
    [itemsByDate]
  );

  // Makes sure every date key in `keys` has a fresh instance of every
  // template whose recurrence includes that date's day of week. Batches
  // everything into one state update regardless of how many dates (so
  // switching to year view doesn't cause 365 separate re-renders).
  function ensureDateRange(keys) {
    setItemsByDate((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of keys) {
        const existing = next[k];
        const dow = new Date(k + "T00:00:00").getDay();
        const haveTemplateIds = new Set((existing || []).map((i) => i.templateId).filter(Boolean));
        const due = templates.filter((t) => t.daysOfWeek.includes(dow) && !haveTemplateIds.has(t.id));
        if (due.length > 0 || !existing) {
          next[k] = [...(existing || []), ...due.map(instanceFromTemplate)];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  // Whenever the visible date or view changes, make sure every date it
  // covers has its repeating items generated.
  useEffect(() => {
    ensureDateRange(getViewDateKeys(currentDate, view));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view, templates]);

  function goToNext() {
    setCurrentDate((d) => shiftByView(d, view, 1));
  }
  function goToPrev() {
    setCurrentDate((d) => shiftByView(d, view, -1));
  }
  function goToToday() {
    setCurrentDate(new Date());
  }
  function jumpToDate(date, nextView) {
    setCurrentDate(date);
    if (nextView) setView(nextView);
  }

  function findDateKeyOf(id) {
    for (const [dk, arr] of Object.entries(itemsByDate)) {
      if (arr.some((i) => i.id === id)) return dk;
    }
    return null;
  }

  function updateItemsAt(dateKeyStr, updater) {
    setItemsByDate((prev) => ({ ...prev, [dateKeyStr]: updater(prev[dateKeyStr] || []) }));
  }

  // repeat: null (one-off) or { daysOfWeek: [0..6] } (recurring on those
  // weekdays — pass all seven for "daily", a subset for "every Monday and
  // Wednesday" etc). linkedTaskIds is only meaningful for events.
  // targetDateKey is which day a NEW item is created on (ignored when
  // editing — edits stay on the item's existing date).
  function saveItem(payload, editingId, targetDateKey = key) {
    const { kind, title, start, duration, goalId, milestoneId, contributionAmount, repeat, linkedTaskIds } = payload;
    if (!title.trim()) return;
    const daysOfWeek = repeat ? repeat.daysOfWeek : null;
    const linked = kind === "event" ? linkedTaskIds || [] : undefined;

    if (editingId) {
      const dk = findDateKeyOf(editingId);
      if (!dk) return;
      const current = itemsByDate[dk].find((i) => i.id === editingId);
      const wasRepeating = !!current?.templateId;
      const base = { kind, title: title.trim(), start, duration, goalId, milestoneId, contributionAmount, linkedTaskIds: linked };
      const templateBase = { kind, title: title.trim(), start, duration, goalId, milestoneId, contributionAmount };

      if (daysOfWeek && !wasRepeating) {
        const template = { id: makeId("tpl"), ...templateBase, daysOfWeek };
        setTemplates((tpls) => [...tpls, template]);
        updateItemsAt(dk, (its) => its.map((i) => (i.id === editingId ? { ...i, ...base, templateId: template.id } : i)));
        return;
      }
      if (daysOfWeek && wasRepeating) {
        setTemplates((tpls) => tpls.map((t) => (t.id === current.templateId ? { ...t, ...templateBase, daysOfWeek } : t)));
        updateItemsAt(dk, (its) => its.map((i) => (i.id === editingId ? { ...i, ...base } : i)));
        return;
      }
      if (!daysOfWeek && wasRepeating) {
        setTemplates((tpls) => tpls.filter((t) => t.id !== current.templateId));
      }
      updateItemsAt(dk, (its) => its.map((i) => (i.id === editingId ? { ...i, ...base, templateId: daysOfWeek ? i.templateId : null } : i)));
      return;
    }

    // Creating new
    const base = { kind, title: title.trim(), start, duration, goalId, milestoneId, contributionAmount };
    if (daysOfWeek) {
      const template = { id: makeId("tpl"), ...base, daysOfWeek };
      setTemplates((tpls) => [...tpls, template]);
      updateItemsAt(targetDateKey, (its) => [...its, instanceFromTemplate(template)]);
      return;
    }
    updateItemsAt(targetDateKey, (its) => [...its, { id: makeId("i"), ...base, linkedTaskIds: linked, templateId: null, done: false }]);
  }

  function toggleItemDone(id) {
    const dk = findDateKeyOf(id);
    if (!dk) return;
    const item = itemsByDate[dk].find((i) => i.id === id);
    if (!item) return;
    const willBeDone = !item.done;
    updateItemsAt(dk, (its) => its.map((i) => (i.id === id ? { ...i, done: willBeDone } : i)));

    if (item.contributionAmount && item.milestoneId && onItemContribution) {
      onItemContribution(item.goalId, item.milestoneId, willBeDone ? item.contributionAmount : -item.contributionAmount);
    }
  }

  function deleteItem(id) {
    const dk = findDateKeyOf(id);
    const item = dk ? itemsByDate[dk].find((i) => i.id === id) : null;
    setItemsByDate((prev) => {
      const next = {};
      for (const [k, arr] of Object.entries(prev)) {
        next[k] = arr
          .filter((i) => i.id !== id)
          .map((i) => (i.linkedTaskIds?.includes(id) ? { ...i, linkedTaskIds: i.linkedTaskIds.filter((tid) => tid !== id) } : i));
      }
      return next;
    });
    if (item?.templateId) {
      setTemplates((tpls) => tpls.filter((t) => t.id !== item.templateId));
    }
  }

  // Applies a full set of {id, start} changes at once, all on the same
  // date — used by the day-view drag interaction, since moving one event
  // can push several others to new times in the same drop. Drag-and-drop
  // only happens within a single day's grid, so this stays day-scoped.
  function rescheduleEvents(updatedEvents, dateKeyStr = key) {
    const startById = new Map(updatedEvents.map((e) => [e.id, e.start]));
    updateItemsAt(dateKeyStr, (its) => its.map((i) => (startById.has(i.id) ? { ...i, start: startById.get(i.id) } : i)));
  }

  // schedule: { [dayOfWeek 0-6]: { bedtime: decimalHour|null, wake: decimalHour|null } }
  // A night's sleep crosses midnight, which the single-day grid can't
  // represent as one block — so each day gets up to two pieces instead:
  // a "went to bed" block from bedtime to midnight that night, and a
  // "woke up" block from midnight to wake time that morning. Rendered
  // dark, they visually read as one continuous stretch across the two
  // adjacent days in week view.
  //
  // Re-saving replaces the whole schedule — old sleep templates (and every
  // instance already generated from them) are removed first so editing
  // your bedtime doesn't leave a stray duplicate schedule behind.
  function saveSleepSchedule(schedule) {
    const oldSleepTemplateIds = new Set(templates.filter((t) => t.isSleep).map((t) => t.id));

    const newTemplates = [];
    for (const [dowStr, { bedtime, wake }] of Object.entries(schedule)) {
      const dow = Number(dowStr);
      if (bedtime != null) {
        newTemplates.push({
          id: makeId("tpl"), kind: "event", title: "Sleep", start: bedtime, duration: 24 - bedtime,
          goalId: null, milestoneId: null, contributionAmount: null, daysOfWeek: [dow], isSleep: true,
        });
      }
      if (wake != null) {
        newTemplates.push({
          id: makeId("tpl"), kind: "event", title: "Sleep", start: 0, duration: wake,
          goalId: null, milestoneId: null, contributionAmount: null, daysOfWeek: [dow], isSleep: true,
        });
      }
    }

    setTemplates((tpls) => [...tpls.filter((t) => !t.isSleep), ...newTemplates]);
    setItemsByDate((prev) => {
      const next = {};
      for (const [k, arr] of Object.entries(prev)) {
        next[k] = arr.filter((i) => !oldSleepTemplateIds.has(i.templateId));
      }
      return next;
    });
  }

  // Reconstructs the current per-weekday schedule from the sleep templates,
  // so the schedule modal can prefill with what's already set.
  function getSleepSchedule() {
    const schedule = {};
    for (const t of templates.filter((t) => t.isSleep)) {
      const dow = t.daysOfWeek[0];
      schedule[dow] = schedule[dow] || {};
      if (t.start === 0) schedule[dow].wake = t.duration;
      else schedule[dow].bedtime = t.start;
    }
    return schedule;
  }

  return {
    view,
    setView,
    currentDate,
    events,
    tasks,
    allItems,
    templates,
    goToNext,
    goToPrev,
    goToToday,
    jumpToDate,
    saveItem,
    toggleItemDone,
    deleteItem,
    rescheduleEvents,
    saveSleepSchedule,
    getSleepSchedule,
  };
}

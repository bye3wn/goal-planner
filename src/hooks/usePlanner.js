import { useMemo, useState } from "react";
import { seedItemsFor, seedTemplates } from "../data/seed";
import { dateKey, addDays } from "../utils/date";
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
  };
}

// Everything to do with the day planner — current date, calendar events,
// checklist tasks, repeating templates, and rescheduling — lives here.
//
// onItemContribution(goalId, milestoneId, delta) is called whenever an item
// tied to a manual-countdown milestone gets checked/unchecked, so App.jsx
// can forward it to useGoals(). Kept as a callback so this hook doesn't
// need to know goals exist.
export function usePlanner({ onItemContribution } = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const key = dateKey(currentDate);

  const [templates, setTemplates] = useState(seedTemplates);
  const [itemsByDate, setItemsByDate] = useState(() => ({
    [key]: [...seedItemsFor(key), ...seedTemplates.map(instanceFromTemplate)],
  }));
  const [draggedId, setDraggedId] = useState(null);

  const items = itemsByDate[key] || [];
  const events = useMemo(() => items.filter((i) => i.kind === "event"), [items]);
  const tasks = useMemo(() => items.filter((i) => i.kind === "task"), [items]);

  // Every item across every date, flattened. Used to compute checklist and
  // daily-until-deadline milestone completion, which depends on subtasks
  // that may live on different days, not just what's visible today.
  const allItems = useMemo(() => Object.values(itemsByDate).flat(), [itemsByDate]);

  // Makes sure a date bucket has a fresh instance of every template whose
  // recurrence includes that date's day of week.
  function ensureDate(k, templateList = templates) {
    const dow = new Date(k + "T00:00:00").getDay();
    setItemsByDate((prev) => {
      const existing = prev[k] || [];
      const haveTemplateIds = new Set(existing.map((i) => i.templateId).filter(Boolean));
      const due = templateList.filter((t) => t.daysOfWeek.includes(dow) && !haveTemplateIds.has(t.id));
      const missing = due.map(instanceFromTemplate);
      if (missing.length === 0 && prev[k]) return prev;
      return { ...prev, [k]: [...existing, ...missing] };
    });
  }

  function goToDay(delta) {
    const next = addDays(currentDate, delta);
    setCurrentDate(next);
    ensureDate(dateKey(next));
  }

  function goToToday() {
    const next = new Date();
    setCurrentDate(next);
    ensureDate(dateKey(next));
  }

  function updateItems(updater) {
    setItemsByDate((prev) => ({ ...prev, [key]: updater(prev[key] || []) }));
  }

  // repeat: null (one-off) or { daysOfWeek: [0..6] } (recurring on those
  // weekdays — pass all seven for "daily", a subset for "every Monday and
  // Wednesday" etc). Single entry point for both creating and saving edits.
  function saveItem(payload, editingId) {
    const { kind, title, start, duration, goalId, milestoneId, contributionAmount, repeat } = payload;
    if (!title.trim()) return;
    const daysOfWeek = repeat ? repeat.daysOfWeek : null;

    if (editingId) {
      const current = items.find((i) => i.id === editingId);
      const wasRepeating = !!current?.templateId;
      const base = { kind, title: title.trim(), start, duration, goalId, milestoneId, contributionAmount };

      if (daysOfWeek && !wasRepeating) {
        const template = { id: makeId("tpl"), ...base, daysOfWeek };
        setTemplates((tpls) => [...tpls, template]);
        updateItems((its) => its.map((i) => (i.id === editingId ? { ...i, ...base, templateId: template.id } : i)));
        return;
      }
      if (daysOfWeek && wasRepeating) {
        // Repeating -> repeating: update the underlying template so future
        // days pick up the new title/time/days-of-week too.
        setTemplates((tpls) => tpls.map((t) => (t.id === current.templateId ? { ...t, ...base, daysOfWeek } : t)));
        updateItems((its) => its.map((i) => (i.id === editingId ? { ...i, ...base } : i)));
        return;
      }
      if (!daysOfWeek && wasRepeating) {
        // Turned repeat off: stop future generation, keep this one instance.
        setTemplates((tpls) => tpls.filter((t) => t.id !== current.templateId));
      }
      updateItems((its) => its.map((i) => (i.id === editingId ? { ...i, ...base, templateId: daysOfWeek ? i.templateId : null } : i)));
      return;
    }

    // Creating new
    const base = { kind, title: title.trim(), start, duration, goalId, milestoneId, contributionAmount };
    if (daysOfWeek) {
      const template = { id: makeId("tpl"), ...base, daysOfWeek };
      setTemplates((tpls) => [...tpls, template]);
      updateItems((its) => [...its, instanceFromTemplate(template)]);
      return;
    }
    updateItems((its) => [...its, { id: makeId("i"), ...base, templateId: null, done: false }]);
  }

  function toggleItemDone(id) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const willBeDone = !item.done;
    updateItems((its) => its.map((i) => (i.id === id ? { ...i, done: willBeDone } : i)));

    if (item.contributionAmount && item.milestoneId && onItemContribution) {
      onItemContribution(item.goalId, item.milestoneId, willBeDone ? item.contributionAmount : -item.contributionAmount);
    }
  }

  function deleteItem(id) {
    const item = items.find((i) => i.id === id);
    updateItems((its) => its.filter((i) => i.id !== id));
    if (item?.templateId) {
      setTemplates((tpls) => tpls.filter((t) => t.id !== item.templateId));
    }
  }

  function rescheduleEvent(id, newStart) {
    updateItems((its) => its.map((i) => (i.id === id ? { ...i, start: newStart } : i)));
  }

  function handleDrop(newStart) {
    if (!draggedId) return;
    rescheduleEvent(draggedId, newStart);
    setDraggedId(null);
  }

  return {
    currentDate,
    events,
    tasks,
    allItems,
    templates,
    goToDay,
    goToToday,
    saveItem,
    toggleItemDone,
    deleteItem,
    draggedId,
    setDraggedId,
    handleDrop,
  };
}

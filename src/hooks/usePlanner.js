import { useMemo, useState } from "react";
import { seedTasksFor, seedTemplates } from "../data/seed";
import { dateKey, addDays } from "../utils/date";
import { makeId } from "../utils/id";
import { HOURS } from "../constants/theme";

function instanceFromTemplate(template) {
  return {
    id: makeId("t"),
    title: template.title,
    hour: template.hour,
    duration: template.duration,
    goalId: template.goalId,
    milestoneId: template.milestoneId,
    contributionAmount: template.contributionAmount,
    templateId: template.id,
    done: false,
  };
}

// Everything to do with the day planner — current date, tasks, repeating
// task templates, and rescheduling via drag & drop — lives here.
//
// onTaskContribution(goalId, milestoneId, delta) is called whenever a task
// tied to a quantity-target milestone gets checked/unchecked, so App.jsx can
// forward it to useGoals(). Kept as a callback instead of importing
// useGoals directly, so this hook doesn't need to know goals exist.
export function usePlanner({ onTaskContribution } = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const key = dateKey(currentDate);

  const [templates, setTemplates] = useState(seedTemplates);
  const [tasksByDate, setTasksByDate] = useState(() => ({
    [key]: [...seedTasksFor(key), ...seedTemplates.map(instanceFromTemplate)],
  }));
  const [draggedId, setDraggedId] = useState(null);

  const tasks = tasksByDate[key] || [];

  // Makes sure a date bucket exists AND has a fresh (unfinished) instance of
  // every current repeating template. Safe to call repeatedly — it only
  // adds what's missing.
  function ensureDate(k, templateList = templates) {
    setTasksByDate((prev) => {
      const existing = prev[k] || [];
      const haveTemplateIds = new Set(existing.map((t) => t.templateId).filter(Boolean));
      const missing = templateList.filter((t) => !haveTemplateIds.has(t.id)).map(instanceFromTemplate);
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

  function updateTasks(updater) {
    setTasksByDate((prev) => ({ ...prev, [key]: updater(prev[key] || []) }));
  }

  // repeat: true turns this into a daily repeating task (creates a template
  // plus today's instance). contributionAmount is optional — set it when
  // this task should count down a quantity-target milestone.
  function addTask({ title, hour, goalId = null, milestoneId = null, duration = 1, repeat = false, contributionAmount = null }) {
    if (!title.trim()) return;

    if (repeat) {
      const template = {
        id: makeId("tpl"),
        title: title.trim(),
        hour,
        duration,
        goalId,
        milestoneId,
        contributionAmount,
      };
      setTemplates((tpls) => [...tpls, template]);
      updateTasks((ts) => [...ts, instanceFromTemplate(template)]);
      return;
    }

    updateTasks((ts) => [
      ...ts,
      {
        id: makeId("t"),
        title: title.trim(),
        hour,
        duration,
        goalId,
        milestoneId,
        contributionAmount,
        templateId: null,
        done: false,
      },
    ]);
  }

  function toggleTaskDone(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const willBeDone = !task.done;
    updateTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: willBeDone } : t)));

    if (task.contributionAmount && task.milestoneId && onTaskContribution) {
      onTaskContribution(task.goalId, task.milestoneId, willBeDone ? task.contributionAmount : -task.contributionAmount);
    }
  }

  function deleteTask(id) {
    updateTasks((ts) => ts.filter((t) => t.id !== id));
  }

  // Removing a repeating task removes the template too, so it stops
  // regenerating on future days (today's instance is left as a normal task).
  function stopRepeating(templateId) {
    setTemplates((tpls) => tpls.filter((t) => t.id !== templateId));
    updateTasks((ts) => ts.map((t) => (t.templateId === templateId ? { ...t, templateId: null } : t)));
  }

  function rescheduleTask(id, newHour) {
    updateTasks((ts) => ts.map((t) => (t.id === id ? { ...t, hour: newHour } : t)));
  }

  function handleDrop(hour) {
    if (!draggedId) return;
    rescheduleTask(draggedId, hour);
    setDraggedId(null);
  }

  const tasksByHour = useMemo(() => {
    const map = {};
    for (const h of HOURS) map[h] = [];
    for (const t of tasks) if (map[t.hour] !== undefined) map[t.hour].push(t);
    return map;
  }, [tasks]);

  // Every task across every date, flattened. Used to compute checklist
  // milestone completion (which depends on subtasks that may live on
  // different days), not just what's visible on the current day.
  const allTasks = useMemo(() => Object.values(tasksByDate).flat(), [tasksByDate]);

  return {
    currentDate,
    tasks,
    tasksByHour,
    allTasks,
    goToDay,
    goToToday,
    addTask,
    toggleTaskDone,
    deleteTask,
    stopRepeating,
    draggedId,
    setDraggedId,
    handleDrop,
  };
}

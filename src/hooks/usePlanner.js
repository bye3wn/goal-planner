import { useMemo, useState } from "react";
import { seedTasksFor } from "../data/seed";
import { dateKey, addDays } from "../utils/date";
import { makeId } from "../utils/id";
import { HOURS } from "../constants/theme";

// Everything to do with the day planner — current date, tasks, and
// rescheduling via drag & drop — lives here.
export function usePlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const key = dateKey(currentDate);

  const [tasksByDate, setTasksByDate] = useState(() => ({ [key]: seedTasksFor(key) }));
  const [draggedId, setDraggedId] = useState(null);

  const tasks = tasksByDate[key] || [];

  function ensureDate(k) {
    setTasksByDate((prev) => (prev[k] ? prev : { ...prev, [k]: [] }));
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

  function addTask({ title, hour, goalId = null, milestoneId = null, duration = 1 }) {
    if (!title.trim()) return;
    updateTasks((ts) => [
      ...ts,
      { id: makeId("t"), title: title.trim(), hour, duration, goalId, milestoneId, done: false },
    ]);
  }

  function toggleTaskDone(id) {
    updateTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id) {
    updateTasks((ts) => ts.filter((t) => t.id !== id));
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

  return {
    currentDate,
    tasks,
    tasksByHour,
    goToDay,
    goToToday,
    addTask,
    toggleTaskDone,
    deleteTask,
    draggedId,
    setDraggedId,
    handleDrop,
  };
}

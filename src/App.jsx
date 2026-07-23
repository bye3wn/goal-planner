import React, { useMemo, useState } from "react";
import { COLORS, FONT_IMPORT_URL } from "./constants/theme";
import { daysBetween, dateKey } from "./utils/date";
import { getWeekDates, getMonthGridDates, getYearMonths } from "./utils/calendarRange";
import { useGoals } from "./hooks/useGoals";
import { usePlanner } from "./hooks/usePlanner";
import Header from "./components/Header";
import Sidebar from "./components/sidebar/Sidebar";
import GoalModal from "./components/sidebar/GoalModal";
import MilestoneModal from "./components/sidebar/MilestoneModal";
import CalendarGrid from "./components/planner/CalendarGrid";
import WeekGrid from "./components/planner/WeekGrid";
import MonthGrid from "./components/planner/MonthGrid";
import YearGrid from "./components/planner/YearGrid";
import TasksPanel from "./components/planner/TasksPanel";
import ItemModal from "./components/planner/ItemModal";

// This file should stay thin: it connects state (from hooks) to UI (from
// components) and holds no logic of its own, with three exceptions:
//   - milestoneStats: needs BOTH goal data and task data, and neither hook
//     knows the other exists on purpose, so the merge happens here.
//   - modal open/edit state: which goal/milestone/item (if any) is being
//     created or edited, plus which DATE a new item targets (relevant once
//     week/month/year views let you create something on a day other than
//     "today").
//   - view-range dates: which exact dates the week/month/year grids need to
//     render, derived from currentDate + view.
export default function App() {
  const {
    goals,
    expanded,
    toggleExpanded,
    addGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addMilestoneProgress,
    goalColor,
  } = useGoals();

  const {
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
  } = usePlanner({ onItemContribution: addMilestoneProgress });

  const [itemModal, setItemModal] = useState(null); // null | { initial, targetDateKey }
  const [goalModal, setGoalModal] = useState(null); // null | { initial }
  const [milestoneModal, setMilestoneModal] = useState(null); // null | { goal, initial }

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthGridDates = useMemo(() => getMonthGridDates(currentDate), [currentDate]);
  const yearMonths = useMemo(() => getYearMonths(currentDate), [currentDate]);

  // Derives every milestone's completion + display label from its subtasks.
  // Three modes, matching what MilestoneModal lets you pick:
  //   checklist -> % of linked subtasks checked off
  //   manual    -> remaining = target.amount - progress (progress moves via
  //                 addMilestoneProgress, driven by task contributionAmount)
  //   daily     -> % of linked subtasks checked off, out of the fixed day
  //                 count captured when the milestone was set to "daily"
  //                 (that count came from the goal's deadline)
  const milestoneStats = useMemo(() => {
    const map = {};
    for (const g of goals) {
      for (const m of g.milestones) {
        if (!m.target) {
          const linked = allItems.filter((i) => i.milestoneId === m.id);
          const total = linked.length;
          const doneCount = linked.filter((i) => i.done).length;
          const pct = total ? Math.round((doneCount / total) * 100) : 0;
          map[m.id] = { done: total > 0 && doneCount === total, label: total === 0 ? "no subtasks yet" : `${pct}% done` };
        } else if (m.target.mode === "manual") {
          const remaining = Math.max(0, m.target.amount - m.progress);
          map[m.id] = { done: remaining === 0, label: remaining === 0 ? "done" : `${remaining} ${m.target.unit} left` };
        } else if (m.target.mode === "daily") {
          const linked = allItems.filter((i) => i.milestoneId === m.id);
          const doneCount = linked.filter((i) => i.done).length;
          if (!g.deadline) {
            map[m.id] = { done: false, label: `${doneCount} days done (no deadline set)` };
          } else {
            const totalDays = Math.max(1, daysBetween(new Date(m.target.startDate), new Date(g.deadline)));
            const pct = Math.min(100, Math.round((doneCount / totalDays) * 100));
            map[m.id] = { done: doneCount >= totalDays, label: `${doneCount}/${totalDays} days (${pct}%)` };
          }
        }
      }
    }
    return map;
  }, [goals, allItems]);

  // Item modal (calendar events + tasks). targetDateKey is which day a NEW
  // item is created on; for edits it's derived from the item's own date so
  // the "tasks during this event" picker in ItemModal shows the right day's
  // tasks even when you opened it from week/month/year view.
  function openCreateEvent(start, targetDateKey = dateKey(currentDate)) {
    setItemModal({ initial: { kind: "event", start, duration: 1 }, targetDateKey });
  }
  function openCreateTask(targetDateKey = dateKey(currentDate)) {
    setItemModal({ initial: { kind: "task" }, targetDateKey });
  }
  function openEditItem(item) {
    const template = item.templateId ? templates.find((t) => t.id === item.templateId) : null;
    const repeatType = template ? (template.daysOfWeek.length === 7 ? "daily" : "custom") : "none";
    setItemModal({
      initial: { ...item, repeatType, daysOfWeek: template?.daysOfWeek || [] },
      targetDateKey: item.date || dateKey(currentDate),
    });
  }
  function handleSaveItem(payload, editingId) {
    saveItem(payload, editingId, itemModal?.targetDateKey);
  }

  // Goal modal
  function openAddGoal() {
    setGoalModal({ initial: null });
  }
  function openEditGoal(goal) {
    setGoalModal({ initial: goal });
  }
  function handleSaveGoal(title, color, deadline, editingId) {
    if (editingId) updateGoal(editingId, { title, color, deadline });
    else addGoal(title, color, deadline);
  }

  // Milestone modal
  function openAddMilestone(goal) {
    setMilestoneModal({ goal, initial: null });
  }
  function openEditMilestone(goal, milestone) {
    setMilestoneModal({ goal, initial: milestone });
  }
  function handleSaveMilestone(goalId, title, mode, amount, unit, editingId) {
    if (editingId) updateMilestone(goalId, editingId, { title, mode, amount, unit });
    else addMilestone(goalId, title, mode, amount, unit);
  }
  function handleAddSubtask(title, contributionAmount) {
    const { goal, initial: milestone } = milestoneModal;
    saveItem(
      { kind: "task", title, start: null, duration: null, goalId: goal.id, milestoneId: milestone.id, contributionAmount, repeat: null },
      undefined,
      dateKey(currentDate)
    );
  }
  function handleEditSubtask(item) {
    setMilestoneModal(null);
    openEditItem(item);
  }

  function jumpToDay(date) {
    jumpToDate(date, "day");
  }

  const dayTasksForModal = itemModal
    ? allItems.filter((i) => i.kind === "task" && i.date === itemModal.targetDateKey)
    : [];

  return (
    <div style={{ background: COLORS.canvas, color: COLORS.ink, fontFamily: "'Inter', sans-serif" }} className="w-full min-h-screen flex flex-col">
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        * { scrollbar-width: thin; }
      `}</style>

      <Header currentDate={currentDate} view={view} onSetView={setView} onPrev={goToPrev} onNext={goToNext} onToday={goToToday} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          goals={goals}
          expanded={expanded}
          milestoneStats={milestoneStats}
          allItems={allItems}
          onToggleExpanded={toggleExpanded}
          onAddGoalClick={openAddGoal}
          onEditGoal={openEditGoal}
          onAddMilestone={openAddMilestone}
          onMilestoneClick={openEditMilestone}
          onToggleSubtaskDone={toggleItemDone}
        />

        {view === "day" && (
          <CalendarGrid
            events={events}
            dayTasks={tasks}
            goalColor={goalColor}
            onRescheduleEvents={rescheduleEvents}
            onSlotClick={openCreateEvent}
            onEventClick={openEditItem}
          />
        )}
        {view === "week" && (
          <WeekGrid
            weekDates={weekDates}
            allItems={allItems}
            goalColor={goalColor}
            onSlotClick={(date, hour) => openCreateEvent(hour, dateKey(date))}
            onEventClick={openEditItem}
            onDayHeaderClick={jumpToDay}
          />
        )}
        {view === "month" && (
          <MonthGrid
            gridDates={monthGridDates}
            currentMonth={currentDate}
            allItems={allItems}
            goalColor={goalColor}
            onDayClick={jumpToDay}
            onEventClick={openEditItem}
          />
        )}
        {view === "year" && (
          <YearGrid
            yearMonths={yearMonths}
            allItems={allItems}
            onDayClick={jumpToDay}
            onMonthClick={(m) => jumpToDate(m, "month")}
          />
        )}

        <TasksPanel
          view={view}
          currentDate={currentDate}
          allItems={allItems}
          goalColor={goalColor}
          onToggleDone={toggleItemDone}
          onTaskClick={openEditItem}
          onAddTask={openCreateTask}
          onJumpToDay={jumpToDay}
        />
      </div>

      <ItemModal
        open={!!itemModal}
        initial={itemModal?.initial}
        goals={goals}
        dayTasks={dayTasksForModal}
        onToggleTaskDone={toggleItemDone}
        onSave={handleSaveItem}
        onDelete={deleteItem}
        onClose={() => setItemModal(null)}
      />

      <GoalModal
        open={!!goalModal}
        initial={goalModal?.initial}
        onSave={handleSaveGoal}
        onDelete={deleteGoal}
        onClose={() => setGoalModal(null)}
      />

      <MilestoneModal
        open={!!milestoneModal}
        goal={milestoneModal?.goal}
        initial={milestoneModal?.initial}
        subtasks={milestoneModal?.initial ? allItems.filter((i) => i.milestoneId === milestoneModal.initial.id) : []}
        onSave={handleSaveMilestone}
        onDelete={deleteMilestone}
        onAddSubtask={handleAddSubtask}
        onToggleSubtaskDone={toggleItemDone}
        onDeleteSubtask={deleteItem}
        onEditSubtask={handleEditSubtask}
        onClose={() => setMilestoneModal(null)}
      />
    </div>
  );
}

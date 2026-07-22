import React, { useMemo, useState } from "react";
import { COLORS, FONT_IMPORT_URL } from "./constants/theme";
import { useGoals } from "./hooks/useGoals";
import { usePlanner } from "./hooks/usePlanner";
import Header from "./components/Header";
import Sidebar from "./components/sidebar/Sidebar";
import GoalModal from "./components/sidebar/GoalModal";
import MilestoneModal from "./components/sidebar/MilestoneModal";
import CalendarGrid from "./components/planner/CalendarGrid";
import TasksPanel from "./components/planner/TasksPanel";
import ItemModal from "./components/planner/ItemModal";

// This file should stay thin: it connects state (from hooks) to UI (from
// components) and holds no logic of its own, with two exceptions:
//   - milestoneStats: needs BOTH goal data and task data, and neither hook
//     knows the other exists on purpose, so the merge happens here.
//   - modal open/edit state: which goal/milestone/item (if any) is being
//     created or edited is UI-only state shared across the sidebar,
//     calendar, and tasks panel.
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
    rescheduleEvents,
  } = usePlanner({ onItemContribution: addMilestoneProgress });

  const [itemModal, setItemModal] = useState(null); // null | { initial }
  const [goalModal, setGoalModal] = useState(null); // null | { initial }
  const [milestoneModal, setMilestoneModal] = useState(null); // null | { goal, initial }

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
          const pct = Math.min(100, Math.round((doneCount / m.target.amount) * 100));
          map[m.id] = { done: doneCount >= m.target.amount, label: `${doneCount}/${m.target.amount} days (${pct}%)` };
        }
      }
    }
    return map;
  }, [goals, allItems]);

  // Item modal (calendar events + tasks)
  function openCreateEvent(start) {
    setItemModal({ initial: { kind: "event", start, duration: 1 } });
  }
  function openCreateTask() {
    setItemModal({ initial: { kind: "task" } });
  }
  function openEditItem(item) {
    const template = item.templateId ? templates.find((t) => t.id === item.templateId) : null;
    const repeatType = template ? (template.daysOfWeek.length === 7 ? "daily" : "custom") : "none";
    setItemModal({ initial: { ...item, repeatType, daysOfWeek: template?.daysOfWeek || [] } });
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

  return (
    <div style={{ background: COLORS.canvas, color: COLORS.ink, fontFamily: "'Inter', sans-serif" }} className="w-full min-h-screen flex flex-col">
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        * { scrollbar-width: thin; }
      `}</style>

      <Header currentDate={currentDate} onPrevDay={() => goToDay(-1)} onNextDay={() => goToDay(1)} onToday={goToToday} />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          goals={goals}
          expanded={expanded}
          milestoneStats={milestoneStats}
          onToggleExpanded={toggleExpanded}
          onAddGoalClick={openAddGoal}
          onEditGoal={openEditGoal}
          onAddMilestone={openAddMilestone}
          onMilestoneClick={openEditMilestone}
        />
        <CalendarGrid
          events={events}
          goalColor={goalColor}
          onRescheduleEvents={rescheduleEvents}
          onSlotClick={openCreateEvent}
          onEventClick={openEditItem}
        />
        <TasksPanel
          tasks={tasks}
          goalColor={goalColor}
          onToggleDone={toggleItemDone}
          onTaskClick={openEditItem}
          onAddTask={openCreateTask}
        />
      </div>

      <ItemModal
        open={!!itemModal}
        initial={itemModal?.initial}
        goals={goals}
        onSave={saveItem}
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
        onSave={handleSaveMilestone}
        onDelete={deleteMilestone}
        onClose={() => setMilestoneModal(null)}
      />
    </div>
  );
}

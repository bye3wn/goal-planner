import React, { useMemo, useState } from "react";
import { COLORS, FONT_IMPORT_URL } from "./constants/theme";
import { useGoals } from "./hooks/useGoals";
import { usePlanner } from "./hooks/usePlanner";
import Header from "./components/Header";
import Sidebar from "./components/sidebar/Sidebar";
import CalendarGrid from "./components/planner/CalendarGrid";
import TasksPanel from "./components/planner/TasksPanel";
import ItemModal from "./components/planner/ItemModal";

// This file should stay thin: it connects state (from hooks) to UI (from
// components) and holds no logic of its own, with two exceptions:
//   - milestoneStats: needs BOTH goal data and task data, and neither hook
//     knows the other exists on purpose, so the merge happens here.
//   - modal open/edit state: which item (if any) is being created/edited is
//     UI-only state that both the grid and the tasks panel need to trigger.
export default function App() {
  const { goals, expanded, toggleExpanded, addGoal, addMilestone, addMilestoneProgress, goalColor } = useGoals();

  const {
    currentDate,
    events,
    tasks,
    allItems,
    goToDay,
    goToToday,
    saveItem,
    toggleItemDone,
    deleteItem,
    setDraggedId,
    handleDrop,
  } = usePlanner({ onItemContribution: addMilestoneProgress });

  const [modalState, setModalState] = useState(null); // null | { initial: {...} }

  const milestoneStats = useMemo(() => {
    const map = {};
    for (const g of goals) {
      for (const m of g.milestones) {
        if (m.target) {
          const remaining = Math.max(0, m.target.amount - m.progress);
          map[m.id] = {
            kind: "countdown",
            done: remaining === 0,
            label: remaining === 0 ? "done" : `${remaining} ${m.target.unit} left`,
          };
        } else {
          const linked = allItems.filter((i) => i.milestoneId === m.id);
          const total = linked.length;
          const doneCount = linked.filter((i) => i.done).length;
          const pct = total ? Math.round((doneCount / total) * 100) : 0;
          map[m.id] = {
            kind: "checklist",
            done: total > 0 && doneCount === total,
            label: total === 0 ? "no subtasks yet" : `${pct}% done`,
          };
        }
      }
    }
    return map;
  }, [goals, allItems]);

  function openCreateEvent(start) {
    setModalState({ initial: { kind: "event", start, duration: 1 } });
  }
  function openCreateTask() {
    setModalState({ initial: { kind: "task" } });
  }
  function openEdit(item) {
    setModalState({ initial: item });
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
          onAddGoal={addGoal}
          onAddMilestone={addMilestone}
        />
        <CalendarGrid
          events={events}
          goalColor={goalColor}
          onDrop={handleDrop}
          onDragStartEvent={setDraggedId}
          onSlotClick={openCreateEvent}
          onEventClick={openEdit}
        />
        <TasksPanel
          tasks={tasks}
          goalColor={goalColor}
          onToggleDone={toggleItemDone}
          onTaskClick={openEdit}
          onAddTask={openCreateTask}
        />
      </div>

      <ItemModal
        open={!!modalState}
        initial={modalState?.initial}
        goals={goals}
        onSave={saveItem}
        onDelete={deleteItem}
        onClose={() => setModalState(null)}
      />
    </div>
  );
}

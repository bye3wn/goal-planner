import React, { useMemo } from "react";
import { COLORS, FONT_IMPORT_URL } from "./constants/theme";
import { useGoals } from "./hooks/useGoals";
import { usePlanner } from "./hooks/usePlanner";
import Header from "./components/Header";
import Sidebar from "./components/sidebar/Sidebar";
import DayPlanner from "./components/planner/DayPlanner";

// This file should stay thin: it connects state (from hooks) to UI (from
// components) and holds no logic of its own. If you find yourself adding
// a useState or a helper function here, it probably belongs in a hook instead.
//
// One exception: milestoneStats below. Whether a milestone is "done" needs
// BOTH goal data (useGoals) and task data (usePlanner), and neither hook
// knows the other exists on purpose — so the merge happens here.
export default function App() {
  const { goals, expanded, toggleExpanded, addGoal, addMilestone, addMilestoneProgress, goalColor } = useGoals();

  const {
    currentDate,
    tasksByHour,
    allTasks,
    goToDay,
    goToToday,
    addTask,
    toggleTaskDone,
    deleteTask,
    stopRepeating,
    setDraggedId,
    handleDrop,
  } = usePlanner({ onTaskContribution: addMilestoneProgress });

  // Derives each milestone's completion state and display label from its
  // subtasks. Milestones are never toggled by hand — this is the single
  // source of truth for "done" everywhere in the sidebar.
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
          const linked = allTasks.filter((t) => t.milestoneId === m.id);
          const total = linked.length;
          const doneCount = linked.filter((t) => t.done).length;
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
  }, [goals, allTasks]);

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
        <DayPlanner
          tasksByHour={tasksByHour}
          goals={goals}
          goalColor={goalColor}
          onDrop={handleDrop}
          onDragStartTask={setDraggedId}
          onToggleTaskDone={toggleTaskDone}
          onDeleteTask={deleteTask}
          onStopRepeating={stopRepeating}
          onAddTask={addTask}
        />
      </div>
    </div>
  );
}

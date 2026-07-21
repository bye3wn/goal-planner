import React from "react";
import { COLORS, FONT_IMPORT_URL } from "./constants/theme";
import { useGoals } from "./hooks/useGoals";
import { usePlanner } from "./hooks/usePlanner";
import Header from "./components/Header";
import Sidebar from "./components/sidebar/Sidebar";
import DayPlanner from "./components/planner/DayPlanner";

// This file should stay thin: it connects state (from hooks) to UI (from
// components) and holds no logic of its own. If you find yourself adding
// a useState or a helper function here, it probably belongs in a hook instead.
export default function App() {
  const { goals, expanded, toggleExpanded, addGoal, addMilestone, toggleMilestone, goalColor } = useGoals();

  const {
    currentDate,
    tasksByHour,
    goToDay,
    goToToday,
    addTask,
    toggleTaskDone,
    deleteTask,
    setDraggedId,
    handleDrop,
  } = usePlanner();

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
          onToggleExpanded={toggleExpanded}
          onAddGoal={addGoal}
          onAddMilestone={addMilestone}
          onToggleMilestone={toggleMilestone}
        />
        <DayPlanner
          tasksByHour={tasksByHour}
          goals={goals}
          goalColor={goalColor}
          onDrop={handleDrop}
          onDragStartTask={setDraggedId}
          onToggleTaskDone={toggleTaskDone}
          onDeleteTask={deleteTask}
          onAddTask={addTask}
        />
      </div>
    </div>
  );
}

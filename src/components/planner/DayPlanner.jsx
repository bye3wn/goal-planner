import React from "react";
import { HOURS } from "../../constants/theme";
import HourRow from "./HourRow";

export default function DayPlanner({
  tasksByHour,
  goals,
  goalColor,
  onDrop,
  onDragStartTask,
  onToggleTaskDone,
  onDeleteTask,
  onAddTask,
}) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-2xl">
        {HOURS.map((hour) => (
          <HourRow
            key={hour}
            hour={hour}
            tasks={tasksByHour[hour] || []}
            goals={goals}
            goalColor={goalColor}
            onDrop={onDrop}
            onDragStartTask={onDragStartTask}
            onToggleTaskDone={onToggleTaskDone}
            onDeleteTask={onDeleteTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </main>
  );
}

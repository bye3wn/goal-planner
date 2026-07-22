import React from "react";
import { Circle, CheckCircle2, Repeat, Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";

// Google Calendar keeps Tasks separate from timed events, in a side list —
// same idea here. Subtasks that feed a milestone (like "apply for 5 jobs")
// live here as checkboxes rather than occupying a slot on the calendar.
export default function TasksPanel({ tasks, goalColor, onToggleDone, onTaskClick, onAddTask }) {
  return (
    <aside className="w-[280px] flex-shrink-0 overflow-y-auto px-5 py-5" style={{ borderLeft: `1px solid ${COLORS.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Tasks
        </h2>
        <button onClick={onAddTask} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add task">
          <Plus size={16} />
        </button>
      </div>

      {tasks.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.inkFaint }}>
          No tasks for today yet.
        </p>
      )}

      <div className="flex flex-col gap-1">
        {tasks.map((t) => {
          const color = goalColor(t.goalId);
          return (
            <div
              key={t.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-md"
              style={{ background: t.done ? "#F4F3EE" : "transparent" }}
            >
              <button onClick={() => onToggleDone(t.id)} className="flex-shrink-0 mt-0.5">
                {t.done ? <CheckCircle2 size={16} color={color} /> : <Circle size={16} color={COLORS.inkFaint} />}
              </button>
              <button onClick={() => onTaskClick(t)} className="flex-1 text-left">
                <span
                  className="text-sm block"
                  style={{
                    color: t.done ? COLORS.inkFaint : COLORS.ink,
                    textDecoration: t.done ? "line-through" : "none",
                  }}
                >
                  {t.title}
                </span>
                {t.contributionAmount ? (
                  <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
                    +{t.contributionAmount}
                  </span>
                ) : null}
              </button>
              {t.templateId && <Repeat size={12} color={COLORS.inkFaint} className="flex-shrink-0 mt-1" />}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

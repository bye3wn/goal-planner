import React, { useState } from "react";
import { Circle, CheckCircle2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { COLORS } from "../../constants/theme";

// Milestone rows are clickable — clicking the row opens MilestoneModal for
// editing/deleting it and managing its subtasks. The small chevron is a
// separate, lighter-weight action: expand in place to see the subtasks
// without leaving the sidebar, and check them off directly.
export default function MilestoneList({ goal, milestoneStats, allItems, onMilestoneClick, onAddMilestone, onToggleSubtaskDone }) {
  const [expandedIds, setExpandedIds] = useState({});

  const doneCount = goal.milestones.filter((m) => milestoneStats[m.id]?.done).length;
  const total = goal.milestones.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="ml-[19px] pl-4 flex flex-col gap-1.5 py-1" style={{ borderLeft: `2px dashed ${COLORS.line}` }}>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
      </div>

      {goal.milestones.map((m) => {
        const stats = milestoneStats[m.id] || { done: false, label: "" };
        const subtasks = allItems.filter((i) => i.milestoneId === m.id);
        const isExpanded = !!expandedIds[m.id];

        return (
          <div key={m.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpandedIds((e) => ({ ...e, [m.id]: !e[m.id] }))}
                className="flex-shrink-0 p-0.5"
                aria-label={isExpanded ? "Hide subtasks" : "Show subtasks"}
              >
                {isExpanded ? <ChevronDown size={12} color={COLORS.inkFaint} /> : <ChevronRight size={12} color={COLORS.inkFaint} />}
              </button>
              <button
                onClick={() => onMilestoneClick(m)}
                className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left rounded-md px-1 -ml-1 hover:bg-black/5 transition-colors"
              >
                {stats.done ? (
                  <CheckCircle2 size={14} color={goal.color} className="flex-shrink-0" />
                ) : (
                  <Circle size={14} color={COLORS.inkFaint} className="flex-shrink-0" />
                )}
                <span
                  className="text-[13px] flex-1 truncate"
                  style={{ color: stats.done ? COLORS.inkFaint : COLORS.ink, textDecoration: stats.done ? "line-through" : "none" }}
                >
                  {m.title}
                </span>
                <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
                  {stats.label}
                </span>
              </button>
            </div>

            {isExpanded && (
              <div className="ml-5 flex flex-col gap-0.5 py-1">
                {subtasks.length === 0 ? (
                  <span className="text-[12px]" style={{ color: COLORS.inkFaint }}>
                    No subtasks yet — click the waypoint to add one.
                  </span>
                ) : (
                  subtasks.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 py-0.5">
                      <button onClick={() => onToggleSubtaskDone(s.id)} className="flex-shrink-0">
                        {s.done ? <CheckCircle2 size={13} color={goal.color} /> : <Circle size={13} color={COLORS.inkFaint} />}
                      </button>
                      <span
                        className="text-[12px] truncate"
                        style={{ color: s.done ? COLORS.inkFaint : COLORS.ink, textDecoration: s.done ? "line-through" : "none" }}
                      >
                        {s.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={() => onAddMilestone(goal.id)}
        className="flex items-center gap-1.5 text-[12px] mt-1 py-0.5"
        style={{ color: COLORS.inkFaint }}
      >
        <Plus size={12} /> Add waypoint
      </button>
    </div>
  );
}

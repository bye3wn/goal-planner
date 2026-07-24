import React, { useMemo, useState } from "react";
import { Circle, CheckCircle2, Plus, ChevronDown, ChevronRight, Repeat } from "lucide-react";
import { COLORS } from "../../constants/theme";

// Milestone rows are clickable — clicking the row opens MilestoneModal for
// editing/deleting it and managing its subtasks. The small chevron is a
// separate, lighter-weight action: expand in place to see the subtasks
// without leaving the sidebar.
//
// rangeDateKeys: which dates count for this preview, driven by whichever
// calendar view is active (a single day, a week, a month, or a year) — a
// repeating subtask collapses into ONE row with a done/total fraction over
// that range, rather than listing every day's instance separately.
export default function MilestoneList({ goal, milestoneStats, allItems, rangeDateKeys, onMilestoneClick, onAddMilestone, onToggleSubtaskDone }) {
  const [expandedIds, setExpandedIds] = useState({});
  const rangeSet = useMemo(() => new Set(rangeDateKeys), [rangeDateKeys]);

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
        const isExpanded = !!expandedIds[m.id];

        // Group this milestone's subtasks within the visible range: every
        // instance of the same repeating task collapses into one row.
        // One-off tasks (templateId null) get their own row each, same as
        // before, since there's only ever one of them anyway.
        const inRange = allItems.filter((i) => i.milestoneId === m.id && rangeSet.has(i.date));
        const groupMap = new Map();
        for (const s of inRange) {
          const groupKey = s.templateId || s.id;
          if (!groupMap.has(groupKey)) groupMap.set(groupKey, { title: s.title, repeating: !!s.templateId, items: [] });
          groupMap.get(groupKey).items.push(s);
        }
        const groups = Array.from(groupMap.values());

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
                {groups.length === 0 ? (
                  <span className="text-[12px]" style={{ color: COLORS.inkFaint }}>
                    No subtasks in this range — click the waypoint to add one.
                  </span>
                ) : (
                  groups.map((g, i) => {
                    if (!g.repeating) {
                      const s = g.items[0];
                      return (
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
                      );
                    }
                    const doneN = g.items.filter((x) => x.done).length;
                    return (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <Repeat size={12} color={COLORS.inkFaint} className="flex-shrink-0" />
                        <span className="text-[12px] truncate flex-1" style={{ color: COLORS.ink }}>
                          {g.title}
                        </span>
                        <span className="font-mono text-[11px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
                          {doneN}/{g.items.length}
                        </span>
                      </div>
                    );
                  })
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

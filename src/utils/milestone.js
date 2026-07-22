// A milestone's completion is NEVER set directly — it's always derived from
// its subtasks. This is the one place that math happens, so both the
// sidebar and any future view (e.g. a goal detail page) stay consistent.
//
// Countdown milestones (m.target set): each subtask carries a numeric
// `amount`; progress is the sum of completed subtasks' amounts, and it's
// done once that reaches the target.
//
// Checklist milestones (m.target is null): done once every subtask is
// checked off. With zero subtasks, it's simply not done yet.
export function milestoneStatus(m) {
  if (m.target) {
    const progress = m.subtasks.filter((s) => s.done).reduce((sum, s) => sum + (s.amount || 1), 0);
    const remaining = Math.max(0, m.target.amount - progress);
    const pct = m.target.amount > 0 ? Math.min(100, Math.round((progress / m.target.amount) * 100)) : 0;
    return {
      kind: "countdown",
      progress,
      remaining,
      pct,
      done: remaining <= 0 && m.target.amount > 0,
      label: `${remaining} ${m.target.unit} left`,
    };
  }

  const total = m.subtasks.length;
  const doneCount = m.subtasks.filter((s) => s.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  return {
    kind: "checklist",
    doneCount,
    total,
    pct,
    done: total > 0 && doneCount === total,
    label: total > 0 ? `${doneCount} of ${total} done` : "No subtasks yet",
  };
}

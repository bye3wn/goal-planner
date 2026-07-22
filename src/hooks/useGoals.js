import { useState } from "react";
import { seedGoals } from "../data/seed";
import { makeId } from "../utils/id";

// Everything to do with goals and their milestones lives here. Components
// never mutate goal state directly — they call these functions.
//
// Milestones are never checked off by hand. They complete themselves based
// on their subtasks (the daily tasks linked to them via milestoneId):
//   - "countdown" milestones (have a target) complete when enough task
//     contributions have accumulated — see addMilestoneProgress.
//   - "checklist" milestones (no target) complete when all their linked
//     tasks are done — computed in App.jsx from live task data, since task
//     data lives in usePlanner, not here.
export function useGoals() {
  const [goals, setGoals] = useState(seedGoals);
  const [expanded, setExpanded] = useState({ g1: true, g2: true, g3: true });

  function toggleExpanded(goalId) {
    setExpanded((e) => ({ ...e, [goalId]: !e[goalId] }));
  }

  function addGoal(title, color) {
    if (!title.trim()) return;
    const id = makeId("g");
    setGoals((gs) => [...gs, { id, title: title.trim(), color, milestones: [] }]);
    setExpanded((e) => ({ ...e, [id]: true }));
    return id;
  }

  // Pass targetAmount/targetUnit to make this a countdown milestone (e.g.
  // 30 "applications"). Leave them empty for a checklist milestone that
  // completes once all its subtasks are done.
  function addMilestone(goalId, title, targetAmount, targetUnit) {
    if (!title.trim()) return;
    const amount = Number(targetAmount);
    const target = amount > 0 ? { amount, unit: (targetUnit || "").trim() || "done" } : null;
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: [
                ...g.milestones,
                { id: makeId("m"), title: title.trim(), target, progress: 0 },
              ],
            }
          : g
      )
    );
  }

  // Adds (or, with a negative delta, removes) progress toward a countdown
  // milestone's target. Called when a contributing task is checked/unchecked.
  // Automatically marks the milestone done once progress reaches the target.
  function addMilestoneProgress(goalId, milestoneId, delta) {
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) => {
                if (m.id !== milestoneId || !m.target) return m;
                const progress = Math.max(0, Math.min(m.target.amount, m.progress + delta));
                return { ...m, progress };
              }),
            }
          : g
      )
    );
  }

  function goalColor(goalId) {
    return goals.find((g) => g.id === goalId)?.color || "#B9B6A6";
  }

  return {
    goals,
    expanded,
    toggleExpanded,
    addGoal,
    addMilestone,
    addMilestoneProgress,
    goalColor,
  };
}

import { useState } from "react";
import { seedGoals } from "../data/seed";
import { makeId } from "../utils/id";

// Everything to do with goals and their milestones lives here. Components
// never mutate goal state directly — they call these functions.
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

  // targetAmount/targetUnit are optional. Pass them when the milestone is a
  // quantity to work down (e.g. "30 applications") rather than a single
  // checkbox (e.g. "Rebuild resume").
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
                { id: makeId("m"), title: title.trim(), done: false, target, progress: 0 },
              ],
            }
          : g
      )
    );
  }

  // Manual toggle — only meaningful for milestones WITHOUT a quantity
  // target. Target-based milestones complete themselves via contributions
  // (see addMilestoneProgress).
  function toggleMilestone(goalId, milestoneId) {
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId && !m.target ? { ...m, done: !m.done } : m
              ),
            }
          : g
      )
    );
  }

  // Adds (or, with a negative delta, removes) progress toward a milestone's
  // quantity target. Called when a contributing task is checked/unchecked.
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
                return { ...m, progress, done: progress >= m.target.amount };
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
    toggleMilestone,
    addMilestoneProgress,
    goalColor,
  };
}

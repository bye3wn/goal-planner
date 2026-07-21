import { useState } from "react";
import { seedGoals } from "../data/seed";
import { makeId } from "../utils/id";

// Everything to do with goals and their milestones lives here. Components
// never mutate goal state directly — they call these functions.
export function useGoals() {
  const [goals, setGoals] = useState(seedGoals);
  const [expanded, setExpanded] = useState({ g1: true, g2: true });

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

  function addMilestone(goalId, title) {
    if (!title.trim()) return;
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? { ...g, milestones: [...g.milestones, { id: makeId("m"), title: title.trim(), done: false }] }
          : g
      )
    );
  }

  function toggleMilestone(goalId, milestoneId) {
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId ? { ...m, done: !m.done } : m
              ),
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
    goalColor,
  };
}

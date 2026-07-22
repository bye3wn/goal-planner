import { useState } from "react";
import { seedGoals } from "../data/seed";
import { makeId } from "../utils/id";
import { daysBetween } from "../utils/date";

// Everything to do with goals and their milestones lives here. Components
// never mutate goal state directly — they call these functions.
//
// Milestones are never checked off by hand. They complete themselves based
// on their subtasks:
//   - "checklist" milestones (target: null) complete when all their linked
//     tasks are done — computed in App.jsx from live task data.
//   - "manual countdown" milestones (target.mode === "manual") complete via
//     addMilestoneProgress, called when a task with a custom contribution
//     amount is checked/unchecked.
//   - "daily until deadline" milestones (target.mode === "daily") complete
//     via how many linked tasks are done, computed in App.jsx — the target
//     amount is fixed at creation time (days between today and the goal's
//     deadline).
export function useGoals() {
  const [goals, setGoals] = useState(seedGoals);
  const [expanded, setExpanded] = useState({ g1: true, g2: true, g3: true });

  function toggleExpanded(goalId) {
    setExpanded((e) => ({ ...e, [goalId]: !e[goalId] }));
  }

  function addGoal(title, color, deadline) {
    if (!title.trim()) return;
    const id = makeId("g");
    setGoals((gs) => [...gs, { id, title: title.trim(), color, deadline: deadline || null, milestones: [] }]);
    setExpanded((e) => ({ ...e, [id]: true }));
    return id;
  }

  function updateGoal(goalId, { title, color, deadline }) {
    setGoals((gs) =>
      gs.map((g) => (g.id === goalId ? { ...g, title: title.trim(), color, deadline: deadline || null } : g))
    );
  }

  function deleteGoal(goalId) {
    setGoals((gs) => gs.filter((g) => g.id !== goalId));
    setExpanded((e) => {
      const { [goalId]: _, ...rest } = e;
      return rest;
    });
  }

  // mode: "checklist" | "manual" | "daily"
  //   checklist -> target null
  //   manual    -> target { mode: "manual", amount, unit }
  //   daily     -> target { mode: "daily", amount: days-until-goal-deadline, unit: "days" }
  //                (requires the goal to have a deadline)
  function buildTarget(goal, mode, amount, unit) {
    if (mode === "manual") {
      const n = Number(amount);
      return n > 0 ? { mode: "manual", amount: n, unit: (unit || "").trim() || "done" } : null;
    }
    if (mode === "daily" && goal?.deadline) {
      const days = Math.max(1, daysBetween(new Date(), new Date(goal.deadline)));
      return { mode: "daily", amount: days, unit: "days" };
    }
    return null;
  }

  function addMilestone(goalId, title, mode, amount, unit) {
    if (!title.trim()) return;
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? { ...g, milestones: [...g.milestones, { id: makeId("m"), title: title.trim(), target: buildTarget(g, mode, amount, unit), progress: 0 }] }
          : g
      )
    );
  }

  function updateMilestone(goalId, milestoneId, { title, mode, amount, unit }) {
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, title: title.trim(), target: buildTarget(g, mode, amount, unit), progress: mode === "manual" ? m.progress : 0 }
                  : m
              ),
            }
          : g
      )
    );
  }

  function deleteMilestone(goalId, milestoneId) {
    setGoals((gs) =>
      gs.map((g) => (g.id === goalId ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) } : g))
    );
  }

  // Adds (or, with a negative delta, removes) progress toward a manual
  // countdown milestone's target. Called when a contributing task is
  // checked/unchecked.
  function addMilestoneProgress(goalId, milestoneId, delta) {
    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) => {
                if (m.id !== milestoneId || m.target?.mode !== "manual") return m;
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
    updateGoal,
    deleteGoal,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addMilestoneProgress,
    goalColor,
  };
}

// Starter data so the app isn't empty on first run. Once you add a backend,
// this file is the only thing that goes away — nothing else references it
// directly except the two hooks that call it as an initial value.
//
// Milestones have no "done" field — completion is always derived from their
// subtasks (see App.jsx's milestoneStats). target/progress describe a
// countdown milestone; leave target null for a checklist milestone.

export const seedGoals = [
  {
    id: "g1",
    title: "Land an ML internship",
    color: "#E2661F",
    milestones: [
      { id: "m1", title: "Rebuild resume for ML roles", target: null, progress: 0 },
      { id: "m2", title: "Ship a portfolio project", target: null, progress: 0 },
      { id: "m3", title: "Apply to 30 companies", target: { amount: 30, unit: "applications" }, progress: 5 },
    ],
  },
  {
    id: "g2",
    title: "Get stronger in systems",
    color: "#3E5C76",
    milestones: [
      { id: "m4", title: "Finish cache/pipeline review", target: null, progress: 0 },
      { id: "m5", title: "Build a toy OS scheduler", target: null, progress: 0 },
    ],
  },
  {
    id: "g3",
    title: "Gain weight (6 months)",
    color: "#C9971F",
    milestones: [
      { id: "m6", title: "Gain 5 lbs this month", target: null, progress: 0 },
      { id: "m7", title: "Hit 3000 calories every day", target: null, progress: 0 },
    ],
  },
];

// Repeatable task templates. Each one regenerates a fresh, independently
// completable instance every day it applies to (currently: every day).
export const seedTemplates = [
  {
    id: "tpl1",
    title: "Apply for 5 jobs",
    hour: 10,
    duration: 1,
    goalId: "g1",
    milestoneId: "m3",
    contributionAmount: 5, // counts down m3's remaining target when checked off
  },
  {
    id: "tpl2",
    title: "Hit 3000 calories",
    hour: 19,
    duration: 1,
    goalId: "g3",
    milestoneId: "m7",
    contributionAmount: null, // this is a checklist milestone's subtask — just a plain checkbox
  },
];

export function seedTasksFor(key) {
  return [
    { id: "t1", title: "Portfolio project — data cleaning", hour: 9, duration: 2, goalId: "g1", milestoneId: "m2", done: false, templateId: null, contributionAmount: null },
    { id: "t2", title: "Systems reading", hour: 13, duration: 1, goalId: "g2", milestoneId: "m4", done: false, templateId: null, contributionAmount: null },
    { id: "t3", title: "Gym", hour: 17, duration: 1, goalId: null, milestoneId: null, done: false, templateId: null, contributionAmount: null },
  ].map((t) => ({ ...t, id: `${t.id}-${key}` }));
}

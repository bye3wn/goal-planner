// Starter data so the app isn't empty on first run. Once you add a backend,
// this file is the only thing that goes away — nothing else references it
// directly except the two hooks that call it as an initial value.

export const seedGoals = [
  {
    id: "g1",
    title: "Land an ML internship",
    color: "#E2661F",
    milestones: [
      { id: "m1", title: "Rebuild resume for ML roles", done: true, target: null, progress: 0 },
      { id: "m2", title: "Ship a portfolio project", done: false, target: null, progress: 0 },
      // A milestone with a quantity target: tasks that "contribute" to it
      // count down the remaining amount instead of being checked off directly.
      { id: "m3", title: "Apply to 30 companies", done: false, target: { amount: 30, unit: "applications" }, progress: 5 },
    ],
  },
  {
    id: "g2",
    title: "Get stronger in systems",
    color: "#3E5C76",
    milestones: [
      { id: "m4", title: "Finish cache/pipeline review", done: false, target: null, progress: 0 },
      { id: "m5", title: "Build a toy OS scheduler", done: false, target: null, progress: 0 },
    ],
  },
  {
    id: "g3",
    title: "Gain weight (6 months)",
    color: "#C9971F",
    milestones: [
      // A milestone with no target — just a plain checklist item.
      { id: "m6", title: "Gain 5 lbs this month", done: false, target: null, progress: 0 },
      { id: "m7", title: "Hit 3000 calories every day", done: false, target: null, progress: 0 },
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
    contributionAmount: null, // just a daily habit checkbox, no quantity tracking
  },
];

export function seedTasksFor(key) {
  return [
    { id: "t1", title: "Portfolio project — data cleaning", hour: 9, duration: 2, goalId: "g1", milestoneId: "m2", done: false, templateId: null, contributionAmount: null },
    { id: "t2", title: "Systems reading", hour: 13, duration: 1, goalId: "g2", milestoneId: "m4", done: false, templateId: null, contributionAmount: null },
    { id: "t3", title: "Gym", hour: 17, duration: 1, goalId: null, milestoneId: null, done: false, templateId: null, contributionAmount: null },
  ].map((t) => ({ ...t, id: `${t.id}-${key}` }));
}

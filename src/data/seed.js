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

// Items come in two kinds:
//   - "event": time-blocked, rendered on the calendar grid, sized by duration
//   - "task": a checkbox item with no fixed time — subtasks that feed a
//     milestone (like "apply for 5 jobs") are naturally tasks, not events,
//     since they don't need to occupy a specific slot in your day.
// Every field below (title, start/duration, goal/milestone link,
// contribution, repeat) is editable after creation via the item modal.

// Repeatable templates — each regenerates a fresh, independently
// completable instance every day it applies to.
export const seedTemplates = [
  {
    id: "tpl1",
    kind: "task",
    title: "Apply for 5 jobs",
    start: null,
    duration: null,
    goalId: "g1",
    milestoneId: "m3",
    contributionAmount: 5, // counts down m3's remaining target when checked off
  },
  {
    id: "tpl2",
    kind: "task",
    title: "Hit 3000 calories",
    start: null,
    duration: null,
    goalId: "g3",
    milestoneId: "m7",
    contributionAmount: null, // checklist milestone's subtask — plain checkbox
  },
];

export function seedItemsFor(key) {
  return [
    {
      id: "i1",
      kind: "event",
      title: "Portfolio project — data cleaning",
      start: 9,
      duration: 2,
      goalId: "g1",
      milestoneId: "m2",
      contributionAmount: null,
      templateId: null,
      done: false,
    },
    {
      id: "i2",
      kind: "event",
      title: "Systems reading",
      start: 13,
      duration: 1,
      goalId: "g2",
      milestoneId: "m4",
      contributionAmount: null,
      templateId: null,
      done: false,
    },
    {
      id: "i3",
      kind: "event",
      title: "Gym",
      start: 17,
      duration: 1,
      goalId: null,
      milestoneId: null,
      contributionAmount: null,
      templateId: null,
      done: false,
    },
  ].map((t) => ({ ...t, id: `${t.id}-${key}` }));
}

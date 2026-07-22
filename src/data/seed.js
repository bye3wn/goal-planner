// Starter data so the app isn't empty on first run. Once you add a backend,
// this file is the only thing that goes away — nothing else references it
// directly except the two hooks that call it as an initial value.
//
// Milestone completion is always derived, never manually toggled. A
// milestone's `target` field decides how:
//   - target: null                      -> checklist: done when all its
//                                           linked subtasks are done
//   - target: { mode: "manual", ... }   -> countdown: subtasks contribute a
//                                           custom amount each (e.g. +5 apps)
//   - target: { mode: "daily", ... }    -> daily-until-deadline: subtasks
//                                           contribute 1 automatically per
//                                           day checked, out of the total
//                                           days between creation and the
//                                           goal's deadline

export const seedGoals = [
  {
    id: "g1",
    title: "Land an ML internship",
    color: "#E2661F",
    deadline: "2026-12-01",
    milestones: [
      { id: "m1", title: "Rebuild resume for ML roles", target: null, progress: 0 },
      { id: "m2", title: "Ship a portfolio project", target: null, progress: 0 },
      { id: "m3", title: "Apply to 30 companies", target: { mode: "manual", amount: 30, unit: "applications" }, progress: 5 },
    ],
  },
  {
    id: "g2",
    title: "Get stronger in systems",
    color: "#3E5C76",
    deadline: null,
    milestones: [
      { id: "m4", title: "Finish cache/pipeline review", target: null, progress: 0 },
      { id: "m5", title: "Build a toy OS scheduler", target: null, progress: 0 },
    ],
  },
  {
    id: "g3",
    title: "Gain weight (6 months)",
    color: "#C9971F",
    deadline: "2027-01-22",
    milestones: [
      { id: "m6", title: "Gain 5 lbs this month", target: null, progress: 0 },
      // Daily-habit-until-deadline: progress isn't stored here — it's
      // derived each render from how many linked daily tasks are checked
      // off (see App.jsx). amount is the day-count at creation time.
      { id: "m7", title: "Hit 3000 calories every day", target: { mode: "daily", amount: 184, unit: "days" }, progress: 0 },
    ],
  },
];

// Repeatable templates. daysOfWeek uses Date.getDay() values (Sun=0..Sat=6);
// all seven = daily, a subset = "every Monday and Wednesday" etc.
export const seedTemplates = [
  {
    id: "tpl1",
    kind: "task",
    title: "Apply for 5 jobs",
    start: null,
    duration: null,
    goalId: "g1",
    milestoneId: "m3",
    contributionAmount: 5, // manual-mode contribution toward m3's remaining target
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "tpl2",
    kind: "task",
    title: "Hit 3000 calories",
    start: null,
    duration: null,
    goalId: "g3",
    milestoneId: "m7",
    contributionAmount: null, // daily-mode milestone — checking this off is what counts
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
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

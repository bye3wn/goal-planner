// Starter data so the app isn't empty on first run. Once you add a backend,
// this file is the only thing that goes away — nothing else references it
// directly except the two hooks that call it as an initial value.

export const seedGoals = [
  {
    id: "g1",
    title: "Land an ML internship",
    color: "#E2661F",
    milestones: [
      { id: "m1", title: "Rebuild resume for ML roles", done: true },
      { id: "m2", title: "Ship a portfolio project", done: false },
      { id: "m3", title: "Apply to 30 companies", done: false },
    ],
  },
  {
    id: "g2",
    title: "Get stronger in systems",
    color: "#3E5C76",
    milestones: [
      { id: "m4", title: "Finish cache/pipeline review", done: false },
      { id: "m5", title: "Build a toy OS scheduler", done: false },
    ],
  },
];

export function seedTasksFor(key) {
  return [
    { id: "t1", title: "Portfolio project — data cleaning", hour: 9, duration: 2, goalId: "g1", milestoneId: "m2", done: false },
    { id: "t2", title: "Systems reading", hour: 13, duration: 1, goalId: "g2", milestoneId: "m4", done: false },
    { id: "t3", title: "Gym", hour: 17, duration: 1, goalId: null, milestoneId: null, done: false },
  ].map((t) => ({ ...t, id: `${t.id}-${key}` }));
}

// All visual tokens live here. Change the look of the whole app from this
// one file — components should never hardcode a color themselves.

export const COLORS = {
  canvas: "#F1F4EE",
  panel: "#FFFFFF",
  ink: "#232920",
  inkFaint: "#6B7264",
  line: "#DAD9CB",
  forest: "#1F3D2E",
  blaze: "#E2661F",
};

// Selectable colors when creating a new goal. Add/remove entries here to
// change what shows up in the color picker.
export const GOAL_PALETTE = [
  { name: "Blaze", hex: "#E2661F" },
  { name: "Forest", hex: "#1F3D2E" },
  { name: "Teal", hex: "#2F6F62" },
  { name: "Plum", hex: "#6B4A73" },
  { name: "Ochre", hex: "#C9971F" },
  { name: "Slate", hex: "#3E5C76" },
];

// The visible hours in the day planner. Change start/end to widen the day.
export const DAY_START_HOUR = 6; // 6am
export const DAY_END_HOUR = 22; // 10pm
export const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => i + DAY_START_HOUR
);

export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

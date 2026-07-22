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

// Pixel height of one hour in the calendar grid. Event block height is
// duration (in hours) * this value, so blocks are visually proportional to
// how long the event actually takes — same idea as Google Calendar.
export const HOUR_HEIGHT_PX = 60;

// Half-hour time slots across the visible day, used for the start-time
// picker and for snapping drag-and-drop / click-to-create to the grid.
export const TIME_SLOTS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1 },
  (_, i) => DAY_START_HOUR + i * 0.25
);

// Selectable durations (in hours) when creating/editing an event.
export const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

export const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "custom", label: "Custom (choose days)" },
];

// Sun=0 ... Sat=6, matching Date.prototype.getDay(). Used for the custom
// recurrence day picker (e.g. "every Monday and Wednesday").
export const WEEKDAYS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];
export const ALL_WEEKDAYS = WEEKDAYS.map((d) => d.value);

export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

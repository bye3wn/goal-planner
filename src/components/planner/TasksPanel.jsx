import React, { useMemo } from "react";
import { Circle, CheckCircle2, Repeat, Plus } from "lucide-react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getWeekDates, getMonthDates, getYearMonths, formatDayShort } from "../../utils/calendarRange";

function TaskRow({ t, goalColor, onToggleDone, onTaskClick }) {
  const color = goalColor(t.goalId);
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-md" style={{ background: t.done ? "#F4F3EE" : "transparent" }}>
      <button onClick={() => onToggleDone(t.id)} className="flex-shrink-0 mt-0.5">
        {t.done ? <CheckCircle2 size={16} color={color} /> : <Circle size={16} color={COLORS.inkFaint} />}
      </button>
      <button onClick={() => onTaskClick(t)} className="flex-1 text-left min-w-0">
        <span className="text-sm block truncate" style={{ color: t.done ? COLORS.inkFaint : COLORS.ink, textDecoration: t.done ? "line-through" : "none" }}>
          {t.title}
        </span>
        {t.contributionAmount ? (
          <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
            +{t.contributionAmount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

// A repeating task collapses into ONE row with a done/total fraction — the
// denominator is just however many instances exist in the current range
// (already generated correctly per-view by usePlanner), so it naturally
// tracks the active view: 1 in day view, up to 7 in week, the days-due in
// month, all 365ish in year. Click to open today's instance (or the first
// one in range) for editing — no per-day breakdown, just the fraction.
function RepeatingGroupRow({ group, goalColor, onTaskClick }) {
  const color = goalColor(group.instances[0]?.goalId);
  const today = dateKey(new Date());
  const representative = group.instances.find((i) => i.date === today) || group.instances[0];

  return (
    <button onClick={() => onTaskClick(representative)} className="w-full flex items-center gap-1.5 py-1 text-left">
      <Repeat size={12} color={COLORS.inkFaint} className="flex-shrink-0" />
      <span className="flex-1 text-sm truncate min-w-0">{group.title}</span>
      <span className="font-mono text-[11px] flex-shrink-0" style={{ color: group.doneCount === group.total ? color : COLORS.inkFaint }}>
        {group.doneCount}/{group.total}
      </span>
    </button>
  );
}

// Splits a set of tasks into repeating groups (same templateId collapsed
// into one row with a fraction) and one-off tasks (shown individually).
function splitRepeating(taskList) {
  const byTemplate = new Map();
  const oneOff = [];
  for (const t of taskList) {
    if (t.templateId) {
      if (!byTemplate.has(t.templateId)) byTemplate.set(t.templateId, { templateId: t.templateId, title: t.title, instances: [] });
      byTemplate.get(t.templateId).instances.push(t);
    } else {
      oneOff.push(t);
    }
  }
  const groups = Array.from(byTemplate.values()).map((g) => ({
    ...g,
    doneCount: g.instances.filter((i) => i.done).length,
    total: g.instances.length,
  }));
  return { groups, oneOff };
}

// Google Calendar keeps Tasks separate from timed events, in a side list —
// same idea here. Day view is a flat list. Week/month/year all share the
// same shape: repeating tasks collapse into a fraction row up top, one-off
// tasks are grouped underneath — by exact date for week/month (there's
// only ever a handful of days), by month for year (365 date headers would
// be unreadable).
export default function TasksPanel({ view, currentDate, allItems, goalColor, onToggleDone, onTaskClick, onAddTask, onJumpToDay, fullWidth }) {
  const dayKey = dateKey(currentDate);
  const allTasks = useMemo(() => allItems.filter((i) => i.kind === "task"), [allItems]);
  const dayList = useMemo(() => allTasks.filter((t) => t.date === dayKey), [allTasks, dayKey]);

  const rangeData = useMemo(() => {
    if (view === "day") return null;

    if (view === "week" || view === "month") {
      const dates = view === "week" ? getWeekDates(currentDate) : getMonthDates(currentDate);
      const keys = dates.map(dateKey);
      const rangeTasks = allTasks.filter((t) => keys.includes(t.date));
      const { groups, oneOff } = splitRepeating(rangeTasks);
      const oneOffGroups = dates
        .map((d) => ({ key: dateKey(d), label: formatDayShort(d), date: d, tasks: oneOff.filter((t) => t.date === dateKey(d)) }))
        .filter((g) => g.tasks.length > 0);
      return { groups, oneOffGroups };
    }

    // year
    const months = getYearMonths(currentDate);
    const keys = months.flatMap((m) => getMonthDates(m).map(dateKey));
    const rangeTasks = allTasks.filter((t) => keys.includes(t.date));
    const { groups, oneOff } = splitRepeating(rangeTasks);
    const oneOffGroups = months
      .map((m) => {
        const prefix = dateKey(m).slice(0, 7);
        return { key: prefix, label: MONTH_LABELS[m.getMonth()], date: m, tasks: oneOff.filter((t) => t.date.startsWith(prefix)) };
      })
      .filter((g) => g.tasks.length > 0);
    return { groups, oneOffGroups };
  }, [view, currentDate, allTasks]);

  return (
    <aside className={`${fullWidth ? "w-full" : "w-[280px] flex-shrink-0"} overflow-y-auto px-5 py-5`} style={{ borderLeft: fullWidth ? "none" : `1px solid ${COLORS.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Tasks
        </h2>
        {view === "day" && (
          <button onClick={() => onAddTask(dayKey)} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add task">
            <Plus size={16} />
          </button>
        )}
      </div>

      {view === "day" && (
        <>
          {dayList.length === 0 && (
            <p className="text-xs" style={{ color: COLORS.inkFaint }}>
              No tasks for today yet.
            </p>
          )}
          <div className="flex flex-col gap-1">
            {dayList.map((t) => (
              <TaskRow key={t.id} t={t} goalColor={goalColor} onToggleDone={onToggleDone} onTaskClick={onTaskClick} />
            ))}
          </div>
        </>
      )}

      {view !== "day" && (
        <>
          {rangeData.groups.length === 0 && rangeData.oneOffGroups.length === 0 && (
            <p className="text-xs" style={{ color: COLORS.inkFaint }}>
              No tasks in this range yet.
            </p>
          )}

          {rangeData.groups.length > 0 && (
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase mb-1" style={{ color: COLORS.inkFaint }}>
                Repeating
              </div>
              {rangeData.groups.map((g) => (
                <RepeatingGroupRow key={g.templateId} group={g} goalColor={goalColor} onTaskClick={onTaskClick} />
              ))}
            </div>
          )}

          {rangeData.oneOffGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              {rangeData.oneOffGroups.map((g) => (
                <div key={g.key}>
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => onJumpToDay(view === "year" ? g.date : g.date)}
                      className="text-[11px] font-mono uppercase hover:underline"
                      style={{ color: COLORS.inkFaint }}
                    >
                      {g.label}
                    </button>
                    {view !== "year" && (
                      <button onClick={() => onAddTask(g.key)} className="p-0.5 rounded hover:bg-black/5 transition-colors" aria-label={`Add task for ${g.label}`}>
                        <Plus size={12} color={COLORS.inkFaint} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {g.tasks.map((t) => (
                      <TaskRow key={t.id} t={t} goalColor={goalColor} onToggleDone={onToggleDone} onTaskClick={onTaskClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

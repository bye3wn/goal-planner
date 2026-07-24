import React, { useMemo, useState } from "react";
import { Circle, CheckCircle2, Repeat, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { COLORS, MONTH_LABELS } from "../../constants/theme";
import { dateKey } from "../../utils/date";
import { getWeekDates, getMonthDates, getYearMonths, formatDayShort } from "../../utils/calendarRange";

function TaskRow({ t, goalColor, onToggleDone, onTaskClick, dateLabel }) {
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
        <div className="flex items-center gap-1.5">
          {dateLabel && (
            <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
              {dateLabel}
            </span>
          )}
          {t.contributionAmount ? (
            <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
              +{t.contributionAmount}
            </span>
          ) : null}
        </div>
      </button>
    </div>
  );
}

// A repeating task collapses into ONE row with a done/total fraction — the
// denominator is just however many instances exist in the current range
// (already generated correctly per-view by usePlanner), so it naturally
// tracks the active view: 1 in day view, up to 7 in week, the days-due in
// month, all of them in year. Expand to check off (or edit) a specific day.
function RepeatingGroupRow({ group, goalColor, onToggleDone, onTaskClick }) {
  const [open, setOpen] = useState(false);
  const color = goalColor(group.instances[0]?.goalId);

  return (
    <div>
      <div className="flex items-center gap-1.5 py-1">
        <button onClick={() => setOpen((o) => !o)} className="flex-shrink-0">
          {open ? <ChevronDown size={13} color={COLORS.inkFaint} /> : <ChevronRight size={13} color={COLORS.inkFaint} />}
        </button>
        <Repeat size={12} color={COLORS.inkFaint} className="flex-shrink-0" />
        <button onClick={() => onTaskClick(group.instances[0])} className="flex-1 text-left text-sm truncate min-w-0">
          {group.title}
        </button>
        <span className="font-mono text-[11px] flex-shrink-0" style={{ color: group.doneCount === group.total ? color : COLORS.inkFaint }}>
          {group.doneCount}/{group.total}
        </span>
      </div>
      {open && (
        <div className="ml-5 flex flex-col gap-0.5 mb-1">
          {group.instances
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((inst) => (
              <div key={inst.id} className="flex items-center gap-2 py-0.5">
                <button onClick={() => onToggleDone(inst.id)} className="flex-shrink-0">
                  {inst.done ? <CheckCircle2 size={13} color={color} /> : <Circle size={13} color={COLORS.inkFaint} />}
                </button>
                <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
                  {formatDayShort(new Date(inst.date + "T00:00:00"))}
                </span>
                <button
                  onClick={() => onTaskClick(inst)}
                  className="text-xs truncate flex-1 text-left"
                  style={{ color: inst.done ? COLORS.inkFaint : COLORS.ink, textDecoration: inst.done ? "line-through" : "none" }}
                >
                  {inst.title}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Splits a set of tasks into repeating groups (same templateId collapsed
// into one row) and one-off tasks (shown individually, same as before).
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
// same idea here. What it shows adapts to whichever calendar view is
// active: day view stays a flat list (nothing to collapse with only one
// day showing); week/month/year collapse each repeating task into a single
// row with a done/total fraction instead of listing every day's instance.
export default function TasksPanel({ view, currentDate, allItems, goalColor, onToggleDone, onTaskClick, onAddTask, onJumpToDay }) {
  const dayKey = dateKey(currentDate);
  const allTasks = useMemo(() => allItems.filter((i) => i.kind === "task"), [allItems]);

  const dayList = useMemo(() => allTasks.filter((t) => t.date === dayKey), [allTasks, dayKey]);

  const weekData = useMemo(() => {
    if (view !== "week") return null;
    const keys = getWeekDates(currentDate).map(dateKey);
    const rangeTasks = allTasks.filter((t) => keys.includes(t.date));
    const { groups, oneOff } = splitRepeating(rangeTasks);
    const oneOffByDate = getWeekDates(currentDate)
      .map((d) => ({ dateKey: dateKey(d), label: formatDayShort(d), date: d, tasks: oneOff.filter((t) => t.date === dateKey(d)) }))
      .filter((g) => g.tasks.length > 0);
    return { groups, oneOffByDate };
  }, [view, currentDate, allTasks]);

  const monthData = useMemo(() => {
    if (view !== "month") return null;
    const monthDates = getMonthDates(currentDate);
    const keys = monthDates.map(dateKey);
    const rangeTasks = allTasks.filter((t) => keys.includes(t.date));
    const { groups, oneOff } = splitRepeating(rangeTasks);
    const oneOffByDate = monthDates
      .map((d) => ({ dateKey: dateKey(d), label: formatDayShort(d), date: d, tasks: oneOff.filter((t) => t.date === dateKey(d)) }))
      .filter((g) => g.tasks.length > 0);
    return { groups, oneOffByDate };
  }, [view, currentDate, allTasks]);

  const yearData = useMemo(() => {
    if (view !== "year") return null;
    const months = getYearMonths(currentDate);
    const keys = months.flatMap((m) => getMonthDates(m).map(dateKey));
    const rangeTasks = allTasks.filter((t) => keys.includes(t.date));
    const { groups, oneOff } = splitRepeating(rangeTasks);
    const oneOffByMonth = months.map((m) => {
      const prefix = dateKey(m).slice(0, 7);
      return { label: MONTH_LABELS[m.getMonth()], count: oneOff.filter((t) => t.date.startsWith(prefix)).length };
    });
    return { groups, oneOffByMonth };
  }, [view, currentDate, allTasks]);

  const showTopAdd = view === "day";

  return (
    <aside className="w-[280px] flex-shrink-0 overflow-y-auto px-5 py-5" style={{ borderLeft: `1px solid ${COLORS.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Tasks
        </h2>
        {showTopAdd && (
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

      {(view === "week" || view === "month") && (() => {
        const data = view === "week" ? weekData : monthData;
        const empty = data.groups.length === 0 && data.oneOffByDate.length === 0;
        return (
          <>
            {empty && (
              <p className="text-xs" style={{ color: COLORS.inkFaint }}>
                No tasks in this range yet.
              </p>
            )}
            {data.groups.length > 0 && (
              <div className="mb-3">
                <div className="font-mono text-[10px] uppercase mb-1" style={{ color: COLORS.inkFaint }}>
                  Repeating
                </div>
                {data.groups.map((g) => (
                  <RepeatingGroupRow key={g.templateId} group={g} goalColor={goalColor} onToggleDone={onToggleDone} onTaskClick={onTaskClick} />
                ))}
              </div>
            )}
            {data.oneOffByDate.length > 0 && (
              <div className="flex flex-col gap-3">
                {data.oneOffByDate.map((g) => (
                  <div key={g.dateKey}>
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => onJumpToDay(g.date)} className="text-[11px] font-mono uppercase hover:underline" style={{ color: COLORS.inkFaint }}>
                        {g.label}
                      </button>
                      <button onClick={() => onAddTask(g.dateKey)} className="p-0.5 rounded hover:bg-black/5 transition-colors" aria-label={`Add task for ${g.label}`}>
                        <Plus size={12} color={COLORS.inkFaint} />
                      </button>
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
        );
      })()}

      {view === "year" && (
        <div className="flex flex-col gap-1">
          {yearData.groups.length > 0 && (
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase mb-1" style={{ color: COLORS.inkFaint }}>
                Repeating
              </div>
              {yearData.groups.map((g) => (
                <RepeatingGroupRow key={g.templateId} group={g} goalColor={goalColor} onToggleDone={onToggleDone} onTaskClick={onTaskClick} />
              ))}
            </div>
          )}
          <div className="font-mono text-[10px] uppercase mb-1" style={{ color: COLORS.inkFaint }}>
            One-off, by month
          </div>
          {yearData.oneOffByMonth.map((m) => (
            <div key={m.label} className="flex items-center justify-between py-1">
              <span className="text-sm">{m.label}</span>
              <span className="font-mono text-[11px]" style={{ color: COLORS.inkFaint }}>
                {m.count} {m.count === 1 ? "task" : "tasks"}
              </span>
            </div>
          ))}
          <p className="text-[11px] mt-2" style={{ color: COLORS.inkFaint }}>
            Switch to month view for the full list on any given day.
          </p>
        </div>
      )}
    </aside>
  );
}

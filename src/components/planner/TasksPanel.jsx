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
      {t.templateId && <Repeat size={12} color={COLORS.inkFaint} className="flex-shrink-0 mt-1" />}
    </div>
  );
}

// Google Calendar keeps Tasks separate from timed events, in a side list —
// same idea here. What it shows adapts to whichever calendar view is
// active: a flat list for a single day, grouped by date for a week, grouped
// by date (skipping empty days) for a month, and a lighter per-month count
// for a year — a full year of daily-repeating tasks would be hundreds of
// rows, so year view trades detail for a scannable overview and points you
// at month view for specifics.
export default function TasksPanel({ view, currentDate, allItems, goalColor, onToggleDone, onTaskClick, onAddTask, onJumpToDay }) {
  const groups = useMemo(() => {
    const allTasks = allItems.filter((i) => i.kind === "task");
    if (view === "day") {
      const dk = dateKey(currentDate);
      return [{ dateKey: dk, label: null, date: currentDate, tasks: allTasks.filter((t) => t.date === dk) }];
    }
    if (view === "week") {
      return getWeekDates(currentDate).map((d) => {
        const dk = dateKey(d);
        return { dateKey: dk, label: formatDayShort(d), date: d, tasks: allTasks.filter((t) => t.date === dk) };
      });
    }
    if (view === "month") {
      return getMonthDates(currentDate)
        .map((d) => {
          const dk = dateKey(d);
          return { dateKey: dk, label: formatDayShort(d), date: d, tasks: allTasks.filter((t) => t.date === dk) };
        })
        .filter((g) => g.tasks.length > 0);
    }
    return []; // year handled separately below
  }, [view, currentDate, allItems]);

  const yearSummary = useMemo(() => {
    if (view !== "year") return [];
    return getYearMonths(currentDate).map((m) => {
      const prefix = dateKey(m).slice(0, 7); // "YYYY-MM"
      const count = allItems.filter((i) => i.kind === "task" && i.date.startsWith(prefix)).length;
      return { month: m, label: MONTH_LABELS[m.getMonth()], count };
    });
  }, [view, currentDate, allItems]);

  const showTopAdd = view === "day";

  return (
    <aside className="w-[280px] flex-shrink-0 overflow-y-auto px-5 py-5" style={{ borderLeft: `1px solid ${COLORS.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Tasks
        </h2>
        {showTopAdd && (
          <button onClick={() => onAddTask(dateKey(currentDate))} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add task">
            <Plus size={16} />
          </button>
        )}
      </div>

      {view === "year" ? (
        <div className="flex flex-col gap-0.5">
          {yearSummary.map((m) => (
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
      ) : (
        <>
          {groups.every((g) => g.tasks.length === 0) && (
            <p className="text-xs" style={{ color: COLORS.inkFaint }}>
              {view === "day" ? "No tasks for today yet." : "No tasks in this range yet."}
            </p>
          )}
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.dateKey}>
                {g.label && (
                  <div className="flex items-center justify-between mb-1">
                    <button onClick={() => onJumpToDay(g.date)} className="text-[11px] font-mono uppercase hover:underline" style={{ color: COLORS.inkFaint }}>
                      {g.label}
                    </button>
                    <button onClick={() => onAddTask(g.dateKey)} className="p-0.5 rounded hover:bg-black/5 transition-colors" aria-label={`Add task for ${g.label}`}>
                      <Plus size={12} color={COLORS.inkFaint} />
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {g.tasks.map((t) => (
                    <TaskRow key={t.id} t={t} goalColor={goalColor} onToggleDone={onToggleDone} onTaskClick={onTaskClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

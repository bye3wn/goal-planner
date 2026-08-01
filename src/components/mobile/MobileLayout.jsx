import React, { useState } from "react";
import { CalendarDays, Flag, ListChecks, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { COLORS, CALENDAR_VIEWS } from "../../constants/theme";
import { rangeLabel } from "../Header";
import Sidebar from "../sidebar/Sidebar";
import CalendarGrid from "../planner/CalendarGrid";
import WeekGrid from "../planner/WeekGrid";
import MonthGrid from "../planner/MonthGrid";
import YearGrid from "../planner/YearGrid";
import TasksPanel from "../planner/TasksPanel";

const TABS = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "goals", label: "Goals", icon: Flag },
  { id: "tasks", label: "Tasks", icon: ListChecks },
];

// One screen at a time instead of three columns — same pattern as Apple
// Calendar (or Google Calendar's mobile app): a compact top bar, full-width
// content, a bottom tab bar to switch what you're looking at. Every prop
// here is exactly what the desktop layout already passes to Sidebar,
// CalendarGrid/WeekGrid/MonthGrid/YearGrid, and TasksPanel — this is a
// different arrangement of the same pieces, not a second implementation.
export default function MobileLayout(props) {
  const {
    view, setView, currentDate, goToPrev, goToNext, goToToday, jumpToDate,
    events, dayTasksForCalendar, goalColor, onRescheduleEvents, onSlotClick, onEventClick,
    weekDates, monthGridDates, yearMonths, allItems,
    goals, expanded, milestoneStats, rangeDateKeys, onToggleExpanded, onAddGoalClick, onEditGoal, onAddMilestone, onMilestoneClick, onToggleSubtaskDone,
    tasks, onToggleDone, onTaskClick, onAddTask, onJumpToDay,
    onQuickAddEvent,
  } = props;

  const [tab, setTab] = useState("calendar");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {tab === "calendar" && (
          <>
            {/* Compact calendar-specific top bar — date nav + view switcher.
                Lives here rather than in the shared app header since it's
                only relevant while looking at the calendar. */}
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
              <button onClick={goToPrev} className="p-1.5" aria-label="Previous">
                <ChevronLeft size={18} color={COLORS.inkFaint} />
              </button>
              <button onClick={goToToday} className="text-sm font-medium text-center flex-1 truncate px-2" style={{ color: COLORS.ink }}>
                {rangeLabel(currentDate, view)}
              </button>
              <button onClick={goToNext} className="p-1.5" aria-label="Next">
                <ChevronRight size={18} color={COLORS.inkFaint} />
              </button>
            </div>
            <div className="flex items-center gap-1 px-4 py-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
              {CALENDAR_VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex-1 px-2 py-1.5 rounded-md text-xs capitalize transition-colors"
                  style={{ background: view === v ? COLORS.forest : "transparent", color: view === v ? "#fff" : COLORS.inkFaint }}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 relative flex flex-col">
              {view === "day" && (
                <CalendarGrid
                  events={events}
                  dayTasks={dayTasksForCalendar}
                  goalColor={goalColor}
                  onRescheduleEvents={onRescheduleEvents}
                  onSlotClick={onSlotClick}
                  onEventClick={onEventClick}
                />
              )}
              {view === "week" && (
                <WeekGrid
                  weekDates={weekDates}
                  allItems={allItems}
                  goalColor={goalColor}
                  onSlotClick={onSlotClick}
                  onEventClick={onEventClick}
                  onDayHeaderClick={(d) => jumpToDate(d, "day")}
                />
              )}
              {view === "month" && (
                <MonthGrid
                  gridDates={monthGridDates}
                  currentMonth={currentDate}
                  allItems={allItems}
                  goalColor={goalColor}
                  onDayClick={(d) => jumpToDate(d, "day")}
                />
              )}
              {view === "year" && (
                <YearGrid
                  yearMonths={yearMonths}
                  allItems={allItems}
                  goalColor={goalColor}
                  onDayClick={(d) => jumpToDate(d, "day")}
                  onMonthClick={(m) => jumpToDate(m, "month")}
                />
              )}

              <button
                onClick={onQuickAddEvent}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: COLORS.forest }}
                aria-label="Add event"
              >
                <Plus size={22} color="#fff" />
              </button>
            </div>
          </>
        )}

        {tab === "goals" && (
          <Sidebar
            fullWidth
            goals={goals}
            expanded={expanded}
            milestoneStats={milestoneStats}
            allItems={allItems}
            rangeDateKeys={rangeDateKeys}
            onToggleExpanded={onToggleExpanded}
            onAddGoalClick={onAddGoalClick}
            onEditGoal={onEditGoal}
            onAddMilestone={onAddMilestone}
            onMilestoneClick={onMilestoneClick}
            onToggleSubtaskDone={onToggleSubtaskDone}
          />
        )}

        {tab === "tasks" && (
          <TasksPanel
            fullWidth
            view={view}
            currentDate={currentDate}
            allItems={allItems}
            goalColor={goalColor}
            onToggleDone={onToggleDone}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            onJumpToDay={onJumpToDay}
          />
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex items-stretch flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.line}`, background: COLORS.panel }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2"
            style={{ color: tab === id ? COLORS.forest : COLORS.inkFaint }}
          >
            <Icon size={20} strokeWidth={tab === id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { X, Moon, Copy } from "lucide-react";
import { COLORS, WEEKDAY_FULL } from "../../constants/theme";
import { decimalToTimeString, timeStringToDecimal } from "../../utils/date";

const DEFAULT_BEDTIME = "23:00";
const DEFAULT_WAKE = "07:00";

function emptyRows() {
  return Array.from({ length: 7 }, () => ({ enabled: false, bedtime: DEFAULT_BEDTIME, wake: DEFAULT_WAKE }));
}

// Asks for a bedtime and wake time per day of the week, then hands off a
// {dow: {bedtime, wake}} schedule to usePlanner's saveSleepSchedule, which
// turns it into recurring dark "Sleep" event blocks on the calendar.
export default function SleepScheduleModal({ open, initialSchedule, onSave, onClose }) {
  const [rows, setRows] = useState(emptyRows());

  useEffect(() => {
    if (!open) return;
    const next = emptyRows();
    for (const [dowStr, entry] of Object.entries(initialSchedule || {})) {
      const dow = Number(dowStr);
      next[dow] = {
        enabled: true,
        bedtime: entry.bedtime != null ? decimalToTimeString(entry.bedtime) : DEFAULT_BEDTIME,
        wake: entry.wake != null ? decimalToTimeString(entry.wake) : DEFAULT_WAKE,
      };
    }
    setRows(next);
  }, [open, initialSchedule]);

  if (!open) return null;

  function setRow(i, patch) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function copyFirstToAll() {
    setRows((r) => r.map((row) => ({ ...row, bedtime: r[0].bedtime, wake: r[0].wake })));
  }

  function submit() {
    const schedule = {};
    rows.forEach((row, dow) => {
      if (row.enabled) {
        schedule[dow] = {
          bedtime: timeStringToDecimal(row.bedtime),
          wake: timeStringToDecimal(row.wake),
        };
      }
    });
    onSave(schedule);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,41,32,0.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl shadow-xl overflow-hidden" style={{ background: COLORS.panel }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span className="font-display text-lg flex items-center gap-2" style={{ color: COLORS.forest }}>
            <Moon size={18} /> Sleep schedule
          </span>
          <button onClick={onClose}>
            <X size={18} color={COLORS.inkFaint} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          <p className="text-xs" style={{ color: COLORS.inkFaint }}>
            Set a bedtime and wake time for any day you want tracked. Shown as a dark block on the calendar.
          </p>

          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 w-20 flex-shrink-0">
                <input type="checkbox" checked={row.enabled} onChange={(e) => setRow(i, { enabled: e.target.checked })} />
                <span className="text-xs font-medium">{WEEKDAY_FULL[i]}</span>
              </label>
              <input
                type="time"
                value={row.bedtime}
                disabled={!row.enabled}
                onChange={(e) => setRow(i, { bedtime: e.target.value })}
                className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1 disabled:opacity-40"
                style={{ borderColor: COLORS.line }}
              />
              <span className="text-xs" style={{ color: COLORS.inkFaint }}>
                to
              </span>
              <input
                type="time"
                value={row.wake}
                disabled={!row.enabled}
                onChange={(e) => setRow(i, { wake: e.target.value })}
                className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1 disabled:opacity-40"
                style={{ borderColor: COLORS.line }}
              />
              {i === 0 && (
                <button onClick={copyFirstToAll} title="Copy Sunday's times to every day" className="flex-shrink-0">
                  <Copy size={14} color={COLORS.inkFaint} />
                </button>
              )}
              {i !== 0 && <span className="w-3.5 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md" style={{ color: COLORS.inkFaint }}>
            Cancel
          </button>
          <button onClick={submit} className="text-sm px-4 py-1.5 rounded-md text-white" style={{ background: COLORS.forest }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../constants/theme";
import { formatDateHeading } from "../utils/date";

export default function Header({ currentDate, onPrevDay, onNextDay, onToday }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{ borderBottom: `1px solid ${COLORS.line}` }}
    >
      <div className="flex items-center gap-2">
        <Flag size={20} color={COLORS.blaze} strokeWidth={2.5} />
        <span className="font-display text-xl" style={{ color: COLORS.forest }}>
          Waypoint
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono text-sm" style={{ color: COLORS.inkFaint }}>
        <button onClick={onPrevDay} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" aria-label="Previous day">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[180px] text-center" style={{ color: COLORS.ink }}>
          {formatDateHeading(currentDate)}
        </span>
        <button onClick={onNextDay} className="p-1.5 rounded-md hover:bg-black/5 transition-colors" aria-label="Next day">
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onToday}
          className="ml-2 px-2.5 py-1 rounded-md border text-xs hover:bg-black/5 transition-colors"
          style={{ borderColor: COLORS.line }}
        >
          Today
        </button>
      </div>
    </header>
  );
}

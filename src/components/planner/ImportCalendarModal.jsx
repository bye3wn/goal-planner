import React, { useRef, useState } from "react";
import { X, Upload, FileWarning, CheckCircle2 } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { parseICS } from "../../utils/icsImport";

// Reads a .ics file (the standard export format from Google Calendar,
// Outlook, and Apple Calendar), parses it, shows a short summary — how
// many events, and anything that had to be simplified — and only imports
// once you confirm.
export default function ImportCalendarModal({ open, onImport, onClose }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [parsed, setParsed] = useState(null); // { events, warnings }
  const [error, setError] = useState(null);

  if (!open) return null;

  function reset() {
    setFileName(null);
    setParsed(null);
    setError(null);
  }

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = parseICS(String(reader.result));
        if (result.events.length === 0) {
          setError("No events found in this file — double check it's a .ics calendar export.");
        } else {
          setParsed(result);
        }
      } catch (e) {
        setError("Couldn't read that file. Make sure it's a valid .ics calendar export.");
      }
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!parsed) return;
    onImport(parsed.events);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,41,32,0.35)" }} onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl shadow-xl overflow-hidden" style={{ background: COLORS.panel }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span className="font-display text-lg flex items-center gap-2" style={{ color: COLORS.forest }}>
            <Upload size={18} /> Import calendar
          </span>
          <button onClick={handleClose}>
            <X size={18} color={COLORS.inkFaint} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs" style={{ color: COLORS.inkFaint }}>
            Import a .ics file — exported from Google Calendar, Outlook, Apple Calendar, or most other calendar apps.
            All-day items come in as tasks; timed items come in as events. None of it is linked to a goal — you can
            do that afterward by opening any imported item.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ics,text/calendar"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm px-4 py-3 rounded-md border border-dashed flex items-center justify-center gap-2"
            style={{ borderColor: COLORS.line, color: COLORS.inkFaint }}
          >
            <Upload size={14} />
            {fileName ? fileName : "Choose a .ics file"}
          </button>

          {error && (
            <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-md" style={{ background: COLORS.canvas, color: COLORS.blaze }}>
              <FileWarning size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {parsed && (
            <div className="flex flex-col gap-2 px-3 py-2 rounded-md" style={{ background: COLORS.canvas }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.forest }}>
                <CheckCircle2 size={15} />
                Found {parsed.events.length} event{parsed.events.length === 1 ? "" : "s"}
              </div>
              {parsed.warnings.map((w, i) => (
                <p key={i} className="text-[11px]" style={{ color: COLORS.inkFaint }}>
                  {w}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          <button onClick={handleClose} className="text-sm px-3 py-1.5 rounded-md" style={{ color: COLORS.inkFaint }}>
            Cancel
          </button>
          <button
            onClick={confirmImport}
            disabled={!parsed}
            className="text-sm px-4 py-1.5 rounded-md text-white disabled:opacity-40"
            style={{ background: COLORS.forest }}
          >
            Import {parsed ? parsed.events.length : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { COLORS } from "../../constants/theme";
import { hslToHex, hexToHsl } from "../../utils/color";

// Three HSL sliders (hue / saturation / lightness) for picking any color,
// not just the presets. Initializes from `value` once and manages its own
// hue/sat/lightness state from there — the parent should force a remount
// (e.g. a `key` prop) rather than expect this to re-sync from external
// value changes, since converting hex -> HSL -> hex on every render would
// round-trip through rounding and make the sliders jump while dragging.
export default function ColorPicker({ value, onChange }) {
  const [hsl, setHsl] = useState(() => hexToHsl(value));

  function update(patch) {
    const next = { ...hsl, ...patch };
    setHsl(next);
    onChange(hslToHex(next.h, next.s, next.l));
  }

  const hex = hslToHex(hsl.h, hsl.s, hsl.l);
  const hueGradient = "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
  const satGradient = `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`;
  const lightGradient = `linear-gradient(to right, #000, hsl(${hsl.h},${hsl.s}%,50%), #fff)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex-shrink-0"
        style={{ background: hex, border: `1px solid ${COLORS.line}` }}
      />
      <div className="flex-1 flex flex-col gap-2.5">
        <input
          type="range"
          min="0"
          max="360"
          value={hsl.h}
          onChange={(e) => update({ h: Number(e.target.value) })}
          className="color-slider"
          style={{ "--slider-bg": hueGradient }}
          aria-label="Hue"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={hsl.s}
          onChange={(e) => update({ s: Number(e.target.value) })}
          className="color-slider"
          style={{ "--slider-bg": satGradient }}
          aria-label="Saturation"
        />
        <input
          type="range"
          min="0"
          max="100"
          value={hsl.l}
          onChange={(e) => update({ l: Number(e.target.value) })}
          className="color-slider"
          style={{ "--slider-bg": lightGradient }}
          aria-label="Lightness"
        />
      </div>
    </div>
  );
}

import React from "react";
import { Clock } from "lucide-react";

export default function TimeSlotGrid({ slots, selectedSlot, onSelectSlot, timezone }) {
  const formatTime = (isoString, tz) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz || undefined,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(isoString));
    } catch {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(isoString));
    }
  };

  const isSelected = (slot) => !!(selectedSlot && slot.startTime === selectedSlot.startTime);

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
        <Clock className="h-8 w-8 text-slate-400 mb-2 animate-pulse" />
        <p className="text-sm font-medium text-slate-600">No slots available for this day.</p>
        <p className="text-xs text-slate-400 mt-1">Try choosing another date.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[380px] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 gap-2">
        {slots.map((slot) => {
          const active = isSelected(slot);
          return (
            <button
              type="button"
              key={slot.startTime}
              onClick={() => onSelectSlot(slot)}
              className={`w-full py-3 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                active
                  ? "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/20"
                  : "bg-white border-slate-200 text-slate-700 hover:border-brand-600 hover:text-brand-600 hover:bg-brand-50/30"
              }`}
            >
              <Clock className={`h-4 w-4 ${active ? "text-brand-100" : "text-slate-400"}`} />
              {formatTime(slot.startTime, timezone)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

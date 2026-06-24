import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));

  const handleDayClick = (day) => {
    if (!day) return;
    if (day < today) return;
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");
    onSelectDate(`${year}-${month}-${date}`);
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}` === selectedDate;
  };

  const isPast = (day) => !day || day < today;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekdays.map((wd) => (
          <div key={wd} className="text-xs font-semibold text-slate-400 py-1 uppercase tracking-wider">{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
          const disabled = isPast(day);
          const active = isSelected(day);
          return (
            <button
              type="button"
              key={`day-${day.getTime()}`}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                active
                  ? "bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20 transform scale-[1.03]"
                  : disabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-brand-50 hover:text-brand-600 cursor-pointer"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

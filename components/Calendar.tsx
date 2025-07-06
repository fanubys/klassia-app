
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  date: Date;
}

const Calendar: React.FC<CalendarProps> = ({ date }) => {
  const [currentDate, setCurrentDate] = useState(date);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{monthNames[month]} {year}</h3>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-700">
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-700">
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, day) => {
            const dayNumber = day + 1;
            const isToday = year === today.getFullYear() && month === today.getMonth() && dayNumber === today.getDate();
            const hasAttendance = Math.random() > 0.5; // Mock data
            return (
              <div key={dayNumber} className="relative py-2 text-center">
                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${isToday ? 'bg-primary text-white' : 'hover:bg-gray-700 text-gray-300'}`}>
                    {dayNumber}
                </button>
                {hasAttendance && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-success rounded-full"></div>}
              </div>
            )
        })}
      </div>
    </div>
  );
};

export default Calendar;
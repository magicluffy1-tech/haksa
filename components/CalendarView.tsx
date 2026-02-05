
import React, { useState, useMemo } from 'react';
import { WeeklyData, EventCategory, SchoolEvent } from '../types';
import { MONTH_ORDER } from '../constants';

interface Props {
  data: WeeklyData[];
  isMini?: boolean;
}

const CalendarView: React.FC<Props> = ({ data, isMini = false }) => {
  const [viewIndex, setViewIndex] = useState(0); 

  const currentMonth = MONTH_ORDER[viewIndex];
  const currentYear = currentMonth < 3 ? 2027 : 2026;

  const allEventsForMonth = useMemo(() => {
    return data.flatMap(w => w.events).filter(e => e.month === currentMonth && e.year === currentYear);
  }, [data, currentMonth, currentYear]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentMonth, currentYear]);

  const handlePrev = () => setViewIndex(prev => (prev > 0 ? prev - 1 : 0));
  const handleNext = () => setViewIndex(prev => (prev < MONTH_ORDER.length - 1 ? prev + 1 : prev));

  const daysLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // 월별 총 수업일수 계산 (데이터 내 주간 수업일수 합산)
  const monthlyTotalDays = useMemo(() => {
    return data
      .filter(w => w.month === currentMonth && w.year === currentYear)
      .reduce((sum, w) => sum + w.schoolDays, 0);
  }, [data, currentMonth, currentYear]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[720px]">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentYear}. {currentMonth < 10 ? `0${currentMonth}` : currentMonth}
          </h3>
          <div className="flex gap-1">
            <button onClick={handlePrev} disabled={viewIndex === 0} className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNext} disabled={viewIndex === MONTH_ORDER.length - 1} className="p-2 hover:bg-slate-100 rounded-xl disabled:opacity-20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-blue-100">
          월 수업일수 {monthlyTotalDays}일
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {daysLabels.map((label, i) => (
          <div key={label} className={`py-4 text-center text-[11px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-grow auto-rows-fr gap-px bg-slate-100">
        {calendarGrid.map((week, wIdx) => (
          <React.Fragment key={wIdx}>
            {week.map((dayNum, dIdx) => {
              const dayEvents = dayNum ? allEventsForMonth.filter(e => e.date === dayNum) : [];
              const uniqueEvents = Array.from(new Map<string, SchoolEvent>(dayEvents.map(e => [e.title, e])).values());

              return (
                <div key={`${wIdx}-${dIdx}`} className={`bg-white p-3 min-h-[115px] relative hover:bg-slate-50/50 transition-colors ${!dayNum ? 'bg-slate-50/30' : ''}`}>
                  {dayNum && (
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-black mb-2 ${dIdx === 0 ? 'text-red-500' : dIdx === 6 ? 'text-blue-500' : 'text-slate-800'}`}>
                        {dayNum}
                      </span>
                      <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-hide">
                        {uniqueEvents.map((evt, eIdx) => (
                          <div key={eIdx} className={`text-[10px] leading-tight px-2 py-1 rounded-lg border font-bold ${
                            evt.category === EventCategory.HOLIDAY 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;

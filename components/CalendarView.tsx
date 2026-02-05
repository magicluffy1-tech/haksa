
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

  const monthlyTotalDays = useMemo(() => {
    const monthData = data.filter(w => w.month === currentMonth && w.year === currentYear);
    // 각 주별 schoolDays를 합산하되, 주가 겹치지 않도록 실제 일수 계산
    return monthData.reduce((sum, w) => sum + w.schoolDays, 0);
  }, [data, currentMonth, currentYear]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
      <div className="flex items-center justify-between p-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{currentYear} ACADEMIC</span>
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter">
              {currentMonth}월
            </h3>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrev} disabled={viewIndex === 0} className="p-4 hover:bg-slate-100 rounded-2xl disabled:opacity-10 transition-all border border-slate-100">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNext} disabled={viewIndex === MONTH_ORDER.length - 1} className="p-4 hover:bg-slate-100 rounded-2xl disabled:opacity-10 transition-all border border-slate-100">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl shadow-xl flex flex-col items-end">
          <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">월 수업일수</span>
          <span className="text-3xl font-black tracking-tighter">{monthlyTotalDays}일</span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {daysLabels.map((label, i) => (
          <div key={label} className={`py-4 text-center text-xs font-black uppercase tracking-widest ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-600' : 'text-slate-400'}`}>
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
              const isHoliday = uniqueEvents.some(e => e.category === EventCategory.HOLIDAY);
              const isSunday = dIdx === 0;

              return (
                <div key={`${wIdx}-${dIdx}`} className={`bg-white p-4 min-h-[120px] relative group transition-all ${!dayNum ? 'bg-slate-50/30' : 'hover:bg-slate-50'}`}>
                  {dayNum && (
                    <div className="flex flex-col h-full">
                      <span className={`text-2xl font-black mb-2 tracking-tighter ${isHoliday || isSunday ? 'text-rose-500' : dIdx === 6 ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {dayNum}
                      </span>
                      <div className="space-y-1 overflow-y-auto max-h-[80px] pr-1 custom-scrollbar">
                        {uniqueEvents.map((evt, eIdx) => (
                          <div key={eIdx} className={`text-[11px] leading-tight px-2 py-1.5 rounded-lg border font-black shadow-sm ${
                            evt.category === EventCategory.HOLIDAY 
                              ? 'bg-rose-50 text-rose-600 border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
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
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CalendarView;

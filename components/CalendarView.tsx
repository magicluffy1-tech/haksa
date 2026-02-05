
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

  const daysLabels = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  const monthlyTotalDays = useMemo(() => {
    return data
      .filter(w => w.month === currentMonth && w.year === currentYear)
      .reduce((sum, w) => sum + w.schoolDays, 0);
  }, [data, currentMonth, currentYear]);

  return (
    <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[950px]">
      <div className="flex items-center justify-between p-12 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-slate-400 text-base font-black uppercase tracking-[0.3em] mb-2">{currentYear} ACADEMIC CALENDAR</span>
            <h3 className="text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none">
              {currentMonth}월
            </h3>
          </div>
          <div className="flex gap-4 ml-6">
            <button onClick={handlePrev} disabled={viewIndex === 0} className="p-5 hover:bg-slate-100 rounded-3xl disabled:opacity-5 transition-all border-2 border-slate-100 active:scale-95">
              <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNext} disabled={viewIndex === MONTH_ORDER.length - 1} className="p-5 hover:bg-slate-100 rounded-3xl disabled:opacity-5 transition-all border-2 border-slate-100 active:scale-95">
              <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center">
          <span className="text-xs font-black uppercase opacity-50 tracking-widest mb-1">월 수업일수</span>
          <span className="text-4xl font-black tracking-tighter">{monthlyTotalDays}일</span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {daysLabels.map((label, i) => (
          <div key={label} className={`py-6 text-center text-sm lg:text-base font-black uppercase tracking-[0.2em] ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-600' : 'text-slate-500'}`}>
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-grow auto-rows-fr gap-px bg-slate-200">
        {calendarGrid.map((week, wIdx) => (
          <React.Fragment key={wIdx}>
            {week.map((dayNum, dIdx) => {
              const dayEvents = dayNum ? allEventsForMonth.filter(e => e.date === dayNum) : [];
              const uniqueEvents = Array.from(new Map<string, SchoolEvent>(dayEvents.map(e => [e.title, e])).values());
              // 해당 날짜가 일요일(dIdx === 0)이거나 휴무일(EventCategory.HOLIDAY) 일정이 하나라도 있으면 빨간색
              const isHoliday = uniqueEvents.some(e => e.category === EventCategory.HOLIDAY);

              return (
                <div key={`${wIdx}-${dIdx}`} className={`bg-white p-6 min-h-[160px] relative hover:bg-indigo-50/30 transition-all ${!dayNum ? 'bg-slate-50/50' : ''}`}>
                  {dayNum && (
                    <div className="flex flex-col h-full">
                      <span className={`text-4xl lg:text-5xl font-black mb-4 tracking-tighter leading-none ${isHoliday || dIdx === 0 ? 'text-rose-500 !important' : dIdx === 6 ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {dayNum}
                      </span>
                      <div className="space-y-2 overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
                        {uniqueEvents.map((evt, eIdx) => (
                          <div key={eIdx} className={`text-[12px] lg:text-[13px] leading-tight px-3.5 py-2.5 rounded-[1.2rem] border-2 font-black shadow-sm ${
                            evt.category === EventCategory.HOLIDAY 
                              ? 'bg-rose-100 text-rose-700 border-rose-200' 
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CalendarView;

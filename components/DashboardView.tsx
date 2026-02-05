
import React, { useMemo, useState, useEffect } from 'react';
import { DashboardStats, WeeklyData, EventCategory } from '../types';
import CalendarView from './CalendarView';

interface Props {
  stats: DashboardStats;
  data: WeeklyData[];
}

const DashboardView: React.FC<Props> = ({ stats, data }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, mins: number, secs: number} | null>(null);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return data.flatMap(w => w.events)
      .map(event => {
        const eventDate = new Date(event.year, event.month - 1, event.date);
        const diff = eventDate.getTime() - today.getTime();
        return { ...event, dDay: Math.ceil(diff / (1000 * 60 * 60 * 24)), absoluteTime: diff };
      })
      .filter(e => e.absoluteTime >= -86400000) 
      .sort((a, b) => a.absoluteTime - b.absoluteTime);
  }, [data]);

  const nextMainEvent = upcomingEvents[0];

  useEffect(() => {
    if (!nextMainEvent) return;
    const timer = setInterval(() => {
      const target = new Date(nextMainEvent.year, nextMainEvent.month - 1, nextMainEvent.date).getTime();
      const now = new Date().getTime();
      const distance = target - now;
      
      if (distance < 0) {
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextMainEvent]);

  return (
    <div className="space-y-12">
      {/* Hero Section: Countdown */}
      {nextMainEvent && (
        <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 lg:p-16 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Next Academic Event
              </span>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">
                {nextMainEvent.title}
              </h2>
              <p className="text-slate-400 font-bold text-2xl">
                {nextMainEvent.month}월 {nextMainEvent.date}일 학사 일정
              </p>
            </div>
            
            {timeLeft && (
              <div className="flex flex-wrap gap-4">
                {[
                  { label: '일', val: timeLeft.days },
                  { label: '시', val: timeLeft.hours },
                  { label: '분', val: timeLeft.mins },
                  { label: '초', val: timeLeft.secs }
                ].map((unit, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-3xl border border-white/10 w-28 h-32 lg:w-36 lg:h-40 rounded-[2.5rem] transition-transform hover:scale-105">
                    <span className="text-5xl lg:text-7xl font-black tracking-tighter tabular-nums">{String(unit.val).padStart(2, '0')}</span>
                    <span className="text-xs font-black uppercase tracking-[0.2em] mt-3 opacity-40">{unit.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 text-[20rem] font-black italic text-white/5 select-none pointer-events-none tracking-tighter">MYEONGJI</div>
        </div>
      )}

      {/* Main Grid: Left Calendar (8) + Right Upcoming (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Enhanced Visibility Calendar */}
        <div className="lg:col-span-8">
          <CalendarView data={data} />
        </div>

        {/* Right: Focused Upcoming List */}
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">주요 학사 일정</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Agenda</p>
              </div>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">TOP 8</span>
            </div>
            
            <div className="space-y-8">
              {upcomingEvents.slice(0, 8).map((event, idx) => (
                <div key={idx} className="flex items-center gap-8 group">
                  <div className={`shrink-0 w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black border-2 transition-all group-hover:scale-110 shadow-sm ${
                    event.category === EventCategory.HOLIDAY 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    <span className="text-xs leading-none opacity-50 mb-1">{event.month}월</span>
                    <span className="text-3xl leading-none tracking-tighter">{event.date}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xl font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors leading-tight">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                        event.dDay === 0 
                        ? 'bg-rose-600 text-white animate-bounce' 
                        : 'bg-slate-900 text-white'
                      }`}>
                        {event.dDay === 0 ? 'D-DAY' : `D-${event.dDay}`}
                      </span>
                      <span className="text-[12px] font-bold text-slate-400">
                        {event.category === EventCategory.HOLIDAY ? '휴업일' : '학교 행사'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-100 flex flex-col justify-center relative overflow-hidden group">
            <div className="relative z-10">
                <h4 className="text-sm font-black text-indigo-200 uppercase tracking-widest mb-3">2026학년도 총 수업일수</h4>
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-black tracking-tighter group-hover:scale-105 transition-transform inline-block">
                    {stats.totalSchoolDays}
                  </span>
                  <span className="text-3xl font-bold opacity-60">일</span>
                </div>
                <p className="mt-8 text-sm font-bold text-indigo-100/60 leading-relaxed">
                  교육과정에 따라 확정된 수업 일수입니다.<br/>실시간 데이터가 반영되고 있습니다.
                </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

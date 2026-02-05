
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
    // 중복 제거 (범위형 일정은 첫 날만 표시)
    const seen = new Set();
    return data.flatMap(w => w.events)
      .filter(e => {
        const key = `${e.year}-${e.month}-${e.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
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
      {nextMainEvent && (
        <div className={`relative overflow-hidden rounded-[3rem] p-12 lg:p-16 text-white shadow-2xl transition-all duration-700 ${
          nextMainEvent.category === EventCategory.HOLIDAY ? 'bg-rose-700' : 'bg-[#0f172a]'
        }`}>
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div className="space-y-6">
              <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase ${
                nextMainEvent.category === EventCategory.HOLIDAY ? 'bg-white text-rose-700' : 'bg-indigo-500 text-white'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${nextMainEvent.category === EventCategory.HOLIDAY ? 'bg-rose-700' : 'bg-white'}`}></span>
                {nextMainEvent.category === EventCategory.HOLIDAY ? '휴업일 안내' : '다가오는 학사 일정'}
              </span>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight max-w-3xl">
                {nextMainEvent.title}
              </h2>
              <p className="text-white/70 font-bold text-2xl">
                {nextMainEvent.month}월 {nextMainEvent.date}일 {nextMainEvent.category === EventCategory.HOLIDAY ? '학교 쉬는 날' : '정규 학사 운영'}
              </p>
            </div>
            
            {timeLeft && (
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'DAYS', val: timeLeft.days },
                  { label: 'HOURS', val: timeLeft.hours },
                  { label: 'MINS', val: timeLeft.mins }
                ].map((unit, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-3xl border border-white/20 w-32 h-36 rounded-[2.5rem]">
                    <span className="text-5xl font-black tracking-tighter tabular-nums">{String(unit.val).padStart(2, '0')}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">{unit.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute -right-20 -bottom-20 text-[25rem] font-black italic text-white/5 pointer-events-none">MJ</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <CalendarView data={data} />
        </div>

        <div className="lg:col-span-4 space-y-12">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
            <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center justify-between">
              <span>📅 주요 일정 리스트</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black">NEXT 7</span>
            </h3>
            <div className="space-y-6">
              {upcomingEvents.slice(0, 7).map((event, idx) => (
                <div key={idx} className="flex items-center gap-6 group">
                  <div className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${
                    event.category === EventCategory.HOLIDAY ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-900'
                  }`}>
                    <span className="text-[10px] opacity-60">{event.month}월</span>
                    <span className="text-2xl tracking-tighter">{event.date}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-base font-black truncate text-slate-800">{event.title}</h4>
                    <span className={`text-[11px] font-bold ${event.category === EventCategory.HOLIDAY ? 'text-rose-500' : 'text-indigo-500'}`}>
                      {event.dDay === 0 ? '오늘' : `D-${event.dDay}`} • {event.category === EventCategory.HOLIDAY ? '휴업' : '행사'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">연간 총 수업일수</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black tracking-tighter">{stats.totalSchoolDays}</span>
              <span className="text-2xl font-bold opacity-60">일</span>
            </div>
            <p className="mt-6 text-sm font-medium text-indigo-100/70 leading-relaxed">
              서산명지중학교 2026학년도<br/>교육과정 기준 수업일수입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

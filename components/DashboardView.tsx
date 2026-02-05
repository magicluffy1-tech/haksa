
import React, { useMemo } from 'react';
import { DashboardStats, WeeklyData, EventCategory, SchoolEvent } from '../types';
import CalendarView from './CalendarView';

interface Props {
  stats: DashboardStats;
  data: WeeklyData[];
}

const DashboardView: React.FC<Props> = ({ stats, data }) => {
  const today = new Date();
  
  // 전체 이벤트 리스트 추출 및 D-Day 계산 (미래 일정만)
  const upcomingEvents = useMemo(() => {
    const allEvents = data.flatMap(w => w.events);
    return allEvents
      .map(event => {
        const eventDate = new Date(event.year, event.month - 1, event.date);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...event, dDay: diffDays };
      })
      .filter(event => event.dDay >= 0)
      .sort((a, b) => a.dDay - b.dDay)
      .slice(0, 6); // 상위 6개 노출
  }, [data, today]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: D-Day List */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">🗓️</span>
            주요 일정 D-Day
          </h3>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-[10px] ${
                    event.category === EventCategory.HOLIDAY ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span>{event.month}월</span>
                    <span className="text-base leading-none">{event.date}</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{event.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {event.category === EventCategory.HOLIDAY ? '공휴일/휴업' : '학사 행사'}
                    </p>
                  </div>
                  <div className={`text-xs font-black px-3 py-1.5 rounded-full ${
                    event.dDay === 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {event.dDay === 0 ? 'Today' : `D-${event.dDay}`}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-8 italic">남은 학사 일정이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-bold text-base mb-2">💡 학사 안내</h4>
            <p className="text-xs opacity-90 leading-relaxed font-medium">
              모든 일정은 학교 사정에 따라 변경될 수 있습니다.<br/>대시보드는 실시간으로 최신 정보를 반영합니다.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 font-black italic">SMJ</div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">학사 운영 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 mb-1">연간 수업일수</span>
              <span className="text-xl font-black text-slate-900">{stats.totalSchoolDays}일</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 mb-1">등록된 행사</span>
              <span className="text-xl font-black text-slate-900">{stats.totalEvents}건</span>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Complete Standard Calendar */}
      <div className="lg:col-span-8">
        <CalendarView data={data} />
      </div>
    </div>
  );
};

export default DashboardView;

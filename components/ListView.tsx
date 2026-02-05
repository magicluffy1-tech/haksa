
import React, { useState, useMemo } from 'react';
import { WeeklyData, EventCategory, SchoolEvent } from '../types';
import { MONTH_ORDER } from '../constants';

interface Props {
  data: WeeklyData[];
  onAddEvent?: (event: SchoolEvent) => void;
  onDeleteEvent?: (event: SchoolEvent) => void;
}

const ListView: React.FC<Props> = ({ data, onAddEvent, onDeleteEvent }) => {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newMonth, setNewMonth] = useState('3');
  const [newDay, setNewDay] = useState('1');
  const [newCategory, setNewCategory] = useState<EventCategory>(EventCategory.EVENT);
  const [showForm, setShowForm] = useState(false);

  const sortedItems = useMemo(() => {
    const dateMap = new Map<string, { month: number; day: number; year: number; events: SchoolEvent[] }>();

    data.forEach(week => {
      week.days.forEach(day => {
        if (!day) return;
        const dayEvents = week.events.filter(e => e.date === day);
        if (dayEvents.length > 0) {
          const key = `${week.year}-${week.month}-${day}`;
          if (!dateMap.has(key)) {
            dateMap.set(key, { month: week.month, day: day, year: week.year, events: [...dayEvents] });
          } else {
            const existing = dateMap.get(key)!;
            dayEvents.forEach(de => {
              if (!existing.events.some(ee => (ee.id && de.id ? ee.id === de.id : ee.title === de.title))) {
                existing.events.push(de);
              }
            });
          }
        }
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [data]);

  const filteredItems = sortedItems.filter(item => {
    const matchesMonth = filterMonth === 'all' || item.month.toString() === filterMonth;
    const matchesSearch = searchTerm === '' || item.events.some(e => e.title.includes(searchTerm));
    return matchesMonth && matchesSearch;
  });

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const m = parseInt(newMonth);
    const d = parseInt(newDay);
    const y = (m === 1 || m === 2) ? 2027 : 2026;

    if (onAddEvent) {
      onAddEvent({
        title: newTitle.trim(),
        month: m,
        date: d,
        year: y,
        category: newCategory,
        isManual: true
      });
    }
    setNewTitle('');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">📋 일정 목록 및 기록</h2>
          <p className="text-slate-500 font-medium italic">빨간색으로 표시된 일정은 학교가 쉬는 날입니다.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            showForm ? 'bg-slate-100 text-slate-600' : 'bg-rose-600 text-white shadow-xl shadow-rose-100 hover:scale-105 active:scale-95'
          }`}
        >
          {showForm ? '양식 닫기' : '✎ 새 일정 기록하기'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-500 p-8 animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
            <span className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg">✎</span>
            학사 일정 추가 기록
          </h3>
          <form onSubmit={handleRecord} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">기록할 행사명</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="행사명을 입력하세요"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:bg-white outline-none font-bold transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">날짜</label>
              <div className="flex gap-2">
                <select value={newMonth} onChange={(e) => setNewMonth(e.target.value)} className="w-1/2 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                  {MONTH_ORDER.map(m => <option key={m} value={m}>{m}월</option>)}
                </select>
                <input type="number" min="1" max="31" value={newDay} onChange={(e) => setNewDay(e.target.value)} className="w-1/2 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">일정 성격</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as EventCategory)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                <option value={EventCategory.EVENT}>학교 행사</option>
                <option value={EventCategory.HOLIDAY}>휴업일 (빨간색)</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button type="submit" className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-100">
                기록 완료
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 space-y-6">
          <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 space-y-8 sticky top-32">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">일정 빠른 검색</label>
              <input 
                type="text" 
                placeholder="검색어 입력..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 outline-none text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">월별 보기</label>
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
              >
                <option value="all">전체 일정</option>
                {MONTH_ORDER.map(m => <option key={m} value={m}>{m}월 일정 보기</option>)}
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-grow space-y-5">
          {filteredItems.map((item, idx) => (
            <div key={`${item.year}-${item.month}-${item.day}-${idx}`} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex items-start gap-6 relative">
              <div className={`flex-shrink-0 w-20 h-20 border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 shadow-sm ${
                item.events.some(e => e.category === EventCategory.HOLIDAY) 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-50 text-slate-900 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                <span className="text-[11px] font-black uppercase tracking-tighter opacity-60">{item.month}월</span>
                <span className="text-3xl font-black leading-none">{item.day}</span>
              </div>
              
              <div className="flex-grow pt-1.5 space-y-5">
                {item.events.map((evt, eIdx) => (
                  <div key={eIdx} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3.5 h-3.5 rounded-full ${evt.category === EventCategory.HOLIDAY ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'} shadow-lg shadow-current/20`}></div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h4 className={`text-lg font-black tracking-tight ${evt.category === EventCategory.HOLIDAY ? 'text-rose-700' : 'text-slate-900'}`}>
                          {evt.title}
                        </h4>
                        {evt.isManual && (
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">수동 기록</span>
                        )}
                      </div>
                    </div>
                    
                    {onDeleteEvent && (
                      <button 
                        onClick={() => onDeleteEvent(evt)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 transform active:scale-90"
                        title="이 일정 삭제(숨김)"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-50">
                  <span>{item.year}학년도</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className={item.events.some(e => e.category === EventCategory.HOLIDAY) ? 'text-rose-500/80' : 'text-indigo-500/60'}>
                    {item.events.some(e => e.category === EventCategory.HOLIDAY) ? '수업 외 휴업일 (공휴일/재량휴업)' : '정규 학사 운영'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListView;

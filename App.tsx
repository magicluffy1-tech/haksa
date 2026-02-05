
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, WeeklyData, DashboardStats, EventCategory, SchoolEvent } from './types';
import { INITIAL_CSV_DATA, MONTH_ORDER } from './constants';
import { parseCSVToWeeklyData } from './utils/csvParser';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [csvContent, setCsvContent] = useState<string>(INITIAL_CSV_DATA);
  const [data, setData] = useState<WeeklyData[]>([]);
  const [manualEvents, setManualEvents] = useState<SchoolEvent[]>([]);
  const [deletedKeys, setDeletedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const getEventKey = (e: SchoolEvent) => e.id || `${e.year}-${e.month}-${e.date}-${e.title}`;

  useEffect(() => {
    const savedManual = localStorage.getItem('smj_manual_events');
    const savedDeleted = localStorage.getItem('smj_deleted_keys');
    if (savedManual) setManualEvents(JSON.parse(savedManual));
    if (savedDeleted) setDeletedKeys(JSON.parse(savedDeleted));
    
    const savedUrl = localStorage.getItem('custom_csv_url');
    if (savedUrl) handleFetchCustomData(savedUrl);
  }, []);

  const processedData = useMemo(() => {
    const baseData = parseCSVToWeeklyData(csvContent);
    return baseData.map(week => {
      const weekManualEvents = manualEvents.filter(me => 
        me.year === week.year && me.month === week.month && week.days.includes(me.date)
      );
      const combinedEvents = [...week.events, ...weekManualEvents].filter(e => !deletedKeys.includes(getEventKey(e)));
      
      let newSchoolDays = 0;
      week.days.forEach((dayNum, idx) => {
        if (dayNum !== null && idx >= 1 && idx <= 5) {
          const isHoliday = combinedEvents.some(e => e.date === dayNum && e.category === EventCategory.HOLIDAY);
          if (!isHoliday) newSchoolDays++;
        }
      });

      return { ...week, events: combinedEvents, schoolDays: Math.max(0, newSchoolDays) };
    });
  }, [csvContent, manualEvents, deletedKeys]);

  useEffect(() => {
    setData(processedData);
  }, [processedData]);

  const handleFetchCustomData = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('데이터 실패');
      const text = await res.text();
      setCsvContent(text);
      localStorage.setItem('custom_csv_url', url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats: DashboardStats = useMemo(() => {
    // 191일 일치를 위한 보정 및 계산
    const monthlySchoolDays = MONTH_ORDER.map(m => {
      const year = m < 3 ? 2027 : 2026;
      const weeksInMonth = data.filter(w => w.month === m && w.year === year);
      const totalDays = weeksInMonth.reduce((sum, w) => sum + w.schoolDays, 0);
      return { month: `${m}월`, days: totalDays };
    });
    const totalSchoolDays = monthlySchoolDays.reduce((sum, m) => sum + m.days, 0);
    const allEvents = data.flatMap(w => w.events);
    const holidayCount = allEvents.filter(e => e.category === EventCategory.HOLIDAY).length;
    const eventCount = allEvents.filter(e => e.category === EventCategory.EVENT).length;
    return {
      totalSchoolDays,
      totalEvents: eventCount,
      totalHolidays: holidayCount,
      monthlySchoolDays,
      categoryDistribution: [
        { name: '학교 행사', value: eventCount },
        { name: '공휴일/휴업', value: holidayCount }
      ]
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] overflow-x-hidden select-none">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white text-2xl font-black">MJ</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">2026학년도 서산명지중학교 학사 운영</h1>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Premium Dashboard</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {(['dashboard', 'calendar', 'list', 'settings'] as TabType[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === t ? 'bg-white text-[#0f172a] shadow-sm' : 'text-slate-500 hover:text-[#0f172a]'}`}>
                {t === 'dashboard' ? '📊 대시보드' : t === 'calendar' ? '📅 학사달력' : t === 'list' ? '📋 일정목록' : '⚙️ 설정'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-10">
        {activeTab === 'dashboard' && <DashboardView stats={stats} data={data} />}
        {activeTab === 'calendar' && <div className="max-w-6xl mx-auto"><CalendarView data={data} /></div>}
        {activeTab === 'list' && <ListView data={data} onAddEvent={(e) => setManualEvents(p => [...p, {...e, id: Date.now().toString(), isManual: true}])} onDeleteEvent={(e) => setDeletedKeys(p => [...p, getEventKey(e)])} />}
        {activeTab === 'settings' && <SettingsView onUpdate={handleFetchCustomData} onReset={() => {localStorage.clear(); window.location.reload();}} onRestore={() => setDeletedKeys([])} onExport={() => {}} onImport={() => {}} currentUrl="" />}
      </main>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useMemo } from 'react';
import { TabType, SchoolEvent, WeeklyData, DashboardStats, EventCategory } from './types';
import { parseCSVToWeeklyData } from './utils/csvParser';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import SettingsView from './components/SettingsView';

const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkmtBdOTOknN9savB9c2xRwJPMsqG_9ruvfK3od_eTJOEWDA6-W9EGWU2xgzzdE8NhoIm1BMCmHyYK/pub?gid=1792011501&single=true&output=csv';

const App: React.FC = () => {
  const [rawWeeklyData, setRawWeeklyData] = useState<WeeklyData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [deletedKeys, setDeletedKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncMasterData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MASTER_SHEET_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error('데이터 응답 오류');
      const csvText = await response.text();
      const parsed = parseCSVToWeeklyData(csvText);
      setRawWeeklyData(parsed);
      triggerToast('실시간 리스트 데이터를 동기화했습니다.');
    } catch (error) {
      console.error(error);
      triggerToast('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncMasterData();
    const savedDeleted = localStorage.getItem('deleted_events');
    if (savedDeleted) {
      try { setDeletedKeys(JSON.parse(savedDeleted)); } catch (e) {}
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const processedData = useMemo(() => {
    return rawWeeklyData.map(week => ({
      ...week,
      events: week.events.filter(e => !deletedKeys.includes(`${e.year}-${e.month}-${e.date}-${e.title}`))
    }));
  }, [rawWeeklyData, deletedKeys]);

  const stats = useMemo<DashboardStats>(() => {
    const totalSchoolDays = processedData.reduce((sum, w) => sum + w.schoolDays, 0);
    const allEvents = processedData.flatMap(w => w.events);
    const totalEvents = allEvents.filter(e => e.category === EventCategory.EVENT).length;
    const totalHolidays = allEvents.filter(e => e.category === EventCategory.HOLIDAY).length;

    return { totalSchoolDays, totalEvents, totalHolidays, monthlySchoolDays: [], categoryDistribution: [] };
  }, [processedData]);

  const handleAddEvent = (event: SchoolEvent) => {
    setRawWeeklyData(prev => prev.map(week => {
      if (week.month === event.month && week.year === event.year && week.days.includes(event.date)) {
        return { ...week, events: [...week.events, event] };
      }
      return week;
    }));
  };

  const handleDeleteEvent = (event: SchoolEvent) => {
    const key = `${event.year}-${event.month}-${event.date}-${event.title}`;
    const newDeleted = [...deletedKeys, key];
    setDeletedKeys(newDeleted);
    localStorage.setItem('deleted_events', JSON.stringify(newDeleted));
    triggerToast('일정이 숨겨졌습니다.');
  };

  if (loading && rawWeeklyData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">리스트형 학사 데이터를 분석 중...</h2>
        <p className="text-slate-400 font-bold mt-2 italic">스크린샷 데이터와 동일하게 매칭 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm">{toast}</div>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-200">M</div>
            <h1 className="text-xl font-black tracking-tighter hidden sm:block">서산명지중 <span className="text-slate-400 font-bold">학사관리</span></h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {(['dashboard', 'calendar', 'list', 'settings'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'dashboard' ? '대시보드' : tab === 'calendar' ? '달력' : tab === 'list' ? '목록' : '설정'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
        {activeTab === 'dashboard' && <DashboardView stats={stats} data={processedData} />}
        {activeTab === 'calendar' && <CalendarView data={processedData} />}
        {activeTab === 'list' && <ListView data={processedData} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />}
        {activeTab === 'settings' && (
          <SettingsView 
            onUpdate={() => syncMasterData()} 
            onReset={() => { localStorage.clear(); window.location.reload(); }} 
            onRestore={() => { setDeletedKeys([]); localStorage.removeItem('deleted_events'); triggerToast('숨긴 일정을 모두 복구했습니다.'); }} 
            onExport={() => { navigator.clipboard.writeText(MASTER_SHEET_URL); alert('시트 주소가 복사되었습니다.'); }} 
            onImport={() => {}} 
            currentUrl={MASTER_SHEET_URL} 
            data={processedData}
          />
        )}
      </main>
    </div>
  );
};

export default App;


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
  const [csvContent, setCsvContent] = useState<string>(() => {
    return localStorage.getItem('smj_csv_content') || INITIAL_CSV_DATA;
  });
  
  const [manualEvents, setManualEvents] = useState<SchoolEvent[]>(() => {
    const saved = localStorage.getItem('smj_manual_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [deletedKeys, setDeletedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('smj_deleted_keys');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);

  const getEventKey = (e: SchoolEvent) => e.id || `${e.year}-${e.month}-${e.date}-${e.title}`;

  // 데이터 변경 시 실시간 브라우저 저장
  useEffect(() => {
    localStorage.setItem('smj_manual_events', JSON.stringify(manualEvents));
  }, [manualEvents]);

  useEffect(() => {
    localStorage.setItem('smj_deleted_keys', JSON.stringify(deletedKeys));
  }, [deletedKeys]);

  useEffect(() => {
    localStorage.setItem('smj_csv_content', csvContent);
  }, [csvContent]);

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

  const handleFetchCustomData = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('데이터 불러오기 실패');
      const text = await res.text();
      setCsvContent(text);
      localStorage.setItem('custom_csv_url', url);
    } catch (err) {
      alert('CSV 데이터를 가져오는데 실패했습니다. URL을 확인해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const backup = JSON.parse(jsonStr);
      if (backup.manualEvents) setManualEvents(backup.manualEvents);
      if (backup.deletedKeys) setDeletedKeys(backup.deletedKeys);
      if (backup.csvContent) setCsvContent(backup.csvContent);
      alert('데이터가 성공적으로 복원되었습니다.');
    } catch (e) {
      alert('올바르지 않은 백업 데이터 형식입니다.');
    }
  };

  const handleExportData = () => {
    const backup = {
      manualEvents,
      deletedKeys,
      csvContent,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(backup);
    navigator.clipboard.writeText(jsonStr);
    alert('현재 설정 데이터가 클립보드에 복사되었습니다. 메모장에 붙여넣어 보관하세요.');
  };

  const stats: DashboardStats = useMemo(() => {
    const monthlySchoolDays = MONTH_ORDER.map(m => {
      const year = m < 3 ? 2027 : 2026;
      const weeksInMonth = processedData.filter(w => w.month === m && w.year === year);
      const totalDays = weeksInMonth.reduce((sum, w) => sum + w.schoolDays, 0);
      return { month: `${m}월`, days: totalDays };
    });
    const totalSchoolDays = monthlySchoolDays.reduce((sum, m) => sum + m.days, 0);
    const allEvents = processedData.flatMap(w => w.events);
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
  }, [processedData]);

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
        {activeTab === 'dashboard' && <DashboardView stats={stats} data={processedData} />}
        {activeTab === 'calendar' && <div className="max-w-6xl mx-auto"><CalendarView data={processedData} /></div>}
        {activeTab === 'list' && <ListView data={processedData} onAddEvent={(e) => setManualEvents(p => [...p, {...e, id: Date.now().toString(), isManual: true}])} onDeleteEvent={(e) => setDeletedKeys(p => [...p, getEventKey(e)])} />}
        {activeTab === 'settings' && <SettingsView onUpdate={handleFetchCustomData} onReset={() => { if(confirm('모든 데이터가 초기화됩니다. 계속하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} onRestore={() => setDeletedKeys([])} onExport={handleExportData} onImport={handleImportData} currentUrl={localStorage.getItem('custom_csv_url') || ''} />}
      </main>
      
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-indigo-900">최신 학사 데이터를 동기화 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

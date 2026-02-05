
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
  const [lastSync, setLastSync] = useState<string>('');

  const getEventKey = (e: SchoolEvent) => e.id || `${e.year}-${e.month}-${e.date}-${e.title}`;

  useEffect(() => {
    const savedManual = localStorage.getItem('smj_manual_events');
    const savedDeleted = localStorage.getItem('smj_deleted_keys');
    if (savedManual) setManualEvents(JSON.parse(savedManual));
    if (savedDeleted) setDeletedKeys(JSON.parse(savedDeleted));
  }, []);

  useEffect(() => {
    localStorage.setItem('smj_manual_events', JSON.stringify(manualEvents));
    localStorage.setItem('smj_deleted_keys', JSON.stringify(deletedKeys));
  }, [manualEvents, deletedKeys]);

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
    setLastSync(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [processedData]);

  useEffect(() => {
    const savedUrl = localStorage.getItem('custom_csv_url');
    if (savedUrl) handleFetchCustomData(savedUrl);
  }, []);

  const handleFetchCustomData = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('데이터를 가져오는데 실패했습니다.');
      const text = await res.text();
      setCsvContent(text);
      localStorage.setItem('custom_csv_url', url);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("모든 설정과 기록을 초기화하시겠습니까?")) {
      setCsvContent(INITIAL_CSV_DATA);
      setManualEvents([]);
      setDeletedKeys([]);
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRestoreDeleted = () => {
    if (window.confirm("삭제했던 모든 일정을 복원하시겠습니까?")) {
      setDeletedKeys([]);
    }
  };

  const handleAddManualEvent = (event: SchoolEvent) => {
    setManualEvents(prev => [...prev, { ...event, id: Date.now().toString(), isManual: true }]);
  };

  const handleDeleteEvent = (event: SchoolEvent) => {
    const key = getEventKey(event);
    if (window.confirm(`'${event.title}' 일정을 삭제하시겠습니까?`)) {
      if (event.isManual) {
        setManualEvents(prev => prev.filter(e => e.id !== event.id));
      } else {
        setDeletedKeys(prev => [...prev, key]);
      }
    }
  };

  // 데이터 백업 기능
  const handleExportData = () => {
    const backupData = {
      manualEvents,
      deletedKeys,
      customUrl: localStorage.getItem('custom_csv_url') || ''
    };
    const dataStr = JSON.stringify(backupData);
    navigator.clipboard.writeText(dataStr);
    alert("데이터가 클립보드에 복사되었습니다! 메모장 등에 보관하거나 다른 기기에서 가져오기 할 때 사용하세요.");
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const imported = JSON.parse(jsonStr);
      if (imported.manualEvents) setManualEvents(imported.manualEvents);
      if (imported.deletedKeys) setDeletedKeys(imported.deletedKeys);
      if (imported.customUrl) handleFetchCustomData(imported.customUrl);
      alert("데이터 복구가 완료되었습니다.");
    } catch (e) {
      alert("올바르지 않은 데이터 형식입니다.");
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const allEvents = data.flatMap(w => w.events);
    const monthlySchoolDays = MONTH_ORDER.map(m => {
      const year = m < 3 ? 2027 : 2026;
      const weeksInMonth = data.filter(w => w.month === m && w.year === year);
      const totalDays = weeksInMonth.reduce((sum, w) => sum + w.schoolDays, 0);
      return { month: `${m}월`, days: totalDays };
    });
    const totalSchoolDays = monthlySchoolDays.reduce((sum, m) => sum + m.days, 0);
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=200&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                  alt="School Logo"
                  onError={(e) => { e.currentTarget.src = "https://img.icons8.com/fluency/96/school.png"; }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">2026학년도 서산명지중학교 학사 일정</h1>
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-blue-100 shadow-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                <span className="text-blue-500 font-black">연간 수업 {stats.totalSchoolDays}일</span> • {lastSync} 업데이트
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            {[
              { id: 'dashboard', label: '종합 현황' },
              { id: 'calendar', label: '학사 달력' },
              { id: 'list', label: '일정 목록/기록' },
              { id: 'settings', label: '데이터 관리' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-md transform scale-105'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {activeTab === 'dashboard' && <DashboardView stats={stats} data={data} />}
            {activeTab === 'calendar' && <CalendarView data={data} />}
            {activeTab === 'list' && (
              <ListView data={data} onAddEvent={handleAddManualEvent} onDeleteEvent={handleDeleteEvent} />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                onUpdate={handleFetchCustomData} 
                onReset={handleReset} 
                onRestore={handleRestoreDeleted}
                onExport={handleExportData}
                onImport={handleImportData}
                currentUrl={localStorage.getItem('custom_csv_url') || ''} 
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

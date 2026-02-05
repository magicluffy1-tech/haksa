
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
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const getEventKey = (e: SchoolEvent) => e.id || `${e.year}-${e.month}-${e.date}-${e.title}`;

  useEffect(() => {
    const savedManual = localStorage.getItem('smj_manual_events');
    const savedDeleted = localStorage.getItem('smj_deleted_keys');
    if (savedManual) setManualEvents(JSON.parse(savedManual));
    if (savedDeleted) setDeletedKeys(JSON.parse(savedDeleted));
    
    const savedUrl = localStorage.getItem('custom_csv_url');
    if (savedUrl) handleFetchCustomData(savedUrl);
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
    setLastSync(new Date());
  }, [processedData]);

  const handleFetchCustomData = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('데이터를 가져오는데 실패했습니다.');
      const text = await res.text();
      setCsvContent(text);
      localStorage.setItem('custom_csv_url', url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("모든 설정과 기록을 초기화하시겠습니까?")) {
      localStorage.clear();
      window.location.reload();
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-black">MJ</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">2026학년도 서산명지중학교 학사 운영</h1>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Dashboard</span>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'dashboard', label: '대시보드', icon: '📊' },
                { id: 'calendar', label: '학사달력', icon: '📅' },
                { id: 'list', label: '상세일정', icon: '📋' },
                { id: 'settings', label: '설정', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">최신 학사 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'dashboard' && <DashboardView stats={stats} data={data} />}
            {activeTab === 'calendar' && <CalendarView data={data} />}
            {activeTab === 'list' && (
              <ListView 
                data={data} 
                onAddEvent={(e) => setManualEvents(p => [...p, {...e, id: Date.now().toString(), isManual: true}])}
                onDeleteEvent={(e) => {
                  const key = getEventKey(e);
                  if(e.isManual) setManualEvents(p => p.filter(me => me.id !== e.id));
                  else setDeletedKeys(p => [...p, key]);
                }} 
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                onUpdate={handleFetchCustomData} 
                onReset={handleReset}
                onRestore={() => setDeletedKeys([])}
                onExport={() => {
                  navigator.clipboard.writeText(JSON.stringify({manualEvents, deletedKeys}));
                  alert("데이터가 복사되었습니다.");
                }}
                onImport={(s) => {
                  try {
                    const d = JSON.parse(s);
                    setManualEvents(d.manualEvents || []);
                    setDeletedKeys(d.deletedKeys || []);
                    alert("성공적으로 가져왔습니다.");
                  } catch(e) { alert("형식이 잘못되었습니다."); }
                }}
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

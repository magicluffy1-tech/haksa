
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, WeeklyData, DashboardStats, EventCategory, SchoolEvent } from './types';
import { INITIAL_CSV_DATA, MONTH_ORDER } from './constants';
import { parseCSVToWeeklyData } from './utils/csvParser';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import SettingsView from './components/SettingsView';

const MASTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQkmtBdOTOknN9savB9c2xRwJPMsqG_9ruvfK3od_eTJOEWDA6-W9EGWU2xgzzdE8NhoIm1BMCmHyYK/pub?output=csv';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

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

  const getEventKey = (e: SchoolEvent) => e.id || `${e.year}-${e.month}-${e.date}-${e.title}`;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const syncMasterData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${MASTER_SHEET_URL}&t=${Date.now()}`, {
        mode: 'cors'
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 100) {
          setCsvContent(text);
          localStorage.setItem('smj_csv_content', text);
          setLastSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString());
        } else {
          throw new Error("Invalid CSV length");
        }
      } else {
        throw new Error("Fetch failed");
      }
    } catch (e) {
      console.error("Master sync failed", e);
      setLastSyncStatus('error');
      triggerToast('마스터 데이터 동기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncMasterData();
  }, []);

  useEffect(() => {
    localStorage.setItem('smj_manual_events', JSON.stringify(manualEvents));
    localStorage.setItem('smj_deleted_keys', JSON.stringify(deletedKeys));
  }, [manualEvents, deletedKeys]);

  const processedData = useMemo(() => {
    let raw = parseCSVToWeeklyData(csvContent);
    if (raw.length === 0) {
      raw = parseCSVToWeeklyData(INITIAL_CSV_DATA);
    }
    
    return raw.map(week => {
      const weekManualEvents = manualEvents.filter(me => 
        me.year === week.year && me.month === week.month && week.days.includes(me.date)
      );
      const combinedEvents = [...week.events, ...weekManualEvents]
        .filter(e => !deletedKeys.includes(getEventKey(e)));
      
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

  const stats: DashboardStats = useMemo(() => {
    const monthlySchoolDays = MONTH_ORDER.map(m => {
      const year = m < 3 ? 2027 : 2026;
      const weeksInMonth = processedData.filter(w => w.month === m && w.year === year);
      const totalDays = weeksInMonth.reduce((sum, w) => sum + w.schoolDays, 0);
      return { month: `${m}월`, days: totalDays };
    });
    return {
      totalSchoolDays: monthlySchoolDays.reduce((sum, m) => sum + m.days, 0),
      totalEvents: processedData.flatMap(w => w.events).filter(e => e.category === EventCategory.EVENT).length,
      totalHolidays: processedData.flatMap(w => w.events).filter(e => e.category === EventCategory.HOLIDAY).length,
      monthlySchoolDays,
      categoryDistribution: []
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">2026학년도 서산명지중학교 학사 운영</h1>
                {lastSyncStatus === 'success' ? (
                  <div className="flex flex-col">
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2 w-fit">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 동기화 완료
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold mt-0.5 ml-1">최근: {lastSyncTime}</span>
                  </div>
                ) : lastSyncStatus === 'error' ? (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full">동기화 실패</span>
                ) : (
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full">동기화 준비</span>
                )}
              </div>
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
        {processedData.length === 0 && !loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">데이터를 불러올 수 없습니다</h2>
            <p className="text-slate-500 font-bold">구글 시트의 양식이 올바른지, 혹은 '웹에 게시'가 CSV 형식으로 설정되었는지 확인해주세요.</p>
            <button onClick={syncMasterData} className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">다시 시도하기</button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView stats={stats} data={processedData} />}
            {activeTab === 'calendar' && <div className="max-w-6xl mx-auto"><CalendarView data={processedData} /></div>}
            {activeTab === 'list' && (
              <ListView 
                data={processedData} 
                onAddEvent={(e) => {
                  setManualEvents(p => [...p, {...e, id: Date.now().toString(), isManual: true}]);
                  triggerToast('내 브라우저에 임시 일정이 추가되었습니다.');
                }} 
                onDeleteEvent={(e) => {
                  setDeletedKeys(p => [...p, getEventKey(e)]);
                  triggerToast('일정이 내 화면에서 숨겨졌습니다.');
                }} 
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                onUpdate={syncMasterData} 
                onReset={() => { if(confirm('설정을 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} 
                onRestore={() => { setDeletedKeys([]); triggerToast('숨긴 일정을 모두 복구했습니다.'); }} 
                onExport={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('대시보드 접속 주소가 복사되었습니다.');
                }} 
                onImport={() => {}} 
                currentUrl={MASTER_SHEET_URL} 
              />
            )}
          </>
        )}
      </main>
      
      {showToast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-300 z-[100] border border-white/10">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
          <span className="font-black text-sm">{toastMsg}</span>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xl text-indigo-900 tracking-tighter">마스터 데이터 동기화 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

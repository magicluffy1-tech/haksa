
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
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. 데이터 소스 결정 (URL 파라미터 확인)
  const queryParams = new URLSearchParams(window.location.search);
  const sharedUrl = queryParams.get('source');

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

  // 2. 앱 실행 시 공유된 데이터가 있다면 즉시 동기화
  useEffect(() => {
    const initData = async () => {
      if (sharedUrl) {
        setLoading(true);
        try {
          const res = await fetch(sharedUrl);
          if (res.ok) {
            const text = await res.text();
            setCsvContent(text);
            localStorage.setItem('smj_csv_content', text);
            localStorage.setItem('custom_csv_url', sharedUrl);
            triggerToast('공유된 마스터 데이터와 동기화되었습니다.');
          }
        } catch (e) {
          console.error("Shared data sync failed", e);
        } finally {
          setLoading(false);
        }
      }
    };
    initData();
  }, [sharedUrl]);

  // 3. 실시간 로컬 백업 (개인 작업용)
  useEffect(() => {
    localStorage.setItem('smj_manual_events', JSON.stringify(manualEvents));
    localStorage.setItem('smj_deleted_keys', JSON.stringify(deletedKeys));
    localStorage.setItem('smj_csv_content', csvContent);
  }, [manualEvents, deletedKeys, csvContent]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleFetchCustomData = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('불러오기 실패');
      const text = await res.text();
      setCsvContent(text);
      localStorage.setItem('custom_csv_url', url);
      triggerToast('데이터가 성공적으로 동기화되었습니다.');
    } catch (err) {
      alert('데이터 주소가 올바르지 않거나 접근 권한이 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 4. 데이터 가공 로직
  const processedData = useMemo(() => {
    const baseData = parseCSVToWeeklyData(csvContent);
    return baseData.map(week => {
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

  const currentUrl = localStorage.getItem('custom_csv_url') || '';

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
                {sharedUrl || currentUrl ? (
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 공용 서버 동기화 모드
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200">
                    개인 로컬 모드
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                {sharedUrl ? 'Shared Source: 구글 시트 마스터 데이터' : 'Local Source: 브라우저 캐시 데이터'}
              </p>
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
        {activeTab === 'list' && (
          <ListView 
            data={processedData} 
            onAddEvent={(e) => {
              setManualEvents(p => [...p, {...e, id: Date.now().toString(), isManual: true}]);
              triggerToast('일정이 추가되었습니다.');
            }} 
            onDeleteEvent={(e) => {
              setDeletedKeys(p => [...p, getEventKey(e)]);
              triggerToast('일정이 숨김 처리되었습니다.');
            }} 
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView 
            onUpdate={handleFetchCustomData} 
            onReset={() => { if(confirm('모든 데이터가 초기화됩니다.')) { localStorage.clear(); window.location.href = window.location.origin + window.location.pathname; } }} 
            onRestore={() => { setDeletedKeys([]); triggerToast('모든 일정을 복구했습니다.'); }} 
            onExport={() => {
              const url = currentUrl || '';
              const shareLink = `${window.location.origin}${window.location.pathname}?source=${encodeURIComponent(url)}`;
              navigator.clipboard.writeText(shareLink);
              alert('모두에게 공유할 수 있는 [마스터 링크]가 복사되었습니다!');
            }} 
            onImport={(json) => {
              try {
                const b = JSON.parse(json);
                if(b.manualEvents) setManualEvents(b.manualEvents);
                if(b.deletedKeys) setDeletedKeys(b.deletedKeys);
                alert('데이터 복구 완료');
              } catch(e) { alert('코드 오류'); }
            }} 
            currentUrl={currentUrl} 
          />
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

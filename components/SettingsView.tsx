
import React, { useState } from 'react';
import { WeeklyData, EventCategory, SchoolEvent } from '../types';

interface Props {
  onUpdate: (url: string) => void;
  onReset: () => void;
  onRestore: () => void;
  onExport: () => void;
  onImport: (jsonStr: string) => void;
  currentUrl: string;
  data: WeeklyData[];
}

const SettingsView: React.FC<Props> = ({ onUpdate, onReset, onRestore, onExport, onImport, currentUrl, data }) => {
  const [showDebug, setShowDebug] = useState(false);

  // 모든 이벤트를 평탄화하여 중복 제거 후 정렬
  // SchoolEvent 타입을 명시하여 unknown 오류 수정
  const allEvents = Array.from(new Map<string, SchoolEvent>(
    data.flatMap(w => w.events).map(e => [`${e.year}-${e.month}-${e.date}-${e.title}`, e] as [string, SchoolEvent])
  ).values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.date - b.date;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4 tracking-tighter">⚙️ 시스템 설정 및 진단</h2>
          <p className="text-indigo-50 text-lg font-bold leading-relaxed max-w-2xl">
            데이터가 올바르게 표시되지 않는다면 아래의 진단 도구를 통해<br/>
            시스템이 구글 시트에서 어떤 데이터를 읽어왔는지 확인하세요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
          <h3 className="text-2xl font-black text-slate-900 mb-6">데이터 소스</h3>
          <div className="p-5 bg-slate-50 rounded-2xl font-mono text-[10px] text-slate-400 break-all border border-slate-100 mb-6">
            {currentUrl}
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">
            🔄 시트 데이터 즉시 새로고침
          </button>
        </section>

        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">공유 및 복구</h3>
            <div className="flex flex-col gap-3">
              <button onClick={onExport} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm">📋 주소 복사하기</button>
              <button onClick={onRestore} className="w-full py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-sm">🔄 숨긴 일정 모두 복구</button>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-sm">
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <div className="text-left">
            <h4 className="text-xl font-black text-slate-900">🔍 데이터 진단 (분석 결과 보기)</h4>
            <p className="text-sm text-slate-400 font-bold">시스템이 시트에서 성공적으로 추출한 모든 일정 목록입니다.</p>
          </div>
          <span className={`text-2xl transition-transform ${showDebug ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showDebug && (
          <div className="p-8 bg-slate-50 border-t-2 border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allEvents.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-400 font-black">추출된 일정이 없습니다. 시트 양식을 확인해주세요.</div>
              ) : (
                allEvents.map((e, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-black text-xs ${e.category === EventCategory.HOLIDAY ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <span>{e.month}월</span>
                      <span>{e.date}일</span>
                    </div>
                    <div className="font-bold text-sm text-slate-800 truncate">{e.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center pt-10">
        <button onClick={onReset} className="text-slate-300 hover:text-rose-500 font-black text-xs underline decoration-dotted">
          모든 로컬 설정 초기화
        </button>
      </div>
    </div>
  );
};

export default SettingsView;


import React, { useState } from 'react';

interface Props {
  onUpdate: (url: string) => void;
  onReset: () => void;
  onRestore: () => void;
  onExport: () => void;
  onImport: (jsonStr: string) => void;
  currentUrl: string;
}

const SettingsView: React.FC<Props> = ({ onUpdate, onReset, onRestore, onExport, onImport, currentUrl }) => {
  const [urlInput, setUrlInput] = useState(currentUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onUpdate(urlInput.trim());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-emerald-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4 tracking-tighter">🌍 전역 마스터 동기화 완료</h2>
          <p className="text-emerald-50 text-lg font-bold leading-relaxed max-w-2xl">
            이 대시보드는 현재 구글 스프레드시트와 직접 연결되어 있습니다.<br/>
            시트의 내용을 수정하면 접속하는 모든 사람에게 동일한 결과가 보여집니다.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 text-[15rem] font-black text-white/10 italic select-none">LIVE</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8">
          <div>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">데이터 관리</span>
            <h3 className="text-2xl font-black text-slate-900">연동된 구글 시트 주소</h3>
          </div>
          <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-slate-400 break-all text-xs">
            {currentUrl}
          </div>
          <p className="text-xs text-slate-400 font-bold leading-relaxed italic">
            * 구글 시트의 [파일 &gt; 공유 &gt; 웹에 게시 &gt; CSV 형식] 주소가 적용되어 있습니다.
          </p>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl active:scale-95">
            🔄 강제 새로고침 (데이터 동기화)
          </button>
        </section>

        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">공유 기능</span>
            <h3 className="text-2xl font-black text-slate-900">공용 주소 복사</h3>
            <p className="text-sm text-slate-500 font-bold mt-4 leading-relaxed">
              이 주소를 다른 선생님들이나 학생들에게 공유하세요. 누구나 동일한 학사 운영 대시보드를 확인할 수 있습니다.
            </p>
          </div>
          <button 
            onClick={onExport}
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            📋 대시보드 주소 복사하기
          </button>
        </section>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xl font-black text-slate-900">숨김 일정 복구</h4>
          <p className="text-sm text-slate-400 font-bold mt-1">내가 실수로 숨긴 일정들을 다시 화면에 표시합니다.</p>
        </div>
        <button 
          onClick={onRestore}
          className="px-10 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black border border-indigo-100 hover:bg-indigo-100 transition-all"
        >
          일정 모두 복구
        </button>
      </div>
    </div>
  );
};

export default SettingsView;

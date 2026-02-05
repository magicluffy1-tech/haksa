
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
  const [importInput, setImportInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onUpdate(urlInput.trim());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4 tracking-tighter">🔗 모두와 공유하는 대시보드 만들기</h2>
          <p className="text-indigo-100 text-lg font-bold leading-relaxed max-w-2xl">
            구글 스프레드시트와 연동하면 내가 수정한 내용이 모든 사용자에게 실시간으로 공유됩니다.<br/>
            선생님들, 학생들과 함께 동일한 학사 일정을 확인하세요.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 text-[15rem] font-black text-white/10 italic select-none">SYNC</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 마스터 데이터 연동 */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8">
          <div>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Step 1. 서버 연동</span>
            <h3 className="text-2xl font-black text-slate-900">구글 시트 CSV 주소 등록</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="구글 시트 웹 게시 CSV URL (https://...)"
              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:border-indigo-600 outline-none font-bold transition-all"
            />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl active:scale-95">
              🔄 마스터 데이터 동기화
            </button>
          </form>
          <p className="text-xs text-slate-400 font-bold leading-relaxed italic">
            * 구글 시트의 [파일 > 공유 > 웹에 게시 > CSV 형식]으로 선택한 뒤 생성된 주소를 입력하세요.
          </p>
        </section>

        {/* 공유 링크 생성 */}
        <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 flex flex-col justify-between">
          <div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Step 2. 링크 공유</span>
            <h3 className="text-2xl font-black text-slate-900">공용 접속 링크 복사</h3>
            <p className="text-sm text-slate-500 font-bold mt-4 leading-relaxed">
              위에서 등록한 데이터가 자동으로 포함된 [마스터 링크]를 생성합니다. 이 링크를 다른 사람들에게 전달하면 모두가 동일한 화면을 보게 됩니다.
            </p>
          </div>
          <button 
            onClick={onExport}
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            마스터 공유 링크 복사하기
          </button>
        </section>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xl font-black text-slate-900">시스템 초기화</h4>
          <p className="text-sm text-slate-400 font-bold mt-1">저장된 모든 로컬 데이터를 삭제하고 초기 상태로 되돌립니다.</p>
        </div>
        <button 
          onClick={onReset}
          className="px-10 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black border border-rose-100 hover:bg-rose-100 transition-all"
        >
          전체 초기화
        </button>
      </div>
    </div>
  );
};

export default SettingsView;


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

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) {
      alert('복원할 데이터 코드를 입력해주세요.');
      return;
    }
    onImport(importInput.trim());
    setImportInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">⚙️ 학사 데이터 시스템 관리</h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          실시간 데이터 연동 및 개인화된 학사 운영 설정을 관리합니다.<br/>
          수정한 내용은 브라우저에 자동 저장되어 실시간으로 대시보드에 반영됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Sync & Backup */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 hover:border-blue-300 transition-colors">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">구글 시트 실시간 연동</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="게시된 CSV URL 주소 (https://...)"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold placeholder:font-medium"
              />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]">
                🔄 서버 데이터 즉시 동기화
              </button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 hover:border-slate-400 transition-colors">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 내보내기 (백업)</h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                사용자가 수동으로 기록한 일정, 숨김 처리한 항목, 현재 적용된 전체 데이터를 코드로 변환하여 복사합니다.
              </p>
              <button 
                onClick={onExport}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                📥 설정 데이터 클립보드 복사
              </button>
            </div>
          </section>
        </div>

        {/* Right: Import & Reset */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 hover:border-emerald-300 transition-colors">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 가져오기 (복원)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea 
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="복사해둔 백업 코드를 여기에 붙여넣으세요"
                className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-xs resize-none"
              />
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]">
                ✅ 데이터 복원 및 적용
              </button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">시스템 제어</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={onRestore}
                className="w-full py-3 bg-white text-blue-600 rounded-2xl font-black border border-blue-200 hover:bg-blue-50 transition-all text-sm active:scale-[0.98]"
              >
                숨긴 일정 모두 다시 표시
              </button>
              <button 
                onClick={onReset}
                className="w-full py-3 bg-white text-red-600 rounded-2xl font-black border border-red-200 hover:bg-red-50 transition-all text-sm active:scale-[0.98]"
              >
                ⚠️ 데이터 전체 초기화
              </button>
            </div>
          </section>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem]">
        <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center text-xs">!</span>
          실시간 반영 안내
        </h4>
        <p className="text-xs text-blue-700 font-bold leading-relaxed opacity-80">
          모든 변경 사항은 브라우저의 로컬 스토리지에 즉시 저장됩니다. 별도의 '저장' 버튼을 누르지 않아도 새로고침 시 데이터가 유지됩니다.<br/>
          다만, 브라우저 방문 기록을 지우거나 다른 컴퓨터에서 접속할 경우에는 '데이터 내보내기' 코드를 통해 수동으로 옮겨주셔야 합니다.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;

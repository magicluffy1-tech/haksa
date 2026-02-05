
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
    if (!importInput.trim()) return;
    onImport(importInput.trim());
    setImportInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">⚙️ 학사 데이터 시스템 관리</h2>
        <p className="text-slate-500 font-medium">
          학교 웹사이트 공유를 위한 데이터 연동 및 백업 설정을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Sync & Backup */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">구글 시트 연동</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="게시된 CSV URL 주소"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold"
              />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                시트 데이터 동기화
              </button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 내보내기 (백업)</h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                지금까지 기록한 일정과 삭제 설정을 텍스트 형식으로 복사합니다. 다른 컴퓨터로 옮길 때 사용하세요.
              </p>
              <button 
                onClick={onExport}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                📥 현재 데이터 클립보드 복사
              </button>
            </div>
          </section>
        </div>

        {/* Right: Import & Reset */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 가져오기 (복원)</h3>
            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea 
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="백업한 데이터를 여기에 붙여넣으세요"
                className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-xs resize-none"
              />
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                데이터 복원 실행
              </button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">시스템 제어</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={onRestore}
                className="w-full py-3 bg-white text-blue-600 rounded-2xl font-black border border-blue-200 hover:bg-blue-50 transition-all text-sm"
              >
                숨긴 일정 모두 복원
              </button>
              <button 
                onClick={onReset}
                className="w-full py-3 bg-white text-red-600 rounded-2xl font-black border border-red-200 hover:bg-red-50 transition-all text-sm"
              >
                전체 초기화 (공장 상태로)
              </button>
            </div>
          </section>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
        <h4 className="text-sm font-black text-blue-900 mb-2">💡 알려드립니다</h4>
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          이 앱은 별도의 서버 없이 사용자의 브라우저에만 정보를 저장합니다. 
          따라서 기기를 바꾸거나 브라우저 캐시를 삭제하면 직접 기록한 일정이 사라질 수 있습니다. 
          주기적으로 <b>데이터 내보내기</b>를 통해 백업해 두시는 것을 권장합니다.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;

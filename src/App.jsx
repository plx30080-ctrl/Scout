// App.jsx
import { useState } from 'react';
import NavBar from './components/NavBar';
import TerritoryView from './views/TerritoryView';
import RoutePlannerView from './views/RoutePlannerView';
import CampaignView from './views/CampaignView';
import CallPrepView from './views/CallPrepView';
import ActivityLogView from './views/ActivityLogView';

export default function App() {
  const [activeTab, setActiveTab] = useState('territory');
  const [callPrepPrefill, setCallPrepPrefill] = useState(null);

  function handlePrepForCall(company) {
    setCallPrepPrefill(company);
    setActiveTab('callprep');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-tight leading-tight">Scout</div>
              <div className="text-[11px] text-slate-500 leading-tight">Territory Intelligence</div>
            </div>
          </div>
          <div
            className="text-[10px] text-slate-600 uppercase tracking-widest font-mono"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Employbridge
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active view */}
      <main className="max-w-3xl mx-auto px-5 py-8">
        {activeTab === 'territory' && <TerritoryView onPrepForCall={handlePrepForCall} />}
        {activeTab === 'routes'    && <RoutePlannerView />}
        {activeTab === 'campaign'  && <CampaignView />}
        {activeTab === 'callprep'  && (
          <CallPrepView
            prefill={callPrepPrefill}
            onClearPrefill={() => setCallPrepPrefill(null)}
          />
        )}
        {activeTab === 'activity'  && <ActivityLogView />}
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-5 py-8 mt-4 border-t border-slate-800/60">
        <p className="text-xs text-slate-700 text-center">
          Scout v2.0 — Employbridge Internal Tool — AI-generated research, verify before use
        </p>
      </footer>
    </div>
  );
}

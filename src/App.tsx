import React, { useState } from 'react';
import { VesperHeader, VesperView } from './components/VesperHeader';
import { LenderPortal } from './components/LenderPortal';
import { IVRPhoneSimulator } from './components/IVRPhoneSimulator';
import { ArchitectureView } from './components/ArchitectureView';
import { SpikeEvaluationModal } from './components/SpikeEvaluationModal';
import { IVRCallRecord } from './types';
import { SAMPLE_STORIES } from './data/sampleStories';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<VesperView>('ivr_phone');
  const [isSpikeOpen, setIsSpikeOpen] = useState<boolean>(false);

  // Initialize call records list for live completed intake sessions
  const [calls, setCalls] = useState<IVRCallRecord[]>([]);

  // When a new call completes via IVR simulator
  const handleCallCompleted = (newCall: IVRCallRecord) => {
    setCalls((prev) => [newCall, ...prev]);
  };

  // When underwriting decision is recorded
  const handleUpdateCallDecision = (callId: string, decision: any) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, underwritingDecision: decision } : c))
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Main Navigation Header */}
      <VesperHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSpike={() => setIsSpikeOpen(true)}
        totalCallsCount={calls.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full pb-12">
        {currentView === 'dashboard' && (
          <LenderPortal
            calls={calls}
            onOpenIVRSimulator={() => setCurrentView('ivr_phone')}
            onOpenSpike={() => setIsSpikeOpen(true)}
            onUpdateCallDecision={handleUpdateCallDecision}
          />
        )}

        {currentView === 'ivr_phone' && (
          <IVRPhoneSimulator
            onCallCompleted={handleCallCompleted}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenSpike={() => setIsSpikeOpen(true)}
          />
        )}

        {currentView === 'architecture' && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 bg-[#07070a] text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Vesper.ai &bull; Telephony Voice Agent &amp; Honest Microfinance Underwriting Platform
          </span>
          <span className="text-neutral-600 font-mono">Toll-Free 8800 &bull; Ethio Telecom &amp; Safaricom Ingress</span>
        </div>
      </footer>

      {/* Multilingual ASR Spike Modal */}
      <SpikeEvaluationModal
        isOpen={isSpikeOpen}
        onClose={() => setIsSpikeOpen(false)}
        onSelectSampleStory={() => {
          setCurrentView('ivr_phone');
        }}
      />
    </div>
  );
};

export default App;

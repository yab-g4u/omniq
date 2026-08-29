import React, { useState } from 'react';
import { VesperHeader, VesperView } from './components/VesperHeader';
import { LenderPortal } from './components/LenderPortal';
import { IVRPhoneSimulator } from './components/IVRPhoneSimulator';
import { ArchitectureView } from './components/ArchitectureView';
import { AddisRealtimeTest } from './components/AddisRealtimeTest';
import { SpikeEvaluationModal } from './components/SpikeEvaluationModal';
import { IVRCallRecord } from './types';
import { SAMPLE_STORIES } from './data/sampleStories';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<VesperView>('dashboard');
  const [isSpikeOpen, setIsSpikeOpen] = useState<boolean>(false);

  // Initialize initial calls from sample stories
  const [calls, setCalls] = useState<IVRCallRecord[]>(() => {
    return SAMPLE_STORIES.map((sample, index) => ({
      id: `call-${sample.id}`,
      callerPhoneNumber: sample.phone,
      callerName: sample.ownerName,
      region: sample.location,
      callDurationSeconds: sample.audioDuration,
      timestamp: Date.now() - (index + 1) * 3600 * 1000 * 4,
      language: sample.language,
      callStatus: 'completed',
      ivrTollFreeNumber: '8800',
      transcript: sample.transcript,
      extractedData: {
        transcript: sample.transcript,
        transcript_language: sample.language,
        fields: sample.expectedFields,
        extraction_notes: sample.notes,
        aiGrading: sample.gradingPreview!,
      },
      aiGrading: sample.gradingPreview!,
      underwritingDecision: {
        status: index === 0 ? 'approved' : 'pending',
        decidedAt: index === 0 ? Date.now() - 3600 * 1000 : undefined,
        decidedBy: index === 0 ? 'Senior Credit Officer' : undefined,
        approvedAmount: index === 0 ? '450,000 ETB' : undefined,
      },
    }));
  });

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

        {currentView === 'addis_test' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <AddisRealtimeTest onClose={() => setCurrentView('dashboard')} />
          </div>
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

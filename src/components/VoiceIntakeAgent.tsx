import React, { useMemo, useState } from 'react';
import { Mic, Square, Radio, Volume2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAddisRealtime } from '../hooks/useAddisRealtime';
import type { Language } from '../types';

const languages: { code: Language; label: string }[] = [
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo' },
  { code: 'en', label: 'English' },
];

const stateLabels = { IDLE: 'Ready', CONNECTING: 'Listening', WAITING_FOR_SETUP: 'Listening', READY: 'Listening', LISTENING: 'Listening', VESPER_SPEAKING: 'Speaking', ERROR: 'Ready', ENDING: 'Ready', ENDED: 'Ready' } as const;

export function VoiceIntakeAgent() {
  const [language, setLanguage] = useState<Language>('am');
  const { state, transcriptLogs, errorMessage, startSession, stopSession } = useAddisRealtime({ language });
  const active = !['IDLE', 'ENDED', 'ERROR'].includes(state);
  const status = stateLabels[state] ?? 'Ready';
  const latestUser = useMemo(() => [...transcriptLogs].reverse().find((item) => item.speaker === 'owner'), [transcriptLogs]);
  const latestAssistant = useMemo(() => [...transcriptLogs].reverse().find((item) => item.speaker === 'vesper'), [transcriptLogs]);

  const handleSpeak = async () => {
    if (active) stopSession();
    else await startSession();
  };

  return (
    <main className="sequa-shell">
      <header className="sequa-header">
        <div className="brand"><span className="brand-mark">S</span><span>Sequa</span><span className="brand-sub">SME SUPPORT</span></div>
        <div className="live-pill"><span className={active ? 'live-dot live-dot-active' : 'live-dot'} /> {active ? 'LIVE SESSION' : 'VOICE DEMO'}</div>
      </header>
      <section className="sequa-stage">
        <div className="eyebrow">Your funding journey, spoken naturally</div>
        <h1>Support that <em>listens.</em></h1>
        <p className="intro">Talk naturally. We&apos;ll help you with your SME funding application.</p>
        <div className="language-picker" aria-label="Select language">
          {languages.map((item) => <button key={item.code} className={language === item.code ? 'language active' : 'language'} onClick={() => !active && setLanguage(item.code)} aria-pressed={language === item.code}>{item.label}</button>)}
        </div>
        <div className={`voice-orb ${active ? 'voice-orb-active' : ''} ${state === 'VESPER_SPEAKING' ? 'voice-orb-speaking' : ''}`} aria-live="polite">
          <div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb-core"><span className="orb-letter">S</span></div>
        </div>
        <div className="state-line"><span className="state-icon">{status === 'Speaking' ? <Volume2 size={16} /> : <Radio size={16} />}</span><span>{status}</span></div>
        <button className={active ? 'speak-button stop' : 'speak-button'} onClick={handleSpeak} aria-label={active ? 'Stop voice session' : 'Speak now'}>{active ? <Square size={19} fill="currentColor" /> : <Mic size={22} />}<span>{active ? 'Stop Session' : 'Speak Now'}</span></button>
        {errorMessage && <div className="error-box"><AlertCircle size={17} /><span>{errorMessage}</span><button onClick={() => startSession()}><RotateCcw size={15} /> Retry</button></div>}
        <div className="conversation-grid">
          <article className="conversation-card"><div className="card-label">YOU SAID</div><p>{latestUser?.text || 'Your words will appear here as you speak.'}</p></article>
          <article className="conversation-card response"><div className="card-label"><span className="response-dot" /> SEQUA IS READY</div><p>{latestAssistant?.text || (active ? 'Listening for your story…' : 'Press Speak Now to begin a natural conversation.')}</p></article>
        </div>
      </section>
      <footer className="sequa-footer"><span>Private by design</span><span>Powered by Addis AI realtime voice</span></footer>
    </main>
  );
}

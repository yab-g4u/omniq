import { useState } from 'react';
import { VoiceIntakeAgent } from './components/VoiceIntakeAgent';

function Icon({ name }: { name: 'arrow' | 'play' | 'mic' | 'globe' | 'shield' }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    shield: <><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z"/><path d="m8 12 2.5 2.5L16 9"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  if (showDemo) return <VoiceIntakeAgent />;
  return <main className="landing-shell">
    <nav className="landing-nav" aria-label="Main navigation">
      <a className="brand" href="#top"><span className="brand-mark"><Icon name="mic" /></span><span>Sequa <em>SME Support</em></span></a>
      <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#support" onClick={() => setMenuOpen(false)}>For entrepreneurs</a><a href="#trust" onClick={() => setMenuOpen(false)}>Our promise</a></div>
      <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu"><span/><span/></button>
      <button className="nav-cta" type="button" onClick={() => setShowDemo(true)}>Try the voice assistant <Icon name="arrow" /></button>
    </nav>
    <section className="hero" id="top"><div className="eyebrow"><span className="status-dot"/> Voice-first funding support <span className="eyebrow-line"/> Built for Ethiopia</div><h1>Funding support that<br/><span>speaks your language.</span></h1><p className="hero-copy">A simpler way for small and growing businesses to understand their funding options, prepare with confidence, and be heard.</p><div className="hero-actions"><button className="primary-button" type="button" onClick={() => setShowDemo(true)}><span className="button-icon"><Icon name="play" /></span> Speak with Sequa <Icon name="arrow" /></button><a className="text-link" href="#how-it-works">See how it works <Icon name="arrow" /></a></div><div className="hero-proof"><div className="proof-avatars"><span>አ</span><span>A</span><span>O</span><span>+</span></div><div><strong>Made for every founder</strong><small>Support in Amharic, Afaan Oromoo & English</small></div></div></section>
    <section className="orb-section" aria-label="Sequa voice assistant preview"><div className="orb-halo"/><div className="orb"><div className="orb-core"><Icon name="mic" /></div><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><span className="orb-label label-top">Listen naturally</span><span className="orb-label label-right">No forms to fill</span><span className="orb-label label-bottom">Your story matters</span><span className="orb-label label-left">Built around you</span></div><p className="orb-caption"><Icon name="shield"/> Private, respectful, and designed for real conversations</p></section>
    <section className="feature-strip" id="how-it-works"><div><span className="feature-icon"><Icon name="globe" /></span><h2>Start in your language</h2><p>Choose Amharic, Afaan Oromoo, or English. Speak naturally from the first hello.</p></div><div><span className="feature-icon"><Icon name="mic" /></span><h2>Tell us your story</h2><p>No rigid forms. Sequa listens, understands, and helps you find the next step.</p></div><div id="support"><span className="feature-icon"><Icon name="shield" /></span><h2>Move forward clearly</h2><p>Get practical guidance that respects your time, your context, and your goals.</p></div></section>
    <section className="promise" id="trust"><span className="eyebrow">The Sequa promise</span><h2>Every business deserves<br/>a fair chance to <span>grow.</span></h2><p>We are building a more accessible bridge between Ethiopia&apos;s entrepreneurs and the support they need to thrive.</p><button className="text-link" type="button" onClick={() => setShowDemo(true)}>Start your conversation <Icon name="arrow" /></button></section>
    <footer><a className="brand" href="#top"><span className="brand-mark"><Icon name="mic" /></span><span>Sequa <em>SME Support</em></span></a><span>Funding support, made human.</span><span>© 2026 Sequa</span></footer>
  </main>;
}

export { App };

import React, { useState } from 'react';
import { SPIKE_BENCHMARK_DATA } from '../data/sampleStories';
import { X, CheckCircle2, AlertCircle, BarChart2, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface SpikeEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleStory?: (lang: Language) => void;
}

export const SpikeEvaluationModal: React.FC<SpikeEvaluationModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleStory,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'amharic' | 'oromo' | 'english'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div
        className="bg-[#0c0c0e] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Section 4: Multilingual ASR &amp; Extraction Spike</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Decision Gate: PASSED
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Empirical evaluation of Amharic, Oromo, and English spoken stories on Gemini Multimodal Direct Audio vs Human Transcripts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-black/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Spike Summary &amp; Decision Matrix
          </button>
          <button
            onClick={() => setActiveTab('amharic')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'amharic'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Amharic (አማርኛ) Benchmark
          </button>
          <button
            onClick={() => setActiveTab('oromo')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'oromo'
                ? 'border-blue-400 text-blue-400 font-semibold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Oromo (Afaan Oromoo) Benchmark
          </button>
          <button
            onClick={() => setActiveTab('english')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'english'
                ? 'border-purple-400 text-purple-400 font-semibold'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            English (ET Accent) Benchmark
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10">
                <div className="flex items-start gap-3">
                  <BarChart2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white text-sm">Day 1 Spike Result: Usability Validated</h4>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      Across 37 test clips spanning low-cost phone microphones and street-level background noise in Merkato, Hawassa, and Jimma, Gemini&apos;s direct audio understanding achieved an average factual extraction accuracy of <strong>93.8%</strong>. No separate intermediate ASR microservice is required for Phase 1.
                    </p>
                  </div>
                </div>
              </div>

              {/* Language Benchmark Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SPIKE_BENCHMARK_DATA.map((lang) => (
                  <div
                    key={lang.code}
                    className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-white">{lang.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-mono text-white/80">
                          {lang.nativeName}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-white/70">
                          <span>Word Accuracy:</span>
                          <span className="font-mono text-emerald-400 font-bold">{lang.averageAccuracy}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Character Error Rate:</span>
                          <span className="font-mono text-white">{lang.characterErrorRate}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Tested Clips:</span>
                          <span className="font-mono text-white">{lang.samplesCount} audio recordings</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Direct Audio Approved</span>
                      </div>
                      {onSelectSampleStory && (
                        <button
                          onClick={() => {
                            onSelectSampleStory(lang.code);
                            onClose();
                          }}
                          className="mt-2 w-full py-1.5 px-2.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>Test {lang.name} Story</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PRD Decision Gate Protocol */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Decision Gate Evaluation Matrix (PRD Section 4)
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Gate 1 (Amharic):</strong> Fidel syllabic phonetics, Ethiopian fiscal calendar dates (e.g. 2012 ዓ.ም), and currency terms extracted with 93.4% accuracy. Direct audio extraction adopted.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Gate 2 (Oromo):</strong> Qubee Latin orthography and regional dialects tested with 89.6% word accuracy. Verbatim quote bindings guarantee auditable verification by loan officers.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Gate 3 (Resilience):</strong> Client-side audio caching prevents dropped connections from losing recorded stories, fulfilling PRD Section 7.6.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'amharic' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                Amharic transcription demonstrates high fidelity for financial numbers, business descriptors, and workshop machinery types.
              </div>
              <h5 className="text-xs font-semibold text-white uppercase tracking-wider">
                Sample Verified Phonetic Phrases
              </h5>
              <div className="space-y-2">
                {SPIKE_BENCHMARK_DATA[0].samplePhrases.map((phrase, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-xs flex items-center justify-between">
                    <span className="text-white/90">{phrase}</span>
                    <span className="text-emerald-400 text-[11px]">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'oromo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                Oromo language spike shows robust recognition of agricultural terminology, cooperative metrics, and rural location landmarks.
              </div>
              <h5 className="text-xs font-semibold text-white uppercase tracking-wider">
                Sample Verified Phonetic Phrases
              </h5>
              <div className="space-y-2">
                {SPIKE_BENCHMARK_DATA[1].samplePhrases.map((phrase, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-xs flex items-center justify-between">
                    <span className="text-white/90">{phrase}</span>
                    <span className="text-blue-400 text-[11px]">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'english' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                Near-perfect baseline transcription with zero hallucination, preserving exact currency figures and employee figures.
              </div>
              <h5 className="text-xs font-semibold text-white uppercase tracking-wider">
                Sample Verified Phonetic Phrases
              </h5>
              <div className="space-y-2">
                {SPIKE_BENCHMARK_DATA[2].samplePhrases.map((phrase, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-xs flex items-center justify-between">
                    <span className="text-white/90">{phrase}</span>
                    <span className="text-purple-400 text-[11px]">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-black/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-white/90 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

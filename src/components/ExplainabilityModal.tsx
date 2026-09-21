/**
 * Digital Heroes — Explainability Modal
 * Directly fulfills PRD requirement for self-explaining business logic, financial allocations,
 * rolling score windows, draw algorithms, and charity contribution flow.
 * Styled in light theme with £ currency.
 */

import React from 'react';
import { Award, Calculator, CheckCircle2, ChevronRight, Heart, HelpCircle, Layers, ShieldCheck, Sparkles, X } from 'lucide-react';

export type ExplainTopic =
  | 'prize-pool'
  | 'rolling-scores'
  | 'charity-model'
  | 'draw-algorithm'
  | 'winner-verification'
  | 'subscription-lifecycle';

interface ExplainabilityModalProps {
  topic: ExplainTopic | null;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ topic, onClose }) => {
  if (!topic) return null;

  return (
    <div
      id="explainability-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="explainability-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 md:p-8 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-explain-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {topic === 'prize-pool' && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-emerald-700">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">System Architecture</span>
                <h3 className="text-xl font-bold text-slate-900 font-display">How the Prize Pool is Formed & Split</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Digital Heroes utilizes an automated, transparent formula to calculate the prize pool for each monthly draw. Unlike fixed-lottery operators, the prize pool scales strictly based on verified active subscribers.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Base Calculation Formula</div>
                <div className="font-mono text-sm text-emerald-800 font-semibold mb-2">
                  Active Subscribers × Subscription Fee × 40% + Previous Jackpot Rollover = Total Pool
                </div>
                <div className="text-xs text-slate-600">
                  Example: 125 subscribers paying ₹999/month ($12.04) generates ₹1,24,875 ($1,504.52) in gross subscription fees. Exactly 40% (₹49,950 / $601.81) is allocated to the prize pool, plus any rolled-over 5-match jackpot from prior months.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold uppercase text-slate-500 mb-3">Pre-Defined Matching Tiers</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-900 text-sm mb-0.5">5-Number Match</div>
                    <div className="text-lg font-black text-slate-900 font-display mb-1">40% Share</div>
                    <div className="text-[11px] text-amber-800 font-semibold">Jackpot Tier</div>
                    <div className="text-[10px] text-slate-600 mt-1">Carries forward to next month if unclaimed.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-0.5">4-Number Match</div>
                    <div className="text-lg font-black text-slate-900 font-display mb-1">35% Share</div>
                    <div className="text-[11px] text-slate-600 font-medium">Fixed Tier</div>
                    <div className="text-[10px] text-slate-500 mt-1">Shared equally among all 4-match winners. Does not roll over.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-0.5">3-Number Match</div>
                    <div className="text-lg font-black text-slate-900 font-display mb-1">25% Share</div>
                    <div className="text-[11px] text-slate-600 font-medium">Fixed Tier</div>
                    <div className="text-[10px] text-slate-500 mt-1">Shared equally among all 3-match winners. Does not roll over.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-700 flex items-start gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Equal Winner Split: If 5 participants achieve a 4-number match in a ₹17,500 ($210.84) tier pool, each receives exactly ₹3,500 ($42.17). Payouts are authoritatively calculated server-side upon draw publication.
              </span>
            </div>
          </div>
        )}

        {topic === 'rolling-scores' && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-sky-700">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-sky-700">Performance Engine</span>
                <h3 className="text-xl font-bold text-slate-900 font-display">The Rolling Five-Score Window</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              To participate in monthly draws, subscribers enter their latest golf scores in standard Stableford format (1 to 45 points). The platform strictly enforces an automated rolling 5-score window.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-semibold uppercase text-slate-500">Core Window Rules</div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li><strong>Format:</strong> Stableford points between 1 and 45.</li>
                  <li><strong>Date Mandatory:</strong> Every score is anchored to a verified round date.</li>
                  <li><strong>One Score Per Date:</strong> Duplicate entries for the same calendar date are rejected (existing rounds may be edited or deleted).</li>
                  <li><strong>Exact Limit:</strong> Only your latest five scores are retained for active participation.</li>
                  <li><strong>Newest Replaces Oldest:</strong> When you enter a 6th score, it automatically replaces the oldest stored score chronologically.</li>
                  <li><strong>Reverse Chronological Order:</strong> Scores always display newest first.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                <div className="text-xs font-bold text-sky-900 uppercase mb-2">Visualizing the 6th Score Entry</div>
                <div className="flex items-center justify-between text-center gap-1.5 text-xs font-mono">
                  <div className="p-2 rounded bg-white text-slate-400 line-through border border-slate-200">
                    <span className="text-[10px] block text-rose-600 font-sans font-medium">Oldest (Drops)</span>
                    28 pts
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="p-2 rounded bg-white text-slate-700 border border-slate-200">31 pts</div>
                  <div className="p-2 rounded bg-white text-slate-700 border border-slate-200">35 pts</div>
                  <div className="p-2 rounded bg-white text-slate-700 border border-slate-200">34 pts</div>
                  <div className="p-2 rounded bg-white text-slate-700 border border-slate-200">36 pts</div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                    <span className="text-[10px] block text-emerald-700 font-sans">New Entry</span>
                    38 pts
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {topic === 'charity-model' && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-rose-700">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-rose-700">Social Impact</span>
                <h3 className="text-xl font-bold text-slate-900 font-display">Direct Charity Contribution Model</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Charitable impact leads the Digital Heroes platform story. Charitable giving is NOT a conditional lottery donation or a secondary fee—it is a guaranteed, non-contingent direct allocation funded from every subscription payment.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Contribution Principles</div>
                <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                  <li><strong>Selected at Signup:</strong> Every subscriber designates their preferred charity during registration.</li>
                  <li><strong>Minimum 10% Floor:</strong> By design, no subscriber contributes less than 10% of their subscription to their cause.</li>
                  <li><strong>Voluntary Increase:</strong> Subscribers can freely increase their allocation up to 50% at any time through their dashboard.</li>
                  <li><strong>Independent of Winnings:</strong> Charities receive their funding regardless of whether the subscriber wins or enters scores.</li>
                  <li><strong>Direct One-off Giving:</strong> Anyone (members and visitors) can make independent direct donations to any accredited charity.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-xs font-bold text-rose-900 uppercase mb-1">Transparent Allocation Breakdown</div>
                <div className="text-xs text-slate-700">
                  On a standard ₹999/month ($12.04) subscription with a 15% charity setting:
                  <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-rose-700 font-bold">₹150 ($1.81)</div>
                      <div className="text-[10px] text-slate-500 font-sans">To Your Charity (15%)</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-emerald-700 font-bold">₹400 ($4.82)</div>
                      <div className="text-[10px] text-slate-500 font-sans">Monthly Prize Pool (40%)</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-slate-800 font-bold">₹449 ($5.41)</div>
                      <div className="text-[10px] text-slate-500 font-sans">Operations & Software (45%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {topic === 'draw-algorithm' && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-purple-700">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-purple-700">Integrity & Math</span>
                <h3 className="text-xl font-bold text-slate-900 font-display">Draw Methodologies Explained</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              The platform defines two distinct draw modes. Administrators choose and configure the active method before conducting a simulation. The draw method and its rationale are publicly published with the draw results for complete transparency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-purple-900 uppercase mb-1">01. Standard Random Mode</div>
                <div className="text-xs text-slate-500 mb-3">Uniform Probability Lottery</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates five distinct numbers uniformly sampled across 1 to 45 using cryptographically sound pseudo-random selection. Every number between 1 and 45 holds an identical mathematical probability of being selected.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-indigo-900 uppercase mb-1">02. Algorithmic Mode</div>
                <div className="text-xs text-slate-500 mb-3">Score-Frequency Weighted</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Analyzes the aggregate frequency distribution of all active participants' logged Stableford scores. Numbers with higher player density receive proportional statistical weighting, anchoring the draw organically to real community golf performance.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Simulation Safety: Admins can simulate proposed results and inspect tier winner counts and rollover implications before authoritatively publishing.</span>
            </div>
          </div>
        )}

        {topic === 'winner-verification' && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-amber-700">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-700">Compliance</span>
                <h3 className="text-xl font-bold text-slate-900 font-display">Winner Verification & Payout Lifecycle</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              To guarantee the integrity of golf scores and prevent fraudulent claims, winner verification applies exclusively to prize-winning participants prior to fund disbursement.
            </p>

            <div className="space-y-3 mb-6 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[11px] shrink-0">1</div>
                <div>
                  <div className="font-semibold text-slate-900">Winner Notification & Status</div>
                  <div className="text-slate-600">Winning subscribers receive an immediate dashboard notice highlighting their matched numbers, prize allocation, and status set to "Verification Required".</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[11px] shrink-0">2</div>
                <div>
                  <div className="font-semibold text-slate-900">Proof Upload (Scorecard Screenshot)</div>
                  <div className="text-slate-600">Winner uploads official scorecard screenshot or export from accredited golf platforms (GHIN, Golf Australia, Club V1, MiScore).</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[11px] shrink-0">3</div>
                <div>
                  <div className="font-semibold text-slate-900">Administrative Compliance Review</div>
                  <div className="text-slate-600">Operations administrators cross-reference the proof against submitted round dates and Stableford points. Admins can approve or reject with a documented rationale.</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[11px] shrink-0">4</div>
                <div>
                  <div className="font-semibold text-slate-900">Disbursement & Payment Reference</div>
                  <div className="text-slate-600">Upon approval, state transitions from Pending to Paid, attaching an official bank transaction reference code logged in the immutable audit trail.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Digital Heroes — Administrator Operations Console
 * Implements Draw Simulations, Algorithmic vs Random Execution, Public Publication,
 * Winner Verification Compliance Review, and System Audit Logs.
 * Styled in light theme with £ currency.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import { Draw, DrawSimulationResult, WinnerRecord } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';

interface AdminPageProps {
  draws: Draw[];
  onOpenExplain: (topic: ExplainTopic) => void;
  onRefreshData: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ draws, onOpenExplain, onRefreshData }) => {
  const { isAdmin, showToast } = useAuth();
  const { format } = useCurrency();
  const [allWinners, setAllWinners] = useState<WinnerRecord[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Draw simulation state
  const upcomingOrDraftDraw =
    draws.find((d) => d.status === 'upcoming' || d.status === 'open') || draws[0];
  const [activeDrawId, setActiveDrawId] = useState<string>(upcomingOrDraftDraw?.id || '');
  const [drawMode, setDrawMode] = useState<'random' | 'algorithmic'>('algorithmic');
  const [rationale, setRationale] = useState<string>(
    'September 2026 draw weighted against aggregate community Stableford performance.'
  );
  const [simulationResult, setSimulationResult] = useState<DrawSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Review modal / action state
  const [selectedProofWinner, setSelectedProofWinner] = useState<WinnerRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isActioning, setIsActioning] = useState<boolean>(false);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [winnersRes, analyticsRes] = await Promise.all([
        api.getAllWinners(),
        api.getAnalytics(),
      ]);
      setAllWinners(winnersRes.winners || []);
      setAnalytics(analyticsRes || null);
    } catch (err) {
      console.error('Failed to load admin operations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSimulate = async () => {
    if (!activeDrawId) return;
    setIsSimulating(true);
    try {
      const res = await api.simulateDraw(activeDrawId, drawMode);
      setSimulationResult(res);
      showToast('info', 'Draw simulation complete. Review outcomes below before publishing.');
    } catch (err: any) {
      showToast('error', err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePublish = async () => {
    if (!activeDrawId || !simulationResult) return;
    if (
      !window.confirm(
        'Authoritatively publish this draw? This will notify winners, record verified prize claims, and update the public transparency ledger.'
      )
    ) {
      return;
    }

    setIsPublishing(true);
    try {
      await api.publishDraw(activeDrawId, simulationResult);
      showToast('success', 'Draw successfully published! Official winners recorded.');
      setSimulationResult(null);
      onRefreshData();
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Publication failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleApproveWinner = async (winnerId: string) => {
    setIsActioning(true);
    try {
      await api.verifyWinner(winnerId, {
        approved: true,
        adminNotes: 'Scorecard verified by operations administrator. Bank disbursement queued.',
      });
      showToast('success', 'Winner verified! Status set to Approved & Paid.');
      setSelectedProofWinner(null);
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Verification approval failed');
    } finally {
      setIsActioning(false);
    }
  };

  const handleRejectWinner = async (winnerId: string) => {
    if (!rejectReason.trim()) {
      showToast('error', 'Please provide a clear reason for rejecting this submission.');
      return;
    }
    setIsActioning(true);
    try {
      await api.verifyWinner(winnerId, {
        approved: false,
        rejectionReason: rejectReason.trim(),
        adminNotes: 'Proof rejected due to discrepancies. Winner invited to re-upload official export.',
      });
      showToast('info', 'Verification rejected. Winner notified to provide updated proof.');
      setSelectedProofWinner(null);
      setRejectReason('');
    } catch (err: any) {
      showToast('error', err.message || 'Verification rejection failed');
    } finally {
      setIsActioning(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 font-display">Administrator Access Required</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Please use the top Evaluator Bar to switch to the <strong>Marcus Vance (Admin)</strong> persona to test draw simulations and winner scorecard audits.
        </p>
      </div>
    );
  }

  return (
    <div id="admin-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            <span>Administrator Operations Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Draw Engine & Audit Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Execute cryptographic draw simulations, inspect Stableford frequency corridors, review winner scorecard proofs, and disburse prize funds.
          </p>
        </div>

        <button
          onClick={() => onOpenExplain('draw-algorithm')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold shadow-xs transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Integrity Engine Architecture</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Active Subscribers
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1">
              {analytics.totalUsers || analytics.activeSubscribers} golfers
            </div>
            <div className="text-[10px] text-emerald-700 mt-1 font-sans font-medium">
              100% active retention cohort
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Gross Monthly Fees
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-display mt-1">
              {format((analytics.activeSubscribers || 1) * 999)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-sans">
              40% dedicated to prize pool
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Charity Direct Given
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 font-display mt-1">
              {format(analytics.totalCharityContributed)}
            </div>
            <div className="text-[10px] text-rose-700 mt-1 font-sans font-medium">
              Guaranteed non-contingent
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Prizes Awarded to Date
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-display mt-1">
              {format(analytics.totalPrizePoolDistributed)}
            </div>
            <div className="text-[10px] text-amber-800 mt-1 font-sans font-medium">
              {allWinners.length} verified winners
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: DRAW SIMULATION & PUBLICATION ENGINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Execution Engine</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Conduct & Publish Monthly Draw
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Simulate candidate winning numbers and audit tier payout outcomes prior to permanent publication.
            </p>
          </div>

          {/* Draw Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Target Draw:</span>
            <select
              id="admin-active-draw-select"
              value={activeDrawId}
              onChange={(e) => {
                setActiveDrawId(e.target.value);
                setSimulationResult(null);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-semibold"
            >
              {draws.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Methodology Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Draw Methodology
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDrawMode('algorithmic')}
                  className={`p-3.5 rounded-xl border text-left transition-colors ${
                    drawMode === 'algorithmic'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold text-xs">Algorithmic Mode</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Weighted by participant score density
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawMode('random')}
                  className={`p-3.5 rounded-xl border text-left transition-colors ${
                    drawMode === 'random'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold text-xs">Random Mode</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Uniform PRNG 1 to 45 probability
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="draw-rationale-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audit Rationale (Published with public draw record)
              </label>
              <input
                id="draw-rationale-input"
                type="text"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <button
              id="run-simulation-btn"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{isSimulating ? 'Simulating...' : 'Execute Live Simulation'}</span>
            </button>
          </div>

          {/* Simulation Output Area */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            {simulationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-emerald-800">
                    Simulation Candidate Results
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {simulationResult.eligibleSubscribersCount} active participants
                  </span>
                </div>

                {/* Candidate numbers */}
                <div className="flex items-center justify-center gap-2 font-mono">
                  {simulationResult.winningNumbers.map((num: number, i: number) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-xl bg-white text-indigo-900 border border-indigo-200 flex items-center justify-center text-base font-bold shadow-xs"
                    >
                      {num}
                    </div>
                  ))}
                </div>

                {/* Simulated Tier Winners breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-amber-800 font-semibold">5-Match Winners (Jackpot):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {simulationResult.winners.tier5.length} winners{' '}
                      {simulationResult.winners.tier5.length === 0 && (
                        <span className="text-amber-700 text-[10px]">(Will roll over)</span>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">4-Match Winners:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {simulationResult.winners.tier4.length} winners
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">3-Match Winners:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {simulationResult.winners.tier3.length} winners
                    </span>
                  </div>
                </div>

                {/* Rollover notice */}
                {simulationResult.tierBreakdown?.tier5?.rolledOver && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                    <span>
                      Rollover Implication: {format(simulationResult.tierBreakdown.tier5.rolloverAmount)} will roll forward to
                      next month's jackpot pool.
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    id="publish-draw-btn"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isPublishing ? 'Publishing...' : 'Confirm & Publish Draw Results'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-400">
                <Play className="w-8 h-8 opacity-40 text-slate-400" />
                <div className="text-xs font-semibold text-slate-700">No Simulation Generated Yet</div>
                <p className="text-[11px] max-w-xs text-slate-500">
                  Click 'Execute Live Simulation' to test your selected draw configuration against currently registered participant scores.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: WINNER VERIFICATION & SCORECARD COMPLIANCE REVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              <span>Winner Scorecard Compliance Reviews</span>
            </h3>
            <p className="text-xs text-slate-600">
              Review golf scorecard screenshots submitted by prize winners before releasing bank disbursements.
            </p>
          </div>

          <span className="text-xs text-slate-600">
            Pending Actions:{' '}
            <strong className="text-amber-800 font-mono">
              {allWinners.filter((w) => w.verificationStatus === 'submitted').length}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Winner</th>
                <th className="px-4 py-3">Draw / Tier</th>
                <th className="px-4 py-3">Prize Amount</th>
                <th className="px-4 py-3">Matched Numbers</th>
                <th className="px-4 py-3">Scorecard Proof</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allWinners.map((winner) => (
                <tr key={winner.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {winner.userName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900 block">{winner.drawName}</span>
                    <span className="text-[10px] text-slate-500">{winner.matchCount}-Match Tier</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                    {format(winner.prizeAmount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-700 font-bold">
                    [{winner.matchedNumbers.join(', ')}]
                  </td>
                  <td className="px-4 py-3">
                    {winner.proofImageUrl ? (
                      <button
                        onClick={() => setSelectedProofWinner(winner)}
                        className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 underline font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Screenshot</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No proof uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        winner.verificationStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : winner.verificationStatus === 'submitted'
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 animate-pulse'
                          : winner.verificationStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {winner.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      id={`review-winner-${winner.id}-btn`}
                      onClick={() => setSelectedProofWinner(winner)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROOF INSPECTION & APPROVAL MODAL */}
      {selectedProofWinner && (
        <div
          id="admin-proof-review-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedProofWinner(null)}
        >
          <div
            id="admin-proof-review-modal-content"
            className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 text-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div>
                <h4 className="text-base font-bold text-slate-900 font-display">
                  Scorecard Verification Audit
                </h4>
                <p className="text-xs text-slate-500">
                  Winner: <strong>{selectedProofWinner.userName}</strong> · Prize: {format(selectedProofWinner.prizeAmount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedProofWinner(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Proof image display */}
            <div className="space-y-4">
              <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                <img
                  src={
                    selectedProofWinner.proofImageUrl ||
                    'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Winner Scorecard Proof"
                  className="w-full h-56 object-cover rounded-xl"
                />
              </div>

              {selectedProofWinner.proofNotes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Winner Submission Notes:</span>
                  <p className="text-slate-600">{selectedProofWinner.proofNotes}</p>
                </div>
              )}

              {/* Rejection reason input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason (Required only if declining)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Screenshot blurry; round dates don't match submitted rounds."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-rose-600 focus:bg-white"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRejectWinner(selectedProofWinner.id)}
                  disabled={isActioning}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline & Request Resubmission</span>
                </button>

                <button
                  type="button"
                  id="confirm-approve-verification-btn"
                  onClick={() => handleApproveWinner(selectedProofWinner.id)}
                  disabled={isActioning}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Release Payout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

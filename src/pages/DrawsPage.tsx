/**
 * Digital Heroes — Draws & Transparency Page
 * Matches the design reference:
 * - "Monthly Draw — October 2024" with green "Completed" status badge
 * - "Total Prize Pool: £50,000"
 * - 5 Vibrant Distinctly-Colored Winning Number Balls: [7, 14, 23, 31, 42]
 * - 3 Tier Breakdown Cards: Match 5 (40%), Match 4 (35%), Match 3 (25%)
 * - "Next Draw: 30 November 2024" with Countdown timer "12d 4h 32m"
 * - Provably fair algorithm explainability and complete winner audit table
 */

import React, { useState } from 'react';
import { Draw, WinnerRecord } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import { useCurrency } from '../context/CurrencyContext';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

interface DrawsPageProps {
  draws: Draw[];
  winners: WinnerRecord[];
  onOpenExplain: (topic: ExplainTopic) => void;
}

export const DrawsPage: React.FC<DrawsPageProps> = ({ draws, winners, onOpenExplain }) => {
  const { format, formatINR, formatUSD, formatDual } = useCurrency();
  const [selectedDrawId, setSelectedDrawId] = useState<string>(
    draws.find((d) => d.status === 'published')?.id || draws[0]?.id || ''
  );

  const selectedDraw = draws.find((d) => d.id === selectedDrawId) || draws[0];
  const upcomingDraw = draws.find((d) => d.status === 'upcoming');
  const pastDraws = draws.filter((d) => d.status === 'published' || d.status === 'completed');

  // Filter winners for the selected draw
  const drawWinners = winners.filter((w) => w.drawId === selectedDraw?.id);

  // Ball background colors matching reference design
  const ballColors = [
    'bg-slate-800 text-white',
    'bg-emerald-600 text-white',
    'bg-emerald-500 text-white',
    'bg-indigo-600 text-white',
    'bg-rose-500 text-white',
  ];

  return (
    <div id="draws-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" />
            <span>Provably Fair Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Monthly Draws & Transparency
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Every draw selects five numbers between 1 and 45. Prize pools scale directly with active subscriptions, and unclaimed 5-match jackpots roll forward automatically.
          </p>
        </div>

        <button
          onClick={() => onOpenExplain('draw-algorithm')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold shadow-xs transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Draw Math & Rollover Policy</span>
        </button>
      </div>

      {/* MONTHLY DRAW HERO CARD MATCHING DESIGN REFERENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Draw Result Card (Left / Center) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Authoritative Results
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-0.5">
                Monthly Draw — {selectedDraw?.name || 'October 2024'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedDraw?.status === 'published' ? 'Completed' : selectedDraw?.status}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-600">Total Prize Pool:</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-display">
              {format(selectedDraw?.totalPrizePool || 50000)}
            </span>
          </div>

          {/* 5 Winning Balls in Vibrant Distinct Colors matching reference */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Winning Numbers
            </span>

            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap pt-2">
              {(selectedDraw?.winningNumbers || [7, 14, 23, 31, 42]).map((num: number, idx: number) => (
                <div
                  key={idx}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black font-display shadow-md transition-transform hover:scale-105 ${
                    ballColors[idx % ballColors.length]
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Conducted under strict cryptographic transparency. Five distinct numbers from 1 to 45.
            </p>
          </div>

          {/* 3 Tier Breakdown Cards matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">Match 5 (40%)</span>
              </div>
              <div className="text-lg font-black text-emerald-700 font-display">
                {format(selectedDraw?.tierBreakdown?.tier5?.allocatedPool || 20000)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedDraw?.tierBreakdown?.tier5?.winnerCount || 2} winners ({format(selectedDraw?.tierBreakdown?.tier5?.perWinnerPrize || 10000)} each)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">Match 4 (35%)</span>
              </div>
              <div className="text-lg font-black text-slate-900 font-display">
                {format(selectedDraw?.tierBreakdown?.tier4?.allocatedPool || 17500)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedDraw?.tierBreakdown?.tier4?.winnerCount || 5} winners ({format(selectedDraw?.tierBreakdown?.tier4?.perWinnerPrize || 3500)} each)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">Match 3 (25%)</span>
              </div>
              <div className="text-lg font-black text-slate-900 font-display">
                {format(selectedDraw?.tierBreakdown?.tier3?.allocatedPool || 12500)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedDraw?.tierBreakdown?.tier3?.winnerCount || 25} winners ({format(selectedDraw?.tierBreakdown?.tier3?.perWinnerPrize || 500)} each)
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Next Draw & Countdown matching reference */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                <span>Next Scheduled Event</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">
                Next Draw
              </h3>
              <div className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>30 November 2024</span>
              </div>

              {/* Countdown */}
              <div className="my-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <div className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                  Draw Closes In
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                  12d 4h 32m
                </div>
                <div className="text-[11px] text-emerald-700">
                  Automated Stableford evaluation
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Active subscribers who have logged at least one Stableford round are automatically entered.
                </p>
                <p>
                  Unclaimed 5-match jackpot rolls forward to compound next month's grand prize.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenExplain('draw-algorithm')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>How the Draw Works</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* HISTORICAL DRAW AUDITS EXPLORER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-display">
              Historical Draw Records & Audit Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any past draw to inspect winning numbers, tier allocations, and verification states.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Select Draw:</span>
            <select
              id="historical-draw-select"
              value={selectedDrawId}
              onChange={(e) => setSelectedDrawId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-500"
            >
              {draws.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Winners Table for Selected Draw */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Winning Participants ({drawWinners.length})</span>
            </span>
          </div>

          {drawWinners.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No winners recorded for this draw.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Winner Name</th>
                    <th className="px-4 py-3">Match Tier</th>
                    <th className="px-4 py-3">Matched Numbers</th>
                    <th className="px-4 py-3">Prize Amount</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {drawWinners.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {winner.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                          {winner.matchCount}-Number Match
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                        [{winner.matchedNumbers.join(', ')}]
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {format(winner.prizeAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            winner.verificationStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : winner.verificationStatus === 'submitted'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : winner.verificationStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {winner.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            winner.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {winner.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

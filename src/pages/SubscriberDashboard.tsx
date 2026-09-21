/**
 * Digital Heroes — Subscriber Command Center Dashboard
 * Matches the design reference:
 * - Left sidebar navigation (Dashboard, My Scores, My Entries, My Charity, My Winnings, Account)
 * - Greeting: "Welcome back, Alex 👋" + "Play. Contribute. Win. Make a Difference."
 * - Member badge: "Silver Member — Since Jan 2024"
 * - 4 Stat Cards: [5] Scores Logged, [12] Draw Entries, [£25] Raised for Charity, [1] Winnings
 * - 3 Column Cards: Your Progress (circular ring), Your Charity, Next Draw (countdown)
 * - Bottom Golfer Inspiration Banner: "Every round makes a difference."
 * - Complete rolling 5-score management (Stableford 1-45, edit/delete) and Winner Verification Claims
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import { Charity, Draw, GolfScore, WinnerRecord } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import { DigitalHeroesLogo } from '../components/DigitalHeroesLogo';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  FileCheck,
  FileText,
  Heart,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  PlusCircle,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  User,
  XCircle,
} from 'lucide-react';

interface SubscriberDashboardProps {
  charities: Charity[];
  upcomingDraw: Draw | null;
  onOpenScoreModal: (scoreToEdit?: GolfScore | null) => void;
  onOpenProofModal: (winnerRecord: WinnerRecord) => void;
  onOpenExplain: (topic: ExplainTopic) => void;
  onNavigate: (view: string) => void;
}

export const SubscriberDashboard: React.FC<SubscriberDashboardProps> = ({
  charities,
  upcomingDraw,
  onOpenScoreModal,
  onOpenProofModal,
  onOpenExplain,
  onNavigate,
}) => {
  const { currentUser, hasActiveSubscription, refreshUser, showToast, logout } = useAuth();
  const { format, formatINR, formatUSD, formatDual } = useCurrency();
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [userWinnings, setUserWinnings] = useState<WinnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'charity' | 'winnings'>('overview');
  const [charityPct, setCharityPct] = useState<number>(
    currentUser?.subscription.charityContributionPct || 15
  );
  const [isUpdatingCharity, setIsUpdatingCharity] = useState<boolean>(false);
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scoresRes, winnersRes] = await Promise.all([
        api.getMyScores(),
        api.getMyWinnings(),
      ]);
      setScores(scoresRes.scores || []);
      setUserWinnings(winnersRes.winnings || []);
    } catch (err) {
      console.error('Failed to load subscriber dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (currentUser?.subscription.charityContributionPct) {
      setCharityPct(currentUser.subscription.charityContributionPct);
    }
  }, [currentUser]);

  const handleDeleteScore = async (id: string, scoreVal: number, date: string) => {
    if (!window.confirm(`Delete score of ${scoreVal} pts from ${date}?`)) return;
    try {
      await api.deleteScore(id);
      showToast('info', `Score of ${scoreVal} pts deleted.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete score');
    }
  };

  const handleUpdateCharityPct = async () => {
    setIsUpdatingCharity(true);
    try {
      await api.updateSubscriptionCharity(undefined, charityPct);
      showToast('success', `Charity contribution set to ${charityPct}%`);
      await refreshUser();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update charity percentage');
    } finally {
      setIsUpdatingCharity(false);
    }
  };

  const handleRenewSubscription = async () => {
    setIsRenewing(true);
    try {
      await api.updateSubscriptionStatus('active');
      showToast('success', 'Subscription renewed! Active status restored.');
      await refreshUser();
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Renewal failed');
    } finally {
      setIsRenewing(false);
    }
  };

  const userCharity =
    charities.find((c) => c.id === currentUser?.subscription.selectedCharityId) ||
    charities.find((c) => c.id === 'charity-macmillan') ||
    charities[0];

  // Dynamic lifetime metrics calculation
  const subPrice = currentUser?.subscription.price || (currentUser?.subscription.plan === 'yearly' ? 9990 : 999);
  const subPct = currentUser?.subscription.charityContributionPct || 15;
  const lifetimeCharity = Math.round((subPrice * subPct) / 100);
  const totalEntries = (currentUser?.subscription.status === 'active' && scores.length > 0) ? Math.max(1, scores.length) : 0;
  const firstName = currentUser?.name.split(' ')[0] || 'Member';

  // Circular progress math (e.g. 4/5 or 5/5)
  const currentScoresCount = Math.min(scores.length, 5);
  const targetScores = 5;
  const progressRatio = currentScoresCount / targetScores;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* RESTRICTED STATE ALERT FOR LAPSED SUBSCRIPTIONS */}
      {currentUser && !hasActiveSubscription && (
        <div
          id="lapsed-subscription-alert"
          className="mb-8 p-5 sm:p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-rose-900 font-display">
                Subscription Currently {currentUser.subscription.status.toUpperCase()}
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                Your subscription has lapsed. In accordance with platform integrity rules, score logging and draw entries are paused until subscription is restored.
              </p>
            </div>
          </div>

          <button
            id="renew-subscription-btn"
            onClick={handleRenewSubscription}
            disabled={isRenewing}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
            <span>{isRenewing ? 'Restoring...' : `Renew Subscription (${format(999)})`}</span>
          </button>
        </div>
      )}

      {/* DASHBOARD SHELL WITH SIDEBAR & MAIN BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR NAVIGATION MATCHING DESIGN REFERENCE */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-6">
          <div className="flex flex-col px-2 py-1 gap-1">
            <DigitalHeroesLogo variant="horizontal" size="xs" showTagline={false} />
            <div className="text-[10px] text-slate-500 font-medium pl-8">Member Portal</div>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('scores')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'scores'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>My Scores</span>
              <span className="ml-auto text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {scores.length}
              </span>
            </button>

            <button
              onClick={() => onNavigate('draws')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Target className="w-4 h-4 text-slate-500" />
              <span>My Entries</span>
            </button>

            <button
              onClick={() => setActiveTab('charity')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'charity'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>My Charity</span>
            </button>

            <button
              onClick={() => setActiveTab('winnings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'winnings'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>My Winnings</span>
              {userWinnings.length > 0 && (
                <span className="ml-auto text-xs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  {userWinnings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => onOpenExplain('rolling-scores')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Help & Rules</span>
            </button>
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="lg:col-span-9 space-y-6">
          {/* HEADER GREETING MATCHING DESIGN REFERENCE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display flex items-center gap-2">
                <span>Welcome back, {firstName}</span>
                <span className="text-2xl select-none">👋</span>
              </h1>
              <p className="text-sm text-slate-600 mt-1 font-medium flex items-center flex-wrap gap-2">
                <span>Play. Contribute. Win. Make a Difference.</span>
                <span className="font-script text-emerald-700 text-lg font-bold -rotate-2 select-none">
                  Small Swings Big Change
                </span>
              </p>
            </div>

            {/* Member Badge matching reference */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shrink-0">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                {firstName.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Silver Member</div>
                <div className="text-[11px] text-slate-500">Since Jan 2024</div>
              </div>
            </div>
          </div>

          {/* 4 STAT CARDS IN A ROW MATCHING DESIGN REFERENCE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                {scores.length}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Scores Logged</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                {totalEntries}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Draw Entries</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
                <Heart className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                {format(lifetimeCharity)}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Raised for Charity</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                {userWinnings.length}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Winnings</div>
            </div>
          </div>

          {/* 3 COLUMN ACTION CARDS MATCHING DESIGN REFERENCE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Your Progress */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display mb-4">
                  Your Progress
                </h3>

                {/* Circular Progress Gauge */}
                <div className="flex items-center justify-center my-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-slate-100"
                        strokeWidth="7"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-emerald-600 transition-all duration-500"
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black text-slate-900 font-display">
                        {currentScoresCount}/5
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Scores</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center leading-relaxed mb-4">
                  {currentScoresCount >= 5
                    ? 'All 5 scores logged. You are fully qualified for the upcoming draw!'
                    : `Log ${5 - currentScoresCount} more score to keep your entry active.`}
                </p>
              </div>

              <button
                id="dashboard-log-score-btn"
                onClick={() => onOpenScoreModal(null)}
                disabled={!hasActiveSubscription}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log a Score</span>
              </button>
            </div>

            {/* Card 2: Your Charity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display mb-4">
                  Your Charity
                </h3>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs leading-tight">
                      {userCharity?.name || 'Macmillan Cancer Support'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Total Contributed: <strong className="text-emerald-700">{format(lifetimeCharity)}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {charityPct}% of your subscription goes directly to this charity every month.
                </p>
              </div>

              <button
                onClick={() => onNavigate('charities')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>Change Charity</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Next Draw */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display mb-4">
                  Next Draw
                </h3>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {upcomingDraw?.drawDate || '30 Nov 2024'}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Estimated Pool: {format(upcomingDraw?.totalPrizePool || 50000)}
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="text-center py-2 mb-4">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Draw Closes In
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    12d 4h 32m
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('draws')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>View Draw Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* WINNER CLAIMS & VERIFICATION (Active if user has draw matches) */}
          {userWinnings.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <Trophy className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    Your Winning Draw Match!
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Verification Required
                </span>
              </div>

              {userWinnings.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs text-amber-900 font-semibold">{w.drawName}</div>
                    <div className="text-2xl font-black text-slate-900 font-display">
                      {format(w.prizeAmount)}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Matched {w.matchCount} Numbers: <span className="font-mono font-bold text-slate-900">[{w.matchedNumbers.join(', ')}]</span>
                    </div>
                  </div>

                  <div>
                    {w.verificationStatus === 'approved' ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified & Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => onOpenProofModal(w)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Scorecard Screenshot</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ROLLING 5-SCORE WINDOW TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Your Last 5 Scores (Rolling Window)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your best 5 scores are used for draw eligibility. Only the latest 5 rounds are retained.
                </p>
              </div>

              <button
                onClick={() => onOpenScoreModal(null)}
                disabled={!hasActiveSubscription}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Score</span>
              </button>
            </div>

            {scores.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No scores recorded yet. Click "Add Score" to log your first Stableford round!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Date Played</th>
                      <th className="px-4 py-3">Stableford Score</th>
                      <th className="px-4 py-3">Course Name</th>
                      <th className="px-4 py-3">Holes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {scores.map((score, index) => (
                      <tr key={score.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {score.date}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                          {score.score} pts
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {score.course}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {score.holes} Holes
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenScoreModal(score)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit score"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteScore(score.id, score.score, score.date)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete score"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* WIDE BOTTOM INSPIRATIONAL GOLFER BANNER MATCHING DESIGN REFERENCE */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-sm flex items-center justify-between">
            <div className="space-y-1 z-10 max-w-lg">
              <h4 className="text-xl sm:text-2xl font-extrabold font-display leading-tight">
                Every round makes a difference.
              </h4>
              <p className="text-xs sm:text-sm text-emerald-200">
                Play well. Do good. Be a Digital Hero.
              </p>
            </div>

            <div className="hidden sm:block z-10">
              <span className="font-script text-amber-300 text-3xl -rotate-6 block select-none">
                Small Swings Big Change
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Digital Heroes — Administrator Operations Console
 * Full-featured Administrator Dashboard covering:
 * 1. Draws & Live Simulation Engine (Draw creation, Algorithmic vs Random, Simulation, Publishing & Rollover)
 * 2. Winner Verification & Payouts (Proof review, Approve/Reject with reason, Payout release with payment reference)
 * 3. Users & Subscription Management (User directory, search, plan/status/charity % inspection, status controls)
 * 4. Charities Management (CRUD, category, tax ID, mission, impact statement, active/featured toggles)
 * 5. System Analytics & Chronological Audit Logs (Financial KPIs, prize distribution ledger, allocation config, audit trail)
 * 6. Admin Authentication Protection
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import { Charity, Draw, DrawSimulationResult, UserProfile, WinnerRecord, AuditLogEntry, SystemConfig } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Heart,
  HelpCircle,
  Layers,
  Lock,
  Play,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

interface AdminPageProps {
  draws: Draw[];
  onOpenExplain: (topic: ExplainTopic) => void;
  onRefreshData: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ draws, onOpenExplain, onRefreshData }) => {
  const { isAdmin, login, showToast } = useAuth();
  const { format } = useCurrency();

  // Navigation tab: 'draws' | 'winners' | 'users' | 'charities' | 'analytics'
  const [activeTab, setActiveTab] = useState<'draws' | 'winners' | 'users' | 'charities' | 'analytics'>('draws');

  // Datasets
  const [allWinners, setAllWinners] = useState<WinnerRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminCharities, setAdminCharities] = useState<Charity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin In-Page Login State (if accessed unauthenticated)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Cache helpers for draw simulation results across tab switches / reloads
  const getCachedSim = (id: string): DrawSimulationResult | null => {
    if (typeof window !== 'undefined' && id) {
      try {
        const raw = sessionStorage.getItem(`dh_sim_${id}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  };

  const setCachedSim = (id: string, sim: DrawSimulationResult | null) => {
    if (typeof window !== 'undefined' && id) {
      try {
        if (sim) {
          sessionStorage.setItem(`dh_sim_${id}`, JSON.stringify(sim));
        } else {
          sessionStorage.removeItem(`dh_sim_${id}`);
        }
      } catch {}
    }
  };

  // Draw simulation state
  const upcomingOrDraftDraw =
    draws.find((d) => d.status === 'upcoming' || d.status === 'open') || draws[0];
  const [activeDrawId, setActiveDrawId] = useState<string>(upcomingOrDraftDraw?.id || '');
  const [drawMode, setDrawMode] = useState<'random' | 'algorithmic'>('algorithmic');
  const [rationale, setRationale] = useState<string>(
    'Monthly draw weighted against aggregate community Stableford performance.'
  );
  const [simulationResult, setSimulationResult] = useState<DrawSimulationResult | null>(() => {
    return getCachedSim(upcomingOrDraftDraw?.id || '');
  });
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // New Draw Modal/Form
  const [isCreatingDraw, setIsCreatingDraw] = useState(false);
  const [newDrawName, setNewDrawName] = useState('');
  const [newDrawMonthYear, setNewDrawMonthYear] = useState('2026-11');
  const [newDrawDate, setNewDrawDate] = useState('2026-11-30');

  // Winner Review State
  const [selectedProofWinner, setSelectedProofWinner] = useState<WinnerRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');
  const [isActioning, setIsActioning] = useState<boolean>(false);
  const [winnerFilter, setWinnerFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected' | 'required'>('all');

  // Users Tab Search & Filter
  const [userSearch, setUserSearch] = useState('');

  // Charity Tab Form
  const [isCreatingCharity, setIsCreatingCharity] = useState(false);
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null);
  const [charityFormData, setCharityFormData] = useState({
    name: '',
    category: 'healthcare' as Charity['category'],
    tagline: '',
    description: '',
    mission: '',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    impactStatement: 'Every ₹2,500 ($30) creates measurable positive impact.',
    taxId: '80G-ACC-2026',
    featured: false,
    active: true,
    events: [] as Charity['events'],
  });

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [winnersRes, analyticsRes, usersRes, charitiesRes, logsRes, configRes] =
        await Promise.all([
          api.getAllWinners(),
          api.getAnalytics(),
          api.getUsers().catch(() => []),
          api.getAllCharitiesAdmin().catch(() => []),
          api.getAuditLogs().catch(() => []),
          api.getConfig().catch(() => null),
        ]);

      setAllWinners(winnersRes.winners || (Array.isArray(winnersRes) ? winnersRes : []));
      setAnalytics(analyticsRes || null);
      setAllUsers(Array.isArray(usersRes) ? usersRes : []);
      setAdminCharities(Array.isArray(charitiesRes) ? charitiesRes : []);
      setAuditLogs(Array.isArray(logsRes) ? logsRes : []);
      setSystemConfig(configRes);
    } catch (err) {
      console.error('Failed to load admin operations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Sync activeDrawId when draws arrive or change
  useEffect(() => {
    if (draws && draws.length > 0) {
      if (!activeDrawId || !draws.some((d) => d.id === activeDrawId)) {
        const target = draws.find((d) => d.status === 'upcoming' || d.status === 'open') || draws[0];
        if (target) {
          setActiveDrawId(target.id);
          const cached = getCachedSim(target.id);
          if (cached) {
            setSimulationResult(cached);
          }
        }
      }
    }
  }, [draws, activeDrawId]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(adminEmail.trim(), adminPassword);
      showToast('success', 'Authenticated as Administrator.');
    } catch (err: any) {
      showToast('error', err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Draw Handlers
  const handleSimulate = async () => {
    const drawIdToSimulate =
      activeDrawId ||
      draws.find((d) => d.status === 'upcoming' || d.status === 'open')?.id ||
      draws[0]?.id;

    if (!drawIdToSimulate) {
      showToast('error', 'No active draw found to simulate. Please create a draw first.');
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);
    try {
      const res = await api.simulateDraw(drawIdToSimulate, drawMode);
      setSimulationResult(res);
      setCachedSim(drawIdToSimulate, res);
      if (res.drawMethodRationale) {
        setRationale(res.drawMethodRationale);
      }
      showToast('info', 'Draw simulation complete. Review outcomes below before publishing.');
    } catch (err: any) {
      const msg = err.message || 'Simulation failed';
      setSimulationError(msg);
      showToast('error', msg);
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePublish = async () => {
    const drawIdToPublish =
      activeDrawId ||
      draws.find((d) => d.status === 'upcoming' || d.status === 'open')?.id ||
      draws[0]?.id;

    if (!drawIdToPublish || !simulationResult) {
      showToast('error', 'Please run a simulation before publishing.');
      return;
    }
    if (
      !window.confirm(
        'Authoritatively publish this draw? This will notify winners, record verified prize claims, and update the public transparency ledger.'
      )
    ) {
      return;
    }

    setIsPublishing(true);
    try {
      await api.publishDraw(drawIdToPublish, simulationResult);
      showToast('success', 'Draw successfully published! Official winners recorded.');
      setSimulationResult(null);
      setCachedSim(drawIdToPublish, null);
      onRefreshData();
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Publication failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrawName.trim()) return;
    try {
      const created = await api.createDraw({
        name: newDrawName.trim(),
        monthYear: newDrawMonthYear,
        drawDate: newDrawDate,
      });
      showToast('success', `Created new draw: ${created.name}`);
      setIsCreatingDraw(false);
      setNewDrawName('');
      onRefreshData();
      loadAdminData();
      setActiveDrawId(created.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create draw');
    }
  };

  // Winner Handlers
  const handleApproveWinner = async (winnerId: string) => {
    setIsActioning(true);
    try {
      await api.verifyWinner(winnerId, {
        approved: true,
        adminNotes: 'Scorecard verified by operations administrator. Bank disbursement queued.',
      });
      showToast('success', 'Winner verified! Status set to Approved.');
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
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Verification rejection failed');
    } finally {
      setIsActioning(false);
    }
  };

  const handleMarkPaid = async (winnerId: string) => {
    const ref = paymentRefInput.trim() || `PAY-DH-${Date.now()}`;
    setIsActioning(true);
    try {
      await api.markPayoutPaid(winnerId, ref);
      showToast('success', `Payout marked as Paid. Reference: ${ref}`);
      setSelectedProofWinner(null);
      setPaymentRefInput('');
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to mark payout as paid');
    } finally {
      setIsActioning(false);
    }
  };

  // User Handlers
  const handleToggleUserSubscriptionStatus = async (user: UserProfile, newStatus: UserProfile['subscription']['status']) => {
    try {
      await api.updateSubscription(user.id, { status: newStatus });
      showToast('success', `Updated ${user.name}'s subscription to ${newStatus}.`);
      loadAdminData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update subscription status');
    }
  };

  // Charity Handlers
  const handleSaveCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCharity) {
        await api.updateCharity(editingCharity.id, charityFormData);
        showToast('success', `Updated charity: ${charityFormData.name}`);
      } else {
        await api.createCharity(charityFormData);
        showToast('success', `Created charity: ${charityFormData.name}`);
      }
      setIsCreatingCharity(false);
      setEditingCharity(null);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save charity');
    }
  };

  const handleToggleCharityActive = async (charity: Charity) => {
    try {
      await api.updateCharity(charity.id, { active: !charity.active });
      showToast('info', `Charity ${charity.name} is now ${!charity.active ? 'active' : 'inactive'}.`);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle charity status');
    }
  };

  const handleToggleCharityFeatured = async (charity: Charity) => {
    try {
      await api.updateCharity(charity.id, { featured: !charity.featured });
      showToast('info', `Charity ${charity.name} featured status: ${!charity.featured ? 'Yes' : 'No'}.`);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle featured status');
    }
  };

  // Unauthenticated Admin Guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-700">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Administrator Access Portal</h2>
            <p className="text-xs text-slate-500 mt-1">
              Restricted console. Enter your administrator credentials to manage draws, winners, and charity allocations.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@digitalheroes.co.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Operations Console</span>
                </>
              )}
            </button>
          </form>

          <div className="text-[11px] text-slate-400">
            Protected under backend role-based access control. Unauthorized attempts are logged.
          </div>
        </div>
      </div>
    );
  }

  // Filtered datasets
  const filteredWinners = allWinners.filter((w) => {
    if (winnerFilter === 'all') return true;
    return w.verificationStatus === winnerFilter;
  });

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.homeClub?.toLowerCase().includes(q) ||
      u.ghinOrMemberId?.toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            <span>Administrator Operations Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Execute cryptographic draw simulations, verify winner scorecards, manage accredited causes, oversee subscriber cohorts, and review audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Live DB</span>
          </button>

          <button
            onClick={() => onOpenExplain('draw-algorithm')}
            className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs text-indigo-900 font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Integrity Architecture</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Active Subscribers
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1">
              {analytics.activeSubscribers} golfers
            </div>
            <div className="text-[10px] text-emerald-700 mt-1 font-sans font-medium">
              Total base: {analytics.totalUsers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Gross Monthly Fees
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-display mt-1">
              {format((analytics.activeSubscribers || 1) * (systemConfig?.monthlyPlanPrice || 999))}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-sans">
              {systemConfig?.prizePoolAllocationPct || 40}% dedicated to prize pool
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Rollover Jackpot
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 font-display mt-1">
              {format(analytics.currentRolloverJackpot)}
            </div>
            <div className="text-[10px] text-indigo-700 mt-1 font-sans font-medium">
              Match 5 carryover
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Charity Given
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 font-display mt-1">
              {format(analytics.totalCharityContributed)}
            </div>
            <div className="text-[10px] text-rose-700 mt-1 font-sans font-medium">
              Non-contingent direct
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans">
              Pending Proofs
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-display mt-1">
              {analytics.pendingVerifications} claims
            </div>
            <div className="text-[10px] text-amber-800 mt-1 font-sans font-medium">
              {analytics.pendingPayouts} awaiting payout
            </div>
          </div>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('draws')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'draws'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Draws & Simulation Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('winners')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'winners'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Winner Verifications & Payouts</span>
          {analytics?.pendingVerifications > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-mono">
              {analytics.pendingVerifications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Subscriptions</span>
          <span className="text-[10px] text-slate-400 font-mono">({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('charities')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'charities'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Charity Directory Management</span>
          <span className="text-[10px] text-slate-400 font-mono">({adminCharities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Config & Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DRAWS & SIMULATION ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'draws' && (
        <div className="space-y-6">
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
                  Simulate candidate winning numbers against active participant Stableford scores and preview payouts before permanent publication.
                </p>
              </div>

              {/* Draw Selector & New Draw Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  id="admin-active-draw-select"
                  value={activeDrawId || upcomingOrDraftDraw?.id || (draws[0] ? draws[0].id : '')}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setActiveDrawId(newId);
                    setSimulationResult(getCachedSim(newId));
                    setSimulationError(null);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-semibold"
                >
                  {draws.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status.toUpperCase()})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsCreatingDraw(!isCreatingDraw)}
                  className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Draw</span>
                </button>
              </div>
            </div>

            {/* Create Draw Collapsible Form */}
            {isCreatingDraw && (
              <form onSubmit={handleCreateDraw} className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4">
                <div className="font-bold text-xs text-indigo-950">Schedule New Monthly Draw</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Draw Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. November 2026 Monthly Draw"
                      value={newDrawName}
                      onChange={(e) => setNewDrawName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Month-Year Code</label>
                    <input
                      type="text"
                      required
                      placeholder="2026-11"
                      value={newDrawMonthYear}
                      onChange={(e) => setNewDrawMonthYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Draw Calendar Date</label>
                    <input
                      type="date"
                      required
                      value={newDrawDate}
                      onChange={(e) => setNewDrawDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingDraw(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    Create Draw
                  </button>
                </div>
              </form>
            )}

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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between min-h-[300px]">
                {simulationError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{simulationError}</span>
                  </div>
                )}

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
                        <span className="text-amber-800 font-semibold">5-Match Winners (Jackpot 40%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {simulationResult.winners?.tier5?.length || 0} winners{' '}
                          {(simulationResult.winners?.tier5?.length || 0) === 0 && (
                            <span className="text-amber-700 text-[10px]">(Will roll over)</span>
                          )}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-700 font-semibold">4-Match Winners (35%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {simulationResult.winners?.tier4?.length || 0} winners
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-700 font-semibold">3-Match Winners (25%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {simulationResult.winners?.tier3?.length || 0} winners
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

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const id = activeDrawId || upcomingOrDraftDraw?.id || '';
                          setSimulationResult(null);
                          setCachedSim(id, null);
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                      >
                        Discard Simulation
                      </button>

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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WINNER VERIFICATION & PAYOUTS */}
      {/* ========================================================================= */}
      {activeTab === 'winners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <span>Winner Scorecard Compliance & Payout Ledger</span>
              </h3>
              <p className="text-xs text-slate-600">
                Audit golf scorecard screenshot proofs, approve/reject claims, and release prize disbursements with transaction references.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              {(['all', 'submitted', 'approved', 'rejected', 'required'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setWinnerFilter(status)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    winnerFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'submitted' ? 'Needs Review' : status}
                </button>
              ))}
            </div>
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
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWinners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No prize claims match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredWinners.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {winner.userName}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {winner.userEmail}
                        </span>
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
                            <span>Inspect Proof</span>
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
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            winner.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {winner.paymentStatus}
                        </span>
                        {winner.paymentReference && (
                          <span className="block text-[9px] font-mono text-slate-400 mt-0.5">
                            {winner.paymentReference}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          id={`review-winner-${winner.id}-btn`}
                          onClick={() => setSelectedProofWinner(winner)}
                          className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold transition-colors"
                        >
                          Audit & Pay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USERS & SUBSCRIPTION MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Subscriber Roster & Plan Status</span>
              </h3>
              <p className="text-xs text-slate-600">
                Manage registered golfer profiles, verify handicap indices, and adjust subscription billing statuses.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search golfers..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Golfer Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Handicap / Club</th>
                  <th className="px-4 py-3">Plan / Fee</th>
                  <th className="px-4 py-3">Charity Contribution</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Subscription Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{user.handicapIndex.toFixed(1)} HCP</span>
                      <span className="block text-[10px] text-slate-500">{user.homeClub || 'Independent'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 capitalize">{user.subscription.plan}</span>
                      <span className="block text-[10px] text-slate-500">{format(user.subscription.price)} / {user.subscription.billingInterval}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-700">
                      {user.subscription.charityContributionPct}% Direct
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.subscription.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : user.subscription.status === 'lapsed'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.subscription.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {user.subscription.status === 'active' ? (
                        <button
                          onClick={() => handleToggleUserSubscriptionStatus(user, 'lapsed')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
                        >
                          Set Lapsed
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleUserSubscriptionStatus(user, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CHARITIES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'charities' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <span>Accredited Charities Management</span>
              </h3>
              <p className="text-xs text-slate-600">
                Register new vetted charity partners, edit mission statements, and oversee non-contingent direct funds raised.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCharity(null);
                setCharityFormData({
                  name: '',
                  category: 'healthcare',
                  tagline: '',
                  description: '',
                  mission: '',
                  imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
                  impactStatement: 'Every ₹2,500 ($30) provides vital direct supplies.',
                  taxId: '80G-ACC-2026',
                  featured: false,
                  active: true,
                  events: [],
                });
                setIsCreatingCharity(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Charity</span>
            </button>
          </div>

          {/* Charity Form Modal/Collapsible */}
          {isCreatingCharity && (
            <form onSubmit={handleSaveCharity} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  {editingCharity ? `Edit ${editingCharity.name}` : 'Register New Accredited Charity'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingCharity(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Charity Name</label>
                  <input
                    type="text"
                    required
                    value={charityFormData.name}
                    onChange={(e) => setCharityFormData({ ...charityFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={charityFormData.category}
                    onChange={(e) => setCharityFormData({ ...charityFormData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 capitalize"
                  >
                    {['healthcare', 'environment', 'wildlife', 'youth', 'veterans', 'community', 'education'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tax ID / 80G Registration</label>
                  <input
                    type="text"
                    value={charityFormData.taxId}
                    onChange={(e) => setCharityFormData({ ...charityFormData, taxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={charityFormData.imageUrl}
                    onChange={(e) => setCharityFormData({ ...charityFormData, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    required
                    value={charityFormData.tagline}
                    onChange={(e) => setCharityFormData({ ...charityFormData, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={charityFormData.description}
                    onChange={(e) => setCharityFormData({ ...charityFormData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Impact Statement</label>
                  <input
                    type="text"
                    required
                    value={charityFormData.impactStatement}
                    onChange={(e) => setCharityFormData({ ...charityFormData, impactStatement: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={charityFormData.featured}
                      onChange={(e) => setCharityFormData({ ...charityFormData, featured: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Featured Charity</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={charityFormData.active}
                      onChange={(e) => setCharityFormData({ ...charityFormData, active: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Active Directory Listing</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCharity(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    {editingCharity ? 'Save Changes' : 'Create Charity'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Charity List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCharities.map((charity) => (
              <div key={charity.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      {charity.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {charity.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                          Featured
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          charity.active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {charity.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 font-display">{charity.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{charity.tagline}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-sans">Total Raised:</span>
                    <strong className="text-emerald-700 font-bold">{format(charity.totalRaised)}</strong>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleToggleCharityFeatured(charity)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                    >
                      {charity.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleToggleCharityActive(charity)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        charity.active
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {charity.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCharity(charity);
                        setCharityFormData({
                          name: charity.name,
                          category: charity.category,
                          tagline: charity.tagline,
                          description: charity.description,
                          mission: charity.mission,
                          imageUrl: charity.imageUrl,
                          impactStatement: charity.impactStatement,
                          taxId: charity.taxId,
                          featured: charity.featured,
                          active: charity.active,
                          events: charity.events || [],
                        });
                        setIsCreatingCharity(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM CONFIG & AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Parameters Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Configurable Platform Allocation Parameters</span>
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative parameters stored in the database according to the PRD specification.
              </p>

              {systemConfig && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                    <span className="text-slate-700 font-sans">Prize Pool Allocation:</span>
                    <strong className="text-indigo-900 font-bold">{systemConfig.prizePoolAllocationPct}% of Subscriptions</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                    <span className="text-slate-700 font-sans">Minimum Charity Contribution:</span>
                    <strong className="text-rose-700 font-bold">{systemConfig.minCharityPct}% (Guaranteed min)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                    <span className="text-slate-700 font-sans">Default Charity Contribution:</span>
                    <strong className="text-slate-900 font-bold">{systemConfig.defaultCharityPct}%</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                    <span className="text-slate-700 font-sans">Monthly Membership Price:</span>
                    <strong className="text-slate-900 font-bold">{format(systemConfig.monthlyPlanPrice)}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                    <span className="text-slate-700 font-sans">Annual Membership Price:</span>
                    <strong className="text-slate-900 font-bold">{format(systemConfig.yearlyPlanPrice)} (2 mos free)</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Integrity Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic & Legal Compliance</span>
              </h3>
              <p className="text-xs text-slate-500">
                Transparent verification safeguards enforced by the backend system.
              </p>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Immutable Score Window:</strong> Only 5 newest Stableford scores (1-45, 1/day) are evaluated at draw time.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Match 5 Jackpot Rollover:</strong> Unclaimed 5-match jackpot carries forward automatically to subsequent draws.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Accredited Direct Impact:</strong> Charity allocation is ring-fenced immediately upon subscription renewal.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Audit Log Table */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Immutable System Audit Trail</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-mono border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Operation Details</th>
                    <th className="px-4 py-3">Result ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {log.actor}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-sans text-xs text-slate-600">
                        {log.details}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {log.resultId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROOF INSPECTION & APPROVAL MODAL */}
      {/* ========================================================================= */}
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
                  Scorecard Verification & Payout Audit
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

              {/* Action 1: Rejection Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason (Required only if declining proof)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Screenshot blurry; round dates don't match submitted rounds."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-rose-600 focus:bg-white"
                />
              </div>

              {/* Action 2: Payment Reference */}
              {selectedProofWinner.verificationStatus === 'approved' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank / Payment Reference (For payout disbursement)
                  </label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder={`e.g. BANK-TXN-${Date.now()}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white font-mono"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleRejectWinner(selectedProofWinner.id)}
                  disabled={isActioning}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline Proof</span>
                </button>

                {selectedProofWinner.verificationStatus !== 'approved' ? (
                  <button
                    type="button"
                    id="confirm-approve-verification-btn"
                    onClick={() => handleApproveWinner(selectedProofWinner.id)}
                    disabled={isActioning}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Proof</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(selectedProofWinner.id)}
                    disabled={isActioning || selectedProofWinner.paymentStatus === 'paid'}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{selectedProofWinner.paymentStatus === 'paid' ? 'Paid' : 'Mark Payout Paid'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

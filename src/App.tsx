/**
 * Digital Heroes — Main Application Shell
 * Connects AuthProvider, Role-segregated views, Modular Pages, and Verification Modals.
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { api } from './api/client';
import { Charity, Draw, GolfScore, WinnerRecord } from './types';
import { Navbar } from './components/Navbar';
import { ExplainabilityModal, ExplainTopic } from './components/ExplainabilityModal';
import { ScoreModal } from './components/ScoreModal';
import { ProofUploadModal } from './components/ProofUploadModal';
import { CharityDetailModal } from './components/CharityDetailModal';
import { DirectDonationModal } from './components/DirectDonationModal';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DigitalHeroesLogo } from './components/DigitalHeroesLogo';

import { HomePage } from './pages/HomePage';
import { CharityDirectoryPage } from './pages/CharityDirectoryPage';
import { DrawsPage } from './pages/DrawsPage';
import { SubscriberDashboard } from './pages/SubscriberDashboard';
import { AdminPage } from './pages/AdminPage';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isVisitor, isAdmin, isSubscriber, toast, hideToast } = useAuth();

  // Navigation view state: 'home' | 'charities' | 'draws' | 'dashboard' | 'admin'
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('dh_session_user_id');
      if (savedUser === 'user-admin') return 'admin';
      if (savedUser && savedUser !== 'visitor') return 'dashboard';
    }
    return 'home';
  });

  // Shared application datasets
  const [charities, setCharities] = useState<Charity[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<WinnerRecord[]>([]);
  const [userScores, setUserScores] = useState<GolfScore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [explainTopic, setExplainTopic] = useState<ExplainTopic | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup',
  });
  const [scoreModal, setScoreModal] = useState<{ isOpen: boolean; scoreToEdit: GolfScore | null }>({
    isOpen: false,
    scoreToEdit: null,
  });
  const [proofWinner, setProofWinner] = useState<WinnerRecord | null>(null);
  const [detailCharity, setDetailCharity] = useState<Charity | null>(null);
  const [donationCharity, setDonationCharity] = useState<Charity | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [charitiesRes, drawsRes, winnersRes] = await Promise.all([
        api.getCharities(),
        api.getDraws(),
        api.getAllWinners(),
      ]);
      setCharities(Array.isArray(charitiesRes) ? charitiesRes : (charitiesRes as any).charities || []);
      setDraws(Array.isArray(drawsRes) ? drawsRes : (drawsRes as any).draws || []);
      setWinners(winnersRes.winners || (Array.isArray(winnersRes) ? winnersRes : []));

      if (currentUser && currentUser.role === 'subscriber') {
        try {
          const scoresRes = await api.getMyScores();
          setUserScores(scoresRes.scores || []);
        } catch {
          setUserScores([]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial application datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Synchronize view strictly by role
  useEffect(() => {
    if (isAdmin) {
      // If admin is on subscriber dashboard or home on login, switch to admin dashboard
      if (currentView === 'dashboard' || currentView === 'home') {
        setCurrentView('admin');
      }
    } else if (isSubscriber) {
      // If subscriber is on admin view, switch to subscriber dashboard
      if (currentView === 'admin') {
        setCurrentView('dashboard');
      }
    } else if (isVisitor) {
      // If visitor is on subscriber dashboard, switch to home
      if (currentView === 'dashboard') {
        setCurrentView('home');
      }
    }
  }, [currentUser, isAdmin, isSubscriber, isVisitor, currentView]);

  const currentDraw = draws.find((d) => d.status === 'upcoming') || draws[0] || null;
  const featuredCharity = charities.find((c) => c.featured) || charities[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Primary Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onOpenScoreModal={() => setScoreModal({ isOpen: true, scoreToEdit: null })}
        onOpenExplain={(topic) => setExplainTopic(topic)}
      />

      {/* 2. Main Dynamic Content Area - Segregated by Role */}
      <main className="flex-1">
        {isAdmin ? (
          /* ================= ONLY ADMIN VIEWS ================= */
          <>
            {currentView === 'charities' && (
              <CharityDirectoryPage
                charities={charities}
                onSelectCharity={(charity) => setDetailCharity(charity)}
                onOpenDonate={(charity) => setDonationCharity(charity)}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onRefresh={loadData}
              />
            )}

            {currentView === 'draws' && (
              <DrawsPage
                draws={draws}
                winners={winners}
                onOpenExplain={(topic) => setExplainTopic(topic)}
              />
            )}

            {(currentView === 'admin' || (currentView !== 'charities' && currentView !== 'draws')) && (
              <AdminPage
                draws={draws}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onRefreshData={loadData}
              />
            )}
          </>
        ) : isSubscriber ? (
          /* ================= ONLY SUBSCRIBER VIEWS ================= */
          <>
            {currentView === 'home' && (
              <HomePage
                currentDraw={currentDraw}
                featuredCharity={featuredCharity}
                onNavigate={setCurrentView}
                onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onSelectCharity={(charity) => setDetailCharity(charity)}
              />
            )}

            {currentView === 'charities' && (
              <CharityDirectoryPage
                charities={charities}
                onSelectCharity={(charity) => setDetailCharity(charity)}
                onOpenDonate={(charity) => setDonationCharity(charity)}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onRefresh={loadData}
              />
            )}

            {currentView === 'draws' && (
              <DrawsPage
                draws={draws}
                winners={winners}
                onOpenExplain={(topic) => setExplainTopic(topic)}
              />
            )}

            {(currentView === 'dashboard' || (currentView !== 'home' && currentView !== 'charities' && currentView !== 'draws')) && (
              <SubscriberDashboard
                charities={charities}
                upcomingDraw={currentDraw}
                onOpenScoreModal={(scoreToEdit) =>
                  setScoreModal({ isOpen: true, scoreToEdit: scoreToEdit || null })
                }
                onOpenProofModal={(w) => setProofWinner(w)}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onNavigate={setCurrentView}
              />
            )}
          </>
        ) : (
          /* ================= PUBLIC VISITOR VIEWS ================= */
          <>
            {currentView === 'home' && (
              <HomePage
                currentDraw={currentDraw}
                featuredCharity={featuredCharity}
                onNavigate={setCurrentView}
                onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onSelectCharity={(charity) => setDetailCharity(charity)}
              />
            )}

            {currentView === 'charities' && (
              <CharityDirectoryPage
                charities={charities}
                onSelectCharity={(charity) => setDetailCharity(charity)}
                onOpenDonate={(charity) => setDonationCharity(charity)}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onRefresh={loadData}
              />
            )}

            {currentView === 'draws' && (
              <DrawsPage
                draws={draws}
                winners={winners}
                onOpenExplain={(topic) => setExplainTopic(topic)}
              />
            )}

            {currentView === 'admin' && (
              <AdminPage
                draws={draws}
                onOpenExplain={(topic) => setExplainTopic(topic)}
                onRefreshData={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <DigitalHeroesLogo variant="horizontal" size="sm" showTagline={true} />
            <p className="text-[11px] text-slate-500 max-w-sm">
              Subscription-driven golf platform directing guaranteed funds to accredited causes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <button onClick={() => setExplainTopic('charity-model')} className="hover:text-slate-900 transition-colors">
              Charity Allocation (Min 10%)
            </button>
            <button onClick={() => setExplainTopic('prize-pool')} className="hover:text-slate-900 transition-colors">
              Prize Formulas & Rollover
            </button>
            <button onClick={() => setExplainTopic('rolling-scores')} className="hover:text-slate-900 transition-colors">
              Rolling 5-Score Window
            </button>
            <button onClick={() => setExplainTopic('winner-verification')} className="hover:text-slate-900 transition-colors">
              Verification Compliance
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Digital Heroes Platform</span>
            {isVisitor && (
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="text-slate-400 hover:text-indigo-600 font-sans transition-colors"
              >
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* 4. Modals & Overlays */}
      <ExplainabilityModal topic={explainTopic} onClose={() => setExplainTopic(null)} />

      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        charities={charities}
        onClose={() => setAuthModal({ isOpen: false, mode: 'signup' })}
        onSuccess={(user) => {
          loadData();
          if (user?.role === 'admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          loadData();
          setCurrentView('admin');
        }}
      />

      <ScoreModal
        isOpen={scoreModal.isOpen}
        scoreToEdit={scoreModal.scoreToEdit}
        existingScores={userScores}
        onClose={() => setScoreModal({ isOpen: false, scoreToEdit: null })}
        onSuccess={loadData}
      />

      <ProofUploadModal
        winnerRecord={proofWinner}
        onClose={() => setProofWinner(null)}
        onSuccess={loadData}
      />

      <CharityDetailModal
        charity={detailCharity}
        onClose={() => setDetailCharity(null)}
        onOpenDonate={(c) => {
          setDetailCharity(null);
          setDonationCharity(c);
        }}
        isCurrentlySelected={currentUser?.subscription.selectedCharityId === detailCharity?.id}
      />

      <DirectDonationModal
        charity={donationCharity}
        onClose={() => setDonationCharity(null)}
        onSuccess={loadData}
      />

      {/* 5. Notification Toast Banner */}
      {toast && (
        <div
          id="global-toast-notification"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 max-w-md animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-700'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={hideToast} className="p-1 hover:text-white rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <MainApp />
      </CurrencyProvider>
    </AuthProvider>
  );
}

/**
 * Digital Heroes — Primary Application Navigation
 * Clean, modern, and purposeful navigation without traditional golf cliches.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Award,
  ChevronDown,
  Heart,
  HelpCircle,
  Layers,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { ExplainTopic } from './ExplainabilityModal';
import { DigitalHeroesLogo } from './DigitalHeroesLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenScoreModal: () => void;
  onOpenExplain: (topic: ExplainTopic) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenScoreModal,
  onOpenExplain,
}) => {
  const { currentUser, isVisitor, isAdmin, isSubscriber, hasActiveSubscription, logout } = useAuth();
  const { mode: currencyMode, setMode: setCurrencyMode } = useCurrency();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="main-app-header"
      className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-colors shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            id="brand-home-btn"
            onClick={() => handleNav('home')}
            className="flex items-center text-left group focus:outline-hidden hover:opacity-90 transition-opacity"
            title="Digital Heroes — Play, Give, Create Impact"
          >
            <DigitalHeroesLogo variant="horizontal" size="sm" showTagline={true} />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <button
              id="nav-play-btn"
              onClick={() => handleNav('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'dashboard'
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Play
            </button>

            <button
              id="nav-impact-btn"
              onClick={() => handleNav('charities')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'charities'
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Impact
            </button>

            <button
              id="nav-how-it-works-btn"
              onClick={() => {
                if (currentView !== 'home') {
                  handleNav('home');
                  setTimeout(() => {
                    document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              How it Works
            </button>

            <button
              id="nav-charities-btn"
              onClick={() => handleNav('charities')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'charities'
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Charities
            </button>

            <button
              id="nav-about-btn"
              onClick={() => handleNav('draws')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentView === 'draws'
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Monthly Draws
            </button>

            {/* Admin Console shortcut for testing */}
            <button
              id="nav-admin-btn"
              onClick={() => handleNav('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ml-2 ${
                currentView === 'admin'
                  ? 'text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200'
                  : 'text-slate-500 hover:text-indigo-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </nav>
        </div>

        {/* Right side utilities & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Switcher Pill */}
          <div className="relative flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
            <button
              id="currency-btn-dual"
              onClick={() => setCurrencyMode('dual')}
              title="Dual Currency: Show both INR (₹) and USD ($)"
              className={`px-2 py-1 rounded-md transition-all ${
                currencyMode === 'dual'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ₹ / $
            </button>
            <button
              id="currency-btn-inr"
              onClick={() => setCurrencyMode('inr')}
              title="Indian Rupees (₹)"
              className={`px-2 py-1 rounded-md transition-all ${
                currencyMode === 'inr'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ₹ INR
            </button>
            <button
              id="currency-btn-usd"
              onClick={() => setCurrencyMode('usd')}
              title="US Dollars ($)"
              className={`px-2 py-1 rounded-md transition-all ${
                currencyMode === 'usd'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* If subscriber and active, provide Log Score quick action */}
          {currentUser && hasActiveSubscription && (
            <button
              id="nav-add-score-quick-btn"
              onClick={onOpenScoreModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Log Score</span>
            </button>
          )}

          {/* Visitor state: Log In / Get Started */}
          {isVisitor ? (
            <div className="flex items-center gap-2">
              <button
                id="nav-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
              >
                Log In
              </button>
              <button
                id="nav-signup-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* User profile menu */}
              <button
                id="nav-user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-[11px] text-emerald-800">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <span className="max-w-[110px] truncate font-semibold hidden sm:inline text-slate-800">
                  {currentUser?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isUserMenuOpen && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="p-2.5 border-b border-slate-100 mb-1">
                    <div className="font-bold text-slate-900 text-sm">{currentUser?.name}</div>
                    <div className="text-slate-500 text-[11px] truncate">{currentUser?.email}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          hasActiveSubscription
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {currentUser?.subscription.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {currentUser?.subscription.plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleNav('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Subscriber Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleNav('admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Administrator Console</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2 text-sm"
        >
          <button
            onClick={() => handleNav('home')}
            className="block w-full text-left py-2 text-slate-200 hover:text-white font-medium"
          >
            Overview
          </button>
          <button
            onClick={() => handleNav('charities')}
            className="block w-full text-left py-2 text-slate-200 hover:text-white font-medium"
          >
            Charity Directory
          </button>
          <button
            onClick={() => handleNav('draws')}
            className="block w-full text-left py-2 text-slate-200 hover:text-white font-medium"
          >
            Monthly Draws & Transparency
          </button>
          <button
            onClick={() => handleNav('dashboard')}
            className="block w-full text-left py-2 text-emerald-400 font-semibold"
          >
            Subscriber Dashboard
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="block w-full text-left py-2 text-indigo-400 font-semibold"
          >
            Administrator Console
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenExplain('prize-pool');
            }}
            className="block w-full text-left py-2 text-slate-400 hover:text-slate-200"
          >
            How the System Works
          </button>
        </div>
      )}
    </header>
  );
};

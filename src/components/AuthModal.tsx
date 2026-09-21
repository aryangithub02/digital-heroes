/**
 * Digital Heroes — Authentication & Subscription Onboarding Modal
 * Seamlessly integrates Plan selection, Charity selection, Contribution % (min 10%),
 * and one-click quick logins for evaluators.
 * Styled in clean light theme with INR currency.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Charity, SubscriptionPlanType, UserProfile } from '../types';
import { DigitalHeroesLogo } from './DigitalHeroesLogo';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Heart,
  Layers,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  charities: Charity[];
  onClose: () => void;
  onSuccess: (user?: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode,
  charities,
  onClose,
  onSuccess,
}) => {
  const { login, signup } = useAuth();
  const { format } = useCurrency();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(mode);
  const [step, setStep] = useState<number>(1); // 1: Plan, 2: Charity & %, 3: Profile & Golf, 4: Complete

  // Sign up fields
  const [plan, setPlan] = useState<SubscriptionPlanType>('monthly');
  const [selectedCharityId, setSelectedCharityId] = useState<string>(
    charities[0]?.id || 'charity-macmillan'
  );
  const [charityPct, setCharityPct] = useState<number>(15);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [homeClub, setHomeClub] = useState<string>('Wentworth Club');
  const [handicapIndex, setHandicapIndex] = useState<number>(14.2);

  // Login fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const planPrice = plan === 'yearly' ? 9990 : 999;
  const charityAmount = Math.round((planPrice * charityPct) / 100);
  const prizeAllocation = Math.round(planPrice * 0.40);
  const platformFee = planPrice - charityAmount - prizeAllocation;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(loginEmail.trim(), loginPassword);
      onSuccess(loggedInUser);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }
    if (!password || password.trim().length < 6) {
      setErrorMsg('Password is required and must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await signup({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        plan,
        selectedCharityId,
        charityContributionPct: charityPct,
        homeClub: homeClub.trim(),
        handicapIndex,
      });
      onSuccess(createdUser);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center justify-center mb-6">
          <DigitalHeroesLogo variant="horizontal" size="md" showTagline={true} />
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 pb-3 mb-6">
          <button
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
            }}
            className={`pb-2 px-3 text-sm font-bold tracking-tight transition-colors border-b-2 ${
              authMode === 'signup'
                ? 'text-slate-900 border-emerald-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Create Subscription Account
          </button>
          <button
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`pb-2 px-3 text-sm font-bold tracking-tight transition-colors border-b-2 ${
              authMode === 'login'
                ? 'text-slate-900 border-emerald-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {authMode === 'login' ? (
          <div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Sign in with your registered email address to access your account dashboard.
            </p>

            {/* Email and Password login form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Email Address
                </label>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="login-password-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white pr-10"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Demo Accounts:</span> Seed accounts password is{' '}
                <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">DigitalHeroes2026!</code>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          /* Multi-step Sign Up */
          <div>
            {/* Steps indicator */}
            <div className="flex items-center justify-between mb-6 text-xs font-semibold text-slate-400">
              <span className={step >= 1 ? 'text-emerald-700' : ''}>1. Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={step >= 2 ? 'text-emerald-700' : ''}>2. Charity & %</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={step >= 3 ? 'text-emerald-700' : ''}>3. Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={step >= 4 ? 'text-emerald-700' : ''}>4. Activate</span>
            </div>

            {/* STEP 1: Plan Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 font-display">Choose Subscription Plan</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Both plans grant full access to Stableford performance tracking, monthly prize draws, and direct charitable giving.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => setPlan('monthly')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      plan === 'monthly'
                        ? 'bg-emerald-50/60 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">Monthly Plan</span>
                      {plan === 'monthly' && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-display">{format(999)}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Billed monthly · Cancel anytime</div>
                  </div>

                  <div
                    onClick={() => setPlan('yearly')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                      plan === 'yearly'
                        ? 'bg-emerald-50/60 border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-600 text-white">
                      Save ~17%
                    </span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">Yearly Plan</span>
                      {plan === 'yearly' && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-display">{format(9990)}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{format(832.5)}/mo equivalent</div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Next: Select Charity</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Charity & Contribution % */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 font-display">
                  Select Cause & Contribution Percentage
                </h4>
                <p className="text-xs text-slate-600">
                  Minimum 10% required. Every contribution directly empowers your chosen organization regardless of draw outcomes.
                </p>

                {/* Charity Picker */}
                <div>
                  <label htmlFor="charity-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Choose Accredited Charity
                  </label>
                  <select
                    id="charity-select"
                    value={selectedCharityId}
                    onChange={(e) => setSelectedCharityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 font-medium"
                  >
                    {charities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contribution % Slider */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Charity Allocation Percentage:
                    </span>
                    <span className="text-base font-extrabold text-rose-700 font-display">
                      {charityPct}% of subscription
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={charityPct}
                    onChange={(e) => setCharityPct(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10% (Min)</span>
                    <span>15% (Default)</span>
                    <span>25%</span>
                    <span>50% (Max)</span>
                  </div>

                  {/* Financial distribution preview */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="text-rose-700 font-bold font-mono">{format(charityAmount)}</div>
                      <div className="text-[10px] text-slate-600">To Charity</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-emerald-700 font-bold font-mono">{format(prizeAllocation)}</div>
                      <div className="text-[10px] text-slate-600">Prize Pool (40%)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                      <div className="text-slate-700 font-bold font-mono">{format(platformFee)}</div>
                      <div className="text-[10px] text-slate-600">Operations</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Next: Profile & Handicap</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Profile & Golf Handicap */}
            {step === 3 && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <h4 className="text-base font-bold text-slate-900 font-display">Golfer Profile Details</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                      placeholder="e.g. Alex Henderson"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                      placeholder="name@domain.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-home-club-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Home Club / Course
                    </label>
                    <input
                      id="signup-home-club-input"
                      type="text"
                      value={homeClub}
                      onChange={(e) => setHomeClub(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                      placeholder="e.g. Wentworth Club"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-handicap-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Exact Handicap Index
                    </label>
                    <input
                      id="signup-handicap-input"
                      type="number"
                      step="0.1"
                      value={handicapIndex}
                      onChange={(e) => setHandicapIndex(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Password * <span className="text-[10px] text-slate-400 font-normal">(min 6 chars)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password-input"
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white pr-8"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                        title={showSignupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white pr-8"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated PCI Gateway notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Simulated PCI Gateway: Clicking Activate simulates immediate payment confirmation for demonstration purposes.
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    id="activate-subscription-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitting ? 'Activating...' : `Activate Subscription (${format(planPrice)})`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

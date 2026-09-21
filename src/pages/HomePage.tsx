/**
 * Digital Heroes — Homepage
 * Implements the design reference:
 * - Lush photographic hero with "Feel, Not Fairway.", "Small Swings Big Change", and stats bar
 * - 6-step "How It Works" lifecycle
 * - Rory McIlroy Ambassador spotlight banner with quote and signature
 * - Featured Charities grid matching accredited partner cards
 * - Financial transparency calculator (£ currency) and integrity audit pillars
 */

import React, { useState } from 'react';
import { Charity, Draw } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import { DigitalHeroesLogo } from '../components/DigitalHeroesLogo';
import { useCurrency, Money } from '../context/CurrencyContext';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Heart,
  HelpCircle,
  Layers,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

interface HomePageProps {
  currentDraw: Draw | null;
  featuredCharity: Charity | null;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenExplain: (topic: ExplainTopic) => void;
  onSelectCharity: (charity: Charity) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentDraw,
  featuredCharity,
  onNavigate,
  onOpenAuth,
  onOpenExplain,
  onSelectCharity,
}) => {
  const { format, formatINR, formatUSD, formatDual } = useCurrency();
  // Interactive Calculator State (INR base with live USD conversion)
  const [calcPlan, setCalcPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [calcCharityPct, setCalcCharityPct] = useState<number>(15);

  const price = calcPlan === 'yearly' ? 9990 : 999;
  const charityAmount = Math.round((price * calcCharityPct) / 100);
  const prizePoolShare = Math.round(price * 0.40);
  const platformShare = price - charityAmount - prizePoolShare;

  return (
    <div id="home-page-container" className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION WITH RICH GOLF FAIRWAY PHOTOGRAPHY */}
      <section
        id="hero-section"
        className="relative overflow-hidden min-h-[620px] flex items-center justify-center bg-slate-900 text-white"
      >
        {/* Background Golf Fairway Image with Optical Contrast Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=2000&q=80"
            alt="Golfer taking swing on scenic green fairway"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.68] contrast-[1.08]"
          />
          {/* Gradients to balance text readability and aesthetic luminosity */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/60" />
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/30 to-slate-950/80" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          {/* Eyebrow badge matching reference */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
            <DigitalHeroesLogo variant="emblem" size="xs" />
            <span>PLAY • GIVE • CREATE IMPACT</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white font-display tracking-tight leading-[1.05] drop-shadow-md">
            Feel, Not Fairway.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-xl text-slate-200 max-w-2xl mx-auto font-normal drop-shadow-sm leading-relaxed">
            Play golf. Win rewards. Support charities. Be a Digital Hero.
          </p>

          {/* CTA Buttons matching design reference */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              id="hero-join-btn"
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Join Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-how-it-works-btn"
              onClick={() => {
                document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>How It Works</span>
            </button>
          </div>

          {/* Value pill chips matching design reference */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium">
            <span className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-slate-200 flex items-center gap-1.5">
              ⛳ <strong>Better Golfers</strong>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-slate-200 flex items-center gap-1.5">
              🎯 <strong>Bigger Causes</strong>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-slate-200 flex items-center gap-1.5">
              ☀️ <strong>Brighter Futures</strong>
            </span>
          </div>

          {/* Cursive Handwriting Accent */}
          <div className="mt-6 flex justify-center">
            <span className="font-script text-amber-300 text-3xl sm:text-4xl -rotate-6 drop-shadow-md select-none tracking-wide">
              Small Swings Big Change
            </span>
          </div>
        </div>

        {/* Pinned Stats Bar along bottom of hero */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md border-t border-white/10 py-3.5 px-4 z-20">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-white font-display">10,000+</div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Golfers Playing</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-display">{format(250000)}+</div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Raised for Charity</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-white font-display">50+</div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Charity Partners</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-display">Monthly</div>
              <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Draws & Rewards</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "HOW IT WORKS" 6-STEP JOURNEY */}
      <section
        id="how-it-works-section"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 font-normal">
            A simple journey. A bigger purpose.
          </p>
        </div>

        {/* 6 Flow Cards with Step Numbers and Chevrons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {[
            {
              step: '1',
              name: 'Subscribe',
              desc: 'Join Digital Heroes & choose your charity',
              color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              step: '2',
              name: 'Play',
              desc: 'Log your golf scores (Stableford)',
              color: 'text-sky-700 bg-sky-50 border-sky-200',
            },
            {
              step: '3',
              name: 'Contribute',
              desc: 'A minimum of 10% goes to charity',
              color: 'text-rose-700 bg-rose-50 border-rose-200',
            },
            {
              step: '4',
              name: 'Participate',
              desc: 'Get entered into the monthly draw',
              color: 'text-amber-700 bg-amber-50 border-amber-200',
            },
            {
              step: '5',
              name: 'Win',
              desc: 'Match 5, 4 or 3 numbers',
              color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
            },
            {
              step: '6',
              name: 'Verify & Pay',
              desc: 'We verify and pay out winnings',
              color: 'text-teal-700 bg-teal-50 border-teal-200',
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs font-display mb-3">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display mb-1.5">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {idx < 5 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. AMBASSADOR SPOTLIGHT BANNER: RORY MCILROY */}
      <section
        id="ambassador-section"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="rounded-3xl bg-[#032e22] text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-xl border border-emerald-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Ambassador Photo */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-emerald-400/40 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=600&q=80"
                  alt="Rory McIlroy, Digital Heroes Ambassador"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Quote & Credentials */}
            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>Global Ambassador</span>
              </div>

              <blockquote className="text-xl sm:text-2xl lg:text-3xl font-serif italic text-emerald-50 leading-snug">
                "Golf has given me so much. This lets me give something back."
              </blockquote>

              <div className="pt-2">
                <div className="text-lg font-bold text-white font-display">
                  Rory McIlroy
                </div>
                <div className="text-xs text-emerald-300/90 font-medium">
                  Digital Heroes Ambassador
                </div>
                {/* Signature Effect */}
                <div className="font-script text-3xl sm:text-4xl text-amber-300 mt-2 select-none">
                  Rory McIlroy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AMBASSADOR / SPOTLIGHT BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-slate-800 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <span>Ambassador Spotlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
              "Every round we play has the power to change a life."
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join thousands of golfers transforming their everyday Stableford performance into real, measurable charity contributions and verified rewards.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="font-script text-amber-300 text-2xl">Rory Vance</div>
              <span className="text-xs text-slate-400 font-mono">· Founding Ambassador</span>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-lg flex items-center gap-2"
            >
              <span>Join Digital Heroes</span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. FEATURED CHARITIES */}
      <section id="featured-charities-section" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>Accredited Causes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Featured Partner Charities
            </h2>
          </div>

          <button
            onClick={() => onNavigate('charities')}
            className="text-emerald-700 hover:text-emerald-800 font-semibold text-sm flex items-center gap-1 self-start sm:self-auto group"
          >
            <span>View All Charities</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 4 Partner Cards matching reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              id: 'charity-gosh',
              name: 'Great Ormond Street Hospital Charity',
              tagline: 'Help give seriously ill children a brighter tomorrow.',
              category: 'Children & Health',
              image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
              raisedAmount: 78400,
              supporters: '3,120',
            },
            {
              id: 'charity-macmillan',
              name: 'Macmillan Cancer Support',
              tagline: 'Supporting people living with cancer every step of the way.',
              category: 'Health & Care',
              image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
              raisedAmount: 92100,
              supporters: '4,450',
            },
            {
              id: 'charity-alzheimers',
              name: "Alzheimer's Society",
              tagline: 'A kinder future for everyone affected by dementia.',
              category: 'Dementia Care',
              image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=600&q=80',
              raisedAmount: 45300,
              supporters: '1,890',
            },
            {
              id: 'charity-bhf',
              name: 'British Heart Foundation',
              tagline: 'Funding lifesaving research to beat heartbreak forever.',
              category: 'Cardiovascular Research',
              image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
              raisedAmount: 64800,
              supporters: '2,810',
            },
          ].map((charity) => (
            <div
              key={charity.id}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={charity.image}
                    alt={charity.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    {charity.category}
                  </div>
                  <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 shadow-xs">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug font-display">
                    {charity.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {charity.tagline}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 mb-3">
                  <span className="text-slate-500">Directed:</span>
                  <span className="font-bold text-emerald-700 font-mono">{format(charity.raisedAmount)}</span>
                </div>

                <button
                  onClick={() => onNavigate('charities')}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Select Charity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE VALUE & IMPACT CALCULATOR */}
      <section
        id="interactive-calculator-section"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Financial Transparency</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                See Where Every Contribution Goes
              </h3>
            </div>

            {/* Plan switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setCalcPlan('monthly')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                  calcPlan === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly ({format(999)})
              </button>
              <button
                onClick={() => setCalcPlan('yearly')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                  calcPlan === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly ({format(9990)})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Charity Allocation Preference:
                </span>
                <span className="text-base font-bold text-emerald-700 font-display">
                  {calcCharityPct}% of subscription
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={calcCharityPct}
                onChange={(e) => setCalcCharityPct(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (Floor)</span>
                <span>15% (Typical)</span>
                <span>25%</span>
                <span>50% (Generous)</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
                Every subscription fee is automatically divided: a minimum of 10% goes directly to your designated charity, 40% funds the monthly winner prize pool, and the remainder maintains the platform.
              </p>
            </div>

            {/* Live Dual Currency Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
                {calcPlan === 'yearly' ? 'Annual Distribution' : 'Monthly Distribution'}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  Your Designated Charity ({calcCharityPct}%):
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {format(charityAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Trophy className="w-3.5 h-3.5" />
                  Monthly Prize Pool (40%):
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {format(prizePoolShare)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Platform Operations:</span>
                <span className="font-mono font-bold text-slate-700">
                  {format(platformShare)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-xs text-slate-900">
                <span>Total Subscription:</span>
                <span className="font-mono text-emerald-700 text-sm">{format(price)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & INTEGRITY PILLARS */}
      <section
        id="trust-section"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center max-w-4xl mx-auto space-y-6 shadow-sm">
          <div className="flex justify-center pb-2">
            <DigitalHeroesLogo variant="stacked" size="md" showTagline={true} />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Built on Absolute Integrity
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Digital Heroes is designed to be completely transparent. Every percentage is mathematically enforced. Every winner must submit verified scorecard evidence before payouts are approved.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-xs mb-1">Scorecard Proof Required</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Prizes are only released after verified exports or photos of accredited golf scorecards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-xs mb-1">Guaranteed Charity Floor</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Charity funding is non-conditional and ringfenced automatically from every active subscription.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 text-xs mb-1">Immutable Draw Audits</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All draw simulations, publications, winner approvals, and payouts are logged in an authoritative audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

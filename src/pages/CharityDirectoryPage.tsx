/**
 * Digital Heroes — Charity Directory Page
 * Matches light theme and £ currency:
 * - Search & filter by cause
 * - Clean white cards with partner photography and badges
 * - Support button to switch active subscription cause or make direct donation
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import { Charity } from '../types';
import { ExplainTopic } from '../components/ExplainabilityModal';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Heart,
  HelpCircle,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

interface CharityDirectoryPageProps {
  charities: Charity[];
  onSelectCharity: (charity: Charity) => void;
  onOpenDonate: (charity: Charity) => void;
  onOpenExplain: (topic: ExplainTopic) => void;
  onRefresh: () => void;
}

export const CharityDirectoryPage: React.FC<CharityDirectoryPageProps> = ({
  charities,
  onSelectCharity,
  onOpenDonate,
  onOpenExplain,
  onRefresh,
}) => {
  const { currentUser, isSubscriber, showToast } = useAuth();
  const { format, formatINR, formatUSD, formatDual } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Causes' },
    { id: 'health', label: 'Health & Care' },
    { id: 'children', label: 'Children' },
    { id: 'heart', label: 'Heart & Medical' },
    { id: 'mental', label: 'Mental Health' },
    { id: 'ocean', label: 'Environment' },
  ];

  const filtered = charities.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      c.category.toLowerCase().includes(selectedCategory) ||
      (selectedCategory === 'health' && c.category.toLowerCase().includes('health')) ||
      (selectedCategory === 'children' && c.category.toLowerCase().includes('children')) ||
      (selectedCategory === 'heart' && (c.name.toLowerCase().includes('heart') || c.category.toLowerCase().includes('cardio'))) ||
      (selectedCategory === 'mental' && (c.name.toLowerCase().includes('mind') || c.name.toLowerCase().includes('mental'))) ||
      (selectedCategory === 'ocean' && (c.name.toLowerCase().includes('ocean') || c.category.toLowerCase().includes('conservation')));

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSwitchDesignatedCharity = async (charityId: string, charityName: string) => {
    try {
      await api.updateSubscriptionCharity(charityId);
      showToast('success', `Your designated subscription charity was updated to: ${charityName}`);
      onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update charity');
    }
  };

  const totalRaisedOverall = charities.reduce((sum, c) => sum + c.totalRaised, 0);

  return (
    <div id="charities-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-4 h-4 fill-rose-600" />
            <span>Accredited Partner Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display flex items-center flex-wrap gap-3">
            <span>Direct Charitable Giving</span>
            <span className="font-script text-rose-600 text-2xl font-bold -rotate-2 select-none">
              Every swing counts
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Every subscription contributes a minimum of 10% to your designated charity. Explore accredited partners, inspect upcoming golf day events, or make an independent donation.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Directed to Date</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-display">
              {format(totalRaisedOverall)}
            </div>
          </div>
          <button
            onClick={() => onOpenExplain('charity-model')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="How charity contributions are calculated"
          >
            <HelpCircle className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            id="charity-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search causes, regions..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Charity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((charity) => {
          const isUserCharity = currentUser?.subscription.selectedCharityId === charity.id;

          return (
            <div
              key={charity.id}
              id={`charity-card-${charity.id}`}
              className={`rounded-2xl border bg-white overflow-hidden flex flex-col justify-between transition-all group shadow-xs hover:shadow-md ${
                isUserCharity ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
              }`}
            >
              {/* Image & Category */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={charity.imageUrl}
                  alt={charity.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs">
                  {charity.category}
                </span>

                {isUserCharity && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Your Cause</span>
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display leading-tight group-hover:text-emerald-700 transition-colors">
                    {charity.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-2">
                    {charity.tagline}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 line-clamp-2">
                    <span className="font-bold text-rose-700">Impact: </span>
                    {charity.impactStatement}
                  </div>
                </div>

                {/* Metrics */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">
                      Directed
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {format(charity.totalRaised)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">
                      Supporters
                    </span>
                    <span className="text-slate-900 font-bold">{charity.supporterCount}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  id={`view-profile-${charity.id}-btn`}
                  onClick={() => onSelectCharity(charity)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold transition-colors shadow-xs"
                >
                  View Profile & Events
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`donate-direct-${charity.id}-btn`}
                    onClick={() => onOpenDonate(charity)}
                    title="Independent direct donation"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-rose-100" />
                  </button>

                  {isSubscriber && !isUserCharity && (
                    <button
                      id={`support-charity-${charity.id}-btn`}
                      onClick={() => handleSwitchDesignatedCharity(charity.id, charity.name)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors text-[11px] shadow-xs"
                    >
                      Support
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

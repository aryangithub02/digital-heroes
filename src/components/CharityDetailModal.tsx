/**
 * Digital Heroes — Charity Profile & Events Modal
 * Comprehensive profile view including mission, impact statements, tax registration,
 * and upcoming community/golf events.
 * Styled in light theme with £ currency.
 */

import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Charity } from '../types';
import { Calendar, CheckCircle2, Heart, MapPin, Share2, Tag, Trophy, Users, X } from 'lucide-react';

interface CharityDetailModalProps {
  charity: Charity | null;
  onClose: () => void;
  onSelectForSubscription?: (charityId: string) => void;
  onOpenDonate?: (charity: Charity) => void;
  isCurrentlySelected?: boolean;
}

export const CharityDetailModal: React.FC<CharityDetailModalProps> = ({
  charity,
  onClose,
  onSelectForSubscription,
  onOpenDonate,
  isCurrentlySelected,
}) => {
  const { format } = useCurrency();
  if (!charity) return null;

  return (
    <div
      id="charity-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="charity-detail-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full text-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-charity-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-700 hover:text-slate-900 rounded-full bg-white/80 hover:bg-white transition-colors backdrop-blur-xs shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero image */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-100">
          <img
            src={charity.imageUrl}
            alt={charity.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-800 backdrop-blur-xs mb-2 inline-block">
              {charity.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display leading-tight">
              {charity.name}
            </h2>
            <p className="text-xs text-slate-200 mt-1 font-medium">{charity.tagline}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Directed</div>
              <div className="text-base font-extrabold text-emerald-700 font-display mt-0.5">
                {format(charity.totalRaised)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Active Supporters</div>
              <div className="text-base font-extrabold text-slate-900 font-display mt-0.5">
                {charity.supporterCount} golfers
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Accreditation</div>
              <div className="text-[11px] font-mono text-slate-700 truncate mt-1">
                {charity.taxId}
              </div>
            </div>
          </div>

          {/* Impact Statement */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <Heart className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-800 uppercase tracking-wider text-[10px] mb-0.5">
                Impact Metric
              </div>
              <p className="leading-relaxed">{charity.impactStatement}</p>
            </div>
          </div>

          {/* Mission & Story */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display mb-1">Our Mission</h4>
              <p>{charity.mission}</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display mb-1">About the Cause</h4>
              <p>{charity.description}</p>
            </div>
          </div>

          {/* Upcoming Golf & Charity Events */}
          {charity.events && charity.events.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Upcoming Charity Golf Days & Community Events
              </h4>
              <div className="space-y-2">
                {charity.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{evt.title}</span>
                      <span className="text-emerald-700 font-mono text-[11px]">{evt.date}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3" />
                      <span>{evt.location}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pt-1">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onOpenDonate && onOpenDonate(charity)}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Direct One-Off Donation</span>
          </button>

          {onSelectForSubscription && (
            <button
              id={`select-charity-${charity.id}-btn`}
              onClick={() => onSelectForSubscription(charity.id)}
              disabled={isCurrentlySelected}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 ${
                isCurrentlySelected
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCurrentlySelected ? 'Currently Supported' : 'Support With My Subscription'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

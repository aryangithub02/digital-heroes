/**
 * Digital Heroes — Independent Donation Modal
 * Implements PRD requirement: "Independent donation option, not tied to gameplay."
 * Styled in light theme with dual INR and USD currency support.
 */

import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Charity } from '../types';
import { AlertCircle, CheckCircle2, Heart, ShieldCheck, X } from 'lucide-react';

interface DirectDonationModalProps {
  charity: Charity | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DirectDonationModal: React.FC<DirectDonationModalProps> = ({
  charity,
  onClose,
  onSuccess,
}) => {
  const { currentUser, showToast } = useAuth();
  const { format } = useCurrency();
  const [amount, setAmount] = useState<number>(1000);
  const [donorName, setDonorName] = useState<string>(currentUser?.name || '');
  const [donorEmail, setDonorEmail] = useState<string>(currentUser?.email || '');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!charity) return null;

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donorEmail.trim()) {
      setErrorMsg('Please provide your name and email for 80G tax receipt.');
      return;
    }
    if (!amount || amount < 100) {
      setErrorMsg('Minimum direct donation is ₹100 ($1.20).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.donateToCharity(charity.id, {
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amount,
        message: message.trim(),
      });
      showToast('success', `Thank you! Your donation of ${format(amount)} to ${charity.name} was recorded.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Donation transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="donation-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="donation-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-donation-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Direct Charity Donation</h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">
              Supporting: <span className="text-rose-700 font-semibold">{charity.name}</span>
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Independent Giving: 100% of this donation directly reaches the charity. Not tied to gameplay or draws.</span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick amount buttons */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Select Donation Amount
              </label>
              <span className="text-[11px] text-slate-500">
                ≈ ${(amount / 83).toFixed(2)} USD
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-colors ${
                    amount === q
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{q >= 1000 ? `${q / 1000}k` : q}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-slate-400 font-bold">₹</span>
              <input
                id="custom-donation-amount-input"
                type="number"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2 text-slate-900 font-bold text-base focus:outline-hidden focus:border-rose-600 focus:bg-white transition-colors"
                placeholder="Custom INR Amount"
              />
            </div>
          </div>

          <div>
            <label htmlFor="donor-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Donor Full Name *
            </label>
            <input
              id="donor-name-input"
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              placeholder="e.g. Alex Henderson"
            />
          </div>

          <div>
            <label htmlFor="donor-email-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email for 80G / Tax Exemption Receipt *
            </label>
            <input
              id="donor-email-input"
              type="email"
              required
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label htmlFor="donor-message-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Message of Encouragement (Optional)
            </label>
            <textarea
              id="donor-message-input"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              placeholder="Keep up the vital work!"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              id="confirm-donation-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Heart className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : `Donate ${format(amount)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Digital Heroes — Winner Proof Upload Modal
 * Allows prize winners to upload golf platform scorecard screenshots to verify their round dates and scores.
 * Styled in light theme with £ currency.
 */

import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { WinnerRecord } from '../types';
import { AlertCircle, CheckCircle2, FileText, Image as ImageIcon, ShieldAlert, UploadCloud, X } from 'lucide-react';

interface ProofUploadModalProps {
  winnerRecord: WinnerRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProofUploadModal: React.FC<ProofUploadModalProps> = ({
  winnerRecord,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useAuth();
  const { format } = useCurrency();
  const [proofUrl, setProofUrl] = useState<string>(
    winnerRecord?.proofImageUrl ||
      'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80'
  );
  const [notes, setNotes] = useState<string>(winnerRecord?.proofNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!winnerRecord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim()) {
      setErrorMsg('Please provide a valid scorecard proof image URL.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.submitVerificationProof(winnerRecord.id, {
        proofImageUrl: proofUrl.trim(),
        notes: notes.trim(),
      });
      showToast('success', 'Scorecard proof submitted! Administrator compliance review is now pending.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit verification proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="proof-upload-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="proof-upload-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-proof-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Upload Winner Scorecard Verification
            </h3>
            <p className="text-xs text-slate-500">
              Prize: {format(winnerRecord.prizeAmount)} · {winnerRecord.matchCount}-Number Match ({winnerRecord.drawName})
            </p>
          </div>
        </div>

        {winnerRecord.verificationStatus === 'rejected' && winnerRecord.rejectionReason && (
          <div
            id="previous-rejection-notice"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800"
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Previous Submission Declined
            </div>
            <p className="text-slate-700">{winnerRecord.rejectionReason}</p>
            <p className="text-[11px] text-rose-700 mt-1">
              Please submit a clearer official scorecard screenshot matching the dates entered.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Matched scores explanation */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
          <div className="font-semibold text-slate-700 mb-1.5">Submitted Scores Being Verified:</div>
          <div className="flex flex-wrap gap-1.5 font-mono">
            {winnerRecord.userScoresAtDraw.map((s, i) => {
              const isMatch = winnerRecord.matchedNumbers.includes(s);
              return (
                <span
                  key={i}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                    isMatch
                      ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                  title={isMatch ? 'Winning match number' : 'Non-matching score'}
                >
                  {s} pts {isMatch && '★'}
                </span>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proof-image-url-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Scorecard Screenshot Image URL *
            </label>
            <div className="relative">
              <input
                id="proof-image-url-input"
                type="url"
                required
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://... or upload link"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-mono focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Provide a screenshot from GHIN, Golf Australia, Club V1, or official club card.
            </span>
          </div>

          {/* Image Preview */}
          {proofUrl && (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-600 mb-1.5 font-medium flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Proof Preview:
              </div>
              <img
                src={proofUrl}
                alt="Scorecard proof"
                className="w-full h-36 object-cover rounded-lg border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>
          )}

          <div>
            <label htmlFor="proof-notes-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supporting Notes for Administrator Review (Optional)
            </label>
            <textarea
              id="proof-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Attached Club V1 export matching round dates 2026-08-02 through 2026-08-29."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
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
              id="submit-proof-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

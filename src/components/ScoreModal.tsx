/**
 * Digital Heroes — Score Entry & Edit Modal
 * Strictly implements the rolling-five-score logic, Stableford 1-45 range,
 * unique date enforcement, and live rolling-window visual preview.
 * Styled with light theme.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { GolfScore } from '../types';
import { SCORE_RULES, validateScoreDate, validateStablefordScore } from '../services/businessLogic';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, ChevronRight, Info, Layers, X } from 'lucide-react';

interface ScoreModalProps {
  isOpen: boolean;
  scoreToEdit?: GolfScore | null;
  existingScores: GolfScore[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  scoreToEdit,
  existingScores,
  onClose,
  onSuccess,
}) => {
  const { currentUser, showToast } = useAuth();

  const [scoreInput, setScoreInput] = useState<string>('36');
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courseInput, setCourseInput] = useState<string>('');
  const [holesInput, setHolesInput] = useState<9 | 18>(18);
  const [handicapApplied, setHandicapApplied] = useState<number>(14);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (scoreToEdit) {
      setScoreInput(String(scoreToEdit.score));
      setDateInput(scoreToEdit.date);
      setCourseInput(scoreToEdit.course);
      setHolesInput(scoreToEdit.holes);
      setHandicapApplied(scoreToEdit.handicapApplied || Math.round(currentUser?.handicapIndex || 14));
    } else {
      setScoreInput('35');
      const today = new Date().toISOString().split('T')[0];
      const hasToday = existingScores.some((s) => s.date === today);
      if (hasToday) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        setDateInput(d.toISOString().split('T')[0]);
      } else {
        setDateInput(today);
      }
      setCourseInput(currentUser?.homeClub || 'Wentworth Club');
      setHolesInput(18);
      setHandicapApplied(Math.round(currentUser?.handicapIndex || 14));
    }
    setErrorMsg(null);
  }, [scoreToEdit, isOpen, currentUser, existingScores]);

  if (!isOpen) return null;

  const numScore = parseInt(scoreInput, 10);
  const isEditing = !!scoreToEdit;

  // Calculate live preview of the 5-score rolling window
  const computePreview = () => {
    if (isNaN(numScore) || numScore < 1 || numScore > 45 || !dateInput) {
      return null;
    }

    const tempScores = existingScores
      .filter((s) => !isEditing || s.id !== scoreToEdit?.id)
      .map((s) => ({ ...s }));

    const dummyScore: GolfScore = {
      id: 'preview',
      userId: currentUser?.id || '',
      date: dateInput,
      score: numScore,
      course: courseInput,
      holes: holesInput,
      createdAt: new Date().toISOString(),
    };

    const combined = [...tempScores, dummyScore].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const willDropOldest = combined.length > SCORE_RULES.MAX_ROLLING_SCORES;
    const dropped = willDropOldest ? combined[SCORE_RULES.MAX_ROLLING_SCORES] : undefined;
    const retained = combined.slice(0, SCORE_RULES.MAX_ROLLING_SCORES);

    return { retained, dropped, willDropOldest };
  };

  const preview = computePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const scoreValidation = validateStablefordScore(numScore);
    if (!scoreValidation.valid) {
      setErrorMsg(scoreValidation.error || 'Invalid Stableford score.');
      return;
    }

    const dateValidation = validateScoreDate(
      dateInput,
      existingScores,
      isEditing ? scoreToEdit?.id : undefined
    );
    if (!dateValidation.valid) {
      setErrorMsg(dateValidation.error || 'Invalid score date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && scoreToEdit) {
        await api.updateScore(scoreToEdit.id, {
          score: numScore,
          date: dateInput,
          course: courseInput,
          holes: holesInput,
        });
        showToast('success', `Score updated to ${numScore} pts for ${dateInput}.`);
      } else {
        const res = await api.addScore({
          score: numScore,
          date: dateInput,
          course: courseInput,
          holes: holesInput,
          handicapApplied,
        });

        if (res.droppedScore) {
          showToast(
            'info',
            `Score logged (${numScore} pts). Oldest score (${res.droppedScore.score} pts on ${res.droppedScore.date}) rolled off your 5-score window.`
          );
        } else {
          showToast('success', `Score of ${numScore} pts logged successfully!`);
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save score.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="score-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="score-modal-content"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-score-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {isEditing ? 'Edit Stableford Round' : 'Log New Stableford Score'}
            </h3>
            <p className="text-xs text-slate-500">
              Valid range: 1–45 points · Exactly one score per calendar date
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            id="score-error-alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Validation Error</span>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Score Input */}
            <div>
              <label htmlFor="score-points-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stableford Points (1–45) *
              </label>
              <div className="relative">
                <input
                  id="score-points-input"
                  type="number"
                  min="1"
                  max="45"
                  required
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
                  placeholder="e.g. 36"
                />
                <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium pointer-events-none">
                  pts
                </span>
              </div>
            </div>

            {/* Date Input */}
            <div>
              <label htmlFor="score-date-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Round Date *
              </label>
              <div className="relative">
                <input
                  id="score-date-input"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Course Name */}
          <div>
            <label htmlFor="score-course-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Golf Course / Club Name
            </label>
            <input
              id="score-course-input"
              type="text"
              value={courseInput}
              onChange={(e) => setCourseInput(e.target.value)}
              placeholder="e.g. Wentworth Club"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Holes */}
            <div>
              <label htmlFor="score-holes-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Holes Played
              </label>
              <select
                id="score-holes-select"
                value={holesInput}
                onChange={(e) => setHolesInput(Number(e.target.value) as 9 | 18)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
              >
                <option value={18}>18 Holes (Full Round)</option>
                <option value={9}>9 Holes (Adjusted)</option>
              </select>
            </div>

            {/* Daily Handicap */}
            <div>
              <label htmlFor="score-handicap-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Playing Handicap Applied
              </label>
              <input
                id="score-handicap-input"
                type="number"
                value={handicapApplied}
                onChange={(e) => setHandicapApplied(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Rolling Window Live Preview */}
          {preview && !isEditing && (
            <div
              id="rolling-window-live-preview"
              className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  Rolling 5-Score Window Impact:
                </span>
                <span className="text-[11px] text-slate-500">
                  {preview.willDropOldest ? 'Window is full (5/5)' : `Adding score ${preview.retained.length}/5`}
                </span>
              </div>

              {preview.willDropOldest && preview.dropped && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 mb-2 flex items-center justify-between">
                  <span>Oldest score dropping off:</span>
                  <span className="font-mono font-bold">
                    {preview.dropped.score} pts ({preview.dropped.date})
                  </span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 mb-1.5">Active Draw Window After Save:</div>
              <div className="flex items-center gap-1.5 font-mono">
                {preview.retained.map((item, idx) => {
                  const isNew = item.date === dateInput && item.score === numScore;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 py-1 px-1.5 rounded text-center border text-xs font-bold transition-all ${
                        isNew
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                      title={`${item.score} pts on ${item.date}`}
                    >
                      {item.score}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-score-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Round' : 'Submit Round Score'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

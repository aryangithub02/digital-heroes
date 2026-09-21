/**
 * Digital Heroes — Role & Evaluation Persona Switcher
 * Provides frictionless testing for evaluators across all three roles and edge states.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Check, ChevronDown, RotateCcw, Shield, Trophy, User, UserCheck, UserX } from 'lucide-react';

export const RoleDemoBanner: React.FC = () => {
  const { activePersonaId, switchPersona, currentUser, showToast } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const personas = [
    {
      id: 'visitor',
      name: 'Public Visitor',
      badge: 'Anonymous',
      role: 'Role 1: Public Visitor',
      desc: 'Browsing concept, charities, draw transparency & pricing',
      icon: User,
      color: 'bg-slate-700 text-slate-200 border-slate-600',
    },
    {
      id: 'user-liam',
      name: 'Liam Vance',
      badge: 'Active Subscriber',
      role: 'Role 2: Subscriber',
      desc: 'Active monthly plan, 5 rolling scores, Ocean Legacy (15%)',
      icon: UserCheck,
      color: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    },
    {
      id: 'user-sarah',
      name: 'Sarah Jenkins',
      badge: 'Winner (4-Match)',
      role: 'Role 2: Winner Flow',
      desc: 'Won ₹17,500 ($210) in August Draw. Tests scorecard proof verification',
      icon: Trophy,
      color: 'bg-amber-950 text-amber-300 border-amber-700',
    },
    {
      id: 'user-david',
      name: 'David Kim',
      badge: 'Lapsed Sub',
      role: 'Role 2: Lapsed State',
      desc: 'Expired subscription. Tests restricted access & renewal prompts',
      icon: UserX,
      color: 'bg-rose-950 text-rose-300 border-rose-700',
    },
    {
      id: 'user-admin',
      name: 'Marcus Vance',
      badge: 'Administrator',
      role: 'Role 3: Administrator',
      desc: 'Draw simulations, publishing, verification reviews, payouts, analytics',
      icon: Shield,
      color: 'bg-indigo-950 text-indigo-300 border-indigo-700',
    },
  ];

  const currentPersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo data back to initial clean state?')) return;
    setIsResetting(true);
    try {
      await api.resetDemo();
      showToast('success', 'Database reset to initial demo state.');
      window.location.reload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      id="evaluator-demo-bar"
      className="bg-slate-950 border-b border-slate-800 text-xs px-3 py-1.5 sticky top-0 z-50 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Evaluator Mode:
          </span>
          <span className="text-slate-300 hidden sm:inline">Active Persona:</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium shadow-xs border-slate-700 bg-slate-900 text-slate-200">
            <currentPersona.icon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{currentPersona.name}</span>
            <span className="text-slate-400 text-[10px]">({currentPersona.badge})</span>
          </div>
        </div>

        {/* Persona quick buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-slate-500 text-[11px] mr-1 hidden md:inline">Switch To:</span>
          {personas.map((p) => {
            const isActive = activePersonaId === p.id;
            return (
              <button
                key={p.id}
                id={`persona-btn-${p.id}`}
                onClick={() => switchPersona(p.id)}
                title={p.desc}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  isActive
                    ? `${p.color} border shadow-xs`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <p.icon className="w-3 h-3" />
                <span>{p.name.split(' ')[0]}</span>
                {isActive && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          <button
            id="reset-demo-data-btn"
            onClick={handleResetDemo}
            disabled={isResetting}
            title="Reset database to initial seeded cohort"
            className="ml-2 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-800"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Reset Seed</span>
          </button>
        </div>
      </div>
    </div>
  );
};

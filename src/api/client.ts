/**
 * Digital Heroes — API Client
 */

import {
  AuditLogEntry,
  Charity,
  DashboardData,
  Draw,
  DrawMethod,
  DrawSimulationResult,
  GolfScore,
  IndependentDonation,
  SubscriptionPlan,
  SystemAnalytics,
  SystemConfig,
  UserProfile,
  WinnerRecord,
} from '../types';

const SESSION_STORAGE_KEY = 'dh_session_user_id';

let currentPersonaId = typeof window !== 'undefined' ? (localStorage.getItem(SESSION_STORAGE_KEY) || 'visitor') : 'visitor';

export function setActivePersonaId(id: string) {
  currentPersonaId = id;
  if (typeof window !== 'undefined') {
    if (id && id !== 'visitor') {
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}

export function getActivePersonaId(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) return stored;
  }
  return currentPersonaId;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const activeId = getActivePersonaId();
  headers.set('x-user-id', activeId);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth & Session
  async getMe(): Promise<{ user: UserProfile | null; isVisitor: boolean; activePersonaId: string }> {
    return request('/api/auth/me');
  },

  async switchPersona(userId: string): Promise<{ success: boolean; activePersonaId: string; user: UserProfile | null }> {
    setActivePersonaId(userId);
    return request('/api/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async login(email: string, password: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await request<{ success: boolean; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.user) {
      setActivePersonaId(res.user.id);
    }
    return res;
  },

  async signup(data: any): Promise<{ success: boolean; user: UserProfile }> {
    const res = await request<{ success: boolean; user: UserProfile }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.user) {
      setActivePersonaId(res.user.id);
    }
    return res;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    setActivePersonaId('visitor');
    return request('/api/auth/logout', {
      method: 'POST',
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  // Subscription Plans & Config
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return request('/api/subscription-plans');
  },

  async getSubscriptionPlansAdmin(): Promise<SubscriptionPlan[]> {
    return request('/api/subscription-plans/admin');
  },

  async createSubscriptionPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return request('/api/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return request(`/api/subscription-plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getConfig(): Promise<SystemConfig> {
    return request('/api/config');
  },

  async updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    return request('/api/config', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Users & Profiles
  async getUsers(): Promise<UserProfile[]> {
    return request('/api/users');
  },

  async getUser(id: string): Promise<UserProfile> {
    return request(`/api/users/${id}`);
  },

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return request(`/api/users/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async updateSubscription(
    id: string,
    updates: Partial<UserProfile['subscription']>
  ): Promise<UserProfile> {
    return request(`/api/users/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Unified User Dashboard
  async getDashboard(): Promise<DashboardData> {
    return request('/api/dashboard/me');
  },

  // Golf Scores
  async getScores(userId?: string): Promise<GolfScore[]> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request(`/api/scores${q}`);
  },

  async addScore(scoreData: {
    score: number;
    date: string;
    course?: string;
    holes?: 9 | 18;
    handicapApplied?: number;
  }): Promise<{ score: GolfScore; retainedScores: GolfScore[]; droppedScore?: GolfScore }> {
    return request('/api/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    });
  },

  async updateScore(
    scoreId: string,
    updates: { score?: number; date?: string; course?: string; holes?: 9 | 18 }
  ): Promise<GolfScore> {
    return request(`/api/scores/${scoreId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteScore(scoreId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/scores/${scoreId}`, {
      method: 'DELETE',
    });
  },

  // Charities & Donations
  async getCharities(): Promise<Charity[]> {
    return request('/api/charities');
  },

  async getAllCharitiesAdmin(): Promise<Charity[]> {
    return request('/api/charities/admin');
  },

  async getCharity(id: string): Promise<Charity> {
    return request(`/api/charities/${id}`);
  },

  async createCharity(
    charityData: Omit<Charity, 'id' | 'totalRaised' | 'supporterCount'>
  ): Promise<Charity> {
    return request('/api/charities', {
      method: 'POST',
      body: JSON.stringify(charityData),
    });
  },

  async updateCharity(id: string, updates: Partial<Charity>): Promise<Charity> {
    return request(`/api/charities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteCharity(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/charities/${id}`, {
      method: 'DELETE',
    });
  },

  async donateToCharity(
    id: string,
    data: { donorName: string; donorEmail: string; amount: number; message?: string }
  ): Promise<IndependentDonation> {
    return request(`/api/charities/${id}/donate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Draws & Simulation
  async getDraws(): Promise<Draw[]> {
    return request('/api/draws');
  },

  async getCurrentDraw(): Promise<Draw> {
    return request('/api/draws/current');
  },

  async getDraw(id: string): Promise<Draw> {
    return request(`/api/draws/${id}`);
  },

  async createDraw(drawData: {
    id?: string;
    name: string;
    monthYear: string;
    drawDate: string;
    drawMethod?: DrawMethod;
    drawMethodRationale?: string;
  }): Promise<Draw> {
    return request('/api/draws', {
      method: 'POST',
      body: JSON.stringify(drawData),
    });
  },

  async simulateDraw(drawId: string, drawMethod?: DrawMethod): Promise<DrawSimulationResult> {
    return request(`/api/draws/${drawId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ drawMethod }),
    });
  },

  async publishDraw(
    drawId: string,
    simulationResult: DrawSimulationResult
  ): Promise<{ draw: Draw; newWinnersCount: number }> {
    return request(`/api/draws/${drawId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ simulationResult }),
    });
  },

  // Winners, Verification & Payouts
  async getWinners(userId?: string): Promise<WinnerRecord[]> {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request(`/api/winners${q}`);
  },

  async getAllWinners(): Promise<{ winners: WinnerRecord[] }> {
    const winners = await request<WinnerRecord[]>('/api/winners');
    return { winners };
  },

  async getMyWinnings(): Promise<{ winnings: WinnerRecord[] }> {
    const winners = await request<WinnerRecord[]>('/api/winners');
    return { winnings: winners };
  },

  async getMyScores(): Promise<{ scores: GolfScore[] }> {
    const scores = await request<GolfScore[]>('/api/scores');
    return { scores };
  },

  async updateSubscriptionCharity(
    selectedCharityId?: string,
    charityContributionPct?: number
  ): Promise<UserProfile> {
    const updates: any = {};
    if (selectedCharityId) updates.selectedCharityId = selectedCharityId;
    if (charityContributionPct !== undefined) updates.charityContributionPct = charityContributionPct;
    return request(`/api/users/${currentPersonaId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async updateSubscriptionStatus(status: 'active' | 'inactive' | 'lapsed' | 'cancelled'): Promise<UserProfile> {
    return request(`/api/users/${currentPersonaId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getWinner(id: string): Promise<WinnerRecord> {
    return request(`/api/winners/${id}`);
  },

  async submitVerificationProof(
    winnerId: string,
    data: { proofImageUrl: string; notes?: string }
  ): Promise<WinnerRecord> {
    return request(`/api/winners/${winnerId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewVerification(
    winnerId: string,
    data: { decision: 'approve' | 'reject'; notes?: string; rejectionReason?: string }
  ): Promise<WinnerRecord> {
    return request(`/api/winners/${winnerId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyWinner(
    winnerId: string,
    options: { approved: boolean; adminNotes?: string; rejectionReason?: string }
  ): Promise<WinnerRecord> {
    return request(`/api/winners/${winnerId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        decision: options.approved ? 'approve' : 'reject',
        notes: options.adminNotes,
        rejectionReason: options.rejectionReason,
      }),
    });
  },

  async markPayoutPaid(winnerId: string, paymentReference: string): Promise<WinnerRecord> {
    return request(`/api/winners/${winnerId}/payout`, {
      method: 'POST',
      body: JSON.stringify({ paymentReference }),
    });
  },

  // Analytics & Audit
  async getAnalytics(): Promise<SystemAnalytics> {
    return request('/api/analytics');
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return request('/api/audit-logs');
  },

  async resetDemo(): Promise<{ success: boolean; message: string }> {
    return request('/api/system/reset-demo', {
      method: 'POST',
    });
  },
};

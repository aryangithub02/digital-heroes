/**
 * Digital Heroes — Core TypeScript Types & Enums
 * Source of Truth: Digital Heroes PRD (Level 1, 2026)
 */

export type UserRole = 'visitor' | 'subscriber' | 'admin';

export type SubscriptionPlanType = 'monthly' | 'yearly' | 'none';

export type SubscriptionStatus = 'active' | 'inactive' | 'lapsed' | 'cancelled';

export interface SubscriptionPlan {
  id: string; // e.g. 'plan-monthly', 'plan-yearly'
  name: string; // e.g. 'Monthly Hero Membership'
  code: SubscriptionPlanType; // 'monthly' | 'yearly'
  billingInterval: 'month' | 'year';
  priceINR: number; // e.g. 999 or 9990
  priceUSD: number; // e.g. 12 or 120
  prizePoolAllocationPct: number; // e.g. 40
  minCharityPct: number; // e.g. 10
  defaultCharityPct: number; // e.g. 15
  description: string;
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  plan: SubscriptionPlanType;
  planId?: string;
  status: SubscriptionStatus;
  price: number; // in INR
  billingInterval: 'month' | 'year';
  startDate: string;
  renewalDate: string;
  cancelledAt?: string;
  charityContributionPct: number; // minimum 10%, default 15%
  selectedCharityId: string;
  autoRenew: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  passwordSalt?: string;
  handicapIndex: number;
  homeClub: string;
  ghinOrMemberId: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  subscription: UserSubscription;
}

export interface GolfScore {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD, unique per user
  score: number; // Stableford format: 1 to 45
  course: string;
  holes: 9 | 18;
  handicapApplied?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CharityEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface Charity {
  id: string;
  name: string;
  category: 'wildlife' | 'youth' | 'veterans' | 'healthcare' | 'environment' | 'education' | 'community';
  tagline: string;
  description: string;
  mission: string;
  imageUrl: string;
  impactStatement: string;
  totalRaised: number;
  supporterCount: number;
  featured: boolean;
  active: boolean;
  taxId: string;
  events: CharityEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IndependentDonation {
  id: string;
  userId?: string;
  donorName: string;
  donorEmail: string;
  charityId: string;
  charityName: string;
  amount: number;
  date: string;
  message?: string;
}

export type DrawMethod = 'random' | 'algorithmic';

export type DrawStatus = 'upcoming' | 'open' | 'simulated' | 'published' | 'completed';

export interface DrawConfiguration {
  drawMethod: DrawMethod;
  rationaleDescription: string;
  prizePoolAllocationPct: number;
  tierPercentages: {
    tier5: number; // 40%
    tier4: number; // 35%
    tier3: number; // 25%
  };
}

export interface DrawParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  retainedScores: number[];
  retainedScoreDates: string[];
  eligible: boolean;
}

export interface TierPrizeDetail {
  matchCount: 3 | 4 | 5;
  poolSharePct: number; // 40%, 35%, 25%
  allocatedPool: number;
  winnerCount: number;
  perWinnerPrize: number;
  isJackpot: boolean;
  rolledOver: boolean;
  rolloverAmount: number;
}

export interface DrawTierBreakdown {
  tier5: TierPrizeDetail;
  tier4: TierPrizeDetail;
  tier3: TierPrizeDetail;
}

export interface Draw {
  id: string; // e.g. DRW-2026-09
  name: string;
  monthYear: string; // "2026-09"
  drawDate: string; // "2026-09-30"
  status: DrawStatus;
  drawMethod: DrawMethod;
  drawMethodRationale: string;
  eligibleSubscribersCount: number;
  activeSubscribersBase: number;
  subscriptionRevenue: number;
  prizePoolAllocationPct: number; // default 40%
  basePrizePool: number;
  rolloverFromPrevious: number;
  totalPrizePool: number;
  winningNumbers: number[]; // 5 distinct numbers between 1 and 45
  tierBreakdown: DrawTierBreakdown;
  publishedAt?: string;
  publishedBy?: string;
}

export type VerificationStatus =
  | 'not_required'
  | 'required'
  | 'submitted'
  | 'approved'
  | 'rejected';

export type PaymentStatus = 'pending' | 'processing' | 'paid';

export interface WinnerRecord {
  id: string;
  drawId: string;
  drawName: string;
  userId: string;
  userName: string;
  userEmail: string;
  matchCount: 3 | 4 | 5;
  matchedNumbers: number[];
  userScoresAtDraw: number[];
  winningNumbers: number[];
  prizeAmount: number;
  verificationStatus: VerificationStatus;
  proofImageUrl?: string;
  proofSubmittedAt?: string;
  proofNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paidAt?: string;
}

export interface DrawSimulationResult {
  drawId: string;
  drawName: string;
  drawDate: string;
  drawMethod: DrawMethod;
  drawMethodRationale: string;
  eligibleSubscribersCount: number;
  totalPrizePool: number;
  basePrizePool: number;
  rolloverFromPrevious: number;
  winningNumbers: number[];
  tierBreakdown: DrawTierBreakdown;
  winners: {
    tier5: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }>;
    tier4: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }>;
    tier3: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }>;
  };
  totalWinnersCount: number;
  simulatedAt: string;
}

export interface SystemConfig {
  prizePoolAllocationPct: number; // e.g. 40
  monthlyPlanPrice: number; // e.g. 999
  yearlyPlanPrice: number; // e.g. 9990
  currentRolloverJackpot: number;
  defaultDrawMethod: DrawMethod;
  minCharityPct: number; // 10
  defaultCharityPct: number; // 15
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
  resultId?: string;
}

export interface SystemAnalytics {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePoolDistributed: number;
  currentRolloverJackpot: number;
  totalCharityContributed: number;
  pendingVerifications: number;
  pendingPayouts: number;
  drawStats: {
    totalDrawsConducted: number;
    totalWinnersAwarded: number;
    averageParticipantPerDraw: number;
  };
}

export interface DashboardData {
  user: UserProfile;
  subscription: UserSubscription;
  plan?: SubscriptionPlan;
  scores: GolfScore[];
  selectedCharity: Charity | null;
  upcomingDraw: Draw | null;
  winnings: WinnerRecord[];
  eligibility: {
    isEligible: boolean;
    scoreCount: number;
    hasFullWindow: boolean;
    reasons: string[];
  };
}

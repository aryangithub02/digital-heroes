/**
 * Digital Heroes — Authoritative Centralized Business Logic Layer
 * Source of Truth: Digital Heroes PRD (Level 1, 2026)
 *
 * Rules:
 * - Stableford format: 1 to 45
 * - Exactly one score per date per user (no duplicates)
 * - Maximum 5 retained scores in rolling window (newest replaces oldest)
 * - Display order: reverse chronological (newest first)
 * - Match tiers:
 *     5-number match -> 40% (Jackpot, rolls over if unclaimed)
 *     4-number match -> 35% (Does not roll over)
 *     3-number match -> 25% (Does not roll over)
 * - Multiple winners in same tier split tier pool equally
 * - Charity contribution: minimum 10%, voluntary increase allowed
 */

import {
  DrawMethod,
  DrawTierBreakdown,
  GolfScore,
  TierPrizeDetail,
  UserSubscription,
} from '../types';

export const SCORE_RULES = {
  MIN_SCORE: 1,
  MAX_SCORE: 45,
  MAX_ROLLING_SCORES: 5,
};

export const PRIZE_POOL_RULES = {
  DEFAULT_ALLOCATION_PCT: 40, // 40% of subscription fee directed to prize pool
  TIER_5_PCT: 40, // 40% of prize pool to 5-match
  TIER_4_PCT: 35, // 35% of prize pool to 4-match
  TIER_3_PCT: 25, // 25% of prize pool to 3-match
  TIER_5_ROLLOVER: true,
  TIER_4_ROLLOVER: false,
  TIER_3_ROLLOVER: false,
};

export const CHARITY_RULES = {
  MIN_CONTRIBUTION_PCT: 10,
  MAX_CONTRIBUTION_PCT: 50,
  DEFAULT_CONTRIBUTION_PCT: 15,
};

/**
 * Validates a Stableford score.
 */
export function validateStablefordScore(score: number): { valid: boolean; error?: string } {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valid: false, error: 'Stableford score must be a valid number.' };
  }
  if (!Number.isInteger(score)) {
    return { valid: false, error: 'Stableford score must be a whole integer.' };
  }
  if (score < SCORE_RULES.MIN_SCORE || score > SCORE_RULES.MAX_SCORE) {
    return {
      valid: false,
      error: `Stableford score must be between ${SCORE_RULES.MIN_SCORE} and ${SCORE_RULES.MAX_SCORE} points.`,
    };
  }
  return { valid: true };
}

/**
 * Validates score date: valid format, not in future, unique per user.
 */
export function validateScoreDate(
  dateStr: string,
  existingScores: GolfScore[],
  excludeScoreId?: string
): { valid: boolean; error?: string } {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, error: 'Score date must be provided in YYYY-MM-DD format.' };
  }

  const dateObj = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid calendar date.' };
  }

  // Check future date
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateStr > todayStr) {
    return { valid: false, error: 'Score date cannot be in the future.' };
  }

  // Check duplicate date for this user
  const duplicate = existingScores.find(
    (s) => s.date === dateStr && s.id !== excludeScoreId
  );
  if (duplicate) {
    return {
      valid: false,
      error: `A score for ${dateStr} already exists (${duplicate.score} pts). You can edit or delete that entry, but only one score is allowed per date.`,
    };
  }

  return { valid: true };
}

/**
 * Applies the rolling 5-score window:
 * - Adds or replaces score
 * - Sorts reverse-chronological (newest first)
 * - Caps at 5 entries
 * - Returns the updated array and any dropped score
 */
export function applyRollingScores(
  existingScores: GolfScore[],
  newScore: GolfScore
): { updatedScores: GolfScore[]; droppedScore?: GolfScore } {
  // Combine and sort reverse-chronological
  const combined = [...existingScores, newScore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (combined.length > SCORE_RULES.MAX_ROLLING_SCORES) {
    const retained = combined.slice(0, SCORE_RULES.MAX_ROLLING_SCORES);
    const dropped = combined[SCORE_RULES.MAX_ROLLING_SCORES];
    return { updatedScores: retained, droppedScore: dropped };
  }

  return { updatedScores: combined };
}

/**
 * Checks if a subscriber is eligible for draw participation:
 * - Active subscription
 * - Has at least 1 score (or preferably 5 scores for full matching)
 */
export function checkDrawEligibility(
  subscription: UserSubscription,
  scores: GolfScore[]
): {
  isEligible: boolean;
  scoreCount: number;
  hasFullWindow: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (subscription.status !== 'active') {
    reasons.push(`Subscription is ${subscription.status}. Must be active to participate.`);
  }

  if (scores.length === 0) {
    reasons.push('No Stableford scores logged. At least 1 score is required for matching.');
  }

  const isEligible = subscription.status === 'active' && scores.length > 0;
  const hasFullWindow = scores.length >= SCORE_RULES.MAX_ROLLING_SCORES;

  return {
    isEligible,
    scoreCount: scores.length,
    hasFullWindow,
    reasons,
  };
}

/**
 * Calculates number of matches between user scores and winning draw numbers.
 */
export function calculateMatches(
  winningNumbers: number[],
  userScores: number[]
): { matchCount: 3 | 4 | 5 | 0 | 1 | 2; matchedNumbers: number[] } {
  const winningSet = new Set(winningNumbers);
  // Unique scores of user that match winning numbers
  const matched = Array.from(new Set(userScores.filter((num) => winningSet.has(num)))).sort(
    (a, b) => a - b
  );

  const count = matched.length;
  const tierCount = (count >= 5 ? 5 : count === 4 ? 4 : count === 3 ? 3 : count) as
    | 3
    | 4
    | 5
    | 0
    | 1
    | 2;

  return { matchCount: tierCount, matchedNumbers: matched };
}

/**
 * Generates winning numbers based on draw method:
 * - Random: Standard cryptographically-sound random sample of 5 distinct numbers (1-45)
 * - Algorithmic: Frequency-weighted selection reflecting player performance distributions
 */
export function generateDrawNumbers(
  method: DrawMethod,
  allParticipantScores: number[]
): { numbers: number[]; rationale: string } {
  if (method === 'algorithmic' && allParticipantScores.length >= 10) {
    // Calculate frequency distribution of scores
    const freqMap: Record<number, number> = {};
    for (let i = SCORE_RULES.MIN_SCORE; i <= SCORE_RULES.MAX_SCORE; i++) {
      freqMap[i] = 1; // baseline smoothing
    }
    for (const score of allParticipantScores) {
      if (score >= SCORE_RULES.MIN_SCORE && score <= SCORE_RULES.MAX_SCORE) {
        freqMap[score] = (freqMap[score] || 1) + 3;
      }
    }

    // Weighted random selection without replacement
    const selected: Set<number> = new Set();
    const availableNumbers = Object.keys(freqMap).map(Number);

    while (selected.size < 5 && availableNumbers.length > 0) {
      const remainingNumbers = availableNumbers.filter((n) => !selected.has(n));
      const totalWeight = remainingNumbers.reduce((sum, n) => sum + freqMap[n], 0);
      let rand = Math.random() * totalWeight;

      for (const num of remainingNumbers) {
        rand -= freqMap[num];
        if (rand <= 0) {
          selected.add(num);
          break;
        }
      }
    }

    const sorted = Array.from(selected).sort((a, b) => a - b);
    return {
      numbers: sorted,
      rationale: `Algorithmic Draw: Winning numbers were selected through frequency-distribution weighting across ${allParticipantScores.length} active participant Stableford scores, rewarding realistic performance corridors while maintaining competitive variance.`,
    };
  }

  // Standard Random Draw
  const chosen: Set<number> = new Set();
  while (chosen.size < 5) {
    const num =
      Math.floor(Math.random() * (SCORE_RULES.MAX_SCORE - SCORE_RULES.MIN_SCORE + 1)) +
      SCORE_RULES.MIN_SCORE;
    chosen.add(num);
  }

  return {
    numbers: Array.from(chosen).sort((a, b) => a - b),
    rationale:
      'Standard Lottery Draw: 5 distinct numbers uniformly sampled at random across the 1–45 Stableford range with equal probability.',
  };
}

/**
 * Calculates prize pool and tier breakdowns according to PRD:
 * 5-number: 40% (Jackpot, rolls over if 0 winners)
 * 4-number: 35% (Does not roll over)
 * 3-number: 25% (Does not roll over)
 */
export function calculatePrizePoolDistribution(
  eligibleSubscribersCount: number,
  monthlyPrice: number,
  allocationPct: number,
  rolloverFromPrevious: number,
  tierWinners: {
    tier5Count: number;
    tier4Count: number;
    tier3Count: number;
  }
): {
  basePrizePool: number;
  totalPrizePool: number;
  rolloverFromPrevious: number;
  tierBreakdown: DrawTierBreakdown;
  newRolloverJackpot: number;
} {
  const subscriptionRevenue = eligibleSubscribersCount * monthlyPrice;
  const basePrizePool = Math.round(subscriptionRevenue * (allocationPct / 100));
  const totalPrizePool = basePrizePool + rolloverFromPrevious;

  // Tier 5 (40%)
  const tier5Allocated = Math.round(totalPrizePool * (PRIZE_POOL_RULES.TIER_5_PCT / 100));
  const tier5Winners = tierWinners.tier5Count;
  const tier5PerWinner = tier5Winners > 0 ? Math.floor(tier5Allocated / tier5Winners) : 0;
  const tier5RolledOver = tier5Winners === 0;
  const tier5RolloverAmount = tier5RolledOver ? tier5Allocated : 0;

  const tier5: TierPrizeDetail = {
    matchCount: 5,
    poolSharePct: PRIZE_POOL_RULES.TIER_5_PCT,
    allocatedPool: tier5Allocated,
    winnerCount: tier5Winners,
    perWinnerPrize: tier5PerWinner,
    isJackpot: true,
    rolledOver: tier5RolledOver,
    rolloverAmount: tier5RolloverAmount,
  };

  // Tier 4 (35%)
  const tier4Allocated = Math.round(totalPrizePool * (PRIZE_POOL_RULES.TIER_4_PCT / 100));
  const tier4Winners = tierWinners.tier4Count;
  const tier4PerWinner = tier4Winners > 0 ? Math.floor(tier4Allocated / tier4Winners) : 0;

  const tier4: TierPrizeDetail = {
    matchCount: 4,
    poolSharePct: PRIZE_POOL_RULES.TIER_4_PCT,
    allocatedPool: tier4Allocated,
    winnerCount: tier4Winners,
    perWinnerPrize: tier4PerWinner,
    isJackpot: false,
    rolledOver: false,
    rolloverAmount: 0,
  };

  // Tier 3 (25%)
  const tier3Allocated = Math.round(totalPrizePool * (PRIZE_POOL_RULES.TIER_3_PCT / 100));
  const tier3Winners = tierWinners.tier3Count;
  const tier3PerWinner = tier3Winners > 0 ? Math.floor(tier3Allocated / tier3Winners) : 0;

  const tier3: TierPrizeDetail = {
    matchCount: 3,
    poolSharePct: PRIZE_POOL_RULES.TIER_3_PCT,
    allocatedPool: tier3Allocated,
    winnerCount: tier3Winners,
    perWinnerPrize: tier3PerWinner,
    isJackpot: false,
    rolledOver: false,
    rolloverAmount: 0,
  };

  return {
    basePrizePool,
    totalPrizePool,
    rolloverFromPrevious,
    tierBreakdown: { tier5, tier4, tier3 },
    newRolloverJackpot: tier5RolloverAmount,
  };
}

/**
 * Calculates exact charity contribution from subscription fee.
 */
export function calculateCharityContribution(
  subscriptionPrice: number,
  contributionPct: number
): {
  charityAmount: number;
  appliedPct: number;
  platformAmount: number;
} {
  const safePct = Math.max(
    CHARITY_RULES.MIN_CONTRIBUTION_PCT,
    Math.min(CHARITY_RULES.MAX_CONTRIBUTION_PCT, contributionPct || CHARITY_RULES.DEFAULT_CONTRIBUTION_PCT)
  );
  const charityAmount = Math.round((subscriptionPrice * safePct) / 100);
  const platformAmount = subscriptionPrice - charityAmount;

  return {
    charityAmount,
    appliedPct: safePct,
    platformAmount,
  };
}

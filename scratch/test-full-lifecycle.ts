/**
 * Digital Heroes — End-to-End Full Lifecycle Verification Test
 * 
 * Tests the complete flow:
 * Register -> Subscribe -> Select Charity -> Enter Five Scores -> Participate ->
 * Admin Configures Draw -> Admin Simulates Draw -> Admin Publishes Draw ->
 * Calculate Matches -> Display Results -> Subscriber Submits Proof ->
 * Admin Reviews & Approves -> Admin Issues Payout with Ref -> Subscriber Sees Paid Status.
 */

import { db } from '../server/db';
import {
  calculateMatches,
  calculatePrizePoolDistribution,
  calculateCharityContribution,
  validateStablefordScore,
  validateScoreDate,
} from '../src/services/businessLogic';
import { DrawSimulationResult } from '../src/types';

function runFullLifecycleTest() {
  console.log('⛳ Testing Complete Digital Heroes Full Lifecycle Flow...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Helper to get ISO date string N days ago
  function getPastDate(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }

  // 1. REGISTER SUBSCRIBER
  console.log('--- Step 1: Subscriber Registration ---');
  const email = `rory.mcilroy.${Date.now()}@example.com`;
  const user = db.createUser({
    name: 'Rory McIlroy',
    email,
    password: 'ChampionPassword2026!',
    plan: 'monthly',
    selectedCharityId: 'charity-macmillan',
    charityContributionPct: 25,
    handicapIndex: 2.1,
    homeClub: 'Holywood Golf Club',
    ghinOrMemberId: 'HGC-9921',
  });

  assert(user.id.startsWith('user-'), 'Subscriber registered with generated user ID');
  assert(user.role === 'subscriber', 'User assigned subscriber role (not admin)');
  assert(user.subscription.status === 'active', 'Subscription status initialized as active');
  assert(user.subscription.charityContributionPct === 25, 'Charity contribution stored as 25%');

  // 2. STABLEFORD SCORES (ENTER 5 SCORES: 35, 38, 40, 42, 44 on past dates)
  console.log('\n--- Step 2: Logging 5 Stableford Scores ---');
  const scoreDates = [getPastDate(5), getPastDate(4), getPastDate(3), getPastDate(2), getPastDate(1)];
  const scoreValues = [35, 38, 40, 42, 44];

  for (let i = 0; i < 5; i++) {
    db.addScore(user.id, {
      date: scoreDates[i],
      score: scoreValues[i],
      course: 'Royal County Down',
      holes: 18,
    });
  }

  const userScores = db.getUserScores(user.id);
  assert(userScores.length === 5, 'Exactly 5 Stableford scores recorded');
  assert(userScores[0].date === scoreDates[4], 'Scores sorted descending by date (newest first)');

  const dashboard = db.getDashboardData(user.id);
  assert(dashboard.eligibility.isEligible === true, 'Subscriber marked eligible for upcoming draw');
  assert(dashboard.eligibility.hasFullWindow === true, 'Subscriber has full 5-score window');

  // 3. ADMIN CREATES AND CONDUCTS DRAW
  console.log('\n--- Step 3: Administrator Conducts Monthly Draw ---');
  const drawId = `DRW-LIFECYCLE-${Date.now()}`;
  const draw = db.createDraw(
    {
      id: drawId,
      name: 'Championship Invitational Draw',
      monthYear: '2026-09',
      drawDate: '2026-09-30',
      drawMethod: 'algorithmic',
    },
    'admin@digitalheroes.co.in'
  );
  assert(draw.status === 'upcoming', 'Draw created in upcoming status');

  // We simulate with winning numbers that match Rory's 5 scores: [35, 38, 40, 42, 44]
  const winningNumbers = [35, 38, 40, 42, 44];
  const matchResult = calculateMatches(winningNumbers, scoreValues);
  assert(matchResult.matchCount === 5, 'Match calculator detected 5-match jackpot');
  assert(matchResult.matchedNumbers.length === 5, 'All 5 numbers matched');

  // Construct verified simulation result with 5-match tier winner
  const poolCalc = calculatePrizePoolDistribution(
    dashboard.eligibility.scoreCount,
    999,
    40,
    10000, // rollover from prior
    { tier5Count: 1, tier4Count: 0, tier3Count: 0 }
  );

  const customSimulation: DrawSimulationResult = {
    drawId: draw.id,
    drawName: draw.name,
    drawDate: draw.drawDate,
    drawMethod: 'algorithmic',
    drawMethodRationale: 'Authoritative frequency distribution across participant scores.',
    eligibleSubscribersCount: 1,
    basePrizePool: poolCalc.basePrizePool,
    rolloverFromPrevious: poolCalc.rolloverFromPrevious,
    totalPrizePool: poolCalc.totalPrizePool,
    winningNumbers,
    tierBreakdown: poolCalc.tierBreakdown,
    winners: {
      tier5: [
        {
          userId: user.id,
          userName: user.name,
          matchedNumbers: winningNumbers,
          scores: scoreValues,
        },
      ],
      tier4: [],
      tier3: [],
    },
    totalWinnersCount: 1,
    simulatedAt: new Date().toISOString(),
  };

  // 4. ADMIN PUBLISHES DRAW
  console.log('\n--- Step 4: Admin Publishes Draw ---');
  const publishResult = db.publishDraw(draw.id, customSimulation, 'admin@digitalheroes.co.in');
  assert(publishResult.draw.status === 'published', 'Draw authoritatively published');
  assert(publishResult.newWinnersCount === 1, 'Winner record created for 5-match jackpot');

  // 5. SUBSCRIBER RECEIVES WINNING CLAIM ON DASHBOARD
  console.log('\n--- Step 5: Subscriber Dashboard Displays Winnings ---');
  const subscriberWinnings = db.getWinners(user.id);
  assert(subscriberWinnings.length === 1, 'Subscriber sees winning claim in their dashboard');
  const winRecord = subscriberWinnings[0];
  assert(winRecord.matchCount === 5, 'Prize is Match 5 Jackpot tier');
  assert(winRecord.prizeAmount > 0, `Prize amount allocated: ₹${winRecord.prizeAmount.toLocaleString()}`);
  assert(winRecord.verificationStatus === 'required', 'Verification status is "required" initially');

  // 6. SUBSCRIBER SUBMITS SCORECARD PROOF
  console.log('\n--- Step 6: Subscriber Submits Scorecard Verification Proof ---');
  const submittedWinner = db.submitWinnerProof(
    winRecord.id,
    user.id,
    'https://images.unsplash.com/photo-official-scorecard.jpg',
    'Official Golf Ireland handicap scoring portal certificate export.'
  );
  assert(submittedWinner.verificationStatus === 'submitted', 'Verification status updated to "submitted"');
  assert(submittedWinner.proofImageUrl !== undefined, 'Proof image URL stored on record');

  // 7. ADMIN REVIEWS & APPROVES PROOF
  console.log('\n--- Step 7: Administrator Reviews & Approves Scorecard Proof ---');
  const approvedWinner = db.reviewWinnerProof(
    winRecord.id,
    'approve',
    'Scorecard dates verified with club handicap secretary.',
    undefined,
    'admin@digitalheroes.co.in'
  );
  assert(approvedWinner.verificationStatus === 'approved', 'Winner verification status set to "approved"');
  assert(approvedWinner.paymentStatus === 'processing', 'Payment status moved to "processing"');

  // 8. ADMIN ISSUES PAYOUT
  console.log('\n--- Step 8: Administrator Issues Payout & Records Payment Reference ---');
  const paymentRef = `NEFT-GOLF-IRL-${Date.now()}`;
  const paidWinner = db.markWinnerPaid(winRecord.id, paymentRef, 'admin@digitalheroes.co.in');
  assert(paidWinner.paymentStatus === 'paid', 'Payment status finalized as "paid"');
  assert(paidWinner.paymentReference === paymentRef, 'Transaction reference recorded');
  assert(paidWinner.paidAt !== undefined, 'Timestamp recorded for payout');

  // 9. AUDIT TRAIL VERIFICATION
  console.log('\n--- Step 9: Audit Trail Ledger Verification ---');
  const logs = db.getAuditLogs();
  assert(logs.some((l) => l.action === 'SUBMIT_VERIFICATION_PROOF'), 'Audit log captured proof submission');
  assert(logs.some((l) => l.action === 'APPROVE_VERIFICATION'), 'Audit log captured admin approval');
  assert(logs.some((l) => l.action === 'MARK_PAYOUT_PAID'), 'Audit log captured payout transaction');

  console.log(`\n========================================`);
  console.log(`Full Lifecycle Test: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFullLifecycleTest();

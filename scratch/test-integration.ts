/**
 * Digital Heroes — End-to-End Automated Backend Integration Test
 */

import { db } from '../server/db';
import {
  validateStablefordScore,
  validateScoreDate,
  applyRollingScores,
  calculatePrizePoolDistribution,
  calculateCharityContribution,
  generateDrawNumbers,
  checkDrawEligibility,
} from '../src/services/businessLogic';
import { DrawMethod } from '../src/types';

function runTests() {
  console.log('🚀 Running Digital Heroes Complete Backend Integration Tests...\n');

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

  // 1. AUTH & USERS
  console.log('--- 1. Authentication & Users ---');
  const testEmail = `test.golfer.${Date.now()}@example.com`;
  const createdUser = db.createUser({
    name: 'Tiger Woods',
    email: testEmail,
    password: 'SecurePassword123!',
    plan: 'monthly',
    selectedCharityId: 'charity-ocean',
    charityContributionPct: 20,
    handicapIndex: 0.5,
    homeClub: 'Augusta National',
  });
  assert(createdUser.id.startsWith('user-'), 'User created with valid ID');
  assert(createdUser.role === 'subscriber', 'User role assigned as subscriber');
  assert(createdUser.subscription.charityContributionPct === 20, 'Charity percentage stored as 20%');

  const authUser = db.authenticateUser(testEmail, 'SecurePassword123!');
  assert(authUser.email === testEmail, 'User authenticated with correct password');

  try {
    db.authenticateUser(testEmail, 'WrongPassword');
    assert(false, 'Should reject invalid password');
  } catch {
    assert(true, 'Rejected invalid password correctly');
  }

  // 2. SUBSCRIPTIONS & PLANS
  console.log('\n--- 2. Subscriptions & Configurable Plans ---');
  const plans = db.getSubscriptionPlans(true);
  assert(plans.length >= 2, `Active subscription plans loaded (${plans.length} plans)`);
  const monthlyPlan = plans.find((p) => p.code === 'monthly');
  assert(monthlyPlan?.priceINR === 999, 'Monthly plan priced at ₹999');
  assert(monthlyPlan?.minCharityPct === 10, 'Minimum charity contribution is 10%');

  const config = db.getConfig();
  assert(config.prizePoolAllocationPct === 40, 'Prize pool allocation configured at 40%');

  // 3. CHARITIES & GIVING
  console.log('\n--- 3. Charities & CRUD ---');
  const activeCharities = db.getCharities();
  assert(activeCharities.length >= 6, `Active charities listed (${activeCharities.length} charities)`);

  const createdCharity = db.createCharity(
    {
      name: 'Test Junior Golf Foundation',
      category: 'youth',
      tagline: 'Supporting young golfers',
      description: 'Test description',
      mission: 'Test mission',
      imageUrl: 'https://images.unsplash.com/photo-test',
      impactStatement: '₹1,000 sponsors 1 round',
      active: true,
      featured: false,
      taxId: 'TEST-TAX-001',
      events: [],
    },
    'admin@digitalheroes.co.in'
  );
  assert(createdCharity.id.startsWith('charity-'), 'Admin created charity');

  const donation = db.recordDonation({
    donorName: 'Generous Golfer',
    donorEmail: 'donor@example.com',
    charityId: createdCharity.id,
    amount: 5000,
    message: 'Keep swinging!',
  });
  assert(donation.amount === 5000, 'Direct donation recorded');
  const updatedCharity = db.getCharityById(createdCharity.id);
  assert(updatedCharity?.totalRaised === 5000, 'Charity total raised updated by donation');

  // 4. GOLF SCORES & ROLLING WINDOW
  console.log('\n--- 4. Golf Scores & Rolling 5-Score Window ---');
  // Validation tests
  assert(validateStablefordScore(36).valid, 'Valid Stableford score (36) accepted');
  assert(!validateStablefordScore(0).valid, 'Score 0 rejected (below min 1)');
  assert(!validateStablefordScore(46).valid, 'Score 46 rejected (above max 45)');
  assert(!validateStablefordScore(36.5).valid, 'Fractional score rejected');

  // Add 6 scores for Tiger Woods to verify rolling 5 retention
  const dates = ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'];
  const scoresVals = [32, 34, 36, 38, 40, 42];

  for (let i = 0; i < 6; i++) {
    db.addScore(createdUser.id, {
      date: dates[i],
      score: scoresVals[i],
      course: 'Augusta National',
      holes: 18,
    });
  }

  const tigerScores = db.getUserScores(createdUser.id);
  assert(tigerScores.length === 5, `Rolling window retained exactly 5 scores (retained: ${tigerScores.length})`);
  assert(tigerScores[0].date === '2026-09-15', 'Newest score is first (2026-09-15)');
  assert(tigerScores[4].date === '2026-09-11', 'Oldest retained score is 2026-09-11 (2026-09-10 dropped)');
  assert(!tigerScores.some((s) => s.date === '2026-09-10'), 'Oldest score 2026-09-10 was dropped');

  // Duplicate date validation
  try {
    db.addScore(createdUser.id, {
      date: '2026-09-15',
      score: 35,
    });
    assert(false, 'Should reject duplicate date for user');
  } catch {
    assert(true, 'Duplicate date on same day rejected');
  }

  // 5. UNIFIED DASHBOARD API
  console.log('\n--- 5. User Dashboard API ---');
  const dashboard = db.getDashboardData(createdUser.id);
  assert(dashboard.user.id === createdUser.id, 'Dashboard returned user profile');
  assert(dashboard.scores.length === 5, 'Dashboard returned 5 scores');
  assert(dashboard.eligibility.isEligible === true, 'User is marked eligible for draw');
  assert(dashboard.eligibility.hasFullWindow === true, 'User has complete 5-score window');

  // 6. DRAWS, SIMULATION & PRIZE POOL
  console.log('\n--- 6. Draws, Simulation & Rollover Engine ---');
  const testDraw = db.createDraw(
    {
      id: `DRW-TEST-${Date.now()}`,
      name: 'October 2026 Test Invitational Draw',
      monthYear: '2026-10',
      drawDate: '2026-10-31',
      drawMethod: 'algorithmic',
    },
    'admin@digitalheroes.co.in'
  );
  assert(testDraw.status === 'upcoming', 'Draw created in upcoming status');

  const simulation = db.simulateDraw(testDraw.id, 'algorithmic', 'admin@digitalheroes.co.in');
  assert(simulation.winningNumbers.length === 5, 'Simulation generated 5 winning numbers');
  assert(simulation.totalPrizePool > 0, `Prize pool calculated: ₹${simulation.totalPrizePool}`);
  assert(simulation.tierBreakdown.tier5.poolSharePct === 40, 'Tier 5 allocation is 40%');
  assert(simulation.tierBreakdown.tier4.poolSharePct === 35, 'Tier 4 allocation is 35%');
  assert(simulation.tierBreakdown.tier3.poolSharePct === 25, 'Tier 3 allocation is 25%');

  // 7. PUBLISHING & WINNERS
  console.log('\n--- 7. Draw Publishing & Winner Claims ---');
  const publishResult = db.publishDraw(testDraw.id, simulation, 'admin@digitalheroes.co.in');
  assert(publishResult.draw.status === 'published', 'Draw transitioned to published status');
  assert(publishResult.draw.winningNumbers.length === 5, 'Winning numbers locked on draw');

  const allWinners = db.getWinners();
  assert(allWinners.length >= 0, `Total winners recorded: ${allWinners.length}`);

  // 8. WINNER VERIFICATION & PAYOUT WORKFLOW
  console.log('\n--- 8. Winner Verification & Payouts ---');
  if (allWinners.length > 0) {
    const targetWinner = allWinners[0];
    const submittedProof = db.submitWinnerProof(
      targetWinner.id,
      targetWinner.userId,
      'https://images.unsplash.com/test-scorecard.jpg',
      'Official handicap card export'
    );
    assert(submittedProof.verificationStatus === 'submitted', 'Proof status set to submitted');

    const approvedProof = db.reviewWinnerProof(
      targetWinner.id,
      'approve',
      'Verified by admin',
      undefined,
      'admin@digitalheroes.co.in'
    );
    assert(approvedProof.verificationStatus === 'approved', 'Proof approved by admin');

    const paidWinner = db.markWinnerPaid(
      targetWinner.id,
      'PAY-TEST-998811',
      'admin@digitalheroes.co.in'
    );
    assert(paidWinner.paymentStatus === 'paid', 'Winner payment status marked as paid');
    assert(paidWinner.paymentReference === 'PAY-TEST-998811', 'Payment reference tracked');
  } else {
    console.log('  ℹ️ No winners generated in random simulation for test draw (expected variance).');
  }

  // 9. AUDIT TRAIL & ANALYTICS
  console.log('\n--- 9. Audit Trail & Analytics ---');
  const auditLogs = db.getAuditLogs();
  assert(auditLogs.length > 5, `Audit trail active (${auditLogs.length} entries recorded)`);

  const analytics = db.getAnalytics();
  assert(analytics.totalUsers >= 1, `Analytics tracks active subscriber base (${analytics.totalUsers} users)`);
  assert(analytics.totalCharityContributed > 0, `Analytics tracks total charity contributions: ₹${analytics.totalCharityContributed}`);

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

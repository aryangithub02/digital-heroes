import fs from 'fs';
import path from 'path';
import { POSTGRES_SCHEMA_SQL } from '../server/postgres';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CHARITIES,
  INITIAL_CONFIG,
  INITIAL_DRAWS,
  INITIAL_PLANS,
  INITIAL_WINNERS,
} from '../server/seedData';
import { db } from '../server/db';

function escapeSql(str: string): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generateSqlDump() {
  let sql = `-- ============================================================================
-- DIGITAL HEROES — COMPLETE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- Target: Neon PostgreSQL (neondb)
-- ============================================================================

`;

  sql += POSTGRES_SCHEMA_SQL + '\n\n';

  // 1. System Config
  sql += `-- 1. System Configuration
INSERT INTO system_config (id, prize_pool_allocation_pct, monthly_plan_price, yearly_plan_price, current_rollover_jackpot, default_draw_method, min_charity_pct, default_charity_pct)
VALUES (
  'default',
  ${INITIAL_CONFIG.prizePoolAllocationPct},
  ${INITIAL_CONFIG.monthlyPlanPrice},
  ${INITIAL_CONFIG.yearlyPlanPrice},
  ${INITIAL_CONFIG.currentRolloverJackpot},
  ${escapeSql(INITIAL_CONFIG.defaultDrawMethod)},
  ${INITIAL_CONFIG.minCharityPct},
  ${INITIAL_CONFIG.defaultCharityPct}
)
ON CONFLICT (id) DO NOTHING;

`;

  // 2. Subscription Plans
  sql += `-- 2. Subscription Plans
`;
  for (const p of INITIAL_PLANS) {
    sql += `INSERT INTO subscription_plans (id, name, code, billing_interval, price_inr, price_usd, prize_pool_allocation_pct, min_charity_pct, default_charity_pct, description, features, active)
VALUES (
  ${escapeSql(p.id)},
  ${escapeSql(p.name)},
  ${escapeSql(p.code)},
  ${escapeSql(p.billingInterval)},
  ${p.priceINR},
  ${p.priceUSD},
  ${p.prizePoolAllocationPct},
  ${p.minCharityPct},
  ${p.defaultCharityPct},
  ${escapeSql(p.description)},
  ${escapeSql(JSON.stringify(p.features))}::jsonb,
  ${p.active}
)
ON CONFLICT (id) DO NOTHING;
`;
  }
  sql += '\n';

  // 3. Charities
  sql += `-- 3. Accredited Charities
`;
  for (const c of INITIAL_CHARITIES) {
    sql += `INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  ${escapeSql(c.id)},
  ${escapeSql(c.name)},
  ${escapeSql(c.category)},
  ${escapeSql(c.tagline)},
  ${escapeSql(c.description)},
  ${escapeSql(c.mission)},
  ${escapeSql(c.imageUrl)},
  ${escapeSql(c.impactStatement)},
  ${c.totalRaised},
  ${c.supporterCount},
  ${c.featured},
  ${c.active},
  ${escapeSql(c.taxId)},
  ${escapeSql(JSON.stringify(c.events))}::jsonb
)
ON CONFLICT (id) DO NOTHING;
`;
  }
  sql += '\n';

  // 4. Users
  sql += `-- 4. Users & Subscribers
`;
  const allUsers = db.getUsers();
  for (const u of allUsers) {
    sql += `INSERT INTO users (id, email, name, role, handicap_index, home_club, ghin_or_member_id, phone, subscription)
VALUES (
  ${escapeSql(u.id)},
  ${escapeSql(u.email)},
  ${escapeSql(u.name)},
  ${escapeSql(u.role)},
  ${u.handicapIndex},
  ${escapeSql(u.homeClub)},
  ${escapeSql(u.ghinOrMemberId)},
  ${u.phone ? escapeSql(u.phone) : 'NULL'},
  ${escapeSql(JSON.stringify(u.subscription))}::jsonb
)
ON CONFLICT (id) DO NOTHING;
`;
  }
  sql += '\n';

  // 5. Golf Scores
  sql += `-- 5. Golf Stableford Scores (Rolling Window)
`;
  for (const u of allUsers) {
    const scores = db.getUserScores(u.id);
    for (const s of scores) {
      sql += `INSERT INTO golf_scores (id, user_id, date, score, course, holes, handicap_applied)
VALUES (
  ${escapeSql(s.id)},
  ${escapeSql(s.userId)},
  ${escapeSql(s.date)},
  ${s.score},
  ${escapeSql(s.course)},
  ${s.holes},
  ${s.handicapApplied || 'NULL'}
)
ON CONFLICT (id) DO NOTHING;
`;
    }
  }
  sql += '\n';

  // 6. Draws
  sql += `-- 6. Monthly Draws
`;
  for (const d of INITIAL_DRAWS) {
    sql += `INSERT INTO draws (id, name, month_year, draw_date, status, draw_method, draw_method_rationale, eligible_subscribers_count, active_subscribers_base, subscription_revenue, prize_pool_allocation_pct, base_prize_pool, rollover_from_previous, total_prize_pool, winning_numbers, tier_breakdown, published_at, published_by)
VALUES (
  ${escapeSql(d.id)},
  ${escapeSql(d.name)},
  ${escapeSql(d.monthYear)},
  ${escapeSql(d.drawDate)},
  ${escapeSql(d.status)},
  ${escapeSql(d.drawMethod)},
  ${escapeSql(d.drawMethodRationale)},
  ${d.eligibleSubscribersCount},
  ${d.activeSubscribersBase},
  ${d.subscriptionRevenue},
  ${d.prizePoolAllocationPct},
  ${d.basePrizePool},
  ${d.rolloverFromPrevious},
  ${d.totalPrizePool},
  ${escapeSql(JSON.stringify(d.winningNumbers))}::jsonb,
  ${escapeSql(JSON.stringify(d.tierBreakdown))}::jsonb,
  ${d.publishedAt ? escapeSql(d.publishedAt) : 'NULL'},
  ${d.publishedBy ? escapeSql(d.publishedBy) : 'NULL'}
)
ON CONFLICT (id) DO NOTHING;
`;
  }
  sql += '\n';

  // 7. Winners
  sql += `-- 7. Verified Winners
`;
  for (const w of INITIAL_WINNERS) {
    sql += `INSERT INTO winners (id, draw_id, draw_name, user_id, user_name, user_email, match_count, matched_numbers, user_scores_at_draw, winning_numbers, prize_amount, verification_status, proof_image_url, proof_submitted_at, proof_notes, admin_notes, payment_status, payment_reference, paid_at)
VALUES (
  ${escapeSql(w.id)},
  ${escapeSql(w.drawId)},
  ${escapeSql(w.drawName)},
  ${escapeSql(w.userId)},
  ${escapeSql(w.userName)},
  ${escapeSql(w.userEmail)},
  ${w.matchCount},
  ${escapeSql(JSON.stringify(w.matchedNumbers))}::jsonb,
  ${escapeSql(JSON.stringify(w.userScoresAtDraw))}::jsonb,
  ${escapeSql(JSON.stringify(w.winningNumbers))}::jsonb,
  ${w.prizeAmount},
  ${escapeSql(w.verificationStatus)},
  ${w.proofImageUrl ? escapeSql(w.proofImageUrl) : 'NULL'},
  ${w.proofSubmittedAt ? escapeSql(w.proofSubmittedAt) : 'NULL'},
  ${w.proofNotes ? escapeSql(w.proofNotes) : 'NULL'},
  ${w.adminNotes ? escapeSql(w.adminNotes) : 'NULL'},
  ${escapeSql(w.paymentStatus)},
  ${w.paymentReference ? escapeSql(w.paymentReference) : 'NULL'},
  ${w.paidAt ? escapeSql(w.paidAt) : 'NULL'}
)
ON CONFLICT (id) DO NOTHING;
`;
  }
  sql += '\n';

  // 8. Audit Logs
  sql += `-- 8. Audit Logs
`;
  for (const l of INITIAL_AUDIT_LOGS) {
    sql += `INSERT INTO audit_logs (id, actor, action, details, timestamp, result_id)
VALUES (
  ${escapeSql(l.id)},
  ${escapeSql(l.actor)},
  ${escapeSql(l.action)},
  ${escapeSql(l.details)},
  ${escapeSql(l.timestamp)},
  ${l.resultId ? escapeSql(l.resultId) : 'NULL'}
)
ON CONFLICT (id) DO NOTHING;
`;
  }

  const outPath = path.join(process.cwd(), 'seed.sql');
  fs.writeFileSync(outPath, sql, 'utf-8');
  console.log(`✅ Generated complete PostgreSQL seed script at: ${outPath}`);
}

generateSqlDump();

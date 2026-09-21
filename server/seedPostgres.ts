/**
 * Digital Heroes — Neon PostgreSQL Data Seeder Script (WebSocket / Port 443 Compatible)
 * Run with: npm run seed:pg or npx tsx server/seedPostgres.ts
 */

import dotenv from 'dotenv';
dotenv.config();
import ws from 'ws';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { POSTGRES_SCHEMA_SQL } from './postgres';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CHARITIES,
  INITIAL_CONFIG,
  INITIAL_DRAWS,
  INITIAL_PLANS,
  INITIAL_WINNERS,
} from './seedData';
import { db } from './db';

// Route queries over standard HTTPS port 443 (bypasses port 5432 blocking)
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

async function seedPostgres() {
  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL database via secure WebSocket (Port 443)...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: true,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully to Neon PostgreSQL database!');

    console.log('📦 1. Creating schema tables...');
    await client.query(POSTGRES_SCHEMA_SQL);
    console.log('  ✅ Schema tables created.');

    console.log('🌱 2. Seeding System Config...');
    await client.query(
      `INSERT INTO system_config (id, prize_pool_allocation_pct, monthly_plan_price, yearly_plan_price, current_rollover_jackpot, default_draw_method, min_charity_pct, default_charity_pct)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         prize_pool_allocation_pct = EXCLUDED.prize_pool_allocation_pct,
         monthly_plan_price = EXCLUDED.monthly_plan_price,
         yearly_plan_price = EXCLUDED.yearly_plan_price,
         current_rollover_jackpot = EXCLUDED.current_rollover_jackpot,
         default_draw_method = EXCLUDED.default_draw_method,
         min_charity_pct = EXCLUDED.min_charity_pct,
         default_charity_pct = EXCLUDED.default_charity_pct,
         updated_at = NOW();`,
      [
        INITIAL_CONFIG.prizePoolAllocationPct,
        INITIAL_CONFIG.monthlyPlanPrice,
        INITIAL_CONFIG.yearlyPlanPrice,
        INITIAL_CONFIG.currentRolloverJackpot,
        INITIAL_CONFIG.defaultDrawMethod,
        INITIAL_CONFIG.minCharityPct,
        INITIAL_CONFIG.defaultCharityPct,
      ]
    );

    console.log('🌱 3. Seeding Subscription Plans...');
    for (const plan of INITIAL_PLANS) {
      await client.query(
        `INSERT INTO subscription_plans (id, name, code, billing_interval, price_inr, price_usd, prize_pool_allocation_pct, min_charity_pct, default_charity_pct, description, features, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price_inr = EXCLUDED.price_inr,
           price_usd = EXCLUDED.price_usd,
           description = EXCLUDED.description,
           features = EXCLUDED.features,
           updated_at = NOW();`,
        [
          plan.id,
          plan.name,
          plan.code,
          plan.billingInterval,
          plan.priceINR,
          plan.priceUSD,
          plan.prizePoolAllocationPct,
          plan.minCharityPct,
          plan.defaultCharityPct,
          plan.description,
          JSON.stringify(plan.features),
          plan.active,
        ]
      );
    }
    console.log(`  ✅ Seeded ${INITIAL_PLANS.length} subscription plans.`);

    console.log('🌱 4. Seeding Charities...');
    for (const charity of INITIAL_CHARITIES) {
      await client.query(
        `INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           tagline = EXCLUDED.tagline,
           description = EXCLUDED.description,
           mission = EXCLUDED.mission,
           image_url = EXCLUDED.image_url,
           impact_statement = EXCLUDED.impact_statement,
           total_raised = EXCLUDED.total_raised,
           supporter_count = EXCLUDED.supporter_count,
           featured = EXCLUDED.featured,
           active = EXCLUDED.active,
           events = EXCLUDED.events,
           updated_at = NOW();`,
        [
          charity.id,
          charity.name,
          charity.category,
          charity.tagline,
          charity.description,
          charity.mission,
          charity.imageUrl,
          charity.impactStatement,
          charity.totalRaised,
          charity.supporterCount,
          charity.featured,
          charity.active,
          charity.taxId,
          JSON.stringify(charity.events),
        ]
      );
    }
    console.log(`  ✅ Seeded ${INITIAL_CHARITIES.length} charities.`);

    console.log('🌱 5. Seeding Users and Subscribers...');
    const allUsers = db.getUsers();
    for (const user of allUsers) {
      await client.query(
        `INSERT INTO users (id, email, name, role, handicap_index, home_club, ghin_or_member_id, phone, subscription)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           handicap_index = EXCLUDED.handicap_index,
           home_club = EXCLUDED.home_club,
           ghin_or_member_id = EXCLUDED.ghin_or_member_id,
           subscription = EXCLUDED.subscription,
           updated_at = NOW();`,
        [
          user.id,
          user.email,
          user.name,
          user.role,
          user.handicapIndex,
          user.homeClub,
          user.ghinOrMemberId,
          user.phone || null,
          JSON.stringify(user.subscription),
        ]
      );
    }
    console.log(`  ✅ Seeded ${allUsers.length} users and active subscribers.`);

    console.log('🌱 6. Seeding Golf Scores...');
    let scoreCount = 0;
    for (const u of allUsers) {
      const scores = db.getUserScores(u.id);
      for (const s of scores) {
        await client.query(
          `INSERT INTO golf_scores (id, user_id, date, score, course, holes, handicap_applied)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING;`,
          [
            s.id,
            s.userId,
            s.date,
            s.score,
            s.course,
            s.holes,
            s.handicapApplied || null,
          ]
        );
        scoreCount++;
      }
    }
    console.log(`  ✅ Seeded ${scoreCount} golf scores.`);

    console.log('🌱 7. Seeding Draws...');
    for (const draw of INITIAL_DRAWS) {
      await client.query(
        `INSERT INTO draws (id, name, month_year, draw_date, status, draw_method, draw_method_rationale, eligible_subscribers_count, active_subscribers_base, subscription_revenue, prize_pool_allocation_pct, base_prize_pool, rollover_from_previous, total_prize_pool, winning_numbers, tier_breakdown, published_at, published_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           winning_numbers = EXCLUDED.winning_numbers,
           tier_breakdown = EXCLUDED.tier_breakdown,
           published_at = EXCLUDED.published_at;`,
        [
          draw.id,
          draw.name,
          draw.monthYear,
          draw.drawDate,
          draw.status,
          draw.drawMethod,
          draw.drawMethodRationale,
          draw.eligibleSubscribersCount,
          draw.activeSubscribersBase,
          draw.subscriptionRevenue,
          draw.prizePoolAllocationPct,
          draw.basePrizePool,
          draw.rolloverFromPrevious,
          draw.totalPrizePool,
          JSON.stringify(draw.winningNumbers),
          JSON.stringify(draw.tierBreakdown),
          draw.publishedAt || null,
          draw.publishedBy || null,
        ]
      );
    }
    console.log(`  ✅ Seeded ${INITIAL_DRAWS.length} draws.`);

    console.log('🌱 8. Seeding Winners...');
    for (const winner of INITIAL_WINNERS) {
      await client.query(
        `INSERT INTO winners (id, draw_id, draw_name, user_id, user_name, user_email, match_count, matched_numbers, user_scores_at_draw, winning_numbers, prize_amount, verification_status, proof_image_url, proof_submitted_at, proof_notes, admin_notes, payment_status, payment_reference, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING;`,
        [
          winner.id,
          winner.drawId,
          winner.drawName,
          winner.userId,
          winner.userName,
          winner.userEmail,
          winner.matchCount,
          JSON.stringify(winner.matchedNumbers),
          JSON.stringify(winner.userScoresAtDraw),
          JSON.stringify(winner.winningNumbers),
          winner.prizeAmount,
          winner.verificationStatus,
          winner.proofImageUrl || null,
          winner.proofSubmittedAt || null,
          winner.proofNotes || null,
          winner.adminNotes || null,
          winner.paymentStatus,
          winner.paymentReference || null,
          winner.paidAt || null,
        ]
      );
    }
    console.log(`  ✅ Seeded ${INITIAL_WINNERS.length} winners.`);

    console.log('🌱 9. Seeding Audit Logs...');
    for (const log of INITIAL_AUDIT_LOGS) {
      await client.query(
        `INSERT INTO audit_logs (id, actor, action, details, timestamp, result_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING;`,
        [log.id, log.actor, log.action, log.details, log.timestamp, log.resultId || null]
      );
    }
    console.log(`  ✅ Seeded ${INITIAL_AUDIT_LOGS.length} audit logs.`);

    console.log('\n🎉 Neon PostgreSQL Database successfully seeded with complete Digital Heroes schema and data!');
    client.release();
    await pool.end();
  } catch (err: any) {
    console.error('❌ Seeding error:', err.message || err);
    console.log('\n💡 Note: If port 5432 is restricted on your network, you can also copy and paste the contents of "seed.sql" directly into the Neon Console -> "SQL Editor" tab to run it instantly in the browser.');
    process.exit(1);
  }
}

seedPostgres();

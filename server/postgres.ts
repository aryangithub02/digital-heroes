/**
 * Digital Heroes — Neon PostgreSQL Database Service
 * Manages PostgreSQL connection, DDL table migrations, and relational synchronization.
 */

import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_tPITl5puvZ7C@ep-snowy-cloud-b4lvllxf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS system_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  prize_pool_allocation_pct INT NOT NULL DEFAULT 40,
  monthly_plan_price INT NOT NULL DEFAULT 999,
  yearly_plan_price INT NOT NULL DEFAULT 9990,
  current_rollover_jackpot INT NOT NULL DEFAULT 44800,
  default_draw_method VARCHAR(50) NOT NULL DEFAULT 'algorithmic',
  min_charity_pct INT NOT NULL DEFAULT 10,
  default_charity_pct INT NOT NULL DEFAULT 15,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL,
  price_inr INT NOT NULL,
  price_usd INT NOT NULL,
  prize_pool_allocation_pct INT NOT NULL DEFAULT 40,
  min_charity_pct INT NOT NULL DEFAULT 10,
  default_charity_pct INT NOT NULL DEFAULT 15,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charities (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tagline TEXT,
  description TEXT,
  mission TEXT,
  image_url TEXT,
  impact_statement TEXT,
  total_raised INT DEFAULT 0,
  supporter_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  tax_id VARCHAR(100),
  events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'subscriber',
  password_hash TEXT,
  password_salt TEXT,
  handicap_index NUMERIC(4, 1) DEFAULT 15.0,
  home_club VARCHAR(255),
  ghin_or_member_id VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS golf_scores (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 45),
  course VARCHAR(255),
  holes INT DEFAULT 18,
  handicap_applied INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS draws (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  month_year VARCHAR(20) NOT NULL,
  draw_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
  draw_method VARCHAR(50) NOT NULL DEFAULT 'algorithmic',
  draw_method_rationale TEXT,
  eligible_subscribers_count INT DEFAULT 0,
  active_subscribers_base INT DEFAULT 0,
  subscription_revenue INT DEFAULT 0,
  prize_pool_allocation_pct INT DEFAULT 40,
  base_prize_pool INT DEFAULT 0,
  rollover_from_previous INT DEFAULT 0,
  total_prize_pool INT DEFAULT 0,
  winning_numbers JSONB DEFAULT '[]'::jsonb,
  tier_breakdown JSONB NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  published_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS winners (
  id VARCHAR(50) PRIMARY KEY,
  draw_id VARCHAR(50) REFERENCES draws(id) ON DELETE CASCADE,
  draw_name VARCHAR(255),
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  match_count INT NOT NULL,
  matched_numbers JSONB NOT NULL,
  user_scores_at_draw JSONB NOT NULL,
  winning_numbers JSONB NOT NULL,
  prize_amount INT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'required',
  proof_image_url TEXT,
  proof_submitted_at TIMESTAMP WITH TIME ZONE,
  proof_notes TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_reference VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS independent_donations (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  charity_id VARCHAR(50) REFERENCES charities(id),
  charity_name VARCHAR(255),
  amount INT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result_id VARCHAR(100)
);
`;

export async function initPostgresDatabase(): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    console.log('Connected to Neon PostgreSQL database.');
    await client.query(POSTGRES_SCHEMA_SQL);
    console.log('PostgreSQL schema migration completed successfully.');
    client.release();
    return true;
  } catch (err: any) {
    console.warn('Neon PostgreSQL direct connection notice:', err.message || err);
    console.log('Dual-engine active: utilizing persistent local database with full PostgreSQL schema compatibility.');
    return false;
  }
}

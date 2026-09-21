-- ============================================================================
-- DIGITAL HEROES — COMPLETE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- Target: Neon PostgreSQL (neondb)
-- ============================================================================


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


-- 1. System Configuration
INSERT INTO system_config (id, prize_pool_allocation_pct, monthly_plan_price, yearly_plan_price, current_rollover_jackpot, default_draw_method, min_charity_pct, default_charity_pct)
VALUES (
  'default',
  40,
  999,
  9990,
  0,
  'algorithmic',
  10,
  15
)
ON CONFLICT (id) DO NOTHING;

-- 2. Subscription Plans
INSERT INTO subscription_plans (id, name, code, billing_interval, price_inr, price_usd, prize_pool_allocation_pct, min_charity_pct, default_charity_pct, description, features, active)
VALUES (
  'plan-monthly',
  'Monthly Hero Membership',
  'monthly',
  'month',
  999,
  12,
  40,
  10,
  15,
  'Full entry to monthly draws, rolling Stableford scoring tracking, and designated charity impact.',
  '["Automatic entry into all Monthly Draws","5-Score Rolling Stableford Window","Min 10% direct donation to chosen accredited charity","Eligibility for Match 5, 4, 3 Prize Pools","Full verification claims and digital ledger access"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subscription_plans (id, name, code, billing_interval, price_inr, price_usd, prize_pool_allocation_pct, min_charity_pct, default_charity_pct, description, features, active)
VALUES (
  'plan-yearly',
  'Annual Hero Champion Plan',
  'yearly',
  'year',
  9990,
  120,
  40,
  10,
  15,
  '12 months for the price of 10 with guaranteed continuous rollover prize eligibility.',
  '["Guaranteed 12-month draw participation (2 months free)","Continuous rolling Stableford tracking","Higher charity allocation flexibility up to 50%","Priority winner scorecard verification processing","Annual Digital Heroes Patron recognition"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Accredited Charities
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-gosh',
  'Great Ormond Street Hospital Charity',
  'healthcare',
  'Help give seriously ill children a brighter tomorrow.',
  'Great Ormond Street Hospital Charity helps support seriously ill children across the UK and worldwide. We fund vital medical equipment, groundbreaking pediatric research, and patient-family support services.',
  'To provide transformative healthcare, comfort, and life-changing hope to seriously ill children and their families.',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
  'Every ₹5,000 ($60) funds specialized therapy supplies and medical equipment for intensive pediatric care.',
  0,
  0,
  true,
  true,
  'UK-CHARITY-1160024',
  '[{"id":"evt-gosh-1","title":"London Golf Links Pro-Am for Kids","date":"2026-10-18","location":"Wentworth Club, Surrey","description":"18-hole Stableford scramble pairing tour professionals and amateurs to fund pediatric surgical tools."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-macmillan',
  'Macmillan Cancer Support',
  'healthcare',
  'Supporting people living with cancer.',
  'Macmillan provides physical, emotional, and financial support to individuals and families coping with a cancer diagnosis, helping everyone live life as fully as they can.',
  'Giving people with cancer the specialized medical nursing, guidance, and financial grants they urgently need.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
  'Every ₹2,500 ($30) pays for a registered Macmillan nurse for an hour, helping someone through critical moments.',
  0,
  0,
  true,
  true,
  'UK-CHARITY-261017',
  '[{"id":"evt-mac-1","title":"Longest Day Golf Challenge","date":"2026-11-04","location":"Sunningdale Golf Club","description":"72 holes in one day challenge raising funds for Macmillan cancer nurses."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-alzheimers',
  'Alzheimer''s Society',
  'community',
  'A kinder future for everyone affected by dementia.',
  'Alzheimer''s Society is the leading UK dementia charity, transforming the lives of everyone affected by dementia through specialist advisory support and funding research for the cure.',
  'To build a world where dementia no longer devastates lives through direct family support and cutting-edge dementia research.',
  'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80',
  'Every ₹3,000 ($36) funds one hour of specialist telephone dementia advising for families in crisis.',
  0,
  0,
  true,
  true,
  'UK-CHARITY-296645',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-bhf',
  'British Heart Foundation',
  'healthcare',
  'Fighting for every heartbeat.',
  'The British Heart Foundation pioneers research into heart and circulatory conditions, stroke, vascular dementia, and their risk factors to save and improve lives.',
  'Winning the fight against cardiovascular disease through life-saving scientific breakthroughs.',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  'Every ₹5,000 ($60) directly subsidizes cardiac gene discovery research and CPR school training kits.',
  0,
  0,
  true,
  true,
  'UK-CHARITY-225971',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-mind',
  'Mind',
  'community',
  'Better mental health for all.',
  'Mind provides advice and support to empower anyone experiencing a mental health problem, campaigning to improve services and promote understanding across all sports communities.',
  'Ensuring nobody has to face a mental health problem alone.',
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
  'Every ₹2,000 ($24) helps answer two urgent calls on the Mind Infoline for someone seeking hope.',
  0,
  0,
  true,
  true,
  'UK-CHARITY-219830',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-ocean',
  'Ocean Legacy Marine Restoration',
  'environment',
  'Restoring coastal coral reefs & removing ocean ghost nets',
  'Ocean Legacy partners with coastal golf communities and scientific divers to deploy active artificial reef restoration modules and extract abandoned fishing gear from fragile marine habitats.',
  'To revitalize damaged coastal ecosystems through direct physical intervention, community dive programs, and sustainable marine bio-sanctuaries.',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
  'Every ₹2,500 ($30) contributed funds the fabrication and underwater deployment of biological coral nursery substrate.',
  0,
  0,
  false,
  true,
  '80G-ENV-2024-9912',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-wildlife',
  'Wildlife Habitat & Forest Rescue',
  'wildlife',
  'Emergency rescue, triage, and bushland habitat corridors',
  'Providing 24/7 mobile veterinary response units and purchasing critical parcels of wilderness to reconnect fragmented animal migration paths.',
  'Safeguarding native species through emergency veterinary field medicine, sanctuary expansion, and ecological corridor protection.',
  'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80',
  'Every ₹2,500 ($30) pays for full veterinary trauma care and rehabilitation medicine for an injured native animal.',
  0,
  0,
  false,
  true,
  '80G-WLD-2023-4109',
  '[{"id":"evt-3","title":"Bushland Habitat Tree Planting Day","date":"2026-10-25","location":"Yarra Valley Sanctuary","description":"Planting 2,000 indigenous trees to secure a vital koala habitat bridge."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-youth',
  'Junior Pathways Golf & Education Trust',
  'youth',
  'Equipping underprivileged youth with sport mentorship and STEM bursaries',
  'Breaking economic barriers by providing golf equipment, PGA coaching, and academic tutoring to students from under-resourced public secondary schools.',
  'Using sport values, discipline, and academic sponsorship to open pathways to university and collegiate scholarships.',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
  'Every ₹5,000 ($60) supplies a full semester of junior clubs, range passes, and STEM tutoring for a student.',
  0,
  0,
  false,
  true,
  '80G-YTH-2022-8114',
  '[{"id":"evt-4","title":"NextGen Junior Invitational","date":"2026-11-14","location":"Albert Park Golf Course","description":"Celebratory stroke-and-stableford showcase honoring scholarship recipients."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-veterans',
  'Frontline Veterans Rehabilitation Fund',
  'veterans',
  'Mental health resilience, adaptive recreation, and transitional careers',
  'Supporting military and first-responder veterans coping with PTSD and service injuries through specialized peer-led sports therapy and adaptive athletics.',
  'Empowering returning servicemen and women with community brotherhood, adaptive wellness retreats, and certified career training.',
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
  'Every ₹2,000 ($24) sponsors a comprehensive clinical peer-support and outdoor mobility session.',
  0,
  0,
  false,
  true,
  '80G-VET-2021-3310',
  '[{"id":"evt-5","title":"Heroes Cup Adaptive Golf Classic","date":"2026-11-22","location":"Huntingdale Golf Club","description":"Annual team tournament pairing veterans with corporate partners for veteran transition funds."}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-healthcare',
  'Community Pediatric Heart Care',
  'healthcare',
  'Lifesaving cardiac surgeries for children from low-income families',
  'Partnering with premier pediatric cardiology hospitals to provide zero-cost open-heart surgeries and diagnostic echocardiograms for vulnerable children.',
  'Ensuring no child is denied curative cardiovascular surgery due to financial distress.',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
  'Every ₹10,000 ($120) directly subsidizes cardiac catheterization consumables and ICU recovery costs.',
  0,
  0,
  false,
  true,
  '80G-HLT-2023-7721',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
INSERT INTO charities (id, name, category, tagline, description, mission, image_url, impact_statement, total_raised, supporter_count, featured, active, tax_id, events)
VALUES (
  'charity-reforestation',
  'Clean Watersheds & Reforestation Alliance',
  'environment',
  'Restoring native catchment forests to protect regional drinking water',
  'Stabilizing riverbanks and restoring native headwater forests surrounding regional dams to eliminate runoff pollution and restore native bird sanctuaries.',
  'Protecting municipal water supplies through organic bioswales and riparian planting.',
  'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
  'Every ₹1,000 ($12) buys, protects, and monitors 5 native deep-root riparian shrubs for 3 years.',
  0,
  0,
  false,
  true,
  '80G-ENV-2025-1104',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. Users & Subscribers
INSERT INTO users (id, email, name, role, handicap_index, home_club, ghin_or_member_id, phone, subscription)
VALUES (
  'user-admin',
  'admin@digitalheroes.co.in',
  'Marcus Vance',
  'admin',
  9.2,
  'Metropolitan Golf Club',
  'MGC-0012',
  '+91 98201 54321',
  '{"plan":"yearly","planId":"plan-yearly","status":"active","price":9990,"billingInterval":"year","startDate":"2026-01-01T00:00:00Z","renewalDate":"2027-01-01T00:00:00Z","charityContributionPct":25,"selectedCharityId":"charity-ocean","autoRenew":true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 5. Golf Stableford Scores (Rolling Window)

-- 6. Monthly Draws
INSERT INTO draws (id, name, month_year, draw_date, status, draw_method, draw_method_rationale, eligible_subscribers_count, active_subscribers_base, subscription_revenue, prize_pool_allocation_pct, base_prize_pool, rollover_from_previous, total_prize_pool, winning_numbers, tier_breakdown, published_at, published_by)
VALUES (
  'DRW-2026-09',
  'September 2026 Monthly Draw',
  '2026-09',
  '2026-09-30',
  'upcoming',
  'algorithmic',
  'Algorithmic frequency weighting across active participant Stableford scores.',
  0,
  0,
  0,
  40,
  0,
  0,
  0,
  '[]'::jsonb,
  '{"tier5":{"matchCount":5,"poolSharePct":40,"allocatedPool":0,"winnerCount":0,"perWinnerPrize":0,"isJackpot":true,"rolledOver":false,"rolloverAmount":0},"tier4":{"matchCount":4,"poolSharePct":35,"allocatedPool":0,"winnerCount":0,"perWinnerPrize":0,"isJackpot":false,"rolledOver":false,"rolloverAmount":0},"tier3":{"matchCount":3,"poolSharePct":25,"allocatedPool":0,"winnerCount":0,"perWinnerPrize":0,"isJackpot":false,"rolledOver":false,"rolloverAmount":0}}'::jsonb,
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 7. Verified Winners

-- 8. Audit Logs
INSERT INTO audit_logs (id, actor, action, details, timestamp, result_id)
VALUES (
  'aud-1',
  'admin@digitalheroes.co.in',
  'INITIALIZE_PLATFORM',
  'Digital Heroes production platform initialized with clean database schema, subscription plans, and accredited charities.',
  '2026-01-01T00:00:00Z',
  NULL
)
ON CONFLICT (id) DO NOTHING;

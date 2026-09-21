/**
 * Digital Heroes — Initial Seed Data
 * Contains only core system config, subscription plans, accredited charities, and administrator account.
 * All subscribers, scores, and draw participants are created dynamically by users.
 */

import {
  AuditLogEntry,
  Charity,
  Draw,
  GolfScore,
  SubscriptionPlan,
  SystemConfig,
  UserProfile,
  WinnerRecord,
} from '../src/types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-monthly',
    name: 'Monthly Hero Membership',
    code: 'monthly',
    billingInterval: 'month',
    priceINR: 999,
    priceUSD: 12,
    prizePoolAllocationPct: 40,
    minCharityPct: 10,
    defaultCharityPct: 15,
    description: 'Full entry to monthly draws, rolling Stableford scoring tracking, and designated charity impact.',
    features: [
      'Automatic entry into all Monthly Draws',
      '5-Score Rolling Stableford Window',
      'Min 10% direct donation to chosen accredited charity',
      'Eligibility for Match 5, 4, 3 Prize Pools',
      'Full verification claims and digital ledger access',
    ],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-yearly',
    name: 'Annual Hero Champion Plan',
    code: 'yearly',
    billingInterval: 'year',
    priceINR: 9990,
    priceUSD: 120,
    prizePoolAllocationPct: 40,
    minCharityPct: 10,
    defaultCharityPct: 15,
    description: '12 months for the price of 10 with guaranteed continuous rollover prize eligibility.',
    features: [
      'Guaranteed 12-month draw participation (2 months free)',
      'Continuous rolling Stableford tracking',
      'Higher charity allocation flexibility up to 50%',
      'Priority winner scorecard verification processing',
      'Annual Digital Heroes Patron recognition',
    ],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_CONFIG: SystemConfig = {
  prizePoolAllocationPct: 40,
  monthlyPlanPrice: 999,
  yearlyPlanPrice: 9990,
  currentRolloverJackpot: 0,
  defaultDrawMethod: 'algorithmic',
  minCharityPct: 10,
  defaultCharityPct: 15,
};

export const INITIAL_CHARITIES: Charity[] = [
  {
    id: 'charity-gosh',
    name: 'Great Ormond Street Hospital Charity',
    category: 'healthcare',
    tagline: 'Help give seriously ill children a brighter tomorrow.',
    description:
      'Great Ormond Street Hospital Charity helps support seriously ill children across the UK and worldwide. We fund vital medical equipment, groundbreaking pediatric research, and patient-family support services.',
    mission:
      'To provide transformative healthcare, comfort, and life-changing hope to seriously ill children and their families.',
    imageUrl:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    impactStatement:
      'Every ₹5,000 ($60) funds specialized therapy supplies and medical equipment for intensive pediatric care.',
    totalRaised: 0,
    supporterCount: 0,
    featured: true,
    active: true,
    taxId: 'UK-CHARITY-1160024',
    events: [
      {
        id: 'evt-gosh-1',
        title: 'London Golf Links Pro-Am for Kids',
        date: '2026-10-18',
        location: 'Wentworth Club, Surrey',
        description:
          '18-hole Stableford scramble pairing tour professionals and amateurs to fund pediatric surgical tools.',
      },
    ],
  },
  {
    id: 'charity-macmillan',
    name: 'Macmillan Cancer Support',
    category: 'healthcare',
    tagline: 'Supporting people living with cancer.',
    description:
      'Macmillan provides physical, emotional, and financial support to individuals and families coping with a cancer diagnosis, helping everyone live life as fully as they can.',
    mission:
      'Giving people with cancer the specialized medical nursing, guidance, and financial grants they urgently need.',
    imageUrl:
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    impactStatement:
      'Every ₹2,500 ($30) pays for a registered Macmillan nurse for an hour, helping someone through critical moments.',
    totalRaised: 0,
    supporterCount: 0,
    featured: true,
    active: true,
    taxId: 'UK-CHARITY-261017',
    events: [
      {
        id: 'evt-mac-1',
        title: 'Longest Day Golf Challenge',
        date: '2026-11-04',
        location: 'Sunningdale Golf Club',
        description: '72 holes in one day challenge raising funds for Macmillan cancer nurses.',
      },
    ],
  },
  {
    id: 'charity-alzheimers',
    name: "Alzheimer's Society",
    category: 'community',
    tagline: 'A kinder future for everyone affected by dementia.',
    description:
      "Alzheimer's Society is the leading UK dementia charity, transforming the lives of everyone affected by dementia through specialist advisory support and funding research for the cure.",
    mission:
      'To build a world where dementia no longer devastates lives through direct family support and cutting-edge dementia research.',
    imageUrl:
      'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80',
    impactStatement:
      'Every ₹3,000 ($36) funds one hour of specialist telephone dementia advising for families in crisis.',
    totalRaised: 0,
    supporterCount: 0,
    featured: true,
    active: true,
    taxId: 'UK-CHARITY-296645',
    events: [],
  },
  {
    id: 'charity-bhf',
    name: 'British Heart Foundation',
    category: 'healthcare',
    tagline: 'Fighting for every heartbeat.',
    description:
      'The British Heart Foundation pioneers research into heart and circulatory conditions, stroke, vascular dementia, and their risk factors to save and improve lives.',
    mission:
      'Winning the fight against cardiovascular disease through life-saving scientific breakthroughs.',
    imageUrl:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    impactStatement:
      'Every ₹5,000 ($60) directly subsidizes cardiac gene discovery research and CPR school training kits.',
    totalRaised: 0,
    supporterCount: 0,
    featured: true,
    active: true,
    taxId: 'UK-CHARITY-225971',
    events: [],
  },
  {
    id: 'charity-mind',
    name: 'Mind',
    category: 'community',
    tagline: 'Better mental health for all.',
    description:
      'Mind provides advice and support to empower anyone experiencing a mental health problem, campaigning to improve services and promote understanding across all sports communities.',
    mission:
      'Ensuring nobody has to face a mental health problem alone.',
    imageUrl:
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
    impactStatement:
      'Every ₹2,000 ($24) helps answer two urgent calls on the Mind Infoline for someone seeking hope.',
    totalRaised: 0,
    supporterCount: 0,
    featured: true,
    active: true,
    taxId: 'UK-CHARITY-219830',
    events: [],
  },
  {
    id: 'charity-ocean',
    name: 'Ocean Legacy Marine Restoration',
    category: 'environment',
    tagline: 'Restoring coastal coral reefs & removing ocean ghost nets',
    description:
      'Ocean Legacy partners with coastal golf communities and scientific divers to deploy active artificial reef restoration modules and extract abandoned fishing gear from fragile marine habitats.',
    mission:
      'To revitalize damaged coastal ecosystems through direct physical intervention, community dive programs, and sustainable marine bio-sanctuaries.',
    imageUrl:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹2,500 ($30) contributed funds the fabrication and underwater deployment of biological coral nursery substrate.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-ENV-2024-9912',
    events: [],
  },
  {
    id: 'charity-wildlife',
    name: 'Wildlife Habitat & Forest Rescue',
    category: 'wildlife',
    tagline: 'Emergency rescue, triage, and bushland habitat corridors',
    description:
      'Providing 24/7 mobile veterinary response units and purchasing critical parcels of wilderness to reconnect fragmented animal migration paths.',
    mission:
      'Safeguarding native species through emergency veterinary field medicine, sanctuary expansion, and ecological corridor protection.',
    imageUrl:
      'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹2,500 ($30) pays for full veterinary trauma care and rehabilitation medicine for an injured native animal.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-WLD-2023-4109',
    events: [
      {
        id: 'evt-3',
        title: 'Bushland Habitat Tree Planting Day',
        date: '2026-10-25',
        location: 'Yarra Valley Sanctuary',
        description: 'Planting 2,000 indigenous trees to secure a vital koala habitat bridge.',
      },
    ],
  },
  {
    id: 'charity-youth',
    name: 'Junior Pathways Golf & Education Trust',
    category: 'youth',
    tagline: 'Equipping underprivileged youth with sport mentorship and STEM bursaries',
    description:
      'Breaking economic barriers by providing golf equipment, PGA coaching, and academic tutoring to students from under-resourced public secondary schools.',
    mission:
      'Using sport values, discipline, and academic sponsorship to open pathways to university and collegiate scholarships.',
    imageUrl:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹5,000 ($60) supplies a full semester of junior clubs, range passes, and STEM tutoring for a student.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-YTH-2022-8114',
    events: [
      {
        id: 'evt-4',
        title: 'NextGen Junior Invitational',
        date: '2026-11-14',
        location: 'Albert Park Golf Course',
        description:
          'Celebratory stroke-and-stableford showcase honoring scholarship recipients.',
      },
    ],
  },
  {
    id: 'charity-veterans',
    name: 'Frontline Veterans Rehabilitation Fund',
    category: 'veterans',
    tagline: 'Mental health resilience, adaptive recreation, and transitional careers',
    description:
      'Supporting military and first-responder veterans coping with PTSD and service injuries through specialized peer-led sports therapy and adaptive athletics.',
    mission:
      'Empowering returning servicemen and women with community brotherhood, adaptive wellness retreats, and certified career training.',
    imageUrl:
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹2,000 ($24) sponsors a comprehensive clinical peer-support and outdoor mobility session.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-VET-2021-3310',
    events: [
      {
        id: 'evt-5',
        title: 'Heroes Cup Adaptive Golf Classic',
        date: '2026-11-22',
        location: 'Huntingdale Golf Club',
        description:
          'Annual team tournament pairing veterans with corporate partners for veteran transition funds.',
      },
    ],
  },
  {
    id: 'charity-healthcare',
    name: 'Community Pediatric Heart Care',
    category: 'healthcare',
    tagline: 'Lifesaving cardiac surgeries for children from low-income families',
    description:
      'Partnering with premier pediatric cardiology hospitals to provide zero-cost open-heart surgeries and diagnostic echocardiograms for vulnerable children.',
    mission:
      'Ensuring no child is denied curative cardiovascular surgery due to financial distress.',
    imageUrl:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹10,000 ($120) directly subsidizes cardiac catheterization consumables and ICU recovery costs.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-HLT-2023-7721',
    events: [],
  },
  {
    id: 'charity-reforestation',
    name: 'Clean Watersheds & Reforestation Alliance',
    category: 'environment',
    tagline: 'Restoring native catchment forests to protect regional drinking water',
    description:
      'Stabilizing riverbanks and restoring native headwater forests surrounding regional dams to eliminate runoff pollution and restore native bird sanctuaries.',
    mission: 'Protecting municipal water supplies through organic bioswales and riparian planting.',
    imageUrl:
      'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    impactStatement:
      'Every ₹1,000 ($12) buys, protects, and monitors 5 native deep-root riparian shrubs for 3 years.',
    totalRaised: 0,
    supporterCount: 0,
    featured: false,
    active: true,
    taxId: '80G-ENV-2025-1104',
    events: [],
  },
];

// Only core admin account is seeded. All users create themselves.
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    email: 'admin@digitalheroes.co.in',
    name: 'Marcus Vance',
    role: 'admin',
    handicapIndex: 9.2,
    homeClub: 'Metropolitan Golf Club',
    ghinOrMemberId: 'MGC-0012',
    phone: '+91 98201 54321',
    createdAt: '2026-01-01T00:00:00Z',
    subscription: {
      plan: 'yearly',
      planId: 'plan-yearly',
      status: 'active',
      price: 9990,
      billingInterval: 'year',
      startDate: '2026-01-01T00:00:00Z',
      renewalDate: '2027-01-01T00:00:00Z',
      charityContributionPct: 25,
      selectedCharityId: 'charity-ocean',
      autoRenew: true,
    },
  },
];

export const INITIAL_SCORES: GolfScore[] = [];

export const INITIAL_DRAWS: Draw[] = [
  {
    id: 'DRW-2026-09',
    name: 'September 2026 Monthly Draw',
    monthYear: '2026-09',
    drawDate: '2026-09-30',
    status: 'upcoming',
    drawMethod: 'algorithmic',
    drawMethodRationale: 'Algorithmic frequency weighting across active participant Stableford scores.',
    eligibleSubscribersCount: 0,
    activeSubscribersBase: 0,
    subscriptionRevenue: 0,
    prizePoolAllocationPct: 40,
    basePrizePool: 0,
    rolloverFromPrevious: 0,
    totalPrizePool: 0,
    winningNumbers: [],
    tierBreakdown: {
      tier5: {
        matchCount: 5,
        poolSharePct: 40,
        allocatedPool: 0,
        winnerCount: 0,
        perWinnerPrize: 0,
        isJackpot: true,
        rolledOver: false,
        rolloverAmount: 0,
      },
      tier4: {
        matchCount: 4,
        poolSharePct: 35,
        allocatedPool: 0,
        winnerCount: 0,
        perWinnerPrize: 0,
        isJackpot: false,
        rolledOver: false,
        rolloverAmount: 0,
      },
      tier3: {
        matchCount: 3,
        poolSharePct: 25,
        allocatedPool: 0,
        winnerCount: 0,
        perWinnerPrize: 0,
        isJackpot: false,
        rolledOver: false,
        rolloverAmount: 0,
      },
    },
  },
];

export const INITIAL_WINNERS: WinnerRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    actor: 'admin@digitalheroes.co.in',
    action: 'INITIALIZE_PLATFORM',
    details: 'Digital Heroes production platform initialized with clean database schema, subscription plans, and accredited charities.',
    timestamp: '2026-01-01T00:00:00Z',
  },
];

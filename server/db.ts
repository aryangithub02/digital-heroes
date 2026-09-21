/**
 * Digital Heroes — Central In-Memory & File-Backed Persistent Database
 * Source of Truth: Digital Heroes PRD (Level 1, 2026)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  applyRollingScores,
  calculateCharityContribution,
  calculateMatches,
  calculatePrizePoolDistribution,
  checkDrawEligibility,
  generateDrawNumbers,
  SCORE_RULES,
  validateScoreDate,
  validateStablefordScore,
} from '../src/services/businessLogic';
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
} from '../src/types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CHARITIES,
  INITIAL_CONFIG,
  INITIAL_DRAWS,
  INITIAL_PLANS,
  INITIAL_SCORES,
  INITIAL_USERS,
  INITIAL_WINNERS,
} from './seedData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TEMP_DB_FILE = path.join(DATA_DIR, 'db.json.tmp');

export interface DatabaseSchema {
  config: SystemConfig;
  plans: SubscriptionPlan[];
  users: UserProfile[];
  scores: GolfScore[];
  charities: Charity[];
  draws: Draw[];
  winners: WinnerRecord[];
  donations: IndependentDonation[];
  auditLogs: AuditLogEntry[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.plans || parsed.plans.length === 0) {
          parsed.plans = [...INITIAL_PLANS];
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to load existing db.json, re-initializing fresh database:', err);
    }

    const initial = this.generateInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  private generateInitialDatabase(): DatabaseSchema {
    const defaultSalt = generateSalt();
    const defaultHash = hashPassword('DigitalHeroes2026!', defaultSalt);

    const users: UserProfile[] = INITIAL_USERS.map((u) => ({
      ...u,
      passwordSalt: defaultSalt,
      passwordHash: defaultHash,
    }));

    return {
      config: { ...INITIAL_CONFIG },
      plans: [...INITIAL_PLANS],
      users,
      scores: [...INITIAL_SCORES],
      charities: [...INITIAL_CHARITIES],
      draws: [...INITIAL_DRAWS],
      winners: [...INITIAL_WINNERS],
      donations: [],
      auditLogs: [...INITIAL_AUDIT_LOGS],
    };
  }

  // ==========================================
  // CONFIG & SUBSCRIPTION PLANS
  // ==========================================
  getConfig(): SystemConfig {
    return { ...this.data.config };
  }

  updateConfig(updates: Partial<SystemConfig>, actor: string): SystemConfig {
    this.data.config = { ...this.data.config, ...updates };

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'UPDATE_SYSTEM_CONFIG',
      details: `Config updated. Prize Pool: ${this.data.config.prizePoolAllocationPct}%, Monthly: ₹${this.data.config.monthlyPlanPrice}, Method: ${this.data.config.defaultDrawMethod}`,
      timestamp: new Date().toISOString(),
    });

    this.save();
    return this.data.config;
  }

  getSubscriptionPlans(activeOnly = true): SubscriptionPlan[] {
    if (activeOnly) {
      return this.data.plans.filter((p) => p.active);
    }
    return this.data.plans;
  }

  getSubscriptionPlanById(id: string): SubscriptionPlan | undefined {
    return this.data.plans.find((p) => p.id === id || p.code === id);
  }

  createSubscriptionPlan(
    planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>,
    actor: string
  ): SubscriptionPlan {
    const now = new Date().toISOString();
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${planData.code || Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.plans.push(newPlan);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'CREATE_SUBSCRIPTION_PLAN',
      details: `Created subscription plan: "${newPlan.name}" (${newPlan.code}) priced at ₹${newPlan.priceINR}.`,
      timestamp: now,
      resultId: newPlan.id,
    });

    this.save();
    return newPlan;
  }

  updateSubscriptionPlan(
    id: string,
    updates: Partial<SubscriptionPlan>,
    actor: string
  ): SubscriptionPlan {
    const plan = this.getSubscriptionPlanById(id);
    if (!plan) {
      throw new Error(`Subscription plan ${id} not found.`);
    }

    Object.assign(plan, updates, { updatedAt: new Date().toISOString() });

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'UPDATE_SUBSCRIPTION_PLAN',
      details: `Updated subscription plan "${plan.name}".`,
      timestamp: new Date().toISOString(),
      resultId: plan.id,
    });

    this.save();
    return plan;
  }

  // ==========================================
  // USERS & AUTHENTICATION
  // ==========================================
  getUsers(): UserProfile[] {
    return this.data.users.map((u) => {
      const { passwordHash, passwordSalt, ...safeUser } = u;
      return safeUser as UserProfile;
    });
  }

  getUserById(id: string): UserProfile | undefined {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return undefined;
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser as UserProfile;
  }

  getUserByEmail(email: string): UserProfile | undefined {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return undefined;
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser as UserProfile;
  }

  authenticateUser(email: string, password?: string): UserProfile {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error(`No account found with email "${email}".`);
    }

    // If password provided, verify hash
    if (password && user.passwordHash && user.passwordSalt) {
      const calculatedHash = hashPassword(password, user.passwordSalt);
      if (calculatedHash !== user.passwordHash) {
        throw new Error('Invalid email or password.');
      }
    }

    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser as UserProfile;
  }

  createUser(userData: {
    name: string;
    email: string;
    password?: string;
    role?: 'subscriber' | 'admin';
    plan: 'monthly' | 'yearly';
    selectedCharityId: string;
    charityContributionPct?: number;
    handicapIndex?: number;
    homeClub?: string;
    ghinOrMemberId?: string;
  }): UserProfile {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error(`An account with email ${userData.email} already exists.`);
    }

    const planCode = userData.plan || 'monthly';
    const plan = this.getSubscriptionPlanById(`plan-${planCode}`) || this.getSubscriptionPlanById(planCode);
    const price = plan ? plan.priceINR : planCode === 'yearly' ? 9990 : 999;

    const charityPct = Math.max(
      plan ? plan.minCharityPct : this.data.config.minCharityPct,
      userData.charityContributionPct || (plan ? plan.defaultCharityPct : this.data.config.defaultCharityPct)
    );

    const now = new Date();
    const renewal = new Date(now);
    if (userData.plan === 'yearly') {
      renewal.setFullYear(renewal.getFullYear() + 1);
    } else {
      renewal.setMonth(renewal.getMonth() + 1);
    }

    const salt = generateSalt();
    const hash = hashPassword(userData.password || 'DigitalHeroes2026!', salt);

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'subscriber',
      passwordSalt: salt,
      passwordHash: hash,
      handicapIndex: userData.handicapIndex !== undefined ? Number(userData.handicapIndex) : 15.0,
      homeClub: userData.homeClub || 'Unattached / Social Member',
      ghinOrMemberId: userData.ghinOrMemberId || `DH-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: now.toISOString(),
      subscription: {
        plan: userData.plan,
        planId: plan ? plan.id : `plan-${userData.plan}`,
        status: 'active',
        price,
        billingInterval: userData.plan === 'yearly' ? 'year' : 'month',
        startDate: now.toISOString(),
        renewalDate: renewal.toISOString(),
        charityContributionPct: charityPct,
        selectedCharityId: userData.selectedCharityId,
        autoRenew: true,
      },
    };

    this.data.users.unshift(newUser);

    // Update charity supporter count and total raised
    const charity = this.data.charities.find((c) => c.id === userData.selectedCharityId);
    if (charity) {
      charity.supporterCount += 1;
      const { charityAmount } = calculateCharityContribution(price, charityPct);
      charity.totalRaised += charityAmount;
    }

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor: newUser.email,
      action: 'USER_REGISTERED',
      details: `New subscriber registered with ${userData.plan} plan supporting ${charity?.name || userData.selectedCharityId} at ${charityPct}%.`,
      timestamp: now.toISOString(),
      resultId: newUser.id,
    });

    this.save();

    const { passwordHash, passwordSalt, ...safeUser } = newUser;
    return safeUser as UserProfile;
  }

  updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User ${id} not found.`);
    }

    // Preserve password fields and ID
    const current = this.data.users[index];
    this.data.users[index] = {
      ...current,
      ...updates,
      id,
      passwordHash: current.passwordHash,
      passwordSalt: current.passwordSalt,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    const { passwordHash, passwordSalt, ...safeUser } = this.data.users[index];
    return safeUser as UserProfile;
  }

  updateUserPassword(id: string, oldPass: string, newPass: string): void {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error(`User ${id} not found.`);

    if (user.passwordHash && user.passwordSalt) {
      const oldCalculated = hashPassword(oldPass, user.passwordSalt);
      if (oldCalculated !== user.passwordHash) {
        throw new Error('Current password is incorrect.');
      }
    }

    const newSalt = generateSalt();
    user.passwordSalt = newSalt;
    user.passwordHash = hashPassword(newPass, newSalt);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor: user.email,
      action: 'PASSWORD_UPDATED',
      details: `Password was successfully updated for user ${user.email}.`,
      timestamp: new Date().toISOString(),
      resultId: user.id,
    });

    this.save();
  }

  updateUserSubscription(
    userId: string,
    subUpdates: Partial<UserProfile['subscription']>,
    actor: string
  ): UserProfile {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    const prevCharityId = user.subscription.selectedCharityId;

    if (subUpdates.charityContributionPct !== undefined) {
      if (subUpdates.charityContributionPct < this.data.config.minCharityPct) {
        throw new Error(
          `Charity contribution must be at least ${this.data.config.minCharityPct}%.`
        );
      }
    }

    if (subUpdates.status === 'cancelled' && user.subscription.status !== 'cancelled') {
      subUpdates.cancelledAt = new Date().toISOString();
      subUpdates.autoRenew = false;
    }

    user.subscription = {
      ...user.subscription,
      ...subUpdates,
    };

    // If charity changed, adjust supporter counts
    if (subUpdates.selectedCharityId && subUpdates.selectedCharityId !== prevCharityId) {
      const oldCharity = this.data.charities.find((c) => c.id === prevCharityId);
      if (oldCharity && oldCharity.supporterCount > 0) {
        oldCharity.supporterCount -= 1;
      }
      const newCharity = this.data.charities.find((c) => c.id === subUpdates.selectedCharityId);
      if (newCharity) {
        newCharity.supporterCount += 1;
      }
    }

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'UPDATE_SUBSCRIPTION',
      details: `Updated subscription for ${user.name} (${user.email}). Status: ${user.subscription.status}, Plan: ${user.subscription.plan}, Charity %: ${user.subscription.charityContributionPct}%`,
      timestamp: new Date().toISOString(),
      resultId: user.id,
    });

    this.save();
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return safeUser as UserProfile;
  }

  // ==========================================
  // GOLF SCORES
  // ==========================================
  getUserScores(userId: string): GolfScore[] {
    return this.data.scores
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addScore(
    userId: string,
    scoreData: { score: number; date: string; course?: string; holes?: 9 | 18; handicapApplied?: number }
  ): { score: GolfScore; retainedScores: GolfScore[]; droppedScore?: GolfScore } {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    if (user.subscription.status !== 'active') {
      throw new Error(
        `Subscription is currently ${user.subscription.status}. An active subscription is required to log Stableford scores.`
      );
    }

    // Validation 1: Stableford range 1-45
    const scoreValRes = validateStablefordScore(scoreData.score);
    if (!scoreValRes.valid) {
      throw new Error(scoreValRes.error);
    }

    // Validation 2: Unique date per user and non-future
    const existing = this.getUserScores(userId);
    const dateValRes = validateScoreDate(scoreData.date, existing);
    if (!dateValRes.valid) {
      throw new Error(dateValRes.error);
    }

    const newScore: GolfScore = {
      id: `score-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      date: scoreData.date,
      score: scoreData.score,
      course: scoreData.course || user.homeClub || 'Unspecified Course',
      holes: scoreData.holes || 18,
      handicapApplied: scoreData.handicapApplied || Math.round(user.handicapIndex),
      createdAt: new Date().toISOString(),
    };

    // Apply rolling 5-score window logic
    const { updatedScores, droppedScore } = applyRollingScores(existing, newScore);

    // Update global scores list
    this.data.scores = this.data.scores.filter((s) => s.userId !== userId);
    this.data.scores.push(...updatedScores);

    this.save();
    return { score: newScore, retainedScores: updatedScores, droppedScore };
  }

  updateScore(
    scoreId: string,
    userId: string,
    updates: { score?: number; date?: string; course?: string; holes?: 9 | 18 }
  ): GolfScore {
    const existing = this.getUserScores(userId);
    const target = existing.find((s) => s.id === scoreId);
    if (!target) {
      throw new Error(`Score entry ${scoreId} not found.`);
    }

    if (updates.score !== undefined) {
      const v = validateStablefordScore(updates.score);
      if (!v.valid) throw new Error(v.error);
      target.score = updates.score;
    }

    if (updates.date !== undefined && updates.date !== target.date) {
      const v = validateScoreDate(updates.date, existing, scoreId);
      if (!v.valid) throw new Error(v.error);
      target.date = updates.date;
    }

    if (updates.course !== undefined) target.course = updates.course;
    if (updates.holes !== undefined) target.holes = updates.holes;
    target.updatedAt = new Date().toISOString();

    // Re-sort user's scores reverse-chronologically
    this.data.scores = this.data.scores
      .filter((s) => s.id !== scoreId)
      .concat(target)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.save();
    return target;
  }

  deleteScore(scoreId: string, userId: string): void {
    const index = this.data.scores.findIndex((s) => s.id === scoreId && s.userId === userId);
    if (index === -1) {
      throw new Error(`Score entry ${scoreId} not found or unauthorized.`);
    }
    this.data.scores.splice(index, 1);
    this.save();
  }

  // ==========================================
  // CHARITIES
  // ==========================================
  getCharities(): Charity[] {
    return this.data.charities.filter((c) => c.active);
  }

  getAllCharitiesAdmin(): Charity[] {
    return this.data.charities;
  }

  getCharityById(id: string): Charity | undefined {
    return this.data.charities.find((c) => c.id === id);
  }

  createCharity(
    data: Omit<Charity, 'id' | 'totalRaised' | 'supporterCount'>,
    actor: string
  ): Charity {
    const now = new Date().toISOString();
    const newCharity: Charity = {
      ...data,
      id: `charity-${Date.now()}`,
      totalRaised: 0,
      supporterCount: 0,
      active: data.active !== undefined ? data.active : true,
      featured: data.featured !== undefined ? data.featured : false,
      events: data.events || [],
      createdAt: now,
      updatedAt: now,
    };
    this.data.charities.push(newCharity);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'CREATE_CHARITY',
      details: `Created new charity: "${newCharity.name}" in category ${newCharity.category}.`,
      timestamp: now,
      resultId: newCharity.id,
    });

    this.save();
    return newCharity;
  }

  updateCharity(id: string, updates: Partial<Charity>, actor: string): Charity {
    const charity = this.getCharityById(id);
    if (!charity) {
      throw new Error(`Charity ${id} not found.`);
    }
    Object.assign(charity, updates, { updatedAt: new Date().toISOString() });

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'UPDATE_CHARITY',
      details: `Updated charity details for "${charity.name}".`,
      timestamp: new Date().toISOString(),
      resultId: charity.id,
    });

    this.save();
    return charity;
  }

  deleteCharity(id: string, actor: string): void {
    const charity = this.getCharityById(id);
    if (!charity) throw new Error(`Charity ${id} not found.`);

    // Soft delete / deactivate to preserve historical integrity
    charity.active = false;
    charity.updatedAt = new Date().toISOString();

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'DEACTIVATE_CHARITY',
      details: `Deactivated charity listing: "${charity.name}".`,
      timestamp: new Date().toISOString(),
      resultId: charity.id,
    });

    this.save();
  }

  recordDonation(donation: {
    userId?: string;
    donorName: string;
    donorEmail: string;
    charityId: string;
    amount: number;
    message?: string;
  }): IndependentDonation {
    const charity = this.getCharityById(donation.charityId);
    if (!charity) throw new Error(`Charity ${donation.charityId} not found.`);

    const record: IndependentDonation = {
      id: `don-${Date.now()}`,
      userId: donation.userId,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      charityId: donation.charityId,
      charityName: charity.name,
      amount: donation.amount,
      date: new Date().toISOString(),
      message: donation.message,
    };

    this.data.donations.push(record);
    charity.totalRaised += donation.amount;

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor: donation.donorEmail,
      action: 'INDEPENDENT_DONATION',
      details: `Direct contribution of ₹${donation.amount.toLocaleString()} received for "${charity.name}".`,
      timestamp: record.date,
      resultId: record.id,
    });

    this.save();
    return record;
  }

  // ==========================================
  // DRAWS, SIMULATION & PUBLISHING
  // ==========================================
  getDraws(): Draw[] {
    return this.data.draws;
  }

  getDrawById(id: string): Draw | undefined {
    return this.data.draws.find((d) => d.id === id);
  }

  getCurrentDraw(): Draw {
    const openDraw = this.data.draws.find((d) => d.status === 'open' || d.status === 'simulated' || d.status === 'upcoming');
    if (openDraw) return openDraw;
    return this.data.draws[this.data.draws.length - 1];
  }

  createDraw(
    drawData: {
      id?: string;
      name: string;
      monthYear: string;
      drawDate: string;
      drawMethod?: DrawMethod;
      drawMethodRationale?: string;
    },
    actor: string
  ): Draw {
    const id = drawData.id || `DRW-${drawData.monthYear}`;
    const existing = this.getDrawById(id);
    if (existing) {
      throw new Error(`Draw with ID ${id} already exists.`);
    }

    const activeSubscribers = this.data.users.filter(
      (u) => u.subscription.status === 'active' && u.role === 'subscriber'
    );

    const subscriptionRevenue = activeSubscribers.length * this.data.config.monthlyPlanPrice;
    const basePrizePool = Math.round(
      subscriptionRevenue * (this.data.config.prizePoolAllocationPct / 100)
    );
    const rollover = this.data.config.currentRolloverJackpot;

    const dummyBreakdown = calculatePrizePoolDistribution(
      activeSubscribers.length,
      this.data.config.monthlyPlanPrice,
      this.data.config.prizePoolAllocationPct,
      rollover,
      { tier5Count: 0, tier4Count: 0, tier3Count: 0 }
    ).tierBreakdown;

    const newDraw: Draw = {
      id,
      name: drawData.name,
      monthYear: drawData.monthYear,
      drawDate: drawData.drawDate,
      status: 'upcoming',
      drawMethod: drawData.drawMethod || this.data.config.defaultDrawMethod,
      drawMethodRationale: drawData.drawMethodRationale || 'Scheduled monthly community draw.',
      eligibleSubscribersCount: activeSubscribers.length,
      activeSubscribersBase: activeSubscribers.length,
      subscriptionRevenue,
      prizePoolAllocationPct: this.data.config.prizePoolAllocationPct,
      basePrizePool,
      rolloverFromPrevious: rollover,
      totalPrizePool: basePrizePool + rollover,
      winningNumbers: [],
      tierBreakdown: dummyBreakdown,
    };

    this.data.draws.push(newDraw);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'CREATE_DRAW',
      details: `Created new draw: "${newDraw.name}" (${newDraw.id}) scheduled for ${newDraw.drawDate}.`,
      timestamp: new Date().toISOString(),
      resultId: newDraw.id,
    });

    this.save();
    return newDraw;
  }

  simulateDraw(drawId: string, drawMethod?: DrawMethod, actor?: string): DrawSimulationResult {
    const draw = this.getDrawById(drawId);
    if (!draw) throw new Error(`Draw ${drawId} not found.`);

    const method = drawMethod || draw.drawMethod || this.data.config.defaultDrawMethod;

    // Collect all eligible subscribers (active subscription + at least 1 score)
    const activeSubscribers = this.data.users.filter(
      (u) => u.subscription.status === 'active' && u.role === 'subscriber'
    );

    const eligibleParticipants: Array<{
      user: UserProfile;
      scores: number[];
    }> = [];

    const allScoresForAlgorithm: number[] = [];

    for (const sub of activeSubscribers) {
      const userScores = this.getUserScores(sub.id).map((s) => s.score);
      if (userScores.length > 0) {
        eligibleParticipants.push({ user: sub, scores: userScores });
        allScoresForAlgorithm.push(...userScores);
      }
    }

    // Generate candidate winning numbers
    const { numbers: candidateWinningNumbers, rationale } = generateDrawNumbers(
      method,
      allScoresForAlgorithm
    );

    // Group winners by tier
    const tier5Winners: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }> = [];
    const tier4Winners: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }> = [];
    const tier3Winners: Array<{ userId: string; userName: string; matchedNumbers: number[]; scores: number[] }> = [];

    for (const p of eligibleParticipants) {
      const { matchCount, matchedNumbers } = calculateMatches(candidateWinningNumbers, p.scores);
      if (matchCount === 5) {
        tier5Winners.push({
          userId: p.user.id,
          userName: p.user.name,
          matchedNumbers,
          scores: p.scores,
        });
      } else if (matchCount === 4) {
        tier4Winners.push({
          userId: p.user.id,
          userName: p.user.name,
          matchedNumbers,
          scores: p.scores,
        });
      } else if (matchCount === 3) {
        tier3Winners.push({
          userId: p.user.id,
          userName: p.user.name,
          matchedNumbers,
          scores: p.scores,
        });
      }
    }

    // Calculate prize pool with tiers
    const poolCalc = calculatePrizePoolDistribution(
      eligibleParticipants.length,
      this.data.config.monthlyPlanPrice,
      this.data.config.prizePoolAllocationPct,
      draw.rolloverFromPrevious || this.data.config.currentRolloverJackpot,
      {
        tier5Count: tier5Winners.length,
        tier4Count: tier4Winners.length,
        tier3Count: tier3Winners.length,
      }
    );

    if (actor) {
      this.addAuditLog({
        id: `aud-${Date.now()}`,
        actor,
        action: 'SIMULATE_DRAW',
        details: `Simulated draw ${draw.name} using ${method}. Numbers: [${candidateWinningNumbers.join(', ')}]. Winners: 5-match: ${tier5Winners.length}, 4-match: ${tier4Winners.length}, 3-match: ${tier3Winners.length}.`,
        timestamp: new Date().toISOString(),
        resultId: draw.id,
      });
      this.save();
    }

    return {
      drawId: draw.id,
      drawName: draw.name,
      drawDate: draw.drawDate,
      drawMethod: method,
      drawMethodRationale: rationale,
      eligibleSubscribersCount: eligibleParticipants.length,
      basePrizePool: poolCalc.basePrizePool,
      rolloverFromPrevious: poolCalc.rolloverFromPrevious,
      totalPrizePool: poolCalc.totalPrizePool,
      winningNumbers: candidateWinningNumbers,
      tierBreakdown: poolCalc.tierBreakdown,
      winners: {
        tier5: tier5Winners,
        tier4: tier4Winners,
        tier3: tier3Winners,
      },
      totalWinnersCount: tier5Winners.length + tier4Winners.length + tier3Winners.length,
      simulatedAt: new Date().toISOString(),
    };
  }

  publishDraw(
    drawId: string,
    simulationResult: DrawSimulationResult,
    actor: string
  ): { draw: Draw; newWinnersCount: number } {
    const draw = this.getDrawById(drawId);
    if (!draw) throw new Error(`Draw ${drawId} not found.`);
    if (draw.status === 'published' || draw.status === 'completed') {
      throw new Error(`Draw ${draw.id} has already been published.`);
    }

    const now = new Date().toISOString();

    // Lock winning numbers and prize breakdown
    draw.winningNumbers = [...simulationResult.winningNumbers];
    draw.drawMethod = simulationResult.drawMethod;
    draw.drawMethodRationale = simulationResult.drawMethodRationale;
    draw.eligibleSubscribersCount = simulationResult.eligibleSubscribersCount;
    draw.basePrizePool = simulationResult.basePrizePool;
    draw.rolloverFromPrevious = simulationResult.rolloverFromPrevious;
    draw.totalPrizePool = simulationResult.totalPrizePool;
    draw.tierBreakdown = simulationResult.tierBreakdown;
    draw.status = 'published';
    draw.publishedAt = now;
    draw.publishedBy = actor;

    // Rollover rule: If tier 5 jackpot has 0 winners, set rollover jackpot for subsequent draws
    if (simulationResult.tierBreakdown.tier5.rolledOver) {
      this.data.config.currentRolloverJackpot =
        simulationResult.tierBreakdown.tier5.rolloverAmount;
    } else {
      this.data.config.currentRolloverJackpot = 0;
    }

    // Create Winner records
    const newWinners: WinnerRecord[] = [];

    // Tier 5 winners
    for (const w of simulationResult.winners.tier5) {
      const u = this.getUserById(w.userId);
      newWinners.push({
        id: `win-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        drawId: draw.id,
        drawName: draw.name,
        userId: w.userId,
        userName: w.userName,
        userEmail: u?.email || 'subscriber@example.com',
        matchCount: 5,
        matchedNumbers: w.matchedNumbers,
        userScoresAtDraw: w.scores,
        winningNumbers: draw.winningNumbers,
        prizeAmount: simulationResult.tierBreakdown.tier5.perWinnerPrize,
        verificationStatus: 'required',
        paymentStatus: 'pending',
      });
    }

    // Tier 4 winners
    for (const w of simulationResult.winners.tier4) {
      const u = this.getUserById(w.userId);
      newWinners.push({
        id: `win-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        drawId: draw.id,
        drawName: draw.name,
        userId: w.userId,
        userName: w.userName,
        userEmail: u?.email || 'subscriber@example.com',
        matchCount: 4,
        matchedNumbers: w.matchedNumbers,
        userScoresAtDraw: w.scores,
        winningNumbers: draw.winningNumbers,
        prizeAmount: simulationResult.tierBreakdown.tier4.perWinnerPrize,
        verificationStatus: 'required',
        paymentStatus: 'pending',
      });
    }

    // Tier 3 winners
    for (const w of simulationResult.winners.tier3) {
      const u = this.getUserById(w.userId);
      newWinners.push({
        id: `win-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        drawId: draw.id,
        drawName: draw.name,
        userId: w.userId,
        userName: w.userName,
        userEmail: u?.email || 'subscriber@example.com',
        matchCount: 3,
        matchedNumbers: w.matchedNumbers,
        userScoresAtDraw: w.scores,
        winningNumbers: draw.winningNumbers,
        prizeAmount: simulationResult.tierBreakdown.tier3.perWinnerPrize,
        verificationStatus: 'required',
        paymentStatus: 'pending',
      });
    }

    this.data.winners.unshift(...newWinners);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'PUBLISH_DRAW',
      details: `Published draw ${draw.name} (${draw.id}). Winning numbers: [${draw.winningNumbers.join(', ')}]. ${newWinners.length} winners generated. Rollover: ₹${this.data.config.currentRolloverJackpot.toLocaleString()}.`,
      timestamp: now,
      resultId: draw.id,
    });

    this.save();
    return { draw, newWinnersCount: newWinners.length };
  }

  // ==========================================
  // WINNERS, VERIFICATION & PAYOUTS
  // ==========================================
  getWinners(userId?: string): WinnerRecord[] {
    if (userId) {
      return this.data.winners.filter((w) => w.userId === userId);
    }
    return this.data.winners;
  }

  getWinnerById(id: string): WinnerRecord | undefined {
    return this.data.winners.find((w) => w.id === id);
  }

  submitWinnerProof(
    winnerId: string,
    userId: string,
    proofImageUrl: string,
    notes?: string
  ): WinnerRecord {
    const winner = this.getWinnerById(winnerId);
    if (!winner) throw new Error(`Winner record ${winnerId} not found.`);
    if (winner.userId !== userId) {
      throw new Error('Unauthorized: You can only submit verification for your own prize claims.');
    }

    winner.verificationStatus = 'submitted';
    winner.proofImageUrl = proofImageUrl;
    winner.proofSubmittedAt = new Date().toISOString();
    if (notes) winner.proofNotes = notes;
    winner.rejectionReason = undefined;

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor: winner.userEmail,
      action: 'SUBMIT_VERIFICATION_PROOF',
      details: `Uploaded scorecard verification proof for ${winner.drawName} (${winner.matchCount}-Match Prize: ₹${winner.prizeAmount.toLocaleString()}).`,
      timestamp: winner.proofSubmittedAt,
      resultId: winner.id,
    });

    this.save();
    return winner;
  }

  reviewWinnerProof(
    winnerId: string,
    decision: 'approve' | 'reject',
    notes: string,
    rejectionReason: string | undefined,
    actor: string
  ): WinnerRecord {
    const winner = this.getWinnerById(winnerId);
    if (!winner) throw new Error(`Winner record ${winnerId} not found.`);

    const now = new Date().toISOString();
    winner.reviewedBy = actor;
    winner.reviewedAt = now;

    if (decision === 'approve') {
      winner.verificationStatus = 'approved';
      winner.rejectionReason = undefined;
      winner.paymentStatus = 'processing';
      if (notes) winner.adminNotes = notes;
    } else {
      winner.verificationStatus = 'rejected';
      winner.rejectionReason = rejectionReason || 'Scorecard evidence does not match submitted dates or Stableford points.';
      winner.paymentStatus = 'pending';
      if (notes) winner.adminNotes = notes;
    }

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: decision === 'approve' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
      details: `${decision === 'approve' ? 'Approved' : 'Rejected'} verification for ${winner.userName} (Prize ₹${winner.prizeAmount.toLocaleString()}). Notes: ${notes || rejectionReason || 'None'}`,
      timestamp: now,
      resultId: winner.id,
    });

    this.save();
    return winner;
  }

  markWinnerPaid(
    winnerId: string,
    paymentReference: string,
    actor: string
  ): WinnerRecord {
    const winner = this.getWinnerById(winnerId);
    if (!winner) throw new Error(`Winner record ${winnerId} not found.`);

    if (winner.verificationStatus !== 'approved') {
      throw new Error(
        `Cannot disburse payout: Verification is currently "${winner.verificationStatus}". Payouts require "approved" status.`
      );
    }

    if (winner.paymentStatus === 'paid') {
      throw new Error(`Payout for ${winnerId} has already been marked as paid.`);
    }

    const now = new Date().toISOString();
    winner.paymentStatus = 'paid';
    winner.paymentReference = paymentReference || `PAY-DH-${Date.now()}`;
    winner.paidAt = now;

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      actor,
      action: 'MARK_PAYOUT_PAID',
      details: `Payout of ₹${winner.prizeAmount.toLocaleString()} disbursed to ${winner.userName}. Ref: ${winner.paymentReference}`,
      timestamp: now,
      resultId: winner.id,
    });

    this.save();
    return winner;
  }

  // ==========================================
  // UNIFIED USER DASHBOARD DATA
  // ==========================================
  getDashboardData(userId: string): DashboardData {
    const user = this.getUserById(userId);
    if (!user) throw new Error(`User ${userId} not found.`);

    const scores = this.getUserScores(userId);
    const selectedCharity = user.subscription.selectedCharityId
      ? this.getCharityById(user.subscription.selectedCharityId) || null
      : null;
    const upcomingDraw = this.getCurrentDraw();
    const winnings = this.getWinners(userId);
    const plan = this.getSubscriptionPlanById(user.subscription.planId || `plan-${user.subscription.plan}`);

    const eligibility = checkDrawEligibility(user.subscription, scores);

    return {
      user,
      subscription: user.subscription,
      plan,
      scores,
      selectedCharity,
      upcomingDraw,
      winnings,
      eligibility,
    };
  }

  // ==========================================
  // AUDIT LOGS & ANALYTICS
  // ==========================================
  getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs.slice().sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  addAuditLog(entry: AuditLogEntry): void {
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
  }

  getAnalytics(): SystemAnalytics {
    const activeSubscribers = this.data.users.filter(
      (u) => u.subscription.status === 'active' && u.role === 'subscriber'
    ).length;

    const totalPrizePoolDistributed = this.data.winners
      .filter((w) => w.paymentStatus === 'paid')
      .reduce((sum, w) => sum + w.prizeAmount, 0);

    const totalCharityContributed = this.data.charities.reduce(
      (sum, c) => sum + c.totalRaised,
      0
    );

    const pendingVerifications = this.data.winners.filter(
      (w) => w.verificationStatus === 'submitted'
    ).length;

    const pendingPayouts = this.data.winners.filter(
      (w) => w.verificationStatus === 'approved' && w.paymentStatus !== 'paid'
    ).length;

    const publishedDraws = this.data.draws.filter((d) => d.status === 'published' || d.status === 'completed');

    return {
      totalUsers: this.data.users.length,
      activeSubscribers,
      totalPrizePoolDistributed,
      currentRolloverJackpot: this.data.config.currentRolloverJackpot,
      totalCharityContributed,
      pendingVerifications,
      pendingPayouts,
      drawStats: {
        totalDrawsConducted: publishedDraws.length,
        totalWinnersAwarded: this.data.winners.length,
        averageParticipantPerDraw:
          publishedDraws.length > 0
            ? Math.round(
                publishedDraws.reduce((s, d) => s + d.eligibleSubscribersCount, 0) /
                  publishedDraws.length
              )
            : 0,
      },
    };
  }

  resetToDemo(): DatabaseSchema {
    this.data = this.generateInitialDatabase();
    this.save();
    return this.data;
  }
}

export const db = new Database();

/**
 * Digital Heroes — Production Express API Server & Vite Integration
 * Source of Truth: Digital Heroes PRD (Level 1, 2026)
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { initPostgresDatabase } from './server/postgres';
import { DrawMethod, UserProfile } from './src/types';

async function startServer() {
  await initPostgresDatabase();
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // Session / Authentication resolution helper
  // Checks header `x-user-id` or query param `asUserId`, or falls back to 'visitor' (public unauthenticated visitor)
  let currentActiveUserId: string = 'visitor';

  const getRequestUser = (req: Request): UserProfile | null => {
    const requestedId =
      (req.headers['x-user-id'] as string) ||
      (req.query.asUserId as string) ||
      currentActiveUserId;

    if (requestedId === 'visitor') {
      return null;
    }
    return db.getUserById(requestedId) || db.getUserByEmail(requestedId) || null;
  };

  // Auth Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = getRequestUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    (req as any).user = user;
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = getRequestUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access privileges required.' });
    }
    (req as any).user = user;
    next();
  };

  // ==========================================
  // 1. AUTH & SESSION ENDPOINTS
  // ==========================================
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getRequestUser(req);
    res.json({
      user,
      isVisitor: !user,
      activePersonaId: user ? user.id : 'visitor',
    });
  });

  app.post('/api/auth/switch-persona', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId === 'visitor') {
      currentActiveUserId = 'visitor';
      return res.json({ success: true, activePersonaId: 'visitor', user: null });
    }
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: `Persona ${userId} not found.` });
    }
    currentActiveUserId = user.id;
    res.json({ success: true, activePersonaId: user.id, user });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required to sign in.' });
      }
      const user = db.authenticateUser(email, password);
      currentActiveUserId = user.id;
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  app.post('/api/auth/signup', (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        plan: rawPlan,
        planId,
        selectedCharityId,
        charityContributionPct,
        handicapIndex,
        homeClub,
        ghinOrMemberId,
      } = req.body;

      const plan = rawPlan || (planId === 'plan-yearly' ? 'yearly' : (planId === 'plan-monthly' ? 'monthly' : planId));

      if (!name || !email || !password || !plan || !selectedCharityId) {
        return res.status(400).json({
          error: 'Name, email, password, subscription plan, and selected charity are required.',
        });
      }

      if (typeof password !== 'string' || password.trim().length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long.',
        });
      }

      const newUser = db.createUser({
        name,
        email,
        password,
        plan,
        selectedCharityId,
        charityContributionPct: Number(charityContributionPct) || 15,
        handicapIndex: Number(handicapIndex) || 14.0,
        homeClub,
        ghinOrMemberId,
      });

      currentActiveUserId = newUser.id;
      res.status(201).json({ success: true, user: newUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    currentActiveUserId = 'visitor';
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    try {
      db.updateUserPassword(user.id, oldPassword || '', newPassword);
      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 2. SUBSCRIPTION PLANS & SYSTEM CONFIG
  // ==========================================
  app.get('/api/subscription-plans', (_req: Request, res: Response) => {
    res.json(db.getSubscriptionPlans(true));
  });

  app.get('/api/subscription-plans/admin', requireAdmin, (_req: Request, res: Response) => {
    res.json(db.getSubscriptionPlans(false));
  });

  app.post('/api/subscription-plans', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const created = db.createSubscriptionPlan(req.body, user.email);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/subscription-plans/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const updated = db.updateSubscriptionPlan(req.params.id, req.body, user.email);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/config', (_req: Request, res: Response) => {
    res.json(db.getConfig());
  });

  app.patch('/api/config', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const updated = db.updateConfig(req.body, user.email);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 3. USERS & PROFILES
  // ==========================================
  app.get('/api/users', requireAdmin, (_req: Request, res: Response) => {
    res.json(db.getUsers());
  });

  app.get('/api/users/:id', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    if (currentUser.id !== req.params.id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this profile.' });
    }
    const targetUser = db.getUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(targetUser);
  });

  app.patch('/api/users/:id/profile', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    if (currentUser.id !== req.params.id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this user profile.' });
    }
    try {
      const updated = db.updateUserProfile(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/users/:id/subscription', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    if (currentUser.id !== req.params.id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this subscription.' });
    }
    try {
      const actor = currentUser.email;
      const updated = db.updateUserSubscription(req.params.id, req.body, actor);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. UNIFIED USER DASHBOARD API
  // ==========================================
  app.get('/api/dashboard/me', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const dashboard = db.getDashboardData(user.id);
      res.json(dashboard);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 5. GOLF SCORES (STABLEFORD 1-45, ROLLING 5)
  // ==========================================
  app.get('/api/scores', (req: Request, res: Response) => {
    const user = getRequestUser(req);
    const targetUserId = (req.query.userId as string) || (user ? user.id : '');
    if (!targetUserId) {
      return res.json([]);
    }
    const scores = db.getUserScores(targetUserId);
    res.json(scores);
  });

  app.post('/api/scores', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    const { score, date, course, holes, handicapApplied } = req.body;
    try {
      const result = db.addScore(currentUser.id, {
        score: Number(score),
        date,
        course,
        holes: Number(holes) as 9 | 18,
        handicapApplied: handicapApplied !== undefined ? Number(handicapApplied) : undefined,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/scores/:id', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    const { score, date, course, holes } = req.body;
    try {
      const updated = db.updateScore(req.params.id, currentUser.id, {
        score: score !== undefined ? Number(score) : undefined,
        date,
        course,
        holes: holes ? (Number(holes) as 9 | 18) : undefined,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/scores/:id', requireAuth, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserProfile;
    try {
      db.deleteScore(req.params.id, currentUser.id);
      res.json({ success: true, message: 'Score deleted successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 6. CHARITIES & GIVING
  // ==========================================
  app.get('/api/charities', (_req: Request, res: Response) => {
    res.json(db.getCharities());
  });

  app.get('/api/charities/admin', requireAdmin, (_req: Request, res: Response) => {
    res.json(db.getAllCharitiesAdmin());
  });

  app.get('/api/charities/:id', (req: Request, res: Response) => {
    const charity = db.getCharityById(req.params.id);
    if (!charity) {
      return res.status(404).json({ error: 'Charity organization not found.' });
    }
    res.json(charity);
  });

  app.post('/api/charities', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const created = db.createCharity(req.body, user.email);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/charities/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const updated = db.updateCharity(req.params.id, req.body, user.email);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/charities/:id', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      db.deleteCharity(req.params.id, user.email);
      res.json({ success: true, message: 'Charity deactivated successfully.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/charities/:id/donate', (req: Request, res: Response) => {
    try {
      const user = getRequestUser(req);
      const { donorName, donorEmail, amount, message } = req.body;
      if (!donorName || !donorEmail || !amount || Number(amount) <= 0) {
        return res.status(400).json({
          error: 'Donor name, valid email, and positive donation amount are required.',
        });
      }
      const record = db.recordDonation({
        userId: user?.id,
        donorName,
        donorEmail,
        charityId: req.params.id,
        amount: Number(amount),
        message,
      });
      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 7. DRAWS & SIMULATION ENGINE
  // ==========================================
  app.get('/api/draws', (_req: Request, res: Response) => {
    res.json(db.getDraws());
  });

  app.get('/api/draws/current', (_req: Request, res: Response) => {
    res.json(db.getCurrentDraw());
  });

  app.get('/api/draws/:id', (req: Request, res: Response) => {
    const draw = db.getDrawById(req.params.id);
    if (!draw) return res.status(404).json({ error: 'Draw not found.' });
    res.json(draw);
  });

  app.post('/api/draws', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const newDraw = db.createDraw(req.body, user.email);
      res.status(201).json(newDraw);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/draws/:id/simulate', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const { drawMethod } = req.body;
      const simulation = db.simulateDraw(req.params.id, drawMethod as DrawMethod, user.email);
      res.json(simulation);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/draws/:id/publish', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const { simulationResult } = req.body;
      if (!simulationResult || !simulationResult.winningNumbers) {
        return res.status(400).json({
          error: 'A verified simulation result must be provided to publish the draw.',
        });
      }
      const result = db.publishDraw(req.params.id, simulationResult, user.email);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 8. WINNERS, PROOF VERIFICATION & PAYOUTS
  // ==========================================
  app.get('/api/winners', (req: Request, res: Response) => {
    const user = getRequestUser(req);
    const userIdFilter = req.query.userId as string;

    // If regular subscriber asks without userId, filter to self
    if (user && user.role !== 'admin' && !userIdFilter) {
      return res.json(db.getWinners(user.id));
    }
    res.json(db.getWinners(userIdFilter));
  });

  app.get('/api/winners/:id', (req: Request, res: Response) => {
    const winner = db.getWinnerById(req.params.id);
    if (!winner) return res.status(404).json({ error: 'Winner claim not found.' });
    res.json(winner);
  });

  app.post('/api/winners/:id/verify', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const { proofImageUrl, notes } = req.body;
      if (!proofImageUrl) {
        return res.status(400).json({
          error: 'Scorecard screenshot or verification proof URL is required.',
        });
      }
      const updated = db.submitWinnerProof(req.params.id, user.id, proofImageUrl, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/winners/:id/review', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const { decision, notes, rejectionReason } = req.body;
      if (decision !== 'approve' && decision !== 'reject') {
        return res.status(400).json({ error: 'Decision must be "approve" or "reject".' });
      }
      if (decision === 'reject' && !rejectionReason) {
        return res.status(400).json({ error: 'A specific rejection reason is required when declining proof.' });
      }
      const updated = db.reviewWinnerProof(
        req.params.id,
        decision,
        notes || '',
        rejectionReason,
        user.email
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/winners/:id/payout', requireAdmin, (req: Request, res: Response) => {
    const user = (req as any).user as UserProfile;
    try {
      const { paymentReference } = req.body;
      const updated = db.markWinnerPaid(req.params.id, paymentReference, user.email);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 9. ANALYTICS & AUDIT LOGS
  // ==========================================
  app.get('/api/analytics', (_req: Request, res: Response) => {
    res.json(db.getAnalytics());
  });

  app.get('/api/audit-logs', requireAdmin, (_req: Request, res: Response) => {
    res.json(db.getAuditLogs());
  });

  // ==========================================
  // 10. RESET DEMO STATE
  // ==========================================
  app.post('/api/system/reset-demo', requireAdmin, (_req: Request, res: Response) => {
    db.resetToDemo();
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  });

  // Error handler middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'An unexpected internal error occurred.' });
  });

  // Vite middleware in dev vs Static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/scratch/**', '**/.git/**', '**/dist/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Heroes full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

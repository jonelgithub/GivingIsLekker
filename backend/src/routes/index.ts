import { Router } from 'express';
import accountRoutes from './accounts';
import transferRoutes from './transfers';
import mockRoutes from './mock';
import { BankService } from '../services/bank';
import { env } from '../config/env';

const router = Router();

// Public health check and environment status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: env.TARGET_ENV,
    mode: BankService.isMockMode() ? 'MOCK (Stateful In-Memory)' : 'LIVE (API Connectivity)',
    version: '1.0.0',
  });
});

// Banking API Routes namespace
router.use('/pb/accounts', accountRoutes);
router.use('/pb', transferRoutes);
router.use('/mock', mockRoutes);

export default router;

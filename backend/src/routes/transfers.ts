import { Router } from 'express';
import { TransfersController, payMultipleSchema, transferMultipleSchema, payDirectSchema } from '../controllers/transfers';
import { requireLocalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply auth middleware to all transfer and payment routes
router.use(requireLocalAuth);

// GET /api/pb/beneficiaries
router.get(
  '/beneficiaries',
  TransfersController.getBeneficiaries
);

// POST /api/pb/accounts/:accountId/paymultiple
router.post(
  '/accounts/:accountId/paymultiple',
  validateRequest(payMultipleSchema),
  TransfersController.payMultiple
);

// POST /api/pb/accounts/:accountId/transfermultiple
router.post(
  '/accounts/:accountId/transfermultiple',
  validateRequest(transferMultipleSchema),
  TransfersController.transferMultiple
);

// POST /api/pb/accounts/:accountId/pay-direct
router.post(
  '/accounts/:accountId/pay-direct',
  validateRequest(payDirectSchema),
  TransfersController.payDirect
);

export default router;

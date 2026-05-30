import { Router } from 'express';
import { AccountsController, getAccountsSchema, accountParamsSchema, getTransactionsSchema } from '../controllers/accounts';
import { requireLocalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply auth middleware to all account routes
router.use(requireLocalAuth);

// GET /api/pb/accounts
router.get(
  '/',
  validateRequest(getAccountsSchema),
  AccountsController.getAccounts
);

// GET /api/pb/accounts/:accountId/balance
router.get(
  '/:accountId/balance',
  validateRequest(accountParamsSchema),
  AccountsController.getAccountBalance
);

// GET /api/pb/accounts/:accountId/transactions
router.get(
  '/:accountId/transactions',
  validateRequest(getTransactionsSchema),
  AccountsController.getAccountTransactions
);

export default router;

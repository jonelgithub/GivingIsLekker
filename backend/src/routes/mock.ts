import { Router } from 'express';
import {
  MockController,
  addMockAccountSchema,
  addMockBeneficiarySchema,
  registerWebhookSchema,
  triggerSwipeSchema,
} from '../controllers/mock';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Apply environmental mock-only guard to all mock routes
router.use(MockController.ensureMockMode);

// POST /api/mock/accounts
router.post(
  '/accounts',
  validateRequest(addMockAccountSchema),
  MockController.addMockAccount
);

// POST /api/mock/beneficiaries
router.post(
  '/beneficiaries',
  validateRequest(addMockBeneficiarySchema),
  MockController.addMockBeneficiary
);

// POST /api/mock/webhook/register
router.post(
  '/webhook/register',
  validateRequest(registerWebhookSchema),
  MockController.registerMockWebhook
);

// POST /api/mock/trigger-swipe
router.post(
  '/trigger-swipe',
  validateRequest(triggerSwipeSchema),
  MockController.triggerSwipe
);

export default router;

import { Request, Response, NextFunction } from 'express';
import { BankService } from '../services/bank';
import { z } from 'zod';

// Zod schemas for mock inputs
export const addMockAccountSchema = {
  body: z.object({
    accountId: z.string().min(1, 'accountId is required'),
    accountNumber: z.string().min(1, 'accountNumber is required'),
    accountName: z.string().min(1, 'accountName is required'),
    referenceName: z.string().min(1, 'referenceName is required'),
    productName: z.string().min(1, 'productName is required'),
    accountType: z.enum(['private', 'business']),
    initialBalance: z.number().nonnegative().optional(),
  }),
};

export const addMockBeneficiarySchema = {
  body: z.object({
    beneficiaryId: z.string().min(1, 'beneficiaryId is required'),
    accountNumber: z.string().min(1, 'accountNumber is required'),
    code: z.string().min(1, 'code is required'),
    bank: z.string().min(1, 'bank is required'),
    beneficiaryName: z.string().min(1, 'beneficiaryName is required'),
    paymentType: z.string().min(1, 'paymentType is required'),
  }),
};

export const registerWebhookSchema = {
  body: z.object({
    webhookUrl: z.string().url('webhookUrl must be a valid URL'),
  }),
};

export const triggerSwipeSchema = {
  body: z.object({
    accountId: z.string().min(1, 'accountId is required'),
    amount: z.number().positive('amount must be a positive number'),
    merchant: z.string().min(1, 'merchant is required'),
  }),
};

/**
 * Controller to manage dynamic mock data registration and swipe simulations.
 */
export class MockController {
  
  /**
   * Guard middleware to ensure mock endpoints are only queried in mock mode.
   */
  public static ensureMockMode = (req: Request, res: Response, next: NextFunction): void => {
    if (!BankService.isMockMode()) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Mock endpoints are only accessible when TARGET_ENV is set to mock.',
      });
      return;
    }
    next();
  };

  public static addMockAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      BankService.addMockAccount(req.body);
      res.status(201).json({
        message: 'Mock account registered successfully.',
        data: req.body,
      });
    } catch (error) {
      next(error);
    }
  };

  public static addMockBeneficiary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      BankService.addMockBeneficiary(req.body);
      res.status(201).json({
        message: 'Mock beneficiary registered successfully.',
        data: req.body,
      });
    } catch (error) {
      next(error);
    }
  };

  public static registerMockWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { webhookUrl } = req.body;
      BankService.registerMockWebhook(webhookUrl);
      res.json({
        message: 'Webhook URL registered successfully.',
        webhookUrl,
      });
    } catch (error) {
      next(error);
    }
  };

  public static triggerSwipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId, amount, merchant } = req.body;
      const result = await BankService.triggerSwipe(accountId, amount, merchant);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

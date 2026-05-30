import { Request, Response, NextFunction } from 'express';
import { BankService } from '../services/bank';
import { z } from 'zod';

// Zod schemas for input validation
export const payDirectSchema = {
  params: z.object({
    accountId: z.string().min(1, 'accountId is required'),
  }),
  body: z.object({
    accountNumber: z.string().min(1, 'accountNumber is required'),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'amount must be a valid numeric string, e.g., "10.00"'),
    myReference: z.string().min(1, 'myReference is required').max(30),
    theirReference: z.string().min(1, 'theirReference is required').max(30),
  }),
};

export const payMultipleSchema = {
  params: z.object({
    accountId: z.string().min(1, 'accountId is required'),
  }),
  body: z.object({
    paymentList: z.array(
      z.object({
        beneficiaryId: z.string().min(1, 'beneficiaryId is required'),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'amount must be a valid numeric string, e.g., "10.00"'),
        myReference: z.string().min(1, 'myReference is required').max(30),
        theirReference: z.string().min(1, 'theirReference is required').max(30),
      })
    ).min(1, 'paymentList must contain at least one payment item'),
  }),
};

export const transferMultipleSchema = {
  params: z.object({
    accountId: z.string().min(1, 'accountId is required'),
  }),
  body: z.object({
    transferList: z.array(
      z.object({
        beneficiaryAccountId: z.string().min(1, 'beneficiaryAccountId is required'),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'amount must be a valid numeric string, e.g., "10.00"'),
        myReference: z.string().min(1, 'myReference is required').max(30),
        theirReference: z.string().min(1, 'theirReference is required').max(30),
      })
    ).min(1, 'transferList must contain at least one transfer item'),
  }),
};

/**
 * Controller to handle payments to beneficiaries and inter-account transfers.
 */
export class TransfersController {

  public static getBeneficiaries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const beneficiaries = await BankService.getBeneficiaries();
      res.json({
        data: {
          beneficiaries,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public static payMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { paymentList } = req.body;

      const result = await BankService.payMultiple(accountId, paymentList);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public static transferMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { transferList } = req.body;

      const result = await BankService.transferMultiple(accountId, transferList);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public static payDirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { accountNumber, amount, myReference, theirReference } = req.body;

      const result = await BankService.payDirect(
        accountId,
        accountNumber,
        amount,
        myReference,
        theirReference
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

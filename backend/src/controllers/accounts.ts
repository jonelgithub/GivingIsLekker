import { Request, Response, NextFunction } from 'express';
import { BankService } from '../services/bank';
import { z } from 'zod';

// Zod schemas for input validation
export const getAccountsSchema = {
  query: z.object({
    type: z.enum(['private', 'business']).optional(),
  }),
};

export const accountParamsSchema = {
  params: z.object({
    accountId: z.string().min(1, 'accountId is required'),
  }),
};

export const getTransactionsSchema = {
  params: z.object({
    accountId: z.string().min(1, 'accountId is required'),
  }),
  query: z.object({
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be in YYYY-MM-DD format').optional(),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be in YYYY-MM-DD format').optional(),
    transactionType: z.enum(['DEBIT', 'CREDIT']).optional(),
  }),
};

/**
 * Controller to manage account information, balances, and transactions.
 */
export class AccountsController {
  
  public static getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.query.type as 'private' | 'business' | undefined;
      const accounts = await BankService.getAccounts(type);
      res.json({
        data: {
          accounts,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public static getAccountBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params;
      const balance = await BankService.getAccountBalance(accountId);
      res.json({
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  };

  public static getAccountTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.params;
      const { fromDate, toDate, transactionType } = req.query as {
        fromDate?: string;
        toDate?: string;
        transactionType?: string;
      };

      const transactions = await BankService.getAccountTransactions(accountId, {
        fromDate,
        toDate,
        transactionType,
      });

      res.json({
        data: {
          transactions,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

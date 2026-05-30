import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

// Generic interfaces matching bank schemas
export interface BankAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  referenceName: string;
  productName: string;
  accountType: 'private' | 'business';
}

export interface BankBalance {
  accountId: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
}

export interface BankTransaction {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'POSTED' | 'PENDING';
  description: string;
  amount: number;
  postingDate: string;
  valueDate: string;
  actionDate: string;
  transactionDate: string;
  transactionId: string;
}

export interface BankBeneficiary {
  beneficiaryId: string;
  accountNumber: string;
  code: string;
  bank: string;
  beneficiaryName: string;
  paymentType: string;
}

export interface PaymentItem {
  beneficiaryId: string;
  amount: string; // amount as string in Rand (as requested by schema)
  myReference: string;
  theirReference: string;
}

export interface TransferItem {
  beneficiaryAccountId: string;
  amount: string; // amount as string in Rand
  myReference: string;
  theirReference: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch timestamp
}

export class BankService {
  private static tokenCache: TokenCache | null = null;
  private static axiosInstance: AxiosInstance | null = null;
  private static registeredWebhookUrl: string | null = null;

  // In-Memory stateful storage for Mock Mode
  private static mockAccounts: BankAccount[] = [
    {
      accountId: 'acc_pb_12345',
      accountNumber: '10012345678',
      accountName: 'John Doe Account',
      referenceName: 'Primary Account',
      productName: 'Transaction Account',
      accountType: 'private',
    },
    {
      accountId: 'acc_pb_sav_67890',
      accountNumber: '10012345679',
      accountName: 'John Doe Savings',
      referenceName: 'Savings Account',
      productName: 'Savings Vault',
      accountType: 'private',
    },
    {
      accountId: 'acc_bb_54321',
      accountNumber: '20098765432',
      accountName: 'Company Business Account',
      referenceName: 'Business Primary',
      productName: 'Business Account',
      accountType: 'business',
    },
  ];

  private static mockBalances: Record<string, BankBalance> = {
    'acc_pb_12345': {
      accountId: 'acc_pb_12345',
      currentBalance: 50230.12,
      availableBalance: 48900.50,
      currency: 'ZAR',
    },
    'acc_pb_sav_67890': {
      accountId: 'acc_pb_sav_67890',
      currentBalance: 120450.00,
      availableBalance: 120450.00,
      currency: 'ZAR',
    },
    'acc_bb_54321': {
      accountId: 'acc_bb_54321',
      currentBalance: 450900.50,
      availableBalance: 440200.00,
      currency: 'ZAR',
    },
  };

  private static mockBeneficiaries: BankBeneficiary[] = [
    {
      beneficiaryId: 'ben_utility_001',
      accountNumber: '4089123456',
      code: '250655',
      bank: 'Standard Bank',
      beneficiaryName: 'Utility Services',
      paymentType: 'Electronic EFT',
    },
    {
      beneficiaryId: 'ben_landlord_002',
      accountNumber: '62012345678',
      code: '250655',
      bank: 'FNB',
      beneficiaryName: 'Rent Management',
      paymentType: 'Electronic EFT',
    },
    {
      beneficiaryId: 'ben_school_003',
      accountNumber: '1209876543',
      code: '198765',
      bank: 'Nedbank',
      beneficiaryName: 'Education Academy',
      paymentType: 'Electronic EFT',
    },
  ];

  private static mockTransactions: Record<string, BankTransaction[]> = {
    'acc_pb_12345': [
      {
        accountId: 'acc_pb_12345',
        type: 'DEBIT',
        status: 'POSTED',
        description: 'Supermarket Purchase',
        amount: 450.20,
        postingDate: '2026-05-28',
        valueDate: '2026-05-28',
        actionDate: '2026-05-28',
        transactionDate: '2026-05-28T14:22:00Z',
        transactionId: 'tx_pb_001',
      },
      {
        accountId: 'acc_pb_12345',
        type: 'CREDIT',
        status: 'POSTED',
        description: 'Salary Credit',
        amount: 45000.00,
        postingDate: '2026-05-25',
        valueDate: '2026-05-25',
        actionDate: '2026-05-25',
        transactionDate: '2026-05-25T08:00:00Z',
        transactionId: 'tx_pb_002',
      },
      {
        accountId: 'acc_pb_12345',
        type: 'DEBIT',
        status: 'POSTED',
        description: 'Streaming Subscription',
        amount: 199.00,
        postingDate: '2026-05-20',
        valueDate: '2026-05-20',
        actionDate: '2026-05-20',
        transactionDate: '2026-05-20T03:15:00Z',
        transactionId: 'tx_pb_003',
      },
    ],
    'acc_pb_sav_67890': [
      {
        accountId: 'acc_pb_sav_67890',
        type: 'CREDIT',
        status: 'POSTED',
        description: 'Vault Interest Payment',
        amount: 620.50,
        postingDate: '2026-05-28',
        valueDate: '2026-05-28',
        actionDate: '2026-05-28',
        transactionDate: '2026-05-28T23:59:59Z',
        transactionId: 'tx_sav_001',
      },
    ],
    'acc_bb_54321': [
      {
        accountId: 'acc_bb_54321',
        type: 'DEBIT',
        status: 'POSTED',
        description: 'Supplier Invoice Payment',
        amount: 4500.00,
        postingDate: '2026-05-27',
        valueDate: '2026-05-27',
        actionDate: '2026-05-27',
        transactionDate: '2026-05-27T10:45:00Z',
        transactionId: 'tx_bb_001',
      },
      {
        accountId: 'acc_bb_54321',
        type: 'CREDIT',
        status: 'POSTED',
        description: 'Client Invoice Settlement',
        amount: 85000.00,
        postingDate: '2026-05-26',
        valueDate: '2026-05-26',
        actionDate: '2026-05-26',
        transactionDate: '2026-05-26T15:30:00Z',
        transactionId: 'tx_bb_002',
      },
    ],
  };

  /**
   * Evaluates if we should operate in Mock Mode.
   */
  public static isMockMode(): boolean {
    return (
      env.TARGET_ENV === 'mock' ||
      !env.CLIENT_ID ||
      !env.CLIENT_SECRET ||
      !env.API_KEY
    );
  }

  /**
   * Retrieves the base URL for the selected environment.
   */
  private static getBaseUrl(): string {
    return env.TARGET_ENV === 'production'
      ? 'https://openapi.investec.com'
      : 'https://openapisandbox.investec.com';
  }

  /**
   * Establishes a secure connection to downstream API, executing OAuth2 flow if needed,
   * caching token in-memory, and auto-refreshing prior to expiration.
   */
  private static async getAuthenticatedClient(): Promise<AxiosInstance> {
    if (this.isMockMode()) {
      throw new Error('Attempted to create a live API client while in Mock Mode.');
    }

    const now = Date.now();
    const tokenExists = this.tokenCache !== null;
    const tokenExpired = tokenExists && this.tokenCache!.expiresAt <= now + 30000; // Refreshes 30s before actual expiry

    if (!tokenExists || tokenExpired) {
      console.log(`[AUTH] OAuth token expired or missing. Fetching new token from server (${env.TARGET_ENV})...`);
      
      const authHeader = Buffer.from(
        `${env.CLIENT_ID}:${env.CLIENT_SECRET}`
      ).toString('base64');

      try {
        const response = await axios.post(
          `${this.getBaseUrl()}/identity/v2/oauth2/token`,
          'grant_type=client_credentials',
          {
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'x-api-key': env.API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        const { access_token, expires_in } = response.data;
        
        // Cache token. Limit to 30 mins (1800s) default or response-driven duration
        const maxAgeMs = (expires_in || 1800) * 1000;
        this.tokenCache = {
          accessToken: access_token,
          expiresAt: now + maxAgeMs,
        };

        console.log(`[AUTH] Token successfully acquired. Expires in ${expires_in} seconds.`);
      } catch (error: any) {
        console.error('[AUTH] Failed to authenticate with downstream identity server:', error.response?.data || error.message);
        throw new Error(`Authentication failed: ${error.message}`);
      }
    }

    // Reuse or create Axios instance configured with Authorization headers
    this.axiosInstance = axios.create({
      baseURL: this.getBaseUrl(),
      headers: {
        'Authorization': `Bearer ${this.tokenCache!.accessToken}`,
        'x-api-key': env.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    return this.axiosInstance;
  }

  // ==========================================
  // ACCOUNTS API
  // ==========================================

  public static async getAccounts(type?: 'private' | 'business'): Promise<BankAccount[]> {
    if (this.isMockMode()) {
      console.log('[MOCK] Retrieving mock accounts');
      if (type) {
        return this.mockAccounts.filter(a => a.accountType === type);
      }
      return this.mockAccounts;
    }

    const client = await this.getAuthenticatedClient();
    try {
      let accounts: BankAccount[] = [];

      // Fetch Private Banking Accounts
      if (!type || type === 'private') {
        const pbRes = await client.get('/za/pb/v1/accounts');
        const pbAccounts = (pbRes.data.data?.accounts || []).map((acc: any) => ({
          ...acc,
          accountType: 'private',
        }));
        accounts = [...accounts, ...pbAccounts];
      }

      // Fetch Business Banking Accounts
      if (!type || type === 'business') {
        try {
          const bbRes = await client.get('/za/bb/v1/accounts');
          const bbAccounts = (bbRes.data.data?.accounts || []).map((acc: any) => ({
            ...acc,
            accountType: 'business',
          }));
          accounts = [...accounts, ...bbAccounts];
        } catch (bbError: any) {
          console.warn('[API] Could not retrieve business banking accounts:', bbError.message);
          if (type === 'business') throw bbError;
        }
      }

      return accounts;
    } catch (error: any) {
      console.error('[API] Error in getAccounts:', error.response?.data || error.message);
      throw error;
    }
  }

  public static async getAccountBalance(accountId: string): Promise<BankBalance> {
    if (this.isMockMode()) {
      console.log(`[MOCK] Retrieving balance for account: ${accountId}`);
      const balance = this.mockBalances[accountId];
      if (!balance) {
        const err = new Error('Account not found');
        (err as any).statusCode = 404;
        throw err;
      }
      return balance;
    }

    const client = await this.getAuthenticatedClient();
    const account = await this.getAccountDetails(accountId);
    const pathType = account.accountType === 'business' ? 'bb' : 'pb';

    try {
      const response = await client.get(`/za/${pathType}/v1/accounts/${accountId}/balance`);
      return response.data.data;
    } catch (error: any) {
      console.error(`[API] Error in getAccountBalance for ${accountId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  public static async getAccountTransactions(
    accountId: string,
    filters?: { fromDate?: string; toDate?: string; transactionType?: string }
  ): Promise<BankTransaction[]> {
    if (this.isMockMode()) {
      console.log(`[MOCK] Retrieving transactions for account: ${accountId}`);
      const txs = this.mockTransactions[accountId];
      if (!txs) {
        const err = new Error('Account not found');
        (err as any).statusCode = 404;
        throw err;
      }

      let filtered = [...txs];
      if (filters?.fromDate) {
        const from = new Date(filters.fromDate);
        filtered = filtered.filter(t => new Date(t.postingDate) >= from);
      }
      if (filters?.toDate) {
        const to = new Date(filters.toDate);
        filtered = filtered.filter(t => new Date(t.postingDate) <= to);
      }
      if (filters?.transactionType) {
        const typeFilter = filters.transactionType.toUpperCase();
        filtered = filtered.filter(t => t.type === typeFilter);
      }

      return filtered;
    }

    const client = await this.getAuthenticatedClient();
    const account = await this.getAccountDetails(accountId);
    const pathType = account.accountType === 'business' ? 'bb' : 'pb';

    try {
      const params: Record<string, string> = {};
      if (filters?.fromDate) params.fromDate = filters.fromDate;
      if (filters?.toDate) params.toDate = filters.toDate;
      if (filters?.transactionType) params.transactionType = filters.transactionType;

      const response = await client.get(`/za/${pathType}/v1/accounts/${accountId}/transactions`, { params });
      return response.data.data?.transactions || [];
    } catch (error: any) {
      console.error(`[API] Error in getAccountTransactions for ${accountId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // ==========================================
  // BENEFICIARIES & PAYMENTS API
  // ==========================================

  public static async getBeneficiaries(): Promise<BankBeneficiary[]> {
    if (this.isMockMode()) {
      console.log('[MOCK] Retrieving mock beneficiaries');
      return this.mockBeneficiaries;
    }

    const client = await this.getAuthenticatedClient();
    try {
      const response = await client.get('/za/pb/v1/accounts/beneficiaries');
      return response.data.data?.beneficiaries || [];
    } catch (error: any) {
      console.error('[API] Error in getBeneficiaries:', error.response?.data || error.message);
      throw error;
    }
  }

  public static async payMultiple(
    accountId: string,
    paymentList: PaymentItem[]
  ): Promise<any> {
    if (this.isMockMode()) {
      console.log(`[MOCK] Processing paymultiple from ${accountId}`);
      const balance = this.mockBalances[accountId];
      if (!balance) {
        const err = new Error('Source account not found');
        (err as any).statusCode = 404;
        throw err;
      }

      const results = [];
      let totalDeduction = 0;

      for (const item of paymentList) {
        const amt = parseFloat(item.amount);
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Invalid amount: ${item.amount}`);
        }

        const beneficiary = this.mockBeneficiaries.find(b => b.beneficiaryId === item.beneficiaryId);
        if (!beneficiary) {
          const err = new Error(`Beneficiary not found: ${item.beneficiaryId}`);
          (err as any).statusCode = 404;
          throw err;
        }

        totalDeduction += amt;
        results.push({
          paymentId: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
          status: 'Submitted',
          beneficiaryId: item.beneficiaryId,
        });
      }

      if (balance.availableBalance < totalDeduction) {
        const err = new Error('Insufficient available balance to complete payments');
        (err as any).statusCode = 400;
        throw err;
      }

      // Stateful modification: Deduct in-memory
      balance.currentBalance -= totalDeduction;
      balance.availableBalance -= totalDeduction;

      // Add to transaction records
      for (const item of paymentList) {
        const amt = parseFloat(item.amount);
        const beneficiary = this.mockBeneficiaries.find(b => b.beneficiaryId === item.beneficiaryId)!;
        
        const newTx: BankTransaction = {
          accountId,
          type: 'DEBIT',
          status: 'PENDING',
          description: `EFT: ${beneficiary.beneficiaryName} - Ref: ${item.myReference}`,
          amount: amt,
          postingDate: new Date().toISOString().split('T')[0],
          valueDate: new Date().toISOString().split('T')[0],
          actionDate: new Date().toISOString().split('T')[0],
          transactionDate: new Date().toISOString(),
          transactionId: `tx_mock_${Math.random().toString(36).substring(2, 9)}`,
        };

        if (!this.mockTransactions[accountId]) {
          this.mockTransactions[accountId] = [];
        }
        this.mockTransactions[accountId].unshift(newTx);
      }

      return {
        paymentResponses: results,
        message: 'Payments successfully processed in Mock Mode.',
      };
    }

    const client = await this.getAuthenticatedClient();
    try {
      const response = await client.post(
        `/za/pb/v1/accounts/${accountId}/paymultiple`,
        { paymentList }
      );
      return response.data;
    } catch (error: any) {
      console.error(`[API] Error in payMultiple for account ${accountId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  public static async transferMultiple(
    accountId: string,
    transferList: TransferItem[]
  ): Promise<any> {
    if (this.isMockMode()) {
      console.log(`[MOCK] Processing transfermultiple from ${accountId}`);
      const sourceBalance = this.mockBalances[accountId];
      if (!sourceBalance) {
        const err = new Error('Source account not found');
        (err as any).statusCode = 404;
        throw err;
      }

      const results = [];
      let totalDeduction = 0;

      for (const item of transferList) {
        const amt = parseFloat(item.amount);
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Invalid amount: ${item.amount}`);
        }

        const destBalance = this.mockBalances[item.beneficiaryAccountId];
        if (!destBalance) {
          const err = new Error(`Destination account not found: ${item.beneficiaryAccountId}`);
          (err as any).statusCode = 404;
          throw err;
        }

        if (item.beneficiaryAccountId === accountId) {
          const err = new Error('Cannot transfer to the same source account');
          (err as any).statusCode = 400;
          throw err;
        }

        totalDeduction += amt;
        results.push({
          transferId: `trn_mock_${Math.random().toString(36).substring(2, 9)}`,
          status: 'Completed',
          beneficiaryAccountId: item.beneficiaryAccountId,
        });
      }

      if (sourceBalance.availableBalance < totalDeduction) {
        const err = new Error('Insufficient available balance to complete transfers');
        (err as any).statusCode = 400;
        throw err;
      }

      // Stateful modification: Transfer funds in-memory
      sourceBalance.currentBalance -= totalDeduction;
      sourceBalance.availableBalance -= totalDeduction;

      for (const item of transferList) {
        const amt = parseFloat(item.amount);
        const destBalance = this.mockBalances[item.beneficiaryAccountId];
        
        destBalance.currentBalance += amt;
        destBalance.availableBalance += amt;

        const srcAccount = this.mockAccounts.find(a => a.accountId === accountId)!;
        const destAccount = this.mockAccounts.find(a => a.accountId === item.beneficiaryAccountId)!;

        // Add DEBIT transaction to source account
        const debitTx: BankTransaction = {
          accountId,
          type: 'DEBIT',
          status: 'POSTED',
          description: `Transfer to ${destAccount.referenceName} - Ref: ${item.myReference}`,
          amount: amt,
          postingDate: new Date().toISOString().split('T')[0],
          valueDate: new Date().toISOString().split('T')[0],
          actionDate: new Date().toISOString().split('T')[0],
          transactionDate: new Date().toISOString(),
          transactionId: `tx_mock_${Math.random().toString(36).substring(2, 9)}`,
        };
        this.mockTransactions[accountId].unshift(debitTx);

        // Add CREDIT transaction to destination account
        const creditTx: BankTransaction = {
          accountId: item.beneficiaryAccountId,
          type: 'CREDIT',
          status: 'POSTED',
          description: `Transfer from ${srcAccount.referenceName} - Ref: ${item.theirReference}`,
          amount: amt,
          postingDate: new Date().toISOString().split('T')[0],
          valueDate: new Date().toISOString().split('T')[0],
          actionDate: new Date().toISOString().split('T')[0],
          transactionDate: new Date().toISOString(),
          transactionId: `tx_mock_${Math.random().toString(36).substring(2, 9)}`,
        };
        
        if (!this.mockTransactions[item.beneficiaryAccountId]) {
          this.mockTransactions[item.beneficiaryAccountId] = [];
        }
        this.mockTransactions[item.beneficiaryAccountId].unshift(creditTx);
      }

      return {
        transferResponses: results,
        message: 'Transfers successfully processed in Mock Mode.',
      };
    }

    const client = await this.getAuthenticatedClient();
    try {
      const response = await client.post(
        `/za/pb/v1/accounts/${accountId}/transfermultiple`,
        { transferList }
      );
      return response.data;
    } catch (error: any) {
      console.error(`[API] Error in transferMultiple for account ${accountId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Helper to fetch account details to determine PB/BB path structure
  private static async getAccountDetails(accountId: string): Promise<BankAccount> {
    if (this.isMockMode()) {
      const acc = this.mockAccounts.find(a => a.accountId === accountId);
      if (!acc) {
        const err = new Error('Account not found');
        (err as any).statusCode = 404;
        throw err;
      }
      return acc;
    }

    const accounts = await this.getAccounts();
    const acc = accounts.find(a => a.accountId === accountId);
    if (!acc) {
      const err = new Error(`Account ${accountId} not found on your profile.`);
      (err as any).statusCode = 404;
      throw err;
    }
    return acc;
  }

  // Dynamic Mock Registration (Mock Mode)
  public static addMockAccount(account: BankAccount & { initialBalance?: number }): void {
    const index = this.mockAccounts.findIndex(a => a.accountId === account.accountId);
    const mockAcc: BankAccount = {
      accountId: account.accountId,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      referenceName: account.referenceName,
      productName: account.productName,
      accountType: account.accountType,
    };
    if (index > -1) {
      this.mockAccounts[index] = mockAcc;
    } else {
      this.mockAccounts.push(mockAcc);
    }

    const balanceVal = account.initialBalance !== undefined ? account.initialBalance : 0.0;
    this.mockBalances[account.accountId] = {
      accountId: account.accountId,
      currentBalance: balanceVal,
      availableBalance: balanceVal,
      currency: 'ZAR',
    };

    if (!this.mockTransactions[account.accountId]) {
      this.mockTransactions[account.accountId] = [];
    }
  }

  public static addMockBeneficiary(beneficiary: BankBeneficiary): void {
    const index = this.mockBeneficiaries.findIndex(b => b.beneficiaryId === beneficiary.beneficiaryId);
    if (index > -1) {
      this.mockBeneficiaries[index] = beneficiary;
    } else {
      this.mockBeneficiaries.push(beneficiary);
    }
  }

  // Webhook Simulation Engine
  public static registerMockWebhook(webhookUrl: string): void {
    this.registeredWebhookUrl = webhookUrl;
  }

  // Intelligent Beneficiary Resolution (Live & Mock Modes)
  public static async payDirect(
    accountId: string,
    destinationAccountNumber: string,
    amount: string,
    myReference: string,
    theirReference: string
  ): Promise<any> {
    const beneficiaries = await this.getBeneficiaries();
    const beneficiary = beneficiaries.find(b => b.accountNumber === destinationAccountNumber);
    
    if (!beneficiary) {
      const err = new Error(`Beneficiary with account number ${destinationAccountNumber} is not pre-approved on your Investec profile.`);
      err.name = 'BENEFICIARY_NOT_APPROVED';
      (err as any).statusCode = 400;
      throw err;
    }

    const paymentList = [
      {
        beneficiaryId: beneficiary.beneficiaryId,
        amount,
        myReference,
        theirReference,
      },
    ];

    return this.payMultiple(accountId, paymentList);
  }

  // Trigger simulated card swipe (Mock Mode)
  public static async triggerSwipe(
    accountId: string,
    amount: number,
    merchant: string
  ): Promise<any> {
    if (!this.isMockMode()) {
      const err = new Error('Swipe simulation is only supported in Mock Mode.');
      err.name = 'Forbidden';
      (err as any).statusCode = 403;
      throw err;
    }

    const account = this.mockAccounts.find(a => a.accountId === accountId);
    if (!account) {
      const err = new Error(`Account not found: ${accountId}`);
      err.name = 'NotFoundError';
      (err as any).statusCode = 404;
      throw err;
    }

    const balance = this.mockBalances[accountId];
    if (!balance) {
      const err = new Error(`Balance not found for account: ${accountId}`);
      err.name = 'NotFoundError';
      (err as any).statusCode = 404;
      throw err;
    }

    balance.currentBalance -= amount;
    balance.availableBalance -= amount;

    const transactionId = `tx_swipe_${Math.random().toString(36).substring(2, 9)}`;
    const newTx: BankTransaction = {
      accountId,
      type: 'DEBIT',
      status: 'POSTED',
      description: merchant,
      amount,
      postingDate: new Date().toISOString().split('T')[0],
      valueDate: new Date().toISOString().split('T')[0],
      actionDate: new Date().toISOString().split('T')[0],
      transactionDate: new Date().toISOString(),
      transactionId,
    };

    if (!this.mockTransactions[accountId]) {
      this.mockTransactions[accountId] = [];
    }
    this.mockTransactions[accountId].unshift(newTx);

    const centsAmount = Math.round(amount * 100);
    const webhookPayload = {
      accountId,
      cardId: 'card_pb_mock_1',
      centsAmount: centsAmount.toString(),
      currencyCode: 'zar',
      merchant: {
        name: merchant,
        category: '5411',
        city: 'Cape Town',
        country: 'ZA',
      },
      amount,
      dateTime: new Date().toISOString(),
      reference: merchant,
      type: 'debit',
      status: 'success',
    };

    let webhookStatus = 'not_registered';
    if (this.registeredWebhookUrl) {
      try {
        console.log(`[MOCK] Dispatching swipe webhook to ${this.registeredWebhookUrl}...`);
        await axios.post(this.registeredWebhookUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });
        webhookStatus = 'delivered';
        console.log(`[MOCK] Webhook delivered successfully.`);
      } catch (error: any) {
        webhookStatus = 'delivery_failed';
        console.error(`[MOCK] Failed to dispatch webhook to ${this.registeredWebhookUrl}:`, error.message);
      }
    }

    return {
      message: 'Swipe simulated successfully.',
      transaction: newTx,
      webhookStatus,
      webhookPayload,
    };
  }
}

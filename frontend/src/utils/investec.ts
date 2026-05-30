/**
 * Investec Programmable Banking API Client for GivingIsLekker.
 * Routes all requests through the Secure Bank API Proxy.
 */

const PROXY_URL = process.env.INVESTEC_PROXY_URL || "http://localhost:8080/api";
const PROXY_KEY = process.env.INVESTEC_PROXY_KEY || "local_dev_api_key_12345";

interface TransferRequest {
  beneficiaryAccountId: string;
  amount: number;
  myReference: string;
  theirReference: string;
}

// Check proxy environment status
async function checkProxyMode(): Promise<boolean> {
  try {
    const res = await fetch(`${PROXY_URL}/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return data.environment === "mock" || data.mode?.includes("MOCK");
    }
  } catch (err) {
    console.warn("Investec Proxy Status: Could not check proxy status. Defaulting to mock translation.", err);
  }
  return true;
}

// List user transaction accounts from proxy
export async function getAccounts(): Promise<any[]> {
  try {
    console.log(`Investec Proxy: Fetching accounts from ${PROXY_URL}/pb/accounts...`);
    const res = await fetch(`${PROXY_URL}/pb/accounts`, {
      method: "GET",
      headers: {
        "x-local-api-key": PROXY_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch accounts: ${res.status}`);
    }

    const data = await res.json();
    const proxyAccounts = data.data?.accounts || [];

    // Map proxy accounts back to GivingIsLekker UI IDs for compatibility in Mock Mode
    const isMock = await checkProxyMode();
    if (isMock) {
      return proxyAccounts.map((acc: any) => {
        if (acc.accountId === "acc_pb_12345") {
          return {
            ...acc,
            accountId: "892019481720",
            accountNumber: "20087654321",
            accountName: "Investec Private Cash",
            referenceName: "Transaction Account",
            productName: "Private Cash Account",
          };
        } else if (acc.accountId === "acc_pb_sav_67890") {
          return {
            ...acc,
            accountId: "172089201948",
            accountNumber: "10012345678",
            accountName: "Investec Prime Saver",
            referenceName: "Savings",
            productName: "Savings Account",
          };
        }
        return acc;
      });
    }

    return proxyAccounts;
  } catch (err) {
    console.error("Investec Proxy: Failed to fetch accounts. Using local mock fallback.", err);
    return [
      {
        accountId: "172089201948",
        accountNumber: "10012345678",
        accountName: "Investec Prime Saver",
        referenceName: "Savings",
        productName: "Savings Account",
      },
      {
        accountId: "892019481720",
        accountNumber: "20087654321",
        accountName: "Investec Private Cash",
        referenceName: "Transaction Account",
        productName: "Private Cash Account",
      }
    ];
  }
}

// Perform automated transfer for round-up donations via proxy
export async function executeTransfer(
  fromAccountId: string,
  transfer: TransferRequest
): Promise<any> {
  const isMock = await checkProxyMode();
  
  let targetFromAccountId = fromAccountId;
  let targetBeneficiaryId = "";

  if (isMock) {
    // Translate source account to proxy's mock accounts
    if (fromAccountId === "892019481720") {
      targetFromAccountId = "acc_pb_12345";
    } else if (fromAccountId === "172089201948") {
      targetFromAccountId = "acc_pb_sav_67890";
    }

    // Translate target charity account to proxy's mock beneficiaries
    const benIdMap: Record<string, string> = {
      "98765432101": "ben_school_003", // Imbumba Girls -> Education Academy
      "98765432102": "ben_utility_001", // Shonaquip -> Utility Services
      "98765432103": "ben_utility_001", // Abalimi -> Utility Services
      "98765432104": "ben_landlord_002", // TEARS -> Rent Management
    };
    targetBeneficiaryId = benIdMap[transfer.beneficiaryAccountId] || "ben_utility_001";
  } else {
    // In live mode, the beneficiaryAccountId holds the real beneficiaryId on their profile
    targetBeneficiaryId = transfer.beneficiaryAccountId;
  }

  // Construct request payload matching the proxy's paymultiple schema
  const url = `${PROXY_URL}/pb/accounts/${targetFromAccountId}/paymultiple`;
  const payload = {
    paymentList: [
      {
        beneficiaryId: targetBeneficiaryId,
        amount: transfer.amount.toFixed(2), // Requires numeric string format, e.g. "2.50"
        myReference: transfer.myReference.substring(0, 30),
        theirReference: transfer.theirReference.substring(0, 30),
      }
    ]
  };

  console.log(`Investec Proxy: Routing payment of R${transfer.amount.toFixed(2)} to ${targetBeneficiaryId} through proxy...`);
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-local-api-key": PROXY_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Proxy payment execution failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  console.log("Investec Proxy: Payment successfully processed:", data);
  return data;
}

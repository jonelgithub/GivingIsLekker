/**
 * Investec Programmable Banking API Client.
 * Automatically switches between live endpoints and sandbox simulations based on env credentials.
 */

interface InvestecCredentials {
  clientId: string;
  clientSecret: string;
  apiKey: string;
}

interface TransferRequest {
  beneficiaryAccountId: string;
  amount: number;
  myReference: string;
  theirReference: string;
}

let cachedToken: string | null = null;
let tokenExpiryTime = 0;

function getCredentials(): InvestecCredentials | null {
  const clientId = process.env.INVESTEC_CLIENT_ID;
  const clientSecret = process.env.INVESTEC_CLIENT_SECRET;
  const apiKey = process.env.INVESTEC_API_KEY;

  if (clientId && clientSecret && apiKey) {
    return { clientId, clientSecret, apiKey };
  }
  return null;
}

// Authenticate and retrieve OAuth2 token
export async function getAccessToken(): Promise<string> {
  const creds = getCredentials();
  if (!creds) {
    console.log("Investec API: [Simulated] Authenticated sandbox session token.");
    return "mock_access_token_" + Date.now();
  }

  // Check memory cache
  if (cachedToken && Date.now() < tokenExpiryTime) {
    return cachedToken;
  }

  try {
    const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
    
    console.log("Investec API: Fetching live access token from OpenAPI...");
    const res = await fetch("https://openapi.investec.com/identity/v2/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "x-api-key": creds.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Auth failed with status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    
    // Expires in defaults to seconds. Subtract 60 seconds buffer
    const expiresIn = data.expires_in || 3600;
    tokenExpiryTime = Date.now() + (expiresIn - 60) * 1000;

    console.log("Investec API: Successfully acquired OAuth2 access token.");
    return cachedToken!;
  } catch (err) {
    console.error("Investec API: Failed to fetch access token:", err);
    throw err;
  }
}

// List user transaction accounts
export async function getAccounts(): Promise<any[]> {
  const creds = getCredentials();
  if (!creds) {
    console.log("Investec API: [Simulated] Fetched sandbox bank accounts list.");
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

  const token = await getAccessToken();
  const res = await fetch("https://openapi.investec.com/za/pb/v1/accounts", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch accounts: ${res.status}`);
  }

  const data = await res.json();
  return data.data?.accounts || [];
}

// Perform automated transfer for round-up donations
export async function executeTransfer(
  fromAccountId: string,
  transfer: TransferRequest
): Promise<any> {
  const creds = getCredentials();
  
  if (!creds) {
    console.log("==================================================");
    console.log("INVESTEC API SANDBOX TRANSFER SIMULATOR");
    console.log(`From Account ID:  ${fromAccountId}`);
    console.log(`To Account ID:    ${transfer.beneficiaryAccountId}`);
    console.log(`Amount Transferred: R${transfer.amount.toFixed(2)}`);
    console.log(`My Reference:     ${transfer.myReference}`);
    console.log(`Their Reference:  ${transfer.theirReference}`);
    console.log("Status:           SUCCESS");
    console.log("==================================================");
    return { status: "SUCCESS", transferId: "sim_" + Math.random().toString(36).substring(4) };
  }

  const token = await getAccessToken();
  const url = `https://openapi.investec.com/za/pb/v1/accounts/${fromAccountId}/transfer`;

  const payload = {
    transferList: [
      {
        beneficiaryAccountId: transfer.beneficiaryAccountId,
        amount: transfer.amount.toFixed(2), // API expects a string representation
        myReference: transfer.myReference.substring(0, 30), // Investec enforces character limits
        theirReference: transfer.theirReference.substring(0, 30),
      }
    ]
  };

  console.log(`Investec API: Executing transfer of R${transfer.amount.toFixed(2)}...`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "x-api-key": creds.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Transfer failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  console.log("Investec API: Transfer completed successfully.");
  return data;
}

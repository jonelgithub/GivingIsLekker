import { NextResponse } from "next/server";
import { getDb, saveDb, Transaction } from "@/utils/configStore";
import { executeTransfer } from "@/utils/investec";

// Mock list of charities to fetch target accounts
const charities = [
  { id: "imbumba-girls", name: "Imbumba Foundation (Caring4Girls)", accountNumber: "98765432101" },
  { id: "shonaquip-mobility", name: "Shonaquip Social Enterprise", accountNumber: "98765432102" },
  { id: "abalimi-farming", name: "Abalimi Bezekhaya (Township Farmers)", accountNumber: "98765432103" },
  { id: "tears-rescue", name: "TEARS Animal Rescue", accountNumber: "98765432104" },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, merchant, accountId } = body;

    // Validate request parameters
    if (amount === undefined || !merchant || !accountId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters (amount, merchant, accountId)." },
        { status: 400 }
      );
    }

    const transactionAmount = Number(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Transaction amount must be a positive number." },
        { status: 400 }
      );
    }

    const db = getDb();

    // If no charity is currently active, skip round-up calculations
    if (!db.activeCharityId) {
      return NextResponse.json({
        success: true,
        message: "Transaction received but no active charity is configured. Round-up skipped.",
        donationAmount: 0,
      });
    }

    const activeCharity = charities.find((c) => c.id === db.activeCharityId);
    if (!activeCharity) {
      return NextResponse.json(
        { success: false, error: "Active charity configuration is invalid or missing." },
        { status: 400 }
      );
    }

    // Calculate Round-up Difference
    // e.g. R42.50 rounded to next multiple of R5 is R45.00, difference is R2.50
    // If transaction is exactly a multiple (e.g. R40.00), round to next multiple (R45.00) saving R5.00
    const increment = db.roundUpIncrement;
    const remainder = transactionAmount % increment;
    const donation = remainder === 0 ? increment : Number((increment - remainder).toFixed(2));
    
    // Calculate 1.5% side-hustle platform convenience fee (min R0.01)
    const platformFee = Math.max(0.01, Number((donation * 0.015).toFixed(2)));

    console.log(`[Card Swipe Webhook] Calculated R${donation.toFixed(2)} round-up on R${transactionAmount.toFixed(2)} purchase at ${merchant}. Platform Fee: R${platformFee.toFixed(2)}.`);

    // EXECUTE LIVE/SIMULATED TRANSFER VIA INVESTEC PB API
    let transferResult;
    try {
      transferResult = await executeTransfer(accountId, {
        beneficiaryAccountId: activeCharity.accountNumber,
        amount: donation,
        myReference: `RoundUp: ${activeCharity.name.substring(0, 15)}`,
        theirReference: `RoundUp Contribution`,
      });
    } catch (err: any) {
      console.error("Investec transfer failed during round-up execution:", err);
      return NextResponse.json(
        { success: false, error: `Transfer failed: ${err.message || err}` },
        { status: 502 }
      );
    }

    // Record the successful transaction to history logs
    const newTx: Transaction = {
      id: "tx_" + Math.random().toString(36).substring(2, 10),
      description: merchant,
      amount: transactionAmount,
      donation: donation,
      platformFee: platformFee,
      charityName: activeCharity.name,
      timestamp: new Date().toISOString(),
    };

    db.transactions.unshift(newTx);
    db.totalDonated = Number((db.totalDonated + donation).toFixed(2));
    db.platformFeesEarned = Number((db.platformFeesEarned + platformFee).toFixed(2));
    saveDb(db);

    return NextResponse.json({
      success: true,
      message: `Successfully processed transaction. R${donation.toFixed(2)} donated to ${activeCharity.name}.`,
      transaction: newTx,
      transferDetails: transferResult,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}

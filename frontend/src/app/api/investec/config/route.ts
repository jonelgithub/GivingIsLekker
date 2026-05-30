import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/utils/configStore";

export async function GET() {
  const db = getDb();
  return NextResponse.json({ success: true, data: db });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activeCharityId, roundUpIncrement, isPremiumDonor } = body;

    const db = getDb();

    // 1. Validation
    if (roundUpIncrement !== undefined) {
      const increment = Number(roundUpIncrement);
      if (isNaN(increment) || increment < 1) {
        return NextResponse.json(
          { success: false, error: "Round-up increment must be at least R1." },
          { status: 400 }
        );
      }
      db.roundUpIncrement = increment;
    }

    // 2. Update Active Charity
    if (activeCharityId !== undefined) {
      db.activeCharityId = activeCharityId;
    }

    // 3. Update Premium Donor tier
    if (isPremiumDonor !== undefined) {
      db.isPremiumDonor = Boolean(isPremiumDonor);
    }

    saveDb(db);
    return NextResponse.json({ success: true, data: db });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update configuration." },
      { status: 500 }
    );
  }
}

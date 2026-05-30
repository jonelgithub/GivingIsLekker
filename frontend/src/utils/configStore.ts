import fs from "fs";
import path from "path";

export interface Transaction {
  id: string;
  description: string;
  amount: number;       // Original transaction value (e.g. R42.50)
  donation: number;     // Rounded donation value (e.g. R2.50)
  platformFee: number;  // 1.5% micro-transaction platform fee
  charityName: string;  // Charity supported
  timestamp: string;    // Time of swipe
}

export interface AppConfig {
  activeCharityId: string | null;
  roundUpIncrement: number; // R5, R10, etc.
  totalDonated: number;
  platformFeesEarned: number; // Simulated commercial earnings
  isPremiumDonor: boolean;    // R19/month subscriber for Section 18A tax summaries
  transactions: Transaction[];
}

const DB_PATH = path.join(process.cwd(), "src", "utils", "db.json");

const defaultConfig: AppConfig = {
  activeCharityId: null,
  roundUpIncrement: 5, // Default R5
  totalDonated: 0,
  platformFeesEarned: 0,
  isPremiumDonor: false,
  transactions: [],
};

// Retrieve the database contents
export function getDb(): AppConfig {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
      return defaultConfig;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON database:", err);
    return defaultConfig;
  }
}

// Persist updates to the database
export function saveDb(config: AppConfig): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to JSON database:", err);
  }
}

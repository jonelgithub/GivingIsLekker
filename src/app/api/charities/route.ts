import { NextResponse } from "next/server";

export interface Charity {
  id: string;
  name: string;
  image: string;
  tags: string[];
  description: string;
  accountNumber: string; // Target account for transfers (simulated or real)
}

const charities: Charity[] = [
  {
    id: "imbumba-girls",
    name: "Imbumba Foundation (Caring4Girls)",
    image: "/images/charity_kids.png",
    tags: ["kids", "education", "development"],
    description: "Supporting rural South African schoolgirls with scholastic access, hygiene essentials, and mentorship.",
    accountNumber: "98765432101",
  },
  {
    id: "shonaquip-mobility",
    name: "Shonaquip Social Enterprise",
    image: "/images/charity_disability.png",
    tags: ["disability", "kids", "inclusion"],
    description: "Creating community inclusion, custom wheelchair mobility, and support systems for children with disabilities.",
    accountNumber: "98765432102",
  },
  {
    id: "abalimi-farming",
    name: "Abalimi Bezekhaya (Township Farmers)",
    image: "/images/charity_environment.png",
    tags: ["environment", "farming", "community"],
    description: "Empowering urban micro-farmers, community organic vegetable gardens, and food security in Cape Town townships.",
    accountNumber: "98765432103",
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: charities });
}

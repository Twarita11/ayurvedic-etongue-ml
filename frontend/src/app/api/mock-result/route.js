import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    herbName: "Ashwagandha",
    status: "Authentic",
    confidence: 92,
    tasteProfile: [
      { taste: "Sweet", value: 30 },
      { taste: "Sour", value: 20 },
      { taste: "Salty", value: 10 },
      { taste: "Bitter", value: 60 },
      { taste: "Pungent", value: 40 },
      { taste: "Astringent", value: 50 },
    ],
    compounds: [
      { compound: "Quercetin", value: 45 },
      { compound: "Alkaloids", value: 70 },
      { compound: "Tannins", value: 55 },
    ],
  });
}

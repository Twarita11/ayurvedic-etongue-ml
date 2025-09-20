import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    herbName: "Ashwagandha",
    status: "Authentic",
    confidence: 92,
    tasteProfile: [
      { taste: "Sweet", value: 3 },
      { taste: "Sour", value: 2 },
      { taste: "Salty", value: 1 },
      { taste: "Bitter", value: 3 },
      { taste: "Pungent", value: 4 },
      { taste: "Astringent", value: 5 },
    ],
    compounds: [
      { compound: "Quercetin", value: 45 },
      { compound: "Alkaloids", value: 70 },
      { compound: "Tannins", value: 55 },
    ],
  });
}

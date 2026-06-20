import { NextResponse } from "next/server";
import { importGiglingsForWallet } from "@/services/gigling-import";

// On-chain lookups + multiple API/DB writes can take a moment.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { success: false, error: "walletAddress is required" },
        { status: 400 },
      );
    }

    const result = await importGiglingsForWallet(walletAddress);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

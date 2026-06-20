import { NextResponse } from "next/server";
import { importGiglingsForWallet } from "@/services/gigling-import";

// On-chain lookups + multiple API/DB writes can take a moment.
export const maxDuration = 60;

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const walletAddress = body?.walletAddress;
    // Validate the address shape up front so a bad value can't reach viem (and
    // leak an internal error) or kick off needless on-chain/API/DB work.
    if (typeof walletAddress !== "string" || !EVM_ADDRESS.test(walletAddress.trim())) {
      return NextResponse.json(
        { success: false, error: "A valid wallet address is required." },
        { status: 400 },
      );
    }

    const result = await importGiglingsForWallet(walletAddress.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[giglings/import] import failed:", error);
    return NextResponse.json(
      { success: false, error: "Import failed." },
      { status: 500 },
    );
  }
}

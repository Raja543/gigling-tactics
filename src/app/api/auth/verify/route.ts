import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPublicClient, http } from "viem";
import { abstract } from "viem/chains";
import { parseSiweMessage, verifySiweMessage } from "viem/siwe";
import { ensureUser } from "@/services/card-sync";

const client = createPublicClient({
  chain: abstract,
  transport: http(process.env.NEXT_PUBLIC_ABSTRACT_RPC),
});

// Verify a Sign-In With Ethereum message. `verifySiweMessage` validates EOA
// signatures and ERC-1271 smart-account signatures (Abstract Global Wallet) via
// the on-chain public client.
export async function POST(request: Request) {
  try {
    const { message, signature } = await request.json();
    if (!message || !signature) {
      return NextResponse.json(
        { success: false, error: "message and signature are required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const nonce = cookieStore.get("siwe-nonce")?.value;
    if (!nonce) {
      return NextResponse.json(
        { success: false, error: "Missing or expired nonce. Request a new one." },
        { status: 400 },
      );
    }

    const valid = await verifySiweMessage(client, { message, signature, nonce });
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const { address } = parseSiweMessage(message);
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Could not resolve address from message" },
        { status: 400 },
      );
    }

    await ensureUser(address.toLowerCase());

    // Replace the one-time nonce with a session bound to the verified address.
    cookieStore.delete("siwe-nonce");
    cookieStore.set("siwe-session", address.toLowerCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, address: address.toLowerCase() });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 },
    );
  }
}

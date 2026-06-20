import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateSiweNonce } from "viem/siwe";

// Issue a SIWE nonce and stash it in an httpOnly cookie so /verify can confirm
// the signed message used the nonce we handed out.
export async function GET() {
  const nonce = generateSiweNonce();

  const cookieStore = await cookies();
  cookieStore.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return NextResponse.json({ nonce });
}

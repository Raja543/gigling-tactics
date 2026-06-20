import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Return the currently authenticated wallet address (if any).
export async function GET() {
  const cookieStore = await cookies();
  const address = cookieStore.get("siwe-session")?.value ?? null;
  return NextResponse.json({ address, authenticated: Boolean(address) });
}

// Clear the SIWE session.
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("siwe-session");
  return NextResponse.json({ success: true });
}

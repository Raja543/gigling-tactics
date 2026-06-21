import { describe, expect, it, vi, beforeEach } from "vitest";

// vi.mock is hoisted, so build the mocks via vi.hoisted to keep refs accessible.
const { db, cookieStore } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    deck: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    battle: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown) => (Array.isArray(ops) ? Promise.all(ops as Promise<unknown>[]) : ops)),
  },
  cookieStore: { get: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve(cookieStore) }));

import { PATCH as deckPatch, DELETE as deckDelete } from "@/app/api/decks/[id]/route";
import { PUT as profilePut } from "@/app/api/profile/route";

const OWNER = "0x1111111111111111111111111111111111111111";
const ATTACKER = "0x2222222222222222222222222222222222222222";

function req(body: unknown) {
  return new Request("http://t/api", { method: "POST", body: JSON.stringify(body) });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("decks/[id] — ownership (IDOR guard)", () => {
  it("rejects DELETE without a wallet (400)", async () => {
    const res = await deckDelete(req({}), params("deck1"));
    expect(res.status).toBe(400);
    expect(db.deck.delete).not.toHaveBeenCalled();
  });

  it("rejects DELETE by a non-owner (404, not enumerable)", async () => {
    db.user.findUnique.mockResolvedValue({ id: "attacker-user" });
    db.deck.findUnique.mockResolvedValue({ id: "deck1", userId: "owner-user" }); // owned by someone else
    const res = await deckDelete(req({ walletAddress: ATTACKER }), params("deck1"));
    expect(res.status).toBe(404);
    expect(db.deck.delete).not.toHaveBeenCalled();
    expect(db.battle.deleteMany).not.toHaveBeenCalled();
  });

  it("allows DELETE by the owner", async () => {
    db.user.findUnique.mockResolvedValue({ id: "owner-user" });
    db.deck.findUnique.mockResolvedValue({ id: "deck1", userId: "owner-user" });
    const res = await deckDelete(req({ walletAddress: OWNER }), params("deck1"));
    expect(res.status).toBe(200);
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("rejects PATCH (rename) by a non-owner (404)", async () => {
    db.user.findUnique.mockResolvedValue({ id: "attacker-user" });
    db.deck.findUnique.mockResolvedValue({ id: "deck1", userId: "owner-user" });
    const res = await deckPatch(req({ walletAddress: ATTACKER, name: "pwned" }), params("deck1"));
    expect(res.status).toBe(404);
    expect(db.deck.update).not.toHaveBeenCalled();
  });
});

describe("profile PUT — session ownership", () => {
  it("rejects when no session cookie (401)", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const res = await profilePut(req({ walletAddress: OWNER, username: "x" }));
    expect(res.status).toBe(401);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects when the session wallet differs from the target (401)", async () => {
    cookieStore.get.mockReturnValue({ value: ATTACKER });
    const res = await profilePut(req({ walletAddress: OWNER, username: "x" }));
    expect(res.status).toBe(401);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("allows the authenticated owner and caps the username", async () => {
    cookieStore.get.mockReturnValue({ value: OWNER });
    db.user.update.mockResolvedValue({ id: "u", username: "x" });
    const res = await profilePut(req({ walletAddress: OWNER, username: "a".repeat(60) }));
    expect(res.status).toBe(200);
    const arg = db.user.update.mock.calls[0][0];
    expect(arg.data.username.length).toBeLessThanOrEqual(24);
  });
});

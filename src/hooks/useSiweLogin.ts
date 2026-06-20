"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { abstract } from "viem/chains";
import { createSiweMessage } from "viem/siwe";

/**
 * Full Sign-In With Ethereum flow against the Abstract Global Wallet:
 *   1. fetch a server nonce,
 *   2. build + sign a SIWE message with the connected wallet,
 *   3. POST it to /api/auth/verify to establish a session cookie.
 *
 * Works with AGW smart accounts - the server verifies via ERC-1271.
 */
export function useSiweLogin() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError("Connect your Abstract wallet first.");
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { nonce } = await fetch("/api/auth/nonce").then((r) => r.json());

      const message = createSiweMessage({
        address,
        chainId: chainId ?? abstract.id,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        statement: "Sign in to Gigling Tactics",
        version: "1",
      });

      const signature = await signMessageAsync({ message });

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Verification failed.");
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, signMessageAsync]);

  return { signIn, isLoading, error };
}

"use client";

import { Button } from "@/components/ui/Button";
import { useWallet } from "./WalletProvider";

export function ConnectButton() {
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWallet();

  if (isConnected && address) {
    return (
      <Button variant="secondary" onClick={disconnect}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button variant="primary" onClick={connect} isLoading={isConnecting}>
      Connect Abstract Wallet
    </Button>
  );
}

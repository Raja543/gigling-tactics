"use client";

import { createContext, useContext, ReactNode } from "react";
import { abstract } from "viem/chains";
import { useAccount } from "wagmi";
import {
  AbstractWalletProvider,
  useLoginWithAbstract,
} from "@abstract-foundation/agw-react";
import { QueryProvider } from "@/components/providers/QueryProvider";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  /** Open the Abstract Global Wallet login flow. */
  connect: () => void;
  /** Disconnect the Abstract Global Wallet. */
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: () => {},
  disconnect: () => {},
});

function WalletAdapter({ children }: { children: ReactNode }) {
  const { address, isConnected, status } = useAccount();
  const { login, logout } = useLoginWithAbstract();

  const value: WalletContextType = {
    address: address ?? null,
    isConnected,
    isConnecting: status === "connecting" || status === "reconnecting",
    connect: login,
    disconnect: logout,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  // Abstract Global Wallet is the only supported wallet. AbstractWalletProvider
  // wires up wagmi + the AGW connector for the Abstract chain.
  return (
    <AbstractWalletProvider chain={abstract}>
      <QueryProvider>
        <WalletAdapter>{children}</WalletAdapter>
      </QueryProvider>
    </AbstractWalletProvider>
  );
}

export const useWallet = () => useContext(WalletContext);

import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: "Gigling Tactics",
  description: "Turn your Giglings into playable trading cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen">
        <WalletProvider>
          <ToastProvider>
            <Navbar />
            <CommandPalette />
            <main className="flex-1">
              {children}
            </main>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

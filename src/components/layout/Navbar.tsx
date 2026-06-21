"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Swords } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@/components/wallet/ConnectButton";

const NAV_LINKS = [
  { href: "/explorer", label: "Cards" },
  { href: "/collection", label: "Collection" },
  { href: "/team-builder", label: "Team" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboards", label: "Ranks" },
  { href: "/profile", label: "Profile" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span
            className="grid place-items-center w-9 h-9 rounded-xl text-white shadow-lg transition-transform group-hover:scale-105 group-hover:rotate-3"
            style={{ background: "linear-gradient(135deg, var(--color-primary, #6C5CE7), var(--color-accent, #a855f7))", boxShadow: "0 0 18px rgba(108,92,231,0.45)" }}
          >
            <Swords size={18} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-lg font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
            Gigling Tactics
          </span>
        </Link>

        {/* Desktop Nav — pill links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.03] border border-white/5 px-1.5 py-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors z-10",
                  isActive ? "text-white" : "text-white/55 hover:text-white",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: "linear-gradient(135deg, rgba(108,92,231,0.35), rgba(168,85,247,0.25))", border: "1px solid rgba(168,85,247,0.4)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: wallet */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ConnectButton />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-white/80 rounded-lg hover:bg-white/5"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1 overflow-hidden"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium rounded-lg px-3 py-2.5 transition-colors",
                  isActive ? "text-white bg-primary/15 border border-primary/30" : "text-white/60 hover:bg-white/5",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3">
            <ConnectButton />
          </div>
        </motion.div>
      )}
    </header>
  );
}

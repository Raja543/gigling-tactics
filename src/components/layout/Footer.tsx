import Link from "next/link";
import { Swords, MessageCircle, AtSign, Globe } from "lucide-react";

const SOCIALS = [
  { icon: Globe, label: "Gigaverse", href: "https://gigaverse.io" },
  { icon: MessageCircle, label: "Discord", href: "https://gigaverse.io" },
  { icon: AtSign, label: "X / Twitter", href: "https://x.com/gigaverse_io" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#08080c] py-14">
      <div className="container mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5 w-max">
            <span className="grid place-items-center w-8 h-8 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #e23bd6, #2dd4bf)", boxShadow: "0 0 14px rgba(226,59,214,0.4)" }}>
              <Swords size={16} strokeWidth={2.5} />
            </span>
            <span className="font-heading text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Gigling Tactics</span>
          </Link>
          <p className="text-white/55 max-w-sm leading-relaxed">
            A fan-made TCG and auto-battler powered by real Gigling Racing NFTs. Build your squad and enter the arena.
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
            Built on Abstract Chain
          </div>
          {/* Socials */}
          <div className="flex items-center gap-2.5 pt-2">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/10 text-white/50 hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-colors">
                <s.icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Game links */}
        <div>
          <h3 className="font-semibold mb-4 text-white/90">Game</h3>
          <ul className="space-y-2.5 text-sm text-white/55">
            {[["Explorer", "/explorer"], ["Collection", "/collection"], ["Team Builder", "/team-builder"], ["Arena", "/arena"]].map(([l, h]) => (
              <li key={h}><Link href={h} className="hover:text-white transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* More links */}
        <div>
          <h3 className="font-semibold mb-4 text-white/90">More</h3>
          <ul className="space-y-2.5 text-sm text-white/55">
            {[["Leaderboards", "/leaderboards"], ["Profile", "/profile"], ["Docs", "/docs"]].map(([l, h]) => (
              <li key={h}><Link href={h} className="hover:text-white transition-colors">{l}</Link></li>
            ))}
            <li><a href="https://abs.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Abstract Chain</a></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Gigling Tactics. Not affiliated with the official Gigaverse team.
      </div>
    </footer>
  );
}

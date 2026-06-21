import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#08080c] py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-heading text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gigling Tactics
          </h2>
          <p className="text-white/60 max-w-sm">
            A fan-made TCG and auto-battler powered by real Gigling NFTs. Build your team and enter the arena.
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
            Built on Abstract Chain
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-white/90">Game</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/explorer" className="hover:text-white transition-colors">Card Explorer</Link></li>
            <li><Link href="/arena" className="hover:text-white transition-colors">Battle Arena</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-white/90">Community</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li><a href="https://gigaverse.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Gigaverse</a></li>
            <li><a href="https://abs.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Abstract Chain</a></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Gigling Tactics. Not affiliated with official Gigaverse team.
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  RARITY_STYLES,
  FACTION_STYLES,
  type RarityKey,
  type FactionKey,
} from "@/lib/cosmetics";
import {
  PERFORMANCE_WEIGHTS,
  PERFORMANCE_NORMALIZATION,
  OVR_TRAIT_WEIGHT,
  OVR_PERFORMANCE_WEIGHT,
  CARD_STAT_MIN,
  CARD_STAT_MAX,
  BATTLE_TURN_LIMIT,
  BATTLE_HEALTH_MULTIPLIER,
} from "@/engine/balance";
import { Info, Target, Zap, Shield, Heart, Swords, Trophy, Users, ArrowRightLeft, PackageOpen, Dices } from "lucide-react";

const SECTIONS = [
  ["overview", "Overview"],
  ["how-to-play", "How to Play"],
  ["card-generation", "Card Generation Engine"],
  ["stats", "Individual Stats"],
  ["rarities", "Rarities"],
  ["factions", "Factions & Synergies"],
  ["traits", "Traits & Abilities"],
  ["battle", "Combat System"],
  ["arenas", "Ranked Arenas"],
  ["roadmap", "Roadmap"],
];

const RARITY_ORDER: RarityKey[] = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "RELIC", "GIGA"];

const FACTION_PRIMARY: Record<FactionKey, string> = {
  NONE: "Balanced",
  CRUSADER: "Attack",
  OVERSEER: "Speed",
  ATHENA: "Attack + Defense",
  ARCHON: "Attack + Defense",
  FOXGLOVE: "Speed + Health",
  SUMMONER: "Health",
  CHOBO: "Attack + Speed",
  GIGUS: "Defense + Health",
};
const FACTION_ORDER: FactionKey[] = [
  "CRUSADER", "OVERSEER", "ATHENA", "ARCHON", "FOXGLOVE", "SUMMONER", "CHOBO", "GIGUS", "NONE",
];

const SYNERGIES = [
  ["Faction Unity", "All 3 cards share a faction", "+20% to that faction's primary stat"],
  ["Battle Brothers", "2 cards share a faction", "+10% to that faction's primary stat"],
  ["Full Diversity", "All 3 factions different", "+8% to all stats"],
  ["War Council", "Crusader + Overseer + Archon", "+20% team Attack"],
  ["Nature's Guard", "Foxglove + Chobo + Gigus", "+15% Defense, +10% Health"],
  ["Mystic Alliance", "Summoner + Foxglove", "+10% all stats, bonus crit"],
];

const TRAITS = [
  ["Clutch", "Last Stand", "Below 30% HP, Attack +25% up to +50% by tier"],
  ["Surger", "Power Surge", "Every 3rd attack deals +50% up to +100% damage"],
  ["Closer", "Finishing Blow", "+20% up to +50% damage to targets below 50% HP"],
  ["Fast Start", "First Strike", "+20% up to +50% Speed for the first 3 turns"],
  ["Comeback", "Second Wind", "Heal 15% up to 35% HP once when dropping below 50%"],
  ["Steady", "Iron Guard", "Permanent +10% up to +30% Defense"],
  ["Volatile", "Wild Card", "Chance to deal 2x damage, small chance to miss"],
  ["Faction Heart", "Rally Cry", "If 2+ allies share a faction, +10% up to +20% all stats"],
];

const SPECIALS: [RarityKey, string, string][] = [
  ["COMMON", "Every 4th turn", "1.0x"],
  ["UNCOMMON", "Every 4th turn", "1.2x"],
  ["RARE", "Every 3rd turn", "1.4x"],
  ["EPIC", "Every 3rd turn", "1.6x"],
  ["LEGENDARY", "Every 2nd turn", "2.0x"],
  ["RELIC", "Every 2nd turn", "2.5x"],
  ["GIGA", "Every 2nd turn", "3.0x"],
];

const ARENAS = [
  ["Bronze", "40-55 OVR", "Standard ELO multipliers"],
  ["Silver", "55-70 OVR", "Moderate ELO multipliers"],
  ["Gold", "70-85 OVR", "High ELO multipliers"],
  ["Legend", "85-99 OVR", "Extreme ELO multipliers"],
];

const FUTURE_PLANS: [React.ReactNode, string, string][] = [
  [<Swords key="1" size={32} className="text-white/80" />, "PvP Battles", "Real-time head-to-head duels over WebSockets."],
  [<Trophy key="2" size={32} className="text-white/80" />, "Ranked Seasons + Ladder", "Competitive seasons with placement, resets and rewards."],
  [<Shield key="3" size={32} className="text-white/80" />, "Guild System + Guild Wars", "Form guilds and battle other guilds for territory."],
  [<ArrowRightLeft key="4" size={32} className="text-white/80" />, "Card Trading + Marketplace", "Trade and sell Gigling cards with other players."],
  [<PackageOpen key="5" size={32} className="text-white/80" />, "Pack Opening Experience", "Cinematic pack reveals to grow your collection."],
  [<Dices key="6" size={32} className="text-white/80" />, "Tournaments", "Bracketed events with prize pools and glory."],
];

function cap(s: string) {
  return s[0] + s.slice(1).toLowerCase();
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-3xl font-heading font-black mb-6 flex items-center gap-4">
        <span className="h-6 w-2 rounded-full bg-gradient-to-b from-primary to-accent shadow-[0_0_15px_rgba(108,92,231,0.5)]" />
        {title}
      </h2>
      <div className="text-white/70 leading-relaxed space-y-4 text-[15px]">{children}</div>
    </section>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-surface/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-xl ${className}`}>{children}</div>;
}

export default function DocsPage() {
  const [active, setActive] = useState(SECTIONS[0][0]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActive = SECTIONS[0][0];
      // We check which section's top is at or above the navbar/offset
      for (const [id] of SECTIONS) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // 150px allows a buffer for the sticky header
          if (rect.top <= 150) {
            currentActive = id;
          }
        }
      }
      setActive(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Trigger once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-14">
        <h1 className="text-5xl md:text-6xl font-heading font-black mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-accent bg-clip-text text-transparent">
            Game Engine Documentation
          </span>
        </h1>
        <p className="text-white/60 text-lg md:text-xl max-w-3xl leading-relaxed">
          The complete technical manual for Gigling Tactics. Understand the deterministic generation engine, 
          combat mathematics, and the ranked economy to dominate the arena.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 relative items-start">
        
        {/* Left Sticky Sidebar (Table of Contents) */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-28 h-max">
          <nav className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 pb-4 border-b border-white/10">
              Table of Contents
            </div>
            <ul className="space-y-1.5">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`block text-sm rounded-lg px-4 py-2 transition-all ${
                      active === id
                        ? "text-white bg-primary/20 border-l-2 border-primary font-bold shadow-sm"
                        : "text-white/50 border-l-2 border-transparent hover:text-white hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content (Wider) */}
        <div className="flex-1 min-w-0 w-full">
          
          <Section id="overview" title="Overview">
            <p>
              Gigling Tactics is a strategic 3v3 auto-battler built on top of the Abstract Chain. It takes your real 
              <strong className="text-white"> Gigling Racing NFTs</strong> and deterministically converts their racing histories, traits, 
              and rarity into playable trading cards.
            </p>
            <Panel className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 mt-4">
              <div className="flex items-start gap-3">
                <Info className="text-primary shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-white/80">
                  <strong className="text-white">Live Data Synchronization:</strong> The game automatically syncs your cards with the 
                  Gigaverse API every day. If your NFT races more, its card stats will dynamically evolve the next time it's synced.
                </p>
              </div>
            </Panel>
          </Section>

          <Section id="how-to-play" title="How to Play">
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                ["1. Connect", "Sign in with your Abstract Global Wallet. No separate account creation is required."],
                ["2. Import", "Your owned NFTs are automatically indexed and converted into playable cards on the fly."],
                ["3. Build", "Assemble a 3-card squad. Focus on Faction Synergies and stat composition (e.g., Tank, DPS, Speed)."],
                ["4. Battle", "Enter the Arena. Combat is fully automated—your strategy in squad building determines the outcome."],
              ].map(([t, d]) => (
                <Panel key={t}>
                  <div className="text-lg font-heading font-bold text-white mb-2">{t}</div>
                  <div className="text-sm text-white/60 leading-relaxed">{d}</div>
                </Panel>
              ))}
            </div>
          </Section>

          <Section id="card-generation" title="Card Generation Engine">
            <p>
              The generation engine creates stats deterministically. Two core components combine to form the 
              <strong className="text-white"> Overall Rating (OVR)</strong> of your card. Skill is mathematically weighted higher than Rarity.
            </p>

            <Panel className="my-6">
              <div className="text-xl font-heading font-bold text-white mb-3">Overall Rating Formula</div>
              <code className="block text-sm font-mono text-accent bg-black/40 rounded-lg p-4 border border-white/5 mb-4">
                OVR = TraitScore × {OVR_TRAIT_WEIGHT} + PerformanceScore × {OVR_PERFORMANCE_WEIGHT}
              </code>
              <p className="text-sm text-white/60">
                The resulting 0-100 composite score is then linearly mapped onto the {CARD_STAT_MIN}-{CARD_STAT_MAX} display band. 
                This ensures the full visual range is utilized, preventing all cards from bunching at the mathematical floor.
              </p>
            </Panel>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Panel>
                <div className="font-heading font-bold text-white mb-3 text-lg border-b border-white/10 pb-2">Trait Score (Rarity)</div>
                <p className="text-sm text-white/60 mb-4">
                  A base weight derived from the NFT&apos;s literal rarity tier, plus a deterministic bonus derived from its traits.
                  Higher rarity guarantees a higher mathematical floor, from a baseline of 15 (Common) up to 100 (Giga).
                </p>
              </Panel>
              <Panel>
                <div className="font-heading font-bold text-white mb-3 text-lg border-b border-white/10 pb-2">Performance Score (Skill)</div>
                <p className="text-sm text-white/60 mb-4">
                  Derived entirely from the NFT's live racing history. The engine normalizes real-world data against caps to prevent flatlining.
                </p>
                <ul className="text-sm text-white/70 space-y-2">
                  <li className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded">
                    <span>Win Rate</span> <span className="font-mono text-emerald-400">{PERFORMANCE_WEIGHTS.winRate}% weight</span>
                  </li>
                  <li className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded">
                    <span>Total Wins</span> <span className="font-mono text-emerald-400">{PERFORMANCE_WEIGHTS.wins}% weight</span>
                  </li>
                  <li className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded">
                    <span>ELO Rating</span> <span className="font-mono text-emerald-400">{PERFORMANCE_WEIGHTS.elo}% weight</span>
                  </li>
                  <li className="flex justify-between items-center bg-black/20 px-3 py-1.5 rounded">
                    <span>Races Run</span> <span className="font-mono text-emerald-400">{PERFORMANCE_WEIGHTS.races}% weight</span>
                  </li>
                </ul>
              </Panel>
            </div>
          </Section>

          <Section id="stats" title="Individual Stats">
            <p>During combat, a card's OVR is broken down into four foundational battle stats ({CARD_STAT_MIN} to {CARD_STAT_MAX}).</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Panel className="border-l-4 border-l-[#FF4757]">
                <div className="flex items-center gap-2 mb-2"><Target className="text-[#FF4757]" size={18}/> <strong className="text-white">Attack</strong></div>
                <p className="text-xs text-white/60">Derived from Finish Range + Win Rate + Offensive Traits. Determines raw damage output.</p>
              </Panel>
              <Panel className="border-l-4 border-l-[#3B82F6]">
                <div className="flex items-center gap-2 mb-2"><Shield className="text-[#3B82F6]" size={18}/> <strong className="text-white">Defense</strong></div>
                <p className="text-xs text-white/60">Derived from Stamina Range + Race Experience. Mitigates incoming attack damage.</p>
              </Panel>
              <Panel className="border-l-4 border-l-[#FFD700]">
                <div className="flex items-center gap-2 mb-2"><Zap className="text-[#FFD700]" size={18}/> <strong className="text-white">Speed</strong></div>
                <p className="text-xs text-white/60">Derived from Speed/Start Ranges. Determines exactly who attacks first each turn.</p>
              </Panel>
              <Panel className="border-l-4 border-l-[#00D9A6]">
                <div className="flex items-center gap-2 mb-2"><Heart className="text-[#00D9A6]" size={18}/> <strong className="text-white">Health</strong></div>
                <p className="text-xs text-white/60">Derived from Stamina + Reveals + Experience. Multiplied by {BATTLE_HEALTH_MULTIPLIER}x in actual combat.</p>
              </Panel>
            </div>
          </Section>

          <Section id="battle" title="Combat System Mechanics">
            <p>
              Combat plays out automatically over a maximum of <strong className="text-white">{BATTLE_TURN_LIMIT} turns</strong>. 
              Understanding the mathematics of the combat engine is critical to building a winning squad.
            </p>

            <Panel className="my-6">
              <div className="font-heading font-bold text-white mb-3 text-lg">1. Turn Order (Speed)</div>
              <p className="text-sm text-white/60 mb-3">
                Every turn, the engine sorts all living combatants by their <strong>Effective Speed</strong>. 
                Speed determines initiative—attacking first is a massive advantage because a dead unit cannot counter-attack.
              </p>
              <code className="block text-sm font-mono text-white/80 bg-black/40 rounded p-3 mb-2 border border-white/5">
                EffectiveSpeed = BaseSpeed × (1 + TraitBoost) + (Luck ÷ 10)
              </code>
              <p className="text-xs text-white/40 italic">Note: Luck serves as a micro-tiebreaker when Base Speeds are identical.</p>
            </Panel>

            <Panel className="my-6">
              <div className="font-heading font-bold text-white mb-3 text-lg">2. Damage Resolution</div>
              <p className="text-sm text-white/60 mb-3">
                Damage is resolved using a net-difference formula. Defense directly subtracts from incoming Attack power, making highly defensive tanks very difficult to kill without raw DPS.
              </p>
              <code className="block text-sm font-mono text-white/80 bg-black/40 rounded p-3 mb-2 border border-white/5">
                Damage = Math.max(1, (Attack × SpecialMultiplier) - (Defense × 0.5))
              </code>
              <p className="text-xs text-white/40 italic">Note: Special attacks (based on rarity) multiply the base Attack before Defense is subtracted, making them devastating.</p>
            </Panel>

            <div className="grid sm:grid-cols-2 gap-4">
              <Panel>
                <div className="font-heading font-bold text-white mb-2">3. The 15-Turn Limit</div>
                <p className="text-sm text-white/60">
                  Battles are fast and lethal due to the {BATTLE_HEALTH_MULTIPLIER}x Health multiplier. If the battle reaches turn {BATTLE_TURN_LIMIT} without a total team wipe, 
                  the victor is decided by the highest remaining total team Health percentage.
                </p>
              </Panel>
              <Panel>
                <div className="font-heading font-bold text-white mb-2">4. Critical Hits & Luck</div>
                <p className="text-sm text-white/60">
                  Every card has a hidden Luck stat (1-20). The engine rolls a d20 against this stat; a success results in a Critical Hit, dealing 1.5x damage on top of the base calculation.
                </p>
              </Panel>
            </div>
          </Section>

          <Section id="arenas" title="Ranked Arenas & Matchmaking">
            <p>
              Gigling Tactics utilizes a rigorous ELO matchmaking system. Climbing the ladder is mathematically designed to be highly competitive and punishing.
            </p>
            <Panel className="my-4 border-l-4 border-l-fuchsia-500 bg-gradient-to-r from-fuchsia-500/5 to-transparent">
              <div className="font-heading font-bold text-white mb-2 text-lg">Hardcore ELO Economy</div>
              <p className="text-sm text-white/70 mb-3">
                Unlike casual games, our ranking economy heavily penalizes losses to prevent rating inflation. You cannot simply "grind" your way to the top with a low win-rate.
              </p>
              <ul className="text-sm text-white/60 space-y-2 font-mono">
                <li>• Victory Reward: <span className="text-emerald-400">+15 to +30 ELO</span> (Scales by Tier)</li>
                <li>• Defeat Penalty: <span className="text-rose-400">-13 to -28 ELO</span> (Almost identical to the reward)</li>
                <li>• Draw Outcome: <span className="text-slate-400">+5 ELO</span></li>
              </ul>
              <p className="text-xs text-white/40 mt-4 italic">Conclusion: You must maintain a True Win Rate greater than 50% to climb effectively.</p>
            </Panel>
          </Section>

          <Section id="factions" title="Factions & Synergies">
            <p>Every Gigling belongs to a faction. Building around factions unlocks team synergies.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {FACTION_ORDER.map((f) => {
                const s = FACTION_STYLES[f];
                return (
                  <div key={f} className="bg-surface/50 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:bg-surface transition-colors">
                    {s.logo ? (
                      <img src={s.logo} alt="" className="h-6 w-6 [image-rendering:pixelated]" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border border-white/20 bg-black/40" />
                    )}
                    <div>
                      <div className="font-bold text-sm tracking-wide" style={{ color: s.color }}>{cap(f)}</div>
                      <div className="text-[9px] uppercase tracking-widest text-white/40">{FACTION_PRIMARY[f]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 space-y-3">
              <h3 className="font-bold text-lg text-white mb-4">Active Synergies</h3>
              {SYNERGIES.map(([name, desc, effect]) => (
                <div key={name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-black/30 border border-white/5 hover:bg-black/40 transition-colors">
                  <div>
                    <div className="font-bold text-white mb-1">{name}</div>
                    <div className="text-xs text-white/40">{desc}</div>
                  </div>
                  <div className="text-sm font-mono text-accent mt-2 sm:mt-0 font-bold bg-accent/10 px-3 py-1 rounded-full">{effect}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="rarities" title="Rarities & Specials">
            <p>
              A card&apos;s rarity mirrors its Gigling&apos;s on-chain rarity. Higher rarities not only have a higher stat floor, but they also trigger their <strong className="text-white">Special Attack</strong> more frequently and with a higher multiplier.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {RARITY_ORDER.map((r) => {
                const s = RARITY_STYLES[r];
                const special = SPECIALS.find((x) => x[0] === r)!;
                return (
                  <div key={r} className="bg-surface/50 rounded-xl p-4 relative overflow-hidden group" style={{ border: `1px solid ${s.base}44` }}>
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: s.base }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <img src={s.icon} alt="" className="h-6 w-6 [image-rendering:pixelated]" />
                        <div className="font-bold text-sm" style={{ color: s.glow }}>{cap(r)}</div>
                      </div>
                      <div className="text-xs text-white/60 mb-1">{special[1]}</div>
                      <div className="text-lg font-mono font-black text-white drop-shadow-md">{special[2]} Dmg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section id="traits" title="Traits & Abilities">
            <p className="mb-4">
              Traits are converted directly into battle abilities. Abilities scale up based on the Tier (1-3) of the trait on the NFT.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {TRAITS.map(([trait, ability, desc]) => (
                <Panel key={trait} className="flex flex-col h-full hover:bg-surface/70 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-heading font-bold text-white">{ability}</div>
                    <div className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/50 uppercase">{trait}</div>
                  </div>
                  <div className="text-sm text-white/60 mt-auto">{desc}</div>
                </Panel>
              ))}
            </div>
          </Section>

          <Section id="roadmap" title="Roadmap">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FUTURE_PLANS.map(([emoji, title, desc]) => (
                <div key={title} className="bg-surface/40 border border-white/5 rounded-xl p-5 hover:bg-surface transition-colors">
                  <div className="text-3xl mb-3">{emoji}</div>
                  <div className="font-bold text-white mb-2">{title}</div>
                  <div className="text-xs text-white/50 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

      </div>
    </div>
  );
}

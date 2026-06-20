"use client";

import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { factionStyle } from "@/lib/cosmetics";

interface CardFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  factions: string[];
  rarities: string[];
}

export interface FilterState {
  search: string;
  faction: string | null;
  rarity: string | null;
  sort: string;
}

export function CardFilters({ onFilterChange, factions, rarities }: CardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    faction: null,
    rarity: null,
    sort: "ovr_desc",
  });
  const [isOpen, setIsOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  // Non-search filters apply immediately; search is debounced (~300ms) so typing
  // doesn't fire a request per keystroke.
  const updateFilter = (key: keyof FilterState, value: string | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key === "search") {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => onFilterChange(newFilters), 300);
    } else {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const defaultFilters: FilterState = { search: "", faction: null, rarity: null, sort: "ovr_desc" };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = (filters.faction ? 1 : 0) + (filters.rarity ? 1 : 0);

  return (
    <div className="bg-surface/50 border border-white/10 rounded-xl p-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Mobile Toggle & Desktop Sort */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            variant="secondary"
            className="md:hidden flex-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="hidden md:block bg-background border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          >
            <option value="ovr_desc">Highest OVR</option>
            <option value="ovr_asc">Lowest OVR</option>
            <option value="atk_desc">Highest Attack</option>
            <option value="def_desc">Highest Defense</option>
            <option value="spd_desc">Highest Speed</option>
            <option value="hp_desc">Highest Health</option>
          </select>
        </div>
      </div>

      {/* Expandable Filters */}
      <div className={`mt-4 pt-4 border-t border-white/10 ${isOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-wrap gap-6">
          {/* Faction Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Faction</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter("faction", null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filters.faction ? 'bg-white/20 text-white' : 'bg-background border border-white/10 text-white/60 hover:bg-white/5'}`}
              >
                All
              </button>
              {factions.map(f => {
                const fs = factionStyle(f);
                return (
                  <button
                    key={f}
                    onClick={() => updateFilter("faction", f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${filters.faction === f ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background border border-white/10 text-white/60 hover:bg-white/5'}`}
                  >
                    {fs.logo ? (
                      <img src={fs.logo} alt="" aria-hidden className="h-3.5 w-3.5 [image-rendering:pixelated]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fs.color }} />
                    )}
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rarity Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Rarity</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter("rarity", null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filters.rarity ? 'bg-white/20 text-white' : 'bg-background border border-white/10 text-white/60 hover:bg-white/5'}`}
              >
                All
              </button>
              {rarities.map(r => (
                <button
                  key={r}
                  onClick={() => updateFilter("rarity", r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.rarity === r ? 'bg-white/20 text-white border border-white/30' : 'bg-background border border-white/10 text-white/60 hover:bg-white/5'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-end ml-auto">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/40 hover:text-white">
                <X size={14} className="mr-1" /> Clear All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-surface border border-white/10 text-white",
        primary: "bg-primary/20 text-primary border border-primary/30",
        // Rarities (colors sampled from the rarity icons)
        common: "bg-[#9BABB2]/20 text-[#C7DCD0] border border-[#9BABB2]/30",
        uncommon: "bg-[#1EBC73]/20 text-[#50FF93] border border-[#1EBC73]/40",
        rare: "bg-[#02C6D7]/20 text-[#67DDE7] border border-[#02C6D7]/40",
        epic: "bg-[#DE38E1]/20 text-[#EB88ED] border border-[#DE38E1]/40",
        legendary: "bg-[#F79617]/20 text-[#FAC074] border border-[#F79617]/40",
        relic: "bg-[#F04F78]/20 text-[#F695AE] border border-[#F04F78]/40",
        giga: "bg-gradient-to-r from-[#F04F78]/25 via-[#F79617]/25 to-[#02C6D7]/25 text-white border border-[#F79617]/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

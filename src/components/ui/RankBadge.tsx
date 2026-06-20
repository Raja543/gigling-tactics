import React from 'react';

interface RankBadgeProps {
  tier: string;
  subTier?: number; // 1, 2, or 3
  size?: number;
}

export function RankBadge({ tier, subTier = 1, size = 64 }: RankBadgeProps) {
  // Base colors for the main shape and inner shapes
  const colors: Record<string, { fill: string; inner: string; stroke: string; accent: string }> = {
    UNRANKED: { fill: '#1e293b', inner: '#334155', stroke: '#475569', accent: '#94a3b8' },
    IRON: { fill: '#3f3f46', inner: '#27272a', stroke: '#71717a', accent: '#a1a1aa' },
    BRONZE: { fill: '#78350f', inner: '#451a03', stroke: '#b45309', accent: '#d97706' },
    SILVER: { fill: '#94a3b8', inner: '#e2e8f0', stroke: '#cbd5e1', accent: '#f8fafc' },
    GOLD: { fill: '#ca8a04', inner: '#facc15', stroke: '#eab308', accent: '#fef08a' },
    PLATINUM: { fill: '#0891b2', inner: '#06b6d4', stroke: '#22d3ee', accent: '#67e8f9' },
    DIAMOND: { fill: '#9333ea', inner: '#a855f7', stroke: '#c084fc', accent: '#e9d5ff' },
    ASCENDANT: { fill: '#059669', inner: '#10b981', stroke: '#34d399', accent: '#6ee7b7' },
    IMMORTAL: { fill: '#be123c', inner: '#e11d48', stroke: '#f43f5e', accent: '#fda4af' },
    RADIANT: { fill: '#facc15', inner: '#fef08a', stroke: '#fde047', accent: '#ffffff' },
  };

  const c = colors[tier] || colors['UNRANKED'];

  // Render the core shape based on the tier
  const renderShape = () => {
    switch (tier) {
      case 'UNRANKED':
      case 'IRON':
        return (
          <g>
            <ellipse cx="50" cy="50" rx="30" ry="40" fill={c.fill} />
            <ellipse cx="50" cy="50" rx="15" ry="25" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'BRONZE':
        return (
          <g>
            <polygon points="20,20 80,20 50,80" fill={c.fill} />
            <polygon points="35,30 65,30 50,60" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'SILVER':
        return (
          <g>
            <polygon points="50,10 85,50 50,90 15,50" fill={c.fill} />
            <polygon points="50,25 70,50 50,75 30,50" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'GOLD':
        return (
          <g>
            <polygon points="50,10 90,35 75,85 25,85 10,35" fill={c.fill} />
            <polygon points="50,25 75,45 65,70 35,70 25,45" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'PLATINUM':
        return (
          <g>
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill={c.fill} />
            <polygon points="50,25 70,40 70,60 50,75 30,60 30,40" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'DIAMOND':
        return (
          <g>
            <polygon points="30,10 70,10 90,50 70,90 30,90 10,50" fill={c.fill} />
            <polygon points="40,25 60,25 75,50 60,75 40,75 25,50" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'ASCENDANT':
        return (
          <g>
            <polygon points="50,5 75,40 50,95 25,40" fill={c.fill} />
            <polygon points="50,20 62,45 50,75 38,45" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'IMMORTAL':
        return (
          <g>
            <polygon points="50,5 65,35 95,50 65,65 50,95 35,65 5,50 35,35" fill={c.fill} />
            <polygon points="50,20 58,42 80,50 58,58 50,80 42,58 20,50 42,42" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
          </g>
        );
      case 'RADIANT':
        return (
          <g>
            <polygon points="50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35" fill={c.fill} />
            <polygon points="50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40" fill={c.inner} stroke={c.stroke} strokeWidth="2" />
            <polygon points="50,30 55,45 70,50 55,55 50,70 45,55 30,50 45,45" fill={c.accent} />
          </g>
        );
      default:
        return null;
    }
  };

  // Render sub-tier indicators
  const renderSubTier = () => {
    if (tier === 'RADIANT' || tier === 'UNRANKED') return null;

    return (
      <g stroke={c.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {(subTier >= 1) && (
          <path d="M 35 95 L 50 100 L 65 95" />
        )}
        {(subTier >= 2) && (
          <g>
            <path d="M 10 65 L 5 50 L 10 35" />
            <path d="M 90 65 L 95 50 L 90 35" />
          </g>
        )}
        {(subTier >= 3) && (
          <path d="M 35 5 L 50 0 L 65 5" />
        )}
      </g>
    );
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="-5 -5 110 110" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0px 0px 8px ${c.fill}80)` }}
    >
      {renderShape()}
      {renderSubTier()}
    </svg>
  );
}

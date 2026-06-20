export interface EnhancementConfig {
  brightness?: number;
  contrast?: number;
  hueRotate?: number;
  saturate?: number;
  blur?: number;
  dropShadow?: string;
  glowColor?: string;
}

export function getRarityEnhancement(rarity: string): EnhancementConfig {
  switch (rarity.toUpperCase()) {
    case 'COMMON':
      return {
        brightness: 1,
        contrast: 1,
        saturate: 1,
      };
    case 'UNCOMMON':
      return {
        brightness: 1.05,
        contrast: 1.1,
        saturate: 1.1,
        dropShadow: '0 4px 12px rgba(46, 204, 113, 0.2)'
      };
    case 'EPIC':
      return {
        brightness: 1.1,
        contrast: 1.15,
        saturate: 1.2,
        dropShadow: '0 8px 24px rgba(155, 89, 182, 0.4)',
        glowColor: 'rgba(155, 89, 182, 0.2)'
      };
    case 'LEGENDARY':
      return {
        brightness: 1.15,
        contrast: 1.2,
        saturate: 1.3,
        dropShadow: '0 12px 32px rgba(241, 196, 15, 0.6)',
        glowColor: 'rgba(241, 196, 15, 0.3)'
      };
    case 'RELIC':
      return {
        brightness: 1.2,
        contrast: 1.25,
        saturate: 1.4,
        dropShadow: '0 16px 48px rgba(231, 76, 60, 0.8)',
        glowColor: 'rgba(231, 76, 60, 0.4)'
      };
    case 'GIGA':
      return {
        brightness: 1.25,
        contrast: 1.3,
        saturate: 1.5,
        dropShadow: '0 0 64px rgba(255, 255, 255, 0.8)',
        glowColor: 'rgba(255, 255, 255, 0.5)'
      };
    default:
      return { brightness: 1, contrast: 1, saturate: 1 };
  }
}

export function generateEnhancementStyle(config: EnhancementConfig): React.CSSProperties {
  const filters = [];
  if (config.brightness) filters.push(`brightness(${config.brightness})`);
  if (config.contrast) filters.push(`contrast(${config.contrast})`);
  if (config.hueRotate) filters.push(`hue-rotate(${config.hueRotate}deg)`);
  if (config.saturate) filters.push(`saturate(${config.saturate})`);
  if (config.blur) filters.push(`blur(${config.blur}px)`);
  if (config.dropShadow) filters.push(`drop-shadow(${config.dropShadow})`);

  return {
    filter: filters.length > 0 ? filters.join(' ') : 'none',
    transition: 'filter 0.3s ease-in-out, transform 0.3s ease-in-out',
  };
}

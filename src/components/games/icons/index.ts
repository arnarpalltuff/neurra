import React from 'react';
import type { GameId } from '../../../constants/gameConfigs';
import WordWeaveIcon from './WordWeaveIcon';
import PlaceholderIcon from './PlaceholderIcon';

type IconComponent = React.ComponentType<{ size?: number; color?: string; opacity?: number }>;

const ICON_MAP: Partial<Record<GameId, IconComponent>> = {
  'word-weave': WordWeaveIcon,
};

/**
 * Returns the custom SVG icon for a game, or a generic accent-circle
 * placeholder for games whose icons haven't been built yet.
 */
export function iconForGame(gameId: GameId): IconComponent {
  return ICON_MAP[gameId] ?? PlaceholderIcon;
}

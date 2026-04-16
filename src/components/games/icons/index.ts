import React from 'react';
import type { GameId } from '../../../constants/gameConfigs';
import PulseIcon from './PulseIcon';
import GhostKitchenIcon from './GhostKitchenIcon';
import WordWeaveIcon from './WordWeaveIcon';
import FacePlaceIcon from './FacePlaceIcon';
import SignalNoiseIcon from './SignalNoiseIcon';
import ChainReactionIcon from './ChainReactionIcon';
import MindDriftIcon from './MindDriftIcon';
import RewindIcon from './RewindIcon';
import MirrorsIcon from './MirrorsIcon';
import ZenFlowIcon from './ZenFlowIcon';
import SplitFocusIcon from './SplitFocusIcon';

type IconComponent = React.ComponentType<{ size?: number; color?: string; opacity?: number }>;

const ICON_MAP: Record<GameId, IconComponent> = {
  'pulse': PulseIcon,
  'ghost-kitchen': GhostKitchenIcon,
  'word-weave': WordWeaveIcon,
  'face-place': FacePlaceIcon,
  'signal-noise': SignalNoiseIcon,
  'chain-reaction': ChainReactionIcon,
  'mind-drift': MindDriftIcon,
  'rewind': RewindIcon,
  'mirrors': MirrorsIcon,
  'zen-flow': ZenFlowIcon,
  'split-focus': SplitFocusIcon,
};

export function iconForGame(gameId: GameId): IconComponent {
  return ICON_MAP[gameId];
}

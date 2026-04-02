import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ZoneConfig } from '../../stores/groveStore';
import { GroveThemePalette } from '../../constants/groveThemes';

interface GrowthZoneProps {
  zone: ZoneConfig;
  growth: number; // 0-12
  isWilting: boolean;
  palette: GroveThemePalette;
  size: number;
}

// Each zone renders an SVG at the given growth stage (0-12).
// Fractional growth interpolates opacity of the next stage's additions.

function AncestorTree({ growth, palette, size, isWilting }: Omit<GrowthZoneProps, 'zone'>) {
  const s = size;
  const cx = s / 2;
  const stage = Math.floor(growth);
  const frac = growth - stage;
  const trunkH = 10 + stage * 5;
  const trunkW = 4 + stage * 1.2;
  const canopyR = 8 + stage * 4;
  const leafCount = Math.min(stage * 3, 30);
  const wiltOp = isWilting ? 0.6 : 1;
  const leafColor = palette.treeLeaf;
  const trunkColor = palette.treeTrunk;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <RadialGradient id="canopyGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={leafColor} stopOpacity={0.3 * wiltOp} />
          <Stop offset="100%" stopColor={leafColor} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Trunk */}
      <Rect
        x={cx - trunkW / 2} y={s - trunkH - 5}
        width={trunkW} height={trunkH}
        rx={2} fill={trunkColor} opacity={wiltOp}
      />
      {/* Roots */}
      {stage >= 2 && (
        <G opacity={wiltOp * 0.7}>
          <Path d={`M${cx - trunkW / 2} ${s - 5} Q${cx - 15} ${s} ${cx - 18} ${s - 2}`} stroke={trunkColor} strokeWidth={1.5} fill="none" />
          <Path d={`M${cx + trunkW / 2} ${s - 5} Q${cx + 15} ${s} ${cx + 18} ${s - 2}`} stroke={trunkColor} strokeWidth={1.5} fill="none" />
        </G>
      )}
      {/* Canopy glow (stage 6+) */}
      {stage >= 6 && (
        <Circle cx={cx} cy={s - trunkH - canopyR} r={canopyR + 10} fill="url(#canopyGlow)" />
      )}
      {/* Main canopy */}
      {stage >= 1 && (
        <Circle
          cx={cx} cy={s - trunkH - canopyR}
          r={canopyR}
          fill={leafColor}
          opacity={wiltOp * (isWilting ? 0.5 : 0.8)}
        />
      )}
      {/* Branches (stage 3+) */}
      {stage >= 3 && (
        <G opacity={wiltOp}>
          <Path d={`M${cx} ${s - trunkH - 5} L${cx - canopyR * 0.8} ${s - trunkH - canopyR * 0.6}`} stroke={trunkColor} strokeWidth={2} fill="none" />
          <Path d={`M${cx} ${s - trunkH - 5} L${cx + canopyR * 0.7} ${s - trunkH - canopyR * 0.5}`} stroke={trunkColor} strokeWidth={2} fill="none" />
        </G>
      )}
      {/* Leaf clusters (stage 4+) */}
      {Array.from({ length: Math.min(leafCount, 12) }).map((_, i) => {
        const angle = (i / Math.max(leafCount, 1)) * Math.PI * 2;
        const dist = canopyR * 0.6 + (i % 3) * 4;
        const lx = cx + Math.cos(angle) * dist;
        const ly = (s - trunkH - canopyR) + Math.sin(angle) * dist;
        return (
          <Circle
            key={i} cx={lx} cy={ly}
            r={3 + (i % 2)} fill={leafColor}
            opacity={wiltOp * (0.5 + (i % 3) * 0.15)}
          />
        );
      })}
      {/* Flowers/lanterns (stage 9+) */}
      {stage >= 9 && Array.from({ length: Math.min(stage - 8, 5) }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2 + 0.5;
        const dist = canopyR * 0.8;
        const fx = cx + Math.cos(angle) * dist;
        const fy = (s - trunkH - canopyR) + Math.sin(angle) * dist;
        return (
          <Circle key={`f${i}`} cx={fx} cy={fy} r={2.5} fill={palette.particleColor} opacity={0.9} />
        );
      })}
      {/* Next stage preview (fractional) */}
      {frac > 0 && stage < 12 && (
        <Circle
          cx={cx} cy={s - trunkH - canopyR}
          r={canopyR + 2}
          fill={leafColor}
          opacity={frac * 0.15 * wiltOp}
        />
      )}
    </Svg>
  );
}

function CrystalSpire({ growth, palette, size, isWilting }: Omit<GrowthZoneProps, 'zone'>) {
  const s = size;
  const cx = s / 2;
  const stage = Math.floor(growth);
  const crystalH = 10 + stage * 5;
  const crystalW = 6 + stage * 1.5;
  const wiltOp = isWilting ? 0.6 : 1;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <RadialGradient id="crystalGlow" cx="50%" cy="30%" r="60%">
          <Stop offset="0%" stopColor={palette.crystalGlow} stopOpacity={0.4 * wiltOp * Math.min(stage / 6, 1)} />
          <Stop offset="100%" stopColor={palette.crystalGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Glow */}
      {stage >= 4 && (
        <Ellipse cx={cx} cy={s - crystalH / 2 - 5} rx={crystalW + 12} ry={crystalH / 2 + 8} fill="url(#crystalGlow)" />
      )}
      {/* Base rock */}
      <Ellipse cx={cx} cy={s - 4} rx={crystalW + 8} ry={6} fill="#3A3A40" opacity={0.8} />
      {/* Main crystal */}
      <Path
        d={`M${cx} ${s - crystalH - 5} L${cx + crystalW / 2} ${s - 5} L${cx - crystalW / 2} ${s - 5} Z`}
        fill={palette.crystalColor} opacity={wiltOp * 0.85}
      />
      {/* Facet line */}
      <Path
        d={`M${cx} ${s - crystalH - 5} L${cx + crystalW * 0.15} ${s - 5}`}
        stroke={palette.crystalGlow} strokeWidth={0.5} opacity={wiltOp * 0.4}
      />
      {/* Smaller crystals (stage 3+) */}
      {stage >= 3 && (
        <Path
          d={`M${cx - crystalW * 0.6} ${s - crystalH * 0.4 - 5} L${cx - crystalW * 0.4} ${s - 5} L${cx - crystalW * 0.8} ${s - 5} Z`}
          fill={palette.crystalColor} opacity={wiltOp * 0.6}
        />
      )}
      {stage >= 5 && (
        <Path
          d={`M${cx + crystalW * 0.5} ${s - crystalH * 0.35 - 5} L${cx + crystalW * 0.3} ${s - 5} L${cx + crystalW * 0.7} ${s - 5} Z`}
          fill={palette.crystalColor} opacity={wiltOp * 0.6}
        />
      )}
      {/* Rainbow refraction (stage 10+) */}
      {stage >= 10 && (
        <G opacity={wiltOp * 0.3}>
          <Path d={`M${cx} ${s - crystalH - 5} L${cx - 30} ${s - crystalH - 25}`} stroke="#FF6B6B" strokeWidth={1} />
          <Path d={`M${cx} ${s - crystalH - 5} L${cx - 25} ${s - crystalH - 30}`} stroke="#FBBF24" strokeWidth={1} />
          <Path d={`M${cx} ${s - crystalH - 5} L${cx + 30} ${s - crystalH - 25}`} stroke="#7CB8E8" strokeWidth={1} />
        </G>
      )}
    </Svg>
  );
}

function LivingStream({ growth, palette, size, isWilting }: Omit<GrowthZoneProps, 'zone'>) {
  const s = size;
  const stage = Math.floor(growth);
  const streamWidth = 2 + stage * 1.5;
  const wiltOp = isWilting ? 0.6 : 1;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Stream bed */}
      <Path
        d={`M5 ${s * 0.3} Q${s * 0.3} ${s * 0.5} ${s * 0.5} ${s * 0.45} Q${s * 0.7} ${s * 0.4} ${s - 5} ${s * 0.55}`}
        stroke={stage >= 1 ? palette.waterColor : '#3A3A40'}
        strokeWidth={streamWidth}
        fill="none" opacity={wiltOp * 0.9}
        strokeLinecap="round"
      />
      {/* Water glow (stage 5+) */}
      {stage >= 5 && (
        <Path
          d={`M5 ${s * 0.3} Q${s * 0.3} ${s * 0.5} ${s * 0.5} ${s * 0.45} Q${s * 0.7} ${s * 0.4} ${s - 5} ${s * 0.55}`}
          stroke={palette.waterGlow}
          strokeWidth={streamWidth + 4}
          fill="none" opacity={wiltOp * 0.15}
          strokeLinecap="round"
        />
      )}
      {/* Waterfall (stage 7+) */}
      {stage >= 7 && (
        <G opacity={wiltOp}>
          <Path
            d={`M${s - 5} ${s * 0.55} L${s - 5} ${s * 0.75}`}
            stroke={palette.waterColor} strokeWidth={streamWidth * 0.8} fill="none" strokeLinecap="round"
          />
          {/* Splash */}
          <Ellipse cx={s - 5} cy={s * 0.78} rx={8} ry={3} fill={palette.waterColor} opacity={0.3} />
        </G>
      )}
      {/* Fish (stage 8+) */}
      {stage >= 8 && (
        <G opacity={wiltOp * 0.8}>
          <Ellipse cx={s * 0.4} cy={s * 0.46} rx={3} ry={1.5} fill={palette.particleColor} />
          <Ellipse cx={s * 0.6} cy={s * 0.43} rx={2.5} ry={1.2} fill={palette.particleColor} />
        </G>
      )}
      {/* Bioluminescent dots (stage 10+) */}
      {stage >= 10 && Array.from({ length: 6 }).map((_, i) => (
        <Circle
          key={i}
          cx={10 + (i / 5) * (s - 20)} cy={s * 0.3 + Math.sin(i * 1.2) * 15}
          r={1.5} fill={palette.waterGlow} opacity={wiltOp * 0.6}
        />
      ))}
    </Svg>
  );
}

function WindingGarden({ growth, palette, size, isWilting }: Omit<GrowthZoneProps, 'zone'>) {
  const s = size;
  const stage = Math.floor(growth);
  const flowerCount = Math.min(stage * 3, 30);
  const wiltOp = isWilting ? 0.6 : 1;
  const flowerColors = [palette.gardenFlower, palette.particleColor, palette.treeLeaf, '#FFB7C5', '#7CB8E8'];

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Soil */}
      <Rect x={5} y={s - 10} width={s - 10} height={8} rx={4} fill="#3A2818" opacity={0.6} />
      {/* Grass patches */}
      {stage >= 2 && Array.from({ length: Math.min(stage * 2, 10) }).map((_, i) => (
        <Rect
          key={`g${i}`}
          x={8 + (i / 10) * (s - 16)} y={s - 12 - (i % 3) * 2}
          width={4} height={6 + (i % 2) * 3}
          rx={2} fill={palette.treeLeaf} opacity={wiltOp * 0.5}
        />
      ))}
      {/* Flowers */}
      {Array.from({ length: flowerCount }).map((_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const fx = 10 + col * ((s - 20) / 5) + (row % 2) * 5;
        const fy = s - 18 - row * 8;
        if (fy < 5) return null;
        const color = flowerColors[i % flowerColors.length];
        return (
          <G key={i} opacity={wiltOp}>
            <Rect x={fx} y={fy} width={1.5} height={6} fill="#4A7C59" />
            <Circle cx={fx + 0.75} cy={fy - 1} r={2.5 + (i % 2)} fill={color} opacity={0.85} />
          </G>
        );
      })}
      {/* Glowing paths (stage 8+) */}
      {stage >= 8 && (
        <Path
          d={`M${s * 0.2} ${s - 8} Q${s * 0.5} ${s - 25} ${s * 0.8} ${s - 8}`}
          stroke={palette.particleColor} strokeWidth={1.5} fill="none"
          opacity={wiltOp * 0.3} strokeDasharray="3,4"
        />
      )}
      {/* Butterflies (stage 10+) */}
      {stage >= 10 && (
        <G opacity={wiltOp * 0.7}>
          <Circle cx={s * 0.3} cy={s * 0.3} r={2} fill={palette.gardenFlower} />
          <Circle cx={s * 0.7} cy={s * 0.4} r={1.5} fill={palette.particleColor} />
        </G>
      )}
    </Svg>
  );
}

function MyceliumNetwork({ growth, palette, size, isWilting }: Omit<GrowthZoneProps, 'zone'>) {
  const s = size;
  const stage = Math.floor(growth);
  const mushCount = Math.min(1 + stage * 2, 20);
  const wiltOp = isWilting ? 0.6 : 1;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Underground mycelium veins (stage 6+) */}
      {stage >= 6 && (
        <G opacity={wiltOp * 0.2}>
          <Path d={`M${s * 0.2} ${s - 3} Q${s * 0.4} ${s - 15} ${s * 0.5} ${s - 5}`} stroke={palette.mushroomGlow} strokeWidth={1} fill="none" />
          <Path d={`M${s * 0.5} ${s - 5} Q${s * 0.6} ${s - 18} ${s * 0.8} ${s - 3}`} stroke={palette.mushroomGlow} strokeWidth={1} fill="none" />
          <Path d={`M${s * 0.3} ${s - 2} L${s * 0.7} ${s - 2}`} stroke={palette.mushroomGlow} strokeWidth={0.8} fill="none" />
        </G>
      )}
      {/* Mushrooms */}
      {Array.from({ length: mushCount }).map((_, i) => {
        const mx = 8 + (i / mushCount) * (s - 16) + Math.sin(i * 2.3) * 5;
        const capR = 3 + (i % 3) * 2 + (stage > 6 ? 1 : 0);
        const stemH = 4 + (i % 4) * 2;
        const my = s - stemH - 3;
        const glow = stage >= 4;
        return (
          <G key={i} opacity={wiltOp}>
            {/* Glow */}
            {glow && (
              <Circle cx={mx} cy={my - capR} r={capR + 4} fill={palette.mushroomGlow} opacity={0.12} />
            )}
            {/* Stem */}
            <Rect x={mx - 1} y={my} width={2} height={stemH} fill="#D4C4A8" opacity={0.8} />
            {/* Cap */}
            <Ellipse cx={mx} cy={my} rx={capR} ry={capR * 0.6} fill={palette.mushroomCap} opacity={0.85} />
            {/* Spots */}
            {capR > 3 && (
              <>
                <Circle cx={mx - 1} cy={my - 1} r={0.8} fill="#FFF" opacity={0.3} />
                <Circle cx={mx + 1.5} cy={my - 0.5} r={0.6} fill="#FFF" opacity={0.2} />
              </>
            )}
          </G>
        );
      })}
      {/* Spore particles (stage 9+) */}
      {stage >= 9 && Array.from({ length: Math.min(stage - 8, 6) }).map((_, i) => (
        <Circle
          key={`sp${i}`}
          cx={s * 0.2 + i * (s * 0.12)} cy={s * 0.2 + (i % 3) * 8}
          r={1} fill={palette.mushroomGlow} opacity={wiltOp * 0.5}
        />
      ))}
    </Svg>
  );
}

export default function GrowthZone({ zone, growth, isWilting, palette, size }: GrowthZoneProps) {
  const props = { growth, palette, size, isWilting };

  switch (zone.area) {
    case 'memory': return <AncestorTree {...props} />;
    case 'focus': return <CrystalSpire {...props} />;
    case 'speed': return <LivingStream {...props} />;
    case 'flexibility': return <WindingGarden {...props} />;
    case 'creativity': return <MyceliumNetwork {...props} />;
  }
}

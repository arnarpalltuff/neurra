import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
// SVG nebula background — painted cosmic backdrop
// ─────────────────────────────────────────────────────────────
const NEBULA_STARS = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  cx: Math.random() * 100,
  cy: Math.random() * 100,
  r: 0.15 + Math.random() * 0.55,
  op: 0.25 + Math.random() * 0.55,
}));

export function NebulaBackground() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        {/* Deep indigo base wash */}
        <RadialGradient id="nebBase" cx="50%" cy="40%" rx="110%" ry="90%">
          <Stop offset="0%" stopColor="#161235" stopOpacity="1" />
          <Stop offset="55%" stopColor="#0A0A1C" stopOpacity="1" />
          <Stop offset="100%" stopColor="#05060E" stopOpacity="1" />
        </RadialGradient>
        {/* Amber ember bleed, upper-right */}
        <RadialGradient id="nebEmber" cx="78%" cy="22%" rx="65%" ry="50%">
          <Stop offset="0%" stopColor="#D28538" stopOpacity="0.55" />
          <Stop offset="50%" stopColor="#B05A1F" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#3A1E0A" stopOpacity="0" />
        </RadialGradient>
        {/* Lavender glow, lower-left */}
        <RadialGradient id="nebLavender" cx="20%" cy="78%" rx="70%" ry="55%">
          <Stop offset="0%" stopColor="#6A4CB0" stopOpacity="0.5" />
          <Stop offset="55%" stopColor="#372063" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#14082C" stopOpacity="0" />
        </RadialGradient>
        {/* Teal accent, mid-left */}
        <RadialGradient id="nebTeal" cx="12%" cy="38%" rx="40%" ry="30%">
          <Stop offset="0%" stopColor="#2E6B88" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#0A1824" stopOpacity="0" />
        </RadialGradient>
        {/* Central warm halo, behind the orbit */}
        <RadialGradient id="nebCore" cx="50%" cy="52%" rx="35%" ry="32%">
          <Stop offset="0%" stopColor="#FFE3A8" stopOpacity="0.22" />
          <Stop offset="60%" stopColor="#F0B542" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#F0B542" stopOpacity="0" />
        </RadialGradient>
        {/* Vignette edge */}
        <RadialGradient id="nebVignette" cx="50%" cy="50%" rx="85%" ry="85%">
          <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </RadialGradient>
      </Defs>

      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#nebBase)" />
      <Ellipse cx={78} cy={44} rx={80} ry={70} fill="url(#nebEmber)" />
      <Ellipse cx={20} cy={156} rx={85} ry={75} fill="url(#nebLavender)" />
      <Ellipse cx={12} cy={76} rx={55} ry={50} fill="url(#nebTeal)" />
      <Ellipse cx={50} cy={104} rx={45} ry={45} fill="url(#nebCore)" />

      {NEBULA_STARS.map((s) => (
        <Circle
          key={s.id}
          cx={s.cx}
          cy={s.cy * 2}
          r={s.r}
          fill="#FFF8E0"
          opacity={s.op}
        />
      ))}

      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#nebVignette)" />
    </Svg>
  );
}

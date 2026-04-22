import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
// SVG sensor background — deep blue tactical backdrop
// ─────────────────────────────────────────────────────────────
const BG_DOTS = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  cx: Math.random() * 100,
  cy: Math.random() * 200,
  r: 0.12 + Math.random() * 0.4,
  op: 0.2 + Math.random() * 0.5,
}));

export function SensorBackground() {
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
        <RadialGradient id="sBase" cx="50%" cy="42%" rx="110%" ry="90%">
          <Stop offset="0%" stopColor="#0C1628" stopOpacity="1" />
          <Stop offset="55%" stopColor="#060C1A" stopOpacity="1" />
          <Stop offset="100%" stopColor="#030610" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="sTeal" cx="65%" cy="30%" rx="55%" ry="45%">
          <Stop offset="0%" stopColor="#1A5C78" stopOpacity="0.45" />
          <Stop offset="60%" stopColor="#0C2838" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#041420" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sBlue" cx="28%" cy="72%" rx="60%" ry="50%">
          <Stop offset="0%" stopColor="#2A50A0" stopOpacity="0.4" />
          <Stop offset="55%" stopColor="#142848" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#080E24" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sCore" cx="50%" cy="50%" rx="30%" ry="28%">
          <Stop offset="0%" stopColor="#5CAAC9" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#5CAAC9" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sVig" cx="50%" cy="50%" rx="85%" ry="85%">
          <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#sBase)" />
      <Ellipse cx={65} cy={60} rx={70} ry={60} fill="url(#sTeal)" />
      <Ellipse cx={28} cy={144} rx={75} ry={65} fill="url(#sBlue)" />
      <Ellipse cx={50} cy={100} rx={40} ry={40} fill="url(#sCore)" />
      {BG_DOTS.map((d) => (
        <Circle key={d.id} cx={d.cx} cy={d.cy} r={d.r} fill="#A0D4FF" opacity={d.op} />
      ))}
      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#sVig)" />
    </Svg>
  );
}

export const glow = (color: string, radius: number = 16, opacity: number = 0.35) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 } as const,
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: 8,
});

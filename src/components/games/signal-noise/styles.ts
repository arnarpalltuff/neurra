import { StyleSheet, Dimensions } from 'react-native';
import { C } from '../../../constants/colors';

const { width: W, height: H } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

// Styles extracted verbatim from SignalNoise.tsx. No changes.
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030610',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  bgLayer: {
    position: 'absolute',
    top: -20,
    left: -40,
    right: -40,
    bottom: -20,
  },

  heartsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heartIcon: {
    fontSize: 18,
    color: '#E8707E',
    textShadowColor: 'rgba(232,112,126,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heartDepleted: {
    color: C.t4,
    textShadowColor: 'transparent',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pillText: {
    color: C.t1,
    fontSize: 16,
    fontWeight: '900',
  },
  pillTextDim: {
    color: C.t3,
    fontWeight: '700',
  },
  scoreText: {
    color: C.peach,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(224,155,107,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  scoreLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: -1,
  },
  streakSlot: {
    width: 76,
    alignItems: 'flex-end',
  },
  streakPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.5)',
  },
  streakFire: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  streakText: {
    color: C.amber,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  streakLabel: {
    color: C.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },

  sceneFrame: {
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(92,170,201,0.65)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
  },

  scene: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.22)',
  },

  shapeWrap: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },

  scanReticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCENE_SIZE - 40,
    height: SCENE_SIZE - 40,
    marginLeft: -(SCENE_SIZE - 40) / 2,
    marginTop: -(SCENE_SIZE - 40) / 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1.5,
    height: '50%',
    backgroundColor: 'rgba(92,170,201,0.35)',
  },
  scanLineCross: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '50%',
    height: 1.5,
    backgroundColor: 'rgba(92,170,201,0.2)',
  },
  scanLineDiag: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    width: 1,
    height: '35%',
    backgroundColor: 'rgba(92,170,201,0.15)',
    transform: [{ rotate: '45deg' }],
  },

  // Shape highlight — green ring on identified shape
  shapeHighlight: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(110,207,154,0.85)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },

  changeGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(92,170,201,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(92,170,201,0.4)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
  },

  detectionRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#5CAAC9',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 10,
  },

  correctRipple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },

  missedPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: C.coral,
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },

  floatScore: {
    position: 'absolute',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  scoreTrail: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 22,
    fontWeight: '900',
    color: C.peach,
    textShadowColor: 'rgba(224,155,107,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    zIndex: 80,
  },

  precisionWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 92,
  },
  precisionText: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 36,
  },

  confettiOrigin: {
    position: 'absolute',
    top: H * 0.45,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },

  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 88,
  },

  // Scene border glow on wrong
  sceneBorderGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#E8707E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
    zIndex: 5,
  },

  // Danger zone
  dangerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(232,112,126,0.5)',
    backgroundColor: 'rgba(232,112,126,0.05)',
    zIndex: 5,
  },

  // Accuracy
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 4,
  },
  accuracyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  accuracyText: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Scan sweep line
  scanSweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(92,170,201,0.35)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },

  // Countdown ring
  countdownRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },

  // Tap crosshair
  tapCrosshair: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 36,
    height: 1.5,
    backgroundColor: 'rgba(92,170,201,0.7)',
  },
  crossV: {
    position: 'absolute',
    width: 1.5,
    height: 36,
    backgroundColor: 'rgba(92,170,201,0.7)',
  },

  // Combo multiplier
  comboMultWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(92,170,201,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.35)',
    marginTop: 6,
  },
  comboMultText: {
    color: '#5CAAC9',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboMultLabel: {
    color: C.t3,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Sensor glyphs
  sensorGlyph: {
    position: 'absolute',
    fontSize: 120,
    fontWeight: '900',
    color: '#A0D4FF',
    letterSpacing: -4,
  },

  // Signal lock brackets
  signalLockWrap: {
    position: 'absolute',
    width: 56,
    height: 56,
  },
  lockBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: 'rgba(92,170,201,0.85)',
  },
  lockTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 3,
  },
  lockTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 3,
  },
  lockBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 3,
  },
  lockBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 3,
  },

  // Radar ping
  radarPing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCENE_SIZE * 0.7,
    height: SCENE_SIZE * 0.7,
    marginLeft: -SCENE_SIZE * 0.35,
    marginTop: -SCENE_SIZE * 0.35,
    borderRadius: SCENE_SIZE * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.3)',
  },

  // Corner breathing overlay
  cornerBreath: {
    zIndex: 8,
  },

  // Speed bonus
  speedBonusWrap: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(240,181,66,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.6)',
    marginTop: 6,
  },
  speedBonusText: {
    color: C.amber,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Scene vignette
  sceneVignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  // Score milestone
  milestoneWrap: {
    position: 'absolute',
    top: H * 0.25,
    alignSelf: 'center',
    zIndex: 93,
  },
  milestoneText: {
    fontSize: 56,
    fontWeight: '900',
    color: C.amber,
    letterSpacing: -1,
    textShadowColor: 'rgba(240,181,66,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },

  // Scan indicator
  scanIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  scanIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scanIndicatorText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Scene border heartbeat
  sceneHeartbeat: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
  },

  // Sparkle particle
  sparkleParticle: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#5CAAC9',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },

  // Data readout
  dataReadout: {
    position: 'absolute',
    top: 10,
    left: 14,
    zIndex: 10,
  },
  dataReadoutText: {
    color: 'rgba(92,170,201,0.35)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },

  // Analyzing text
  analyzingWrap: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  analyzingText: {
    color: 'rgba(92,170,201,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Center dot
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
    backgroundColor: 'rgba(92,170,201,0.35)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },

  // Round label inside scene
  roundLabel: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 10,
  },
  roundLabelText: {
    color: 'rgba(92,170,201,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Scene inner glow — soft light bleeding from edges
  sceneInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(92,170,201,0.06)',
  },

  // Final scan announcement
  finalScanWrap: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(232,112,126,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.5)',
    marginTop: 8,
  },
  finalScanText: {
    color: C.coral,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Result history dots
  historyRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    marginTop: 10,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  bottomSlot: {
    minHeight: 28,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctText: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(125,211,168,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  missedText: {
    color: C.coral,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  wrongText: {
    color: C.t3,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  introCenter: {
    alignItems: 'center',
    gap: 16,
  },
  introTitle: {
    color: '#A0D4FF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(92,170,201,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  introSub: {
    color: C.t2,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  introGo: {
    fontSize: 50,
    fontWeight: '900',
    color: '#5CAAC9',
    letterSpacing: 6,
    marginTop: 12,
    textShadowColor: 'rgba(92,170,201,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },

  outroCard: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 30,
    borderRadius: 28,
    backgroundColor: 'rgba(10,16,30,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.4)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
    minWidth: 300,
  },
  outroCardPerfect: {
    borderColor: 'rgba(240,181,66,0.7)',
    shadowColor: C.amber,
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  outroLabel: {
    color: '#5CAAC9',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  outroSubLabel: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: -4,
  },
  outroRankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.4)',
    backgroundColor: 'rgba(92,170,201,0.08)',
    marginTop: 2,
  },
  outroRankText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  outroScore: {
    color: C.peach,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 60,
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  outroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  outroStat: {
    alignItems: 'center',
    flex: 1,
  },
  outroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  outroStatValue: {
    color: C.t1,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  outroStatLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});

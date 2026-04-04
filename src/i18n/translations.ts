export type Language = 'en' | 'es' | 'is' | 'fr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  is: 'Íslenska',
  fr: 'Français',
};

export interface TranslationStrings {
  // Common
  back: string;
  skip: string;
  done: string;
  start: string;
  next: string;
  save: string;
  cancel: string;
  settings: string;

  // Home
  goodMorning: string;
  hey: string;
  evening: string;
  stillUp: string;
  todaysSession: string;
  doneForToday: string;
  comeBackTomorrow: string;
  bonusRound: string;
  letsGo: string;
  dayStreak: string;
  level: string;
  sessions: string;
  xpWaiting: string;

  // Games
  games: string;
  gameOfTheDay: string;
  play: string;
  score: string;
  accuracy: string;
  round: string;
  newBest: string;

  // Session
  xpEarned: string;
  thisSession: string;
  brainFact: string;
  nextGame: string;
  seeResults: string;
  excellent: string;
  goodWork: string;
  niceTry: string;

  // Profile
  profile: string;
  brainMap: string;
  myScores: string;
  vsAgeGroup: string;
  quickSettings: string;
  allSettings: string;
  soundEffects: string;
  hapticFeedback: string;
  relaxedMode: string;
  improvementGoals: string;
  moodTracker: string;
  about: string;

  // Mood
  howAreYouFeeling: string;
  moodGreat: string;
  moodGood: string;
  moodOkay: string;
  moodLow: string;
  moodRough: string;

  // Onboarding
  somethingIsGrowing: string;
  tapToWakeItUp: string;
  niceToMeetYou: string;
  whatsNext: string;
  quickAssessment: string;
  yourBrainProfile: string;
  personalizeExperience: string;
  whatShouldICallYou: string;

  // Settings
  account: string;
  notifications: string;
  sessionPreferences: string;
  accessibility: string;
  language: string;

  // Areas
  memory: string;
  focus: string;
  speed: string;
  flexibility: string;
  creativity: string;
}

const en: TranslationStrings = {
  back: 'Back',
  skip: 'Skip',
  done: 'Done',
  start: 'Start',
  next: 'Next',
  save: 'Save',
  cancel: 'Cancel',
  settings: 'Settings',

  goodMorning: 'Good morning',
  hey: 'Hey',
  evening: 'Evening',
  stillUp: 'Still up',
  todaysSession: "Today's Session",
  doneForToday: 'Done for today ✓',
  comeBackTomorrow: 'Come back tomorrow to continue your streak.',
  bonusRound: 'Bonus Round',
  letsGo: "Let's Go",
  dayStreak: 'Day streak',
  level: 'Level',
  sessions: 'Sessions',
  xpWaiting: '+XP waiting',

  games: 'Games',
  gameOfTheDay: 'GAME OF THE DAY',
  play: 'Play',
  score: 'Score',
  accuracy: 'Accuracy',
  round: 'Round',
  newBest: 'NEW BEST',

  xpEarned: 'XP Earned',
  thisSession: 'This Session',
  brainFact: 'Brain Fact',
  nextGame: 'Next Game',
  seeResults: 'See Results',
  excellent: 'Excellent!',
  goodWork: 'Good work!',
  niceTry: 'Nice try!',

  profile: 'Profile',
  brainMap: 'Brain Map',
  myScores: 'My scores',
  vsAgeGroup: 'vs. Age group',
  quickSettings: 'Quick Settings',
  allSettings: 'All Settings',
  soundEffects: 'Sound Effects',
  hapticFeedback: 'Haptic Feedback',
  relaxedMode: 'Relaxed Mode',
  improvementGoals: 'Improvement Goals',
  moodTracker: 'Mood Tracker',
  about: 'About',

  howAreYouFeeling: 'How are you feeling?',
  moodGreat: 'Great',
  moodGood: 'Good',
  moodOkay: 'Okay',
  moodLow: 'Low',
  moodRough: 'Rough',

  somethingIsGrowing: 'Something is growing.',
  tapToWakeItUp: 'Tap to wake it up.',
  niceToMeetYou: 'Nice to meet you, Kova',
  whatsNext: "Here's what's next (~2 min)",
  quickAssessment: 'Quick brain assessment',
  yourBrainProfile: 'Your brain profile',
  personalizeExperience: 'Personalize your experience',
  whatShouldICallYou: 'What should I call you?',

  account: 'Account',
  notifications: 'Notifications',
  sessionPreferences: 'Session Preferences',
  accessibility: 'Accessibility',
  language: 'Language',

  memory: 'Memory',
  focus: 'Focus',
  speed: 'Speed',
  flexibility: 'Flexibility',
  creativity: 'Creativity',
};

const es: TranslationStrings = {
  back: 'Atrás',
  skip: 'Omitir',
  done: 'Listo',
  start: 'Empezar',
  next: 'Siguiente',
  save: 'Guardar',
  cancel: 'Cancelar',
  settings: 'Ajustes',

  goodMorning: 'Buenos días',
  hey: 'Hola',
  evening: 'Buenas noches',
  stillUp: '¿Aún despierto/a',
  todaysSession: 'Sesión de hoy',
  doneForToday: 'Listo por hoy ✓',
  comeBackTomorrow: 'Vuelve mañana para mantener tu racha.',
  bonusRound: 'Ronda extra',
  letsGo: '¡Vamos!',
  dayStreak: 'Racha',
  level: 'Nivel',
  sessions: 'Sesiones',
  xpWaiting: '+XP esperando',

  games: 'Juegos',
  gameOfTheDay: 'JUEGO DEL DÍA',
  play: 'Jugar',
  score: 'Puntos',
  accuracy: 'Precisión',
  round: 'Ronda',
  newBest: 'NUEVO RÉCORD',

  xpEarned: 'XP ganado',
  thisSession: 'Esta sesión',
  brainFact: 'Dato cerebral',
  nextGame: 'Siguiente juego',
  seeResults: 'Ver resultados',
  excellent: '¡Excelente!',
  goodWork: '¡Buen trabajo!',
  niceTry: '¡Buen intento!',

  profile: 'Perfil',
  brainMap: 'Mapa cerebral',
  myScores: 'Mis puntos',
  vsAgeGroup: 'vs. Grupo de edad',
  quickSettings: 'Ajustes rápidos',
  allSettings: 'Todos los ajustes',
  soundEffects: 'Efectos de sonido',
  hapticFeedback: 'Vibración',
  relaxedMode: 'Modo relajado',
  improvementGoals: 'Objetivos de mejora',
  moodTracker: 'Estado de ánimo',
  about: 'Acerca de',

  howAreYouFeeling: '¿Cómo te sientes?',
  moodGreat: 'Genial',
  moodGood: 'Bien',
  moodOkay: 'Regular',
  moodLow: 'Bajo',
  moodRough: 'Mal',

  somethingIsGrowing: 'Algo está creciendo.',
  tapToWakeItUp: 'Toca para despertarlo.',
  niceToMeetYou: 'Encantado de conocerte, Kova',
  whatsNext: 'Lo que sigue (~2 min)',
  quickAssessment: 'Evaluación rápida',
  yourBrainProfile: 'Tu perfil cerebral',
  personalizeExperience: 'Personaliza tu experiencia',
  whatShouldICallYou: '¿Cómo te llamo?',

  account: 'Cuenta',
  notifications: 'Notificaciones',
  sessionPreferences: 'Preferencias de sesión',
  accessibility: 'Accesibilidad',
  language: 'Idioma',

  memory: 'Memoria',
  focus: 'Concentración',
  speed: 'Velocidad',
  flexibility: 'Flexibilidad',
  creativity: 'Creatividad',
};

const is_: TranslationStrings = {
  back: 'Til baka',
  skip: 'Sleppa',
  done: 'Búið',
  start: 'Byrja',
  next: 'Næst',
  save: 'Vista',
  cancel: 'Hætta við',
  settings: 'Stillingar',

  goodMorning: 'Góðan daginn',
  hey: 'Hæ',
  evening: 'Gott kvöld',
  stillUp: 'Enn vakandi',
  todaysSession: 'Æfing dagsins',
  doneForToday: 'Búið í dag ✓',
  comeBackTomorrow: 'Komdu aftur á morgun til að halda áfram.',
  bonusRound: 'Bónusumferð',
  letsGo: 'Áfram!',
  dayStreak: 'Daga í röð',
  level: 'Stig',
  sessions: 'Æfingar',
  xpWaiting: '+XP bíður',

  games: 'Leikir',
  gameOfTheDay: 'LEIKUR DAGSINS',
  play: 'Spila',
  score: 'Stig',
  accuracy: 'Nákvæmni',
  round: 'Umferð',
  newBest: 'NÝTT MET',

  xpEarned: 'XP unnið',
  thisSession: 'Þessi æfing',
  brainFact: 'Heilastaðreynd',
  nextGame: 'Næsti leikur',
  seeResults: 'Sjá niðurstöður',
  excellent: 'Frábært!',
  goodWork: 'Vel gert!',
  niceTry: 'Gott framtak!',

  profile: 'Prófíll',
  brainMap: 'Heilakort',
  myScores: 'Mín stig',
  vsAgeGroup: 'vs. Aldurshópur',
  quickSettings: 'Flýtistillingar',
  allSettings: 'Allar stillingar',
  soundEffects: 'Hljóðbrellur',
  hapticFeedback: 'Titringur',
  relaxedMode: 'Rólegt ham',
  improvementGoals: 'Umbótamarkmið',
  moodTracker: 'Skaprakning',
  about: 'Um',

  howAreYouFeeling: 'Hvernig líður þér?',
  moodGreat: 'Frábært',
  moodGood: 'Gott',
  moodOkay: 'Allt í lagi',
  moodLow: 'Lágt',
  moodRough: 'Erfitt',

  somethingIsGrowing: 'Eitthvað er að vaxa.',
  tapToWakeItUp: 'Snertu til að vekja það.',
  niceToMeetYou: 'Gaman að kynnast þér, Kova',
  whatsNext: 'Hvað er næst (~2 mín)',
  quickAssessment: 'Fljótleg heilaprófun',
  yourBrainProfile: 'Heilaprófíllinn þinn',
  personalizeExperience: 'Sérsníðu upplifunina',
  whatShouldICallYou: 'Hvað á ég að kalla þig?',

  account: 'Reikningur',
  notifications: 'Tilkynningar',
  sessionPreferences: 'Æfingastillingar',
  accessibility: 'Aðgengi',
  language: 'Tungumál',

  memory: 'Minni',
  focus: 'Einbeiting',
  speed: 'Hraði',
  flexibility: 'Sveigjanleiki',
  creativity: 'Sköpunarkraftur',
};

const fr: TranslationStrings = {
  back: 'Retour',
  skip: 'Passer',
  done: 'Terminé',
  start: 'Commencer',
  next: 'Suivant',
  save: 'Enregistrer',
  cancel: 'Annuler',
  settings: 'Paramètres',

  goodMorning: 'Bonjour',
  hey: 'Salut',
  evening: 'Bonsoir',
  stillUp: 'Encore debout',
  todaysSession: "Session d'aujourd'hui",
  doneForToday: 'Fini pour aujourd\'hui ✓',
  comeBackTomorrow: 'Revenez demain pour continuer votre série.',
  bonusRound: 'Tour bonus',
  letsGo: 'C\'est parti !',
  dayStreak: 'Jours de suite',
  level: 'Niveau',
  sessions: 'Sessions',
  xpWaiting: '+XP en attente',

  games: 'Jeux',
  gameOfTheDay: 'JEU DU JOUR',
  play: 'Jouer',
  score: 'Score',
  accuracy: 'Précision',
  round: 'Manche',
  newBest: 'NOUVEAU RECORD',

  xpEarned: 'XP gagné',
  thisSession: 'Cette session',
  brainFact: 'Fait cérébral',
  nextGame: 'Jeu suivant',
  seeResults: 'Voir les résultats',
  excellent: 'Excellent !',
  goodWork: 'Bon travail !',
  niceTry: 'Bien essayé !',

  profile: 'Profil',
  brainMap: 'Carte cérébrale',
  myScores: 'Mes scores',
  vsAgeGroup: "vs. Groupe d'âge",
  quickSettings: 'Paramètres rapides',
  allSettings: 'Tous les paramètres',
  soundEffects: 'Effets sonores',
  hapticFeedback: 'Retour haptique',
  relaxedMode: 'Mode détendu',
  improvementGoals: "Objectifs d'amélioration",
  moodTracker: "Suivi de l'humeur",
  about: 'À propos',

  howAreYouFeeling: 'Comment vous sentez-vous ?',
  moodGreat: 'Super',
  moodGood: 'Bien',
  moodOkay: 'Correct',
  moodLow: 'Bas',
  moodRough: 'Difficile',

  somethingIsGrowing: 'Quelque chose pousse.',
  tapToWakeItUp: 'Touchez pour le réveiller.',
  niceToMeetYou: 'Enchanté, Kova',
  whatsNext: 'La suite (~2 min)',
  quickAssessment: 'Évaluation rapide',
  yourBrainProfile: 'Votre profil cérébral',
  personalizeExperience: 'Personnalisez votre expérience',
  whatShouldICallYou: 'Comment dois-je vous appeler ?',

  account: 'Compte',
  notifications: 'Notifications',
  sessionPreferences: 'Préférences de session',
  accessibility: 'Accessibilité',
  language: 'Langue',

  memory: 'Mémoire',
  focus: 'Concentration',
  speed: 'Vitesse',
  flexibility: 'Flexibilité',
  creativity: 'Créativité',
};

export const translations: Record<Language, TranslationStrings> = {
  en,
  es,
  is: is_,
  fr,
};

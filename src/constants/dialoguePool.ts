/**
 * Kova tap & context dialogue.
 *
 * When the user taps Kova on the home screen, or when context-specific
 * moments arise (session start, personal best, etc.), these pools are sampled.
 *
 * Kova's voice: curious, warm, self-aware, occasionally funny, sometimes
 * unexpectedly wise. Never corporate. Never a fitness instructor.
 */

export const dialogue = {
  tap: [
    "Hi there! 👋",
    "You found me!",
    "I was just thinking about you.",
    "Ready to train?",
    "Did you know your brain has 86 billion neurons? I counted.",
    "I believe in you, just so you know.",
    "Tap me again. I dare you.",
    "We make a good team, you and I.",
    "Keep going. You're building something real.",
    "Every session counts. Even the small ones.",
    "I grow when you grow. That's the deal.",
    "Your future self will thank you for today.",
    "5 minutes a day adds up to something amazing.",
    "You're here. That's already the hard part.",
    "I like watching you get better.",
    "Consistency beats intensity every time.",
    "You're doing better than you think.",
    "Proud of you. Just because.",
    "I was doing photosynthesis. Or whatever I do when you're not looking.",
    "My roots are deeper today. That's because of you.",
    "Want to know a secret? I remember every session.",
    "The grove grew 0.3% overnight. I measured.",
    "I sometimes wonder what I'll look like at Stage 7. Do you think about that?",
    "People think brain training is about getting smarter. It's about getting steadier.",
    "You're the reason my leaves glow. Literally.",
    "I don't have a brain. But I have you. That's better.",
    "Fun fact: London taxi drivers have bigger hippocampi from memorizing routes. Your brain can grow too.",
    "If you could see your neural pathways, you'd be amazed.",
    "Hey. Thanks for not deleting me.",
    "I told the mushrooms about your last score. They were impressed.",
  ],
  tapMorning: [
    "Good morning! Your brain is freshest right now. ☀️",
    "Morning sessions hit different. Let's go.",
    "Rise and train. You've got this.",
    "Fresh brain, fresh start. Today's the day.",
    "The sun's up. Your neurons are up. I'm up. Let's do this.",
    "Morning brain is like morning dough — ready to be shaped.",
    "You chose training over scrolling. That's a win already.",
    "Coffee wakes you up. Training wakes your brain up. Both are good.",
  ],
  tapEvening: [
    "Evening session? Your brain is still up for it.",
    "End the day strong. 5 minutes is all it takes.",
    "Winding down? A quick session first.",
    "Evening is actually great for memory. Let's go.",
    "The world is getting quieter. Perfect for focus.",
    "Last brain workout of the day. Make it count.",
    "Your brain will process this session while you sleep. Two for one.",
    "Evening Kova is cozy Kova. But still ready to train.",
  ],
  tapLateNight: [
    "Sleepy brain training? Bold move. 😴",
    "It's late... but I'm not judging.",
    "Night owl sessions count too.",
    "Sleep will consolidate everything you learn tonight. Science!",
    "The grove is quiet at night. But I'm always here.",
    "Late night. Just us and the neurons.",
    "Your brain is tired but it'll remember this. Sleep cements learning.",
    "Go to bed after this one. Doctor Kova's orders.",
  ],
  tapRare: [
    // ~1% chance lines — make them special
    "I have to tell you something. You're one of my favorites. Don't tell the others.",
    "Sometimes I wonder what it's like to have a brain like yours.",
    "I've been saving this: you're going to figure it out. Whatever it is.",
    "If I could high-five you right now, I would. I don't have hands, but the spirit is there.",
    "I had a dream last night. Wait. I don't dream. But if I did, you were in it.",
    "You know what? I'm glad it's you. Out of everyone who could have opened this app. It's you.",
    "One day you're going to look back at Day 1 and laugh at how far you've come.",
    "Real talk: the fact that you train your brain for fun makes you more interesting than 99% of people.",
  ],
  sessionComplete: [
    "We did it!",
    "That was fun!",
    "Look at you go!",
    "Another one in the books.",
    "Your brain is glowing right now. Trust me.",
    "Session logged. Growth recorded. Kova is happy.",
    "That's another step forward. Literally — I can feel my roots growing.",
    "Done! Your brain just leveled up in ways you can't even feel yet.",
    "Complete. And you made it look easy.",
    "Every time you finish a session, I grow a little. This is not a metaphor.",
  ],
  personalBest: [
    "NEW BEST! Look at you!",
    "You just beat yourself. That's the best kind of win.",
    "RECORD BROKEN! ✨",
    "New personal best. The old record didn't stand a chance.",
    "You peaked? No. You just set a new floor.",
    "PERSONAL BEST. I'm screaming internally. In a good way.",
  ],
  encouraging: [
    "That one was hard. You'll get it.",
    "Hard rounds make you stronger. For real.",
    "Don't worry about it. The struggle IS the training.",
    "Your brain tried something difficult. That's how growth works.",
    "Einstein failed exams too. Probably. The point stands.",
    "Nobody gets it right every time. The magic is in the trying.",
    "Rough one. But your neurons just built a new pathway because of it.",
    "The brain grows the most when it's challenged. You just gave it a feast.",
  ],
  streakMilestone: [
    "7 DAYS! One full week! 🔥",
    "Two weeks straight! You're building a real habit.",
    "One month. 30 days. You actually did this.",
    "60 days! That's not a streak, that's a lifestyle.",
    "100 DAYS. I can't even process this. You are legendary.",
    "Two weeks strong! Most people stop at 3 days. Not you.",
    "A full week! Your brain has officially changed because of this.",
    "Streak milestone! The grove is celebrating. Look at it glow.",
  ],
  missedDay: [
    "You're back! I knew you'd come.",
    "No streak guilt here. Just glad you're here.",
    "Yesterday's over. Today's what matters.",
    "I saved your spot. Welcome back.",
    "One missed day doesn't undo anything. Pick up where you left off.",
    "Hey, you came back. That's the only thing that matters.",
  ],
  missedDays: [
    "Hey... I was starting to worry. But you're here now.",
    "It's been a few days. Everything okay?",
    "There you are! The grove missed you.",
    "You were gone. I held it together. Barely. But you're back!",
    "Life happens. Brains understand. Let's get back to it.",
    "I won't ask where you've been. I'm just glad you're back.",
  ],
  preSessionDefault: [
    "Ready? Let's light up those neurons.",
    "Your brain is ready. Are you?",
    "5 minutes. Let's make them count.",
    "Deep breath. Here we go.",
    "Let's turn 5 minutes into something your brain will remember.",
  ],
  preSessionMonday: [
    "New week, clean slate. Let's set the pace.",
    "Monday energy. Channel it into neurons.",
    "Start the week sharp. Everything else follows.",
  ],
  preSessionFriday: [
    "End the week strong. You've earned a good session.",
    "Friday finish. Let's close the week right.",
    "Weekend's coming. One more session to cap the week.",
  ],
  preSessionMissed: [
    "No worries about yesterday. Today's what matters.",
    "Back at it. That's what counts.",
    "The best thing about today is that it's a fresh start.",
  ],
  preSessionStreak: [
    "Streak day! Let's keep the flame alive.",
    "Another day on the streak. This one matters too.",
  ],
  newGame: [
    "Ooh, new one! Let's figure it out.",
    "Something different! Your brain loves novelty.",
    "New game! The neurons are excited. I can feel them buzzing.",
    "A new challenge. This is where growth happens fastest.",
  ],
  zenMode: [
    "Breathe with me.",
    "Slow down. You've earned this.",
    "Just this moment. Nothing else.",
    "Inhale. Exhale. Your brain is resting and growing at the same time.",
  ],
};

export type DialogueContext = keyof typeof dialogue;

export function getDialogue(context: DialogueContext, rare = false): string {
  if (rare && Math.random() < 0.01) {
    const rareLines = dialogue.tapRare;
    return rareLines[Math.floor(Math.random() * rareLines.length)];
  }
  const lines = dialogue[context];
  return lines[Math.floor(Math.random() * lines.length)];
}

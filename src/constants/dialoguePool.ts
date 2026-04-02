// All Kova dialogue organized by context

export const dialogue = {
  tap: [
    "Hi there! 👋",
    "You found me!",
    "I was just thinking about you.",
    "Ready to train?",
    "Your brain is doing great things.",
    "Did you know your brain has 86 billion neurons? Wild.",
    "I believe in you, just so you know.",
    "Tap me again. I dare you.",
    "We make a good team, you and I.",
    "Keep going. You're building something real.",
    "Every session counts. Even the small ones.",
    "I grow when you grow. That's the deal.",
    "Your future self will thank you for today.",
    "5 minutes a day adds up to something amazing.",
    "You're here. That's already the hard part.",
    "Brains love challenge. Let's give yours some.",
    "I like watching you get better.",
    "Consistency beats intensity every time.",
    "You're doing better than you think.",
    "Proud of you. Just because.",
  ],
  tapMorning: [
    "Good morning! Your brain is freshest right now. ☀️",
    "Morning sessions hit different. Let's go.",
    "Rise and train. You've got this.",
    "Fresh brain, fresh start. Today's the day.",
  ],
  tapEvening: [
    "Evening session? Your brain is still up for it.",
    "End the day strong. 5 minutes is all it takes.",
    "Winding down? A quick session first.",
    "Evening is actually great for memory. Let's go.",
  ],
  tapLateNight: [
    "Sleepy brain training? Brave. 😴",
    "It's late... but I'm not judging.",
    "Night owl sessions count too.",
    "Sleep will consolidate everything you learn tonight. Science!",
  ],
  tapRare: [
    // 1% chance lines
    "Okay, I have to tell you something. You're one of my favorites. Don't tell the others.",
    "Sometimes I wonder what it's like to have a brain like yours. Then I remember I live inside one.",
    "I've been saving this for you: you're going to figure it out. Whatever it is.",
  ],
  sessionComplete: [
    "We did it!",
    "That was fun!",
    "Look at you go!",
    "Another one in the books.",
    "Your brain is glowing right now. Trust me.",
  ],
  personalBest: [
    "NEW BEST! Look at you!",
    "You just beat yourself. That's the best kind of win.",
    "RECORD BROKEN! ✨",
  ],
  encouraging: [
    "That one was hard. You'll get it.",
    "Hard rounds make you stronger. For real.",
    "Don't worry about it. Try again.",
    "Your brain tried something difficult. That's how growth works.",
  ],
  streakMilestone: [
    "7 DAYS! You're unstoppable!",
    "Two weeks strong! 🔥",
    "One month. You actually did it.",
  ],
  missedDay: [
    "You're back! I knew you'd come.",
    "No streak guilt. Just glad you're here.",
    "Yesterday's over. Today's what matters.",
    "I saved your spot.",
  ],
  missedDays: [
    "Hey... I saved your spot.",
    "It's been a few days. Everything okay?",
    "There you are! Let's go!",
  ],
  preSessionDefault: [
    "Ready? Let's light up those neurons.",
    "Your brain is ready. Are you?",
    "5 minutes. Let's make them count.",
  ],
  preSessionMonday: [
    "New week, clean slate. Let's set the pace.",
    "Monday energy. Let's channel it.",
  ],
  preSessionFriday: [
    "End the week strong. You've earned a good session.",
    "Friday finish. Let's go.",
  ],
  preSessionMissed: [
    "No worries about yesterday. Today's what matters.",
    "Back at it. That's what counts.",
  ],
  preSessionStreak: [
    "Day 30! You've been showing up. That's rare.",
    "Streak milestone day! Let's celebrate right.",
  ],
  newGame: [
    "Ooh, new one! Let's figure it out.",
    "Something different! I love it.",
    "New game! Your brain is about to make a new friend.",
  ],
  zenMode: [
    "Breathe with me.",
    "Slow down. You've earned this.",
    "Just this moment. Nothing else.",
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

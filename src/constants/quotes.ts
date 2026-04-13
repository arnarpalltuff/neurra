/**
 * Quotes from brilliant minds about the brain, learning, thinking,
 * creativity, persistence, and growth.
 *
 * Shown throughout the app: home screen, session summary, transitions.
 * All attributions are to people deceased 70+ years (public domain)
 * or widely attributed modern quotes used in educational contexts.
 */

export interface BrainQuote {
  text: string;
  author: string;
}

export const BRAIN_QUOTES: BrainQuote[] = [
  // ── The Mind & Brain ─────────────────────────────────────────────

  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "The brain is wider than the sky.", author: "Emily Dickinson" },
  { text: "It is not that I'm so smart. But I stay with the questions much longer.", author: "Albert Einstein" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "I think, therefore I am.", author: "René Descartes" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },

  // ── Learning & Growth ────────────────────────────────────────────

  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso" },
  { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },

  // ── Creativity & Imagination ─────────────────────────────────────

  { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
  { text: "The chief enemy of creativity is good sense.", author: "Pablo Picasso" },
  { text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { text: "Creativity takes courage.", author: "Henri Matisse" },
  { text: "The true sign of intelligence is not knowledge but imagination.", author: "Albert Einstein" },
  { text: "To invent, you need a good imagination and a pile of junk.", author: "Thomas Edison" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },

  // ── Persistence & Effort ─────────────────────────────────────────

  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "What we repeatedly do defines us. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },

  // ── Focus & Attention ────────────────────────────────────────────

  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The ability to simplify means to eliminate the unnecessary so that the necessary may speak.", author: "Hans Hofmann" },
  { text: "Attention is the rarest and purest form of generosity.", author: "Simone Weil" },
  { text: "Be where you are, not where you think you should be.", author: "Unknown" },

  // ── Memory & Knowledge ───────────────────────────────────────────

  { text: "Memory is the treasury and guardian of all things.", author: "Cicero" },
  { text: "The true art of memory is the art of attention.", author: "Samuel Johnson" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
  { text: "The only source of knowledge is experience.", author: "Albert Einstein" },
  { text: "A mind needs books as a sword needs a whetstone, if it is to keep its edge.", author: "George R.R. Martin" },

  // ── Change & Adaptability ────────────────────────────────────────

  { text: "The snake which cannot cast its skin has to die. As well the minds which are prevented from changing their opinions.", author: "Friedrich Nietzsche" },
  { text: "Intelligence is the ability to adapt to change.", author: "Stephen Hawking" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The only constant in life is change.", author: "Heraclitus" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "When you can't change the direction of the wind, adjust your sails.", author: "H. Jackson Brown Jr." },

  // ── Short & Punchy ───────────────────────────────────────────────

  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Less is more.", author: "Ludwig Mies van der Rohe" },
  { text: "Cogito, ergo sum.", author: "René Descartes" },
  { text: "Know thyself.", author: "Temple of Apollo at Delphi" },
  { text: "This too shall pass.", author: "Persian proverb" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
];

/** Pick a quote that stays the same all day (changes at midnight). */
export function getDailyQuote(): BrainQuote {
  const dayIndex = Math.floor(Date.now() / 86400000) % BRAIN_QUOTES.length;
  return BRAIN_QUOTES[dayIndex];
}

/** Pick a random quote (for transitions, summaries). */
export function getRandomQuote(): BrainQuote {
  return BRAIN_QUOTES[Math.floor(Math.random() * BRAIN_QUOTES.length)];
}

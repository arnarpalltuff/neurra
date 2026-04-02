import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Outfit Definitions ──────────────────────────────────

export interface OutfitDef {
  id: string;
  name: string;
  emoji: string;
  cost: number; // -1 = Pro only
  description: string;
}

export const OUTFIT_DEFS: OutfitDef[] = [
  { id: 'cozy-sweater', name: 'Cozy Sweater', emoji: '🧶', cost: 150, description: 'A soft knitted sweater. Kova looks warm and content.' },
  { id: 'explorer-vest', name: 'Explorer Vest', emoji: '🎒', cost: 200, description: 'Adventure-ready with tiny pockets. Kova looks determined.' },
  { id: 'lab-coat', name: 'Lab Coat', emoji: '🥼', cost: 200, description: 'Mini scientist vibes. Small goggles on forehead.' },
  { id: 'flower-crown', name: 'Flower Crown', emoji: '💐', cost: 150, description: "A crown of tiny flowers matching the garden zone's blooms." },
  { id: 'space-suit', name: 'Space Suit', emoji: '🚀', cost: 300, description: 'Miniature astronaut suit with a bubble helmet. Kova floats slightly.' },
  { id: 'ninja-wrap', name: 'Ninja Wrap', emoji: '🥷', cost: 250, description: "Dark cloth wrap. Only Kova's eyes visible. Stealthy idle animation." },
  { id: 'chef-hat', name: 'Chef Hat & Apron', emoji: '👨‍🍳', cost: 200, description: 'Matches the Ghost Kitchen game. Tiny whisk accessory.' },
  { id: 'wizard-robe', name: 'Wizard Robe', emoji: '🧙', cost: 300, description: 'Starry robe with a pointed hat. Sparkle particles on idle.' },
  { id: 'pajamas', name: 'Pajamas', emoji: '😴', cost: 150, description: 'Sleepy outfit with a tiny pillow. Kova yawns more often.' },
  { id: 'tuxedo', name: 'Tuxedo', emoji: '🤵', cost: 350, description: 'Fancy. Kova stands taller. A tiny bow tie. For special occasions.' },
  { id: 'crystal-armor', name: 'Crystal Armor', emoji: '💠', cost: -1, description: 'Translucent crystalline shell. Kova glows brighter. Faceted light effects.' },
  { id: 'aurora-cloak', name: 'Aurora Cloak', emoji: '🌈', cost: -1, description: 'A cloak that shimmers with moving aurora colors. The most visually stunning outfit.' },
  { id: 'ancient-bark', name: 'Ancient Bark', emoji: '🌿', cost: -1, description: "Kova's skin becomes textured like ancient tree bark with glowing runes." },
];

// ── Accessory Definitions ───────────────────────────────

export interface AccessoryDef {
  id: string;
  name: string;
  emoji: string;
  cost: number; // -1 = Pro only
}

export const ACCESSORY_DEFS: AccessoryDef[] = [
  { id: 'reading-glasses', name: 'Reading Glasses', emoji: '👓', cost: 75 },
  { id: 'tiny-backpack', name: 'Tiny Backpack', emoji: '🎒', cost: 100 },
  { id: 'headband', name: 'Headband', emoji: '🏋️', cost: 75 },
  { id: 'scarf-red', name: 'Red Scarf', emoji: '🧣', cost: 100 },
  { id: 'scarf-blue', name: 'Blue Scarf', emoji: '🧣', cost: 100 },
  { id: 'scarf-green', name: 'Green Scarf', emoji: '🧣', cost: 100 },
  { id: 'scarf-gold', name: 'Gold Scarf', emoji: '🧣', cost: 100 },
  { id: 'scarf-purple', name: 'Purple Scarf', emoji: '🧣', cost: 100 },
  { id: 'halo-ring', name: 'Halo Ring', emoji: '😇', cost: 150 },
  { id: 'floating-book', name: 'Floating Book', emoji: '📖', cost: 150 },
  { id: 'butterfly-companion', name: 'Butterfly Companion', emoji: '🦋', cost: 200 },
  { id: 'mini-umbrella', name: 'Mini Umbrella', emoji: '☂️', cost: 100 },
  { id: 'music-notes', name: 'Music Notes', emoji: '🎵', cost: 150 },
  { id: 'tiny-shield', name: 'Tiny Shield', emoji: '🛡️', cost: 125 },
  { id: 'crown', name: 'Crown', emoji: '👑', cost: -1 },
  { id: 'wings', name: 'Wings', emoji: '🪽', cost: -1 },
  { id: 'third-eye', name: 'Third Eye', emoji: '🔮', cost: -1 },
];

// ── Store ───────────────────────────────────────────────

interface CosmeticsState {
  ownedOutfits: string[];
  ownedAccessories: string[];
  equippedOutfit: string | null;
  equippedAccessory: string | null;

  buyOutfit: (id: string) => void;
  buyAccessory: (id: string) => void;
  equipOutfit: (id: string | null) => void;
  equipAccessory: (id: string | null) => void;
}

export const useCosmeticsStore = create<CosmeticsState>()(
  persist(
    (set) => ({
      ownedOutfits: [],
      ownedAccessories: [],
      equippedOutfit: null,
      equippedAccessory: null,

      buyOutfit: (id) =>
        set((s) => ({
          ownedOutfits: s.ownedOutfits.includes(id)
            ? s.ownedOutfits
            : [...s.ownedOutfits, id],
        })),

      buyAccessory: (id) =>
        set((s) => ({
          ownedAccessories: s.ownedAccessories.includes(id)
            ? s.ownedAccessories
            : [...s.ownedAccessories, id],
        })),

      equipOutfit: (id) => set({ equippedOutfit: id }),
      equipAccessory: (id) => set({ equippedAccessory: id }),
    }),
    {
      name: 'neurra-cosmetics',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

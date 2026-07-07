const ADJECTIVES = [
  "Sneaky", "Turbo", "Wobbly", "Cosmic", "Spicy", "Fluffy", "Grumpy",
  "Dazzling", "Bouncy", "Mysterious", "Caffeinated", "Legendary", "Sleepy",
  "Zesty", "Quantum", "Majestic", "Chaotic", "Sparkly", "Ninja", "Disco",
];

const NOUNS = [
  "Waffle", "Otter", "Pickle", "Rocket", "Noodle", "Penguin", "Cactus",
  "Burrito", "Llama", "Wizard", "Muffin", "Raccoon", "Taco", "Narwhal",
  "Donut", "Yeti", "Panda", "Goblin", "Croissant", "Kraken",
];

export const AVATARS = [
  "🦊", "🐙", "🦄", "🐸", "🦖", "🐼", "🦉", "🐧", "🦜", "🐝",
  "🦔", "🐢", "🦩", "🐳", "🦁", "🐨", "🦥", "🐰", "🦈", "🐲",
  "👽", "🤖", "👻", "🎃", "🧙", "🦸", "🧜", "🧚", "🥷", "🤠",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sillyName(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

export function randomAvatar(): string {
  return pick(AVATARS);
}

const ROOM_ADJECTIVES = [
  "brave", "swift", "merry", "lucky", "witty", "sunny", "zippy", "jolly",
  "perky", "nifty", "quirky", "snazzy",
];

const ROOM_NOUNS = [
  "otter", "comet", "waffle", "pixel", "mango", "rocket", "panda", "noodle",
  "cactus", "yeti", "taco", "llama",
];

/** Human-friendly room code like "brave-otter-42". */
export function roomCode(): string {
  const n = Math.floor(Math.random() * 90) + 10;
  return `${pick(ROOM_ADJECTIVES)}-${pick(ROOM_NOUNS)}-${n}`;
}

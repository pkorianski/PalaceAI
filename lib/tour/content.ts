export type RivalStyle = "aggressive" | "keeper" | "wildcard" | "tactician";
export interface Venue {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  night: string;
  reward: string;
  card: string;
  table: string;
  symbol: string;
}
export const VENUES: Venue[] = [
  {
    id: "quarter",
    name: "The Old Quarter",
    subtitle: "Every legend starts at a local table.",
    accent: "#F5BE69",
    night: "#263D38",
    reward: "Golden Hour",
    card: "#885532",
    table: "#18382B",
    symbol: "☀",
  },
  {
    id: "velvet",
    name: "Velvet After Dark",
    subtitle: "Neon lights. Unfinished business.",
    accent: "#E9A0EF",
    night: "#302247",
    reward: "Velvet Club",
    card: "#69417E",
    table: "#281B37",
    symbol: "♦",
  },
  {
    id: "harbor",
    name: "The Sapphire Room",
    subtitle: "Cool heads own the waterfront.",
    accent: "#7FD9ED",
    night: "#17394A",
    reward: "Deep Sapphire",
    card: "#225C79",
    table: "#102E3C",
    symbol: "♠",
  },
  {
    id: "crown",
    name: "Crown Heights",
    subtitle: "One table. A place among legends.",
    accent: "#F5DB85",
    night: "#3B3428",
    reward: "Royal Standard",
    card: "#675423",
    table: "#293020",
    symbol: "♛",
  },
];
export interface Rival {
  id: string;
  venueId: string;
  name: string;
  title: string;
  style: RivalStyle;
  look: number;
  champion: boolean;
  intro: string;
  victory: string;
  defeat: string;
}
const roster: [string, string, RivalStyle, string][] = [
  [
    "Joey",
    "Two Times",
    "aggressive",
    "Welcome to the neighborhood. Try to keep up.",
  ],
  [
    "Mina",
    "The Matchmaker",
    "keeper",
    "Every card has its moment. Have you found yours?",
  ],
  [
    "Frankie",
    "Lucky Break",
    "wildcard",
    "Good cards? Bad cards? Let’s make a story.",
  ],
  [
    "Rosa",
    "Queen of the Quarter",
    "tactician",
    "This was my table before it was your adventure.",
  ],
  ["Jax", "Neon Jack", "aggressive", "We play fast after midnight."],
  [
    "Cleo",
    "The Collector",
    "keeper",
    "I keep the best things until the very end.",
  ],
  [
    "Ziggy",
    "Wild at Heart",
    "wildcard",
    "A little chaos looks good on this table.",
  ],
  [
    "Vera",
    "The Velvet Ace",
    "tactician",
    "You made an entrance. Now earn your seat.",
  ],
  ["Finn", "The Tide", "aggressive", "Keep moving, or the tide catches you."],
  ["Ada", "The Professor", "keeper", "Patience is a move, too."],
  [
    "Rio",
    "Blue Mirage",
    "wildcard",
    "Nothing here goes quite the way you expect.",
  ],
  [
    "Marin",
    "Harbor Master",
    "tactician",
    "I’ve watched a thousand winning hands sink.",
  ],
  ["Dante", "The Closer", "aggressive", "I don’t leave a game unfinished."],
  [
    "Iris",
    "The Archivist",
    "keeper",
    "I remember every card you leave on the table.",
  ],
  [
    "Sol",
    "Fortune’s Favorite",
    "wildcard",
    "Luck brought us here. Let’s see who stays.",
  ],
  [
    "Reina",
    "The Palace Queen",
    "tactician",
    "The crown is earned. Show me your game.",
  ],
];
export const RIVALS: Rival[] = roster.map(([name, title, style, intro], i) => ({
  id: `${VENUES[Math.floor(i / 4)].id}-${name.toLowerCase()}`,
  venueId: VENUES[Math.floor(i / 4)].id,
  name,
  title,
  style,
  look: i,
  champion: i % 4 === 3,
  intro,
  victory: [
    "You earned that one. See you at the rematch.",
    "A good hand, played well. Respect.",
    "That was a finish. Let’s run it back.",
    "The table is yours. For now.",
  ][i % 4],
  defeat: [
    "I’ll keep your seat warm.",
    "Watch the cards you save. They tell a story.",
    "You’re one good game away. Try me again.",
    "A crown takes more than one attempt.",
  ][i % 4],
}));
export const STYLE_LABELS: Record<RivalStyle, string> = {
  aggressive: "Pressure player",
  keeper: "Saves special cards",
  wildcard: "Unpredictable plays",
  tactician: "Endgame tactician",
};
export const TIERS = [
  { name: "Bronze", color: "#D39B72", target: 1, format: "One game" },
  { name: "Silver", color: "#CEDAE5", target: 2, format: "Best of three" },
  { name: "Gold", color: "#F5D77C", target: 3, format: "Best of five" },
] as const;
export function rivalById(id?: string) {
  return RIVALS.find((r) => r.id === id);
}
export function venueFor(rival: Rival) {
  return VENUES.find((v) => v.id === rival.venueId)!;
}

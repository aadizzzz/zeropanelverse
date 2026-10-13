import type { SeedNode } from "@/lib/seed-nodes-a";
import { nodesA } from "@/lib/seed-nodes-a";
import { nodesB } from "@/lib/seed-nodes-b";
import type { ExperienceLevel, PanelKind, PanelRoom, SpoilerGrade } from "@/db/schema";

export const seedNodes: Record<string, SeedNode[]> = { ...nodesA, ...nodesB };

export type SeedOpenPanel = {
  titleSlug: string;
  username: string;
  kind: PanelKind;
  authorLevel: ExperienceLevel;
  rating: number;
  headline: string;
  body: string;
  room: PanelRoom;
  grade: SpoilerGrade;
};

/** Open Floor entries: no boundaries, spoilers welcome. */
export const seedOpenPanels: SeedOpenPanel[] = [
  {
    titleSlug: "attack-on-titan",
    username: "archivist_k",
    kind: "view",
    authorLevel: "elite",
    rating: 9,
    room: "open",
    grade: "heavy",
    headline: "The Rumbling only works because the show spent four seasons teaching you to flinch",
    body: "Eren's plan reads as a betrayal if you watch Season 4 as a thriller. Rewatch it as a long argument about inherited guilt and the Rumbling becomes the logical end of 'if you cannot be free, nobody is'. The unforgivable part is not the scale. It is that every faction had already said the same sentence in smaller words. Isayama gives the Alliance a win and takes the meaning away from it on purpose.",
  },
  {
    titleSlug: "attack-on-titan",
    username: "midwatch_mira",
    kind: "view",
    authorLevel: "mediocre",
    rating: 8,
    room: "open",
    grade: "mild",
    headline: "Season 3 part 2 is where it stops being a monster show",
    body: "The basement stretch and the retaking of Shiganshina turn the story from survival to politics. If a friend wants to drop it after the Season 2 finale, this is the half that keeps them. Watch for how the show lets the Survey Corps win and then immediately makes the victory complicated.",
  },
  {
    titleSlug: "death-note",
    username: "archivist_k",
    kind: "view",
    authorLevel: "elite",
    rating: 9,
    room: "open",
    grade: "heavy",
    headline: "Light has to lose to Near, and it has to be boring",
    body: "L is the better fight. Near is the correct answer. The anime's second half is criticised for deflating, but a story about a man who thinks he is a god should not end on a better duel; it should end on someone methodical doing the paperwork. The warehouse is intentionally over-staged to show how small Light has become.",
  },
  {
    titleSlug: "berserk",
    username: "archivist_k",
    kind: "view",
    authorLevel: "elite",
    rating: 10,
    room: "open",
    grade: "heavy",
    headline: "The Eclipse is the thesis, and everything after it is the rebuttal",
    body: "Griffith sacrifices the Hawks and Guts survives the one thing the world says he cannot. The rest of the manga is the argument that survival is a choice made again every morning. The Conviction arc is slower for exactly that reason. Miura needs you to feel what a rebuilt life looks like next to the Eclipse.",
  },
  {
    titleSlug: "neon-genesis-evangelion",
    username: "midwatch_mira",
    kind: "view",
    authorLevel: "mediocre",
    rating: 9,
    room: "open",
    grade: "heavy",
    headline: "End of Evangelion is the answer to the TV ending and it is not kind",
    body: "The TV finale lets Shinji accept himself in a white room. End of Evangelion shows what that acceptance costs in the real world: nobody comes to save you, and instrumentality is a trap whose exit is a person. If you found the TV ending too soft, this is the version where the show says the quiet part out loud.",
  },
  {
    titleSlug: "jujutsu-kaisen",
    username: "midwatch_mira",
    kind: "view",
    authorLevel: "mediocre",
    rating: 9,
    room: "open",
    grade: "heavy",
    headline: "Shibuya is where the show stops being a shonen",
    body: "Seasons one and two build a world where the good guys can still lose a round and win the fight. Shibuya removes the safety net. People you assumed were plot armour are gone and the series refuses to explain why this was necessary. Everything after it is a different show, and I think that is the point.",
  },
  {
    titleSlug: "fullmetal-alchemist-brotherhood",
    username: "archivist_k",
    kind: "view",
    authorLevel: "elite",
    rating: 10,
    room: "open",
    grade: "heavy",
    headline: "Equivalent exchange is paid back in the final fight, not at the start",
    body: "Ed's whole arc is about the price of the Gate and the final confrontation makes him spend the one thing he swore never to put on the table. The beauty is that it is not a sacrifice for power. It is a sacrifice for the right to be ordinary again, and the story lets him have it.",
  },
  {
    titleSlug: "solo-leveling",
    username: "midwatch_mira",
    kind: "suggestion",
    authorLevel: "mediocre",
    rating: 8,
    room: "open",
    grade: "mild",
    headline: "If you finished the anime, read the manhwa from the Double Dungeon on",
    body: "The anime is gorgeous but it flattens the dungeon-by-dungeon tension that makes the first 40 chapters work. Read the manhwa for the original pacing, then pick the anime back up for the fights. The ending is the part you will want to be spoiler-free for either way.",
  },
  {
    titleSlug: "spirited-away",
    username: "panelnewbie",
    kind: "review",
    authorLevel: "beginner",
    rating: 10,
    room: "lounge",
    grade: "none",
    headline: "Start here if you have never watched anime",
    body: "Zero homework, nothing violent, and it is over in two hours. I watched it with my sister who says she does not like cartoons and she asked to watch it again. Subbed or dubbed both work.",
  },
];

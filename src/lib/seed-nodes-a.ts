import type { NodeKind, NodePriority } from "@/db/schema";

export type SeedNode = {
  nodeKey: string;
  parentKey: string | null;
  label: string;
  kind: NodeKind;
  year: number;
  releaseOrder: number;
  chronoOrder: number;
  units: number;
  unit: string;
  rating: number;
  powerLevel: number;
  priority: NodePriority;
  canon: boolean;
  creator: string;
  blurb: string;
  mildNote: string;
  heavyNote: string;
  powerNote: string;
};

type Input = {
  k: string;
  p?: string | null;
  label: string;
  kind: NodeKind;
  y: number;
  rel: number;
  story: number;
  u?: number;
  unit?: string;
  r: number;
  pw?: number;
  pr: NodePriority;
  canon?: boolean;
  by: string;
  blurb: string;
  mild?: string;
  heavy?: string;
  pwr?: string;
};

/** Compact builder so the catalogue stays readable. */
export const n = (i: Input): SeedNode => ({
  nodeKey: i.k,
  parentKey: i.p ?? null,
  label: i.label,
  kind: i.kind,
  year: i.y,
  releaseOrder: i.rel,
  chronoOrder: i.story,
  units: i.u ?? 0,
  unit: i.unit ?? "eps",
  rating: i.r,
  powerLevel: i.pw ?? 0,
  priority: i.pr,
  canon: i.canon ?? true,
  creator: i.by,
  blurb: i.blurb,
  mildNote: i.mild ?? "",
  heavyNote: i.heavy ?? "",
  powerNote: i.pwr ?? "",
});

export const nodesA: Record<string, SeedNode[]> = {
  "attack-on-titan": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2009, rel: 1, story: 0, u: 139, unit: "ch",
      r: 9.1, pr: "recommended", by: "Hajime Isayama / Kodansha",
      blurb: "The serial that started it all: rougher, denser and the only place the author's full ending lives in print.",
      mild: "Follows the same beats as the anime, with a few cut scenes and Isayama's raw paneling.",
      heavy: "The closing chapters wrap Eren's plan with more interiority than the anime adaptation manages.",
    }),
    n({
      k: "s1", p: "manga", label: "Season 1", kind: "season", y: 2013, rel: 2, story: 2, u: 25,
      r: 8.9, pw: 20, pr: "essential", by: "Wit Studio",
      blurb: "Eren Yeager watches his home fall and joins the Survey Corps. One of the best hooks in modern anime.",
      mild: "Eren's hidden ability and the fight at Trost show the enemy is not what it seems.",
      heavy: "Annie Leonhart is the Female Titan, so the danger was never only outside the walls.",
      pwr: "Titans are the ceiling here: towering threats that humans fight with gear and numbers.",
    }),
    n({
      k: "no-regrets", p: "s1", label: "No Regrets (OVA)", kind: "ova", y: 2014, rel: 3, story: 1, u: 2,
      r: 8.6, pw: 14, pr: "optional", by: "Wit Studio",
      blurb: "A two-part prequel about Levi before he joined the Survey Corps.",
      mild: "Levi's life in the underground city and the small crew that shaped him.",
      heavy: "Isabel and Farlan die, and Levi's guilt explains why he can't stand losing squadmates.",
      pwr: "Human scale: Levi's skill on its own, before the world escalates.",
    }),
    n({
      k: "s2", p: "s1", label: "Season 2", kind: "season", y: 2017, rel: 4, story: 3, u: 12,
      r: 8.5, pw: 32, pr: "essential", by: "Wit Studio",
      blurb: "The 104th Training Corps faces a fresh Titan assault from an unexpected direction.",
      mild: "The walls are breached from the other side, and Ymir's backstory starts to surface.",
      heavy: "Reiner and Bertholdt are the Armored and Colossal Titans, and Ymir's choice exposes where Titan power comes from.",
      pwr: "Named Titan shifters with distinct powers move the show from monsters to people.",
    }),
    n({
      k: "s3", p: "s2", label: "Season 3", kind: "season", y: 2018, rel: 5, story: 4, u: 22,
      r: 8.7, pw: 48, pr: "essential", by: "Wit Studio",
      blurb: "Politics take over as the Survey Corps defends a secret that could change the world.",
      mild: "A coup and the push to retake Wall Maria drive both halves of the season.",
      heavy: "The royal family's secret and the basement reveal rewrite the world's history, and Shiganshina is retaken.",
      pwr: "Scale shifts from squad skirmishes to nation-level conflict.",
    }),
    n({
      k: "s4", p: "s3", label: "The Final Season", kind: "season", y: 2020, rel: 6, story: 5, u: 30,
      r: 8.8, pw: 96, pr: "essential", by: "MAPPA",
      blurb: "The war crosses the sea and the story changes perspective.",
      mild: "Marley's side of the war reframes everything you thought you knew.",
      heavy: "The Rumbling, Eren's plan to flatten the world, pits former allies against him and ends in tragedy.",
      pwr: "Peak scale: continental annihilation against a human alliance. Nothing earlier comes close.",
    }),
    n({
      k: "junior-high", p: "manga", label: "Junior High (comedy spin-off)", kind: "spinoff", y: 2015, rel: 7, story: 6, u: 12,
      r: 6.8, pr: "skip", canon: false, by: "Production I.G",
      blurb: "A gag spin-off where the cast attends school. Fun for fans, skippable for everyone else.",
      mild: "Non-canon jokes poke fun at the main story's famous moments.",
    }),
  ],

  "death-note": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2003, rel: 1, story: 0, u: 108, unit: "ch",
      r: 9.0, pr: "recommended", by: "Tsugumi Ohba / Takeshi Obata",
      blurb: "Sharper art and more procedural detail in the cat-and-mouse.",
      mild: "Slightly different pacing and extra moments of Light's planning.",
      heavy: "The finale is colder and more clinical than the anime's operatic ending.",
    }),
    n({
      k: "anime-l", p: "manga", label: "Kira vs L (episodes 1-25)", kind: "arc", y: 2006, rel: 2, story: 1, u: 25,
      r: 9.1, pw: 55, pr: "essential", by: "Madhouse",
      blurb: "A student finds a notebook that kills; a reclusive detective sets out to catch him.",
      mild: "L reveals himself and the two geniuses begin a face-to-face intellectual duel.",
      heavy: "L's death closes this half and is the show's famous turning point.",
      pwr: "Escalation is tactical: every trap outplays the last.",
    }),
    n({
      k: "anime-near", p: "anime-l", label: "Kira vs Near & Mello (26-37)", kind: "arc", y: 2007, rel: 3, story: 2, u: 12,
      r: 8.4, pw: 70, pr: "essential", by: "Madhouse",
      blurb: "A new generation of investigators takes over the hunt.",
      mild: "Near and Mello approach Kira from different angles while Kira's organisation grows.",
      heavy: "Light is cornered by Near at the warehouse and his plan collapses.",
      pwr: "The stakes widen to worldwide influence, but the cleverness is more brute-force than before.",
    }),
    n({
      k: "relight", p: "anime-near", label: "Relight (recap specials)", kind: "special", y: 2007, rel: 4, story: 3, u: 2,
      r: 7.3, pr: "optional", canon: false, by: "Madhouse",
      blurb: "Two recap specials with a few new scenes and commentary.",
      mild: "Narrated by Ryuk, replaying key beats of each half.",
    }),
    n({
      k: "films", p: "manga", label: "Live-action films", kind: "remake", y: 2006, rel: 5, story: 4, u: 2, unit: "films",
      r: 7.0, pr: "skip", canon: false, by: "Shusuke Kaneko",
      blurb: "Japanese live-action adaptations that diverge from the source.",
      mild: "L and Light's rivalry is compressed into film runtimes.",
      heavy: "The second film changes how the story ends.",
    }),
  ],

  "jujutsu-kaisen": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2018, rel: 1, story: 0, u: 271, unit: "ch",
      r: 8.8, pr: "recommended", by: "Gege Akutami / Shueisha",
      blurb: "The manga goes well past the anime and is where the full story lives.",
      mild: "The Culling Game and the Shinjuku showdown follow the Shibuya Incident.",
      heavy: "Sukuna's endgame forces Yuji into a choice that decides what the title means.",
    }),
    n({
      k: "s1", p: "manga", label: "Season 1", kind: "season", y: 2020, rel: 2, story: 2, u: 24,
      r: 8.6, pw: 30, pr: "essential", by: "MAPPA",
      blurb: "Yuji Itadori swallows a cursed finger and joins Tokyo Jujutsu High.",
      mild: "Sukuna's presence and the Kyoto exchange event escalate the stakes.",
      heavy: "Mahito corrupts Junpei Yoshino and Yuji's view of the job is broken.",
      pwr: "Special Grade curses are the ceiling; students fight at a visible scale.",
    }),
    n({
      k: "jjk0", p: "manga", label: "Jujutsu Kaisen 0 (film)", kind: "movie", y: 2021, rel: 3, story: 1, u: 105, unit: "min",
      r: 8.4, pw: 45, pr: "recommended", by: "MAPPA",
      blurb: "A prequel film about Yuta Okkotsu and the first-year class before Yuji.",
      mild: "Yuta is haunted by a cursed spirit bound to him since childhood.",
      heavy: "Geto's Night Parade of a Hundred Demons and Rika's tragic origin form the film's core.",
      pwr: "Yuta's raw output already rivals the strongest sorcerers.",
    }),
    n({
      k: "s2", p: "s1", label: "Season 2", kind: "season", y: 2023, rel: 4, story: 3, u: 23,
      r: 8.7, pw: 72, pr: "essential", by: "MAPPA",
      blurb: "Opens with a prequel arc before a massive city-wide crisis.",
      mild: "Gojo and Geto's past (Hidden Inventory) leads into the Shibuya Incident.",
      heavy: "Gojo is sealed and Sukuna's rampage kills thousands, resetting the series' power ceiling.",
      pwr: "Domain expansions and Sukuna's full power redefine what earlier seasons called strong.",
    }),
  ],

  "fullmetal-alchemist-brotherhood": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2001, rel: 1, story: 0, u: 116, unit: "ch",
      r: 9.0, pr: "optional", by: "Hiromu Arakawa / Square Enix",
      blurb: "Tighter than any adaptation, and the source Brotherhood follows closely.",
      mild: "Brotherhood adapts it near 1:1; read it for Arakawa's farm-life humour and omake.",
    }),
    n({
      k: "fma2003", p: "manga", label: "Fullmetal Alchemist (2003)", kind: "season", y: 2003, rel: 2, story: 1, u: 51,
      r: 8.1, pw: 55, pr: "optional", canon: false, by: "Bones",
      blurb: "The first anime, which departs from the manga with an original second half.",
      mild: "An original storyline replaces the manga's later plot.",
      heavy: "Ed ends up in our world, and the homunculi's origins differ entirely.",
    }),
    n({
      k: "brotherhood", p: "manga", label: "Brotherhood (2009)", kind: "season", y: 2009, rel: 3, story: 2, u: 64,
      r: 9.1, pw: 85, pr: "essential", by: "Bones",
      blurb: "The complete adaptation of the manga: the definitive Fullmetal Alchemist.",
      mild: "The Philosopher's Stone's true nature and the Ishval war haunt the military.",
      heavy: "Father, the homunculi and the nationwide transmutation circle culminate in Amestris' fall, and Hohenheim's 500-year secret comes out.",
      pwr: "Escalates from personal alchemy to country-scale transmutation. The finale is the ceiling.",
    }),
    n({
      k: "milos", p: "brotherhood", label: "The Sacred Star of Milos (film)", kind: "movie", y: 2011, rel: 4, story: 3, u: 110, unit: "min",
      r: 7.4, pw: 40, pr: "optional", canon: false, by: "Bones",
      blurb: "An original film story set in the Brotherhood world.",
      mild: "A war-torn region and a stone-related secret drive the plot.",
    }),
  ],

  "frieren-beyond-journeys-end": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2020, rel: 1, story: 0, u: 139, unit: "ch",
      r: 9.1, pr: "recommended", by: "Kanehito Yamada / Tsukasa Abe",
      blurb: "The manga goes beyond the anime with quiet, devastating character beats.",
      mild: "Later chapters reveal how far back Frieren's own history reaches.",
      heavy: "The journey toward Ende ties up the old party's last wish and the meaning of Frieren's regrets.",
    }),
    n({
      k: "s1p1", p: "manga", label: "Season 1, Part 1: The Hero's Funeral", kind: "arc", y: 2023, rel: 2, story: 1, u: 14,
      r: 9.2, pw: 25, pr: "essential", by: "Madhouse",
      blurb: "An elf mage sets out on a new journey after her hero friend dies.",
      mild: "She takes on an apprentice, Fern, and later a warrior, Stark.",
      heavy: "The Aura the Guillotine arc shows demons' soul-weighing magic and the show's grim view of them.",
      pwr: "Intimate scale: the biggest threat is a single demon general.",
    }),
    n({
      k: "s1p2", p: "s1p1", label: "Season 1, Part 2: First-Class Mage Exam", kind: "arc", y: 2024, rel: 3, story: 2, u: 14,
      r: 9.3, pw: 45, pr: "essential", by: "Madhouse",
      blurb: "A tournament-style exam tests the group against stronger mages.",
      mild: "Candidates and a tough dungeon test reveal how Frieren's reputation precedes her.",
      heavy: "The old Great Mage Serie appears and Frieren's lineage becomes central.",
      pwr: "Power grows by breadth: more mages, more techniques, more variety.",
    }),
  ],

  "vinland-saga": [
    n({
      k: "manga", label: "Original manga", kind: "source", y: 2005, rel: 1, story: 0, u: 216, unit: "ch",
      r: 9.1, pr: "recommended", by: "Makoto Yukimura / Kodansha",
      blurb: "The manga's second half is still unadapted: farm life and the voyage west.",
      mild: "The dream of Vinland is attempted for real.",
      heavy: "The Vinland expedition tests Thorfinn's vow of nonviolence against hard reality.",
    }),
    n({
      k: "s1", p: "manga", label: "Season 1", kind: "season", y: 2019, rel: 2, story: 1, u: 24,
      r: 8.7, pw: 55, pr: "essential", by: "Wit Studio",
      blurb: "A boy joins the mercenaries who killed his father so he can take revenge.",
      mild: "Askeladd's band raids Britain and Thorfinn grows up through war.",
      heavy: "Askeladd's end and the theft of Thorfinn's revenge close the season.",
      pwr: "Combat is brutal and personal; heroism is treated as cheap.",
    }),
    n({
      k: "s2", p: "s1", label: "Season 2", kind: "season", y: 2023, rel: 3, story: 2, u: 24,
      r: 8.8, pw: 25, pr: "essential", by: "MAPPA",
      blurb: "Thorfinn rebuilds himself on a farm: a slower, more philosophical turn.",
      mild: "The Farmland Saga is the series' thesis on violence and slavery.",
      heavy: "Thorfinn's vow is tested when raiders threaten the farm and the people on it.",
      pwr: "Power falls on purpose: restraint gets as much screen time as swordplay once did.",
    }),
  ],

  "chainsaw-man": [
    n({
      k: "part1", label: "Part 1: Public Safety Arc (manga)", kind: "source", y: 2018, rel: 1, story: 1, u: 97, unit: "ch",
      r: 8.9, pw: 55, pr: "recommended", by: "Tatsuki Fujimoto",
      blurb: "Denji, a debt-ridden teenager, becomes a devil hunter with a chainsaw for a body.",
      mild: "Denji meets Makima and Power, and Public Safety hunts devils together.",
      heavy: "Makima's true nature and the Gun Devil hunt shape Part 1's ending.",
      pwr: "Devils scale with the fear they embody; the Gun Devil is Part 1's ceiling.",
    }),
    n({
      k: "part2", p: "part1", label: "Part 2: Academy Saga (manga)", kind: "arc", y: 2022, rel: 2, story: 4, u: 103, unit: "ch",
      r: 8.2, pw: 70, pr: "recommended", by: "Tatsuki Fujimoto",
      blurb: "A school-based storyline following Asa Mitaka and a fresh cast.",
      mild: "Asa partners with the War Devil and a new cast comes in.",
      heavy: "Chainsaw Man's reappearance reframes what Part 1 meant.",
      pwr: "Weirder and larger: devils start to influence the whole world.",
    }),
    n({
      k: "anime", p: "part1", label: "Anime Season 1", kind: "season", y: 2022, rel: 3, story: 2, u: 12,
      r: 8.4, pw: 38, pr: "essential", by: "MAPPA",
      blurb: "A cinematic adaptation of the first arcs, styled like a film.",
      mild: "Covers the Bat Devil, Eternity Devil and Katana Man arcs.",
      heavy: "The season closes on the fallout of the Katana Man arc and hints at Makima's real goals.",
      pwr: "Devils are creepy and surprising rather than overwhelming.",
    }),
    n({
      k: "reze", p: "anime", label: "Reze Arc (film)", kind: "movie", y: 2025, rel: 4, story: 3, u: 100, unit: "min",
      r: 8.6, pw: 50, pr: "recommended", by: "MAPPA",
      blurb: "A romance-tinged story where a mysterious new girl enters Denji's life.",
      mild: "Reze and Denji's night in the city comes with a growing threat.",
      heavy: "Reze is a Bomb Devil hybrid, and the film ends on a tragic choice.",
      pwr: "Bomb Devil fights push Denji to a more explosive scale than the TV season.",
    }),
  ],

  berserk: [
    n({
      k: "black", label: "Black Swordsman Arc", kind: "source", y: 1989, rel: 1, story: 2,
      r: 9.0, pw: 40, pr: "optional", by: "Kentaro Miura",
      blurb: "The cold open: a branded swordsman hunts demons across a ruined world.",
      mild: "Guts carries the Dragonslayer and a mark that draws apostles to him.",
      heavy: "The brand is the mark of sacrifice, and Guts' rage is the engine of everything.",
      pwr: "Raw human strength against supernatural horror: one fighter at his limit.",
    }),
    n({
      k: "golden", p: "black", label: "Golden Age Arc", kind: "arc", y: 1990, rel: 2, story: 1,
      r: 9.6, pw: 35, pr: "recommended", by: "Kentaro Miura",
      blurb: "Guts joins the Band of the Hawk and finds a dream, a friend and a rival.",
      mild: "Griffith's ambition and Guts' growth turn friendship into something heavier.",
      heavy: "The Eclipse: Griffith sacrifices the Hawks to become a God Hand, and Guts and Casca are branded.",
      pwr: "Human-scale war: armies, duels, politics.",
    }),
    n({
      k: "anime97", p: "golden", label: "Berserk (1997 anime)", kind: "season", y: 1997, rel: 3, story: 1, u: 25,
      r: 8.4, pw: 33, pr: "essential", by: "OLM",
      blurb: "A 25-episode adaptation of the Golden Age; the cleanest entry point.",
      mild: "Adapts the rise and fall of the Band of the Hawk.",
      heavy: "Ends right after the Eclipse, leaving Guts and Casca's fates unresolved.",
      pwr: "Closed-in and human-scale; the supernatural only arrives at the very end.",
    }),
    n({
      k: "conviction", p: "golden", label: "Conviction Arc and beyond", kind: "arc", y: 1998, rel: 4, story: 3,
      r: 9.4, pw: 60, pr: "recommended", by: "Kentaro Miura",
      blurb: "Guts' journey after the Eclipse turns toward rebuilding a life.",
      mild: "He travels with a new group while being hunted by apostles.",
      heavy: "Casca's fate and the search for a cure give the story a new engine.",
      pwr: "Power turns magical: dragons, the Skull Knight and the Wiccan Mist.",
    }),
    n({
      k: "films", p: "golden", label: "Golden Age Arc (film trilogy)", kind: "movie", y: 2012, rel: 5, story: 1, u: 3, unit: "films",
      r: 7.6, pw: 36, pr: "optional", by: "Studio 4°C",
      blurb: "A CG-heavy trilogy that condenses the Golden Age into three films.",
      mild: "Faster pacing that hits the same beats.",
      heavy: "Keeps the Eclipse intact, though compressed.",
    }),
    n({
      k: "tv2016", p: "golden", label: "Berserk (2016-2017 series)", kind: "season", y: 2016, rel: 6, story: 3, u: 24,
      r: 5.6, pr: "skip", by: "Millepensee / Liden Films",
      blurb: "A CG-animated continuation with a controversial look.",
      mild: "Picks up after the Golden Age and enters the Conviction arc.",
      heavy: "Ends before reaching the manga's later reveals.",
    }),
    n({
      k: "post", p: "conviction", label: "Post-Miura chapters", kind: "arc", y: 2022, rel: 7, story: 4,
      r: 8.0, pw: 85, pr: "optional", by: "Studio Gaga / Kouji Mori",
      blurb: "Chapters continued by Miura's friend Kouji Mori after the author's death.",
      mild: "Follows Miura's outline for the final arcs.",
      heavy: "The late arcs hint at the story's cosmology; fans debate how it is handled.",
      pwr: "The ceiling of the franchise: cosmic forces and the shape of the world.",
    }),
  ],
};

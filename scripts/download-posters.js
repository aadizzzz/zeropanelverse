const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const postersDir = path.join(process.cwd(), "public", "posters");
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

const posters = {
  // Existing titles
  "attack-on-titan": "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
  "death-note": "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
  "jujutsu-kaisen": "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
  "jujutsu-kaisen-culling-game": "https://cdn.myanimelist.net/images/anime/1792/138022.jpg",
  "fullmetal-alchemist-brotherhood": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
  "frieren-beyond-journeys-end": "https://upload.wikimedia.org/wikipedia/en/6/60/Frieren_Beyond_Journey%27s_End.jpg",
  "vinland-saga": "https://cdn.myanimelist.net/images/anime/1500/103005.jpg",
  "chainsaw-man": "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",
  "berserk": "https://cdn.myanimelist.net/images/manga/1/157897.jpg",
  "vagabond": "https://cdn.myanimelist.net/images/manga/1/259070.jpg",
  "monster": "https://upload.wikimedia.org/wikipedia/en/0/00/Monster_manga_volume_1_cover.jpg",
  "solo-leveling": "https://upload.wikimedia.org/wikipedia/en/6/6c/Solo_Leveling_Volume_1_Cover.jpg",
  "omniscient-readers-viewpoint": "https://upload.wikimedia.org/wikipedia/en/6/69/Omniscient_Reader%27s_Viewpoint_Volume_1_Cover.jpg",
  "tower-of-god": "https://upload.wikimedia.org/wikipedia/en/7/7d/Tower_of_God_Volume_1_Cover.jpg",
  "the-beginning-after-the-end": "https://upload.wikimedia.org/wikipedia/en/c/cc/The_Beginning_After_the_End_webtoon_volume_1_cover.jpg",
  "spirited-away": "https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png",
  "neon-genesis-evangelion": "https://cdn.myanimelist.net/images/anime/1314/108941.jpg",

  // New titles
  "demon-slayer": "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
  "one-piece": "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
  "bleach-thousand-year-blood-war": "https://cdn.myanimelist.net/images/anime/1764/126627.jpg",
  "hunter-x-hunter": "https://cdn.myanimelist.net/images/anime/1337/99013.jpg",
  "steins-gate": "https://cdn.myanimelist.net/images/anime/1935/127974.jpg",
  "naruto-shippuden": "https://cdn.myanimelist.net/images/anime/1565/111305.jpg",
  "cowboy-bebop": "https://cdn.myanimelist.net/images/anime/4/19644.jpg"
};

for (const [slug, url] of Object.entries(posters)) {
  const ext = url.endsWith(".png") ? "png" : "jpg";
  const dest = path.join(postersDir, `${slug}.jpg`); // All saved or aliased as .jpg for clean uniform loading
  try {
    execSync(`curl.exe -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -L -s -o "${dest}" "${url}"`);
    const size = fs.statSync(dest).size;
    console.log(`[OK] ${slug}: ${size} bytes`);
  } catch (err) {
    console.error(`[FAIL] ${slug}:`, err.message);
  }
}

console.log("Done downloading all posters!");

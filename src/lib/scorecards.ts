import type { Game, ScoreSession } from "./types";

export type ScoreKind =
  | "points"
  | "race"
  | "team"
  | "coop"
  | "last"
  | "rounds"
  | "place"
  | "result";

export type ScoreField = {
  id: string;
  label: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type ScoreCardDef = {
  kind: ScoreKind;
  summary: string;
  fields: ScoreField[];
  sharedFields?: ScoreField[];
  target?: number;
  teamNames?: string[];
  lowerIsBetter?: boolean;
};

const total: ScoreField = { id: "total", label: "Score" };
const vp: ScoreField = { id: "vp", label: "Victory points" };
const rounds: ScoreField = { id: "rounds", label: "Rounds won" };

function points(summary: string, fields: ScoreField[] = [total]): ScoreCardDef {
  return { kind: "points", summary, fields };
}
function race(summary: string, target: number, fields: ScoreField[] = [vp]): ScoreCardDef {
  return { kind: "race", summary, fields, target };
}
function team(summary: string, teamNames: string[]): ScoreCardDef {
  return { kind: "team", summary, fields: [], teamNames };
}
function coop(summary: string, sharedFields: ScoreField[] = []): ScoreCardDef {
  return { kind: "coop", summary, fields: [], sharedFields };
}
function last(summary: string): ScoreCardDef {
  return { kind: "last", summary, fields: [] };
}
function place(summary: string): ScoreCardDef {
  return { kind: "place", summary, fields: [{ id: "place", label: "Finish", min: 1, max: 12, step: 1 }] };
}
function roundWins(summary: string, target?: number): ScoreCardDef {
  return { kind: "rounds", summary, fields: [rounds], target };
}
function result(summary: string): ScoreCardDef {
  return { kind: "result", summary, fields: [] };
}

/** Official-style scorecards. Research: publisher rules / BGG scoring for each title. */
export const SCORE_CARDS: Record<string, ScoreCardDef> = {
  "178900": team("Two teams. First to uncover every agent on their side wins — unless someone hits the assassin.", [
    "Red",
    "Blue",
  ]),
  "198773": team("Codenames: Pictures — same race: all of your team's cards, avoid the assassin.", ["Red", "Blue"]),
  "266192": points("Highest total after a final count of birds, bonuses, eggs, food, and tucked cards.", [
    { id: "birds", label: "Birds" },
    { id: "bonus", label: "Bonus cards" },
    { id: "goals", label: "End-of-round goals" },
    { id: "eggs", label: "Eggs" },
    { id: "food", label: "Cached food" },
    { id: "tucked", label: "Tucked cards" },
  ]),
  "13": race("First to 10 victory points. Settlements 1, cities 2, longest road 2, largest army 2, VP cards 1.", 10, [
    { id: "settlements", label: "Settlements", hint: "1 each" },
    { id: "cities", label: "Cities", hint: "2 each" },
    { id: "road", label: "Longest road", hint: "0 or 2", min: 0, max: 2 },
    { id: "army", label: "Largest army", hint: "0 or 2", min: 0, max: 2 },
    { id: "vpcards", label: "VP cards" },
  ]),
  "9209": points("Route points + completed tickets − failed tickets + longest continuous (10 in the US map).", [
    { id: "routes", label: "Claimed routes" },
    { id: "tickets", label: "Tickets completed" },
    { id: "failed", label: "Tickets failed (enter as positive)", min: 0 },
    { id: "longest", label: "Longest route bonus", hint: "Usually 10", min: 0, max: 15 },
  ]),
  "230802": points("Tiles on the wall, plus row/column/color bonuses, minus the floor line.", [
    { id: "tiles", label: "Wall tiles" },
    { id: "rows", label: "Complete rows", hint: "2 each" },
    { id: "cols", label: "Complete columns", hint: "7 each" },
    { id: "colors", label: "Complete colors", hint: "10 each" },
    { id: "floor", label: "Floor penalties (positive number)" },
  ]),
  "287954": points("Summer Pavilion: stars, leftover tiles, and bonuses. Highest wins.", [
    { id: "stars", label: "Stars" },
    { id: "bonus", label: "Bonuses" },
    { id: "left", label: "Leftover tiles" },
  ]),
  "30549": coop("Cure all four diseases before outbreaks, cubes, or the deck run out.", [
    { id: "outbreaks", label: "Outbreaks", min: 0, max: 8 },
    { id: "cured", label: "Diseases cured", min: 0, max: 4 },
  ]),
  "3955": coop("Hot Zone: cooperative win if the diseases are contained.", [
    { id: "outbreaks", label: "Outbreaks" },
    { id: "cured", label: "Cured", min: 0, max: 3 },
  ]),
  "822": points("Cities, roads, monasteries, and fields. Highest score after the last tile.", [
    { id: "cities", label: "Cities" },
    { id: "roads", label: "Roads" },
    { id: "cloisters", label: "Monasteries" },
    { id: "fields", label: "Farmers / fields" },
  ]),
  "68448": points("Add military, coin, wonder, civic, science, commercial, and guild points.", [
    { id: "military", label: "Military" },
    { id: "coins", label: "Coins" },
    { id: "wonder", label: "Wonder" },
    { id: "civic", label: "Civilian" },
    { id: "science", label: "Science" },
    { id: "commerce", label: "Commercial" },
    { id: "guilds", label: "Guilds" },
  ]),
  "173346": result("7 Wonders Duel: military win, science win, or highest civilian score."),
  "36218": points("Victory points on cards in your deck (Provinces, Duchies, Estates, Curses, extras).", [
    { id: "vp", label: "Victory points" },
  ]),
  "167791": points("Terraforming rating + awards, milestones, map tiles, and cards.", [
    { id: "tr", label: "TR" },
    { id: "awards", label: "Awards" },
    { id: "milestones", label: "Milestones" },
    { id: "board", label: "Cities / greenery" },
    { id: "cards", label: "Cards" },
  ]),
  "169786": points("Popularity-modified coins, stars, and territory — enter the final printed score.", [total]),
  "174430": points("Campaign scenarios: checkmarks and XP, or a one-shot gold/XP total.", [
    { id: "gold", label: "Gold" },
    { id: "xp", label: "XP" },
    { id: "checks", label: "Checkmarks" },
  ]),
  "162886": coop("Spirit Island: win if the island is saved. Track blight and fear.", [
    { id: "blight", label: "Blight remaining" },
    { id: "fear", label: "Fear level", min: 0, max: 3 },
  ]),
  "224517": points("Brass: Birmingham — income/VP from network, industry, and beer. Highest wins.", [vp]),
  "233078": points("Twilight Imperium: first to 10 VP on the public track.", [vp]),
  "31260": points("Agricola: family, fields, pastures, animals, and improvements minus begging.", [total]),
  "148228": race("First to 15 prestige points from nobles and development cards.", 15, [
    { id: "cards", label: "Development cards" },
    { id: "nobles", label: "Nobles" },
  ]),
  "70323": race("First to 20 VP, or last monster standing in Tokyo.", 20, [
    { id: "vp", label: "Victory points", max: 20 },
    { id: "hearts", label: "Hearts left", min: 0, max: 10 },
  ]),
  "133473": points("Sushi Go! — three rounds of maki, sets, pudding. Highest total.", [
    { id: "r1", label: "Round 1" },
    { id: "r2", label: "Round 2" },
    { id: "r3", label: "Round 3" },
    { id: "pudding", label: "Pudding bonus" },
  ]),
  "277085": roundWins("Love Letter: most favor tokens. Target depends on player count (often 3–7).", 4),
  "41114": team("Resistance: team win after three successful or failed missions.", ["Resistance", "Spies"]),
  "188834": team("Secret Hitler: Liberals win by enacting 5 liberal policies or killing Hitler. Fascists win by 6 fascist policies or electing Hitler after 3.", [
    "Liberals",
    "Fascists",
  ]),
  "172225": last("Exploding Kittens: last player who hasn't exploded."),
  "254640": coop("Just One: guess 13 mystery words. Score is how many you got.", [
    { id: "guessed", label: "Words guessed", min: 0, max: 13 },
  ]),
  "262543": team("Wavelength: teams score 2/3/4 for landing near the target. Play to an agreed total.", ["Team A", "Team B"]),
  "244992": coop("The Mind: climb levels together. Enter the highest level you cleared.", [
    { id: "level", label: "Level reached" },
    { id: "lives", label: "Lives left" },
  ]),
  "244049": coop("The Mind Extreme: same climb, two piles.", [
    { id: "level", label: "Level reached" },
  ]),
  "92415": roundWins("Skull: first player to win two successful challenges (often).", 2),
  "39856": race("Dixit: first to 30 points from clue-giving and guessing.", 30, [vp]),
  "163412": points("Patchwork: buttons minus 2 per empty square on your quilt.", [
    { id: "buttons", label: "Buttons" },
    { id: "empty", label: "Empty squares (penalty)" },
  ]),
  "295770": points("Cascadia: wildlife cards + habitat corridors + leftover tokens.", [
    { id: "wildlife", label: "Wildlife" },
    { id: "habitat", label: "Habitats" },
    { id: "tokens", label: "Pinecones / tokens" },
  ]),
  "199792": points("Everdell: point tokens, cards in your city, and events.", [total]),
  "237182": race("Root: first faction to 30 VP (or a dominance win — pick that player).", 30, [vp]),
  "342942": points("Ark Nova: conservation and appeal tracks. Enter the published final score.", [total]),
  "316554": race("Dune: Imperium — first to 10 VP on the influence/combat track.", 10, [vp]),
  "312484": points("Arnak: idols, research, cards, guardians, and the temple.", [total]),
  "244521": points("The Quacks of Quedlinburg: highest droplet value after nine rounds.", [
    { id: "pot", label: "Final pot" },
    { id: "rats", label: "Rat tails (penalty)" },
  ]),
  "284083": coop("The Crew: win the mission. Track how far you got.", [
    { id: "mission", label: "Mission reached" },
  ]),
  "385761": coop("Sky Team: land the plane. Success or abort.", [
    { id: "altitude", label: "Altitude left" },
  ]),
  "366013": place("Heat: Pedal to the Metal — finishing order after the last lap."),
  "2655": result("Hive: you win when the opponent's queen is surrounded."),
  "171": result("Chess: checkmate, resignation, or draw."),
  "194655": result("Santorini: win by standing on a level-3 building, or by blocking the opponent."),
  "160477": result("Onitama: capture the opposing master, or move your master into their shrine."),
  "131357": last("Coup: last player with influence remaining."),
  "1406": last("Monopoly: last player not bankrupt (or most assets if you call it)."),
  "2223": points("Uno: winner of a hand scores the leftover cards in everyone else's hands. Play to 500, or log this hand.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "1269": last("Skip-Bo: first to empty their stock pile. Optional: play several rounds to 500."),
  "40507": last("Skip-Bo Junior: first to empty the shorter stock pile."),
  "1258": points("Phase 10: first through all ten phases. If it's close, lowest leftover card points wins.", [
    { id: "phase", label: "Phase reached", min: 0, max: 10 },
    { id: "left", label: "Leftover card points" },
  ]),
  "22664": points("Phase 10 Masters: same ten-phase race, leftover cards as a tie-break.", [
    { id: "phase", label: "Phase reached", min: 0, max: 10 },
    { id: "left", label: "Leftover card points" },
  ]),
  "38187": points("Phase 10 Twist: track the phase you finished and leftover cards.", [
    { id: "phase", label: "Phase reached", min: 0, max: 10 },
    { id: "left", label: "Leftover card points" },
  ]),
  "2578": points("Phase 10 Dice: phases completed, leftover pips as a tie-break.", [
    { id: "phase", label: "Phase reached", min: 0, max: 10 },
    { id: "left", label: "Leftover" },
  ]),
  "271460": points("UNO Flip!: leftover cards in everyone else's hands. Dark-side cards count extra if that's your house rule.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "2818": points("UNO Attack!: first out scores leftover cards. Launcher cards count as drawn.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "24318": points("UNO Spin: leftover cards, same 500-point race as Uno.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "246701": points("DOS: leftover cards. First to empty both the shout and the hand.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "386551": points("DOS Second Edition: leftover cards this hand.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "399088": points("No Mercy: leftover cards. Stacked draws make this a bloodbath to 500.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "9090": last("My First UNO: first to empty their hand. Skip the 500-point math."),
  "352997": points("All Wild!: leftover cards. Everything matches, so speed is the score.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "380300": points("UNO Flex!: leftover cards this hand.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "343122": points("Triple Play: leftover cards. Dumping the tray is a penalty if you house-rule it.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "372973": points("UNO Party!: leftover cards. Sixteen people, same 500-point pad.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "394783": result("UNO Quatro: first four-in-a-row by color or number."),
  "172237": points("UNO Dare!: leftover cards, or skip the points and just survive the dares.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "147647": points("UNO Blast: leftover cards after the blaster empties.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "38038": points("UNO Flash: leftover cards. Timer doesn't change the pad.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "16693": points("UNO H2O: leftover cards. Downpour is just a wild with extra draw.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "455524": points("Liar's UNO: leftover cards after the last call.", [
    { id: "hand", label: "Points this hand" },
  ]),
  "116593": points("UNO Dice: leftover pips, or first to dump their dice.", [
    { id: "hand", label: "Score this round" },
  ]),
  "412804": points("Bank: highest pot you locked in over 10, 15, or 20 rounds.", [
    { id: "total", label: "Banked total" },
  ]),
  "5048": place("Candy Land: first to the castle. Enter finish order."),
  "1111": team("Taboo: teams score 1 per guessed word in the round.", ["Team A", "Team B"]),
  "21790": race("Crokinole: 20-point rounds, first to 100 (or highest after an even number of rounds).", 100, [total]),
  "50": points("Lost Cities: expedition totals (can be negative) plus bonuses.", [total]),
  "54043": roundWins("Jaipur: first to two seals of excellence.", 2),
  "2653": points("Survive: points for people (and treasure) you got off the island.", [
    { id: "people", label: "People" },
    { id: "treasure", label: "Treasure" },
  ]),
  "2651": points("Power Grid: cities you can power with the fuel you bought.", [
    { id: "cities", label: "Cities powered" },
  ]),
  "3076": points("Puerto Rico: VP chips + building VP.", [
    { id: "chips", label: "VP chips" },
    { id: "buildings", label: "Buildings" },
  ]),
  "199561": points("Sagrada: public goals, private color, row/column bonuses, minus leftover dice.", [
    { id: "public", label: "Public goals" },
    { id: "private", label: "Private goal" },
    { id: "rows", label: "Row / color bonuses" },
    { id: "left", label: "Leftover dice (penalty)" },
  ]),
  "263918": points("Cartographers: four seasons scored from edicts. Highest total.", [
    { id: "s1", label: "Spring" },
    { id: "s2", label: "Summer" },
    { id: "s3", label: "Fall" },
    { id: "s4", label: "Winter" },
  ]),
  "170216": points("Blood Rage: quests, pillage, Valhalla, and clan stats.", [total]),
  "205597": points("Rising Sun: victory points from battles, territories, and winter.", [vp]),
  "242302": points("That's Pretty Clever!: all four dice-combo boards, plus the silver/gold extras.", [total]),
  "41": points("Can't Stop: claimed columns. Highest total of closed numbers, or last to bust out — enter column points.", [
    { id: "columns", label: "Columns claimed" },
  ]),
  "811": points("Rummikub: winner scores the leftover tiles in everyone else's racks (as a positive).", [total]),
  "2453": points("Blokus: 89 minus remaining squares. Bonus +15 if you played everything, +5 extra if last piece was the 1.", [
    { id: "remaining", label: "Squares left (penalty)" },
    { id: "bonus", label: "Clear bonus", hint: "0, 15, or 20" },
  ]),
  "25669": points("Qwirkle: 1 per tile in each line you extend, +6 for a Qwirkle of six.", [total]),
  "1294": result("Clue: first correct accusation wins."),
  "1293": points("Boggle: word lengths 3=1, 4=1, 5=2, 6=3, 7=5, 8+=11.", [total]),
  "320": points("Scrabble: running tile scores + 50 per bingo.", [
    { id: "words", label: "Word scores" },
    { id: "bingos", label: "Bingo bonuses", hint: "50 each" },
  ]),
  "3931": result("Connect Four: first to four in a row."),
  "2452": last("Jenga: last player who didn't topple the tower."),
  "1410": team("Pictionary: team points, or first to the finish square.", ["Team A", "Team B"]),
  "4112": result("Sequence: first to the required number of sequences."),
  "2083": points("Yahtzee: the 13 boxes plus upper-section bonus.", [
    { id: "ones", label: "Aces", min: 0, max: 5 },
    { id: "twos", label: "Twos", min: 0, max: 10 },
    { id: "threes", label: "Threes", min: 0, max: 15 },
    { id: "fours", label: "Fours", min: 0, max: 20 },
    { id: "fives", label: "Fives", min: 0, max: 25 },
    { id: "sixes", label: "Sixes", min: 0, max: 30 },
    { id: "threekind", label: "3 of a kind" },
    { id: "fourkind", label: "4 of a kind" },
    { id: "fullhouse", label: "Full house", hint: "0 or 25", min: 0, max: 25 },
    { id: "small", label: "Small straight", hint: "0 or 30", min: 0, max: 30 },
    { id: "large", label: "Large straight", hint: "0 or 40", min: 0, max: 40 },
    { id: "yahtzee", label: "Yahtzee", hint: "0 or 50", min: 0, max: 50 },
    { id: "chance", label: "Chance" },
    { id: "ybonus", label: "Yahtzee bonus", hint: "100 each" },
  ]),
  "8110": last("Left Right Center: last player with chips."),
  "4118": points("The Game of Life: most money at Career Day / retirement.", [
    { id: "money", label: "Money ($k)" },
  ]),
  "157969": points("Sheriff of Nottingham: gold value of legal (and successfully smuggled) goods.", [total]),
  "181304": coop("Mysterium: psychics + ghost score from the clock and recovered suspects.", [
    { id: "score", label: "Group score" },
  ]),
  "156129": team("Deception: Murder in Hong Kong — forensic scientist vs the murder team.", [
    "Investigators",
    "Murderer",
  ]),
  "217372": place("The Quest for El Dorado: first to the golden temple. Enter finish order."),
  "266083": points("Isle of Cats: rooms, lessons, families, minus rats and leftover baskets.", [total]),
  "281555": points("The King Is Dead: influence cubes in the controlling nations.", [total]),
  "169255": coop("The Grizzled: the squad survives the war, or it doesn't.", []),
  "164153": last("Star Realms: reduce the opponent's authority to 0. Last with authority wins."),
  "265402": coop("Final Girl: the heroine lives and the killer is stopped.", [
    { id: "health", label: "Health left" },
  ]),
  "414317": points("Harmonies: animals (if their habitat is complete) + trees, mountains, fields, buildings.", [
    { id: "animals", label: "Animals" },
    { id: "nature", label: "Nature / terrain" },
  ]),
  "366161": points("Forest Shuffle: trees and forest cards, minus leftover in hand.", [total]),
  "385565": points("Faraway: regions scored in reverse order, plus sanctuaries.", [total]),
  "359871": points("The White Castle: coins, seals, and decree points.", [total]),
  "295947": coop("So Clover!: cooperative clue-giving. Score the clover petals you nailed.", [
    { id: "petals", label: "Correct petals" },
  ]),
  "291453": points("Fun Facts: points for placing your token closest to the truth.", [total]),
  "13-junior": coop("Outfoxed!: find the culprit before three clues run out.", [
    { id: "clues", label: "Clues left" },
  ]),
  "65244": coop("Forbidden Island: lift off with the treasures before the island sinks.", [
    { id: "flood", label: "Flood level" },
  ]),
  "65200": coop("Forbidden Desert: find the parts and take off before the sand takes you.", [
    { id: "sand", label: "Sand storm" },
  ]),
  "209418": last("Rhino Hero: last player who placed a wall/roof without collapsing the tower."),
  "177678": points("Ice Cool: fish caught this round, play several classrooms.", [
    { id: "fish", label: "Fish" },
  ]),
  "37111": team("Battlestar Galactica: humans jump home, or Cylons destroy the fleet.", ["Humans", "Cylons"]),
  "175921": points("Food Chain Magnate: cash is the score.", [
    { id: "cash", label: "Money" },
  ]),
  "367041": points("Guild of Merchant Explorers: map scoring from coins, cities, and landmarks.", [total]),
  "28143": points("Race for the Galaxy: VP chips + card VP + bonuses.", [
    { id: "chips", label: "VP chips" },
    { id: "cards", label: "Cards" },
  ]),
  "266810": points("Paladins of the West Kingdom: faith, strength, and influence tracks.", [total]),
  "199969": points("That's Pretty Clever extra — use the printed total.", [total]),
  "318184": points("Wonderland's War: points from wagers, territories, and tales.", [vp]),
  "291572": points("Wonderland's War: same kingdom scramble — VP at the end.", [vp]),
  "286096": points("Tainted Grail: campaign glory / diplomacy as your table tracks it.", [total]),
};

export function inferScoreCard(game: Game): ScoreCardDef {
  const cats = game.categories.join(" ").toLowerCase();
  const mech = game.mechanics.join(" ").toLowerCase();
  const hay = `${cats} ${mech} ${game.name.toLowerCase()}`;
  if (/cooperative|co-op|coop/.test(hay) || /legacy/.test(hay) && /cooperative/.test(cats)) {
    return coop("Win or lose together. Log the attempt.", [{ id: "score", label: "Group score" }]);
  }
  if (/hidden roles|negotiation|spies|political/.test(hay) && /party|bluffing/.test(hay)) {
    return team("Team win. Assign sides, then mark who took the table.", ["Team A", "Team B"]);
  }
  if (/player elimination/.test(hay) && !/victory point/.test(hay)) {
    return last("Last player still in wins.");
  }
  if (/racing|real-time/.test(hay)) {
    return place("Finishing order. First across the line is 1.");
  }
  if (/abstract strategy|chess/.test(hay)) {
    return result("Pick the winner, or call it a draw.");
  }
  return points("Highest score on the printed pad wins. Enter the published total.", [total]);
}

export function getScoreCard(game: Game): ScoreCardDef {
  return SCORE_CARDS[game.bggId] ?? inferScoreCard(game);
}

export function fieldTotal(def: ScoreCardDef, values: Record<string, number>): number {
  if (def.kind === "place") return -(values.place ?? 99);
  let sum = 0;
  for (const f of def.fields) {
    const n = Number(values[f.id] ?? 0);
    if (f.id === "failed" || f.id === "floor" || f.id === "empty" || f.id === "left" || f.id === "rats" || f.id === "remaining") {
      sum -= Math.abs(n);
    } else if (f.id === "phase") {
      sum += n * 100;
    } else if (f.id === "bonus" && def.fields.some((x) => x.id === "remaining")) {
      sum += n;
    } else {
      sum += n;
    }
  }
  if (def.fields.some((f) => f.id === "ones")) {
    const upper =
      (values.ones ?? 0) +
      (values.twos ?? 0) +
      (values.threes ?? 0) +
      (values.fours ?? 0) +
      (values.fives ?? 0) +
      (values.sixes ?? 0);
    if (upper >= 63) sum += 35;
  }
  return sum;
}

export function describeKind(kind: ScoreKind): string {
  switch (kind) {
    case "points":
      return "Highest score";
    case "race":
      return "Race to the target";
    case "team":
      return "Team win";
    case "coop":
      return "All together";
    case "last":
      return "Last standing";
    case "rounds":
      return "Most rounds";
    case "place":
      return "Finishing order";
    case "result":
      return "Winner / draw";
  }
}

export function resolveWinners(
  def: ScoreCardDef,
  session: Pick<ScoreSession, "scores" | "coopWon" | "winningTeam" | "draw">,
): string[] {
  if (session.draw) return [];
  if (def.kind === "coop") return session.coopWon ? session.scores.map((s) => s.playerId) : [];
  if (def.kind === "team") {
    const team = session.winningTeam;
    if (!team) return [];
    return session.scores.filter((s) => s.team === team).map((s) => s.playerId);
  }
  if (def.kind === "last" || def.kind === "result") {
    return session.scores.filter((s) => s.won).map((s) => s.playerId);
  }
  if (def.kind === "place") {
    const best = Math.min(...session.scores.map((s) => s.place ?? s.values.place ?? 99));
    return session.scores.filter((s) => (s.place ?? s.values.place) === best).map((s) => s.playerId);
  }
  const totals = session.scores.map((s) => ({
    id: s.playerId,
    n: fieldTotal(def, s.values),
  }));
  if (!totals.length) return [];
  const best = def.lowerIsBetter ? Math.min(...totals.map((t) => t.n)) : Math.max(...totals.map((t) => t.n));
  if (def.kind === "race" && def.target != null && best < def.target) {
    /* nobody hit the target — still crown the leader */
  }
  return totals.filter((t) => t.n === best).map((t) => t.id);
}

export function lifetimeStats(
  playerId: string,
  sessions: ScoreSession[],
  cardFor: (bggId: string) => ScoreCardDef | null,
) {
  let wins = 0;
  let games = 0;
  let coopWins = 0;
  for (const s of sessions) {
    if (!s.playerIds.includes(playerId)) continue;
    games += 1;
    const def = cardFor(s.bggId);
    if (!def) continue;
    const winners = resolveWinners(def, s);
    if (winners.includes(playerId)) {
      wins += 1;
      if (def.kind === "coop") coopWins += 1;
    }
  }
  return { wins, games, coopWins, winRate: games ? wins / games : 0 };
}

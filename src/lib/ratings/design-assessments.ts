import type { DesignAssessment } from "./design-catalog";

// Source observations are paraphrases; numeric values are provisional anchored inferences.
export const DESIGN_ASSESSMENTS: readonly DesignAssessment[] = [
  {
    legacyId: "178900",
    title: "Codenames",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6, 7, 8],
    values: [2.5, 3, 4, 5, 2, 4, 1, 1, 3.5, 4, 1.5],
    source: "https://czechgames.com/files/rules/codenames-rules-en.pdf",
    evidence:
      "Random word/key setup; one-word clues link several words; teammates interpret and debate; assassin ends the game. Grid serves word identity lookup, not positional tactics.",
    familyEvidence:
      "Brief turn rules and team discussion support participation; reading, vocabulary and restricted clues create access demands.",
  },
  {
    legacyId: "266192",
    title: "Wingspan",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [3, 4, 2, 1.5, 3, 4, 4, 1, 2.5, 1.5, 2.5],
    source: "https://wingspan.rulepop.com/",
    evidence:
      "Bird draws and food dice change options; food, eggs and cards pay for birds and habitat actions; activated abilities create engines and varied goals. Habitat slots influence secondary placement choices.",
    familyEvidence:
      "Several connected procedures, bird text, icons and resource tracking; ordinary play has no elimination but turns are individually processed.",
  },
  {
    legacyId: "13",
    title: "Catan",
    edition: "Base game; standard rules; no expansions",
    players: [3, 4],
    values: [3.5, 4, 2, 3.5, 3, 4, 4, 1, 3, 2.5, 5],
    source: "https://www.catan.com/catan",
    evidence:
      "Dice distribute scarce resources; players trade, build roads and settlements, upgrade cities and contest routes on a variable island. Trading supports negotiation.",
    familyEvidence:
      "Trading and regular turns support participation; resource arithmetic, placement restrictions and waits between productive rolls add barriers.",
  },
  {
    legacyId: "9209",
    title: "Ticket to Ride",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [2.5, 4, 2, 1, 2, 4, 3, 1, 4, 2, 5],
    source: "https://www.daysofwonder.com/game/ticket-to-ride/",
    evidence:
      "Draw train cards, spend matching sets to claim routes, connect ticket destinations; shared routes impose blocking and competing priorities.",
    familyEvidence:
      "A small action menu, visible routes and no elimination support recurring participation; ticket reading and final route scoring require some processing.",
  },
  {
    legacyId: "230802",
    title: "Azul",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2.5, 3.5, 2, 1, 2.5, 4, 3, 1, 4, 2, 5],
    source:
      "https://cdn.svc.asmodee.net/production-nextmove/uploads/sites/4/2024/06/EN-Azul-Rules-Next-Move-web.pdf",
    evidence:
      "Random factory refills feed shared tile drafting; pattern rows limit choices; wall adjacency scores, excess tiles penalize, and taking tiles changes opponents options.",
    familyEvidence:
      "Little in-play prose, repeated draft/place turns, no elimination; wall restrictions and scoring need explanation. Mistakes lose points without removing players.",
  },
  {
    legacyId: "30549",
    title: "Pandemic",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3, 4, 2, 4, 3, 4, 4, 1, 3, 2, 5],
    source: "https://www.zmangames.com/game/pandemic/",
    evidence:
      "Infection and epidemic cards escalate a shared crisis; team actions, travel and card exchanges pursue four cures while containing outbreaks.",
    familyEvidence:
      "Shared outcome and no ordinary elimination support participation; role powers, hand limits and outbreak procedures create a substantive rules burden.",
  },
  {
    legacyId: "822",
    title: "Carcassonne",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [2.5, 4, 2, 1, 2.5, 4, 3.5, 1, 3.5, 2, 5],
    source: "https://www.zmangames.com/game/carcassonne/",
    evidence:
      "Draw and connect terrain tiles; commit limited followers to roads, cities, monasteries and farms; completion returns some followers, while farms tie them up.",
    familyEvidence:
      "One repeated tile-placement turn and no elimination; scoring differences, ownership and farm boundaries add learning demands.",
  },
  {
    legacyId: "36218",
    title: "Dominion",
    edition: "Original base game; first-edition Kingdom cards",
    players: [2, 3, 4],
    values: [2.5, 4.5, 2, 1.5, 3, 4.5, 5, 1, 2.5, 1.5, 1],
    source: "https://www.riograndegames.com/wp-content/uploads/2020/03/Dominion-gameRules.pdf",
    evidence:
      "Action, buy and cleanup phases cycle a shuffled deck; purchased cards change future hands; actions, buys and coins constrain combinations; victory cards score but consume deck space.",
    familyEvidence:
      "Recurring turn sequence and no elimination; substantial card reading and interaction between effects require ongoing rule processing.",
  },
  {
    legacyId: "169786",
    title: "Scythe",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [2, 4.5, 2, 2, 4, 4.5, 4.5, 1, 2, 2, 4.5],
    source: "https://store.stonemaiergames.com/products/scythe",
    evidence:
      "Asymmetric factions combine action selection, upgrades, movement and production; encounters, objectives and hidden combat cards create uncertainty. Economy and territory interact.",
    familyEvidence:
      "Multiple resources, player-board systems and asymmetric abilities impose sustained processing; no routine player elimination.",
  },
  {
    legacyId: "162886",
    title: "Spirit Island",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 5, 2, 4, 4.5, 5, 5, 1, 2, 2, 4.5],
    source: "https://shop.greaterthangames.com/products/spirit-island",
    evidence:
      "Asymmetric spirits spend energy on powers with timing, range and element requirements; coordinated defense counters invader actions, blight and fear thresholds.",
    familyEvidence:
      "Cooperative outcome supports shared planning but asymmetric powers, timing and escalating invader procedures impose heavy processing demands.",
  },
  {
    legacyId: "224517",
    title: "Brass: Birmingham",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2, 5, 2, 2.5, 4, 4.5, 5, 1, 2, 1.5, 4.5],
    source: "https://files.roxley.com/Brass-Birmingham-Rulebook-2018.11.20-highlights.pdf",
    evidence:
      "Hand cards enable industry and network construction; coal, iron, beer, money and loans constrain transactions; canal and rail eras change networks and scoring.",
    familyEvidence:
      "No elimination; interdependent market access, network rules, income and era procedures impose substantial rules and arithmetic demands.",
  },
  {
    legacyId: "148228",
    title: "Splendor",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2, 4, 2, 1, 2, 4, 5, 1, 4, 1.5, 1.5],
    source: "https://www.spacecowboys-games.com/game/splendor/",
    evidence:
      "Collect scarce gem tokens, purchase development discounts, reserve cards and meet noble requirements; public card offers change with draws. Layout mainly organizes prices and tiers.",
    familyEvidence:
      "Short repeated actions, icon-based requirements and no elimination; counting costs and discounts is the main processing demand.",
  },
  {
    legacyId: "70323",
    title: "King of Tokyo",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [3.5, 3, 2, 2.5, 2.5, 3.5, 3, 1, 3, 3, 2.5],
    source: "https://iellogames.com/wp-content/uploads/2021/10/KOT_Rules_EN_11-2023_Light.pdf",
    evidence:
      "Reroll dice for points, damage, healing and energy; Tokyo occupancy changes attacks and healing; energy purchases power cards. Health loss can eliminate players.",
    familyEvidence:
      "Familiar reroll procedure and shared attack reactions; card text, health tracking and elimination reduce continuous access.",
  },
  {
    legacyId: "133473",
    title: "Sushi Go!",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [2.5, 3, 2.5, 1, 2, 3.5, 2.5, 1, 4, 2.5, 1],
    source: "https://www.gamewright.com/product/Sushi-Go",
    evidence:
      "Simultaneous pick-and-pass drafting forms scoring sets; passed hands supply information; wasabi modifies nigiri and pudding spans rounds.",
    familyEvidence:
      "Everyone picks each turn and no one is eliminated; compact scoring categories and set arithmetic need an initial explanation.",
  },
  {
    legacyId: "277085",
    title: "Love Letter",
    edition: "2019 Z-Man base edition",
    players: [2, 3, 4, 5, 6],
    values: [3.5, 3, 3, 2.5, 2.5, 3.5, 2, 1, 3, 3, 1],
    source:
      "https://images.zmangames.com/filer_public/5b/6c/5b6c17d7-7e0e-4b70-a311-9a6c32066010/ll-rulebook.pdf",
    evidence:
      "Draw one card and play one ability; hidden ranks, guessing, comparisons and discards support deduction; rounds can eliminate players before the highest surviving rank scores.",
    familyEvidence:
      "Brief turns and short resets help participation; card powers, concealed information and round elimination create barriers.",
  },
  {
    legacyId: "131357",
    title: "Coup",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [2.5, 3.5, 2, 5, 2.5, 4, 3, 1, 2.5, 3.5, 1],
    source: "https://indieboardsandcards.com/our-games/coup/",
    evidence:
      "Hidden influence cards support role claims, bluffing and challenges; coins fund coups and assassination; losing both influence cards eliminates a player.",
    familyEvidence:
      "A small action menu but role recall, deception and elimination create participation barriers; roles can be referenced publicly.",
  },
  {
    legacyId: "254640",
    title: "Just One",
    edition: "Base game; standard rules; no expansions",
    players: [3, 4, 5, 6, 7],
    values: [2, 2, 4, 5, 1.5, 3.5, 1, 1, 3.5, 5, 1],
    source:
      "https://cdn.svc.asmodee.net/production-rprod/storage/games/justone/NEW/jo-en02-rules-mkt-1749635213L3H57.pdf",
    evidence:
      "Players write one-word clues for a hidden word; duplicate clues cancel; the active player guesses from remaining clues; a limited word deck forms each session.",
    familyEvidence:
      "Simultaneous clue contribution and no elimination; independent word reading, writing and vocabulary remain substantial access requirements.",
  },
  {
    legacyId: "244992",
    title: "The Mind",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3, 2.5, 3.5, 4, 1.5, 3.5, 2.5, 1, 4, 3.5, 1],
    source: "https://pandasaurusgames.com/products/the-mind",
    evidence:
      "Players collectively play concealed numbered hands in ascending order without speaking; timing and reading the group matter; shared lives and limited aids permit recovery.",
    familyEvidence:
      "Very little text and a compact rule loop; number ordering and silent coordination are required, with shared limited recovery rather than individual elimination.",
  },
  {
    legacyId: "92415",
    title: "Skull",
    edition: "Base flowers/skulls rules; no Last Chance variant",
    players: [3, 4, 5, 6],
    values: [1.5, 3, 2, 5, 1.5, 4, 2, 1, 3.5, 4, 1],
    source: "https://www.spacecowboys-games.com/game/skull/",
    evidence:
      "Players place concealed flower or skull discs and bid how many they can reveal safely; claims and risk depend on others intentions; failed reveals lose discs.",
    familyEvidence:
      "Very low text burden and simple repeating choices; bluffing and disc loss can exclude a player before the session ends.",
  },
  {
    legacyId: "39856",
    title: "Dixit",
    edition: "Original six-player base edition",
    players: [3, 4, 5, 6],
    values: [2.5, 2, 3.5, 5, 2, 4, 1, 1, 4, 4.5, 1],
    source:
      "https://images-cdn.asmodee.us/filer_public/71/db/71db4c28-aa59-4d4f-ad0a-af2c7e8167dc/dix01_rules.pdf",
    evidence:
      "A storyteller clues an image; others submit competing images, then vote; the storyteller benefits when some but not all identify the intended image.",
    familyEvidence:
      "Picture-based contributions, shared voting and no elimination support participation; interpreting clues and the scoring exceptions add modest demands.",
  },
  {
    legacyId: "163412",
    title: "Patchwork",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [2, 4, 2, 1, 2.5, 4, 4.5, 1, 3.5, 1.5, 5],
    source: "https://www.lookout-spiele.de/upload/en_patchworkre.html_PWNR_Rulebook_EN_web.pdf",
    evidence:
      "Players buy polyomino patches using buttons and time; position in the patch market limits purchase options; quilt fit, income and turn order create competing costs.",
    familyEvidence:
      "No prose reading during turns or elimination; shape fitting, time-order turns and button arithmetic require learning.",
  },
  {
    legacyId: "295770",
    title: "Cascadia",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 3.5, 2, 1, 2, 4, 3, 1, 4, 1.5, 5],
    source:
      "https://www.alderac.com/wp-content/uploads/2025/04/Cascadia_BaseGame_Rulebook_Optimized.pdf",
    evidence:
      "Draft paired habitat tiles and wildlife tokens; terrain corridors and animal-specific spatial patterns score; nature tokens change draft flexibility.",
    familyEvidence:
      "Repeated placement turns and no elimination support access; separate animal scoring patterns require reference but little card prose.",
  },
  {
    legacyId: "199792",
    title: "Everdell",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4, 2, 1.5, 3.5, 4, 4.5, 1, 2.5, 1.5, 2],
    source: "https://rules.dized.com/game/0GI6_zUiQh2U27DV_13LJw/everdell",
    evidence:
      "Workers collect resources; construction and critter cards form a limited city with interacting abilities; individual season changes recall workers and trigger production.",
    familyEvidence:
      "No elimination but substantial card text, linked abilities, resource costs and independently timed seasons create participation demands.",
  },
  {
    legacyId: "342942",
    title: "Ark Nova",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4.5, 2, 1.5, 4, 4.5, 4.5, 1, 2, 1.5, 3.5],
    source: "https://capstone-games.com/wp-content/uploads/2021/10/Ark-Nova-Rulebook.pdf",
    evidence:
      "Action card positions determine strength; animals, sponsors, enclosures and conservation projects interact with money, reputation and zoo space; card offers change.",
    familyEvidence:
      "Many card requirements, icons, action strengths and end conditions require sustained processing; ordinary play does not eliminate players.",
  },
  {
    legacyId: "316554",
    title: "Dune: Imperium",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4.5, 2, 2.5, 3.5, 4.5, 4.5, 1, 2.5, 2, 3],
    source: "https://direwolfdigital.com/dune-imperium/",
    evidence:
      "Deck-building and worker placement link card access, faction influence, resources and troop commitments; uncertain hands and intrigue create risk.",
    familyEvidence:
      "Turns use a recurring structure, but card icons, faction tracks, combat and reveal phases impose several connected rules demands.",
  },
  {
    legacyId: "312484",
    title: "Lost Ruins of Arnak",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4, 2, 1, 3.5, 4, 4.5, 1, 2.5, 1.5, 2.5],
    source:
      "https://filemanager.czechgames.com/storage/files/lost-ruins-of-arnak/rules/lost-ruins-of-arnak-rules-en.pdf",
    evidence:
      "Cards and workers combine exploration, resource conversion, guardian costs and research progress; limited actions force timing tradeoffs.",
    familyEvidence:
      "No elimination; several resources, icons, site effects and research procedures create recurring processing demands.",
  },
  {
    legacyId: "244521",
    title: "The Quacks of Quedlinburg",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [4, 3, 2, 1.5, 2.5, 3.5, 3.5, 1, 3.5, 3, 2.5],
    source:
      "https://www.schmidtspiele.de/files/Retail/72dpi_PNG/88220_Quack_rules_english_2024.pdf",
    evidence:
      "Simultaneous random bag draws advance potions; too many white chips explode the brew; purchased ingredients change future odds; books vary effects.",
    familyEvidence:
      "Simultaneous play and next-round recovery support access; ingredient exceptions, risk sums and purchases require modest recurring calculation.",
  },
  {
    legacyId: "284083",
    title: "The Crew: The Quest for Planet Nine",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [2.5, 4, 3, 4, 2.5, 4, 3, 1, 3, 2.5, 1],
    source: "https://thames-kosmos.myshopify.com/collections/family-strategy/products/the-crew",
    evidence:
      "Cooperative trick-taking missions assign required card wins; constrained communication and hand uncertainty require coordination and inference across fifty missions.",
    familyEvidence:
      "Shared objectives and short mission resets prevent long individual elimination; trick-following, task restrictions and limited communication require learning.",
  },
  {
    legacyId: "385761",
    title: "Sky Team",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [3, 4, 2, 4, 3, 4, 4, 1, 3, 2, 3],
    source:
      "https://www.scorpionmasque.com/sites/scorpionmasque.com/files/st_rules01_en_06jun2023.pdf",
    evidence:
      "Partners silently allocate dice to axis, engines and landing systems; limited coffee adjusts values; traffic and airport scenarios change constraints.",
    familyEvidence:
      "Shared success and no individual elimination; several interacting cockpit thresholds and restricted communication impose ongoing procedural demands.",
  },
  {
    legacyId: "366013",
    title: "Heat: Pedal to the Metal",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5, 6],
    values: [3, 4, 2, 1.5, 3, 4, 4, 1, 3.5, 2.5, 4],
    source:
      "https://cdn.svc.asmodee.net/production-daysofwonder/uploads/2024/07/9101-HT-Rules-EN.pdf",
    evidence:
      "Select gears and speed cards, manage heat and cooling, navigate corner limits and slipstreams; stress draws introduce risk. Tracks change timing decisions.",
    familyEvidence:
      "Simultaneous card selection and continued racing after spinouts support access; gears, heat and situational turn steps add rules demands.",
  },
  {
    legacyId: "2655",
    title: "Hive",
    edition: "Original base insects; no expansion insects",
    players: [2],
    values: [1, 4.5, 2, 1, 2.5, 4.5, 3, 1, 3.5, 1, 5],
    source: "https://www.gen42.com/wp-content/uploads/Hive-rules.pdf",
    evidence:
      "Fixed insect movement powers and one-hive connectivity constrain blocking and encirclement; no dice or card draws; spatial anticipation determines threats.",
    familyEvidence:
      "No text during play or random exceptions; remembering insect moves and connectivity takes learning, while short alternating turns preserve access.",
  },
  {
    legacyId: "194655",
    title: "Santorini",
    edition: "Base game without God Powers",
    players: [2, 3, 4],
    values: [1, 4, 2, 1, 1.5, 4, 2.5, 1, 4.5, 1.5, 5],
    source: "https://files.roxley.com/Santorini-Rulebook-Web-2016.08.14.pdf",
    evidence:
      "Move a worker then build; height restrictions and domes change future movement; reaching level three wins. Fixed rules permit multi-turn blocking.",
    familyEvidence:
      "A compact repeated turn, no card reading and visible construction support access; being unable to move can end participation.",
  },
  {
    legacyId: "160477",
    title: "Onitama",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [1.5, 4, 2, 1, 1.5, 4, 2.5, 1, 4, 1, 5],
    source: "https://www.arcanewonders.com/wp-content/uploads/2021/05/Onitama-Rulebook.pdf",
    evidence:
      "Five sampled movement cards rotate between players; choose a move then give that card to the opponent; capture the master or enter its temple to win.",
    familyEvidence:
      "Visible move diagrams, short turns and no in-play prose support access; capture and two win conditions require a brief explanation.",
  },
  {
    legacyId: "170216",
    title: "Blood Rage",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2, 4.5, 2, 2.5, 3.5, 4.5, 4, 1, 2.5, 2.5, 4.5],
    source: "https://www.cmon.com/wp-content/uploads/2023/06/BLR001-Rulebook.pdf",
    evidence:
      "Draft cards, spend rage on actions, contest provinces and resolve battles using hidden cards; quests and Ragnarok change scoring priorities over three ages.",
    familyEvidence:
      "Multiple phases, card text and combat exceptions demand learning; lost figures return, avoiding ordinary player elimination.",
  },
  {
    legacyId: "205597",
    title: "Rising Sun",
    edition: "Base game; standard rules; no expansions",
    players: [3, 4, 5],
    values: [2, 4.5, 2, 4.5, 4, 4.5, 4.5, 1, 2, 3, 4],
    source: "https://www.cmon.com/wp-content/uploads/2023/06/Rising_Sun_Rulebook.pdf",
    evidence:
      "Seasonal alliances and mandates distribute actions; provinces, shrine influence, honor and hidden war bids create interacting strategic and diplomatic tradeoffs.",
    familyEvidence:
      "Negotiation involves players beyond their turns, but asymmetric powers, mandates and several war-bid outcomes create a substantial rules burden.",
  },
  {
    legacyId: "28143",
    title: "Race for the Galaxy",
    edition: "Second-edition base set; no expansions",
    players: [2, 3, 4],
    values: [3, 4.5, 2, 2, 3.5, 4.5, 5, 1, 2, 1.5, 1.5],
    source: "https://www.riograndegames.com/wp-content/uploads/2013/02/RFTG_2e_rules.pdf",
    evidence:
      "Players secretly select phases and build worlds or developments using cards as payment; production and consumption engines depend on hands and opponents phase choices.",
    familyEvidence:
      "Simultaneous phases preserve involvement; dense icons, payment choices and card effects create a substantial learning burden.",
  },
  {
    legacyId: "2651",
    title: "Power Grid",
    edition: "First edition; base Germany/USA maps",
    players: [2, 3, 4, 5, 6],
    values: [1.5, 4.5, 2, 2.5, 3.5, 4.5, 5, 1, 2.5, 1.5, 4],
    source: "https://www.riograndegames.com/games/power-grid-first-edition/",
    evidence:
      "Auction plants, buy fuel from a changing market and connect cities; efficient generation must compete with network expansion for money.",
    familyEvidence:
      "Auctions involve multiple players and no elimination; repeated cost calculations, market refills and changing building limits impose substantial demands.",
  },
  {
    legacyId: "2223",
    title: "Uno",
    edition: "Classic UNO; no custom wild rules",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2.5, 2, 2, 2, 3, 2.5, 1, 4, 3, 1],
    source: "https://service.mattel.com/instruction_sheets/GTH19%20-%20English.pdf",
    evidence:
      "Match color, number or action to shed a shuffled hand; wilds and penalties allow tactical timing; calling UNO and challenges create occasional interaction.",
    familyEvidence:
      "Short symbol-based turns and no elimination within a hand; action rules and penalty scoring add modest recall.",
  },
  {
    legacyId: "271460",
    title: "UNO Flip!",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 3, 2, 2, 2.5, 3.5, 2.5, 1, 3.5, 3, 1],
    source: "https://service.mattel.com/us/productDetail.aspx?prodno=GDG37&siteid=27",
    evidence:
      "Double-sided cards and Flip actions change every hand and the active action set; shed cards by matching while timing which side becomes active.",
    familyEvidence:
      "Familiar matching supports access; switching sides and distinct action effects increase recall and penalties can extend waits.",
  },
  {
    legacyId: "2818",
    title: "UNO Attack!",
    edition: "GTX66 launcher edition",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4.5, 2.5, 2, 1.5, 2, 3, 2, 1, 3.5, 3.5, 1],
    source: "https://service.mattel.com/instruction_sheets/GTX66-Eng.pdf",
    evidence:
      "Color/number matching uses a launcher instead of normal draws; pressing can yield none or many cards; action cards alter penalties and discards. Button pressing is not skilled motor play.",
    familyEvidence:
      "Simple matching turns and shared launcher reactions; unpredictable large penalties and skips can delay participation.",
  },
  {
    legacyId: "24318",
    title: "UNO Spin",
    edition: "Original J3719 2005 wheel edition; no house rules",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4.5, 2.5, 2, 2, 2.5, 3, 2, 1, 3.5, 3.5, 1],
    source: "https://service.mattel.com/instruction_sheets/J3719.pdf",
    evidence:
      "Matching cards triggers wheel actions including drawing, swapping hands and discarding; unpredictable wheel results can overturn hand management.",
    familyEvidence:
      "Straightforward matching plus spinner instructions; swaps and penalties alter progress without ordinary elimination.",
  },
  {
    legacyId: "246701",
    title: "DOS",
    edition: "Original 2018 edition",
    players: [2, 3, 4],
    values: [3.5, 3, 2.5, 1.5, 2.5, 3, 3, 1, 3.5, 2.5, 1.5],
    source: "https://service.mattel.com/instruction_sheets/FRM36-Eng.pdf",
    evidence:
      "Match center-row numbers with one card or the sum of two; color bonuses change benefits; matching opportunities depend on shuffled hands.",
    familyEvidence:
      "Repeated turn structure and no elimination; addition, multiple center cards and color bonuses increase processing beyond classic UNO.",
  },
  {
    legacyId: "386551",
    title: "DOS: Second Edition",
    edition: "HNN01 second edition",
    players: [2, 3, 4],
    values: [4, 2.5, 2, 1.5, 2, 3, 2.5, 1, 4, 2.5, 1.5],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=HNN01&siteid=27",
    evidence:
      "Two discard piles allow alternate matching opportunities; wild twos and Wild Play Two actions modify the shedding loop.",
    familyEvidence:
      "Short matching turns and no elimination; two-pile action rules require modest recall.",
  },
  {
    legacyId: "399088",
    title: "UNO: Show 'Em No Mercy",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [4.5, 3, 2, 2.5, 2.5, 3.5, 2.5, 1, 2.5, 3.5, 1],
    source: "https://service.mattel.com/instruction_sheets/HVW18-Eng.pdf",
    evidence:
      "Draw penalties stack; sevens swap hands and zeros rotate them; drawing to twenty-five cards eliminates a player. Tactical defense coexists with strong draw uncertainty.",
    familyEvidence:
      "Familiar matching but extra exceptions, severe penalties and elimination reduce sustained participation.",
  },
  {
    legacyId: "9090",
    title: "My First UNO",
    edition: "BGG47 Sofia the First rules; other My First editions may differ",
    players: [2, 3, 4],
    values: [4, 2, 1.5, 1.5, 1.5, 2.5, 2, 1, 4.5, 2.5, 1],
    source: "https://service.mattel.com/instruction_sheets/BGG47-Eng.pdf",
    evidence:
      "Match colors, numbers or characters from a five-card hand; a small deck uses wild and draw-two actions.",
    familyEvidence:
      "Large cards and simplified matching reduce reading and handling burden; short turns and no elimination support participation.",
  },
  {
    legacyId: "352997",
    title: "UNO: All Wild!",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2, 1.5, 2, 1.5, 2.5, 2, 1, 4.5, 3, 1],
    source: "https://service.mattel.com/us/productDetail.aspx?prodno=HHL33&siteid=27",
    evidence:
      "Every card is playable without matching color or number; action timing and shuffled hands drive progress.",
    familyEvidence:
      "Removing color/number matching reduces procedural demands; recurring action symbols and short turns preserve participation.",
  },
  {
    legacyId: "380300",
    title: "UNO Flex!",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6, 7, 8],
    values: [3.5, 3, 2, 2, 2.5, 3.5, 3, 1, 3.5, 3, 1],
    source: "https://service.mattel.com/instruction_sheets/HNB00-Eng-2024.pdf",
    evidence:
      "Power-card state controls access to alternate colors and stronger flex actions; players manage when to spend flex capability alongside normal matching.",
    familyEvidence:
      "Power state and paired card effects add rule tracking to a familiar short-turn loop; normal play does not eliminate participants.",
  },
  {
    legacyId: "343122",
    title: "UNO Triple Play",
    edition: "GXV87 standard untimed mode",
    players: [2, 3, 4, 5, 6],
    values: [4, 2.5, 2, 1.5, 2.5, 3, 2.5, 1, 3.5, 3, 1.5],
    source:
      "https://service.mattel.com/instruction-sheets/files/GXV87%20UNO%20Triple%20Play%20%5BEnglish_Spanish%5D%5BDOM%5D.pdf",
    evidence:
      "Electronic unit offers three discard piles; allowed piles and overload state constrain where matching cards can go. Electronic uncertainty supplements shuffled cards.",
    familyEvidence:
      "Matching remains simple but light states and unit procedures add recall; standard untimed mode avoids reaction-speed requirements.",
  },
  {
    legacyId: "372973",
    title: "UNO Party!",
    edition: "JJV58 edition",
    players: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    values: [4, 2.5, 2.5, 3.5, 2.5, 3.5, 2.5, 2, 3.5, 4, 1],
    source: "https://service.mattel.com/instruction_sheets/JJV58.pdf",
    evidence:
      "Out-of-turn exact matches, group pointing, linked draw penalties and mini-pile passing keep more players involved than classic matching alone.",
    familyEvidence:
      "Group actions and speed opportunities support off-turn involvement; large groups, penalties and additional action exceptions add waiting and recall.",
  },
  {
    legacyId: "394783",
    title: "UNO Quatro",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2.5, 3.5, 2, 1, 2, 3.5, 2.5, 1, 4, 2, 5],
    source: "https://service.mattel.com/us/productDetail.aspx?prodno=HPF82&siteid=27",
    evidence:
      "Place tiles to form four-in-a-row while satisfying number or color matching constraints; spatial threats interact with available tiles.",
    familyEvidence:
      "Visible color/number matching and short placement turns; no prose-heavy abilities, with spatial restrictions requiring initial teaching.",
  },
  {
    legacyId: "172237",
    title: "UNO Dare!",
    edition: "Printed Family dare list; no invented house-rule dares",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2.5, 2, 3.5, 2, 3, 2, 2, 3.5, 4, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=CDY11&siteid=27",
    evidence:
      "Dare actions offer drawing cards or performing prompts; standard matching and random hands remain central while dares add expression and occasional motor tasks.",
    familyEvidence:
      "Familiar matching and optional draw alternative support access; reading prompts and performing some dares create added demands.",
  },
  {
    legacyId: "147647",
    title: "UNO Blast",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [4.5, 2, 1.5, 1.5, 2, 3, 2, 1, 3.5, 3.5, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=Y2318&siteid=27",
    evidence:
      "When unable to play, draw and insert a card into the unit; a triggered blast gives accumulated cards to the active player. Motor placement itself is administrative.",
    familyEvidence:
      "Brief matching turns; unpredictable accumulated penalties extend hands, but players are not ordinarily eliminated.",
  },
  {
    legacyId: "38038",
    title: "UNO Flash",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [4, 2, 3, 2, 2.5, 3, 2, 2.5, 3, 3.5, 1],
    source: "https://service.mattel.com/instruction_sheets/m1002.pdf",
    evidence:
      "Electronic turn selection and timed responses replace ordinary turn order; matching remains central and slap events reward rapid response.",
    familyEvidence:
      "Matching is familiar but timed actions and unpredictable turn order raise attention and motor access demands.",
  },
  {
    legacyId: "16693",
    title: "UNO H2O",
    edition: "H3263 edition with Downpour",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2.5, 2, 2, 2, 3, 2.5, 1, 4, 3, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=H3263&siteid=27",
    evidence:
      "Waterproof components preserve UNO matching; Downpour adds shared draw penalties. Component waterproofing does not itself add dexterity or strategy.",
    familyEvidence:
      "Short symbol-matching turns with shared penalties; no ordinary elimination and little in-play reading.",
  },
  {
    legacyId: "455524",
    title: "Liar's UNO",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [3.5, 3, 2, 4.5, 2.5, 4, 2.5, 1, 3, 4, 1],
    source: "https://service.mattel.com/instruction_sheets/JLH43%20English.pdf",
    evidence:
      "Liar cards are played facedown with a declared identity; opponents may challenge; truth or bluff changes draw penalties. Hand swapping adds tactical uncertainty.",
    familyEvidence:
      "Recurring simple matching mixed with truth/challenge exceptions; bluffing is structurally required for some play choices, but elimination is not.",
  },
  {
    legacyId: "116593",
    title: "UNO Dice Game",
    edition: "2012 W5807 eleven-dice edition",
    players: [2],
    values: [4, 2.5, 2, 1.5, 2, 3, 2, 1, 4, 2.5, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=W5807&siteid=27",
    evidence:
      "Start with five dice, match color or number to shed dice, and draw and roll another die when unable to play; random faces strongly shape options.",
    familyEvidence:
      "Visible dice and simple matching reduce text burden; brief alternating turns and no elimination support access.",
  },
  {
    legacyId: "1258",
    title: "Phase 10",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [3.5, 3, 2.5, 1.5, 2.5, 3, 3, 1, 3, 2, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=W4729",
    evidence:
      "Draw and discard to assemble required sets, runs or colors; completed phases advance while failed ones repeat; hand management partly mitigates random deals.",
    familyEvidence:
      "Repeated rummy turns support learning; phase requirements, arithmetic and unequal progress can produce extended waits.",
  },
  {
    legacyId: "22664",
    title: "Phase 10 Masters Edition",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [3.5, 3.5, 2.5, 1.5, 3, 3.5, 3.5, 1, 2.5, 2, 1],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=W4731&siteid=27",
    evidence:
      "Choose a phase after the deal and save a card for a future hand; planning across rounds adds resource and timing choices to rummy sets.",
    familyEvidence:
      "Flexible phase choice helps recovery but saved-card handling and phase tracking increase processing beyond the original game.",
  },
  {
    legacyId: "38187",
    title: "Phase 10 Twist",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [4, 3, 2.5, 1.5, 3, 3.5, 3, 1, 2.5, 2.5, 2.5],
    source: "https://service.mattel.com/instruction_sheets/W4732-0920.pdf",
    evidence:
      "Board position determines phase; optional Twist phases trade backward movement risk for greater progress; sets and runs still govern hand play.",
    familyEvidence:
      "Familiar rummy tasks combine with board movement and risk/reward exceptions; failure can reverse progress and lengthen play.",
  },
  {
    legacyId: "2578",
    title: "Phase 10 Dice",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [4, 2.5, 2, 1, 2, 3, 2.5, 1, 3.5, 2, 1],
    source: "https://service.mattel.com/instruction_sheets/X6300-2L.pdf",
    evidence:
      "Roll ten dice to form ordered phases of sets, runs or color groups; keep or reroll for completion and higher scores; wilds score zero.",
    familyEvidence:
      "Visible dice and a recurring reroll loop reduce reading; phase reference and total arithmetic remain, with individual turns and no elimination.",
  },
  {
    legacyId: "1406",
    title: "Monopoly",
    edition: "Classic C1009; auctions and bankruptcy; no house-rule cash bonuses",
    players: [2, 3, 4, 5, 6, 7, 8],
    values: [4, 3, 1.5, 3.5, 2.5, 3, 3.5, 1, 2.5, 2.5, 2.5],
    source: "https://instructions.hasbro.com/en-in/instruction/monopoly-game",
    evidence:
      "Dice and event cards move players around properties; purchases, auctions, trades and building investment affect rent and bankruptcy.",
    familyEvidence:
      "Repeated turns are clear, but cash arithmetic, negotiation, bankruptcy elimination and long waits are participation barriers.",
  },
  {
    legacyId: "5048",
    title: "Candy Land",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [5, 1, 1, 1, 1, 1.5, 1, 1, 4.5, 2, 2],
    source: "https://instructions.hasbro.com/en-ca/instruction/candy-land-game",
    evidence:
      "Drawn color or picture cards prescribe movement; the race has no outcome-changing choices under standard rules.",
    familyEvidence:
      "Color matching requires little reading or arithmetic and there is no elimination, but turns offer no meaningful decisions.",
  },
  {
    legacyId: "1293",
    title: "Boggle",
    edition: "Classic 4x4 letter grid; three-minute rounds",
    players: [1, 2, 3, 4, 5, 6, 7, 8],
    values: [2, 2, 5, 1, 1.5, 4, 2, 1, 3, 2, 5],
    source: "https://instructions.hasbro.com/en-us/instruction/boggle-game",
    evidence:
      "A shaken letter grid supplies adjacent-letter words; simultaneous timed searching rewards recognition and vocabulary, and duplicate words do not score.",
    familyEvidence:
      "Everyone searches simultaneously; spelling, vocabulary and timed writing create substantial access differences.",
  },
  {
    legacyId: "320",
    title: "Scrabble",
    edition: "Classic English-language Scrabble",
    players: [2, 3, 4],
    values: [3, 4, 4, 1.5, 2.5, 4.5, 4, 1, 3, 1.5, 5],
    source: "https://instructions.hasbro.com/en-us/instruction/Scrabble-Game",
    evidence:
      "Random racks supply letters for connected words; premium squares, rack balance and limited board space create tactical allocation choices.",
    familyEvidence:
      "Word knowledge, spelling and score arithmetic are required; turn waiting and difficult racks can limit participation.",
  },
  {
    legacyId: "811",
    title: "Rummikub",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3, 3.5, 3, 1, 2, 4, 3.5, 1, 4, 1.5, 2],
    source: "https://rummikub.com/rules/",
    evidence:
      "Number tiles form runs and groups; players may rearrange valid table melds and use jokers while trying to empty a random rack.",
    familyEvidence:
      "Repeated number and color patterns support simple turns; table rearrangements and the initial meld threshold add demands.",
  },
  {
    legacyId: "25669",
    title: "Qwirkle",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3, 3, 2.5, 1, 1.5, 3.5, 3, 1, 4.5, 1.5, 5],
    source:
      "https://www.mindware.orientaltrading.com/qwirkle-tile-matching-game-award-winning-strategy-game-for-family-game-night-a2-32016.fltr",
    evidence:
      "Drawn tiles extend lines sharing color or shape without duplicates; completing six-tile lines earns bonuses.",
    familyEvidence:
      "No reading is needed; visible matching and short repeated turns support participation, with basic scoring arithmetic.",
  },
  {
    legacyId: "2453",
    title: "Blokus",
    edition: "Classic four-color Blokus; standard player-count arrangements",
    players: [2, 3, 4],
    values: [1, 4, 3, 1, 1.5, 4, 4, 1, 4, 1.5, 5],
    source: "https://service.mattel.com/instruction_sheets/CMC08-Eng.pdf",
    evidence:
      "Each color has a fixed set of polyominoes; new pieces must touch their own color at corners but not edges, competing for board access.",
    familyEvidence:
      "Rules are brief and language-light; visual rotation and irreversible blocking can leave players unable to place late in play.",
  },
  {
    legacyId: "2083",
    title: "Yahtzee",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2.5, 1.5, 1, 2, 3, 3, 1, 4, 2.5, 1],
    source: "https://instructions.hasbro.com/en-us/instruction/yahtzee",
    evidence:
      "Up to three dice rolls per turn allow keeping and rerolling; each of thirteen score categories can be filled once.",
    familyEvidence:
      "Repeated roll-and-record turns are straightforward; score calculations and waiting remain, with everyone playing all rounds.",
  },
  {
    legacyId: "1410",
    title: "Pictionary",
    edition: "DKD47 classic team drawing rules",
    players: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    values: [2.5, 2, 4.5, 4.5, 2, 4, 1.5, 3, 3.5, 5, 1.5],
    source: "https://m.service.mattel.com/us/Technical/productDetail?prodno=DKD47&siteid=27",
    evidence:
      "Players sketch randomly supplied prompts under time pressure for teammates to identify; drawing accuracy and shared interpretation drive progress.",
    familyEvidence:
      "Team guessing includes multiple players, but vocabulary, drawing and time pressure affect access.",
  },
  {
    legacyId: "4118",
    title: "The Game of Life",
    edition: "E4304 edition with pets; 2–4 players",
    players: [2, 3, 4],
    values: [4, 2, 1, 1.5, 2, 2.5, 2.5, 1, 3.5, 2.5, 2.5],
    source: "https://instructions.hasbro.com/en-us/instruction/the-game-of-life-game",
    evidence:
      "A spinner advances players through career, family and financial events; route and investment choices interact with random income and expenses.",
    familyEvidence:
      "A clear route supports turns, but money calculations, event reading and waits add burden.",
  },
  {
    legacyId: "4112",
    title: "Sequence",
    edition: "Sequence Classic; individual or evenly divided 2/3 teams",
    players: [2, 3, 4, 6, 8, 9, 10, 12],
    values: [3, 3, 2, 2, 1.5, 3.5, 2.5, 1, 4, 2, 5],
    source:
      "https://www.jeux-goliath.com/pdf/3/919752.0-10-V08-2204-SequenceClassic_IM_OL-compressed.pdf",
    evidence:
      "Cards place chips on matching board spaces; jacks add or remove chips, and connected five-chip lines win. Teams cannot freely coach each move.",
    familyEvidence:
      "Short card-to-board turns and no elimination support participation; valid team sizes and remembering to draw are exceptions.",
  },
  {
    legacyId: "199561",
    title: "Sagrada",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [3, 3.5, 2.5, 1, 2.5, 4, 3.5, 1, 3.5, 1, 5],
    source: "https://media.floodgate.games/rule-books/Sagrada-Rule-Book.pdf",
    evidence:
      "Drafted dice must satisfy window color/value restrictions and adjacency rules; tools spend favor tokens and public/private goals reward patterns.",
    familyEvidence:
      "Compact turns are readable but simultaneous color, number and adjacency constraints create recurring cognitive demands.",
  },
  {
    legacyId: "263918",
    title: "Cartographers",
    edition: "Base game; standard competitive maps",
    players: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
      50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
      73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
      96, 97, 98, 99, 100,
    ],
    values: [3, 3.5, 2.5, 1.5, 2, 4, 3, 1, 4, 1.5, 5],
    source: "https://thunderworksgames.com/products/cartographers-board-game",
    evidence:
      "Shared exploration cards supply terrain shapes for personal maps; changing seasonal scoring and ambush placement alter spatial priorities.",
    familyEvidence:
      "Everyone draws on the same reveals without elimination; map marking and scoring conditions require attention.",
  },
  {
    legacyId: "157969",
    title: "Sheriff of Nottingham",
    edition:
      "Second edition core merchant/sheriff rules; no deputies, black market or extra modules",
    players: [3, 4, 5],
    values: [3, 3, 2, 5, 2.5, 4, 3, 1, 3, 5, 1],
    source: "https://www.cmon.com/wp-content/uploads/2023/06/Rulebook.pdf",
    evidence:
      "Merchants declare bag contents while a rotating sheriff negotiates bribes or inspects; legal goods, contraband and penalties create bluffing tradeoffs.",
    familyEvidence:
      "Roles rotate and everyone stays in, but deception, negotiation and money accounting create participation demands.",
  },
  {
    legacyId: "156129",
    title: "Deception: Murder in Hong Kong",
    edition: "Base game; standard rules; no expansions",
    players: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    values: [2.5, 3, 3, 5, 2.5, 4, 2, 1, 3, 4.5, 1],
    source: "https://greyfoxgames.com/products/deception-murder-in-hong-kong",
    evidence:
      "A hidden murderer selects weapon and evidence; the forensic scientist uses restricted clue tiles while investigators discuss and accuse.",
    familyEvidence:
      "Discussion is continuous but abstract clue interpretation and unequal roles create demands; mature theme remains a separate content constraint.",
  },
  {
    legacyId: "266083",
    title: "The Isle of Cats",
    edition: "Standard game, not the separate simplified Family mode",
    players: [1, 2, 3, 4],
    values: [2.5, 4, 2.5, 1, 3, 4, 4, 1, 3, 1.5, 5],
    source: "https://thecityofkings.com/games/the-isle-of-cats/how-to-play/",
    evidence:
      "Drafted cards cost fish to keep; baskets and fish rescue polyomino cats for a boat, with lessons and family groupings shaping placement.",
    familyEvidence:
      "Several card, currency and placement procedures interact; no elimination, but drafting and scoring require reading and planning.",
  },
  {
    legacyId: "281555",
    title: "The King Is Dead: Second Edition",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2, 4.5, 2, 2.5, 2.5, 4.5, 4.5, 1, 3, 1.5, 4.5],
    source: "https://www.ospreypublishing.com/media/3yxddtqg/tkid2_rulebook.pdf",
    evidence:
      "Eight action cards govern shifting faction control; taking a follower increases personal influence while removing that faction strength from the board.",
    familyEvidence:
      "Few actions and no elimination keep play compact, but indirect control and irreversible card use demand careful interpretation.",
  },
  {
    legacyId: "169255",
    title: "The Grizzled",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3.5, 3, 2, 3.5, 2.5, 4, 3, 1, 3, 2.5, 1],
    source: "https://www.cmon.com/wp-content/uploads/2023/06/The-Grizzled-Rulebook-US.pdf",
    evidence:
      "Hidden hands add shared threats; repeated threat symbols lose missions, while withdrawal, support and hard knocks constrain cooperative survival.",
    familyEvidence:
      "Shared goals encourage involvement, but restricted communication, persistent penalties and difficult recovery can limit access.",
  },
  {
    legacyId: "233078-short",
    title: "Dune (2019)",
    edition: "Gale Force Nine 2019; basic game with standard alliances; no expansions",
    players: [3, 4, 5, 6],
    values: [3, 5, 2.5, 4.5, 4, 4.5, 4.5, 1, 2, 3.5, 4.5],
    source: "https://www.gf9games.com/dunegame/wp-content/uploads/Dune-Rulebook.pdf",
    evidence:
      "Asymmetric factions bid for treachery cards, harvest spice and contest strongholds through hidden battle plans, traitors and alliances.",
    familyEvidence:
      "Faction exceptions, negotiation and costly losses create substantial learning and recovery burdens.",
  },
  {
    legacyId: "164153",
    title: "Star Realms",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [3, 3.5, 2, 1, 2, 4, 3.5, 1, 3.5, 1.5, 1],
    source: "https://www.starrealms.com/learn-to-play",
    evidence:
      "Buy from a random trade row to build a deck; faction combinations generate trade and combat that attacks bases or opposing authority.",
    familyEvidence:
      "Repeated draw/play/buy turns are compact, but card effects need reading and a weakening position can compound.",
  },
  {
    legacyId: "385565",
    title: "Faraway",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5, 6],
    values: [3, 3.5, 2, 1, 2, 4, 3, 1, 3.5, 1, 4],
    source: "https://pandasaurusgames.com/products/faraway?c=all",
    evidence:
      "Eight played region cards score in reverse order; later cards and sanctuaries must satisfy earlier reward conditions.",
    familyEvidence:
      "Simultaneous selection reduces waiting, but reverse scoring and symbol requirements add a conceptual hurdle.",
  },
  {
    legacyId: "359871",
    title: "The White Castle",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4.5, 2, 1, 3.5, 4, 4.5, 1, 2.5, 1, 3],
    source: "https://devirgames.com/presentation-the-white-castle",
    evidence:
      "Nine turns use drafted bridge dice to trigger castle, garden and training actions; die values alter payment and action chains.",
    familyEvidence:
      "Few turns still involve layered iconography, resource conversions and substantial consequences for inefficient actions.",
  },
  {
    legacyId: "295947",
    title: "So Clover!",
    edition: "Base game; standard rules; no expansions",
    players: [3, 4, 5, 6],
    values: [2.5, 2.5, 3.5, 4.5, 1.5, 4.5, 1.5, 1, 4, 5, 3.5],
    source: "https://www.rprod.com/en/games/so-clover",
    evidence:
      "Players write clues connecting adjacent keyword pairs, then teammates reconstruct the arrangement using those clues.",
    familyEvidence:
      "All prepare clues and collaborate without elimination; vocabulary and abstraction are the main participation demands.",
  },
  {
    legacyId: "291453",
    title: "Fun Facts",
    edition: "Base game; standard rules; no expansions",
    players: [4, 5, 6, 7, 8],
    values: [2, 1.5, 2, 5, 1, 4, 1, 1, 4.5, 5, 1],
    source: "https://www.rprod.com/index.php/en/games/fun-facts",
    evidence:
      "Players answer personal prompts secretly with numbers and predict relative order; the team scores correct ascending arrangements.",
    familyEvidence:
      "Simple simultaneous answers and shared reveals minimize waiting; comfort answering a prompt varies and is not a child-ability prediction.",
  },
  {
    legacyId: "177678",
    title: "Ice Cool",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [1.5, 2.5, 5, 2, 1.5, 4, 2, 5, 4, 4, 5],
    source: "https://brain-games.com/products/icecool-kids-board-game",
    evidence:
      "Flicked penguins travel through doorways for fish while a catcher pursues runners; shots can curve or jump.",
    familyEvidence:
      "Brief rules and rotating roles support participation, but motor precision and turn waiting affect access.",
  },
  {
    legacyId: "21790",
    title: "Crokinole",
    edition: "Standard singles or doubles; tournament-style contact rule",
    players: [2, 4],
    values: [1, 3, 5, 1.5, 1.5, 4.5, 2, 5, 4, 2.5, 5],
    source: "https://www.worldcrokinole.com/thegame.html",
    evidence:
      "Finger-flicked discs must contact opposing discs when present; rebounds, pegs, scoring rings and the center hole determine shot value.",
    familyEvidence:
      "Repeated shots and short rounds support involvement; precise motor execution is essential.",
  },
  {
    legacyId: "21790-pitch",
    title: "PitchCar",
    edition: "Base track set; standard race rules; no expansion obstacles",
    players: [2, 3, 4, 5, 6, 7, 8],
    values: [1, 2.5, 5, 1.5, 1.5, 4, 1.5, 5, 4, 3.5, 5],
    source: "https://en.ferti-games.com/pitchcar",
    evidence:
      "Players flick wooden cars around a modular racetrack, controlling angle and force to negotiate curves and opponents.",
    familyEvidence:
      "Simple recurring turns and visible goals reduce rules burden; physical precision and waiting remain.",
  },
  {
    legacyId: "1269",
    title: "Stockpile",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3, 4, 2, 3, 2.5, 4, 4, 1, 3, 2.5, 1],
    source: "https://www.nauvoogames.com/stockpile",
    evidence:
      "Private market forecasts inform bidding for mixed stock piles; buying, selling and price movement reward timing and inference.",
    familyEvidence:
      "Money calculations, hidden information and bidding add demands, while everyone remains involved throughout rounds.",
  },
  {
    legacyId: "175921",
    title: "Food Chain Magnate",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [1.5, 5, 2, 1.5, 4, 4.5, 5, 1, 1.5, 1, 4.5],
    source: "https://www.splottershop.com/products/food-chain-magnate",
    evidence:
      "Recruiting and training staff creates production, marketing and delivery capacity; salaries, prices and map demand interact in a competitive economy.",
    familyEvidence:
      "Multiple systems and sharp economic lockouts make recovery and independent participation demanding; no suitability guarantee is inferred.",
  },
  {
    legacyId: "37111",
    title: "Battlestar Galactica",
    edition: "Base game only; 3–6 players",
    players: [3, 4, 5, 6],
    values: [3.5, 4, 2.5, 5, 4, 4.5, 4, 1, 2, 4, 3],
    source:
      "https://images-cdn.fantasyflightgames.com/ffg_content/Battlestar_Galactica/bsg-rulebook-web.pdf",
    evidence:
      "Hidden loyalties interact with cooperative crisis checks, ship locations and scarce fleet resources; sabotage and accusation affect joint decisions.",
    familyEvidence:
      "Asymmetric roles, secrecy, crisis exceptions and lengthy turns create substantial participation burden.",
  },
  {
    legacyId: "414317",
    title: "Harmonies",
    edition: "Base game without Nature Spirits",
    players: [1, 2, 3, 4],
    values: [2.5, 3.5, 2.5, 1, 2, 4, 3.5, 1, 4, 1, 5],
    source:
      "https://cdn.svc.asmodee.net/production-libellud/uploads/2024/12/HARMONIES_Rules_EN.pdf",
    evidence:
      "Drafted token groups build three-dimensional landscapes; animal cards require particular arrangements and heights for habitat points.",
    familyEvidence:
      "Language-light patterns and short turns support access; scoring patterns and stacked heights require spatial attention.",
  },
  {
    legacyId: "324856",
    title: "SCOUT",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3, 3.5, 2.5, 2, 2, 4, 3, 1, 3.5, 2, 4],
    source: "https://oinkgames.com/en/games/analog/scout/",
    evidence:
      "Hands cannot be reordered; adjacent runs or sets beat the table, while scouting takes an exposed card to insert into a useful hand position.",
    familyEvidence:
      "Short turns and number patterns are approachable, but fixed hand order and trick-strength rules need care.",
  },
  {
    legacyId: "367220",
    title: "Sea Salt & Paper",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3.5, 3, 2, 2.5, 2, 4, 3, 1, 3.5, 2.5, 1],
    source: "https://studiobombyx.com/assets/SSAP_rulebook_EN-3.pdf",
    evidence:
      "Drawn cards form scoring sets and effect pairs; reaching seven points allows stopping safely or risking a final comparison against opponents.",
    familyEvidence:
      "Compact turns and no elimination support access, with multiple pair effects and end-round arithmetic to learn.",
  },
  {
    legacyId: "98778",
    title: "Hanabi",
    edition: "Base five-color game; standard restricted communication",
    players: [2, 3, 4, 5],
    values: [3, 3.5, 4, 4, 2, 4, 4, 1, 3.5, 2.5, 1],
    source: "https://rnrgames.com/hanabi",
    evidence:
      "Players see others’ cards but not their own; limited clues, discards and risky plays assemble ascending color sequences with a shared fuse limit.",
    familyEvidence:
      "Cooperation includes everyone, but remembering clues and respecting restricted communication are central demands.",
  },
  {
    legacyId: "68448",
    title: "7 Wonders",
    edition: "Second edition base game; 3–7 players",
    players: [3, 4, 5, 6, 7],
    values: [2.5, 4, 2, 1.5, 2.5, 4.5, 4, 1, 3.5, 1.5, 2],
    source: "https://www.rprod.com/en/games/7-wonders",
    evidence:
      "Simultaneous drafting across three ages builds production, commerce, science and military; limited picks and neighboring competition create linked tradeoffs.",
    familyEvidence:
      "Simultaneous play avoids long waits, but symbols, construction costs and multiple scoring systems need learning.",
  },
  {
    legacyId: "173346",
    title: "7 Wonders Duel",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [2.5, 4.5, 2, 1.5, 3, 4.5, 4, 1, 3, 1.5, 3.5],
    source: "https://www.rprod.com/en/games/7-wonders-duel",
    evidence:
      "Accessible cards are taken from layered arrangements; construction, wonders and military or scientific instant wins compete with point scoring.",
    familyEvidence:
      "Alternating turns are compact, but several victory threats, resources and exceptions demand ongoing tracking.",
  },
  {
    legacyId: "167791",
    title: "Terraforming Mars",
    edition: "Base game; standard corporations and projects; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [3, 4.5, 2, 1.5, 3.5, 4.5, 4.5, 1, 2.5, 1, 3.5],
    source: "https://fryxgames.se/product/terraforming-mars/",
    evidence:
      "Project cards build production engines while players spend resources to raise global parameters and place terrain; milestones and awards add competing priorities.",
    familyEvidence:
      "Card text, resource production, prerequisites and long engine sequences create learning demands without player elimination.",
  },
  {
    legacyId: "31260",
    title: "Agricola",
    edition: "Original 2007 edition, standard occupation/improvement game",
    players: [1, 2, 3, 4, 5],
    values: [2, 4.5, 2, 1, 3.5, 4.5, 5, 1, 2.5, 1, 3.5],
    source: "https://www.lookout-spiele.de/en/games/agricola.html",
    evidence:
      "Family workers claim exclusive actions to build rooms, grow crops and raise animals; recurring feeding and occupation/improvement cards constrain farm development.",
    familyEvidence:
      "Multiple resource and harvest procedures plus food penalties make recovery demanding; all players remain in the game.",
  },
  {
    legacyId: "50",
    title: "Lost Cities",
    edition: "Card game; standard five expeditions, excluding sixth-expedition variant",
    players: [2],
    values: [3, 3.5, 2, 1, 1.5, 4, 3.5, 1, 4, 1.5, 2],
    source:
      "https://thamesandkosmos.com/collections/2-player/products/lost-cities-card-game-with-6th-expedition",
    evidence:
      "Expedition cards must increase in value; starting costs and wager multipliers make committing limited hand cards consequential.",
    familyEvidence:
      "Simple play-one/draw-one turns keep waiting low; negative scores and multipliers need arithmetic.",
  },
  {
    legacyId: "54043",
    title: "Jaipur",
    edition: "Base game; standard rules; no expansions",
    players: [2],
    values: [3, 3.5, 2, 1.5, 2, 4, 3.5, 1, 4, 1.5, 1],
    source: "https://www.spacecowboys-games.com/game/jaipur/",
    evidence:
      "A shared market allows taking, exchanging or selling goods; early sales earn better tokens while larger sets earn bonuses and camels enable trades.",
    familyEvidence:
      "Short turns and visible goods support participation; hand limits, bonus scoring and exchange rules add modest demands.",
  },
  {
    legacyId: "287954",
    title: "Azul: Summer Pavilion",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2.5, 3.5, 2.5, 1, 2.5, 4, 3.5, 1, 3.5, 1, 5],
    source:
      "https://cdn.svc.asmodee.net/production-nextmove/uploads/sites/4/2024/06/EN-Azul-SP-Rules-2019-12-16_compressed.pdf",
    evidence:
      "Players draft colored tiles and spend sets to fill numbered star spaces; changing wild colors and surrounding bonus spaces reward placement timing.",
    familyEvidence:
      "Language-light drafting supports access, but separate placement costs, wild colors and bonuses add rules beyond original Azul.",
  },
  {
    legacyId: "291572",
    title: "Wonderland's War",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3.5, 4, 2, 3, 3.5, 4.5, 4, 1, 2.5, 3, 4],
    source:
      "https://board-game-rules.com/wp-content/uploads/2025/01/wonderlands-war_Official-Rules.pdf",
    evidence:
      "Tea-party recruitment builds chip bags and regional presence; battles draw chips under bust risk, with faction powers and wagering affecting control.",
    familyEvidence:
      "Bag-building, asymmetric powers and battle stages create substantial learning demands; setbacks are recoverable across rounds.",
  },
  {
    legacyId: "41",
    title: "Can't Stop",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [4, 2.5, 1, 1.5, 1.5, 3.5, 2, 1, 4.5, 3.5, 2.5],
    source: "https://www.eagle-gryphon.com/collections/20-off-sale/products/cant-stop-1",
    evidence:
      "Four dice form two pairs; progress occupies at most three columns per turn, and continuing risks losing unbanked movement.",
    familyEvidence:
      "Brief repeated roll/choose/stop turns and no elimination support access; basic addition is required.",
  },
  {
    legacyId: "244049",
    title: "The Mind Extreme",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3.5, 2, 4, 4, 2, 3.5, 2, 1, 3.5, 4, 1],
    source: "https://pandasaurusgames.com/blogs/news/stocking-stuffers-for-the-season",
    evidence:
      "Two number decks must be played silently in opposite orders, with blind play adding uncertainty to timing and interpersonal coordination.",
    familyEvidence:
      "Few procedures and shared attempts support access, but silent timing and blind rounds impose substantial execution demands.",
  },
  {
    legacyId: "13-junior",
    title: "Outfoxed!",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3.5, 2.5, 3, 3.5, 1.5, 3.5, 2, 1, 4.5, 2.5, 3.5],
    source: "https://gamewright.com/pdfs/Rules/OutFoxed-Rules-English.pdf",
    evidence:
      "Dice authorize revealing suspects or moving to clues; decoder evidence eliminates suspects before the fox reaches its escape.",
    familyEvidence:
      "Visible clues, shared decisions and a small recurring action set support participation; remembering evidence and comparing features matter.",
  },
  {
    legacyId: "65244",
    title: "Forbidden Island",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [3.5, 3.5, 2, 4, 2, 4, 3.5, 1, 4, 2.5, 4.5],
    source: "https://gamewright.com/pdfs/Rules/ForbiddenIslandTM-RULES.pdf",
    evidence:
      "Limited actions move, shore up, transfer cards and collect treasures; flood draws threaten terrain and escape while role powers change options.",
    familyEvidence:
      "Open cooperation and few actions support shared turns; hand limits, role exceptions and irreversible tile loss add demands.",
  },
  {
    legacyId: "65200",
    title: "Forbidden Desert",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3.5, 3.5, 2, 4, 2.5, 4, 4, 1, 3.5, 2.5, 4.5],
    source: "https://gamewright.com/pdfs/Rules/ForbiddenDesertTM-RULES.pdf",
    evidence:
      "Action points remove sand, excavate and collect parts; storm cards shift tiles, while scarce water and equipment constrain coordinated escape.",
    familyEvidence:
      "Cooperation supports participation but water, burial, shifting clues and roles require several interacting procedures.",
  },
  {
    legacyId: "41114",
    title: "Sleeping Queens",
    edition: "Original twelve-queen game; catalog identity collision must remain isolated",
    players: [2, 3, 4, 5],
    values: [4, 2, 2, 2, 1.5, 3, 2, 1, 4.5, 3, 1],
    source: "https://www.gamewright.com/product/Sleeping-Queens",
    evidence:
      "Kings wake queens, knights steal them, potions send them back and defensive cards counter attacks; number combinations cycle the hand.",
    familyEvidence:
      "Short turns, simple arithmetic and chances to recover stolen queens support participation without elimination.",
  },
  {
    legacyId: "266810",
    title: "Paladins of the West Kingdom",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4.5, 2, 1, 4, 4.5, 5, 1, 2, 1, 2],
    source: "https://www.garphill.com/products/paladins-of-the-west-kingdom",
    evidence:
      "Paladins and worker colors enable actions whose strength depends on developing attributes; recruitment, fortification and conversion compete for resources over seven rounds.",
    familyEvidence:
      "Many worker requirements, tracks and card effects create substantial ongoing rules and planning demands.",
  },
  {
    legacyId: "199792-bellfaire",
    title: "The Search for Planet X",
    edition: "Base game, standard 12-sector mode",
    players: [1, 2, 3, 4],
    values: [2, 4, 4, 1.5, 3, 4.5, 3.5, 1, 3, 1, 4],
    source: "https://renegadegamestudios.com/the-search-for-planet-x/",
    evidence:
      "Players survey sectors, research constraints and publish theories to locate hidden celestial objects; information actions consume different amounts of time.",
    familyEvidence:
      "Deduction notes and logical exclusions demand sustained attention; adjustable starting information can support mixed experience.",
  },
  {
    legacyId: "188834",
    title: "Secret Hitler",
    edition: "Base game; standard rules; no expansions",
    players: [5, 6, 7, 8, 9, 10],
    values: [3.5, 3.5, 2.5, 5, 2.5, 4.5, 2, 1, 2.5, 5, 1],
    source: "https://www.secrethitler.com/",
    evidence:
      "Secret teams elect governments whose policy draws and claims may hide sabotage; trust, voting and executive powers determine victory.",
    familyEvidence:
      "Discussion involves the group, but deception, role knowledge and executions create access and exclusion costs; content filtering remains separate.",
  },
  {
    legacyId: "172225",
    title: "Exploding Kittens",
    edition: "Original edition; no expansions or party pack",
    players: [2, 3, 4, 5],
    values: [4, 2.5, 2, 2.5, 1.5, 3.5, 3, 1, 3.5, 4, 1],
    source: "https://www.explodingkittens.com/pages/how-to-play-exploding-kittens",
    evidence:
      "Drawing an exploding kitten eliminates a player without a defuse; action cards inspect, reorder, skip or redirect dangerous draws.",
    familyEvidence:
      "Short repeated turns and simple card actions help access, but reading and early elimination can leave players waiting.",
  },
  {
    legacyId: "262543",
    title: "Wavelength",
    edition: "Base tabletop game, standard teams; cooperative rules for small groups",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    values: [2.5, 2, 3, 5, 1.5, 4.5, 1, 1, 4, 5, 1],
    source: "https://www.cmyk.games/products/wavelength",
    evidence:
      "A clue giver interprets a hidden target on a conceptual spectrum; teammates discuss a clue and place a dial to estimate that target.",
    familyEvidence:
      "Broad discussion and simple turn structure support participation; abstract vocabulary and differing associations are the main demands.",
  },
  {
    legacyId: "1111",
    title: "Taboo",
    edition: "Base game; standard rules; no expansions",
    players: [4, 5, 6, 7, 8, 9, 10],
    values: [2.5, 2.5, 4.5, 5, 1.5, 4, 1.5, 1, 3, 5, 1],
    source: "https://instructions.hasbro.com/en-us/instruction/taboo-game",
    evidence:
      "Timed spoken clues must avoid listed forbidden words while teammates guess; opponents monitor violations.",
    familyEvidence:
      "Teams stay involved, but reading, vocabulary, speech and time pressure create substantial execution demands.",
  },
  {
    legacyId: "2653",
    title: "Survive: Escape from Atlantis!",
    edition: "Stronghold base game; no dolphin or dive-dice expansions",
    players: [2, 3, 4],
    values: [3.5, 3, 2.5, 2.5, 2.5, 4, 3, 1, 3, 3.5, 4.5],
    source: "https://cdn.1j1ju.com/medias/5f/a3/bd-survive-escape-from-atlantis-rulebook.pdf",
    evidence:
      "Explorers escape a shrinking island using shared boats; concealed explorer values, tile events and controlled sea creatures affect whom to rescue or attack.",
    familyEvidence:
      "Visible movement is accessible, but remembered values, attack effects and irreversible explorer loss create demands.",
  },
  {
    legacyId: "3076",
    title: "Puerto Rico",
    edition: "Original base game; 3–5 players; no expansions",
    players: [3, 4, 5],
    values: [1.5, 4.5, 2, 1.5, 3, 4.5, 5, 1, 2.5, 1, 2],
    source: "https://cdn.1j1ju.com/medias/46/0f/5c-puerto-rico-rulebook.pdf",
    evidence:
      "Chosen roles give all players actions with a chooser privilege; production, trading, shipping and building compete for workers, goods and limited capacity.",
    familyEvidence:
      "Recurring phases are predictable, but interdependent production and shipping exceptions create sustained procedural demands.",
  },
  {
    legacyId: "31260-revised",
    title: "Agricola: All Creatures Big and Small",
    edition: "Original base two-player game; no additional building expansions",
    players: [2],
    values: [1, 4, 2, 1, 2.5, 4, 4.5, 1, 3.5, 1, 4],
    source: "https://www.lookout-spiele.de/en/games/acbas.html",
    evidence:
      "Workers claim materials, animals and construction actions; fences and buildings provide capacity for breeding livestock on a small farm.",
    familyEvidence:
      "Two-player alternating actions avoid long waits; enclosure capacity and breeding require recurring rules and counting.",
  },
  {
    legacyId: "1294",
    title: "Clue",
    edition: "Classic mansion rules; no Boardwalk side or bonus-card variant",
    players: [3, 4, 5, 6],
    values: [3, 3.5, 4, 2, 2, 4, 2, 1, 3.5, 2.5, 3],
    source: "https://instructions.hasbro.com/en-us/instruction/Clue-Game-Classic",
    evidence:
      "Players move between rooms and make suggestions to elicit privately shown cards, narrowing the hidden suspect, weapon and room combination.",
    familyEvidence:
      "Repeated suggestions are clear, but deduction notes, reading and failed-accusation exclusion add participation demands.",
  },
  {
    legacyId: "3931",
    title: "Connect Four",
    edition: "Classic drop-only Connect Four",
    players: [2],
    values: [1, 4, 2, 1, 1.5, 4, 2.5, 1, 4.5, 1.5, 5],
    source: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
    evidence:
      "Alternating discs fall to the lowest open cell; four connected discs win, so threats and forced replies depend entirely on positions.",
    familyEvidence:
      "One simple repeated move, no reading and a short shared endpoint support participation.",
  },
  {
    legacyId: "2452",
    title: "Jenga",
    edition: "Classic wooden tower, one-hand standard rules; practical app count range 1–13",
    players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    values: [1.5, 2, 5, 1.5, 1.5, 4, 2, 5, 4.5, 4, 5],
    source: "https://www.hasbro.com/common/instruct/jenga.pdf",
    evidence:
      "Players remove a block below the top completed layer and place it on top; touch-testing and structural stability determine collapse risk.",
    familyEvidence:
      "Brief rules and visible consequences help participation, but careful motor control is essential; everyone waits between turns.",
  },
  {
    legacyId: "8110",
    title: "Left Right Center",
    edition: "Standard L/C/R dice and tokens; no Wild variant or money required",
    players: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    values: [5, 1, 1, 1, 1, 1.5, 1, 1, 4.5, 3.5, 1],
    source: "https://rnkgaming.com/wp-content/uploads/2022/07/Left-Center-Right-Rules.pdf",
    evidence:
      "Dice prescribe passing chips left, right or centrally; no player choice changes the outcome, and a player with zero chips can receive more.",
    familyEvidence:
      "Minimal counting and no permanent elimination support participation, although a player may wait several turns without chips.",
  },
  {
    legacyId: "181304",
    title: "Mysterium",
    edition: "Base Mysterium, cooperative vision-card investigation",
    players: [2, 3, 4, 5, 6, 7],
    values: [3, 2.5, 3.5, 4.5, 2.5, 4, 2, 1, 3.5, 4.5, 1],
    source: "https://www.libellud.com/en/our-games/mysterium/",
    evidence:
      "A silent ghost distributes surreal vision cards that psychics interpret cooperatively to identify suspects, locations and objects within seven rounds.",
    familyEvidence:
      "Shared interpretation keeps players involved; abstract imagery and distinct ghost procedures add learning demands.",
  },
  {
    legacyId: "198773",
    title: "Codenames: Pictures",
    edition: "Standard two-team game; 4–8 players within app range",
    players: [4, 5, 6, 7, 8],
    values: [2, 3, 3.5, 4.5, 1.5, 4.5, 2, 1, 4, 5, 1.5],
    source: "https://czechgames.com/files/rules/codenames-pictures-rules-en.pdf",
    evidence:
      "Spymasters connect multiple pictures with restricted clues; teammates discuss selections while avoiding opposing agents and the assassin.",
    familyEvidence:
      "Pictures reduce reading demands and teams collaborate, but clue abstraction and spymaster waiting still matter.",
  },
  {
    legacyId: "217372",
    title: "The Quest for El Dorado",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4],
    values: [2.5, 4, 2, 1, 2.5, 4.5, 4, 1, 3.5, 1.5, 5],
    source: "https://cdn.1j1ju.com/medias/fc/6a/fa-the-quest-for-el-dorado-rulebook.pdf",
    evidence:
      "Deck cards pay terrain movement or buy improved expedition cards; map routes, blocking and deck thinning shape a race to the finish.",
    familyEvidence:
      "A clear race goal supports access, but terrain requirements and using cards for different purposes add procedural demands.",
  },
  {
    legacyId: "366161",
    title: "Forest Shuffle",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3, 4, 2, 1, 2.5, 4, 4, 1, 3, 1, 3],
    source: "https://www.lookout-spiele.de/en/games/forrestshuffle.html",
    evidence:
      "Cards establish trees and attach species to available sides; paying with other cards and collecting interacting species creates scoring combinations.",
    familyEvidence:
      "Draw-or-play turns are compact, but many scoring effects and species combinations require reading and calculation.",
  },
  {
    legacyId: "3955",
    title: "Pandemic: Hot Zone — North America",
    edition: "North America base game, standard difficulty; no mixed-region modules",
    players: [2, 3, 4],
    values: [3.5, 3.5, 2, 4, 2, 3.5, 3.5, 1, 4, 2.5, 4],
    source: "https://www.zmangames.com/game/pandemic-hot-zone-north-america/",
    evidence:
      "Players coordinate movement, treatment and card collection to cure three diseases before spreading infections and outbreaks exhaust shared limits.",
    familyEvidence:
      "Open cooperation, fewer diseases and a compact map support shared participation; role abilities and outbreak rules still need learning.",
  },
  {
    legacyId: "266810-architects",
    title: "Architects of the West Kingdom",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [2.5, 4, 2, 2, 3, 4, 4, 1, 3, 1.5, 2],
    source: "https://www.garphill.com/products/architects-of-the-west-kingdom",
    evidence:
      "Repeated worker placement increases returns but exposes groups to capture; resources, apprentices and virtue constrain building and cathedral progress.",
    familyEvidence:
      "A recurring place-one-worker turn supports access, but capture, virtue and building effects require several systems to be learned.",
  },
  {
    legacyId: "266192-asia",
    title: "Apiary",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [2.5, 4, 2, 1, 3, 4.5, 4, 1, 3, 1, 3],
    source: "https://store.stonemaiergames.com/products/apiary",
    evidence:
      "Worker bees develop hive technologies, collect resources and explore; their limited working lifespan creates timing decisions before hibernation.",
    familyEvidence:
      "Recurring worker actions avoid elimination, but faction effects, worker strength and resource conversions create ongoing rules demands.",
  },
  {
    legacyId: "209418",
    title: "Rhino Hero",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [2, 2, 5, 1.5, 1.5, 3.5, 1.5, 5, 4.5, 4, 5],
    source:
      "https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2024/10/4789-rhino-hero-instructions-6s.pdf",
    evidence:
      "Wall and roof cards build a shared tower; action symbols change turn order or move the heavy rhino, and collapse ends play.",
    familyEvidence:
      "Short rules and visible building tasks support participation; balance and precise placement remain essential.",
  },
  {
    legacyId: "204583",
    title: "Kingdomino",
    edition: "Base 5x5 kingdom rules",
    players: [2, 3, 4],
    values: [2.5, 3, 2, 1, 1.5, 4, 3, 1, 4.5, 1, 5],
    source: "https://www.blueorangegames.com/games/king-domino",
    evidence:
      "Drafting a stronger domino changes next-turn pick order; matching terrain fills a bounded kingdom and crowns multiply connected area values.",
    familyEvidence:
      "Language-light matching and brief turns support participation; area-by-crown multiplication is needed at scoring.",
  },
  {
    legacyId: "410201",
    title: "Wyrmspan",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4, 5],
    values: [3, 4, 2, 1, 3.5, 4.5, 4, 1, 2.5, 1, 3],
    source: "https://store.stonemaiergames.com/products/wyrmspan",
    evidence:
      "Excavating cave spaces enables dragon placement and chained abilities; resource and action spending develop a sanctuary and guild rewards.",
    familyEvidence:
      "Several card and cave procedures plus long effect chains create reading and tracking demands without elimination.",
  },
  {
    legacyId: "63268",
    title: "Spot It!",
    edition: "Classic symbols; The Tower mini-game baseline",
    players: [2, 3, 4, 5, 6, 7, 8],
    values: [2, 1.5, 5, 2, 1, 4, 1, 2, 4, 4, 1],
    source: "https://upload.snakesandlattes.com/rules/s/Spotit.pdf",
    evidence:
      "Every card pair shares exactly one symbol; simultaneous visual recognition and calling that symbol determine who gains or sheds cards.",
    familyEvidence:
      "Very short rules and simultaneous participation reduce waiting; visual speed and naming dominate success.",
  },
  {
    legacyId: "42057",
    title: "Monopoly Deal",
    edition: "Base game; standard rules; no expansions",
    players: [2, 3, 4, 5],
    values: [3.5, 3, 2, 2.5, 2, 4, 3.5, 1, 3.5, 3, 1],
    source: "https://instructions.hasbro.com/en-us/instruction/monopoly-deal-card-game",
    evidence:
      "Players assemble three property sets while action cards demand payments or steal properties; money reserves protect sets from debts.",
    familyEvidence:
      "Compact turns and no bankruptcy elimination support access, but action text and payment exceptions need learning.",
  },
  {
    legacyId: "412804",
    title: "Bank",
    edition: "Thunderhive BANK; standard 20 rounds, first three rolls protected",
    players: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    values: [4, 2, 1, 2, 1.5, 3, 2, 1, 4.5, 4, 1],
    source: "https://www.thunderhivegames.com/",
    evidence:
      "Two dice grow a shared pot; after three protected rolls, seven busts and doubles multiply it. Anyone may bank once per round and then sit out that round.",
    familyEvidence:
      "Minimal rules and shared reveals support participation; banked players wait until the next round and a scorekeeper handles arithmetic.",
  },
  {
    legacyId: "367041",
    title: "The Guild of Merchant Explorers",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [2.5, 4, 2.5, 1, 2.5, 4.5, 3.5, 1, 3.5, 1, 5],
    source: "https://www.alderac.com/wp-content/uploads/2022/02/TGOME-Rulebook.pdf",
    evidence:
      "Shared exploration cards place cubes across terrain; permanent villages anchor later eras while investigation powers and routes create personal map networks.",
    familyEvidence:
      "Simultaneous exploration reduces waiting; terrain constraints, era resets and special exploration rules add tracking demands.",
  },
  {
    legacyId: "174430",
    title: "Gloomhaven",
    edition: "Original 2017 edition; standard campaign scenarios; no expansions",
    players: [1, 2, 3, 4],
    values: [3, 4.5, 2, 3.5, 4.5, 4.5, 4.5, 1, 1.5, 1.5, 5],
    source: "https://online.flippingbook.com/view/642368833",
    evidence:
      "Paired action cards govern initiative, movement and attacks; shrinking hands, attack modifiers and scenario goals constrain cooperative tactical combat and campaign development.",
    familyEvidence:
      "Many status, monster and campaign procedures create sustained reading and reference demands; exhausted characters can wait out a scenario.",
  },
  {
    legacyId: "233078",
    title: "Twilight Imperium (4th)",
    edition: "Fourth edition base game; ten-point victory; no Prophecy of Kings",
    players: [3, 4, 5, 6],
    values: [3, 5, 2, 4.5, 4.5, 5, 5, 1, 1.5, 3.5, 5],
    source: "https://www.fantasyflightgames.com/en/products/twilight-imperium-fourth-edition/",
    evidence:
      "Command tokens limit fleet actions and secondary abilities; technology, negotiation, combat and public/secret objectives drive an asymmetric galactic contest.",
    familyEvidence:
      "Numerous phases, faction exceptions and a long session create substantial participation demands despite opportunities to act on others’ turns.",
  },
  {
    legacyId: "41114",
    title: "The Resistance",
    edition: "Base missions without plot-card expansion",
    players: [5, 6, 7, 8, 9, 10],
    values: [1.5, 3.5, 3, 5, 1.5, 4.5, 1.5, 1, 3.5, 5, 1],
    source: "https://indieboardsandcards.com/our-games/the-resistance/",
    evidence:
      "Secret spies infiltrate proposed mission teams; public approval votes and concealed success/failure decisions provide evidence for accusation and persuasion.",
    familyEvidence:
      "Brief recurring votes and no elimination sustain participation; deception and interpreting conflicting claims remain central demands.",
  },
  {
    legacyId: "237182",
    title: "Root",
    edition: "Base game, original four factions, standard competitive setup",
    players: [2, 3, 4],
    values: [3, 4.5, 2, 3, 4.5, 4.5, 4, 1, 2, 2, 5],
    source: "https://rules.ledergames.com/?product=root",
    evidence:
      "Four asymmetric factions contest clearings through distinct production, decree, rebellion or adventuring systems; dice combat and card crafting interact with map control.",
    familyEvidence:
      "Learning several different faction procedures and recovering from attacks creates substantial burden; two-player games use supported base factions.",
  },
  {
    legacyId: "171",
    title: "Chess",
    edition: "Orthodox untimed chess; no variants",
    players: [2],
    values: [1, 5, 3, 1, 2.5, 5, 4, 1, 3.5, 1, 5],
    source: "https://handbook.fide.com/chapter/E012023",
    evidence:
      "Fixed pieces with distinct moves contest an open-information board; checkmate, threats and sacrifices connect tactical execution to long-term plans.",
    familyEvidence:
      "No reading or arithmetic is needed, but piece-specific moves and special rules require learning; losing material can sharply limit recovery.",
  },
  {
    legacyId: "242302",
    title: "That's Pretty Clever!",
    edition: "Base game; standard rules; no expansions",
    players: [1, 2, 3, 4],
    values: [3.5, 3.5, 2, 1, 2.5, 4, 3.5, 1, 3.5, 1.5, 3],
    source: "https://www.schmidtspiele.de/detail/product/that-s-pretty-clever.html",
    evidence:
      "Drafted dice mark different scoring areas; taking higher dice forfeits lower ones to others, and bonuses trigger additional marks and actions.",
    familyEvidence:
      "Players can use leftover dice between turns, but five area rules and chained scoring bonuses require tracking.",
  },
  {
    legacyId: "286096",
    title: "Tainted Grail",
    edition: "The Fall of Avalon original base campaign; standard mode, not Kings of Ruin",
    players: [1, 2, 3, 4],
    values: [3, 4, 2, 3.5, 4, 3.5, 4, 1, 1.5, 2, 4],
    source: "https://cdn.1j1ju.com/medias/11/7a/e2-tainted-grail-the-fall-of-avalon-rulebook.pdf",
    evidence:
      "Branching exploration combines survival resources with card-sequence combat and diplomacy; connection keys and encounter responses constrain each activation.",
    familyEvidence:
      "Extensive narrative text, multiple tracks and persistent campaign consequences create high participation demands.",
  },
  {
    legacyId: "265402",
    title: "Final Girl",
    edition:
      "Series 1 core mechanisms; requires a Feature Film; film-specific modifiers not assessed",
    players: [1],
    values: [4, 3.5, 2, 1, 3.5, 4, 4, 1, 2, 1, 4],
    source: "https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2025/10/Final-Girl-Rules.pdf",
    evidence:
      "Action cards and horror dice resolve movement, searching and combat; limited time buys future actions while killer events threaten victims and player health.",
    familyEvidence:
      "A solo design offers no built-in shared player roles; multiple phases and card effects require independent tracking.",
  },
];

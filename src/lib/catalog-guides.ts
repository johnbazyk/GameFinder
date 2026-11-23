// Teaching notes for each catalog edition.
export const catalogGuides = {
  Codenames: {
    goal: "Guide your teammates to the words belonging to your agents while steering them away from the assassin.",
    tip: "Reveal each guess before making another. One wrong touch can end your turn or the whole game.",
    audio: "/lessons/178900.mp3",
    setup:
      "Lay out 25 word cards. Each team picks a spymaster. Only the two spymasters see the key showing which words belong to each team.",
    turn: "Your spymaster says one word and a number. Discuss which cards it connects, then touch guesses one at a time. A wrong guess ends the turn.",
    win: "Find all your team’s agents first. Touching the assassin loses the game immediately.",
  },
  Wingspan: {
    goal: "Build habitats where your birds help you gather food, lay eggs and attract more birds.",
    tip: "When activating a habitat, work back through its birds from right to left.",
    audio: "/lessons/266192.mp3",
    setup:
      "Take a bird mat, action cubes, starting birds and food. Pay one food for each starting bird you keep. Set out the bird tray and filled birdfeeder.",
    turn: "Spend a cube to play a bird, gather food, lay eggs or draw birds. When using a habitat action, work back along its birds to activate eligible powers.",
    win: "After four rounds add bird points, eggs, cached food, tucked cards, bonus cards and round goals. Highest score wins.",
  },
  "Ticket to Ride": {
    goal: "Connect cities on your destination tickets with a network of trains.",
    tip: "Drawing cards and claiming a route are separate actions. Pick one for this turn.",
    audio: "/lessons/9209.mp3",
    setup:
      "Take trains in one color and four train cards. Draw three destination tickets and keep at least two. Put five train cards face up.",
    turn: "Choose one action. Draw train cards, spend matching cards to claim an open route, or take more tickets. Place one train on each space you claim.",
    win: "Score routes and completed tickets. Unfinished tickets lose points. Count the longest continuous route bonus at the end.",
  },
  Azul: {
    goal: "Build a tiled wall by drafting colors that fit your pattern rows.",
    tip: "Keep the tiles you take in one pattern row. Extras go on the floor.",
    audio: "/lessons/230802.mp3",
    setup:
      "Give everyone a wall board. Put four tiles on each factory and the first-player marker in the center.",
    turn: "Take every tile of one color from a factory or the center. Fill one matching pattern row. Leftovers go on your floor. After drafting, move one tile from each full row to your wall and score its neighbors.",
    win: "Finishing a horizontal wall row triggers the end after scoring that round. Add pattern bonuses and subtract floor penalties as you go. Most points wins.",
  },
  Pandemic: {
    goal: "Work as a team to discover a cure for each of the four diseases.",
    tip: "Treating a city removes cubes. You still need to discover the cure for that disease.",
    audio: "/lessons/30549.mp3",
    setup:
      "Use the setup diagram to infect nine cities. Give each player a role and a starting hand. Put your pawns and a research station in Atlanta.",
    turn: "Take four actions to move, treat disease, exchange matching city cards or discover a cure. Draw two player cards, resolve epidemics and infect cities.",
    win: "Discover all four cures together. Eight outbreaks, an exhausted player deck when drawing, or too few disease cubes when placing them loses the game.",
  },
  Carcassonne: {
    goal: "Build a landscape and use followers to claim features as they take shape.",
    tip: "Check the entire connected feature for followers before placing yours.",
    audio: "/lessons/822.mp3",
    setup:
      "Place the start tile and shuffle the other land tiles face down. Give each player followers in one color and a score marker.",
    turn: "Draw and place a tile so every touching edge matches. You may put a follower on an unclaimed feature of that tile. Score completed features and return eligible followers.",
    win: "After the last tile, score unfinished features and farms. The highest total wins.",
  },
  Dominion: {
    goal: "Build a deck that can buy valuable victory cards before the supplies run low.",
    tip: "A newly bought card goes to your discard pile. It usually enters your hand after a shuffle.",
    audio: "/lessons/36218.mp3",
    setup:
      "Choose ten Kingdom piles. Each player shuffles seven Coppers and three Estates, then draws five cards.",
    turn: "You usually get one Action and one Buy. Play an Action, use Treasure to buy a card into your discard pile, discard your played cards and hand, then draw five.",
    win: "When Provinces or three supply piles run out in the standard game, finish that turn and count victory points in each deck.",
  },
  Scythe: {
    goal: "Build up your faction and finish with the most wealth when someone places a sixth star.",
    tip: "The sixth star stops play. Count coins to find the winner, even if someone else placed that star.",
    audio: "/lessons/169786.mp3",
    setup:
      "Choose a faction and player mat. Put your character, workers and starting resources where those mats show.",
    turn: "Choose a section of your player mat. You may take its top action, then pay for its bottom action. Produce resources, move units and improve what your faction can do.",
    win: "A sixth star ends the game immediately. Convert stars, territories and resources into coins using your popularity tier. Most coins wins.",
  },
  "Spirit Island": {
    goal: "Coordinate your spirits’ powers to drive invaders off the island.",
    tip: "Resolve fast powers before the invaders act. Slow powers must wait until afterward.",
    audio: "/lessons/162886.mp3",
    setup:
      "Choose spirits and use the island layout for your player count. Place starting presence, invaders and Dahan as shown, then resolve the starting explore.",
    turn: "Choose growth, gain energy and play powers. Resolve fast powers, the invader actions, then slow powers. Coordinate which lands to defend before ravage.",
    win: "Meet the current terror level’s victory condition together. Fear makes that condition easier. Follow the island rules for blight, lost presence and the invader deck.",
  },
  "Brass: Birmingham": {
    goal: "Connect and develop industries across the canal and rail eras.",
    tip: "Before building, check where each required coal, iron or beer can legally come from.",
    audio: "/lessons/224517.mp3",
    setup:
      "Set out the canal-era board. Fill your industry board and take your starting hand, money and income marker. Prepare the market and deck for the player count.",
    turn: "Spend a card for each action. Build industries or links, develop, sell goods, scout or borrow. Watch where your coal, iron and beer can legally come from.",
    win: "Score flipped industries and links at the end of each era. The most points after the rail era wins.",
  },
  Splendor: {
    goal: "Build a collection of developments that earns prestige and attracts nobles.",
    tip: "Keep purchased cards in front of you. Their bonuses discount future purchases.",
    audio: "/lessons/148228.mp3",
    setup:
      "Reveal four developments from each tier. Set out gems for the player count and reveal the nobles.",
    turn: "Take gems, reserve a card or buy a development. Cards you own give permanent discounts. Collect enough of the right bonuses to attract a noble.",
    win: "When a player reaches 15 prestige, finish the round. Most prestige wins, with fewer purchased developments breaking ties.",
  },
  "King of Tokyo": {
    goal: "Take Tokyo and gain points, or knock out every other monster.",
    tip: "Hearts on the dice can heal you only while you are outside Tokyo.",
    audio: "/lessons/70323.mp3",
    setup: "Choose a monster, start at ten health and zero points, and reveal three power cards.",
    turn: "Roll six dice up to three times, keeping what you want. Use claws to attack, energy to buy cards, hearts to heal outside Tokyo and sets of numbers to score.",
    win: "Reach 20 points or be the last monster standing.",
  },
  "Sushi Go!": {
    goal: "Draft dishes into combinations that earn points over three rounds.",
    tip: "Keep your puddings between rounds. They score at the end of the game.",
    audio: "/lessons/133473.mp3",
    setup:
      "Shuffle the sushi deck and deal the number shown for your player count. Keep each hand secret.",
    turn: "Choose one card, reveal together and pass the rest. Build sets such as sashimi or dumplings. Score when hands run out, keeping puddings for later.",
    win: "Add scores from three rounds and the final pudding adjustment. Highest total wins.",
  },
  "Love Letter": {
    goal: "Keep your character in the round while trying to eliminate your rivals.",
    tip: "Use the effect of the card you play. Keep the other card hidden.",
    audio: "/lessons/277085.mp3",
    setup:
      "Give each player one card. Set aside the face-down card and prepare any extra removed cards for your edition and player count.",
    turn: "Draw one card, play one of your two and resolve its effect. Watch what others discard to work out what they might still hold.",
    win: "Win a round by staying in alone or holding the highest remaining card when the deck runs out. Collect the required number of tokens.",
  },
  Coup: {
    goal: "Use coins, claims and challenges to strip your rivals of their influence.",
    tip: "A lost influence card stays face up. It is out for the rest of the game.",
    audio: "/lessons/131357.mp3",
    setup:
      "Deal two hidden influence cards and give two coins to each player. Leave the remaining cards and coins in the center.",
    turn: "Take an action such as income or a coup, or claim a character’s ability. Other players may challenge a claim or block certain actions.",
    win: "Keep at least one influence while everyone else loses both. A lost influence stays face up.",
  },
  "Just One": {
    goal: "Help a teammate identify a mystery word using clues that survive comparison.",
    tip: "Compare clues before showing them to the guesser. Matching clues cancel each other.",
    audio: "/lessons/254640.mp3",
    setup:
      "Set aside 13 word cards. One player turns a card toward everyone else and chooses a numbered word without looking.",
    turn: "Each clue giver writes one word in secret. Compare clues and remove identical or invalid ones. The guesser gets one guess from what remains and may pass.",
    win: "Work together to guess as many of the 13 cards as possible. A wrong answer also costs the next card if one remains.",
  },
  "The Mind": {
    goal: "Play the team’s cards in ascending order without sharing their values.",
    tip: "There is no turn order. Wait if you think a teammate still holds a lower card.",
    audio: "/lessons/244992.mp3",
    setup:
      "Set out the lives and throwing stars for your player count. On level one, deal one number card to each player.",
    turn: "Without signaling numbers or taking turns, play when you think your lowest card comes next. A lower card still in a hand costs the team a life.",
    win: "Clear every required level before losing your last life. Each new level deals one more card per player.",
  },
  Skull: {
    goal: "Estimate how many flowers you can reveal without uncovering a skull.",
    tip: "If you win the bid, turn over your own stack first.",
    audio: "/lessons/92415.mp3",
    setup:
      "Give everyone a mat, three flowers and one skull. Each player places one disc face down.",
    turn: "Add another disc or bid how many flowers you can turn up. The highest bidder reveals their own stack first, then chooses other players’ top discs.",
    win: "Win two bids successfully or be the last player with discs. Revealing a skull costs the bidder a disc.",
  },
  Dixit: {
    goal: "Give a clue that leads some players to your picture while leaving room for doubt.",
    tip: "A clue that everyone guesses costs the storyteller the usual scoring opportunity.",
    audio: "/lessons/39856.mp3",
    setup:
      "Deal illustrated cards and set out voting pieces and score markers. Choose a storyteller.",
    turn: "The storyteller gives a clue for one hidden picture. Others add decoys. Shuffle and reveal the pictures, then secretly vote for the storyteller’s card.",
    win: "Earn points for good guesses and convincing decoys. As storyteller, aim for some correct guesses but not everyone. Highest score at game end wins.",
  },
  Patchwork: {
    goal: "Cover your quilt board while managing buttons and time.",
    tip: "Check the time track after each move. The player behind takes the next turn.",
    audio: "/lessons/163412.mp3",
    setup:
      "Give each player a blank quilt and five buttons. Arrange the patches in a circle and place the marker after the smallest patch.",
    turn: "The player behind on the time track acts. Buy one of the next three patches and fit it on your quilt, or advance for buttons. Cross income symbols to collect button income.",
    win: "When both reach the end, count buttons and any bonus, then subtract two per empty square. Higher score wins.",
  },
  Cascadia: {
    goal: "Build connected habitats and arrange animals in their scoring patterns.",
    tip: "An empty habitat tile can accept only an animal pictured on it.",
    audio: "/lessons/295770.mp3",
    setup:
      "Give each player a starter habitat. Reveal four pairs, each with a habitat tile and a wildlife token. Choose one scoring card per animal.",
    turn: "Take a pair, add the tile beside your habitat and place the animal on an empty tile that accepts it. A nature token lets you change the pairing.",
    win: "Score each wildlife pattern, your largest connected habitat of each type, bonuses and unused nature tokens. Most points wins.",
  },
  Everdell: {
    goal: "Build a city of critters and constructions through the seasons.",
    tip: "Preparing for the next season recalls your own workers. Other players keep their own pace.",
    audio: "/lessons/199792.mp3",
    setup:
      "Set out the meadow cards, resources and event tiles. Take your starting hand and two workers.",
    turn: "Place a worker at an available location, play a critter or construction into your city, or prepare for your next season. Preparing recalls your workers.",
    win: "After everyone finishes autumn, score cards, points, events and bonuses. Highest total wins.",
  },
  "Ark Nova": {
    goal: "Build a zoo that brings its appeal and conservation markers together.",
    tip: "The position of an action card sets its strength. Return it to position one after use.",
    audio: "/lessons/342942.mp3",
    setup:
      "Choose a zoo map. Lay out your five action cards and choose a starting hand. Set up the association board and card display.",
    turn: "Pick an action card. Its position determines its strength. Build enclosures, introduce animals, sponsor projects or do association work, then slide the used action back to position one.",
    win: "Grow appeal and conservation. When the tracks meet, follow your edition’s final-turn and scoring rules to compare finished zoos.",
  },
  "Dune: Imperium": {
    goal: "Gain influence and win conflicts by choosing how to use each card in your hand.",
    tip: "Cards spent sending agents are no longer in your hand for the reveal.",
    audio: "/lessons/316554.mp3",
    setup:
      "Take a leader, agents and a starting deck. Reveal the Imperium Row and prepare the conflict deck.",
    turn: "Play a card to send an agent to a matching board space and resolve its effects. When you reveal your remaining hand, use persuasion to buy cards and swords to strengthen combat.",
    win: "Score victory points through conflicts, alliances and card effects. Reaching ten points or exhausting the conflicts triggers final scoring.",
  },
  "Lost Ruins of Arnak": {
    goal: "Explore sites, overcome guardians and advance your research.",
    tip: "Check the travel symbol before sending an archaeologist to a site.",
    audio: "/lessons/312484.mp3",
    setup:
      "Set up the island, research track and card row. Each player takes archaeologists, research markers and a starting deck.",
    turn: "Take one main action such as digging, discovering a new site, researching or buying a card. Match travel symbols to send an archaeologist and save resources for guardians or research.",
    win: "After five rounds score research, guardians, idols, cards and other bonuses. Fear cards lose points.",
  },
  "The Quacks of Quedlinburg": {
    goal: "Brew a valuable potion without pushing your white chips too far.",
    tip: "Add the values on the white chips. Exactly seven is safe, but more than seven explodes the pot.",
    audio: "/lessons/244521.mp3",
    setup:
      "Give everyone a pot, bag and the starting chips on the setup chart. Set out ingredient books and supplies.",
    turn: "Draw chips one at a time and advance through your pot by their values. You can stop voluntarily. A white-chip total above seven explodes your pot and limits your rewards.",
    win: "Buy ingredients to improve later draws and collect points over nine rounds. Highest score wins.",
  },
  "The Crew: The Quest for Planet Nine": {
    goal: "Work together to deliver each mission’s task cards to the right players.",
    tip: "You must follow the led suit if you have it, even when another play would help the mission.",
    audio: "/lessons/284083.mp3",
    setup:
      "Read the next mission in the logbook. Deal the deck and allocate its task cards. The player with the four of rockets is commander.",
    turn: "Follow the led suit if you can. The highest card in that suit wins the trick unless a rocket trumps it. Use only the communication your mission permits.",
    win: "Get each required card into the assigned player’s tricks in the required order. A failed task means retrying the mission together.",
  },
  "Sky Team": {
    goal: "Land the plane together by coordinating your pilot and copilot dice.",
    tip: "Discuss the plan before rolling. Place your dice in silence afterward.",
    audio: "/lessons/385761.mp3",
    setup:
      "Pick an airport and set the approach and altitude tracks for its scenario. Sit on opposite sides as pilot and copilot, each with four dice.",
    turn: "Plan before rolling, then roll behind your screens and take turns placing dice in silence. Balance the axis, set engine speed and deploy landing systems.",
    win: "Reach the airport at landing altitude with safe speed, a level axis, clear traffic and the required systems deployed.",
  },
  "Heat: Pedal to the Metal": {
    goal: "Race around the track while managing speed and engine heat.",
    tip: "Check the speed limit of every corner you cross this turn.",
    audio: "/lessons/366013.mp3",
    setup:
      "Choose a track and car. Fill your engine and deck using the race setup, shuffle and draw your starting hand.",
    turn: "Shift gear, play that many speed cards, then reveal and move. Check each corner you cross. Going too fast costs Heat and can cause a spinout.",
    win: "Cross the finish after the required laps. If several cars finish together, their final positions decide the order.",
  },
  Hive: {
    goal: "Trap the opposing queen by filling the six spaces around her.",
    tip: "The hive must stay connected throughout a move. Check what happens when you lift the piece.",
    audio: "/lessons/2655.mp3",
    setup:
      "Each player takes one color of insects. Begin with an empty table and place the first two pieces touching.",
    turn: "Place a new insect or move one using its species’ movement. Keep the hive connected. Bring out your queen by your fourth turn before moving insects.",
    win: "Surround the opposing queen on all six sides. Pieces of either color count.",
  },
  Santorini: {
    goal: "Climb a worker from level two onto level three.",
    tip: "Build beside the worker you just moved. A dome closes that space to movement.",
    audio: "/lessons/194655.mp3",
    setup:
      "Build the island and place two workers per player. For a first game, use the basic rules without god powers.",
    turn: "Move one worker to a neighboring empty space, climbing at most one level, then build beside that worker. A dome closes a tower.",
    win: "Move up onto level three to win. You also win if your opponent cannot take a legal turn.",
  },
  Onitama: {
    goal: "Threaten the opposing master while watching the path to the opposing temple.",
    tip: "Exchange the card you used with the spare. Your opponent can eventually use that move.",
    audio: "/lessons/160477.mp3",
    setup:
      "Put your master on the central temple square of your home row and your four students alongside it. Deal two movement cards each and one spare.",
    turn: "Move one piece using a pattern on one of your cards, capturing an opponent on the landing square. Exchange the card used for the spare.",
    win: "Capture the opposing master or move your master onto the opposing temple.",
  },
  "Blood Rage": {
    goal: "Lead a clan to glory through battles, quests and Ragnarök.",
    tip: "Check the hidden battle cards before deciding which clan wins a contested pillage.",
    audio: "/lessons/170216.mp3",
    setup:
      "Choose clans, set up the provinces and draft your first Age cards. Mark the province destined for Ragnarök.",
    turn: "Spend rage to invade, move or upgrade. You can also quest or pillage. When clans contest a pillage, hidden battle cards can change the outcome.",
    win: "Earn glory from battles, quests, Ragnarök and clan upgrades across three Ages. Most glory wins.",
  },
  "Rising Sun": {
    goal: "Lead your clan through political mandates and provincial wars.",
    tip: "A mandate can give other players an action too. Check who benefits when you choose it.",
    audio: "/lessons/205597.mp3",
    setup:
      "Choose clans and set up the seasonal cards, provinces and shrines. Begin the tea ceremony to form alliances.",
    turn: "On your mandate turn, choose a political mandate for the table. Recruit, move, train or harvest, then resolve the season’s province conflicts with hidden bids.",
    win: "After the last war, score battles, seasonal cards and territory bonuses. Most victory points wins.",
  },
  "Race for the Galaxy": {
    goal: "Build a tableau of worlds and developments worth victory points.",
    tip: "Everyone can take a selected phase, including a phase someone else chose.",
    audio: "/lessons/28143.mp3",
    setup:
      "Take a start world, a starting hand and a set of phase-selection cards. Put victory point chips in reach.",
    turn: "Choose a phase secretly, then reveal together. Everyone may perform the chosen phases. Develop technologies, settle worlds, produce goods or consume them for points and cards.",
    win: "The end is triggered by the point supply or tableau size. Score chips, cards and development bonuses.",
  },
  "Power Grid": {
    goal: "Build an electricity network and supply its cities with working power plants.",
    tip: "A connected city only counts toward the finish if you can power it.",
    audio: "/lessons/2651.mp3",
    setup:
      "Choose the map regions for your player count. Set out the power plant market and fuel. Give players their starting cash.",
    turn: "Auction power plants, buy fuel, pay to connect new cities and run plants to earn income. Turn order affects access to bargains.",
    win: "When the city threshold is reached, power the most cities in the final bureaucracy phase. Cash breaks ties.",
  },
  "UNO Flip!": {
    goal: "Get rid of all your cards as the table switches between the light and dark sides.",
    tip: "A Flip changes everyone’s hand and both piles. Use the newly revealed side.",
    audio: "/lessons/271460.mp3",
    setup:
      "Deal seven cards each with the light side active. Keep every hand and pile facing the same way.",
    turn: "Match the active color, number or symbol. When a Flip card is played, turn over all hands and both piles and use the new side’s actions.",
    win: "Call UNO when one card remains and play your last card to win the round.",
  },
  "UNO Attack!": {
    goal: "Shed your cards while managing the risk of the launcher.",
    tip: "When required to use the launcher, take the cards it actually fires.",
    audio: "/lessons/2818.mp3",
    setup:
      "Set up the launcher, deal seven cards each and start the discard pile. Load the remaining cards into the launcher.",
    turn: "Play a matching card or a legal wild. Use the launch button when the rules or an action card require it. Take whatever cards it fires.",
    win: "Call UNO at one card and empty your hand to win the round.",
  },
  "UNO Spin": {
    goal: "Empty your hand while the wheel changes the course of play.",
    tip: "Resolve the wheel’s effect when a spin symbol triggers it.",
    audio: "/lessons/24318.mp3",
    setup: "Set out the wheel, deal starting hands and turn up the first discard.",
    turn: "Match color, number or symbol as in UNO. A spin symbol triggers the wheel. Resolve the indicated effect before continuing play.",
    win: "Call UNO with one card remaining. Get rid of your last card to win the hand.",
  },
  DOS: {
    goal: "Clear your hand by matching numbers in the center row.",
    tip: "Two cards can make one match when their numbers add up to the center card.",
    audio: "/lessons/246701.mp3",
    setup: "Deal seven cards each and turn up two center-row cards. Keep room for the row to grow.",
    turn: "Match a center card’s number with one card or with two whose values add to it. Color matches give bonuses. Refill the row after clearing matches.",
    win: "Call DOS when you have two cards. Empty your hand to score the cards left with opponents.",
  },
  "DOS: Second Edition": {
    goal: "Empty your hand by playing matches onto the discard piles.",
    tip: "Call DOS when you reach two cards.",
    audio: "/lessons/386551.mp3",
    setup: "Deal hands and start two separate discard piles. Leave both tops visible.",
    turn: "Play to a pile by matching its color, number or symbol. Wild DOS cards can count as twos of any color. Resolve action symbols as played.",
    win: "Call DOS when down to two cards. Play out your hand to win the round.",
  },
  "UNO: Show 'Em No Mercy": {
    goal: "Shed your hand or survive while opponents accumulate cards.",
    tip: "To pass along a draw penalty, your draw card must be equal or stronger.",
    audio: "/lessons/399088.mp3",
    setup:
      "Deal seven cards each. Put the deck in reach and turn one card up for the discard pile.",
    turn: "Match cards to shed them. A draw penalty can be passed on with an equal or stronger draw card. Sevens exchange hands and zeros rotate them.",
    win: "Empty your hand or be the last player left. A hand that reaches 25 cards is eliminated.",
  },
  "My First UNO": {
    goal: "Shed your cards by spotting matching colors, numbers or characters.",
    tip: "Call UNO as soon as you are down to one card.",
    audio: "/lessons/9090.mp3",
    setup:
      "For the Sofia edition, give each player five cards. Turn one card up beside the draw pile.",
    turn: "Look for a matching color, number or character. Follow special cards such as wild or draw two. Use the edition sheet for its symbols.",
    win: "Call UNO at one card. The first player to play their last card wins the hand.",
  },
  "UNO: All Wild!": {
    goal: "Choose the timing of your action cards to empty your hand.",
    tip: "Every card is wild. Check the symbol to see what happens when you play.",
    audio: "/lessons/352997.mp3",
    setup: "Deal seven cards to each player. Start a discard pile in the middle.",
    turn: "Every card is wild, so pick any card from your hand. Resolve its symbol, which may skip someone, force a draw or change hands.",
    win: "Call UNO when down to one card. Empty your hand to win.",
  },
  "UNO Flex!": {
    goal: "Use ordinary matches and well-timed flex powers to empty your hand.",
    tip: "Check your power card before using the flex option.",
    audio: "/lessons/380300.mp3",
    setup:
      "Give everyone a hand and a power card showing its active green side. Start a discard pile.",
    turn: "Match the top card normally or use a card’s flex option when your power card allows it. Flip your power card as directed.",
    win: "Call UNO at one card and play your last card to finish the hand.",
  },
  "UNO Triple Play": {
    goal: "Empty your hand by playing onto the available piles.",
    tip: "Choose a lit pile, then press that pile after placing your card.",
    audio: "/lessons/343122.mp3",
    setup: "Set up the electronic unit with three discard piles, then deal seven cards each.",
    turn: "Choose a lit pile where you can legally match. Press the pile when you play. If it overloads, draw the number shown by the unit.",
    win: "Call UNO on one card and empty your hand to win the round.",
  },
  "UNO Party!": {
    goal: "Shed your hand while group actions change who draws and plays.",
    tip: "A speed play requires an exact match. Check the card before jumping in.",
    audio: "/lessons/372973.mp3",
    setup:
      "Gather a large group and deal seven cards each. Set the direction and linked-player cards within reach.",
    turn: "Match the active card. Special cards can link players’ draws, start a mini pile or trigger a group vote. An exact match can permit a speed play.",
    win: "Call UNO with one card remaining and finish your hand first.",
  },
  "UNO Quatro": {
    goal: "Build a line of four tiles that share a color or number.",
    tip: "When your tile touches other tiles, it must match at least one neighbor.",
    audio: "/lessons/394783.mp3",
    setup: "Stand up the trays, mix the tiles in the bag and draw three each.",
    turn: "Drop a tile into a tray. If it touches another tile, it must match at least one neighbor by color or number. Resolve its symbol and refill your hand.",
    win: "Create a line of four sharing one color or one number, horizontally, vertically or diagonally.",
  },
  "UNO Dare!": {
    goal: "Get rid of your cards while choosing how to handle dares.",
    tip: "If you are targeted by a Dare, you may choose the specified draw penalty.",
    audio: "/lessons/172237.mp3",
    setup:
      "Choose one dare list for the game. Deal seven cards to each player and start the discard pile.",
    turn: "Play a matching card or legal wild. When a Dare targets you, choose between the specified draw penalty and the dare on the list.",
    win: "Call UNO at one card. Play your last card to win the hand.",
  },
  "UNO Blast": {
    goal: "Be first to shed your hand while the blaster fills up.",
    tip: "If the blaster fires on your turn, collect the ejected cards.",
    audio: "/lessons/147647.mp3",
    setup: "Set the blaster in the center, deal cards and start a discard pile.",
    turn: "Play a match when possible. When you must load the blaster, put the card in an open slot. If the unit fires, take the ejected cards.",
    win: "Call UNO with one card left and empty your hand to win the round.",
  },
  "UNO Flash": {
    goal: "Get rid of your cards by reacting when the unit selects you.",
    tip: "Watch your button. The next turn follows the light.",
    audio: "/lessons/38038.mp3",
    setup:
      "Set up the electronic unit, choose the timer setting and assign a button to each player. Deal the hands and start a discard pile.",
    turn: "Watch for your button to light. Play a legal match or draw as required, then press your button. Slap cards change which buttons everyone must hit.",
    win: "Call UNO at one card. Empty your hand to win the round.",
  },
  "UNO H2O": {
    goal: "Empty your hand while managing Downpour wilds.",
    tip: "Check the number on a Downpour card before the other players draw.",
    audio: "/lessons/16693.mp3",
    setup: "Deal seven waterproof cards each and start the draw and discard piles.",
    turn: "Match a color, number or symbol. A Downpour wild names the next color and makes the other players draw the number shown.",
    win: "Call UNO when you have one card. Play your final card to finish the round.",
  },
  "Liar's UNO": {
    goal: "Clear your hand while deciding which face-down claims to trust.",
    tip: "Resolve a challenge to a Liar card before the next player continues.",
    audio: "/lessons/455524.mp3",
    setup: "Deal the starting hands and leave room for a draw pile and a discard pile.",
    turn: "Match normally or play a Liar card face down and announce its identity. Players can challenge the claim. Resolve the challenge before continuing.",
    win: "Call UNO with one card left and get rid of your final card under the challenge rules.",
  },
  "UNO Dice Game": {
    goal: "Play matching dice until you have none left.",
    tip: "Match the die at the end of the line.",
    audio: "/lessons/116593.mp3",
    setup:
      "For the eleven-dice edition, take five dice each and set the starting die between the two players.",
    turn: "Play a die that matches the color or number at the end of the line. If you cannot play, take and roll a die according to the draw rule.",
    win: "Be the first player with no dice left.",
  },
  "Phase 10": {
    goal: "Work through ten combinations in order.",
    tip: "Finishing your phase advances you for the next hand. Keep playing this hand until it ends.",
    audio: "/lessons/1258.mp3",
    setup:
      "Deal ten cards each and give everyone the phase list. Start a draw pile and a discard pile.",
    turn: "Draw one card, work toward your current combination and discard one. Once your phase is down, you can play extra cards on completed phases.",
    win: "Complete all ten phases in order. A completed phase advances you for the next hand. Low penalty points break a final tie.",
  },
  "Phase 10 Masters Edition": {
    goal: "Complete ten different phases while choosing when to tackle each one.",
    tip: "Choose an unfinished phase after looking at your hand.",
    audio: "/lessons/22664.mp3",
    setup:
      "Deal hands and give everyone a phase tracker. Leave space for saved cards between hands.",
    turn: "Choose an unfinished phase after seeing your hand. Draw, make sets or runs, and discard. Use the save rule to keep a useful card for later.",
    win: "Complete all ten different phases. If players finish together, compare penalty points.",
  },
  "Phase 10 Twist": {
    goal: "Complete phases to advance your piece to the board’s finish.",
    tip: "Check the consequence of failing a Twist before taking the harder challenge.",
    audio: "/lessons/38187.mp3",
    setup:
      "Place markers at the start of the board, deal each player a hand and set out the Twist cards.",
    turn: "Draw and discard to complete the phase on your space. On a Twist space you can take a riskier challenge that moves you farther on success and backward on failure.",
    win: "Advance along the board and complete its finish requirement before the other players.",
  },
  "Phase 10 Dice": {
    goal: "Make each phase’s required combination with your dice.",
    tip: "A wild can complete a group, but adds zero to its score.",
    audio: "/lessons/2578.mp3",
    setup: "Give everyone a score sheet and check the first phase. Use the game’s ten dice.",
    turn: "Roll and set aside dice toward the required combination. You may reroll unwanted dice within the three-roll limit. A wild helps make a group but scores zero.",
    win: "Complete the phases and record their values. Include bonuses and compare final totals to find the winner.",
  },
  Monopoly: {
    goal: "Use property and rent to stay solvent while your rivals go bankrupt.",
    tip: "An unowned property goes to auction if the player landing there declines to buy it.",
    audio: "/lessons/1406.mp3",
    setup:
      "Choose tokens, start at GO and appoint a banker to deal starting cash and manage property deeds.",
    turn: "Roll and move. On unowned property, buy it or send it to auction. Pay rent on an opponent’s developed holdings. Complete color sets to build evenly.",
    win: "Keep paying your debts while opponents go bankrupt. The last solvent player wins.",
  },
  "Candy Land": {
    goal: "Follow the candy path to the castle.",
    tip: "A picture card sends you to its matching picture, even if you have already passed it.",
    audio: "/lessons/5048.mp3",
    setup: "Place the pieces at Start and shuffle the color cards face down.",
    turn: "Draw a card and follow its colors along the path. For a picture card, go to the matching picture space. Check special spaces as you land.",
    win: "Reach the castle at the end of the path first.",
  },
  Boggle: {
    goal: "Find words that other players miss in the same grid of letters.",
    tip: "A word may twist through the grid, but cannot use the same die twice.",
    audio: "/lessons/1293.mp3",
    setup:
      "Shake the letter dice into the grid, reveal them together and start the timer. Give everyone paper.",
    turn: "Trace words through neighboring letters horizontally, vertically or diagonally. You may use each die only once in a word. Write your words privately.",
    win: "When time runs out, cross off words other players also found. Score the remaining legal words by length.",
  },
  Scrabble: {
    goal: "Build connected words that earn the most points.",
    tip: "Check every crossing word. A premium square counts only when first covered.",
    audio: "/lessons/320.mp3",
    setup:
      "Mix the tiles in the bag. Each player draws seven tiles to a rack. The first word must cover the center star.",
    turn: "Build a connected word across or down. All crossing words must be legal. Score newly covered premium squares and refill your rack. You can also pass or exchange when allowed.",
    win: "After the game ends, apply rack adjustments. Most points wins.",
  },
  Rummikub: {
    goal: "Lay down all your tiles in legal groups and runs.",
    tip: "Your opening thirty must come from your own rack before you rearrange the table.",
    audio: "/lessons/811.mp3",
    setup: "Mix the numbered tiles face down. Take fourteen tiles each and stand them on racks.",
    turn: "For your opening play, lay groups or runs worth at least thirty from your own rack. Later you can rearrange table sets as long as every set ends legal. Draw when you cannot play.",
    win: "Empty your rack first. Remaining rack values determine the round’s score.",
  },
  Qwirkle: {
    goal: "Extend lines of matching shapes or colors for points.",
    tip: "Check both directions. A line cannot contain two identical tiles.",
    audio: "/lessons/25669.mp3",
    setup: "Draw six tiles per player. Each tile has a color and shape. Keep a score sheet.",
    turn: "Place tiles in one line sharing a color or a shape, with no duplicates in a line. Score every line extended, then refill. You may exchange instead.",
    win: "Six different tiles complete a Qwirkle for a bonus. Finish when the bag is empty and a player goes out. Most points wins.",
  },
  Blokus: {
    goal: "Fit as many of your squares on the shared board as possible.",
    tip: "Your own pieces can touch corner to corner but cannot share an edge.",
    audio: "/lessons/2453.mp3",
    setup:
      "Give each color its set of flat pieces and assign a starting corner. Use the player-count rules for control of colors.",
    turn: "Place a piece covering your corner first. Later pieces of your color must touch your own pieces at a corner and cannot share an edge with them.",
    win: "Once no more moves are possible, compare unplaced squares. Fewer is better, with bonuses for using all pieces.",
  },
  Yahtzee: {
    goal: "Use dice combinations to fill a high-scoring scorecard.",
    tip: "Choose an unused category each turn, even when the only legal score there is zero.",
    audio: "/lessons/2083.mp3",
    setup: "Give everyone a score column and use five dice.",
    turn: "Roll up to three times, keeping any dice you want between rolls. Enter one result in one unused category, even if it is zero.",
    win: "After thirteen turns each, total the scores and bonuses. Highest total wins.",
  },
  Pictionary: {
    goal: "Help teammates guess what you draw before time runs out.",
    tip: "Sketch silently. Check whether the space calls for All Play.",
    audio: "/lessons/1410.mp3",
    setup:
      "Form teams and give each a sketch pad, pencil and playing piece. Choose a starting artist.",
    turn: "The artist silently sketches the assigned prompt while teammates guess before time runs out. Follow the board’s category and All Play instructions.",
    win: "Reach the finish and correctly guess the final prompt under your edition’s rules.",
  },
  "The Game of Life": {
    goal: "Navigate life events and retire with the most wealth.",
    tip: "Pause at a mandatory stop even if your spin would carry you farther.",
    audio: "/lessons/4118.mp3",
    setup:
      "Place the spinner and cards, choose cars and give players their edition’s starting cash. Choose a starting path.",
    turn: "Spin, travel and resolve your space. Stop at mandatory stops and make the career, family or money decisions shown.",
    win: "Retire and total your assets and bonuses after settling debts. The wealthiest player wins.",
  },
  Sagrada: {
    goal: "Build a stained-glass window that meets the objectives.",
    tip: "Equal colors or equal values cannot sit directly beside each other horizontally or vertically.",
    audio: "/lessons/199561.mp3",
    setup:
      "Choose a window pattern and slide it into your frame. Set out objectives, tools and the round track.",
    turn: "Draft a die from the public pool and fit it into your window. Follow printed restrictions and keep equal colors or values apart orthogonally. Tools can help.",
    win: "After ten rounds score objectives and remaining favor tokens, then deduct empty spaces. Highest score wins.",
  },
  Cartographers: {
    goal: "Draw terrain that satisfies the scoring goals for each season.",
    tip: "An ambush sends your map to a neighbor to place the monsters.",
    audio: "/lessons/263918.mp3",
    setup:
      "Give everyone a map and pencil. Set out four scoring cards and the season and exploration decks.",
    turn: "Reveal an exploration card together. Each player draws one allowed shape and terrain on their map. For an ambush, pass maps so a neighbor places the monsters.",
    win: "At each season’s end score its two objectives and your coins, then subtract monster penalties. Highest total after winter wins.",
  },
  "Sheriff of Nottingham": {
    goal: "Profit by delivering goods and judging other merchants’ declarations.",
    tip: "Declare one legal type of good and a quantity. Inspecting an honest bag costs the sheriff.",
    audio: "/lessons/157969.mp3",
    setup:
      "Prepare the goods deck and give each merchant a bag, hand and starting coins. Choose the first sheriff.",
    turn: "As a merchant, bag goods and declare one legal type and a quantity. As sheriff, negotiate or inspect. An inspection can earn penalties for lying or cost you for stopping an honest bag.",
    win: "Add coins, delivered goods and market bonuses after the required sheriff rotations. Richest merchant wins.",
  },
  "Deception: Murder in Hong Kong": {
    goal: "Use the forensic scientist’s clues to identify the murderer’s means and evidence.",
    tip: "An official accusation must identify both cards. Discuss before spending your badge.",
    audio: "/lessons/156129.mp3",
    setup:
      "Deal secret roles. Lay weapon and evidence cards in front of players. Secretly show the forensic scientist the murderer’s chosen pair.",
    turn: "The scientist gives clues using scene tiles. Investigators discuss which player and pair fit. Spend your badge to make an official accusation.",
    win: "Investigators must name both correct cards before time runs out. The murderer wins by avoiding identification, subject to any optional roles.",
  },
  "The Isle of Cats": {
    goal: "Rescue cats and arrange families on your boat.",
    tip: "Check both the fish and the basket needed before claiming a cat.",
    audio: "/lessons/266083.mp3",
    setup:
      "Take a boat, set out the island and prepare the cat bag, fish and cards. Use the standard or family setup for everyone.",
    turn: "In standard play, draft cards and pay fish to keep them. Use baskets and fish to rescue cats, then fit them on your boat. Follow placement rules and plan for lessons.",
    win: "After five days, count cat families, lessons and treasures, then deduct uncovered rats and unfinished rooms. Most points wins.",
  },
  "The King Is Dead: Second Edition": {
    goal: "Build support at court for whichever faction will take power.",
    tip: "Taking a follower into your court removes that support from the board.",
    audio: "/lessons/281555.mp3",
    setup:
      "Fill regions with faction followers, set out the eight power struggles and give each player their action cards.",
    turn: "Play an action or pass. After an action, take a follower from a region into your court. That gains support for you but weakens the faction there.",
    win: "Win by holding the most support for the crowned faction. If enough disputes trigger invasion, compare complete sets of all three follower colors instead.",
  },
  "The Grizzled": {
    goal: "Help every soldier make it through the trials together.",
    tip: "Watch threats already in play. A third matching threat fails the mission.",
    audio: "/lessons/169255.mp3",
    setup:
      "Prepare the shared trials deck, morale reserve and peace and monument cards. Give each player a character and support tiles.",
    turn: "Play a trial, use an available ability or withdraw with secret support. Three matching threats fail the mission. Support can relieve hard knocks between missions.",
    win: "Reveal peace and empty everyone’s hands before morale runs out and reveals the monument.",
  },
  "Dune (2019)": {
    goal: "Hold enough strongholds with your forces and any allies to claim victory.",
    tip: "Check your faction sheet before applying an ordinary endgame condition.",
    audio: "/lessons/233078-short.mp3",
    setup:
      "Choose factions and use their setup cards for initial troops, spice and special abilities. Choose basic or advanced rules together.",
    turn: "Follow the round phases. Bid for cards, ship or move forces, resolve battles with concealed plans and collect spice. Alliances change who shares a victory.",
    win: "Control the required strongholds at the end of a turn. Check your faction sheet for special endgame conditions.",
  },
  "Star Realms": {
    goal: "Build a fleet capable of reducing your opponent’s authority to zero.",
    tip: "Deal with opposing outposts before attacking authority or other bases.",
    audio: "/lessons/164153.mp3",
    setup:
      "Give each player a starter deck and fifty authority. Reveal five cards in the trade row and set Explorers beside it.",
    turn: "Play cards to gain trade, combat and abilities. Buy new cards into your discard pile. Use combat against enemy authority or bases, handling outposts first.",
    win: "Reduce the opposing player’s authority to zero.",
  },
  Faraway: {
    goal: "Build a journey whose discoveries supply the requirements of earlier regions.",
    tip: "Place regions left to right, then score them right to left.",
    audio: "/lessons/385565.mp3",
    setup: "Deal three region cards each and set out the region display and sanctuary deck.",
    turn: "Each round choose a region in secret, reveal it and add it to the right of your journey. Its number affects draft order and eligibility for a sanctuary.",
    win: "After eight regions, score them from right to left. Later regions and sanctuaries can supply symbols for earlier cards. Most fame wins.",
  },
  "The White Castle": {
    goal: "Position members of your clan to gain influence around the castle.",
    tip: "Compare the die with the value at its destination before resolving the action.",
    audio: "/lessons/359871.mp3",
    setup:
      "Build the three bridges, roll and sort their dice, and place your clan figures and starting resources as shown.",
    turn: "Take an end die from a bridge and assign it to an action space. Compare values to pay or gain coins. Use the action to position gardeners, warriors or courtiers.",
    win: "After nine turns per player, add endgame points for your clan’s positions and resources. Most points wins.",
  },
  "So Clover!": {
    goal: "Help the group reconstruct your word arrangement using four clues.",
    tip: "Each clue connects the two words along its own side of the clover.",
    audio: "/lessons/295947.mp3",
    setup:
      "Give everyone a clover board and four keyword cards. Arrange them randomly around the clover.",
    turn: "Write one clue on each side linking its two neighboring words. Remove and shuffle the cards with a decoy. Let the others reconstruct your board from the clues.",
    win: "Score correctly placed cards and the first-try bonus. Combine everyone’s scores.",
  },
  "Fun Facts": {
    goal: "Put everyone’s secret answers in numerical order.",
    tip: "Choose where to place your arrow before the numbers are revealed.",
    audio: "/lessons/291453.mp3",
    setup:
      "Give each player an arrow and marker. Set aside eight question cards and choose a first player.",
    turn: "Write a secret numerical answer to the question. Place your arrow where you think it falls among the others, from low to high, then reveal the numbers.",
    win: "Score arrows that can remain in ascending order. Add the team’s points across eight questions.",
  },
  "Ice Cool": {
    goal: "Collect fish as a runner and catch penguins when it is your turn to chase.",
    tip: "A runner gets a fish by going through its marked door.",
    audio: "/lessons/177678.mp3",
    setup:
      "Clip the rooms together and choose a catcher. Hang each runner’s fish over the marked doors.",
    turn: "Flick your penguin from where it stands. Runners collect their fish by sliding through marked doors. The catcher tries to hit each runner.",
    win: "Play until everyone has been catcher. Add your fish-card points. Highest total wins.",
  },
  Crokinole: {
    goal: "Flick discs toward the center while knocking opposing discs away.",
    tip: "If an opposing disc is on the board, your shot must make contact with an opposing disc.",
    audio: "/lessons/21790.mp3",
    setup:
      "Sit opposite your opponent or across from your partner. Divide discs by color and clear the circular board.",
    turn: "Flick from your starting quadrant. If an opposing disc is present, your shot must touch an opposing disc. On an empty board aim for the required central area.",
    win: "Score center holes and scoring rings after a round. The higher side scores the difference under standard points play.",
  },
  PitchCar: {
    goal: "Flick your car around the circuit and across the finish.",
    tip: "Give the car one flick on your turn, then apply any track penalty before continuing.",
    audio: "/lessons/21790-pitch.mp3",
    setup: "Build the track, attach the rails and line up the wooden cars at the start.",
    turn: "Flick your car once on your turn. Aim through bends and use the rails. Apply the track rules when a car leaves the circuit or a foul occurs.",
    win: "Be the first to finish the required laps around the track.",
  },
  "Food Chain Magnate": {
    goal: "Run a restaurant that earns more cash than its rivals.",
    tip: "To serve a house, your restaurant must be able to fill its entire order.",
    audio: "/lessons/175921.mp3",
    setup:
      "Build the town map, place starting restaurants and take a CEO card for each company. Set up employees, demand markers and the bank.",
    turn: "Arrange your employees into a reporting structure. Use their jobs to recruit, train, advertise and stock food. At dinner, houses buy from restaurants that can fulfill their entire order.",
    win: "Pay salaries and collect sales. When the bank breaks for the final time, the player with the most cash wins.",
  },
  "Battlestar Galactica": {
    goal: "Help your side either guide the fleet to safety or bring it down from within.",
    tip: "Resolve the crisis after your action. A skill check can be undermined by hidden contributions.",
    audio: "/lessons/37111.mp3",
    setup:
      "Choose characters, place the ships and resource dials, and deal secret loyalty cards according to the player count.",
    turn: "Draw skill cards, move and take an action. Resolve a crisis, often by contributing hidden skill cards to a group check. Hidden Cylons may undermine the fleet.",
    win: "Humans must reach the destination and survive the final jump. Cylons win by depleting a resource, destroying Galactica or succeeding with a boarding party.",
  },
  Harmonies: {
    goal: "Build landscapes with the shapes and heights your animals need.",
    tip: "Check height as well as the pattern before placing an animal cube.",
    audio: "/lessons/414317.mp3",
    setup:
      "Take a landscape board and reveal animal cards. Set out groups of three landscape tokens as shown.",
    turn: "Take one group of tokens and build on your board. You can choose animal cards and place animal cubes when the required pattern and height appear.",
    win: "Score your landscape features and completed animal habitats when the game ends. Highest total wins.",
  },
  SCOUT: {
    goal: "Play stronger shows or recruit cards to improve your hand.",
    tip: "Keep your existing hand in order. Choose the orientation of a newly scouted card as you insert it.",
    audio: "/lessons/324856.mp3",
    setup:
      "Deal the cards without changing their order. Choose which way up to hold your whole hand and take a Scout and Show token.",
    turn: "Show neighboring cards from your hand as a set or run stronger than the table, or scout an end card from the table into your hand. You may turn the scouted card around.",
    win: "Score captured cards and scout tokens, accounting for remaining cards under the round-end rule. Highest total after the rounds wins.",
  },
  "Sea Salt & Paper": {
    goal: "Gather sets and decide when to call the end of each round.",
    tip: "You need at least seven points before calling the round or declaring a last chance.",
    audio: "/lessons/367220.mp3",
    setup: "Shuffle the deck and start two face-up discard piles. Leave room for played pairs.",
    turn: "Take the top of a discard pile or draw two and discard one. Play matching action pairs for their effects. Once you have seven points, you may call the round or risk a last chance.",
    win: "Score sets and bonuses according to how the round ended. Reach the target score for your player count.",
  },
  Hanabi: {
    goal: "Build fireworks together while seeing everyone’s cards except your own.",
    tip: "A color or number clue must identify every matching card in the target hand.",
    audio: "/lessons/98778.mp3",
    setup:
      "Shuffle the deck and deal hands facing away from their owners. Set out clue and fuse tokens.",
    turn: "Give a complete color or number clue, discard for a clue token, or play a card you cannot see. Build each firework from one to five in order.",
    win: "Build the highest combined firework score. Completing every color gives a perfect score. Too many failed plays end the display.",
  },
  "7 Wonders": {
    goal: "Develop your city and wonder across three Ages.",
    tip: "Each chosen card funds one choice. Building your wonder uses that card for the stage.",
    audio: "/lessons/68448.mp3",
    setup:
      "Give each player a wonder board and starting coins. Prepare the three Age decks for the player count.",
    turn: "Choose one card and pass the rest. Build the card, use it to construct your next wonder stage or discard it for coins. Trade with your neighbors to cover resource costs.",
    win: "Resolve military conflicts each Age. After Age three, add civilian, scientific, military, commercial, guild, wonder and coin points.",
  },
  "7 Wonders Duel": {
    goal: "Guide your city to military, scientific or points victory.",
    tip: "Take only an uncovered card. Look for cards your choice will uncover for your opponent.",
    audio: "/lessons/173346.mp3",
    setup:
      "Build the first Age card layout and choose wonders. Set up the military track, science tokens and starting coins.",
    turn: "Take an uncovered card to build it, sell it or use it to construct a wonder. Removing cards can expose new choices for your opponent.",
    win: "Win immediately through military or scientific supremacy. Otherwise compare victory points after the third Age.",
  },
  "Terraforming Mars": {
    goal: "Raise the planet’s global conditions while building the most valuable projects.",
    tip: "Passing takes you out for the rest of this generation.",
    audio: "/lessons/167791.mp3",
    setup:
      "Choose corporations and set temperature, oxygen and oceans to their starting values. Take your starting resources and choose project cards.",
    turn: "Take one or two actions or pass. Play projects, use standard projects, activate cards or convert resources to terraform. After everyone passes, produce for the next generation.",
    win: "When all three global requirements are met, finish the generation and final greenery placements. Count terraform rating, cards, tiles, milestones and awards.",
  },
  Agricola: {
    goal: "Develop a balanced farm and provide food for your growing family.",
    tip: "Set aside enough food for the harvest before spending your last action.",
    audio: "/lessons/31260.mp3",
    setup:
      "Start with two people and a two-room farm. Set up action spaces, harvest schedule and decks for your edition.",
    turn: "Place one family member on an open action to gather, plow, sow, build, fence or grow your family. Return workers each round and feed them at harvest.",
    win: "Score your farm after fourteen rounds. A balanced farm earns points while empty spaces, missing categories and begging can cost points.",
  },
  "Lost Cities": {
    goal: "Start expeditions whose cards can cover their cost and earn a profit.",
    tip: "Wagers must come before numbered cards, and numbers must increase.",
    audio: "/lessons/50.mp3",
    setup:
      "Set the five expedition colors between two players. Deal eight cards each and leave room for a discard pile per color.",
    turn: "Play one card to your expedition or discard it. Then draw from the deck or an eligible discard pile. Numbers on an expedition must increase and wagers go down first.",
    win: "Each started expedition costs twenty points before its cards and multipliers count. Total the rounds and compare scores.",
  },
  Jaipur: {
    goal: "Trade goods for rupees and win two rounds.",
    tip: "Taking camels takes the entire camel group from the market.",
    audio: "/lessons/54043.mp3",
    setup:
      "Place three camels and two other cards in the market, deal hands, and move starting camels into each player’s herd. Sort goods tokens by type.",
    turn: "Take one good, exchange several goods with the market, take all camels or sell matching goods. Larger sales can earn bonus tokens.",
    win: "Most rupees at round end earns a seal of excellence. Win two seals.",
  },
  "Azul: Summer Pavilion": {
    goal: "Build stars with tiles while taking advantage of each round’s wild color.",
    tip: "Pay the number printed on a space to place one tile there.",
    audio: "/lessons/287954.mp3",
    setup:
      "Take a pavilion board and score marker. Fill factories with tiles for the player count. Check the round’s wild color.",
    turn: "Draft a color and any permitted wild tile. During placement, spend the number of tiles printed on a space and place one there. Use wilds and plan around adjacent spaces.",
    win: "After six rounds add completed stars and number bonuses and account for leftover tiles. Most points wins.",
  },
  "Wonderland's War": {
    goal: "Build a chip bag and use it to win battles for Wonderland.",
    tip: "You may stop drawing rather than risk your force busting.",
    audio: "/lessons/291572.mp3",
    setup:
      "Choose factions, set up the tea party and prepare each player’s bag and starting forces.",
    turn: "At the tea party, choose cards to recruit and strengthen your bag. In the war phase, draw chips for strength and abilities or stop before your force busts.",
    win: "Gain points through region battles, castles and quests across three rounds. Highest total wins.",
  },
  "Can't Stop": {
    goal: "Secure three columns before your opponents do.",
    tip: "Stop to save this turn’s progress. Another roll can cost everything gained this turn.",
    audio: "/lessons/41.mp3",
    setup:
      "Set up the numbered columns and keep the three neutral runners nearby. Give everyone colored progress markers.",
    turn: "Roll four dice and split them into two pairs. Advance runners on those sums. Stop to save your progress or roll again and risk losing this turn’s gains.",
    win: "Reach the top of three different columns first. A claimed column closes to everyone else.",
  },
  "The Mind Extreme": {
    goal: "Clear two ordered decks together without discussing your cards.",
    tip: "One deck climbs and the other descends. Check the direction before playing.",
    audio: "/lessons/244049.mp3",
    setup:
      "Separate the numbered decks and prepare the lives and stars for your group. Check the current level for blind-play symbols.",
    turn: "Without discussing values or taking turns, play the ascending deck low to high and the descending deck high to low. Some levels hide played cards.",
    win: "Clear every required level together before your last life is lost.",
  },
  "Outfoxed!": {
    goal: "Use clues to identify the thief before the fox escapes.",
    tip: "Declare whether you are searching for clues or revealing suspects before rolling.",
    audio: "/lessons/13-junior.mp3",
    setup:
      "Set out the suspects and clue tokens. Secretly insert a thief card into the decoder, place the fox at the start and put detectives on their starting spaces.",
    turn: "Before rolling, choose to search for clues or reveal suspects. Successful rolls let you investigate. Use the decoder to learn which clues fit the thief. Failed rolls advance the fox.",
    win: "Name the correct thief together before the fox escapes. A wrong accusation loses the case.",
  },
  "Forbidden Island": {
    goal: "Recover the treasures and escape the sinking island together.",
    tip: "All players must reach Fools’ Landing and use a Helicopter Lift to escape.",
    audio: "/lessons/65244.mp3",
    setup:
      "Build the island, place the four treasures, assign roles and flood the starting tiles. Put adventurers on their matching gates.",
    turn: "Take up to three actions to move, shore up a tile, give a treasure card or claim a treasure. Draw treasure cards and then flood the island.",
    win: "Collect all four treasures, gather at Fools’ Landing and use a Helicopter Lift to escape before the island makes rescue impossible.",
  },
  "Forbidden Desert": {
    goal: "Recover the parts and fly the whole group out of the desert.",
    tip: "Finding the parts is only part of the rescue. Bring everyone to the launch pad.",
    audio: "/lessons/65200.mp3",
    setup:
      "Build the desert grid with a gap for the storm. Place adventurers at the crash, fill canteens as directed and set the storm level.",
    turn: "Spend up to four actions moving, clearing sand, excavating or collecting exposed parts. Draw storm cards to move tiles, bury locations or consume water.",
    win: "Recover all four machine parts and bring everyone to the launch pad before water, sand or the storm overwhelms the group.",
  },
  "Paladins of the West Kingdom": {
    goal: "Develop your realm by assigning workers and building up your attributes.",
    tip: "Check worker colors and attribute requirements before committing to an action.",
    audio: "/lessons/266810.mp3",
    setup:
      "Take a player board, paladin deck and starting supplies. Set up the central cards and king’s orders.",
    turn: "Choose a paladin for the round and recruit workers. Place the required worker colors to take actions such as fortifying, commissioning or attacking. Your attributes limit or improve actions.",
    win: "After seven rounds score attributes, orders, board development and other bonuses, accounting for debts. Most points wins.",
  },
  "The Search for Planet X": {
    goal: "Deduce the location of Planet X and earn points for accurate discoveries.",
    tip: "To locate Planet X, identify what is in both neighboring sectors as well.",
    audio: "/lessons/199792-bellfaire.mp3",
    setup:
      "Choose a board side and use one matching app game code for the table. Take screens and deduction sheets.",
    turn: "Spend time to survey sectors, target one, research a logical rule or attempt a location. Record deductions privately. The player furthest behind on the time track acts next.",
    win: "Locate Planet X and correctly identify its neighbors. This triggers final opportunities. The highest total from discoveries and published theories wins.",
  },
  "Secret Hitler": {
    goal: "Advance your side’s agenda while working out whom to trust.",
    tip: "After three fascist policies, electing Hitler chancellor immediately wins for the fascists.",
    audio: "/lessons/188834.mp3",
    setup:
      "Separate the secret roles and party cards for the player count. Deal identities privately and use the correct boards and recognition procedure.",
    turn: "A president nominates a chancellor. Everyone votes. An elected pair privately narrows three policy cards to one, then enacts it and resolves any executive action.",
    win: "Liberals win with five liberal policies or Hitler’s elimination. Fascists win with six fascist policies or Hitler elected chancellor after three fascist policies.",
  },
  "Exploding Kittens": {
    goal: "Stay in the game while the other players are eliminated.",
    tip: "Drawing normally ends your turn. Play any actions you need beforehand.",
    audio: "/lessons/172225.mp3",
    setup:
      "Remove Kittens and Defuses before dealing, give each player a Defuse and prepare the draw deck with one fewer Kitten than players.",
    turn: "Play any allowed actions, then draw to end your turn unless an action changes that. Defuse an exploding kitten and secretly return it to the deck or be eliminated.",
    win: "Be the last player still in the game.",
  },
  Wavelength: {
    goal: "Help your team locate a hidden target using one clue on a spectrum.",
    tip: "Lock in the dial and the opposing prediction before revealing the target.",
    audio: "/lessons/262543.mp3",
    setup:
      "Split into teams, choose a psychic and reveal a spectrum card. Only the psychic sees the hidden target before closing the screen.",
    turn: "Give a clue that belongs near the target on the spectrum. Teammates discuss and set the dial. The opponents can predict which side of the dial the target lies on.",
    win: "Reveal the target and score the dial and prediction. Teams race to the winning score.",
  },
  Taboo: {
    goal: "Help your team guess the target words before the timer ends.",
    tip: "Check the forbidden words before giving your first clue.",
    audio: "/lessons/1111.mp3",
    setup:
      "Form two teams. Put the cards, timer and buzzer within reach. Choose a clue giver and an opponent to monitor the card.",
    turn: "Describe the target without saying its name, a listed forbidden word or an illegal hint. Guess as many cards as possible before time runs out.",
    win: "Score correct guesses and apply penalties for passes and violations under your edition’s rules. Most points after equal turns wins.",
  },
  "Survive: Escape from Atlantis!": {
    goal: "Rescue the most valuable explorers before the island sinks.",
    tip: "The value on each rescued explorer matters when scoring, not just how many survived.",
    audio: "/lessons/2653.mp3",
    setup:
      "Build the island from terrain tiles. Place explorers while remembering their hidden values and put boats and sea creatures in their starting positions.",
    turn: "Move explorers or boats, sink a qualifying island tile and resolve its event, then roll to move a sea creature. Aim for the safe islands at the board corners.",
    win: "When the volcano ends play, add only the values of explorers you brought to safety. Highest total wins.",
  },
  "Puerto Rico": {
    goal: "Make the best use of shared roles to develop your island and ship goods.",
    tip: "Everyone may use the chosen role, but only its chooser gets the privilege.",
    audio: "/lessons/3076.mp3",
    setup:
      "Set up plantations, goods, ships and buildings. Give each player an island, starting plantation and doubloons for the player count.",
    turn: "Choose a role. In turn order everyone may use its action, and the chooser gets a privilege. Produce goods, trade for money, ship for points and staff your buildings.",
    win: "Finish the round when an end condition is triggered. Combine shipping points, building points and occupied bonus buildings.",
  },
  "Agricola: All Creatures Big and Small": {
    goal: "Raise livestock by expanding and improving your farm.",
    tip: "Leave room for offspring. A breeding pair needs space for the new animal.",
    audio: "/lessons/31260-revised.mp3",
    setup:
      "Each of two farmers takes a farm and three workers. Set out the action board, building tiles, animals and supplies.",
    turn: "Alternate placing workers to gather materials, fence pastures, build shelters or take livestock. At round end, pairs can breed if the farm has space.",
    win: "After eight rounds score livestock, farm expansions and buildings. Too few animals of a species can cost points.",
  },
  Clue: {
    goal: "Identify the suspect, room and weapon in the hidden envelope.",
    tip: "A suggestion uses the room you are in. Save your final accusation until you are sure.",
    audio: "/lessons/1294.mp3",
    setup:
      "Secretly seal one suspect, weapon and room in the case envelope. Deal the remaining cards and give everyone a detective sheet.",
    turn: "Move into a room and suggest a suspect and weapon there. Other players try in order to privately show one matching card. Mark what you learn.",
    win: "Make a correct final accusation naming all three hidden cards. An incorrect accusation ends your chance to win.",
  },
  "Connect Four": {
    goal: "Build an unbroken line of four discs while blocking your opponent.",
    tip: "A disc falls to the lowest open space. Check where it will actually land.",
    audio: "/lessons/3931.mp3",
    setup:
      "Stand the empty grid upright, close the bottom and give each player discs of one color.",
    turn: "Take turns dropping one disc into an open column. It settles in the lowest available space. Look for your own line and block your opponent’s next move.",
    win: "Connect four of your discs horizontally, vertically or diagonally. A full grid with no line is a draw.",
  },
  Jenga: {
    goal: "Move blocks to the top and leave the tower standing.",
    tip: "Use one hand at a time and finish the current top layer before starting another.",
    audio: "/lessons/2452.mp3",
    setup:
      "Build the tower with layers of three blocks, turning each layer a quarter turn. Set it on a firm, level surface.",
    turn: "Using one hand at a time, remove one block below the highest completed layer. Place it on top at right angles to the layer below, finishing each layer before starting another.",
    win: "The player who topples the tower loses. The last player to complete a successful move wins.",
  },
  Mysterium: {
    goal: "Use the ghost’s visions to reconstruct the crime together.",
    tip: "Finish each psychic’s individual investigation before attempting the final shared vision.",
    audio: "/lessons/181304.mp3",
    setup:
      "Choose a ghost. Set up the suspects, locations and objects and secretly assign a combination to each psychic. Prepare the clock.",
    turn: "The ghost silently gives illustrated visions. Psychics discuss, then place guesses. Correct guesses move a psychic along their assigned suspect, location and object.",
    win: "Finish the individual investigations in time, then identify the true culprit group in the final shared vision.",
  },
  "Codenames: Pictures": {
    goal: "Help your team find its agents by connecting images with a clue.",
    tip: "Check the key before covering a guess. Choosing the assassin ends the game.",
    audio: "/lessons/198773.mp3",
    setup:
      "Lay out a grid of twenty pictures. Each team chooses a spymaster. Only the spymasters look at the matching key.",
    turn: "Give one word and a number linking your pictures. Teammates point to guesses one at a time. Cover each picture with the tile shown on the key.",
    win: "Find all your agents before the other team. Choosing the assassin loses immediately.",
  },
  "The Quest for El Dorado": {
    goal: "Lead your expedition through the terrain to El Dorado.",
    tip: "Check the terrain cost before playing movement cards for a space.",
    audio: "/lessons/217372.mp3",
    setup:
      "Build a course from the map tiles. Give everyone a starting expedition deck, shuffle and draw four cards. Set out the market.",
    turn: "Play cards to enter spaces whose terrain costs you can pay or buy a new card. Discard used cards, optionally clear unwanted hand cards and refill.",
    win: "Reach El Dorado. Finish the round so all players have equal turns, then use collected barriers to break a tie.",
  },
  "Forest Shuffle": {
    goal: "Create a forest of trees and species that score well together.",
    tip: "Cards spent as payment go into the clearing where other players may take them.",
    audio: "/lessons/366161.mp3",
    setup:
      "Deal starting hands and set out the clearing. Prepare the deck with the three winter cards positioned as directed.",
    turn: "Draw two cards or pay to plant a tree or attach a species to a free side of a tree. Paid cards go into the clearing for others to take.",
    win: "The third winter ends play immediately. Score your trees and species combinations and cards in your cave.",
  },
  "Pandemic: Hot Zone — North America": {
    goal: "Coordinate your team to discover all three cures.",
    tip: "After your four actions, draw player cards and then complete the infection step.",
    audio: "/lessons/3955.mp3",
    setup:
      "Set out the North America map, prepare the infection and player decks, seed infections and put the team at the research station in Atlanta.",
    turn: "Take four actions to travel, treat, share knowledge or discover a cure. Draw player cards and infect cities. Resolve epidemics and outbreaks as they occur.",
    win: "Discover all three cures together before the outbreak, disease cube or player deck limits are reached.",
  },
  "Architects of the West Kingdom": {
    goal: "Build up your standing through construction and work at the cathedral.",
    tip: "Check how many of your workers are at the site when calculating its action.",
    audio: "/lessons/266810-architects.mp3",
    setup:
      "Take workers, coins and a player board. Set out the building and apprentice cards and prepare the cathedral and market.",
    turn: "Place one worker at a location to use it. Groups of your workers often strengthen an action. Gather materials, recruit apprentices, build or capture workers.",
    win: "Guildhall progress triggers the end. Score buildings, cathedral progress, virtue and other bonuses and penalties.",
  },
  Apiary: {
    goal: "Develop your hive and put your bees to work before hibernation ends the game.",
    tip: "Check a bee’s strength when it is retrieved or bumped. A strength-four bee can enter hibernation.",
    audio: "/lessons/266192-asia.mp3",
    setup:
      "Choose a faction and hive mat, set up bees and resources, and display the available tiles and planets.",
    turn: "Place a bee to explore, advance, grow, research, convert or carve. Strength affects its actions. Retrieve or bump bees to develop them, eventually sending strength-four bees into hibernation.",
    win: "Hibernation triggers the endgame. Add hive, tile, seed and other bonuses to find the highest score.",
  },
  "Rhino Hero": {
    goal: "Build the tower while trying to play the last roof from your hand.",
    tip: "Follow the fold lines on the current roof before adding the next one.",
    audio: "/lessons/209418.mp3",
    setup:
      "Place the foundation on a flat surface. Give everyone roof cards and keep the folded wall cards and rhino handy.",
    turn: "Fold walls and place them along the lines on the current roof, then add a roof from your hand. Its symbol can move the rhino or change the next turn.",
    win: "Empty your roof hand to win. If the tower falls, use remaining hand sizes to decide the winner among players who did not topple it.",
  },
  Kingdomino: {
    goal: "Build connected regions of terrain containing valuable crowns.",
    tip: "A region with no crowns scores zero, however large it is.",
    audio: "/lessons/204583.mp3",
    setup:
      "Give each player a castle and start tile. Draw the first numbered dominoes for the player count, order them and claim your picks.",
    turn: "Add your claimed domino beside your castle or matching terrain within the kingdom boundary. Choose from the next row. The number you claim sets next turn’s order.",
    win: "Score each connected terrain region by multiplying its squares by its crowns. Sum your regions for your kingdom’s score.",
  },
  Wyrmspan: {
    goal: "Attract dragons and explore the caves you build for them.",
    tip: "Excavate a cave space before enticing a dragon into it.",
    audio: "/lessons/410201.mp3",
    setup:
      "Take a cave mat, starter cards, resources, coins and an adventurer. Set out the dragon guild and public goals.",
    turn: "Spend coins to excavate cave spaces, entice dragons into them or explore a cave with your adventurer. Activate eligible rewards as you travel past dragons.",
    win: "After four rounds add dragons, goals, guild benefits, eggs, tucked cards and other endgame points.",
  },
  "Spot It!": {
    goal: "In the Tower game, collect cards by spotting their shared symbols.",
    tip: "Name the matching symbol before taking the center card.",
    audio: "/lessons/63268.mp3",
    setup:
      "Choose a mini-game from the tin. For the Tower, give each player one card face down and stack the rest face up in the center.",
    turn: "Everyone flips their card and searches at once. Name the single symbol shared by your card and the center card to claim it as your new top card.",
    win: "When the center stack is empty, the player who collected the most cards wins the Tower.",
  },
  "Monopoly Deal": {
    goal: "Complete three property sets in different colors.",
    tip: "Pay from cards already on the table. No change is given.",
    audio: "/lessons/42057.mp3",
    setup:
      "Shuffle the deck, deal five cards each and leave room in front of everyone for money and property sets.",
    turn: "Draw two, then play up to three cards into your bank, as properties or for their actions. Pay debts from cards already on the table. No change is given.",
    win: "Collect three complete property sets in different colors on your turn.",
  },
  "The Guild of Merchant Explorers": {
    goal: "Establish villages and trade routes that earn coins over four eras.",
    tip: "Temporary explorers clear between eras. Villages let you start again from those locations.",
    audio: "/lessons/367041.mp3",
    setup:
      "Give everyone the same map and put starting cubes, village tokens and coins within reach. Prepare the exploration deck for the first era.",
    turn: "Reveal an exploration card for everyone. Extend from your capital, villages or network using the permitted terrain and movement. Finish regions to found permanent villages.",
    win: "Temporary explorers clear between eras, while villages remain. After four eras, compare coins from trade routes, discoveries and objectives.",
  },
  Gloomhaven: {
    goal: "Meet the current scenario’s objective before your party exhausts.",
    tip: "Use the top of one selected card and the bottom of the other.",
    audio: "/lessons/174430.mp3",
    setup:
      "Choose a scenario and characters. Equip items, choose legal action hands and set up the revealed rooms and monsters from the scenario book.",
    turn: "Select two cards in secret. Initiative determines acting order. Use the top of one and bottom of the other, then discard or lose them as marked. Rest to recover discards at a cost.",
    win: "Complete the scenario’s stated objective before the whole party exhausts. Objectives and special rules change by scenario.",
  },
  "Twilight Imperium (4th)": {
    goal: "Turn your empire’s expansion and objectives into victory points.",
    tip: "Check home-system control before claiming points for a public objective.",
    audio: "/lessons/233078.mp3",
    setup:
      "Use the learn-to-play galaxy for a first session. Choose factions, take starting fleets and technology, and reveal public objectives.",
    turn: "Choose strategy cards, then alternate tactical, strategic or component actions. Activating systems lets you move, fight and produce. Plan command tokens for later turns.",
    win: "Score public and secret objectives and other victory points. In the standard game the first player to ten wins, subject to home-system scoring restrictions.",
  },
  "The Resistance": {
    goal: "As resistance members, complete missions. As spies, undermine them.",
    tip: "Only spies may submit a failure card on a mission.",
    audio: "/lessons/41114.mp3",
    setup:
      "Deal secret resistance and spy roles for your player count. Spies identify each other in secret. Set out the five mission spaces.",
    turn: "The leader proposes a team and everyone votes. An approved team submits secret mission cards. Resistance members must choose success, while spies may sabotage.",
    win: "The resistance needs three successful missions. Spies need three failures or five rejected team proposals in a single mission.",
  },
  Root: {
    goal: "Use your faction’s own actions to reach its victory condition.",
    tip: "Follow the order on your own faction board. Other factions take different turns.",
    audio: "/lessons/237182.mp3",
    setup:
      "Choose factions and use each faction board’s setup instructions in order. Set up the woodland map, deck and clearings.",
    turn: "Follow your faction board through Birdsong, Daylight and Evening. Each faction recruits, moves, battles, crafts and scores in its own way.",
    win: "Reach thirty points or meet an activated dominance card’s condition. Your faction board explains your main ways to score.",
  },
  Chess: {
    goal: "Trap the opposing king so it is under attack and has no legal escape.",
    tip: "If your king is in check, your move must get it out of check immediately.",
    audio: "/lessons/171.mp3",
    setup:
      "Set a light square at each player’s near right. Put pawns across the second rank and place each queen on her own color between the bishops and the king.",
    turn: "White moves first. Move one piece according to its pattern, keeping your king safe. Pawns move forward and normally capture diagonally. A king in check must immediately escape the attack.",
    win: "Checkmate the opposing king by attacking it with no legal escape. Stalemate is a draw.",
  },
  "That's Pretty Clever!": {
    goal: "Chain colored dice choices into a high-scoring sheet.",
    tip: "Dice lower than the one you take go to the silver platter for other players.",
    audio: "/lessons/242302.mp3",
    setup:
      "Give each player a score sheet and prepare the six colored dice. Mark the number of rounds for your group.",
    turn: "The active player rolls, chooses a die and marks its colored area. Lower dice go to the silver platter. Repeat with remaining dice up to three times. Other players choose a platter die to score.",
    win: "Total the five color areas after the final round. Each fox also scores your lowest color total. Highest sum wins.",
  },
  "Tainted Grail": {
    goal: "Keep the party alive and advance the active story chapter.",
    tip: "Use the journal entry for your current location and follow the active chapter’s objective.",
    audio: "/lessons/286096.mp3",
    setup:
      "For The Fall of Avalon, start with the introductory scenario or your saved chapter. Take character boards and use the setup card to build the starting map and event deck.",
    turn: "Spend energy to travel, explore locations or take actions. Read the matching journal entry. For encounters, link combat or diplomacy cards using their symbols.",
    win: "Follow the active chapter objective to advance the story. Success depends on that objective and keeping the party alive through its consequences.",
  },
  "Final Girl": {
    goal: "Survive the Feature Film and defeat its killer.",
    tip: "Check for final health before declaring the killer defeated.",
    audio: "/lessons/265402.mp3",
    setup:
      "Pair the Core Box with a Feature Film. Choose your Final Girl, killer and location, then use the setup card to place figures and prepare decks.",
    turn: "Spend action cards to move, search, rescue or attack. Horror rolls determine success. Spend remaining time to buy cards, then resolve the killer phase and events as directed.",
    win: "Defeat the killer and survive, including the final health checks. Follow the killer and location sheets for their special rules.",
  },
};

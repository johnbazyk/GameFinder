import { catalogGuides } from "./catalog-guides";

type Guide = { audio: string; setup: string; turn: string; win: string; rules?: string };
export const guides: Record<string, Guide | undefined> = {
  ...catalogGuides,
  Stockpile: {
    audio: "/lessons/stockpile.mp3",
    setup:
      "In the GameFinder card game, each player starts with a personal stock. Leave room for four shared building piles and four discard piles per player.",
    turn: "Fill your hand to five. Build the shared piles from 1 to 12 using your hand or the top of a stock or discard pile. A wild takes the next number. Discard one card from your hand to end your turn.",
    win: "Play the last card from your personal stock onto a building pile.",
  },
  Bank: {
    audio: "/lessons/bank.mp3",
    setup:
      "Choose the number of rounds and start everyone at zero. Pass two dice around the table and keep a shared running total.",
    turn: "Add each roll to the pot. On the first three rolls, a seven adds 70. After that, doubles double the pot and a seven ends the round. Before the next roll, anyone still in can bank the pot’s current value and sit out.",
    win: "Finish the last round with the most banked points.",
  },
  Catan: {
    audio: "/lessons/catan.mp3",
    setup:
      "Use the beginner island diagram in the rules below. Put each color’s two settlements and roads where shown, then take the starting resources listed for your color.",
    turn: "Roll both dice. Everyone with a settlement beside a producing tile with that number takes its resource. A city earns two. On a 7, resolve the robber instead. Then trade and spend resources to build.",
    win: "Reach 10 points on your turn. Each settlement gives you one point and each city gives you two. Some cards and awards also score.",
    rules: "https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf",
  },
  Sequence: {
    audio: "/lessons/sequence.mp3",
    setup:
      "Choose chip colors and alternate seats by team. Shuffle and deal seven cards each for two players or six each for three or four. For larger groups, use the deal chart in the rules.",
    turn: "Play one card, cover an open matching space with a chip, then draw a card. A two-eyed jack lets you choose any open space. A one-eyed jack removes an opponent’s chip outside a completed line.",
    win: "Make five in a row across, down, or diagonally. With two sides you need two lines. With three sides you need one. A corner counts for every color.",
  },
  Uno: {
    audio: "/lessons/uno.mp3",
    setup:
      "Deal seven cards to each player. Stack the rest face down and turn one card over to start the discard pile.",
    turn: "Match the top card’s color, number, or symbol, or play a legal wild. If you draw one card, you may play it immediately if it fits. Say “UNO” when you play down to one card.",
    win: "Empty your hand to win the round. Under classic scoring, the winner scores the cards left in everyone else’s hands. The first player to reach 500 points wins.",
  },
  "Left Right Center": {
    audio: "/lessons/left-right-center.mp3",
    setup:
      "Give everyone three chips. Pick a starting player and leave room in the middle for the pot.",
    turn: "Roll one die per chip you hold, up to three. Each L sends one chip left, each R sends one right, and each C sends one to the center. Keep a chip for each dot, then pass the dice left.",
    win: "Be the last player holding chips. If you run out, skip your roll. A neighbor can still pass you a chip on a later turn.",
  },
};

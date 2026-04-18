// Scrape source URL map keyed by game_catalog.slug.
// Verified 2026-04-18: rulebook PDFs return 200 application/pdf on the publisher's
// own domain; reddit threads return real content via the reddit JSON API.
// BGG URLs are canonical board-game IDs (BGG blocks automated fetches, so verified
// via Google search listings rather than direct fetch).

export type UrlCategory =
  | "bgg-forum"
  | "rulebook-pdf"
  | "reddit-thread"
  | "publisher-page";

export interface ScrapeSource {
  url: string;
  category: UrlCategory;
}

export const SCRAPE_SOURCES: Record<string, ScrapeSource[]> = {
  "skip-bo": [
    { url: "https://boardgamegeek.com/boardgame/1269/skip-bo", category: "bgg-forum" },
    { url: "https://service.mattel.com/instruction_sheets/42050.pdf", category: "rulebook-pdf" },
    { url: "https://www.reddit.com/r/boardgames/comments/1s7yk9w/question_about_skipbo_rules/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/gaming/comments/7euoc1/is_the_skip_bo_card_game_fun_for_adults/", category: "reddit-thread" },
  ],

  "phase-10": [
    { url: "https://boardgamegeek.com/boardgame/1258/phase-10", category: "bgg-forum" },
    { url: "https://service.mattel.com/instruction_sheets/W4729-Eng.pdf", category: "rulebook-pdf" },
    { url: "https://www.reddit.com/r/boardgames/comments/183lhz/phase_10_how_can_people_like_this_game/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/boardgames/comments/1eetjap/phase_10_how_to_get_past_phase_8/", category: "reddit-thread" },
  ],

  "catan": [
    { url: "https://boardgamegeek.com/boardgame/13/catan", category: "bgg-forum" },
    { url: "https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf", category: "rulebook-pdf" },
    { url: "https://www.reddit.com/r/Catan/comments/1h0t538/what_is_the_biggest_mistake_that_people_make_in/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/Catan/comments/1bm5dsp/whats_your_must_know_tip_and_trick_in_catan_game/", category: "reddit-thread" },
  ],

  "ticket-to-ride": [
    { url: "https://boardgamegeek.com/boardgame/9209/ticket-to-ride", category: "bgg-forum" },
    { url: "https://ncdn0.daysofwonder.com/tickettoride/en/img/tt_rules_2015_en.pdf", category: "rulebook-pdf" },
    { url: "https://www.reddit.com/r/boardgames/comments/1lsgmow/i_need_high_level_strategies_to_win_ticket_to_ride/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/tickettoride/comments/esm8j7/ticket_to_ride_europe_tunnel_rule_clarification/", category: "reddit-thread" },
  ],

  // Folk / public-domain game. No canonical publisher rulebook PDF exists.
  // BLOCKED on 2026-04-18 pending human decision: skip, substitute, or provide URL?
  "jokers-and-marbles": [
    { url: "https://boardgamegeek.com/boardgame/31770/joker-marbles", category: "bgg-forum" },
    { url: "https://www.reddit.com/r/FiftyTwoCards/comments/16kdek8/marbles_and_jokers_anyone_else_ever_play_this/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/boardgames/comments/18xg9tk/pegs_and_jokers/", category: "reddit-thread" },
  ],

  "qwixx": [
    { url: "https://boardgamegeek.com/boardgame/131260/qwixx", category: "bgg-forum" },
    { url: "https://gamewright.com/pdfs/Rules/QwixxTM-RULES.pdf", category: "rulebook-pdf" },
    { url: "https://www.reddit.com/r/boardgames/comments/1mpoizc/please_settle_a_qwixx_rules_debate_for_me/", category: "reddit-thread" },
    { url: "https://www.reddit.com/r/boardgames/comments/18qvfmn/qwixx_disagreement_as_the_roller/", category: "reddit-thread" },
  ],
};

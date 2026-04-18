-- Phase 0 pilot catalog. Idempotent: safe to re-run.

insert into game_catalog (slug, name, publisher, min_players, max_players, play_time_min, play_time_max, complexity, description) values
  ('skip-bo',            'Skip-Bo',             'Mattel',           2, 6, 15,  60, 1.3, 'Sequential card game where players race to play all the cards in their personal stockpile in numeric order from 1 to 12.'),
  ('phase-10',           'Phase 10',            'Mattel',           2, 6, 45,  60, 1.8, 'Rummy-style card game where players must complete ten specific phases (sets and runs) in order across successive hands.'),
  ('catan',              'Settlers of Catan',   'Catan Studio',     3, 4, 60, 120, 2.3, 'Resource-trading and settlement-building game played on a modular hex island, with players competing to reach ten victory points.'),
  ('ticket-to-ride',     'Ticket to Ride',      'Days of Wonder',   2, 5, 30,  60, 1.8, 'Route-building game in which players collect matching train cards to claim railway routes across a map of North America.'),
  ('jokers-and-marbles', 'Jokers and Marbles',  'Public domain',    2, 8, 30,  90, 2.5, 'Team-based race game played with marbles and a deck of cards, where players move marbles around a pegboard track from start to home.'),
  ('qwixx',              'Qwixx',               'Gamewright',       2, 5, 15,  15, 1.0, 'Fast roll-and-write dice game where players mark off numbers in four colored rows on a shared score sheet, with restrictions tightening as numbers are crossed.')
on conflict (slug) do nothing;

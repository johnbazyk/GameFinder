-- Preserve every owned entry; remove only conflicting Wishlist rows.
delete from vault_games as wish
where wish.list = 'wishlist'
  and exists (
    select 1 from vault_games as own
    where own.user_id = wish.user_id and own.bgg_id = wish.bgg_id and own.list = 'owned'
  );
-- A game can occupy at most one collection state per account.
create unique index if not exists vault_games_one_collection_per_game
  on vault_games (user_id, bgg_id);

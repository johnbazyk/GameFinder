-- Player piece color, chosen at sign-up. Used on dice and in-app pieces.
alter table profiles
  add column if not exists piece_color text not null default '#e8642b';

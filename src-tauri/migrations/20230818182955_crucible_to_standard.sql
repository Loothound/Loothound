-- Add migration script here
UPDATE stashes SET league = "Standard" WHERE league = "Crucbile";
UPDATE profiles SET league_id = "Standard" WHERE league_id = "Crucible";
UPDATE profiles SET pricing_league = "Standard" WHERE pricing_league = "Crucible";
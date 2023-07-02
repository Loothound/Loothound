CREATE TABLE stashes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL
);

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    league_id TEXT NOT NULL,
    pricing_league TEXT NOT NULL
);

CREATE TABLE profile_stash_assoc (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL,
    stash_id TEXT NOT NULL,

    FOREIGN KEY(profile_id) REFERENCES profiles(id),
    FOREIGN KEY(stash_id) REFERENCES stashes(id)
);

CREATE TABLE item (
    id INTEGER PRIMARY KEY,
    base_type TEXT NOT NULL,
    base_line TEXT NOT NULL,
    raw_data TEXT NOT NULL
);

CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY,
    stash_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,

    FOREIGN KEY(stash_id) REFERENCES stashes(id),
    FOREIGN KEY(item_id) REFERENCES item(id)
);
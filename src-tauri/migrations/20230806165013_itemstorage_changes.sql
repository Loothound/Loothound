DROP TABLE snapshots;
DROP TABLE item;

CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY,
    profile_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    pricing_revision INTEGER NOT NULL,
    value REAL NOT NULL,

    FOREIGN KEY(profile_id) REFERENCES profiles(id)
) STRICT;

CREATE TABLE item (
    id INTEGER PRIMARY KEY,
    snapshot_id INTEGER NOT NULL,
    stash_id TEXT NOT NULL,
    data TEXT NOT NULL,

    FOREIGN KEY(stash_id) REFERENCES stashes(id),
    FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
) STRICT;
CREATE TABLE price (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    revision INTEGER NOT NULL,
    fully_linked BOOLEAN NOT NULL DEFAULT 0
);
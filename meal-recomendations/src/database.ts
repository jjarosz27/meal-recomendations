import { Database } from "bun:sqlite";

export const db = new Database("../data/database.sqlite", {
    create: true
});

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

// Tabela przepisów
db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL
    )
`);

// Tabela składników
db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,

        FOREIGN KEY (recipe_id)
            REFERENCES recipes(id)
            ON DELETE CASCADE,

        UNIQUE(recipe_id, position)
    )
`);

// Tabela kroków
db.run(`
    CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        content TEXT NOT NULL,

        FOREIGN KEY (recipe_id)
            REFERENCES recipes(id)
            ON DELETE CASCADE,

        UNIQUE(recipe_id, position)
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS hidden_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,

        FOREIGN KEY (recipe_id)
            REFERENCES recipes(id)
            ON DELETE CASCADE,

        UNIQUE(recipe_id, position)
    )
`);

db.close();

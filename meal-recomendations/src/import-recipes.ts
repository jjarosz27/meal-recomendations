import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";

// Połączenie z bazą
const db = new Database("../data/database.sqlite");

db.run("PRAGMA foreign_keys = ON;");

// Odczyt JSON
const recipes = JSON.parse(
    readFileSync("../data/recipes.json", "utf-8")
);

// Przygotowanie zapytań SQL
const insertRecipe = db.prepare(`
    INSERT INTO recipes (title)
    VALUES (?)
`);

const insertIngredient = db.prepare(`
    INSERT INTO ingredients (recipe_id, position, name)
    VALUES (?, ?, ?)
`);

const insertHiddenIngredient = db.prepare(`
    INSERT INTO hidden_ingredients (recipe_id, position, name)
    VALUES (?, ?, ?)
`);

const insertStep = db.prepare(`
    INSERT INTO steps (recipe_id, position, content)
    VALUES (?, ?, ?)
`);

// Import przepisów
const importRecipes = db.transaction(() => {

    let imported = 0;

    for (const recipe of recipes) {

        // Walidacja danych
        if (
            typeof recipe.title !== "string" ||
            !Array.isArray(recipe.ingredients) ||
            !Array.isArray(recipe.hidden_ingredients) ||
            !Array.isArray(recipe.steps) ||
            !recipe.ingredients.every((item: unknown) => typeof item === "string") ||
            !recipe.hidden_ingredients.every((item: unknown) => typeof item === "string") ||
            !recipe.steps.every((item: unknown) => typeof item === "string")
        ) {
            throw new Error(`Nieprawidłowy przepis: ${recipe.title ?? "bez tytułu"}`);
        }

        // Zapis przepisu
        const result = insertRecipe.run(recipe.title);
        const recipeId = Number(result.lastInsertRowid);

        // Zapis składników
        recipe.ingredients.forEach((ingredient: string, index: number) => {
            insertIngredient.run(recipeId, index, ingredient);
        });

        // Zapis ukrytych składników
        recipe.hidden_ingredients.forEach((ingredient: string, index: number) => {
            insertHiddenIngredient.run(recipeId, index, ingredient);
        });

        // Zapis kroków
        recipe.steps.forEach((step: string, index: number) => {
            insertStep.run(recipeId, index, step);
        });

        imported++;
    }

    return imported;
});

// Wykonanie importu
try {
    const count = importRecipes();
    console.log(`Zaimportowano ${count} przepisów!`);
} catch (error) {
    console.error("Błąd importowania:", error);
} finally {
    db.close();
}
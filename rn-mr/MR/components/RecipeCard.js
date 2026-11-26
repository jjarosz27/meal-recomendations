
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

function RecipeCard({ recipe, onPress, fridgeProducts = [] }) {
  const isError = recipe.tytuł?.trim().toLowerCase() === 'błąd';

  const ingredients = Array.isArray(recipe.hidden_ingredients)
  ? recipe.hidden_ingredients
  : Array.isArray(recipe['składniki proste'])
    ? recipe['składniki proste']
    : [];

  // Normalizacja: małe litery i usunięcie zbędnych spacji
  const normalize = value =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

  const normalizedFridge = fridgeProducts.map(normalize);

  // Sprawdzamy, które składniki użytkownik posiada
  const ingredientMatches = ingredients.map(ingredient =>
    normalizedFridge.includes(normalize(ingredient))
  );

  const matchedCount = ingredientMatches.filter(Boolean).length;

  // Dopasowanie: ile składników przepisu użytkownik posiada
  const matchPercentage = ingredients.length > 0
    ? Math.round((matchedCount / ingredients.length) * 100)
    : 0;

  // Wykorzystanie: ile produktów z lodówki wykorzystuje przepis
  const usedFridgeCount = normalizedFridge.filter(product =>
    ingredients.some(ingredient => normalize(ingredient) === product)
  ).length;

  const usagePercentage = normalizedFridge.length > 0
    ? Math.round((usedFridgeCount / normalizedFridge.length) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isError ? styles.errorContainer : styles.normalContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.title,
          isError ? styles.errorText : styles.normalText,
        ]}
      >
        {recipe.tytuł || 'Bez tytułu'}
      </Text>

      {!isError && (
        <View style={styles.percentagesContainer}>
          <View style={styles.percentageBox}>
            <Text style={styles.percentageLabel}>Wykorzystanie</Text>
            <Text style={styles.usagePercentage}>
              {usagePercentage}%
            </Text>
          </View>

          <View style={styles.percentageBox}>
            <Text style={styles.percentageLabel}>Dopasowanie</Text>
            <Text style={styles.matchPercentage}>
              {matchPercentage}%
            </Text>
          </View>
        </View>
      )}

      <View style={styles.ingredientsContainer}>
        {ingredients.map((ingredient, index) => (
          <Text
            key={index}
            style={[
              styles.ingredient,
              isError
                ? styles.errorText
                : ingredientMatches[index]
                  ? styles.normalText
                  : styles.missingIngredient,
            ]}
          >
            • {ingredient}
          </Text>
        ))}
      </View>

      <Text
        style={[
          styles.footer,
          isError ? styles.errorText : styles.normalText,
        ]}
      >
        Kliknij, aby zobaczyć szczegóły
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  normalContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#222222',
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    borderColor: '#D32F2F',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  percentagesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  percentageBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 90,
  },
  percentageLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  usagePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#237A35',
  },
  matchPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  ingredientsContainer: {
    gap: 5,
  },
  ingredient: {
    fontSize: 14,
  },
  missingIngredient: {
    color: '#D32F2F',
  },
  footer: {
    fontSize: 12,
    marginTop: 15,
    opacity: 0.7,
  },
  normalText: {
    color: '#222222',
  },
  errorText: {
    color: '#C62828',
  },
});

export default RecipeCard;

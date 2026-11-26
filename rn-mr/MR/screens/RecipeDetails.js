
import React, { useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function RecipeDetails({ recipe, onBack }) {
  const insets = useSafeAreaInsets();

  const isError = recipe.tytuł?.trim().toLowerCase() === 'błąd';

  const ingredients = Array.isArray(recipe.składniki)
    ? recipe.składniki
    : [];

  const steps = Array.isArray(recipe['lista kroków'])
    ? recipe['lista kroków']
    : Array.isArray(recipe.kroki)
      ? recipe.kroki
      : [];

  // Obsługa systemowego cofania Androida
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      }
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Powrót</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, isError && styles.errorText]}>
          {recipe.tytuł || 'Bez tytułu'}
        </Text>

        <Text style={[styles.sectionTitle, isError && styles.errorText]}>
          Składniki
        </Text>

        {ingredients.map((ingredient, index) => (
          <Text
            key={index}
            style={[styles.ingredient, isError && styles.errorText]}
          >
            • {ingredient}
          </Text>
        ))}

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, isError && styles.errorText]}>
          Sposób przygotowania
        </Text>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <Text style={[styles.stepNumber, isError && styles.errorText]}>
              {index + 1}.
            </Text>

            <Text style={[styles.stepText, isError && styles.errorText]}>
              {step}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 5,
    paddingBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 15,
  },
  ingredient: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 25,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    width: 30,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: '#333333',
  },
  errorText: {
    color: '#C62828',
  },
});

export default RecipeDetails;

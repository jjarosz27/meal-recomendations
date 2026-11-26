
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import RecipeCard from '../components/RecipeCard';
import RecipeDetails from './RecipeDetails';

// dom
const API_URL = 'http://192.168.33.6:3000/api/chat';
//uczelnia 111 5.0
//const API_URL = 'http://192.168.50.208:3000/api/chat';
//hotspot
//const API_URL = 'http://10.105.44.199:3000/api/chat';

const STORAGE_KEY = '@PrzepisyApp:fridge';

// Parsowanie odpowiedzi Gemini
function parseRecipes(response) {
  // Usuwamy znaczniki Markdown
  let cleanedResponse = response.trim();

  cleanedResponse = cleanedResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(cleanedResponse);
  } catch (error) {
    // Próba znalezienia JSON wewnątrz dodatkowego tekstu
    const firstArray = cleanedResponse.indexOf('[');
    const firstObject = cleanedResponse.indexOf('{');

    let start;

    if (firstArray === -1) {
      start = firstObject;
    } else if (firstObject === -1) {
      start = firstArray;
    } else {
      start = Math.min(firstArray, firstObject);
    }

    if (start === -1) {
      throw new Error('Gemini nie zwróciło poprawnego JSON.');
    }

    const lastArray = cleanedResponse.lastIndexOf(']');
    const lastObject = cleanedResponse.lastIndexOf('}');

    const end = Math.max(lastArray, lastObject);

    if (end === -1 || end < start) {
      throw new Error('Nie udało się odczytać JSON.');
    }

    parsed = JSON.parse(cleanedResponse.substring(start, end + 1));
  }

  // Pojedynczy obiekt zamieniamy na tablicę
  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  if (parsed.length === 0) {
    throw new Error('Gemini nie zwróciło żadnych przepisów.');
  }

  // Sprawdzamy strukturę każdego przepisu
  parsed.forEach((recipe, index) => {
    if (
      !recipe ||
      typeof recipe !== 'object' ||
      Array.isArray(recipe) ||
      typeof recipe.tytuł !== 'string' ||
      !Array.isArray(recipe.składniki) ||
      !Array.isArray(recipe['kroki'])
    ) {
      throw new Error(`Nieprawidłowa struktura przepisu nr ${index + 1}.`);
    }
  });

  return parsed;
}

function MainRecommend() {
  const [products, setProducts] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [standardMode, setStandardMode] = useState(true);

  // Wczytywanie produktów z lodówki
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const savedProducts = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedProducts !== null) {
          setProducts(savedProducts);
        }
      } catch (err) {
        console.error('Błąd odczytu lodówki:', err);
        setError('Nie udało się odczytać listy produktów.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Wysyłanie zapytania do Gemini
  const generateRecipes = async () => {
    if (!products.trim()) {
      setError('Twoja lodówka jest pusta! Najpierw dodaj produkty.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setRecipes([]);
    setSelectedRecipe(null);

    try {
      const message = products
    .split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0);

      const endpoint = standardMode ? '/api/chat' : '/api/search';

      const apiResponse = await fetch(
        API_URL.replace('/api/chat', endpoint),
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Błąd komunikacji z serwerem.');
      }

      if (typeof data.response !== 'string') {
        throw new Error('Serwer zwrócił nieprawidłową odpowiedź.');
      }

      const parsedRecipes = parseRecipes(data.response);

      setRecipes(parsedRecipes);

    } catch (err) {
      console.error('Błąd generowania przepisów:', err);

      setError(
        err.message === 'Network request failed'
          ? 'Nie można połączyć się z serwerem. Sprawdź adres IP i połączenie sieciowe.'
          : err.message
      );

    } finally {
      setIsGenerating(false);
    }
  };

  // Wyświetlanie szczegółów wybranego przepisu
  if (selectedRecipe !== null) {
    return (
      <RecipeDetails
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >

        <View style={styles.titleRow}>
          <Text style={styles.title}>Przepisy</Text>

          <Switch
            value={standardMode}
            onValueChange={setStandardMode}
            trackColor={{
              false: '#BDBDBD',
              true: '#4CAF50',
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.description}>
          Wygeneruj propozycje przepisów na podstawie produktów
          znajdujących się w Twojej lodówce.
        </Text>

        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>
            Twoje składniki
          </Text>

          <Text style={styles.products}>
            {products.trim() || 'Brak zapisanych produktów.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            isGenerating && styles.buttonDisabled,
          ]}
          onPress={generateRecipes}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {standardMode ? 'Generuj przepisy' : 'Szukaj przepisów'}
            </Text>
          )}
        </TouchableOpacity>

        {error !== '' && (
          <Text style={styles.error}>
            {error}
          </Text>
        )}

        {recipes.length > 0 && (
          <View style={styles.recipesContainer}>
            <Text style={styles.sectionTitle}>
              Propozycje przepisów ({recipes.length})
            </Text>

            {recipes.map((recipe, index) => (
              <RecipeCard
                key={index}
                recipe={recipe}
                fridgeProducts={products
                  .split('\n')
                  .map(item => item.trim())
                  .filter(item => item.length > 0)}
                onPress={() => setSelectedRecipe(recipe)}
              />
            ))}
          </View>
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 25,
  },

  productsContainer: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
  },

  products: {
    fontSize: 15,
    color: '#444444',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },

  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  error: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 15,
  },

  recipesContainer: {
    marginTop: 30,
  },
});

export default MainRecommend;

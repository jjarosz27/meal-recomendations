
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@PrzepisyApp:fridge';

function FridgeScreen() {
  const [products, setProducts] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Wczytywanie zapisanej listy przy otwieraniu ekranu
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const savedProducts = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedProducts !== null) {
          setProducts(savedProducts);
        }
      } catch (error) {
        console.error('Błąd wczytywania produktów:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Automatyczny zapis po każdej zmianie tekstu
  const handleTextChange = async (text) => {
    setProducts(text);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, text);
    } catch (error) {
      console.error('Błąd zapisywania produktów:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Lodówka</Text>

      <Text style={styles.description}>
        Lista posiadanych produktów i składników.
        Każdy produkt możesz wpisać w osobnej linii.
      </Text>

      <TextInput
        style={styles.input}
        multiline={true}
        value={products}
        onChangeText={handleTextChange}
        placeholder={'Np.\nMleko 2%\nTwaróg chudy\nTuńczyk\nMakaron'}
        placeholderTextColor="#999999"
        textAlignVertical="top"
        autoCorrect={false}
      />

      <Text style={styles.info}>
        Zmiany zapisywane są automatycznie.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },

  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#222222',
  },

  info: {
    fontSize: 12,
    color: '#888888',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default FridgeScreen;

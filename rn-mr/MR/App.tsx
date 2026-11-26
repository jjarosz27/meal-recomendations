
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import MainScreen from './screens/MainRecommend';
import FridgeScreen from './screens/Fridge';
import BottomBar from './components/BottomBar';

function AppContent() {
  const [activeScreen, setActiveScreen] = useState('recipes');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>

      <View
        style={[
          styles.screen,
          { paddingTop: insets.top },
          activeScreen !== 'recipes' && styles.hiddenScreen,
        ]}
      >
        <MainScreen />
      </View>

      <View
        style={[
          styles.screen,
          { paddingTop: insets.top },
          activeScreen !== 'fridge' && styles.hiddenScreen,
        ]}
      >
        <FridgeScreen />
      </View>

      <BottomBar
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
      />

    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  screen: {
    flex: 1,
  },

  hiddenScreen: {
    display: 'none',
  },
});

export default App;

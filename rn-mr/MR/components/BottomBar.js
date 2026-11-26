
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BottomBar({ activeScreen, onScreenChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom }
    ]}>

      <View style={styles.bar}>

        <TouchableOpacity
          style={styles.item}
          onPress={() => onScreenChange('recipes')}
        >
          <Text style={[
            styles.label,
            activeScreen === 'recipes' && styles.activeLabel
          ]}>
            Przepisy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => onScreenChange('fridge')}
        >
          <Text style={[
            styles.label,
            activeScreen === 'fridge' && styles.activeLabel
          ]}>
            Lodówka
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },

  bar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 14,
    color: '#888888',
  },

  activeLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default BottomBar;

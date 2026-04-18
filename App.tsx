import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PokedexScreen } from './screens/PokedexScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <PokedexScreen />
    </SafeAreaProvider>
  );
}

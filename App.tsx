import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PokedexScreen } from './screens/PokedexScreen';
import { PokemonDetailScreen } from './screens/PokemonDetailScreen';
import type { RootStackParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Pokedex">
            <Stack.Screen
              name="Pokedex"
              component={PokedexScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PokemonDetail"
              component={PokemonDetailScreen}
              options={{ title: 'Detalhes' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

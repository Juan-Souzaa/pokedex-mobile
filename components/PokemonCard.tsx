import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Pokemon } from '../types/Pokemon';
import type { RootStackParamList } from '../types/navigation';
import { capitalize } from '../utils/format';

interface Props {
  pokemon: Pokemon;
}

type Nav = StackNavigationProp<RootStackParamList, 'Pokedex'>;

export const PokemonCard = ({ pokemon }: Props) => {
  const navigation = useNavigation<Nav>();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        navigation.navigate('PokemonDetail', { pokemonId: pokemon.id })
      }
    >
      {pokemon.image ? (
        <Image source={{ uri: pokemon.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <Text style={styles.name}>{capitalize(pokemon.name)}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    margin: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  pressed: { opacity: 0.85 },
  image: { width: 80, height: 80 },
  imagePlaceholder: { backgroundColor: '#ccc' },
  name: { marginTop: 8, fontWeight: 'bold' },
});

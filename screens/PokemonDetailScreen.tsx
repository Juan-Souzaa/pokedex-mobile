import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getPokemonById,
  getPokemonSpeciesFlavorText,
} from '../services/api';
import type { PokemonDetail } from '../types/Pokemon';
import type { RootStackParamList } from '../types/navigation';
import { capitalize } from '../utils/format';

type DetailRoute = RouteProp<RootStackParamList, 'PokemonDetail'>;
type DetailNav = StackNavigationProp<RootStackParamList, 'PokemonDetail'>;

export const PokemonDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { pokemonId } = route.params;

  const [detail, setDetail] = useState<PokemonDetail | null>(null);
  const [flavorText, setFlavorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await getPokemonById(pokemonId);
        if (cancelled) return;
        setDetail(d);
        navigation.setOptions({ title: capitalize(d.name) });
        try {
          const flavor = await getPokemonSpeciesFlavorText(pokemonId);
          if (!cancelled) setFlavorText(flavor);
        } catch {
          if (!cancelled) setFlavorText(null);
        }
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar este Pokémon.');
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pokemonId, navigation]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Text style={styles.error}>{error ?? 'Pokémon não encontrado.'}</Text>
      </View>
    );
  }

  const heightM = (detail.height / 10).toFixed(1);
  const weightKg = (detail.weight / 10).toFixed(1);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + 24 },
      ]}
    >
      {detail.image ? (
        <Image source={{ uri: detail.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <Text style={styles.name}>{capitalize(detail.name)}</Text>
      <Text style={styles.meta}>
        Altura: {heightM} m · Peso: {weightKg} kg
      </Text>
      <View style={styles.typesRow}>
        {detail.types.map((t) => (
          <View key={t} style={styles.typeChip}>
            <Text style={styles.typeText}>{capitalize(t)}</Text>
          </View>
        ))}
      </View>
      {flavorText ? (
        <Text style={styles.description}>{flavorText}</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  error: { fontSize: 16, textAlign: 'center', color: '#666' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, alignItems: 'center' },
  image: { width: 200, height: 200, resizeMode: 'contain' },
  imagePlaceholder: { backgroundColor: '#e5e5e5' },
  name: { fontSize: 28, fontWeight: 'bold', marginTop: 12 },
  meta: { fontSize: 16, color: '#444', marginTop: 8 },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  typeChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: { fontWeight: '600' },
  description: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
  },
});

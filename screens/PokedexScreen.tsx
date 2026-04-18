import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPokemons, getPokemonDetails } from '../services/api';
import { Pokemon } from '../types/Pokemon';
import { PokemonCard } from '../components/PokemonCard';

const PAGE_SIZE = 30;

export const PokedexScreen = () => {
  const insets = useSafeAreaInsets();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreLock = useRef(false);

  const loadInitial = useCallback(async () => {
    loadingMoreLock.current = false;
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    setNextOffset(0);
    try {
      const list = await getPokemons(PAGE_SIZE, 0);
      const details = await Promise.all(
        list.map((p) => getPokemonDetails(p.url)),
      );
      setPokemons(details);
      setNextOffset(list.length);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setError(
        'Falha ao carregar Pokémons. Verifique sua conexão.',
      );
      setPokemons([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMorePokemons = useCallback(async () => {
    if (isLoading || !hasMore || loadingMoreLock.current) return;
    loadingMoreLock.current = true;
    setIsLoadingMore(true);
    try {
      const list = await getPokemons(PAGE_SIZE, nextOffset);
      if (list.length === 0) {
        setHasMore(false);
        return;
      }
      const details = await Promise.all(
        list.map((p) => getPokemonDetails(p.url)),
      );
      setPokemons((prev) => [...prev, ...details]);
      setNextOffset((prev) => prev + list.length);
      setHasMore(list.length === PAGE_SIZE);
    } finally {
      loadingMoreLock.current = false;
      setIsLoadingMore(false);
    }
  }, [isLoading, hasMore, nextOffset]);

  const query = search.trim().toLowerCase();
  const filtered = pokemons.filter((p) =>
    p.name.toLowerCase().includes(query),
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 16 }]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando Pokémons…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={loadInitial}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>Pokédex</Text>
      <TextInput
        placeholder="Buscar pokémon..."
        style={styles.input}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => <PokemonCard pokemon={item} />}
        onEndReached={loadMorePokemons}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.length > 0
              ? `Nenhum Pokémon encontrado para '${search.trim()}'.`
              : 'Nenhum Pokémon para exibir no momento.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centered: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorText: { textAlign: 'center', fontSize: 16, marginBottom: 16 },
  retry: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#444',
  },
  footerLoader: { marginVertical: 16 },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function mergeUniqueById(prev: Pokemon[], next: Pokemon[]): Pokemon[] {
  const seen = new Set(prev.map((p) => p.id));
  const out = [...prev];
  for (const p of next) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export const PokedexScreen = () => {
  const insets = useSafeAreaInsets();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreLock = useRef(false);
  const listOffsetRef = useRef(0);
  const endReachedCooldownRef = useRef(false);

  const loadInitial = useCallback(async () => {
    loadingMoreLock.current = false;
    endReachedCooldownRef.current = false;
    listOffsetRef.current = 0;
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const list = await getPokemons(PAGE_SIZE, 0);
      const details = await Promise.all(
        list.map((p) => getPokemonDetails(p.url)),
      );
      setPokemons(mergeUniqueById([], details));
      listOffsetRef.current = list.length;
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setError(
        'Falha ao carregar Pokémons. Verifique sua conexão.',
      );
      setPokemons([]);
      setHasMore(false);
      listOffsetRef.current = 0;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMorePokemons = useCallback(async () => {
    if (
      isLoading ||
      !hasMore ||
      loadingMoreLock.current ||
      endReachedCooldownRef.current
    ) {
      return;
    }
    const offset = listOffsetRef.current;
    loadingMoreLock.current = true;
    setIsLoadingMore(true);
    try {
      const list = await getPokemons(PAGE_SIZE, offset);
      if (list.length === 0) {
        setHasMore(false);
        return;
      }
      const details = await Promise.all(
        list.map((p) => getPokemonDetails(p.url)),
      );
      setPokemons((prev) => mergeUniqueById(prev, details));
      listOffsetRef.current = offset + list.length;
      setHasMore(list.length === PAGE_SIZE);
    } finally {
      loadingMoreLock.current = false;
      setIsLoadingMore(false);
      endReachedCooldownRef.current = true;
      setTimeout(() => {
        endReachedCooldownRef.current = false;
      }, 450);
    }
  }, [isLoading, hasMore]);

  const query = search.trim().toLowerCase();
  const isSearching = search.trim().length > 0;
  const handleEndReached = useCallback(() => {
    if (!isSearching) loadMorePokemons();
  }, [isSearching, loadMorePokemons]);

  const filtered = useMemo(() => {
    const arr = pokemons.filter((p) =>
      p.name.toLowerCase().includes(query),
    );
    const seen = new Set<number>();
    return arr.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [pokemons, query]);

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
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => <PokemonCard pokemon={item} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.15}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerSlot}>
              {isLoadingMore ? (
                <ActivityIndicator style={styles.footerLoader} />
              ) : null}
            </View>
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
  footerSlot: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: { marginVertical: 8 },
});

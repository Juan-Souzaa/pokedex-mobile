import axios from 'axios';
import { Pokemon, PokemonDetail, PokemonListItem } from '../types/Pokemon';

const API_BASE = 'https://pokeapi.co/api/v2';

export async function getPokemons(
  limit: number,
  offset = 0,
): Promise<PokemonListItem[]> {
  try {
    const res = await axios.get(
      `${API_BASE}/pokemon?limit=${limit}&offset=${offset}`,
    );
    return res.data.results;
  } catch (error) {
    console.error('getPokemons', error);
    throw error;
  }
}

export async function getPokemonDetails(url: string): Promise<Pokemon> {
  try {
    const res = await axios.get(url);
    const d = res.data;
    const typesRaw = Array.isArray(d?.types) ? d.types : [];
    return {
      id: d?.id ?? 0,
      name: d?.name ?? 'unknown',
      image: d?.sprites?.front_default ?? '',
      types: typesRaw
        .map((t: { type?: { name?: string } }) => t.type?.name ?? '')
        .filter((n: string) => n.length > 0),
    };
  } catch (error) {
    console.error('getPokemonDetails', error);
    throw error;
  }
}

export async function getPokemonById(id: number): Promise<PokemonDetail> {
  try {
    const res = await axios.get(`${API_BASE}/pokemon/${id}`);
    const d = res.data;
    const typesRaw = Array.isArray(d?.types) ? d.types : [];
    return {
      id: d?.id ?? id,
      name: d?.name ?? 'unknown',
      image: d?.sprites?.front_default ?? '',
      types: typesRaw
        .map((t: { type?: { name?: string } }) => t.type?.name ?? '')
        .filter((n: string) => n.length > 0),
      height: typeof d?.height === 'number' ? d.height : 0,
      weight: typeof d?.weight === 'number' ? d.weight : 0,
    };
  } catch (error) {
    console.error('getPokemonById', error);
    throw error;
  }
}


export async function getPokemonSpeciesFlavorText(
  speciesId: number,
): Promise<string | null> {
  try {
    const res = await axios.get(`${API_BASE}/pokemon-species/${speciesId}`);
    const entries = (Array.isArray(res.data?.flavor_text_entries)
      ? res.data.flavor_text_entries
      : []) as Array<{
      flavor_text: string;
      language: { name: string };
    }>;
    const pt = entries.find((e) => e.language.name === 'pt-BR');
    const en = entries.find((e) => e.language.name === 'en');
    const raw = pt?.flavor_text ?? en?.flavor_text ?? null;
    if (!raw) return null;
    return raw.replace(/\f/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('getPokemonSpeciesFlavorText', error);
    throw error;
  }
}

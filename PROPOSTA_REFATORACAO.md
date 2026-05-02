# Exercício 2 — Proposta de refatoração da `PokedexScreen` (MVVM)

---

## Padrão escolhido: MVVM

**MVVM** encaixa melhor aqui do que MVP “clássico”: no React Native o ViewModel vira um **hook** (`usePokedexViewModel`), a View segue sendo componente e o hook segura estado e efeitos. MVP com Presenter tende a View + interface explícita + presenter chamando métodos — funciona, mas no React costuma gerar mais **fricção** e boilerplate sem ganho óbvio neste caso.

O **model** já está em `types/Pokemon.ts` e `services/api.ts`. O ViewModel não reinventa a PokéAPI; **orquestra** chamadas e expõe o que a tela precisa renderizar.

---

## Nova estrutura de pastas (só pra tela da Pokédex)

Manter `App.tsx` na raiz e criar uma pasta só da listagem, algo nesta linha:

```text
PokedexApp/
├─ App.tsx
├─ screens/
│  └─ Pokedex/
│     ├─ PokedexScreen.tsx       ← View (só UI + repasse de eventos)
│     └─ usePokedexViewModel.ts  ← ViewModel (estado + lógica de tela)
├─ components/
│  └─ PokemonCard.tsx
├─ services/
│  └─ api.ts
├─ types/
│  ├─ Pokemon.ts
│  └─ navigation.ts
└─ utils/
   └─ format.ts
```

Se o retorno do hook inchasse, dá pra acrescentar `pokedexViewModel.types.ts` — mas começaria sem isso pra não overengineering.

O `PokemonCard` pode ficar em `components/`; só faria sentido mover pra `Pokedex/` se *só* a listagem usasse esse layout.

---

## Quem faz o quê

### View — `PokedexScreen.tsx`

- Montar o layout: título “Pokédex”, `TextInput`, `FlatList`, mensagens de lista vazia.
- Tratar **safe area** (`useSafeAreaInsets`) e `StyleSheet` — como na tela atual.
- **Não** carregar a lógica de offset, `mergeUniqueById`, nem trava de `onEndReached` — isso vai pro hook.

Na prática, a tela faria algo assim (ideia, não é patch real):

```tsx
const vm = usePokedexViewModel();

if (vm.isLoading) { /* tela de loading inicial */ }
if (vm.error) { /* erro + botão que chama vm.retry */ }

return (
  <>
    <TextInput value={vm.searchQuery} onChangeText={vm.setSearchQuery} />
    <FlatList
      data={vm.filteredPokemons}
      onEndReached={vm.loadMore}
      renderItem={({ item }) => <PokemonCard pokemon={item} />}
    />
  </>
);
```

Ou seja: a View **lê estado pronto e dispara ações** — espírito parecido com TanStack Query, só que o “client” seria o hook.

### ViewModel — `usePokedexViewModel.ts`

Aqui entraria o que hoje está na `PokedexScreen`:

- Carregar a primeira página + `Promise.all` dos detalhes.
- `loadMore` com os mesmos guard clauses (`isLoading`, `!hasMore`, locks com `useRef`, cooldown do `onEndReached`).
- Estado `searchQuery` e o `useMemo` que gera a lista filtrada (equivalente ao `filtered` atual).
- `retry` chamando o mesmo fluxo do `loadInitial`.
- Expor pro JSX: `filteredPokemons` (ou só esse nome na lista), `isLoading`, `isLoadingMore`, `error`, `hasMore`, `setSearchQuery`, `loadMore`, `retry`.

O hook **chama** `getPokemons` / `getPokemonDetails` do `api.ts`; não duplica DTO. `mergeUniqueById` pode ficar no topo do arquivo do hook ou ir pra `utils/pokemonList.ts` se quiser teste unitário puro.

---

## Fluxo quando o usuário digita na busca

No fluxo MVVM descrito acima:

1. O usuário digita no `TextInput`.
2. O `onChangeText` chama `setSearchQuery` exposto pelo `usePokedexViewModel`.
3. Dentro do hook, `searchQuery` atualiza com `useState`.
4. Um `useMemo` recalcula a lista filtrada (trim, lowercase, `includes` no nome) — mesma ideia do `PokedexScreen` atual, só que dentro do ViewModel.
5. O React re-renderiza a `FlatList` com `data={filteredPokemons}`.
6. Mantendo a regra de **não paginar com busca ativa**, o `loadMore` no hook retorna cedo quando `searchQuery.trim() !== ''` — espelhando o `handleEndReached` que hoje usa `isSearching`.

Fluxo desenhado :

```text
Usuário digita no TextInput
        ↓
onChangeText chama setSearchQuery (View -> ViewModel)
        ↓
ViewModel atualiza searchQuery (useState)
        ↓
ViewModel recalcula filteredPokemons (useMemo)
        ↓
View renderiza FlatList com a lista filtrada
```

---

## Trade-offs e migração incremental

**Ganhos:** `PokedexScreen.tsx` mais legível; o hook concentra lista/paginação (testável com libs de hooks ou funções puras extraídas). Estado global futuro encaixa no ViewModel sem redesenhar o JSX inteiro.

**Riscos:** hook gigante vira outro “Deus” — aí vale quebrar em `usePokemonPagination` + filtro. Mudança de código pode quebrar `onEndReached`; migrar em passos reduz isso.

**Passos sugeridos:**

1. Criar `usePokedexViewModel.ts` e **copiar** estado e funções da tela sem mudar comportamento.
2. Trocar a tela pra usar só o hook e validar lista, busca, infinite scroll e erro.
3. Depois, se fizer sentido, mover `mergeUniqueById` / constantes pra outro arquivo.



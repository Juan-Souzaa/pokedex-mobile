# Exercício 1 — Análise da arquitetura da minha Pokédex

## Estrutura de diretórios

Pra um app desse tamanho, a divisão **screens / components / services / types / utils** me soa clara. Eu acho a pasta `types` com `navigation.ts` e `Pokemon.ts` um bom guia: abro o arquivo e já sei onde estão os contratos. O `App.tsx` concentrar o `NavigationContainer` e o `Stack.Navigator` também é fácil de achar — não preciso vasculhar cinco pastas pra descobrir onde as rotas nascem.

Se o projeto *crescer* de verdade, eu pensaria em duas mudanças (não são urgentes agora):

- **Feature folders**: por exemplo jogar tudo que é “listagem” num `screens/Pokedex/` ou `features/pokedex/` com a tela + pequenos componentes só da lista. Hoje `components/` tem só o `PokemonCard`; quando virar dez arquivos misturados, feature folder ajuda.
- **Tirar o `mergeUniqueById` e a lógica grossa da `PokedexScreen`** pra um `.ts` de domínio ou `utils/` — não porque “é feio na tela”, mas porque assim eu consigo testar número e merge sem montar React inteiro.

Resumindo: **no tamanho atual, não mudaria pasta só por mudar** — a organização ainda se defende.

---

## Componentização — `PokemonCard` e a tela de detalhe

### O `PokemonCard` é reutilizável?

**Em parte, sim.** Ele recebe um `Pokemon`, mostra imagem (ou placeholder), nome com `capitalize`, e envolve tudo num `Pressable`. Visualmente está fechadinho num arquivo só — isso eu gosto.

O que me incomoda um pouco é que **o card não é “burro”**: ele chama `useNavigation` e dá `navigate('PokemonDetail', { pokemonId })` por dentro. Pra *este* app funciona e até simplifica a `PokedexScreen`, que só faz `<PokemonCard pokemon={item} />`. Mas se amanhã eu quiser o mesmo visual numa tela que **não** abre detalhe (só preview), eu ou duplico layout ou refatoro o card pra receber `onPress` por prop. Então: **bom componente de UI pro fluxo atual**, **reutilização “genérica” limitada** por causa da navegação colada nele.

### `PokemonDetailScreen` — o que eu extrairia

A `PokemonDetailScreen` mistura **efeito de API**, **loading**, **erro**, **ScrollView** com imagem, nome, altura/peso, chips de tipo e o texto da espécie (flavor).

Pra deixar a tela mais “magrinha”, eu separaria:

- **Bloco de arte + nome** (imagem ou quadrado cinza + título) — dá pra chamar `PokemonArtwork` ou similar.
- **Linha de altura e peso** — hoje eu calculo `height/10` e `weight/10` na própria tela; isso cabe num componente `PokemonMedidas` ou só funções pequenas + um componente que só formata.
- **Os chips de tipo** num `TypeChips` — hoje é um `map` com `View` estilizado; se um dia eu repetir tipo no card ou num filtro, já está pronto.
- **O parágrafo da descrição** à parte, pra não poluir o `ScrollView` com condicional gigante.
- **Estados de “só loading” e “só erro”** — dá pra padronizar com componentes genéricos se outras telas repetirem o padrão.

A tela continuaria como **quem busca o `pokemonId` da rota e chama a API**; o resto vira pedaços que eu posso reaproveitar ou testar com menos ruído.

---

## Onde está a lógica — `PokedexScreen` e tela de detalhe

### `PokedexScreen`

Tudo que é **lista + busca + scroll infinito** está **no mesmo arquivo da tela**:

- Estados: `pokemons`, `search`, `isLoading`, `error`, `hasMore`, `isLoadingMore`, e uns `useRef` pra offset, lock de “carregar mais” e um cooldown no `onEndReached` (pra não disparar feito louco).
- **Busca na API**: `loadInitial` pega `getPokemons`, depois `Promise.all` com `getPokemonDetails` em cada URL. O `loadMore` faz a mesma ideia com offset.
- **Filtro**: não é outra rota; é `useMemo` em cima de `pokemons` filtrando pelo nome com o texto da busca em minúsculo. Também tem um filtro extra pra não repetir `id` se algo duplicar.

Ou seja: a “regra” de quando paginar, quando mostrar loading no rodapé e como filtrar localmente **mora na tela**.

### `PokemonDetailScreen`

A mesma lógica: um `useEffect` que roda quando muda o `pokemonId` (vem dos params da rota). Ele chama `getPokemonById`, seta o título do header com `navigation.setOptions`, tenta `getPokemonSpeciesFlavorText` e usa uma flag `cancelled` no cleanup pra não setar estado se eu sair da tela rápido. Estados `detail`, `flavorText`, `loading`, `error` tudo com `useState` ali.

**Tudo isso está dentro do componente da tela**, não num hook separado nem num store.

### Isso aguenta o app crescendo?

**Pra um MVP, aguenta.** Dá pra abrir `PokedexScreen.tsx` e seguir o raciocínio em pouco tempo — menos abstração, menos “onde está essa variável”.

O problema aparece quando eu quiser **teste automático** da paginação sem renderizar tela, ou **favoritos globais**, ou **cache** — aí a lógica espalhada em `useEffect` gigante vira peso. Em resumo:

| Prós (do jeito que está) | Contras (se o app engrossar) |
|--------------------------|------------------------------|
| Tudo que a tela precisa está num arquivo; debug é direto. | Difícil testar só a regra de lista/filtro sem React Testing Library pesado. |
| Hooks e `useEffect` batem com o que o React “costuma” ensinar primeiro. | Se eu repetir padrão de loading/erro em várias telas, vou copiar e colar ou refatorar tarde. |
| Menos pastas, menos decisão de arquitetura — bom pra entregar rápido. | Estado global (ex.: favoritos) vai exigir mexer em vários lugares se eu não centralizar antes. |

Não acho que está “errado”; é **estágio do projeto**. Quando a manutenção doer, aí vale extrair ViewModel, presenter ou um hook `usePokedex` — alinhado ao que o exercício 2 pede.

---

## Pontos fortes e fracos

**Dois pontos fortes**

1. **`services/api.ts`**: chamadas HTTP num canto só; a UI importa `getPokemons`, `getPokemonDetails`, `getPokemonById`, etc. Se mudar endpoint, o ajuste fica localizado.

2. **`RootStackParamList` em `types/navigation.ts`**: tipar `PokemonDetail: { pokemonId: number }` evita param errado e o TypeScript ajuda no `navigate`.

**Dois pontos fracos**

1. **`PokedexScreen` pesada**: mistura `mergeUniqueById`, controle fino de paginação, `FlatList` e estilo. Funciona, mas qualquer feature nova (debounce na busca, React Query) vai exigir **refatorar um arquivo longo** em vez de plugar num módulo pequeno.

2. **Navegação dentro do `PokemonCard`**: visualmente reutilizável, conceitualmente acoplado ao stack. Não é bug; é **cheiro** de arquitetura se eu quiser o mesmo card fora desse fluxo.

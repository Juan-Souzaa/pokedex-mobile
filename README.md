# Pokédex Mobile

Pokédex para celular feita em React Native com Expo, consumindo a [PokéAPI](https://pokeapi.co). Projeto de estudo de desenvolvimento mobile.

<p>
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

## Funcionalidades

- Lista de Pokémon com carregamento de mais itens ao rolar a tela
- Busca por nome
- Tela de detalhe com imagem, tipos, altura, peso e descrição da espécie
- Estados de carregamento, erro e lista vazia

## Estrutura

```
App.tsx        Navegação entre as telas
screens/       PokedexScreen (lista) e PokemonDetailScreen (detalhe)
components/    PokemonCard
services/      Chamadas à PokéAPI com axios
types/         Tipos de Pokémon e das rotas
utils/         Formatação de texto
```

O repositório também guarda dois textos de estudo sobre o próprio código: `ANALISE_ARQUITETURA.md`, com a análise da organização atual, e `PROPOSTA_REFATORACAO.md`, com uma proposta de refatoração para MVVM.

## Como rodar

Pré-requisitos: Node.js e o app Expo Go ou um emulador.

```bash
git clone https://github.com/Juan-Souzaa/pokedex-mobile.git
cd pokedex-mobile
npm install
npx expo start
```

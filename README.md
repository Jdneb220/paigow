# Jade Palace — Pai Gow Poker

![pai gow tiles](https://upload.wikimedia.org/wikipedia/commons/7/7f/ChineseDominoes.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail_unscaled)

[GitHub Page](https://jdneb220.github.io/paigow/)

A responsive Pai Gow Poker table prototype built with React and Vite. The demo deals seven cards to you and a computer opponent, lets you arrange your cards into a five-card high hand and a two-card low hand using click-to-place, double-click/double-tap, or mouse/touch drag-and-drop, and compares both hands using poker rankings.

## Getting started

```sh
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the local development server
- `npm run build` — create a production build in `dist`
- `npm run lint` — check the project with ESLint
- `npm run preview` — preview the production build

This is a front-end demo table. It does not process real-money bets or payouts. The session round record tracks wins, losses, and pushes until the page is reloaded. Hand descriptions appear as each hand is completed, and the cards are sorted by poker rank when the round is revealed. The computer uses a simple strategy that prioritizes its two-card hand while keeping its five-card hand higher.

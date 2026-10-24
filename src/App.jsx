import { useMemo, useState } from "react";

const SUITS = [
  { symbol: "♠", name: "spades", color: "black" },
  { symbol: "♥", name: "hearts", color: "red" },
  { symbol: "♦", name: "diamonds", color: "red" },
  { symbol: "♣", name: "clubs", color: "black" },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function emptyHands() {
  return { high: Array(5).fill(null), low: Array(2).fill(null) };
}

function shuffledDeck() {
  const deck = SUITS.flatMap((suit) =>
    RANKS.map((rank, index) => ({
      id: `${rank}-${suit.name}`,
      rank,
      suit: suit.symbol,
      color: suit.color,
      value: index + 1,
    })),
  );

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[otherIndex]] = [deck[otherIndex], deck[index]];
  }

  return deck;
}

function cardRank(card) {
  return card.rank === "A" ? 14 : card.value;
}

function compareScores(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function straightHigh(ranks) {
  const uniqueRanks = [...new Set(ranks)].sort((left, right) => right - left);
  if (uniqueRanks.length !== 5) return 0;
  if (uniqueRanks[0] - uniqueRanks[4] === 4) return uniqueRanks[0];
  return uniqueRanks.join(",") === "14,5,4,3,2" ? 5 : 0;
}

function rankFive(cards) {
  const ranks = cards.map(cardRank).sort((left, right) => right - left);
  const counts = new Map();
  ranks.forEach((rank) => counts.set(rank, (counts.get(rank) ?? 0) + 1));
  const groups = [...counts.entries()].sort(
    ([rankA, countA], [rankB, countB]) => countB - countA || rankB - rankA,
  );
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const straight = straightHigh(ranks);

  if (flush && straight) return [8, straight];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return [6, groups[0][0], groups[1][0]];
  }
  if (flush) return [5, ...ranks];
  if (straight) return [4, straight];
  if (groups[0][1] === 3) {
    return [3, groups[0][0], ...groups.slice(1).map(([rank]) => rank)];
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    return [2, groups[0][0], groups[1][0], groups[2][0]];
  }
  if (groups[0][1] === 2) {
    return [1, groups[0][0], ...groups.slice(1).map(([rank]) => rank)];
  }
  return [0, ...ranks];
}

function rankTwo(cards) {
  const ranks = cards.map(cardRank).sort((left, right) => right - left);
  return ranks[0] === ranks[1] ? [1, ranks[0]] : [0, ...ranks];
}

function compareHands(left, right) {
  return compareScores(
    left.length === 5 ? rankFive(left) : rankTwo(left),
    right.length === 5 ? rankFive(right) : rankTwo(right),
  );
}

function arrangeComputerHand(cards) {
  let bestSplit = null;

  for (let first = 0; first < cards.length - 4; first += 1) {
    for (let second = first + 1; second < cards.length - 3; second += 1) {
      for (let third = second + 1; third < cards.length - 2; third += 1) {
        for (let fourth = third + 1; fourth < cards.length - 1; fourth += 1) {
          for (let fifth = fourth + 1; fifth < cards.length; fifth += 1) {
            const highIndexes = new Set([first, second, third, fourth, fifth]);
            const high = cards.filter((_, index) => highIndexes.has(index));
            const low = cards.filter((_, index) => !highIndexes.has(index));
            if (compareHands(high, low) <= 0) continue;

            const split = { high, low };
            if (
              !bestSplit ||
              compareScores(rankTwo(low), rankTwo(bestSplit.low)) > 0 ||
              (compareScores(rankTwo(low), rankTwo(bestSplit.low)) === 0 &&
                compareScores(rankFive(high), rankFive(bestSplit.high)) > 0)
            ) {
              bestSplit = split;
            }
          }
        }
      }
    }
  }

  return bestSplit ?? { high: cards.slice(0, 5), low: cards.slice(5) };
}

function PlayingCard({ card, selected = false, onClick, compact = false }) {
  const className = [
    "playing-card",
    card.color,
    selected && "selected",
    compact && "compact",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      type="button"
      onClick={onClick}
      aria-label={`${card.rank} of ${SUITS.find((suit) => suit.symbol === card.suit).name}`}
      aria-pressed={selected}
    >
      <span className="card-corner">
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </span>
      <span className="card-center" aria-hidden="true">
        {card.suit}
      </span>
      <span className="card-corner card-corner-bottom" aria-hidden="true">
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </span>
    </button>
  );
}

function CardBack({ index }) {
  return (
    <div className="card-back" aria-label={`Dealer card ${index + 1}, face down`}>
      <span className="card-back-pattern">✳</span>
    </div>
  );
}

function App() {
  const [ante, setAnte] = useState(25);
  const [deck, setDeck] = useState([]);
  const [computerHand, setComputerHand] = useState(emptyHands);
  const [hands, setHands] = useState(emptyHands);
  const [selectedId, setSelectedId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [roundResult, setRoundResult] = useState("");
  const cardsInHands = useMemo(
    () =>
      new Set(
        [...hands.high, ...hands.low]
          .filter(Boolean)
          .map((card) => card.id),
      ),
    [hands],
  );
  const rackCards = deck.filter((card) => !cardsInHands.has(card.id));
  const isDealt = deck.length > 0;
  const hasCompleteHands = rackCards.length === 0;
  const isValidSplit =
    isDealt && hasCompleteHands && compareHands(hands.high, hands.low) > 0;

  function dealHand() {
    const cards = shuffledDeck();
    setDeck(cards.slice(0, 7));
    setComputerHand(arrangeComputerHand(cards.slice(7, 14)));
    setHands(emptyHands());
    setSelectedId(null);
    setLocked(false);
    setRoundResult("");
  }

  function setPlayerHand() {
    const highResult = compareHands(hands.high, computerHand.high);
    const lowResult = compareHands(hands.low, computerHand.low);
    if (highResult > 0 && lowResult > 0) {
      setRoundResult("You win both hands.");
    } else if (highResult < 0 && lowResult < 0) {
      setRoundResult("The computer wins both hands.");
    } else {
      setRoundResult("The round is a push.");
    }
    setLocked(true);
  }

  function selectCard(card) {
    if (locked) return;
    setSelectedId((current) => (current === card.id ? null : card.id));
  }

  function placeCard(handName, slotIndex) {
    if (!selectedId || locked) return;
    const card = rackCards.find((item) => item.id === selectedId);
    if (!card) return;

    setHands((current) => {
      if (current[handName][slotIndex]) return current;
      const updated = { ...current, [handName]: [...current[handName]] };
      updated[handName][slotIndex] = card;
      return updated;
    });
    setSelectedId(null);
  }

  function removeCard(cardId) {
    if (locked) return;
    setHands((current) => ({
      high: current.high.map((card) => (card?.id === cardId ? null : card)),
      low: current.low.map((card) => (card?.id === cardId ? null : card)),
    }));
  }

  function renderSlots(handName, size) {
    const cards = hands[handName];
    return Array.from({ length: size }, (_, index) => {
      const card = cards[index];
      return (
        <div className="hand-slot" key={`${handName}-${index}`}>
          {card ? (
            <PlayingCard
              card={card}
              compact
              onClick={() => removeCard(card.id)}
            />
          ) : (
            <button
              className={`empty-slot${selectedId ? " ready" : ""}`}
              type="button"
              onClick={() => placeCard(handName, index)}
              disabled={!selectedId || locked}
              aria-label={`Place selected card in ${handName} hand, position ${index + 1}`}
            >
              <span>{index + 1}</span>
            </button>
          )}
        </div>
      );
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Jade Palace home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span className="brand-copy">
            <strong>JADE PALACE</strong>
            <span>PAI GOW POKER</span>
          </span>
        </a>
        <div className="table-info">
          <span className="live-dot" />
          <span>DEMO TABLE</span>
          <span className="info-divider" />
          <span>TABLE 08</span>
        </div>
        <div className="profile">
          <span className="profile-label">YOUR BALANCE</span>
          <strong><span className="coin-icon">◆</span> 1,250</strong>
          <button className="avatar" type="button" aria-label="Player profile">J</button>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">THE CLASSIC CHINESE POKER GAME</p>
          <h1>Find your <em>fortune.</em></h1>
          <p className="heading-subtitle">Split seven cards. Set two hands. Play your way.</p>
        </div>
        <div className="heading-badge">
          <span className="badge-icon">✦</span>
          <span><strong>YOUR SEAT</strong><small>PLAYER 01</small></span>
        </div>
      </section>

      <div className="game-layout">
        <section className="table-panel" aria-label="Pai Gow Poker table">
          <div className="felt">
            <div className="felt-ornament ornament-top" aria-hidden="true">✧ &nbsp; JADE PALACE &nbsp; ✧</div>
            <div className="dealer-area">
              <div className="area-caption"><span>THE HOUSE</span><span className="caption-line" /><span>COMPUTER</span></div>
              <div className="dealer-cards">
                {locked ? (
                  <>
                    <div className="computer-hand">
                      <span className="computer-hand-label">HIGH</span>
                      {computerHand.high.map((card) => (
                        <div className="dealer-card" key={card.id}>
                          <PlayingCard card={card} compact />
                        </div>
                      ))}
                    </div>
                    <span className="computer-hand-divider" aria-hidden="true" />
                    <div className="computer-hand">
                      <span className="computer-hand-label">LOW</span>
                      {computerHand.low.map((card) => (
                        <div className="dealer-card" key={card.id}>
                          <PlayingCard card={card} compact />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  Array.from({ length: 7 }, (_, index) => (
                    <CardBack key={index} index={index} />
                  ))
                )}
              </div>
            </div>

            <div className="table-emblem" aria-hidden="true">
              <span className="emblem-diamond">✳</span>
              <span>JADE<br />PALACE</span>
            </div>

            <div className="player-area">
              <div className="area-caption"><span>YOUR HAND</span><span className="caption-line" /><span>PLAYER 01</span></div>
              <div className="hand-row">
                <div className="hand-group">
                  <div className="hand-title">
                    <span className="hand-name">HIGH HAND</span>
                    <span className="hand-rule">5 CARDS</span>
                  </div>
                  <div className="slots high-slots">{renderSlots("high", 5)}</div>
                </div>
                <div className="hand-divider" aria-hidden="true" />
                <div className="hand-group low-group">
                  <div className="hand-title">
                    <span className="hand-name">LOW HAND</span>
                    <span className="hand-rule">2 CARDS</span>
                  </div>
                  <div className="slots low-slots">{renderSlots("low", 2)}</div>
                </div>
              </div>
            </div>

            <div className="felt-ornament ornament-bottom" aria-hidden="true">♢ &nbsp; EST. MMXXIV &nbsp; ♢</div>
          </div>

          <div className="card-rack">
            <div className="rack-heading">
              <div>
                <p className="eyebrow">YOUR CARDS</p>
                <h2>{locked ? "Round complete" : isDealt ? "Choose your split" : "Ready when you are"}</h2>
              </div>
              <span className="card-count">{isDealt ? `${7 - rackCards.length} / 7 SET` : "7 CARDS"}</span>
            </div>
            {roundResult && <p className="round-result" role="status">{roundResult}</p>}
            <div className={`rack-cards${!isDealt ? " rack-empty" : ""}`}>
              {isDealt ? (
                rackCards.length > 0 ? (
                  rackCards.map((card) => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      selected={selectedId === card.id}
                      onClick={() => selectCard(card)}
                    />
                  ))
                ) : (
                  <p className="all-set">All seven cards are in your hands. Looking good.</p>
                )
              ) : (
                <p className="rack-prompt">Place your bet, then deal to receive your seven cards.</p>
              )}
            </div>
            <div className="rack-footer">
              <span className="tip-icon">i</span>
              <span>{locked ? "Your hand is set for this round." : selectedId ? "Now choose a spot in your high or low hand." : "Select a card, then choose a spot above. Tap a placed card to return it."}</span>
            </div>
          </div>
        </section>

        <aside className="control-panel">
          <section className="panel-card wager-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PLACE YOUR BET</p>
                <h2>Set your ante</h2>
              </div>
              <span className="chip-icon">◆</span>
            </div>
            <div className="bet-display">
              <span className="currency">$</span>{ante}<span className="bet-unit">.00</span>
            </div>
            <div className="bet-controls" aria-label="Adjust ante">
              <button type="button" onClick={() => setAnte((value) => Math.max(5, value - 5))} aria-label="Decrease ante" disabled={isDealt}>−</button>
              {[25, 50, 100].map((amount) => (
                <button
                  className={ante === amount ? "active" : ""}
                  key={amount}
                  type="button"
                  onClick={() => setAnte(amount)}
                  disabled={isDealt}
                >
                  {amount}
                </button>
              ))}
              <button type="button" onClick={() => setAnte((value) => Math.min(500, value + 5))} aria-label="Increase ante" disabled={isDealt}>+</button>
            </div>
            <div className="bet-note"><span>MIN $5</span><span>MAX $500</span></div>
            <button
              className="primary-button"
              type="button"
              onClick={isDealt ? (locked ? dealHand : setPlayerHand) : dealHand}
              disabled={isDealt && !locked && !isValidSplit}
            >
              <span>{isDealt ? (locked ? "DEAL NEXT HAND" : "SET YOUR HAND") : "DEAL YOUR HAND"}</span>
              <span className="button-arrow">→</span>
            </button>
            {isDealt && !locked && !isValidSplit && (
              <p className="action-hint">
                {hasCompleteHands
                  ? "Your five-card high hand must beat your two-card low hand."
                  : "Place all seven cards to continue"}
              </p>
            )}
            <p className="demo-note"><span>●</span> Demo table · no real money</p>
          </section>

          <section className="panel-card how-to-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">NEW TO PAI GOW?</p>
                <h2>How to play</h2>
              </div>
              <span className="question-mark">?</span>
            </div>
            <ol className="steps">
              <li><span>01</span><p>Set your ante and receive <strong>seven cards.</strong></p></li>
              <li><span>02</span><p>Split them into a <strong>five-card high</strong> and a <strong>two-card low</strong> hand.</p></li>
              <li><span>03</span><p>Set your hand to reveal the computer&apos;s split and compare both hands.</p></li>
            </ol>
            <div className="house-rule">
              <span className="rule-star">✦</span>
              <p>Your five-card high hand must rank higher than your two-card low hand.</p>
            </div>
          </section>

          <div className="table-footer">
            <span>♧ &nbsp; GOOD LUCK AT THE TABLE</span>
            <span>18+ &nbsp; · &nbsp; PLAY RESPONSIBLY</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default App;

let PLAYGROUND = {
  deck: [],
  grave: [],
  players: [
    /*
    {
      id: string,
      name: string,
      hand: [],
      revealedCards: []
    }
     */
  ],
};

module.exports = {
  GET: function () {
    return PLAYGROUND;
  },

  LOGHAND: function (playerID) {
    return PLAYGROUND.players[playerID].hand;
  },

  SHUFFLE: function () {
    for (let i = PLAYGROUND.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [PLAYGROUND.deck[i], PLAYGROUND.deck[j]] = [
        PLAYGROUND.deck[j],
        PLAYGROUND.deck[i],
      ];
    }
  },

  INITPLAYGROUND: function () {
    const deckFormatted = [];
    const array = buildDeck();
    let i = 0;
    // array.forEach((element) => {
    //   deckFormatted.push({ id: i, name: element });
    //   i++;
    // });
    array.forEach((element) => deckFormatted.push({ id: i++, name: element }));
    PLAYGROUND = {
      deck: deckFormatted,
      grave: [],
      players: [],
    };
    this.SHUFFLE();
  },

  INITPLAYER: function (playerID, playerName) {
    // PLAYGROUND.players.push({
    //   id: playerID,
    //   name: playerName,
    //   hand: PLAYGROUND.deck.splice(0, 4),
    //   revealedCards: [],
    // });
    PLAYGROUND.players[playerID] = {
      id: playerID,
      name: playerName,
      hand: PLAYGROUND.deck.splice(0, 4),
      revealedCards: [],
    };
  },

  KICKPLAYER: function (playerID) {
    // const playerIndex = PLAYGROUND.players.findIndex((p) => p.id == playerID);
    // if (playerIndex >= 0) {    }
    if (PLAYGROUND.players[playerID]) delete PLAYGROUND.players[playerID];
  },

  DRAW: function (playerID) {
    MOVECARD(PLAYGROUND.deck, PLAYGROUND.players[playerID].revealedCards);
    return PLAYGROUND.players[playerID].revealedCards;
  },

  SWITCH: function (playerID, currentCard, newCard) {
    let position = this.PLAY(playerID, currentCard);

    const index = PLAYGROUND.players[playerID].revealedCards.findIndex(
      (c) => c.id == card.id
    );
    if (index >= 0) {
      MOVECARD(
        PLAYGROUND.players[playerID].revealedCards,
        PLAYGROUND.players[playerID].hand,
        newCard.id,
        position
      );
    } else {
      MOVECARD(
        PLAYGROUND.players[playerID].grave,
        PLAYGROUND.players[playerID].hand,
        newCard.id,
        position
      );
    }
    emptyReveals(playerID);
  },

  PLAY: function (playerID, card) {
    if (card.name[0] >= '0' && card.name[0] <= '9') {
      // NO EFFECTS
    } else {
      // EFFECT
    }

    // if (PLAYGROUND.players[playerID].revealedCards.length > 0) {
    const targetIndex = PLAYGROUND.players[playerID].revealedCards.findIndex(
      (c) => c.id == card.id
    );
    // console.log('CARD', targetIndex >= 0 ? '' : 'NOT', 'found in reveals');
    const source =
      targetIndex >= 0
        ? PLAYGROUND.players[playerID].revealedCards
        : PLAYGROUND.players[playerID].hand;
    const position = MOVECARD(source, PLAYGROUND.grave, card.id);

    return position;
  },
};

///////////////////////
// PRIVATE FUNCTIONS //
///////////////////////

const MOVECARD = (source, destination, cardID = null, position = null) => {
  const cardIndexToMove = cardID ? source.findIndex((c) => c.id === cardID) : 0;
  const cardMoved = source.splice(cardIndexToMove, 1);
  if (cardMoved && cardMoved[0]) {
    position != null
      ? destination.splice(position, 0, cardMoved[0])
      : destination.push(cardMoved[0]);
  }
  return cardIndexToMove;
};

const emptyReveals = (playerID) => {
  PLAYGROUND.players[playerID].revealedCards.forEach((card) =>
    MOVECARD(
      PLAYGROUND.players[playerID].revealedCards,
      PLAYGROUND.deck,
      card.id
    )
  );
};

const buildDeck = () => {
  let numbers = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];
  let colors = ['C', 'D', 'H', 'S'];
  let deck = [];

  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      deck.push(numbers[i] + colors[j]);
    }
  }

  return deck;
};

let PLAYGROUND = {
  deck: [],
  grave: [],
  players: [],
};
let playersKicked = [];

let lastPlayed = {
  card: { id: null, name: null },
  wasPlayed: true,
  playedBy: null,
};


module.exports = {
  GET: () => PLAYGROUND,
  GETNBPLAYERS: () => PLAYGROUND.players.length,
  GETPLAYERID: (pPos) =>
    pPos >= 0 && PLAYGROUND.players.length > pPos
      ? PLAYGROUND.players[pPos].id
      : null,
  GETPLAYERBYID: (playerID) => getPlayerById(playerID),

  LOGHAND: function (playerID) {
    const player = getPlayerById(playerID);
    return player.hand;
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

  INITPLAYGROUND: function (keepPlayers = false) {
    const deckFormatted = [];
    const array = buildDeck();
    let i = 0;

    array.forEach((element) => deckFormatted.push({ id: i++, name: element }));
    PLAYGROUND = {
      deck: deckFormatted,
      grave: [],
      players: keepPlayers ? PLAYGROUND.players : [],
    };
    playersKicked = [];
    this.SHUFFLE();
    giveCards();
  },

  INITPLAYER: function (playerID, playerName) {
    console.log('INIT PLAYER', playerID);
    const player = playersKicked.find((p) => p.name == playerName);
    if (player) {
      player.id = playerID;
      // recover lost player
      PLAYGROUND.players.push(player);
      return true;
    } else {
      PLAYGROUND.players.push({
        id: playerID,
        name: playerName,
        hand: PLAYGROUND.deck.splice(0, 4),
        revealedCards: [],
      });
    }
    return false;
  },

  KICKPLAYER: function (playerID) {
    console.log('KICK PLAYER', playerID);
    const playerIndex = PLAYGROUND.players.findIndex((p) => p.id == playerID);
    if (playerIndex >= 0) {
      playersKicked.push(PLAYGROUND.players.splice(playerIndex, 1)[0]);
    }
  },

  RESETPLAYER: function (playerID) {
    console.log('RESET PLAYER', playerID);
    const player = PLAYGROUND.players.find((p) => p.id == playerID);
    if (player) {
      PLAYGROUND.deck.push(player.hand.splice(0, player.hand.length));
      PLAYGROUND.deck.push(
        player.revealedCards.splice(0, player.revealedCards.length)
      );
      player.hand = PLAYGROUND.deck.splice(0, 4);
      player.revealedCards = [];
    } else console.log('didnt find player...');
  },

  DRAW: function (playerID, fromGrave) {
    const player = getPlayerById(playerID);
    // YOU CAN'T DRAW ANOTHER CARD IF YOU ALREADY HAVE
    if (player.revealedCards.length > 0) return;

    if (fromGrave && PLAYGROUND.grave.length) {
      // take from grave
      const lastGraveCard = PLAYGROUND.grave[PLAYGROUND.grave.length - 1];
      MOVECARD(PLAYGROUND.grave, player.revealedCards, lastGraveCard.id);
    } else {
      // take from deck
      if (PLAYGROUND.deck.length == 0) fillDeck();
      MOVECARD(PLAYGROUND.deck, player.revealedCards);
    }
  },

  // SWITCH: function (playerID, currentCard, newCard) {
  //   const player = getPlayerById(playerID);

  //   let pos = this.PLAY(playerID, currentCard);

  //   const index = player.revealedCards.findIndex((c) => c.id == newCard.id);
  //   if (index >= 0) {
  //     MOVECARD(player.revealedCards, player.hand, newCard.id, pos);
  //   } else {
  //     MOVECARD(PLAYGROUND.grave, player.hand, newCard.id, pos);
  //   }
  //   emptyReveals(playerID);
  // },

  PLAY: function (playerID, card) {
    const player = getPlayerById(playerID);
    if (!(player && card)) return;

    const ev = playEffects(card);

    if (player.revealedCards.length > 0) {
      // The player is in draw phase
      const targetIndex = player.revealedCards.findIndex(
        (c) => c.id == card.id
      );

      if (targetIndex >= 0) {
        // discard the drawn card
        MOVECARD(player.revealedCards, PLAYGROUND.grave, card.id);
      } else {
        // keep the drawn card and discard one of its hand
        pos = MOVECARD(player.hand, PLAYGROUND.grave, card.id);
        MOVECARD(player.revealedCards, player.hand, null, pos);
      }

      lastPlayed.card = card;
      lastPlayed.wasPlayed = false;
      emptyReveals(playerID);
    } else if (noPlayerIsDrawing()) {
      // The player is NOT in draw phase and NO ONE IS
      // he wants to play the same card as the shown card
      if (PLAYGROUND.grave.length && lastPlayed.card.name != null) {
        // const lastGraveCard = PLAYGROUND.grave[PLAYGROUND.grave.length - 1];
        if (cardsMatch(card, lastPlayed.card)) {
          // card matches to the one on the grave
          if (lastPlayed.WasPlayed && lastPlayed.playedBy != playerID) {
            return {
              name: 'warning',
              factor:
                'Vous ne pouvez plus jouer sur cette carte' +
                " (quelqu'un vous a peut-être devancé)",
            };
          } else {
            MOVECARD(player.hand, PLAYGROUND.grave, card.id);
            lastPlayed.wasPlayed = true;
            lastPlayed.playedBy = playerID;
          }
        } else {
          // card doesn't match
          MOVECARD(PLAYGROUND.grave, player.hand, lastPlayed.card.id);
          lastPlayed.wasPlayed = true;
          lastPlayed.playedBy = null;
        }
      }
    }

    return ev;
  },

  COUNTPOINTS: (playerID) => {
    let scores = [];
    PLAYGROUND.players.forEach((p) => {
      let currentPlayerScore = 0;
      p.hand.forEach((c) => (currentPlayerScore += cardPoints(c)));
      scores.push({ name: p.name, score: currentPlayerScore });
    });
    return scores;
  },
};

///////////////////////
// PRIVATE FUNCTIONS //
///////////////////////

const MOVECARD = (source, destination, cardID = null, pos = null) => {
  const cardIndexToMove = cardID ? source.findIndex((c) => c.id === cardID) : 0;
  const cardMoved = source.splice(cardIndexToMove, 1);
  if (cardMoved && cardMoved[0]) {
    pos != null
      ? destination.splice(pos, 0, cardMoved[0])
      : destination.push(cardMoved[0]);
  }
  return cardIndexToMove;
};

const emptyReveals = (playerID) => {
  const player = getPlayerById(playerID);

  player.revealedCards.forEach((card) =>
    MOVECARD(player.revealedCards, PLAYGROUND.deck, card.id)
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

const getPlayerById = (playerID) => {
  const playerIndex = PLAYGROUND.players.findIndex((p) => p.id == playerID);
  return playerIndex >= 0 ? PLAYGROUND.players[playerIndex] : null;
};

const cardsMatch = (cardA, cardB) => {
  return extractCardValue(cardA) == extractCardValue(cardB);
};

const noPlayerIsDrawing = () => {
  let nobody = true;
  PLAYGROUND.players.forEach((p) => {
    if (p.revealedCards.length > 0) nobody = false;
  });
  return nobody;
};

const fillDeck = () => {
  if (PLAYGROUND.grave.length > 1) {
    PLAYGROUND.deck = PLAYGROUND.grave.splice(0, PLAYGROUND.grave.length - 1);
    this.SHUFFLE();
  }
};

const giveCards = () => {
  PLAYGROUND.players.forEach((player) => {
    player.hand = PLAYGROUND.deck.splice(0, 4);
    player.revealedCards = [];
  });
  MOVECARD(PLAYGROUND.deck, PLAYGROUND.grave);
};

const playEffects = (card) => {
  if (card.name[0] >= '0' && card.name[0] <= '9') {
    // NO EFFECTS
  }
  if (card.name[0] == 'Q') return { name: 'reveal', factor: 1 };
  return null;
};

const cardPoints = (card) => convertValueToPoints(extractCardValue(card));
const extractCardValue = (card) =>
  card.name[0] == '1' && card.name[1] == '0' ? '10' : card.name[0];
const convertValueToPoints = (value) => {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? 15 : parsedValue;
};

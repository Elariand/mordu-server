let PLAYGROUND = {
  deck: [],
  grave: [],
  players: [],
};
let playersKicked = [];
let takenFromGrave = false;

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
    const playersEmptied = keepPlayers
      ? PLAYGROUND.players.map((p) => {
          return {
            id: p.id,
            name: p.name,
          };
        })
      : [];

    let i = 0;
    buildDeck().forEach((element) =>
      deckFormatted.push({ id: i++, name: element })
    );
    PLAYGROUND = {
      deck: deckFormatted,
      grave: [],
      players: playersEmptied,
    };
    playersKicked = [];
    this.SHUFFLE();
    giveCards();
  },

  INITPLAYER: function (playerID, playerName) {
    console.log('INIT PLAYER', playerID);
    const kickedPlayerIndex = playersKicked.findIndex(
      (p) => p.name == playerName
    );
    if (kickedPlayerIndex >= 0) {
      let player = playersKicked.splice(kickedPlayerIndex, 1)[0];
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
      // first remove the previous kicked player with the same name
      const kickedPlayerIndex = playersKicked.findIndex(
        (p) => p.name == PLAYGROUND.players[playerIndex]
      );
      if (kickedPlayerIndex >= 0) playersKicked.splice(kickedPlayerIndex, 1);

      // then add a new kicked player
      playersKicked.push(PLAYGROUND.players.splice(playerIndex, 1)[0]);
    }
  },

  RESETPLAYER: function (playerID) {
    console.log('RESET PLAYER', playerID);
    const player = PLAYGROUND.players.find((p) => p.id == playerID);
    if (player) {
      [
        ...player.hand.splice(0, player.hand.length),
        ...player.revealedCards.splice(0, player.revealedCards.length),
      ].forEach((c) => PLAYGROUND.deck.push(c));
      player.hand = PLAYGROUND.deck.splice(0, 4);
      player.revealedCards = [];
    } else console.log('didnt find player...');
  },

  DRAW: function (playerID, fromGrave) {
    const player = getPlayerById(playerID);
    // YOU CAN'T DRAW ANOTHER CARD IF YOU ALREADY HAVE
    if (player.revealedCards.length > 0) return;

    takenFromGrave = fromGrave && PLAYGROUND.grave.length;

    if (takenFromGrave) {
      // take from grave
      const lastGraveCard = PLAYGROUND.grave[PLAYGROUND.grave.length - 1];
      MOVECARD(PLAYGROUND.grave, player.revealedCards, lastGraveCard.id);
    } else {
      // take from deck
      if (PLAYGROUND.deck.length == 0) fillDeck();
      MOVECARD(PLAYGROUND.deck, player.revealedCards);
    }
  },

  PLAY: function (playerID, card) {
    const player = getPlayerById(playerID);
    if (!(player && card)) return;

    const ev = playEffects(card, player.hand.length);

    if (player.revealedCards.length > 0) {
      // The player is in draw phase
      const targetIndex = player.revealedCards.findIndex(
        (c) => c.id == card.id
      );

      if (targetIndex >= 0) {
        // discard the drawn card
        if (takenFromGrave) return; // nothing can be done : forbidden move
        MOVECARD(player.revealedCards, PLAYGROUND.grave, card.id);
      } else {
        // keep the drawn card and discard one of its hand
        pos = MOVECARD(player.hand, PLAYGROUND.grave, card.id);
        MOVECARD(player.revealedCards, player.hand, null, pos);
      }

      lastPlayed.card = card;
      lastPlayed.wasPlayed = false;
      emptyReveals(playerID);
    } else if (PLAYGROUND.grave.length && lastPlayed.card.name != null) {
      // The player is NOT in draw phase
      // he wants to play the same card as the shown card
      if (cardsMatch(card, lastPlayed.card)) {
        // card matches to the one on the grave
        if (lastPlayed.wasPlayed && lastPlayed.playedBy != playerID) {
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
        const lastPlayedCardID = lastPlayed.card.id;
        MOVECARD(PLAYGROUND.grave, player.hand, lastPlayedCardID);
        emptyLastPlayedCard();
        return {
          name: 'showCard',
          factor: lastPlayedCardID,
        };
      }
    } else return; // nothing can be done : forbidden move

    return ev;
  },

  STEAL: function (playerID, card) {
    const player = getPlayerById(playerID);
    const opponent = PLAYGROUND.players.find((p) =>
      p.hand.find((c) => c.id == card.id)
    );
    if (!(player && opponent)) return;

    const notInterested = opponent.hand.find((c) => c.id == card.id);

    if (!notInterested) {
      // keep the card and give one of its hand
      pos = MOVECARD(player.hand, opponent.hand, card.id);
      MOVECARD(opponent.hand, player.hand, null, pos);
    }

    return true;
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
const emptyLastPlayedCard = () => {
  lastPlayed = {
    card: { id: null, name: null },
    wasPlayed: true,
    playedBy: null,
  };
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

const playEffects = (card, playerHandLength) => {
  if (card.name[0] >= '0' && card.name[0] <= '9') {
    // NO EFFECTS
  }
  if (card.name == 'KC') return { name: 'reveal', factor: playerHandLength };
  if (card.name == 'KS') return { name: 'steal', factor: 1 };
  if (card.name[0] == 'Q') return { name: 'reveal', factor: 1 };
  return true;
};

const cardPoints = (card) => convertValueToPoints(extractCardValue(card));
const extractCardValue = (card) => {
  if (!card.name || card.name.length < 2) return 15;
  if (card.name == 'KD' || card.name == 'KH') return 0;
  return card.name[0] == '1' && card.name[1] == '0' ? '10' : card.name[0];
};
const convertValueToPoints = (value) => {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? 15 : parsedValue;
};

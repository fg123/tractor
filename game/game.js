const Deck = require('./deck');
const GameUtils = require('./gameUtils');
const Hand = require('./hand');

/**
 * The game state has a timed component on the first draw. The game state
 *   accepts input state changes and outputs information which is parsed
 *   and sent to the corresponding client. Input state changes correspond
 *   to a player playing a card. Output state changes are card deals.
 * The game state will verify all inputs, and will output an error packet to
 *   the client that gives an invalid input.
 */
const DEAL_DELAY = 100;
const STATE_READY = 'ready';
const STATE_DEALING = 'dealing';
const STATE_WAITING_FOR_BOTTOM = 'waiting';
const STATE_IN_GAME = 'ingame';

// All StateChanges must contain the field 'player' which is the destination
class DealStateChange {
    constructor (toPlayer, card) {
        this.player = toPlayer;
        this.card = card;
    }

    sendToClient(socket) {
        socket.emit('client.card_deal', this.card);
    }
}

class PlayCardsStateChange {
    constructor (toPlayer, fromPlayer, cards) {
        this.player = toPlayer;
        this.fromPlayer = fromPlayer;
        this.cards = cards;
    }

    sendToClient(socket) {
        socket.emit('client.play_cards', this.fromPlayer, this.cards);
        if (this.fromPlayer === this.player) {
            socket.emit('client.remove_cards', this.cards);
        }
    }
}

class DiscardCompleteStateChange {
    // fromPlayer should be the dealer
    constructor (fromPlayer, cards) {
        this.player = fromPlayer;
        this.cards = cards;
    }

    sendToClient(socket) {
        socket.emit('client.remove_cards', this.cards);
    }
}

class ErrorStateChange {
    constructor (toPlayer, msg) {
        this.player = toPlayer;
        this.msg = msg;
    }

    sendToClient(socket) {
        socket.emit('client.error', this.msg);
    }
}

class GameState {
    // Players should be ordered in counter clockwise fashion in the UI.
    constructor (playerCount, firstPlayer, trumpNumber, outputHandler) {
        this.playerCount = playerCount;
        // TODO: make deck size based on player count
        this.deck = new Deck(2, true);
        this.hands = [];
        for (let i = 0; i < playerCount; i++) {
            this.hands.push(new Hand());
        }
        this.currentTurn = firstPlayer;
        this.dealer = 0;
        this.currentState = STATE_READY;
        this.outputHandler = outputHandler;
        this.log = [];
        this.trumpNumber = trumpNumber;
        this.trumpSuit = undefined;
        this.trumpSuitDeclaredCount = 0;
        this.lead = undefined;

        this.gameUtils = new GameUtils(this);
    }

    output(data) {
        this.outputHandler(data);
        this.log.push(data);
    }

    start() {
        if (this.currentState !== STATE_READY) return;
        this.deal();
    }

    dealCardToHand(player, card) {
        this.hands[player].addCard(card);
        this.output(new DealStateChange(player, card));
    }

    deal() {
        this.currentState = STATE_DEALING;
        // TODO: this needs to be determined by deck size
        if (this.deck.size() <= 8) {
            // Deal the rest to the dealer
            if (!this.trumpSuit) {
                setTimeout(() => { this.deal(); }, DEAL_DELAY);
                return;
            }
            this.currentState = STATE_WAITING_FOR_BOTTOM;
            while (this.deck.size() > 0) {
                this.dealCardToHand(this.dealer, this.deck.draw());
            }
            this.currentTurn = this.dealer;
            return;
        }
        this.dealCardToHand(this.currentTurn, this.deck.draw());
        this.advancePlayer();
        setTimeout(() => { this.deal(); }, DEAL_DELAY);
    }

    advancePlayer() {
        this.currentTurn = (this.currentTurn + 1) % this.playerCount;
    }

    _playCards(player, cards) {
        // Playing during dealing phase:
        if (this.currentState === STATE_DEALING) {
            // Anyone can play a card
            if (this.gameUtils.isAllNumber(cards, this.trumpNumber) && this.gameUtils.isAllSameCard(cards) && cards.length > this.trumpSuitDeclaredCount) {
                // Match number + valid pair + more cards played
                // TODO: Joker call no suit
                this.trumpSuitDeclaredCount = cards.length();
                this.trumpSuit = this.gameUtils.getSuit(cards[0]);
                return;
            }
            throw Error('Not a valid hand to flip for suit.');
        }

        if (this.currentState === STATE_WAITING_FOR_BOTTOM) {
            if (player !== this.currentTurn) {
                throw Error('Wait for dealer to discard cards!');
            }
            // TODO: this needs to be determined by number of decks
            if (cards.length !== 8) {
                throw Error('Wrong number of cards to discard!');
            }

            for (let i = 0; i < cards.length; i++) {
                this.hands[player].removeCard(cards[i]);
            }
            this.currentState = STATE_IN_GAME;
            this.output(new DiscardCompleteStateChange(player, cards));
            return;
        }

        if (player !== this.currentTurn) {
            throw Error('Not your turn!');
        }

        if (this.lead === undefined) {
            // TODO: implement throw mechanics
            this.validateLead(cards);
            this.lead = cards;
        }
        else {
            // This will throw a valid exception if it's not a valid hand
            this.validateFollow(this.lead, cards, this.hands[player]);
        }

        // If no exception throwed above, we continue.
        this.advancePlayer();
        for (let i = 0; i < cards.length; i++) {
            this.hands[player].removeCard(cards[i]);
        }
        for (let i = 0; i < this.playerCount; i++) {
            this.output(new PlayCardsStateChange(i, player, cards));
        }
    }

    playCards(player, cards) {
        console.log(`Player ${player} played ${cards}`);
        try {
            this._playCards(player, cards);
        }
        catch (e) {
            console.error(e);
            this.output(new ErrorStateChange(player, e.toString()));
        }
    }

    validateLead(lead) {
        // TODO: throw and tractor needs to be implemented
        if (!this.gameUtils.isAllSameCard(lead)) {
            throw 'Invalid lead';
        }
    }

    validateFollow(lead, cards, hand) {
        if (cards.length !== this.lead.length) {
            throw 'Invalid follow! Need the same number of cards!';
        }

        // Convert cards into a "hand" so we can use "hand" operations
        cards = new Hand(cards);
        

        // Throw can allow lead to have different suits, assume for now that they
        //   are all same suits.
        let suit = this.gameUtils.getSuit(lead[0]);

        // Do they have enough of the suit to play?
        let shouldBePlayed = Math.min(lead.length, this.gameUtils.countSuit(hand, suit));
        if (this.gameUtils.countSuit(cards, suit) < shouldBePlayed) {
            throw 'Invalid follow, you still have more of ' + suit;
        }

        // TODO: implement pairs and stuff
    }
}

module.exports = {
    DealStateChange,
    GameState
}

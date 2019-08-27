const Deck = require('./deck');

/**
 * The game state has a timed component on the first draw. The game state
 *   accepts input state changes and outputs information which is parsed
 *   and sent to the corresponding client. Input state changes correspond
 *   to a player playing a card. Output state changes are card deals.
 * The game state will verify all inputs, and will output an error packet to
 *   the client that gives an invalid input.
 */
const DEAL_DELAY = 100;
const STATE_READY = "ready";
const STATE_DEALING = "dealing";
const STATE_WAITING_FOR_BOTTOM = "waiting";
const STATE_IN_GAME = "ingame";

class DealStateChange {
    constructor (player, card) {
        this.player = player;
        this.card = card;
    }
}

class GameState {
    // Players should be ordered in counter clockwise fashion in the UI.
    constructor (playerCount, firstPlayer, trumpNumber, outputHandler) {
        this.playerCount = playerCount;
        // TODO: make deck size based on player count
        this.deck = new Deck(2, true);
        this.currentTurn = firstPlayer;
        this.dealer = 0;
        this.currentState = STATE_READY;
        this.outputHandler = outputHandler;
        this.log = [];
        this.trumpNumber = trumpNumber;
        this.trumpSuit = undefined;
    }

    output(data) {
        this.outputHandler(data);
        this.log.push(data);
    }

    start() {
        if (this.currentState !== STATE_READY) return;
        this.deal();
    }

    deal() {
        this.currentState = STATE_DEALING;
        if (this.deck.size() <= 8) {
            // Deal the rest to the dealer
            this.currentState = STATE_WAITING_FOR_BOTTOM;
            while (this.deck.size() > 0) {
                this.output(new DealStateChange(this.dealer, this.deck.draw()));
            }
            return;
        }
        this.output(new DealStateChange(this.currentTurn, this.deck.draw()));
        this.advancePlayer();
        setTimeout(() => { this.deal(); }, DEAL_DELAY);
    }

    advancePlayer() {
        this.currentTurn = (this.currentTurn + 1) % this.playerCount;
    }

    playCards(player, cards) {

    }
}

module.exports = {
    DealStateChange,
    GameState
}

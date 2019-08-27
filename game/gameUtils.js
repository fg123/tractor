class GameUtils {
    constructor(game) {
        this.game = game;
    }

    isAllNumber(cards, number) {
        return cards.every((card) => parseInt(card) === number);
    }

    isAllSuit(cards, suit) {
        return cards.every((card) => card.endsWith(suit));
    }

    isAllSameNumber(cards) {
        return cards.every((card) => parseInt(card) === parseInt(cards[0]));
    }

    isAllSameCard(cards) {
        return cards.every((card) => card == cards[0]);
    }

    isJoker(card) {
        return card === "JJ" || card === "J";
    }

    getSuit(card) {
        if (this.isJoker(card) || this.getNumber(card) === this.game.trumpNumber) {
            return this.game.trumpSuit;
        }
        return card[card.length - 1];
    }

    getNumber(card) {
        return parseInt(card);
    }

    validateLead(lead) {
        // TODO: throw and tractor needs to be implemented
        return this.isAllSameCard(lead);
    }

    validateFollow(lead, cards, hand) {
        // Convert cards into a "hand" so we can use "hand" operations
        cards = new Hand(cards);

        // Throw can allow lead to have different suits, assume for now that they
        //   are all same suits.
        let suit = this.getSuit(lead[0]);

        // Do they have enough of the suit to play?
        let shouldBePlayed = Math.min(lead.length, hand.countSuit(suit));
        if (cards.countSuit(suit) < shouldBePlayed) {
            throw "Invalid follow, you still have more of " + suit;
        }

        // TODO: implement pairs and stuff
    }
}

module.exports = GameUtils;
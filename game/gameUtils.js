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
        return card === 'JJ' || card === 'J';
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

    countSuit(hand, suit) {
        console.log(suit);
        console.log(Object.keys(hand.cardDict));
        console.log(Object.keys(hand.cardDict).map(x => this.getSuit(x)));


        return Object.keys(hand.cardDict).map(x => this.getSuit(x)).filter(x => x === suit).length;
    }
}

module.exports = GameUtils;
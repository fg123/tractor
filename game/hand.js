class Hand {
    constructor(input = []) {
        this.cardDict = {};
        this.cardDict['JJ'] = 0;
        this.cardDict['J'] = 0;
        for (let j = 1; j <= 13; j++) {
            this.cardDict[j + "D"] = 0;
            this.cardDict[j + "C"] = 0;
            this.cardDict[j + "S"] = 0;
            this.cardDict[j + "H"] = 0;
        }

        for (let i = 0; i < input.length; i++) {
            this.addCard(input[i]);
        }
    }

    addCard(card) {
        this.cardDict[card] += 1;
    }

    removeCard(card) {
        if (this.cardDict[card] > 0) {
            this.cardDict[card] -= 1;
        }
        else {
            throw "Card " + card + " does not exist in the hand!";
        }
    }

    countSuit(suit) {
        let count = 0;
        for (let j = 1; j <= 13; j++) {
            count += this.cardDict[j + suit];
        }
        return count;
    }
}
module.exports = Hand;
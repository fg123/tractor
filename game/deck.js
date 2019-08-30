class Deck {
    constructor(count, startShuffled) {
        this.deck = [];
        for (let i = 0; i < count; i++) {
            this.deck.push('JJ');
            this.deck.push('J');
            for (let j = 1; j <= 13; j++) {
                this.deck.push(j + 'D');
                this.deck.push(j + 'C');
                this.deck.push(j + 'S');
                this.deck.push(j + 'H');
            }
        }
        if (startShuffled) {
            this.shuffle();
        }
    }

    shuffle() {
        var currentIndex = this.deck.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = this.deck[currentIndex];
            this.deck[currentIndex] = this.deck[randomIndex];
            this.deck[randomIndex] = temporaryValue;
        }
    }

    draw() {
        return this.deck.pop();
    }

    size() {
        return this.deck.length;
    }
}

module.exports = Deck;

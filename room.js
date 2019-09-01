// This should really become an external module shared with
//   tetris, since they both have something like this.
const Player = require('./player');

class Room {
    static get State() {
        return {
            LOBBY: 'lobby',
            IN_GAME: 'in-game'
        }
    }

    constructor (id) {
        this.id = id;
        this.players = [];
        this.state = Room.State.LOBBY;
        this.admin = undefined;
        // TODO: incorporate game state here
        //this.gameState
    }

    addPlayer (player) {
        this.players.push(player);
    }

    removePlayer(player) {
        // Called when a player disconnects from the room.
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === player.name) {
                this.players.splice(i, 1);
                return;
            }
        }
    }

    isEmpty() {
        return this.players.length === 0;
    }

    pushSpectatorState() {
        // Sends the spectator state to everyone in the room.
        this.players.forEach(player => {
            player.socket.emit('client.spectator', this.getSpectatorState());
        });
    }

    getAdmin() {
        return this.players.length === 0 ? undefined : this.players[0].name;
    }

    startGame() {
        // TODO: check minimum 4 players!
        this.state = Room.State.IN_GAME;
        this.players.filter(x => x.state === Player.State.QUEUED).forEach(x => {
            x.state = Player.State.PLAYING;
            x.socket.emit('client.startGame');
        });
        this.pushSpectatorState();
    }

    onGameOver() {
        // Requeue all playing players
        this.state = Room.State.LOBBY;
        this.players.filter(x => x.state === Player.State.PLAYING).forEach(x => {
            console.log(x.name + ' has been reset.');
            x.state = Player.State.SPECTATING;
        });
        this.pushSpectatorState();
    }

    queue(name) {
        console.log('Queueing ' + name);
        if (this.players.filter(x => x.state === Player.State.QUEUED || x.state === Player.State.PLAYING).length >= 8) {
            return false;
        }
        const p = this.players.find(x => x.name === name);
        if (!p) return false;
        p.state = Player.State.QUEUED;
        this.pushSpectatorState();
        return true;
    }

    unqueue(name) {
        console.log('Unqueueing ' + name);
        const p = this.players.find(x => x.name === name);
        if (!p) return false;
        p.state = Player.State.SPECTATING;
        this.pushSpectatorState();
        return true;
    }

    getSpectatorState() {
        return {
            admin: this.getAdmin(),
            state: this.state,
            players: this.players.map(player => {
                return {
                    name: player.name,
                    state: player.state,
                    score: player.score
                };
            })
        };
    }
}
module.exports = Room;
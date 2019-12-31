class SpectatorState {
    constructor() {
        this.spectatorState = undefined;
    }

    updateSpectatorState(newState) {
        this.spectatorState = newState;
    }

    getStatusDisplay() {
        if (!this.spectatorState) return '';
        if (this.spectatorState.players.length === 0) return '';
        return `
			<b>Admin:</b> ${this.spectatorState.players[0].name}
			<br>
			<b>Playing:</b>
			<br>
			${this.getPlayersInGame()
                .map(p => p.name + " (" + p.score + ")")
                .join('<br>')}
			<br>
			<b>Queued:</b>
			<br>
			${this.getPlayersQueued()
                .map(p => p.name + " (" + p.score + ")")
                .join('<br>')}
			<br>
			<b>Spectating:</b>
			<br>
			${this.getPlayersSpectating()
                .map(p => p.name + " (" + p.score + ")")
                .join('<br>')}
			<br>
		`;
    }

    getPlayersQueued() {
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'queued');
    }

    getPlayersSpectating() {
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'spectating');
    }

    getPlayersInGame() {
        // TODO(anyone): Get constants between server and client to agree
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'playing');
    }

    getTitleText() {
        if (!this.spectatorState) return 'Tetris';
        if (this.spectatorState.state === 'lobby') return 'Tetris - Lobby';
        if (this.spectatorState.state === 'in-game') return 'Tetris - In Game';
    }

    shouldShowStartbutton(name) {
        if (!this.spectatorState) return false;
        if (this.spectatorState.players[0].name !== name) return false;
        return this.spectatorState.state === 'lobby' && this.getPlayersQueued().length >= 2;
    }

    getCtaButtonText(name) {
        if (!this.spectatorState) return 'Loading';
        if (this.getPlayersSpectating().some(p => p.name === name)) return 'Queue for Next Game';
        if (this.getPlayersQueued().some(p => p.name === name)) return 'Unqueue';
        return 'In Game';
    }

    onCtaButtonClick(name) {
        if (!this.spectatorState) return;
        if (this.getPlayersSpectating().some(p => p.name === name)) {
            emit('server.queue');
        } else if (this.getPlayersQueued().some(p => p.name === name)) {
            emit('server.unqueue');
        }
    }

    getStatusText(name) {
        if (!this.spectatorState) return 'Loading...';
        if (this.getPlayersSpectating().some(p => p.name === name)) return 'You are Spectating';
        if (this.getPlayersQueued().some(p => p.name === name)) return 'You are Queued for Next Game';
        return 'You are in game!';
    }

    onStartButtonClicked(name) {
        if (this.shouldShowStartbutton(name)) emit('server.start');
    }
}
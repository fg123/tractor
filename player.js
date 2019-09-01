class Player {
	static get State() {
		return {
			SPECTATING: 'spectating',
			QUEUED: 'queued',
			PLAYING: 'playing'
		}
	}
	constructor (socket, name, room) {
		this.socket = socket;
		this.name = name;
		this.room = room;
		this.state = Player.State.SPECTATING;
		this.score = 2;
	}
}
module.exports = Player;

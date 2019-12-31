// Setup Node,js with Express and Socket.io
const utils = require('./utils');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv4 = require('uuid/v4');
const path = require('path');

const Room = require('./room');
const Player = require('./player');

const port = process.env.PORT || 3000;

// Global Variables
const rooms = {};
const players = {};

http.listen(port, function() {
	console.log('listening on *:' + port);
});

app.use('/static/', express.static(path.join(__dirname, '/public')));
app.get('/room/*', function(request, result) {
    // TODO(felixguo): This is super arbitrary, probably is a better way
    const id = request.path.split('/')[2];
    if (request.path.endsWith('id.js')) {
        result.type('application/javascript');
        result.send(`let roomId = '${id}';`);
    } else {
        result.sendFile(path.join(__dirname, '/public/index.html'));
    }
    if (!rooms[id]) {
        rooms[id] = new Room(id);
    }
});
app.get('/', function(request, result) {
    // Redirect to a random, non-taken room
    var id;
    do {
        id = uuidv4();
    } while (id in rooms);
    result.redirect(307, '/room/' + id + '/');
});

io.on('connection', function (socket) {
	console.log('Connected');
	socket.on('server.join', function(data) {
		if (!rooms[data.room]) {
			rooms[data.room] = new Room(data.room);
		}
		if (rooms[data.room].players.contains(it => it.name === data.name)) {
			socket.emit('client.error', { error: 'Name is already taken!' });
			return;
		}
		const player = new Player(socket, data.name, rooms[data.room]);
		rooms[data.room].addPlayer(player);
		socket.emit('client.joinSuccess');
		rooms[data.room].pushSpectatorState();
		players[socket.id] = player;
	});

	socket.on('server.play_cards', function (data) {
		rooms[data.room].play(players[socket.id].name, data.cards);
	});

	socket.on('server.queue', function (data) {
		if (!rooms[data.room].queue(players[socket.id].name)) {
			socket.emit('client.error', { error: 'Too many people!' });
		}
	});

	socket.on('server.unqueue', function (data) {
		rooms[data.room].unqueue(players[socket.id].name);
	});

	socket.on('server.start', function (data) {
		if (rooms[data.room].getAdmin() === players[socket.id].name) {
			if (rooms[data.room].canStartGame()) {
				rooms[data.room].startGame();
			}
		}
	});

    socket.on('disconnect', function () {
		if (players[socket.id] !== undefined) {
			removePlayerFromRoom(players[socket.id]);
		}
	});
});


function removePlayerFromRoom(player) {
    const room = player.room;
    room.removePlayer(player);
    if (room.isEmpty()) {
        // Remove room if it's empty
        delete rooms[room.id];
    } else {
        // Notify rest of players someone left (as if they lost)
        room.pushSpectatorState();
    }
}

function generateRoomId() {
    var newId = (Math.random() * 1000) | 0;
    while (rooms[newId]) newId = (Math.random() * 1000) | 0;
    return newId;
}
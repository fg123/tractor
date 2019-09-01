// Setup Node,js with Express and Socket.io
const utils = require('./utils');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv4 = require('uuid/v4');
const path = require('path');

const { DealStateChange, GameState } = require('./game/game.js');
const Room = require('./room');
const Player = require('./player');

const port = process.env.PORT || 3000;
const ID_LEN = 20;

// Global Variables
const rooms = {};

http.listen(port, function() {
	console.log('listening on *:' + port);
});

// Serve Page to Server
// app.use(express.static(__dirname + '/public/'));
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/public/index.html');
// });
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

const players = {};
// const state = new GameState(4, 0, 2, (output) => {
// 	console.log(output);
// 	output.sendToClient(io.sockets.connected[PlayerList[output.player].id]);
// });

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

	socket.on('play-cards', function (cards) {
		// Erorr check and stuff
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
			if (rooms.canStartGame()) {
				rooms[data.room].startGame();
			}
		}
	});

    socket.on('disconnect', function () {
		if (players[socket.id] !== undefined) {
			removePlayerFromRoom(players[socket.id]);
		}
	});

    socket.on('nickname', function (name) {
		if (PlayerList.length < 4) {
			const playerPosition = addPlayer(name, socket.id);
			console.log('Username Assigned ' + name);
			socket.emit('lobbyEnter', socket.id, playerPosition);
			io.emit('updatePlayers', PlayerList);
			if (PlayerList.length === 4) // we have 4 players!
			{
				io.emit('setMainNumber', 2);
                state.start();
			}
			socket.on('play-cards', function (cards) {
				// Throws error to client if invalid
				state.playCards(playerPosition, cards);
			});
		}
		else {
			// Game is Full, send LobbyFull to Client
			socket.emit('lobbyFull', 1);
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
        room.onPlayerLose();
        room.pushSpectatorState();
    }
}

function generateRoomId() {
    var newId = (Math.random() * 1000) | 0;
    while (rooms[newId]) newId = (Math.random() * 1000) | 0;
    return newId;
}
// Setup Node,js with Express and Socket.io
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const { DealStateChange, GameState } = require('./game/game.js');


// Global Variables
var Client = require('./clients.js');
var PlayerList = [];

// Serve Page to Server
app.use(express.static(__dirname + "/public/"));
app.get('/', function(req, res){
  res.sendFile(__dirname + "/public/index.html");
});

io.on('connection', function(socket){
	console.log('User Connected');
    socket.on('disconnect', function ()
    {
        removePlayer(socket.id);
	});
    socket.on('nickname', function (name)
	{
		if (PlayerList.length < 4)
		{
			addPlayer(name, socket.id);
			console.log('Username Assigned ' + name);
			socket.emit("lobbyEnter", socket.id);
			io.emit("updatePlayers", PlayerList);
			if (PlayerList.length === 4) // we have 4 players!
			{
				io.emit("setMainNumber", 2);
				const state = new GameState(4, 0, 2, (output) => {
                    console.log(output);
                    io.sockets.connected[PlayerList[output.player].id].emit("cardDeal", output.card);
                });
                state.start();

			}
		}
		else
		{
			// Game is Full, send LobbyFull to Client
			socket.emit("lobbyFull", 1);
		}

    })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function addPlayer(name, id)
{
	var i = PlayerList.indexOf(null);
	if (i == -1)
	{
		PlayerList.push(new Client(name, id));
	}
	else
	{
		PlayerList[i] = new Client(name, id);
	}
}
function removePlayer(id)
{
    var index = PlayerList.findIndex(element => element.id === id);
	PlayerList[index] = null;
}

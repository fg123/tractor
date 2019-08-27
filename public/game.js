const socket = io();
let myId = "";
let players = [];
let gamePlaying = false;
let currentTurn = false;
let cardHand = [];
let mainCard = "5D";
let cardsToPlay = new Array();
let handToPlay = {};
let currentStart = { pairs: ["1H"], singles: ["13H"] };
let flipStatus = 0;

updateHand();
console.log(convertToHand(cardHand));
$("#game").hide();
$(".myOptions").hide();
$(".flipCard").hide();
$(document).ready(() => {
    $("#nickname").focus();
    $("#nickname").keydown((e) => {
        if (e.which === 13) {
            $("#joinGameBtn").click();
        }
    });
});
$("#joinGameBtn").click(function () {
	if ($("#nickname").val() != "")
	{
		socket.emit("nickname", $("#nickname").val());
		$("#login").hide();
	}
});
socket.on("updatePlayers", function (p) {
	players = p;
});
socket.on("lobbyEnter", function (id) {
	$("#game").show();
	myId = id;
});
socket.on("lobbyFull", function () {
	$("#login").show();
	alert("Lobby is full!");
});
socket.on("turnPassover", function (p) {
	currentTurn = true;
});
socket.on("flip", function (fStat) {
	flipStatus = fStat;
});
socket.on("setMainNumber", function (n) {
	mainCard = n + "D";
});
socket.on("cardDeal", function (cardToDeal) {
	$(".flipCard").show();
	cardHand.push(cardToDeal);
	updateHand();
	handContains(mainCard.slice(0, -1) + "D", flipStatus + 1) ? $(".flip-diamonds").show() : $(".flip-diamonds").hide();
	handContains(mainCard.slice(0, -1) + "C", flipStatus + 1) ? $(".flip-clubs").show() : $(".flip-clubs").hide();
	handContains(mainCard.slice(0, -1) + "H", flipStatus + 1) ? $(".flip-hearts").show() : $(".flip-hearts").hide();
	handContains(mainCard.slice(0, -1) + "S", flipStatus + 1) ? $(".flip-spades").show() : $(".flip-spades").hide();
	handContains("JJ", Math.max(flipStatus + 1, 2)) || handContains("J", Math.max(flipStatus + 1, 2)) ? $(".flip-joker").show() : $(".flip-joker").hide();
});
socket.on("updatePlayers", function (plist) {
	players = plist;

	updatePlayerUI();
});
$(".flip-diamonds").click(function () {
	socket.emit("flip", "D");
});
 $(".flip-clubs").click(function () {
	socket.emit("flip", "C");
});
 $(".flip-hearts").click(function () {
	socket.emit("flip", "H");
 });
 $(".flip-spades").click(function () {
	socket.emit("flip", "S");
 });
$(".card").click(function () {
	if ($(this).data("selected"))
	{
		toggleCard($(this).data("card"), 0);
		$(this).data("selected", 0);
		$(this).removeClass("selected");
	}
	else
	{
		toggleCard($(this).data("card"), 1);
		$(this).data("selected", 1);
		$(this).addClass("selected");
	}
	handToPlay = convertToHand(cardsToPlay);
	if (isLegal())
	{
		$(".myOptions").show();
	}
	else
	{
		$(".myOptions").hide();
	}
	//console.log(handToPlay);
});

// handContains(card, count) returns true if your hand contains the given number
//   of the card
function handContains(card, count)
{
	var wHand = cardHand.slice();
	while (count != 0)
	{
		var i = wHand.indexOf(card);
		if (i != -1) // has card
		{
			wHand.splice(i, 1); // we remove
		}
		else
		{
			return false;
		}
		count--;
	}
	return true;
}

// updatePlayerUI() reloads the other user displays.
function updatePlayerUI()
{
	let htmlStrings = [];
	let rotate = 0;
	for (let i = 0; i < players.length; i++) {
		if (players[i].id !== myId) {
			htmlStrings.push(`<div class="otherPlayer player">
				<span class="name">${players[i].name}</span><br><br>
				<div class="card back display"></div>
			</div>`);
		}
		else {
			rotate = i;
		}
	}
	htmlStrings = htmlStrings.concat(htmlStrings);
	let htmlString = "";
	for (let i = 0; i < players.length - 1; i++) {
		htmlString += htmlStrings[i + rotate];
	}
	$(".otherPlayers").html(htmlString);
	var playerList = "<b>Players: </b>";
	var i = 0;
	while (i < players.length)
	{
		if (players[i] != null)
		{
			playerList += "<br>" + players[i].name + " 打 " + players[i].score;

		}
		i++;
	}
	$(".scoreboard").html(playerList);
}
// toggleCard(cardValue) when user clicks on the card.
function toggleCard(cardValue, add)
{
	console.log("Old cards to play " + cardsToPlay);
	if (add)
	{
		cardsToPlay.push(cardValue);
	}
	else
	{
		console.log("Removed from cardsToPlay: " + cardValue + " " + cardsToPlay);
		cardsToPlay.splice(cardsToPlay.indexOf(cardValue), 1);
	}
	console.log("New Cards to Play: " + cardsToPlay);
}

// createCard(cardValue, index, xPos) produces a string of the created card with
//   the given values.
// createCard: Str Num Num -> Str
function createCard(cardValue, index, xPos)
{
	var cardClass = "card ";
	var cardDisplayNum = "";
	var cardSuit = "";
	if (cardValue == "JJ") //big joker
	{
		cardDisplayNum = "<br><br>";
		cardClass += "bJoker ";
		cardSuit = "&#129313;";
	}
	else if (cardValue == "J") //small joker
	{
		cardDisplayNum = "<br><br>";
		cardClass += "sJoker ";
		cardSuit = "&#129313;";
	}
	else // regular card
	{
		var cLen = cardValue.length;
		var cSuit = cardValue.slice(-1);
		var cVal = cardValue.substring(0, cLen - 1);
		if (cSuit == "H")
		{
			cardSuit = "&hearts;";
			cardClass += "hearts ";
		}
		else if (cSuit == "C")
		{
			cardSuit = "&clubs;";
			cardClass += "clubs ";
		}
		else if (cSuit == "S")
		{
			cardSuit = "&spades;";
			cardClass += "spades ";
		}
		else if (cSuit == "D")
		{
			cardSuit = "&diams;";
			cardClass += "diamonds ";
		}

		if (cVal == "11")
		{
			cardDisplayNum = "J<br>" + cardSuit;
		}
		else if (cVal == "12")
		{
			cardDisplayNum = "Q<br>" + cardSuit;
		}
		else if (cVal == "13")
		{
			cardDisplayNum = "K<br>" + cardSuit;
		}
		else if (cVal == "1")
		{
			cardDisplayNum = "A<br>" + cardSuit;
		}
		else
		{
			cardDisplayNum = cVal + "<br>" + cardSuit;
		}
	}
	return '<div data-selected="0" data-card="' + cardValue + '" style="z-index:' + index + ';left:' + xPos + 'px" class="' + cardClass + '" > \
		<div class="value"> \
						'+cardDisplayNum+'\
					</div>\
					<div class="suit">    		\
						'+cardSuit+'\
					</div></div>';
}

// sortHand() sorts the cards in cardHand based on Joker, Main Numbers,
//   Main Suit, Rest
function sortHand()
{
	var mainSuit = mainCard.slice(-1);
	var mainValue = parseInt(mainCard.substring(0, mainCard.length - 1), 10);

	var mains = new Array();
	var hearts = new Array();
	var spades = new Array();
	var diamonds = new Array();
	var clubs = new Array();
	var jokers = new Array();
	for (var i = 0; i < cardHand.length; i++)
	{
		var c = cardHand[i];
		if (c == "JJ")
		{
			jokers.unshift(c);
		}
		else if(c == "J")
		{
			jokers.push(c);
		}
		else
		{
			var suit = c.slice(-1);
			var val = parseInt(c.substring(0, c.length - 1), 10);
			if (val == mainValue) // is a main value card
			{
				if (suit == mainSuit) mains.unshift(c);
				else mains.push(c);
			}
			else
			{
				switch (suit)
				{
					case "H": hearts = insertInto(c, hearts); break;
					case "D": diamonds = insertInto(c, diamonds); break;
					case "S": spades = insertInto(c, spades); break;
					case "C": clubs = insertInto(c, clubs); break;
				}
			}
		}
	}
	cardHand = jokers.concat(mains);
	if (mainSuit == "N") // no suit
	{
		mainSuit = "D"; // just for ordering purposes
	}
	switch (mainSuit)
	{
		case "H":
			cardHand = cardHand.concat(
				hearts.concat(spades.concat(diamonds.concat(clubs))));
			break;
		case "D":
			cardHand = cardHand.concat(
				diamonds.concat(clubs.concat(hearts.concat(spades))));
			break;
		case "S":
			cardHand = cardHand.concat(
				spades.concat(diamonds.concat(clubs.concat(hearts))));
			break;
		case "C":
			cardHand = cardHand.concat(
				clubs.concat(hearts.concat(spades.concat(diamonds))));
			break;
	}
}
// insertInto(card, lst) inserts the card into the list in order and produces
//   the resulting list.
// insertInto: Str Arr<Str> -> Arr<Str>
function insertInto(card, lst)
{
	var cVal = parseInt(card.substring(0, card.length - 1), 10);
	var nVal = 0;
	var currVal;
	for (var i = 0; i < lst.length; i++)
	{
		currVal = parseInt(lst[i], 10);
		if (cVal == 1) { cVal = 14; } //to guarantee 1 is at the end
		if (currVal == 1) { currVal = 14; } //to guarantee 1 is at the end
		//console.log(cVal + " " + currVal);
		if (cVal >= currVal)
		{
			lst.splice(i, 0, card);
			return lst;
		}

	}
	lst.push(card);
	return lst;
}
// updateHand() updates the player's hand with the cards in cardHand
function updateHand()
{
	sortHand();
	var output = "";
	for (var i = 0; i < cardHand.length; i++)
	{
		output += createCard(cardHand[i], i, i * 30);
	}
	$(".me").width(cardHand.length * 30 + 80);
	$(".me").html(output);
}

// convertToHand(loC) converts an array of cards into a hand object
function convertToHand(loC)
{
	var s = [];
	var p = [];
	for (var i = 0; i < loC.length; i++)
	{
		var find = s.indexOf(loC[i]);
		if (find != -1)
		{
			p.push(loC[i]);
			s.splice(find, 1);
		}
		else
		{
			s.push(loC[i]);
		}
	}
	return { pairs: p, singles: s };
}

// convertToList(hand) converts a hand back to a list
function convertToList(hand)
{
	var list = new Array();
	for (var i = 0; i < hand.pairs.length; i++)
	{
		list.push(hand.pairs[i]);
		list.push(hand.pairs[i]);
	}
	for (var i = 0; i < hand.singles.length; i++)
	{
		list.push(hand.singles[i]);
	}
	return list;
}

// isLegal() returns true if the handToPlay is legal and false otherwise
function isLegal()
{
	var currentStartL = convertToList(currentStart);
	console.log(currentStartL);
	var startIsMain = isMain(currentStartL[0]);
	var activeSuit = currentStartL[0].slice(-1);
	// Case1, no suit of the currentStart, we allow player to play any cards as
	//   long as it matches the count.
	console.log("Has playable? + " + hasPlayable(activeSuit, cardHand, startIsMain));
	if (!hasPlayable(activeSuit, cardHand, startIsMain))
	{
		return (currentStartL.length == cardsToPlay.length);
	}
	else
	{
		if (currentStartL.length == cardsToPlay.length)
		{
			// If the player has less cards of the suit than is possible to
			//   play, we force them to play all of possible.
			console.log(countPlayable(activeSuit, cardHand, startIsMain));
			if (countPlayable(activeSuit, cardHand, startIsMain) <= cardsToPlay.length) {
				// We remove all the cards they want to play. If the playable
				//   left is 0, then it's legal.
				return (countPlayable(activeSuit, difference(cardHand, cardsToPlay), startIsMain) == 0);
			}
			// Player has enough Cards! Here we have to check the hands.
			else
			{
				console.log(countPlayable(activeSuit, cardsToPlay, startIsMain));
				// All cards have to be the right suit.
				if (countPlayable(activeSuit, cardsToPlay, startIsMain) == cardsToPlay.length)
				{
					// Just have enough pairs to play in my hand.
					console.log(countPlayable(activeSuit, convertToHand(cardHand).pairs, startIsMain));
					console.log(handToPlay.pairs.length);
					if (countPlayable(activeSuit, convertToHand(cardHand).pairs, startIsMain)
						>= currentStart.pairs.length) {
						return (handToPlay.pairs.length == currentStart.pairs.length);
					}
					else // Not enough pairs to play, so we have to use up all pairs.
					{
						console.log(countPlayable(activeSuit, convertToHand(difference(cardHand, cardsToPlay)).pairs, startIsMain));
						return (countPlayable(activeSuit, convertToHand(difference(cardHand, cardsToPlay)).pairs, startIsMain) == 0);
					}
				}
				else
				{
					return false;
				}
			}
		}
		else
		{
			return false;
		}
	}
}

// difference(a, b) removes all elements of b from a
// difference: Arr<Str>, Arr<Str> -> Arr<Str>
function difference(a, b)
{
	var lst = a.slice();
	var lstb = b.slice();
	while(lstb.length != 0)
	{
		var findIndex = lst.indexOf(lstb.pop());
		if (findIndex != -1)
		{
			lst.splice(findIndex, 1);
		}
	}
	return lst;
}

// isMain(card) returns true if the card belongs to the main group
function isMain(card)
{
	return (card.slice(-1) == mainCard.slice(-1) ||
		card == "JJ" ||
		card == "J" ||
		parseInt(card.substring(0, card.length - 1), 10)
		== parseInt(mainCard.substring(0, mainCard.length - 1), 10));
}

// hasPlayable(suit, isMain) returns true if hand contains one of the suit and
//   also factors in the calculation for the main card.
function hasPlayable(suit, loC, isMain0)
{
	for (var i = 0; i < loC.length; i++)
	{
		if (isMain0)
		{
			if (isMain(loC[i]))
			{
				return true;
			}
		}
		else
		{
			if (loC[i].slice(-1) == suit && !isMain(loC[i]))
			{
				console.log("Reached");
				return true;
			}
		}
	}
	return false;
}

// countPlayable(suit, isMain) returns number of playable cards
function countPlayable(suit, loC, isMain0)
{
	var res = 0;
	for (var i = 0; i < loC.length; i++)
	{
		if (isMain0)
		{
			if (isMain(loC[i]))
			{
				res++;
			}
		}
		else
		{
			if (loC[i].slice(-1) == suit && !isMain(loC[i]))
			{
				res++;
				console.log("hi it's suit" );
			}
		}
	}
	return res;
}

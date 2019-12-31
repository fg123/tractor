const socket = io();
const spectatorState = new SpectatorState();
let myName = '';
let myId = '';
let players = [];
let gamePlaying = false;
let currentTurn = false;
let cardHand = [];
let mainCard = '5D';
let cardsToPlay = [];
let flipStatus = 0;
const errorQueue = [];
let errorTimer = undefined;

const ERROR_TIMEOUT = 1000;

const TEST_AUTO_JOIN = true;

updateHand();
$('#game').hide();
$('.flipCard').hide();
function emit(endpoint, data) {
    if (!data) data = {};
    console.log('Emitting ' + endpoint);
    data.room = roomId;
    socket.emit(endpoint, data);
}

$(document).ready(() => {
    $('#nickname').focus();
    $('#nickname').keydown((e) => {
        if (e.which === 13) {
            $('#joinGameBtn').click();
        }
    });
});

$('#joinGameBtn').click(function () {
	myName = $('#nickname').val();
	if ($('#nickname').val() != '') {
		emit('server.join', {
			name: $('#nickname').val()
		});
	}
});

$('.play-cards').click(function () {
	console.log('Playing cards', cardsToPlay, cardHand.filter((v, i) => cardsToPlay[i]));
	emit('server.play_cards', {
		cards: cardHand.filter((v, i) => cardsToPlay[i])
	});
});

$('.cta').click(function(e) {
	spectatorState.onCtaButtonClick(myName);
});

$('.start.btn').click(function(e) {
	spectatorState.onStartButtonClicked(myName);
});

if (TEST_AUTO_JOIN) {
	$('#nickname').val(Date.now());
	$('#joinGameBtn').click();
}

socket.on('client.spectator', function (data) {
	console.log(data);
	spectatorState.updateSpectatorState(data);
	$('.roomStatus').html(spectatorState.getStatusDisplay());
	$('.title h1').text(spectatorState.getTitleText());
	$('.cta').text(spectatorState.getCtaButtonText(myName));
	$('.playerStatus h4').text(spectatorState.getStatusText(myName));
	if (spectatorState.shouldShowStartbutton(myName)) {
		$('.start.btn').show();
	} else {
		$('.start.btn').hide();
	}
	if (TEST_AUTO_JOIN && !window.__cta__test_clicked) {
		window.__cta__test_clicked = true;
		$('.cta').click();
	}
});

socket.on('client.error', function (data) {
	console.error(Error(data));
	errorQueue.push(data);
	showErrorIfNecessary();
});

socket.on('updatePlayers', function (p) {
	players = p;
});

socket.on('client.joinSuccess', function () {
	$('#game').show();
	$('#login').hide();
});

socket.on('disconnect', function() {
	// alert('Server disconnected.');
	window.location.reload();
});

socket.on('client.play_cards', function (who, cards) {
	addPlayed(who, cards);
});

socket.on('client.remove_cards', function (cards) {
	removeCardsFromHand(cards);
});

function addPlayed(who, cards) {
	const playerName = spectatorState.getPlayersInGame()[who].name;
	const newElem = $(`<div class="playingField"></div>`);
	newElem.width(cards.length * 30 + 80);
	for (let i = 0; i < cards.length; i++) {
		newElem.append($(createCard(cards[i], i, i * 30)));
	}
	const wrapper = $(`<div class="wrapper"><div class="name">${playerName} played</div></div>`);
	wrapper.append(newElem);
	$('.playHistory').append(wrapper);

	$('.playHistory').scrollTop($('.playHistory')[0].scrollHeight);
}

function removeCardsFromHand(cards) {
	for (let i = 0; i < cards.length; i++) {
		cardHand.splice(cardHand.indexOf(cards[i]), 1);
	}
	cardsToPlay = [];
	updateHand();
}

function errorTimeout() {
	errorTimer = undefined;
	if (errorQueue.length === 0) {
		$('.errorMessage').html('');
	}
	else {
		showErrorIfNecessary();
	}
}

function showErrorIfNecessary() {
	if (errorTimer === undefined && errorQueue.length !== 0) {
		$('.errorMessage').html(errorQueue.shift());
		errorTimer = setTimeout(errorTimeout, ERROR_TIMEOUT);
	}
}

socket.on('client.card_deal', function (cardToDeal) {
	console.log('Card Deal Event');
	cardHand.push(cardToDeal);
	updateHand();
	handContains(mainCard.slice(0, -1) + 'D', flipStatus + 1) ? $('.flip-diamonds').show() : $('.flip-diamonds').hide();
	handContains(mainCard.slice(0, -1) + 'C', flipStatus + 1) ? $('.flip-clubs').show() : $('.flip-clubs').hide();
	handContains(mainCard.slice(0, -1) + 'H', flipStatus + 1) ? $('.flip-hearts').show() : $('.flip-hearts').hide();
	handContains(mainCard.slice(0, -1) + 'S', flipStatus + 1) ? $('.flip-spades').show() : $('.flip-spades').hide();
	handContains('JJ', Math.max(flipStatus + 1, 2)) || handContains('J', Math.max(flipStatus + 1, 2)) ? $('.flip-joker').show() : $('.flip-joker').hide();
});

socket.on('updatePlayers', function (plist) {
	players = plist;

	updatePlayerUI();
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
			htmlStrings.push(`<div class='otherPlayer player'>
				<span class='name'>${players[i].name}</span><br><br>
				<div class='playingField player-${i}'></div>
			</div>`);
		}
		else {
			rotate = i;
		}
	}
	htmlStrings = htmlStrings.concat(htmlStrings);
	let htmlString = '';
	for (let i = 0; i < players.length - 1; i++) {
		htmlString += htmlStrings[i + rotate];
	}
	$('.otherPlayers').html(htmlString);
	var playerList = '<b>Players: </b>';
	var i = 0;
	while (i < players.length)
	{
		if (players[i] != null)
		{
			playerList += '<br>' + players[i].name + ' 打 ' + players[i].score;

		}
		i++;
	}
	$('.scoreboard').html(playerList);
}

// toggleCard(cardPosition) when user clicks on the card.
function toggleCard(cardPosition)
{
	cardsToPlay[cardPosition] = !cardsToPlay[cardPosition];
}

// createCard(cardValue, index, xPos) produces a string of the created card with
//   the given values.
// createCard: Str Num Num -> Str
function createCard(cardValue, index, xPos)
{
	var cardClass = 'card ';
	var cardDisplayNum = '';
	var cardSuit = '';
	if (cardValue == 'JJ') //big joker
	{
		cardDisplayNum = '<br><br>';
		cardClass += 'bJoker ';
		cardSuit = '&#129313;';
	}
	else if (cardValue == 'J') //small joker
	{
		cardDisplayNum = '<br><br>';
		cardClass += 'sJoker ';
		cardSuit = '&#129313;';
	}
	else // regular card
	{
		var cLen = cardValue.length;
		var cSuit = cardValue.slice(-1);
		var cVal = cardValue.substring(0, cLen - 1);
		if (cSuit == 'H')
		{
			cardSuit = '&hearts;';
			cardClass += 'hearts ';
		}
		else if (cSuit == 'C')
		{
			cardSuit = '&clubs;';
			cardClass += 'clubs ';
		}
		else if (cSuit == 'S')
		{
			cardSuit = '&spades;';
			cardClass += 'spades ';
		}
		else if (cSuit == 'D')
		{
			cardSuit = '&diams;';
			cardClass += 'diamonds ';
		}

		if (cVal == '11')
		{
			cardDisplayNum = 'J<br>' + cardSuit;
		}
		else if (cVal == '12')
		{
			cardDisplayNum = 'Q<br>' + cardSuit;
		}
		else if (cVal == '13')
		{
			cardDisplayNum = 'K<br>' + cardSuit;
		}
		else if (cVal == '1')
		{
			cardDisplayNum = 'A<br>' + cardSuit;
		}
		else
		{
			cardDisplayNum = cVal + '<br>' + cardSuit;
		}
	}
	return `<div
		data-selected='0'
		data-card='${cardValue}'
		style='z-index: ${index}; left: ${xPos}px'
		class='${cardClass}'>
			<div class='value'>${cardDisplayNum}</div>
			<div class='suit'>${cardSuit}</div>
	</div>`;
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
		if (c == 'JJ')
		{
			jokers.unshift(c);
		}
		else if(c == 'J')
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
					case 'H': hearts = insertInto(c, hearts); break;
					case 'D': diamonds = insertInto(c, diamonds); break;
					case 'S': spades = insertInto(c, spades); break;
					case 'C': clubs = insertInto(c, clubs); break;
				}
			}
		}
	}
	cardHand = jokers.concat(mains);
	if (mainSuit == 'N') // no suit
	{
		mainSuit = 'D'; // just for ordering purposes
	}
	switch (mainSuit)
	{
		case 'H':
			cardHand = cardHand.concat(
				hearts.concat(spades.concat(diamonds.concat(clubs))));
			break;
		case 'D':
			cardHand = cardHand.concat(
				diamonds.concat(clubs.concat(hearts.concat(spades))));
			break;
		case 'S':
			cardHand = cardHand.concat(
				spades.concat(diamonds.concat(clubs.concat(hearts))));
			break;
		case 'C':
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
		//console.log(cVal + ' ' + currVal);
		if (cVal >= currVal)
		{
			lst.splice(i, 0, card);
			return lst;
		}

	}
	lst.push(card);
	return lst;
}

function updateSelectedCards() {
	for (let i = 0; i < cardHand.length; i++) {
		let card = $('.me div:nth-child(' + (i + 1) + ')');
		if (cardsToPlay[i]) {
			card.data('selected', 1);
			card.addClass('selected');
		}
		else {
			card.data('selected', 0);
			card.removeClass('selected');
		}
	}
	if (Object.values(cardsToPlay).filter(Boolean).length > 0) {
		$('.play-cards').show();
	}
	else {
		$('.play-cards').hide();
	}
}

// updateHand() updates the player's hand with the cards in cardHand
function updateHand()
{
	// TODO: sortHand makes the cardsToPlay awkward as it shifts
	sortHand();
	console.log(cardHand);
	var output = '';
	$('.me').width(cardHand.length * 30 + 80);
	$('.me').html('');
	for (let i = 0; i < cardHand.length; i++) {
		let card = $(createCard(cardHand[i], i, i * 30));
		// So it captures the right number in the closure.
		let j = i;
		card.click(function () {
			toggleCard(j);
			updateSelectedCards();
		});
		$('.me').append(card);
	}
	updateSelectedCards();
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
	console.log('Has playable? + ' + hasPlayable(activeSuit, cardHand, startIsMain));
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
		card == 'JJ' ||
		card == 'J' ||
		parseInt(card.substring(0, card.length - 1), 10)
		== parseInt(mainCard.substring(0, mainCard.length - 1), 10));
}

function byId(id) {
  return document.getElementById(id);
}

function makeMove(from, to) {
  var eventClick = document.createEvent('Events');
  var eventHover = document.createEvent('Events');

  eventClick.initEvent('click', true, false);
  eventHover.initEvent('mouseover', true, false);

  byId(from).childNodes[1].dispatchEvent(eventClick);
  byId(to).childNodes[0].dispatchEvent(eventHover);
  byId(to).childNodes[0].dispatchEvent(eventClick);
}

function getColorFromLink(url) {
  return (url.indexOf('black') == -1 ? 'w' : 'b');
}

function getPlayerColor() {
  LINK_TITLE = 'Share this URL to let spectators see the game';

  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++)
    if (links[i].getAttribute('title') == LINK_TITLE)
      return getColorFromLink(links[i].getAttribute('href'));
  return null;
}

function getTurn() {
  var div = document.getElementsByClassName('lichess_player')[0];

  return (div.style.display == 'none' ? 'b' : 'w');
}

function getFen() {
  var xhr = new XMLHttpRequest();
  var fen = null; 

  if (this.fenUrl === undefined)
  {
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++)
      if (links[i].innerHTML == 'FEN')
        this.fenUrl = links[i].getAttribute('href');

    if (this.fenUrl === undefined)
      return null;
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200)
      fen = xhr.responseText;
  }

  xhr.open('GET', this.fenUrl, false);
  xhr.send();
  return fen;
}

WebSocket.prototype.sendJSON = function(data) {
  this.send(JSON.stringify(data));
}

function Chess(onConnected) {
  var _this = this;
  this.sock = new WebSocket('ws://localhost:8000');

  this.sock.onopen = function(event) {
    _this.sock.sendJSON({op: 'start'});
    onConnected(_this);
  }

  this.sock.onmessage = function(event) {
    var data = JSON.parse(event.data);
    _this.handleMessage(data);
  }

  this.handlers = {};
}

Chess.prototype.handleMessage = function(data) {
  console.log(data);

  if ('error' in data) {
    console.log('ERROR: ' + data.error);
    return;
  }

  if (!('op' in data)) {
    console.log('ERROR: Data received without opcode.');
    return;
  }

  if (data.op in this.handlers)
    for (var i = 0; i < this.handlers[data.op].length; i++)
        this.handlers[data.op][i](data);
};

Chess.prototype.on = function(op, callback) {
  if (!(op in this.handlers))
    this.handlers[op] = [];
  this.handlers[op].push(callback);
};

Chess.prototype.getNextMove = function(duration) {
  var packet = {
    op: 'get_next_move',
    fen: getFen(),
  };

  if (duration !== undefined)
    packet.duration = duration;

  this.sock.sendJSON(packet);
};

var playerColor = getPlayerColor();
var lastMove = null;

function time() {
  return (new Date()).getTime();
}

function calculateMoveDuration(opponentDuration) {
  return 1000;

  // right now i'm just telling Stockfish to think for a second, but you can
  // also have it think proportional to how long the opponent thinks, like
  // Math.floor(oppenentDuration / 2) or something.
}

function checkTurnChange() {
  if (self.turn === undefined) {
    self.turn = getTurn();
    return;
  }

  var turn = getTurn();

  // if it's changed to my turn, make a move
  if (turn != self.turn) {
    if (turn == playerColor)
      chess.getNextMove(calculateMoveDuration(time() - lastMove));
    self.turn = turn;
  }
}

var chess = new Chess(function(obj) {
  // if it's our turn, start by making a move
  if (playerColor == getTurn())
    obj.getNextMove();

  lastMove = time();

  // poll for turn changes
  setInterval(checkTurnChange, 100);
});

// once we receive a move, make it
chess.on('make_move', function(data) {
  makeMove(data.move_from, data.move_to);
  lastMove = time();
});

# lichess-bot

This is a bot for lichess. It interacts with the site with a
JavaScript hook that you have to install using Greasemonkey or
something. It talks to a web socket server written in Python, which in
turn talks to a Stockfish process.

## Usage

You need Python and [Stockfish](http://Stockfishchess.org/) installed.
Stockfish must be in your $PATH.

    python server.py

Then, install hook.js onto the game page using Greasemonkey or userscripts
or whatever. Just install it onto en.lichess.org/******. You can
always turn it off when you're not in-game.

What I did as a hack was run this one-line Bash mini-web-server:

    while true; do { echo -e 'HTTP/1.1 200 OK\r\n'; cat hook.js; } | nc -l 8080; done

then everytime I entered a game, I opened my browser's JavaScript
console and ran:

  var script = document.createElement('script');

  script.setAttribute('src', 'http://localhost:8080/');
  document.head.appendChild(script);

to dynamically include the script into the head.

If you've successfully set up the Python server and installed the
script onto the game page, Stockfish should play for you.

If it ever just stops working, it's probably because the other player
moved so fast the script didn't get a chance to see that a turn passed
(that's how it knows when to ask the websocket server for another
move). If that happens, just reload the script.

## Remarks

You shouldn't ever lose unless you're playing another player using a
computer. Stockfish's rating is over 3,000.

<div>
I set Stockfish to go full-aggressive because I like fast games. I set
it to use four threads, but you should change that to the number of cores
your computer has. You can change these things (and a couple other
settings) in Engine.__init__.
</div>

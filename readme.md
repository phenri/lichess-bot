# lichess-bot

This is a bot for [lichess](http://lichess.org). It interacts with the site
through a JavaScript proxy that talks to a localhost WebSocket server written
in Python that talks to a Stockfish process.

## Usage

You need Python and [Stockfish](http://Stockfishchess.org/) installed.
Make sure Stockfish is in your $PATH. Run the websocket server:

    python server.py

Next, install hook.js onto the game page using Greasemonkey or userscripts or
whatever. Just install it onto en.lichess.org/*. Alternately, a little
hack you can use if you just want to test out lichess-bot is to run this
one-line Bash mini-web-server:

    while true; do { echo -e 'HTTP/1.1 200 OK\r\n'; cat hook.js; } | nc -l 8080; done

and then everytime you enter a game, open your browser's JavaScript
console and run:

  var script = document.createElement('script');

  script.setAttribute('src', 'http://localhost:8080/');
  document.head.appendChild(script);

to dynamically include the script into the head.

Once you've done all that, you should see Stockfish making moves for you. If it
ever stops, it's probably because the other player moved so fast the script
didn't get a chance to see that a turn passed (that's how it knows when to ask
the websocket server for another move). Just reload the script if that happens.

## Notes

You should never lose unless you run into another computer. Stockfish's rating
is over 3,000.

<div>
I set Stockfish to favor aggressiveness because I like fast games. I use four
threads, but you should change that to the number of cores your processor has.
You can change these things (and a few other settings) in Engine.__init__.
</div>

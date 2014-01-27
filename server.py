#!/usr/bin/env python
from subprocess import Popen, PIPE
from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer
import signal
import sys
import json

PORT = 8000


class Engine:
    def __init__(self):
        self._proc = Popen(['stockfish'], stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self._proc.stdin.write('setoption name Hash value 128\n')
        self._proc.stdin.write('setoption name Threads value 4\n')
        self._proc.stdin.write('setoption name Best Book Move value true\n')
        self._proc.stdin.write('setoption name Aggressiveness value 200\n')
        self._proc.stdin.write('setoption name Cowardice value 0\n')
        self._proc.stdin.write('setoption name Contempt Factor value 50\n')

    def update_pos(self, fen):
        self._proc.stdin.write('position fen %s\n' % fen)

    def get_next_move(self, fen=None, time_limit=50):
        if fen is not None:
            self.update_pos(fen)

        self._proc.stdin.write('go movetime %d\n' % time_limit)

        line = self._proc.stdout.readline()
        while not line.startswith('bestmove'):
            line = self._proc.stdout.readline()
            print line

        return line.split(' ')[1]

    def close(self):
        self._proc.kill()


# to anyone reading this code, i swear i would've underscores instead of camelcase, but
# the kid who wrote SimpleWebSocketServer decided he didn't like standard python naming conventions

class Client(WebSocket):
    def __init__(self, *args):
        WebSocket.__init__(self, *args)
        self._engine = Engine()

    def sendMessage(self, data):
        WebSocket.sendMessage(self, json.dumps(data))

    def handleMessage(self):
        try:
            if self.data is None:
                self.sendClose()
                return

            print '%s: %s' % (str(self.address), self.data)

            self.data = str(self.data)
            self.data = json.loads(self.data)

            if self.data['op'] == 'start':
                self._engine.close()
                self._engine = Engine()

            if self.data['op'] == 'get_next_move':
                params = [self.data['fen']]
                if 'duration' in self.data:
                    params.append(self.data['duration'])

                next_move = self._engine.get_next_move(*params)
                src, dest = next_move[:2], next_move[2:]
                self.sendMessage({
                    'op': 'make_move',
                    'move_from': src,
                    'move_to': dest
                })
        except Exception as e:
            self.sendMessage({'error': str(e)})

    def handleConnected(self):
        print '%s: <connected>' % str(self.address)

    def handleClose(self):
        print '%s: <closed>' % str(self.address)


if __name__ == '__main__':
    server = SimpleWebSocketServer('', PORT, Client)

    def close_sig_handler(signal, frame):
        server.close()
        sys.exit()

    signal.signal(signal.SIGINT, close_sig_handler)
    print 'listening on port %d' % PORT
    server.serveforever()

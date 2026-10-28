#!/usr/bin/env python3
"""Local preview server for the site with caching turned off. Usage: python3 tools/serve.py [port]"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
root = Path(__file__).resolve().parent.parent
ThreadingHTTPServer(('127.0.0.1', port), partial(NoCache, directory=str(root))).serve_forever()

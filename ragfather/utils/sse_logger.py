import logging
import asyncio
from collections import deque

class LogBroadcaster:
    def __init__(self):
        self.history = deque(maxlen=500)
        self.queues = set()

    def emit(self, message: str):
        self.history.append(message)
        # Notify all active queues. Handle threads safely.
        for q, loop in list(self.queues):
            if loop.is_closed():
                self.queues.discard((q, loop))
                continue
            loop.call_soon_threadsafe(q.put_nowait, message)

log_broadcaster = LogBroadcaster()

class SSELogHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            log_broadcaster.emit(msg)
        except Exception:
            self.handleError(record)

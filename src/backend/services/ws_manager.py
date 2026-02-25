import json
from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, scan_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[scan_id].append(websocket)

    def disconnect(self, scan_id: str, websocket: WebSocket) -> None:
        self._connections[scan_id].remove(websocket)
        if not self._connections[scan_id]:
            del self._connections[scan_id]

    async def broadcast(self, scan_id: str, message: dict) -> None:
        connections = self._connections.get(scan_id, [])
        dead: list[WebSocket] = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(scan_id, ws)


manager = ConnectionManager()

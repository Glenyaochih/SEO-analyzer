from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.ws_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/scans/{scan_id}")
async def websocket_scan(scan_id: str, websocket: WebSocket):
    await manager.connect(scan_id, websocket)
    try:
        while True:
            # Keep connection alive; crawler broadcasts via manager.broadcast()
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(scan_id, websocket)

import type { WsMessage } from '@/types/index';

type WsStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface WebSocketClient {
  connect: () => void;
  disconnect: () => void;
  onMessage: (handler: (msg: WsMessage) => void) => void;
  onStatusChange: (handler: (status: WsStatus) => void) => void;
}

export function createWebSocketClient(scanId: string): WebSocketClient {
  const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';
  let ws: WebSocket | null = null;
  let messageHandler: ((msg: WsMessage) => void) | null = null;
  let statusHandler: ((status: WsStatus) => void) | null = null;

  const setStatus = (s: WsStatus) => statusHandler?.(s);

  return {
    connect() {
      if (ws) return;
      setStatus('connecting');
      ws = new WebSocket(`${WS_BASE}/ws/scans/${scanId}`);

      ws.onopen = () => setStatus('open');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          messageHandler?.(msg);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => setStatus('error');

      ws.onclose = () => {
        ws = null;
        setStatus('closed');
      };
    },

    disconnect() {
      ws?.close();
      ws = null;
    },

    onMessage(handler) {
      messageHandler = handler;
    },

    onStatusChange(handler) {
      statusHandler = handler;
    },
  };
}

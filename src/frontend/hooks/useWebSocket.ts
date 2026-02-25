'use client';

import { useEffect, useRef, useState } from 'react';
import { createWebSocketClient } from '@/lib/websocket';
import type { WsMessage } from '@/types/index';

type WsStatus = 'connecting' | 'open' | 'closed' | 'error';

interface UseWebSocketResult {
  messages: WsMessage[];
  status: WsStatus;
}

export function useWebSocket(scanId: string | null): UseWebSocketResult {
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [status, setStatus] = useState<WsStatus>('closed');
  const clientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);

  useEffect(() => {
    if (!scanId) return;

    const client = createWebSocketClient(scanId);
    clientRef.current = client;

    client.onStatusChange(setStatus);
    client.onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [scanId]);

  return { messages, status };
}

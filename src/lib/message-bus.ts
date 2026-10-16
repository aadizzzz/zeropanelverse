import { EventEmitter } from "node:events";

declare global {
  // eslint-disable-next-line no-var
  var __messageEventEmitter: EventEmitter | undefined;
}

const messageEmitter = globalThis.__messageEventEmitter || new EventEmitter();
messageEmitter.setMaxListeners(1000);
globalThis.__messageEventEmitter = messageEmitter;

export type LiveMessagePayload = {
  type: "new_message";
  message: {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    titleSlug: string | null;
    read: boolean;
    createdAt: string;
    titleCard?: any;
  };
};

/**
 * Broadcasts a live message event to all active streams for a specific user.
 */
export function broadcastMessage(userId: number, payload: LiveMessagePayload): void {
  messageEmitter.emit(`user:${userId}`, payload);
}

/**
 * Subscribes an SSE connection to incoming messages for a specific user.
 * Returns an unsubscribe callback.
 */
export function subscribeToUserMessages(
  userId: number,
  handler: (payload: LiveMessagePayload) => void,
): () => void {
  const event = `user:${userId}`;
  messageEmitter.on(event, handler);
  return () => {
    messageEmitter.off(event, handler);
  };
}

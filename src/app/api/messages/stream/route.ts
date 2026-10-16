import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscribeToUserMessages, type LiveMessagePayload } from "@/lib/message-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial handshake
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ ok: true, userId: user.id })}\n\n`,
        ),
      );

      // 2. Real-time push subscription
      const unsubscribe = subscribeToUserMessages(user.id, (payload: LiveMessagePayload) => {
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          // Stream controller might be closed
        }
      });

      // 3. Heartbeat keep-alive every 15s to keep connection open through proxies/mobile networks
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      // 4. Handle connection termination / abort
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

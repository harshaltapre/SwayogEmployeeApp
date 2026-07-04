import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { verifyAccessToken } from "./token.js";
import { prisma } from "./prisma.js";

// Map customerId (number) -> Set of active WebSockets
const customerConnections = new Map<number, Set<WebSocket>>();

export function initWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", "http://localhost");

    if (url.pathname === "/ws/telemetry") {
      const token = url.searchParams.get("token");
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      try {
        const payload = verifyAccessToken(token);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request, payload);
        });
      } catch (err) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws: WebSocket, request: IncomingMessage, payload: any) => {
    let customerId: number | null = null;

    if (payload.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { userId: payload.sub },
        select: { id: true }
      });
      if (customer) {
        customerId = customer.id;
      }
    } else {
      const url = new URL(request.url || "", "http://localhost");
      const targetId = parseInt(url.searchParams.get("customerId") || "", 10);
      if (!isNaN(targetId)) {
        customerId = targetId;
      }
    }

    if (!customerId) {
      ws.close(1008, "Could not resolve customer ID");
      return;
    }

    if (!customerConnections.has(customerId)) {
      customerConnections.set(customerId, new Set());
    }
    customerConnections.get(customerId)!.add(ws);

    console.log(`[WebSocket] Connected: Customer ${customerId} (user ${payload.sub})`);

    let isAlive = true;
    ws.on("pong", () => {
      isAlive = true;
    });

    // Auto-close on inactivity (10 minutes)
    const inactivityTimeout = setTimeout(() => {
      console.log(`[WebSocket] Inactivity timeout for Customer ${customerId}`);
      ws.close(1000, "Inactivity timeout");
    }, 10 * 60 * 1000);

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log(`[WebSocket] Client ping timeout for Customer ${customerId}`);
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {}
    });

    ws.on("close", () => {
      clearTimeout(inactivityTimeout);
      clearInterval(pingInterval);
      const connections = customerConnections.get(customerId!);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          customerConnections.delete(customerId!);
        }
      }
      console.log(`[WebSocket] Disconnected: Customer ${customerId}`);
    });

    // Immediately push initial data on connection
    try {
      const cached = await prisma.inverterCache.findUnique({
        where: { customerId }
      });
      if (cached) {
        ws.send(JSON.stringify({ type: "telemetry", data: cached.summaryData }));
      }
    } catch (err) {
      console.error("[WebSocket] Failed to send cached data:", err);
    }
  });
}

export function broadcastToCustomer(customerId: number, data: any) {
  const connections = customerConnections.get(customerId);
  if (connections && connections.size > 0) {
    const message = JSON.stringify({ type: "telemetry", data });
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
    console.log(`[WebSocket] Broadcasted telemetry to customer ${customerId} (${connections.size} clients)`);
    return true;
  }
  return false;
}

export function getActiveCustomerIds(): number[] {
  return Array.from(customerConnections.keys());
}

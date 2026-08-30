import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

let io: SocketIOServer | null = null;

export function attachSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.slice(7);
    if (!token) return next(new Error("Token requerido"));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        staffId: string;
        branchId: string;
      };
      socket.data.staff = payload;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("subscribe:order", (orderId: string) => {
      socket.join(`pedido:${orderId}`);
    });

    socket.on("unsubscribe:order", (orderId: string) => {
      socket.leave(`pedido:${orderId}`);
    });

    socket.on("subscribe:kitchen", () => {
      const staff = socket.data.staff;
      if (staff) {
        socket.join(`kitchen:${staff.branchId}`);
      }
    });

    socket.on("disconnect", () => {
      // cleanup automático
    });
  });

  return {
    getIO: () => io!,
  };
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO no inicializado");
  }
  return io;
}

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  // Map of userId -> Set of socketIds to handle multiple connections per user (e.g. mobile + desktop)
  private userSockets: Map<string, Set<string>> = new Map();

  /**
   * Initialize Socket.IO with the HTTP server
   */
  public initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ["GET", "POST"],
      },
    });

    // JWT Authentication middleware for Socket.IO
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user || user.status !== "ACTIVE") {
          return next(new Error("Authentication error: Invalid or inactive user"));
        }

        socket.userId = user.id;
        next();
      } catch (error) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId;

      if (userId) {
        console.log(`🔌 Socket connected: User ${userId} [Socket ID: ${socket.id}]`);
        
        // Track the connection
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);

        socket.on("disconnect", () => {
          console.log(`🔌 Socket disconnected: User ${userId} [Socket ID: ${socket.id}]`);
          const userSet = this.userSockets.get(userId);
          if (userSet) {
            userSet.delete(socket.id);
            if (userSet.size === 0) {
              this.userSockets.delete(userId);
            }
          }
        });
      }
    });
  }

  /**
   * Emit an event to a specific user across all their active socket connections
   */
  public emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn("Socket.IO is not initialized.");
      return;
    }

    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach((socketId) => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Emit an event to everyone
   */
  public emitToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();

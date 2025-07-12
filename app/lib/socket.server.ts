// lib/socket-server.ts
import { Server as HTTPServer } from "http";
import { NextApiResponse } from "next";
import { Server as ServerIO, Socket } from "socket.io";
import jwt from "jsonwebtoken";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      /** May not exist until we initialize */
      io?: ServerIO<ClientToServerEvents, ServerToClientEvents>;
    };
  };
};

// Events sent **from** server → client
export interface ServerToClientEvents {
  "message:new": (data: {
    conversationId: string;
    message: any;
    senderId: string;
  }) => void;
  "message:read": (data: {
    conversationId: string;
    messageIds: string[];
    readerId: string;
  }) => void;
  "conversation:new": (data: {
    conversation: any;
    participantIds: string[];
  }) => void;
  "user:typing": (data: {
    conversationId: string;
    userId: string;
    userName?: string;
    isTyping: boolean;
  }) => void;
  "user:online": (data: {
    userId: string;
    isOnline: boolean;
  }) => void;
}

// Events sent **from** client → server
export interface ClientToServerEvents {
  "join:conversation": (conversationId: string) => void;
  "leave:conversation": (conversationId: string) => void;
  "typing:start": (data: {
    conversationId: string;
    userId: string;
    userName: string;
  }) => void;
  "typing:stop": (data: {
    conversationId: string;
    userId: string;
  }) => void;
  "user:online": (userId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userRole: "teacher" | "student";
  userName: string;
}

/**
 * Initialize a singleton Socket.IO instance on the Next.js server.
 * Subsequent calls just return the already-initialized server.
 */
export function initializeSocketServer(res: any) {
  if (!res?.socket?.server) {
    throw new Error("res.socket.server is not available.");
  }

  if (!res.socket.server.io) {
    console.log("🚀 Initializing Socket.IO server…");

    const io = new ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
      res.socket.server
    );

    res.socket.server.io = io;
  }

  return res.socket.server.io;
}

/** Helpers to emit from outside this file (e.g. in API routes) */
export const emitNewMessage = (
  io: ServerIO<ClientToServerEvents, ServerToClientEvents>,
  conversationId: string,
  message: any,
  senderId: string
) => {
  io.to(`conversation:${conversationId}`).emit("message:new", {
    conversationId,
    message,
    senderId,
  });
};

export const emitMessageRead = (
  io: ServerIO<ClientToServerEvents, ServerToClientEvents>,
  conversationId: string,
  messageIds: string[],
  readerId: string
) => {
  io.to(`conversation:${conversationId}`).emit("message:read", {
    conversationId,
    messageIds,
    readerId,
  });
};

export const emitNewConversation = (
  io: ServerIO<ClientToServerEvents, ServerToClientEvents>,
  conversation: any,
  participantIds: string[]
) => {
  participantIds.forEach((id) => {
    io.to(`user:${id}`).emit("conversation:new", {
      conversation,
      participantIds,
    });
  });
};

/**
 * socketServer.ts
 * Lightweight accessor that lets controllers emit socket events
 * without importing the full SocketService (avoids circular deps).
 */
import { Server } from 'socket.io';

let _io: Server | null = null;

export const setSocketServer = (io: Server): void => {
  _io = io;
};

export const getSocketServer = (): Server | null => {
  return _io;
};

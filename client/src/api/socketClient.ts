import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;

  public connect(token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const envApiUrl = (import.meta as any).env?.VITE_API_URL;
    const envSocketUrl = (import.meta as any).env?.VITE_SOCKET_URL;

    let socketUrl = 'http://localhost:5000';

    if (envSocketUrl) {
      socketUrl = envSocketUrl;
    } else if (envApiUrl && typeof envApiUrl === 'string') {
      socketUrl = envApiUrl.replace(/\/api\/v1\/?$/, '');
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      socketUrl = window.location.origin;
    }

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error.message);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();

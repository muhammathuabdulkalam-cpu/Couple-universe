import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private lastLoggedError = '';
  private lastErrorTime = 0;

  public connect(token: string): Socket {
    // If socket instance already exists (connecting or connected), update token if needed and return singleton
    if (this.socket) {
      if (token && (this.socket.auth as any)?.token !== token) {
        (this.socket.auth as any).token = token;
        if (this.socket.disconnected) {
          this.socket.connect();
        }
      }
      return this.socket;
    }

    const envApiUrl = (import.meta as any).env?.VITE_API_URL;
    const envSocketUrl = (import.meta as any).env?.VITE_SOCKET_URL;

    let socketUrl = 'http://localhost:5000';

    if (envSocketUrl) {
      socketUrl = envSocketUrl;
    } else if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.startsWith('http')) {
      socketUrl = envApiUrl.replace(/\/api\/v1\/?$/, '');
    } else if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      // Connect to backend port 5000 regardless of local dev server port (e.g. 5173/5174 or IP network 192.168.x.x)
      socketUrl = `${protocol}//${hostname}:5000`;
    }

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket connected successfully to backend:', socketUrl);
      this.lastLoggedError = '';
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Sever disconnected, manually reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      const now = Date.now();
      // Throttle connection error logs to once every 10 seconds to avoid console clutter
      if (error.message !== this.lastLoggedError || now - this.lastErrorTime > 10000) {
        console.warn(`⚠️ Socket connecting to [${socketUrl}]:`, error.message);
        this.lastLoggedError = error.message;
        this.lastErrorTime = now;
      }
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
      this.lastLoggedError = '';
    }
  }
}

export const socketClient = new SocketClient();

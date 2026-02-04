// Socket.IO type declarations for the client

declare module 'socket.io-client' {
  export function io(opts?: Record<string, unknown>): any;
  export function io(uri: string, opts?: Record<string, unknown>): any;
  export function connect(opts?: Record<string, unknown>): any;
  export function connect(uri: string, opts?: Record<string, unknown>): any;

  export interface Socket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    io: any;

    on(event: string, fn: (...args: any[]) => void): this;
    once(event: string, fn: (...args: any[]) => void): this;
    off(event: string, fn?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    disconnect(): this;

    // Additional properties
    [key: string]: any;
  }
}

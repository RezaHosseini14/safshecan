import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import { ServerBroadcastMessage } from '@saf-shekan/core';

@WebSocketGateway({
  path: '/ws',
})
export class SniperGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: WsServer;

  private readonly logger = new Logger(SniperGateway.name);
  private onConnect: ((client: WebSocket) => void) | null = null;

  afterInit() {
    this.logger.log('✓ درگاه وب‌سوکت صف‌شکن (SniperGateway) راه‌اندازی شد (/ws).');
  }

  public setConnectionListener(listener: ((client: WebSocket) => void) | null): void {
    this.onConnect = listener;
  }

  public send(client: WebSocket, message: ServerBroadcastMessage): void {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(message));
  }

  handleConnection(client: WebSocket) {
    this.logger.log('یک اتصال کلاینت وب‌سوکت جدید برقرار شد.');
    this.onConnect?.(client);
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('اتصال وب‌سوکت کلاینت قطع شد.');
  }

  public broadcast(message: ServerBroadcastMessage): void {
    if (!this.server || !this.server.clients) return;

    const raw = JSON.stringify(message);
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.server?.clients ? this.server.clients.size : 0;
  }
}

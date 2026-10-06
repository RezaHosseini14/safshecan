import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { WebSocket, WebSocketServer as WsServer } from 'ws';
import { ServerBroadcastMessage } from '../types/index.js';

@WebSocketGateway({
  path: '/ws',
})
export class SniperGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: WsServer;

  private readonly logger = new Logger(SniperGateway.name);

  afterInit() {
    this.logger.log('✓ درگاه وب‌سوکت صف‌شکن (SniperGateway) راه‌اندازی شد (/ws).');
  }

  handleConnection(client: WebSocket) {
    this.logger.log('یک اتصال کلاینت وب‌سوکت جدید برقرار شد.');
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

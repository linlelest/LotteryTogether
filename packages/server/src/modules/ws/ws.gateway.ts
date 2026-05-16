import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: number
  username?: string
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private heartbeatInterval: Map<string, NodeJS.Timeout> = new Map()

  handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any
        client.userId = payload.userId
        client.username = payload.username
      } catch { /* unauthenticated connections allowed for public broadcasts */ }
    }

    // Start heartbeat
    const interval = setInterval(() => {
      client.emit('ping', { time: Date.now() })
    }, 30000)
    this.heartbeatInterval.set(client.id, interval)
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const interval = this.heartbeatInterval.get(client.id)
    if (interval) {
      clearInterval(interval)
      this.heartbeatInterval.delete(client.id)
    }
  }

  @SubscribeMessage('join-activity')
  handleJoinActivity(client: AuthenticatedSocket, activityId: number) {
    client.join(`activity:${activityId}`)
    return { event: 'joined', data: { activityId } }
  }

  @SubscribeMessage('leave-activity')
  handleLeaveActivity(client: AuthenticatedSocket, activityId: number) {
    client.leave(`activity:${activityId}`)
  }

  @SubscribeMessage('pong')
  handlePong(client: AuthenticatedSocket) {
    // Heartbeat response received
  }

  // Emit methods
  emitParticipantCount(activityId: number, count: number) {
    this.server.to(`activity:${activityId}`).emit('participant-count', { activityId, count })
  }

  emitDrawResult(activityId: number, result: { userId: number; prizeName: string; drawnAt: string }) {
    this.server.to(`activity:${activityId}`).emit('draw-result', {
      activityId,
      prizeName: result.prizeName,
      drawnAt: result.drawnAt,
    })
  }

  emitPaperSlipNotification(activityId: number, data: { count: number; lastContent?: string }) {
    this.server.to(`activity:${activityId}`).emit('paper-slip', {
      activityId,
      ...data,
    })
  }

  emitDashboardUpdate(data: { totalActivities: number; totalParticipants: number; winRate: number }) {
    this.server.emit('dashboard-update', data)
  }
}
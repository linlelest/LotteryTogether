import { ref } from 'vue'
import { io } from 'socket.io-client'

const socket = ref<any>(null)
const connected = ref(false)

export function useSocket() {
  function connect(token?: string) {
    if (socket.value?.connected) return
    socket.value = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    socket.value.on('connect', () => { connected.value = true })
    socket.value.on('disconnect', () => { connected.value = false })
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    connected.value = false
  }

  function joinActivity(activityId: number) {
    socket.value?.emit('join-activity', activityId)
  }

  function leaveActivity(activityId: number) {
    socket.value?.emit('leave-activity', activityId)
  }

  function on<T>(event: string, callback: (data: T) => void) {
    socket.value?.on(event, callback)
  }

  function off(event: string) {
    socket.value?.off(event)
  }

  return { connected, connect, disconnect, joinActivity, leaveActivity, on, off }
}
import { io, Socket } from 'socket.io-client'

const socket: Socket = io(import.meta.env.VITE_API_BASE_URL ?? '', {
  autoConnect: false,
  path: '/socket.io',
})

export function connectSocket() {
  if (!socket.connected) socket.connect()
}

export { socket }

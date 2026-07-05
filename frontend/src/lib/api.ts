const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? res.statusText)
  }
  return (await res.json()) as T
}

export type BatchStatusName = 'Open' | 'Closed' | 'Clearing' | 'Cleared' | 'Settled'
export type OrderSide = 'Buy' | 'Sell'

export interface Batch {
  batchId: string
  status: BatchStatusName
  startTime: number | null
  endTime: number | null
  clearingTick: number | null
  matchedVolume: string | null
  orderCount: number
}

export interface Order {
  orderId: string
  batchId: string
  trader: string
  side: OrderSide
  filled: boolean
  txHash?: string | null
}

export interface BatchWithOrders extends Batch {
  orders: Order[]
}

export const api = {
  getBatches(): Promise<Batch[]> {
    return request<Batch[]>('/api/batches')
  },
  getCurrentBatch(): Promise<Batch> {
    return request<Batch>('/api/batches/current')
  },
  getBatch(id: string): Promise<BatchWithOrders> {
    return request<BatchWithOrders>(`/api/batches/${id}`)
  },
  getMyOrders(address: string): Promise<Order[]> {
    return request<Order[]>(`/api/users/${address}/orders`)
  },
}

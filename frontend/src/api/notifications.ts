import apiClient from "./client"

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface NotificationsPage {
  content: Notification[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const notificationsApi = {
  getAll: async (page = 0, size = 20): Promise<NotificationsPage> => {
    const response = await apiClient.get<NotificationsPage>("/notifications", {
      params: { page, size },
    })
    return response.data
  },

  getUnread: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>("/notifications/unread")
    return response.data
  },

  countUnread: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>("/notifications/count")
    return response.data.count
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post("/notifications/read-all")
  },
}

import apiClient from "./client"
import type { ChatRequest, ChatResponse, ChatHistoryResponse } from "@/types"

export const chatApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/chat/message", data)
    return response.data
  },

  getHistory: async (): Promise<ChatHistoryResponse> => {
    const response = await apiClient.get<ChatHistoryResponse>("/chat/history")
    return response.data
  },

  clearHistory: async (): Promise<void> => {
    await apiClient.delete("/chat/history")
  },
}

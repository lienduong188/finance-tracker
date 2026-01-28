import apiClient from "./client"
import type { Invitation, InvitationRequest } from "@/types"

export const invitationsApi = {
  send: async (data: InvitationRequest): Promise<Invitation> => {
    const response = await apiClient.post<Invitation>("/invitations", data)
    return response.data
  },

  getReceived: async (): Promise<Invitation[]> => {
    const response = await apiClient.get<Invitation[]>("/invitations/received")
    return response.data
  },

  countPending: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>("/invitations/received/count")
    return response.data.count
  },

  getByFamily: async (familyId: string): Promise<Invitation[]> => {
    const response = await apiClient.get<Invitation[]>(`/invitations/family/${familyId}`)
    return response.data
  },

  accept: async (token: string): Promise<void> => {
    await apiClient.post(`/invitations/${token}/accept`)
  },

  decline: async (token: string): Promise<void> => {
    await apiClient.post(`/invitations/${token}/decline`)
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/invitations/${id}`)
  },

  resend: async (id: string): Promise<Invitation> => {
    const response = await apiClient.post<Invitation>(`/invitations/${id}/resend`)
    return response.data
  },
}

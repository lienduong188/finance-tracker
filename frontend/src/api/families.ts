import apiClient from "./client"
import type { Family, FamilyRequest, FamilyMember, UpdateMemberRoleRequest } from "@/types"

export const familiesApi = {
  getAll: async (): Promise<Family[]> => {
    const response = await apiClient.get<Family[]>("/families")
    return response.data
  },

  getById: async (id: string): Promise<Family> => {
    const response = await apiClient.get<Family>(`/families/${id}`)
    return response.data
  },

  create: async (data: FamilyRequest): Promise<Family> => {
    const response = await apiClient.post<Family>("/families", data)
    return response.data
  },

  update: async (id: string, data: FamilyRequest): Promise<Family> => {
    const response = await apiClient.put<Family>(`/families/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/families/${id}`)
  },

  getMembers: async (familyId: string): Promise<FamilyMember[]> => {
    const response = await apiClient.get<FamilyMember[]>(`/families/${familyId}/members`)
    return response.data
  },

  updateMemberRole: async (familyId: string, memberId: string, data: UpdateMemberRoleRequest): Promise<FamilyMember> => {
    const response = await apiClient.put<FamilyMember>(`/families/${familyId}/members/${memberId}/role`, data)
    return response.data
  },

  removeMember: async (familyId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/families/${familyId}/members/${memberId}`)
  },

  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/families/${id}/leave`)
  },
}

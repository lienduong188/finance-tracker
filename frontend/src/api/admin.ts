import apiClient from "./client"
import type {
  AdminUser,
  AdminStats,
  Category,
  PageResponse,
  UpdateUserRoleRequest,
  AdminCategoryRequest,
} from "@/types"

export const adminApi = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>("/admin/stats")
    return response.data
  },

  // Users
  getUsers: async (
    page = 0,
    size = 20,
    search?: string
  ): Promise<PageResponse<AdminUser>> => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    })
    if (search) params.append("search", search)
    const response = await apiClient.get<PageResponse<AdminUser>>(
      `/admin/users?${params}`
    )
    return response.data
  },

  getUser: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.get<AdminUser>(`/admin/users/${id}`)
    return response.data
  },

  updateRole: async (id: string, data: UpdateUserRoleRequest): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(`/admin/users/${id}/role`, data)
    return response.data
  },

  toggleEnabled: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(
      `/admin/users/${id}/toggle-enabled`
    )
    return response.data
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`)
  },

  // System Categories
  getSystemCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/admin/categories")
    return response.data
  },

  createSystemCategory: async (data: AdminCategoryRequest): Promise<Category> => {
    const response = await apiClient.post<Category>("/admin/categories", data)
    return response.data
  },

  updateSystemCategory: async (
    id: string,
    data: AdminCategoryRequest
  ): Promise<Category> => {
    const response = await apiClient.put<Category>(`/admin/categories/${id}`, data)
    return response.data
  },

  deleteSystemCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`)
  },
}

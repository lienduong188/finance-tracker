import apiClient from "./client"
import type { Category, CategoryRequest, CategoryType } from "@/types"

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories")
    return response.data
  },

  getByType: async (type: CategoryType): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(`/categories/type/${type}`)
    return response.data
  },

  create: async (data: CategoryRequest): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data)
    return response.data
  },

  update: async (id: string, data: CategoryRequest): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },

  deleteMany: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map((id) => apiClient.delete(`/categories/${id}`)))
  },
}

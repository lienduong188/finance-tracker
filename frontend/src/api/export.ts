import { apiClient } from "./client"

export interface BackupInfo {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportApi = {
  async exportTransactionsCsv(params?: {
    startDate?: string
    endDate?: string
    accountId?: string
    type?: string
  }) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const response = await apiClient.get("/export/transactions/csv", {
      params,
      responseType: "blob",
    })
    downloadBlob(new Blob([response.data], { type: "text/csv;charset=utf-8" }), `transactions_${today}.csv`)
  },

  async exportBackup() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const response = await apiClient.get("/export/backup", {
      responseType: "blob",
    })
    downloadBlob(new Blob([response.data], { type: "application/json" }), `backup_${today}.json`)
  },

  async listBackups(): Promise<BackupInfo[]> {
    const response = await apiClient.get("/backups")
    return response.data
  },

  async downloadBackup(id: string, fileName: string) {
    const response = await apiClient.get(`/backups/${id}/download`, {
      responseType: "blob",
    })
    downloadBlob(new Blob([response.data], { type: "application/json" }), fileName)
  },
}

import { apiClient } from "./client"

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
}

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  MapPin,
  Monitor,
  Clock,
} from "lucide-react"
import { adminApi } from "@/api"
import { Button, Input, Card } from "@/components/ui"
import type { AdminUser, Role } from "@/types"
import { useAuth } from "@/context/AuthContext"

function parseBrowser(userAgent: string): string {
  if (userAgent.includes("Edg/")) return "Edge"
  if (userAgent.includes("Chrome/")) return "Chrome"
  if (userAgent.includes("Firefox/")) return "Firefox"
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) return "Safari"
  if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) return "IE"
  if (userAgent.includes("Opera") || userAgent.includes("OPR/")) return "Opera"
  return "Unknown"
}

export function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search],
    queryFn: () => adminApi.getUsers(page, 20, search || undefined),
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: adminApi.toggleEnabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      adminApi.updateRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleToggleRole = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert("Không thể thay đổi role của chính bạn")
      return
    }
    const newRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN"
    if (confirm(`Bạn có chắc muốn ${newRole === "ADMIN" ? "cấp quyền Admin" : "bỏ quyền Admin"} cho ${user.email}?`)) {
      updateRoleMutation.mutate({ id: user.id, role: newRole })
    }
  }

  const handleToggleEnabled = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert("Không thể vô hiệu hóa chính bạn")
      return
    }
    if (confirm(`Bạn có chắc muốn ${user.enabled ? "vô hiệu hóa" : "kích hoạt"} user ${user.email}?`)) {
      toggleEnabledMutation.mutate(user.id)
    }
  }

  const handleDelete = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert("Không thể xóa chính bạn")
      return
    }
    if (confirm(`Bạn có chắc muốn xóa user ${user.email}? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Users</h1>
          <p className="text-muted-foreground">
            Tổng cộng {data?.totalElements || 0} users
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Tìm kiếm</Button>
      </form>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Hoạt động cuối</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thống kê</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.content?.map((user) => (
                <tr key={user.id} className={!user.enabled ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {user.fullName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium">{user.fullName || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.role === "ADMIN" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        user.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.enabled ? (
                        <>
                          <UserCheck className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" />
                          Disabled
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.lastLoginAt ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(user.lastLoginAt).toLocaleString("vi-VN")}</span>
                        </div>
                        {(user.lastLoginLocation || user.lastLoginIp) && (
                          <div className="flex items-center gap-1 text-muted-foreground" title={user.lastLoginIp || undefined}>
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">
                              {user.lastLoginLocation || user.lastLoginIp}
                            </span>
                          </div>
                        )}
                        {user.lastUserAgent && (
                          <div className="flex items-center gap-1 text-muted-foreground" title={user.lastUserAgent}>
                            <Monitor className="h-3 w-3" />
                            <span className="max-w-[150px] truncate text-xs">
                              {parseBrowser(user.lastUserAgent)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa đăng nhập</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.accountsCount} accounts, {user.transactionsCount} transactions
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(user)}
                        disabled={user.id === currentUser?.id}
                        title={user.role === "ADMIN" ? "Bỏ quyền Admin" : "Cấp quyền Admin"}
                      >
                        {user.role === "ADMIN" ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEnabled(user)}
                        disabled={user.id === currentUser?.id}
                        title={user.enabled ? "Vô hiệu hóa" : "Kích hoạt"}
                      >
                        {user.enabled ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id}
                        className="text-destructive hover:text-destructive"
                        title="Xóa user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Trang {page + 1} / {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

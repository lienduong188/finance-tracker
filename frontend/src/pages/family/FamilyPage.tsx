import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Users, Crown, Shield, User, Settings, Home, Briefcase, HelpCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { familiesApi } from "@/api"
import type { Family, FamilyRole, GroupType } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import FamilyFormModal from "./FamilyFormModal"

const roleIcons: Record<FamilyRole, React.ReactNode> = {
  OWNER: <Crown className="w-4 h-4 text-yellow-500" />,
  ADMIN: <Shield className="w-4 h-4 text-blue-500" />,
  MEMBER: <User className="w-4 h-4 text-gray-500" />,
}

const roleLabels: Record<FamilyRole, string> = {
  OWNER: "Chủ sở hữu",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
}

const groupTypeIcons: Record<GroupType, React.ReactNode> = {
  FAMILY: <Home className="w-4 h-4" />,
  FRIENDS: <Users className="w-4 h-4" />,
  WORK: <Briefcase className="w-4 h-4" />,
  OTHER: <HelpCircle className="w-4 h-4" />,
}

const groupTypeLabels: Record<GroupType, string> = {
  FAMILY: "Gia đình",
  FRIENDS: "Bạn bè",
  WORK: "Công việc",
  OTHER: "Khác",
}

export default function FamilyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFamily, setEditingFamily] = useState<Family | null>(null)

  const { data: families, isLoading } = useQuery({
    queryKey: ["families"],
    queryFn: familiesApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: familiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
    },
  })

  const handleEdit = (family: Family) => {
    setEditingFamily(family)
    setIsModalOpen(true)
  }

  const handleDelete = (family: Family) => {
    if (family.myRole !== "OWNER") {
      alert("Chỉ chủ sở hữu mới có thể xóa nhóm")
      return
    }
    if (confirm(`Bạn có chắc muốn xóa nhóm "${family.name}"?`)) {
      deleteMutation.mutate(family.id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFamily(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Nhóm</h1>
          <p className="text-muted-foreground">Quản lý tài chính chung với gia đình, bạn bè</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo nhóm
        </Button>
      </div>

      {!families || families.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có nhóm nào</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tạo nhóm để quản lý tài chính chung với gia đình hoặc bạn bè
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo nhóm đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <Card
              key={family.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/family/${family.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground" title={groupTypeLabels[family.type]}>
                      {groupTypeIcons[family.type]}
                    </span>
                    <CardTitle className="text-lg">{family.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1" title={roleLabels[family.myRole]}>
                    {roleIcons[family.myRole]}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{groupTypeLabels[family.type]}</span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {family.description || "Chưa có mô tả"}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {family.memberCount} thành viên
                  </span>
                  <span className="text-muted-foreground">{family.currency}</span>
                </div>
                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  {(family.myRole === "OWNER" || family.myRole === "ADMIN") && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(family)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                  {family.myRole === "OWNER" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(family)}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FamilyFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        family={editingFamily}
      />
    </div>
  )
}

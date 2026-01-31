import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { adminApi } from "@/api"
import { Button, Card, ConfirmDialog } from "@/components/ui"
import type { Category } from "@/types"
import { AdminCategoryFormModal } from "./AdminCategoryFormModal"

export function AdminCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const queryClient = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.getSystemCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteSystemCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
    },
  })

  const incomeCategories = categories?.filter((c) => c.type === "INCOME") || []
  const expenseCategories = categories?.filter((c) => c.type === "EXPENSE") || []

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (category: Category) => {
    setDeleteConfirm({ isOpen: true, category })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate(deleteConfirm.category.id)
      setDeleteConfirm({ isOpen: false, category: null })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const CategoryCard = ({ category }: { category: Category }) => {
    const hasTranslations = category.nameVi || category.nameEn || category.nameJa
    return (
      <div
        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
        style={{ borderLeftColor: category.color || undefined, borderLeftWidth: 4 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon || "📁"}</span>
          <div>
            <p className="font-medium">{category.name}</p>
            {hasTranslations && (
              <p className="text-xs text-muted-foreground">
                {category.nameVi && <span className="mr-2">VI: {category.nameVi}</span>}
                {category.nameEn && <span className="mr-2">EN: {category.nameEn}</span>}
                {category.nameJa && <span>JA: {category.nameJa}</span>}
              </p>
            )}
            {category.children?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {category.children.length} subcategories
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Categories</h1>
          <p className="text-muted-foreground">
            Quản lý các category mặc định cho tất cả users
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Income Categories */}
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Thu nhập (Income)</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {incomeCategories.length} categories
            </span>
          </div>
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
            {incomeCategories.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                Chưa có category nào
              </p>
            )}
          </div>
        </Card>

        {/* Expense Categories */}
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Chi tiêu (Expense)</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {expenseCategories.length} categories
            </span>
          </div>
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
            {expenseCategories.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                Chưa có category nào
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Modal */}
      <AdminCategoryFormModal
        key={editingCategory?.id ?? "new"}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
        onConfirm={handleDeleteConfirm}
        title="Xóa Category"
        message={`Bạn có chắc muốn xóa category "${deleteConfirm.category?.name}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

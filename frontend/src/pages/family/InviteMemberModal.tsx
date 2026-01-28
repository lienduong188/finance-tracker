import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invitationsApi } from "@/api"
import type { FamilyRole } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const inviteSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["ADMIN", "MEMBER"]),
  message: z.string().optional(),
})

type InviteForm = z.output<typeof inviteSchema>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
}

export default function InviteMemberModal({ isOpen, onClose, familyId }: InviteMemberModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
      message: "",
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) =>
      invitationsApi.send({
        familyId,
        email: data.email,
        role: data.role as FamilyRole,
        message: data.message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-invitations", familyId] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Có lỗi xảy ra")
    },
  })

  const onSubmit = (data: InviteForm) => {
    inviteMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời thành viên mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select {...register("role")} className="w-full border rounded-md p-2">
              <option value="MEMBER">Thành viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lời nhắn (tùy chọn)</label>
            <Input
              {...register("message")}
              placeholder="Lời nhắn gửi kèm lời mời"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Đang gửi..." : "Gửi lời mời"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

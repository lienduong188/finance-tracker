import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { MessageCircle, X, Send, Trash2, Loader2 } from "lucide-react"
import { Button, Input, Card } from "@/components/ui"
import { chatApi } from "@/api"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { ChatResponse } from "@/types"

export function ChatWidget() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chat history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: chatApi.getHistory,
    enabled: isOpen,
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] })
      setMessage("")
    },
    onError: (error: Error) => {
      console.error("Chat error:", error)
      alert(error.message || "Failed to send message")
    },
  })

  // Clear history mutation
  const clearMutation = useMutation({
    mutationFn: chatApi.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] })
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [history?.messages, sendMutation.isPending])

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return
    sendMutation.mutate({ message: message.trim(), language: i18n.language })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl",
          isOpen && "hidden"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-50 flex h-[500px] w-[350px] flex-col shadow-2xl sm:h-[550px] sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t("chat.title", "Trợ lý AI")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("chat.subtitle", "Hỏi về tài chính của bạn")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending || !history?.messages?.length}
                title={t("chat.clearHistory", "Xóa lịch sử")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3">
            {historyLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history?.messages?.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">{t("chat.welcome", "Xin chào! Tôi có thể giúp bạn:")}</p>
                <ul className="mt-2 text-xs text-left">
                  <li>• {t("chat.hint1", "Tổng kết chi tiêu tháng")}</li>
                  <li>• {t("chat.hint2", "Số dư các tài khoản")}</li>
                  <li>• {t("chat.hint3", "Top danh mục chi tiêu")}</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                {history?.messages.map((msg: ChatResponse) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "USER" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2",
                        msg.role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      <p
                        className={cn(
                          "mt-1 text-right text-[10px] opacity-70",
                          msg.role === "USER" ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      >
                        {formatRelativeTime(msg.createdAt, i18n.language)}
                      </p>
                    </div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {t("chat.thinking", "Đang suy nghĩ...")}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("chat.placeholder", "Nhập câu hỏi của bạn...")}
                disabled={sendMutation.isPending}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                size="icon"
                className="h-9 w-9"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

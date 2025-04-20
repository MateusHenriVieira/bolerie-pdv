"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/lib/contexts/notifications-context"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function NotificationsPopover() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
    setOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return "🗓️"
      case "inventory":
        return "📦"
      case "customer":
        return "👤"
      default:
        return "🔔"
    }
  }

  const formatNotificationDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return format(date, "dd/MM/yyyy", { locale: ptBR })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground">{formatNotificationDate(notification.date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground">Você receberá notificações sobre reservas e estoque aqui.</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

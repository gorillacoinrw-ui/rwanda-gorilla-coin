import { Bell, Check, CheckCheck, ArrowLeftRight, Gift, Pickaxe, Users, Info } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const typeIcon: Record<string, typeof Bell> = {
  trade: ArrowLeftRight,
  task: Gift,
  mining: Pickaxe,
  referral: Users,
  info: Info,
};

const typeColor: Record<string, string> = {
  trade: "text-secondary",
  task: "text-primary",
  mining: "text-accent",
  referral: "text-rwanda-blue",
  info: "text-muted-foreground",
};

const NotificationItem = ({
  notification,
  onRead,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) => {
  const Icon = typeIcon[notification.type] || Bell;
  const color = typeColor[notification.type] || "text-muted-foreground";

  return (
    <button
      className={`w-full text-left p-3 flex gap-3 items-start hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
        !notification.is_read ? "bg-primary/5" : ""
      }`}
      onClick={() => {
        if (!notification.is_read) onRead(notification.id);
        if (notification.action_url) onNavigate(notification.action_url);
      }}
    >
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
            {notification.title}
          </span>
          {!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-primary hover:text-primary"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={(id) => markAsRead.mutate(id)}
                onNavigate={(url) => navigate(url)}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

import { useState, useEffect, useRef } from "react";
import {
  IconButton,
  Popover,
  Flex,
  Text,
  Badge,
  Tooltip,
} from "@radix-ui/themes";
import { BellIcon, XIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, getApiBaseUrl } from "@/services/api";
import { Notification } from "@/types";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getNotificationUrl(notification: Notification): string {
  if (notification.related_type === "service") {
    return `/service/${notification.related_id}`;
  }
  return `/profile?tab=services`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const activeRef = useRef(true);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );

  // SSE connection — replaces polling
  useEffect(() => {
    if (!user) return;

    activeRef.current = true;

    const connect = async () => {
      const token = localStorage.getItem("access_token");
      if (!token || !activeRef.current) return;

      try {
        const res = await fetch(`${getApiBaseUrl()}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.body || !activeRef.current) return;

        readerRef.current = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (activeRef.current) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const n = parseInt(line.slice(6), 10);
              if (!isNaN(n)) setUnreadCount(n);
            }
          }
        }
      } catch {
        // connection dropped
      }

      // Reconnect after 5s if still mounted
      if (activeRef.current) {
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      activeRef.current = false;
      readerRef.current?.cancel();
    };
  }, [user]);

  const { data: listData, refetch: refetchList } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationsApi.getNotifications(1, 20).then((r) => r.data),
    enabled: false,
    staleTime: 0,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ["notifications-list"],
        (old: import("@/types").NotificationListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.filter((n) => n._id !== id),
            total: old.total - 1,
          };
        },
      );
    },
  });

  const notifications = listData?.notifications ?? [];

  function handleOpenChange(open: boolean) {
    if (open) refetchList();
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) markAsRead.mutate(notification._id);
    navigate(getNotificationUrl(notification));
  }

  return (
    <Popover.Root onOpenChange={handleOpenChange}>
      <Tooltip content="Notifications">
        <Popover.Trigger>
          <IconButton variant="ghost" style={{ position: "relative" }}>
            <BellIcon className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge
                color="red"
                variant="solid"
                radius="full"
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "16px",
                  height: "16px",
                  fontSize: "10px",
                  padding: "0 3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </IconButton>
        </Popover.Trigger>
      </Tooltip>

      <Popover.Content
        style={{
          width: "340px",
          maxHeight: "420px",
          overflowY: "auto",
          padding: 0,
        }}
      >
        <Flex
          justify="between"
          align="center"
          px="3"
          py="2"
          style={{ borderBottom: "1px solid var(--gray-4)" }}
        >
          <Text size="2" weight="bold">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text
              size="1"
              color="grass"
              style={{ cursor: "pointer" }}
              onClick={() => markAllAsRead.mutate()}
            >
              Mark all read
            </Text>
          )}
        </Flex>

        {notifications.length === 0 ? (
          <Flex justify="center" align="center" py="6">
            <Text size="2" color="gray">
              No notifications yet
            </Text>
          </Flex>
        ) : (
          notifications.map((n) => (
            <Flex
              key={n._id}
              gap="2"
              px="3"
              py="2"
              style={{
                cursor: "pointer",
                background: n.is_read ? "transparent" : "var(--gray-2)",
                borderBottom: "1px solid var(--gray-3)",
              }}
              onClick={() => handleNotificationClick(n)}
            >
              {!n.is_read && (
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--lime-9)",
                    flexShrink: 0,
                    marginTop: "5px",
                  }}
                />
              )}
              <Flex
                direction="column"
                gap="1"
                style={{ flex: 1, paddingLeft: n.is_read ? "15px" : 0 }}
              >
                <Text size="2" weight={n.is_read ? "regular" : "medium"}>
                  {n.title}
                </Text>
                <Text size="1" color="gray">
                  {n.body}
                </Text>
                <Text size="1" color="gray">
                  {formatRelativeTime(n.created_at)}
                </Text>
              </Flex>
              <XIcon
                size={14}
                style={{
                  flexShrink: 0,
                  color: "var(--gray-8)",
                  marginTop: "2px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification.mutate(n._id);
                }}
              />
            </Flex>
          ))
        )}
      </Popover.Content>
    </Popover.Root>
  );
}

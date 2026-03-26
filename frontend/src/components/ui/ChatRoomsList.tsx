import { useState } from "react";
import { Card, Text, Flex, Badge, IconButton, Button } from "@radix-ui/themes";
import { ChatRoom } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/api";
import { ClockIcon, ReloadIcon, PlusIcon } from "@radix-ui/react-icons";
import { useUser } from "@/App";
import { MessageCircleIcon } from "lucide-react";
import { NewGroupChatDialog } from "./NewGroupChatDialog";

interface ChatRoomsListProps {
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

export function ChatRoomsList({
  onSelectRoom,
  selectedRoomId,
}: ChatRoomsListProps) {
  const [page] = useState(1);
  const [limit] = useState(20);
  const { currentUserId } = useUser();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const queryClient = useQueryClient();
  // Fetch chat rooms
  const {
    data: roomsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chat-rooms", page, limit],
    queryFn: () => chatApi.getMyChatRooms(page, limit),
    refetchInterval: 5000, // Poll every 5 seconds for better responsiveness
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return "No messages";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <Text>Loading chat rooms...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <Text color="red">Error loading chat rooms</Text>
      </Card>
    );
  }

  const rooms = roomsData?.data.rooms || [];

  const handleChatCreated = (room: ChatRoom) => {
    queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    onSelectRoom(room);
  };

  if (rooms.length === 0) {
    return (
      <Card className="p-4 mr-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <MessageCircleIcon className="w-12 h-12 mx-auto mb-4" />
          <Text size="3" weight="bold" className="block mb-2">
            This space is feeling a little... empty
          </Text>
          <Text color="gray" className="block mb-4">
            Why not be the first to say hi? Start a new conversation.
          </Text>
          <Button onClick={() => setNewChatOpen(true)}>
            <PlusIcon /> New Chat
          </Button>
        </div>
        <NewGroupChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onCreated={handleChatCreated}
        />
      </Card>
    );
  }

  return (
    <div className="lg:col-span-1 h-full max-h-[75vh] overflow-y-auto pr-4">
      {/* Header with refresh button */}
      <div
        className={`flex p-3 justify-between items-center overflow-hidden sticky top-0 z-30 transition-all bg-background`}
      >
        <Text size="3" weight="bold">
          Chat Rooms
        </Text>
        <Flex gap="2" align="center">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <ReloadIcon className="w-4 h-4" />
          </IconButton>
          <IconButton
            variant="soft"
            size="2"
            onClick={() => setNewChatOpen(true)}
            title="New Chat"
          >
            <PlusIcon className="w-4 h-4" />
          </IconButton>
        </Flex>
      </div>

      <div className="space-y-2">
        {rooms.map((room: ChatRoom) => (
          <Card
            key={room._id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedRoomId === room._id ? "" : ""
            }`}
            onClick={() => onSelectRoom(room)}
          >
            <div className="flex-1">
              <Text size="3" weight="bold" className="block mb-1 capitalize">
                {room.name
                  ? room.name
                  : room.participants && room.participants.length > 0
                    ? (() => {
                        const others = Array.from(
                          new Map(
                            room.participants!.map((p) => [p.id, p])
                          ).values()
                        ).filter((p) => String(p.id) !== String(currentUserId));
                        const names = others
                          .map((p) => p.full_name || p.username)
                          .join(", ");
                        return names ? "Chat with " + names : "Chat Room";
                      })()
                    : "Chat Room"}
              </Text>
              {room.description && (
                <Text size="2" color="gray" className="block mb-2">
                  {room.description}
                </Text>
              )}
              {/* Services info - Show multiple services */}
              <Flex wrap="wrap" gap="1" className="mb-2">
                {room.services && room.services.length > 0 ? (
                  <>
                    {room.services.length === 1 ? (
                      <Badge
                        color="blue"
                        size="1"
                        className="max-w-full truncate text-ellipsis overflow-hidden whitespace-nowrap"
                      >
                        {room.services[0].title || "Unknown service"}
                      </Badge>
                    ) : (
                      <>
                        <Badge color="blue" size="1">
                          {room.services.length} Services
                        </Badge>
                        {room.services.slice(0, 2).map((service, idx) => (
                          <Badge
                            key={service.id}
                            color="blue"
                            variant="soft"
                            size="1"
                            className="max-w-[120px] truncate text-ellipsis overflow-hidden whitespace-nowrap"
                            title={service.title}
                          >
                            {service.title}
                          </Badge>
                        ))}
                        {room.services.length > 2 && (
                          <Badge color="blue" variant="soft" size="1">
                            +{room.services.length - 2} more
                          </Badge>
                        )}
                      </>
                    )}
                  </>
                ) : room.service ? (
                  <Badge
                    color="blue"
                    size="1"
                    className="max-w-full truncate text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    {room.service?.title || "Unknown service"}
                  </Badge>
                ) : null}
              </Flex>
            </div>

            <div className="text-right flex justify-between">
              <Flex align="center" gap="1" className="mb-1">
                <ClockIcon className="w-3 h-3" />
                <Text size="1" color="gray">
                  {formatLastMessageTime(room.last_message_at)}
                </Text>
              </Flex>
              <Text size="1" color="gray">
                {room.participants?.length || 0} participants
              </Text>
            </div>
          </Card>
        ))}
      </div>

      <NewGroupChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreated={handleChatCreated}
      />
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Card, Text, Flex, Button, TextField, Badge } from "@radix-ui/themes";
import { ChatRoom, Message } from "@/types";
import { chatApi } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

interface ChatRoomProps {
  room: ChatRoom;
  currentUserId: string;
}

export function ChatRoomComponent({ room, currentUserId }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["chat-messages", room._id],
    queryFn: () => chatApi.getRoomMessages(room._id, 1, 50),
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage({
        room_id: room._id,
        content,
        message_type: "text",
      }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", room._id] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    try {
      await sendMessageMutation.mutateAsync(newMessage.trim());
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.data.messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messagesLoading) {
    return (
      <Card className="p-4">
        <Text>Loading messages...</Text>
      </Card>
    );
  }

  if (messagesError) {
    return (
      <Card className="p-4">
        <Text color="red">Error loading messages</Text>
      </Card>
    );
  }

  const messages = messagesData?.data.messages || [];
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Flex
        justify="between"
        align="center"
        className="border-b border-gray-200/30 p-2 pb-3"
      >
        <div className="flex flex-col gap-1 flex-1">
          <Text size="3" weight="bold">
            {room.name ||
              room.service?.title ||
              room.services?.[0]?.title ||
              "Chat Room"}
          </Text>
          {room.description && (
            <Text size="2" color="gray">
              {room.description}
            </Text>
          )}
          {/* Show multiple services */}
          {room.services && room.services.length > 1 && (
            <Flex wrap="wrap" gap="1" mt="1">
              <Text size="1" color="gray" className="mr-1">
                Services:
              </Text>
              {room.services.map((service, idx) => (
                <Badge
                  key={service.id}
                  color="blue"
                  variant="soft"
                  size="1"
                  className="max-w-[150px] truncate"
                  title={service.title}
                >
                  {service.title}
                </Badge>
              ))}
            </Flex>
          )}
        </div>
        <Flex align="center" gap="2" className="ml-2">
          {room.transaction?.hours && (
            <Badge color="green">{room.transaction.hours}h transaction</Badge>
          )}
          {room.transaction?.status && (
            <Badge color="green" className="uppercase">
              {room.transaction.status}
            </Badge>
          )}
        </Flex>
      </Flex>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center opacity-50 py-8">
            <Text>No messages yet. Start the conversation!</Text>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender_id === currentUserId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-xl lg:max-w-md px-4 py-2 ${
                  message.sender_id === currentUserId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
                style={{
                  borderRadius: "12px",
                }}
              >
                {message.sender_id !== currentUserId && (
                  <Text size="1" weight="bold" className="block mb-1">
                    {message.sender?.username || "Unknown User"}
                  </Text>
                )}
                <Text size="2">{message.content}</Text>
                <div className="flex justify-between items-center mt-1">
                  <Text
                    size="1"
                    className={
                      message.sender_id === currentUserId
                        ? "text-blue-100"
                        : "text-gray-500"
                    }
                  >
                    {formatTime(message.created_at)}
                  </Text>
                  {message.is_edited && (
                    <Text
                      size="1"
                      className={
                        message.sender_id === currentUserId
                          ? "text-blue-100"
                          : "text-gray-500"
                      }
                    >
                      (edited)
                    </Text>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <Card className="p-4">
        <form onSubmit={handleSendMessage}>
          <Flex gap="2">
            <TextField.Root
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <PaperPlaneIcon className="w-4 h-4" />
              {sendMessageMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </Flex>
        </form>
      </Card>
    </div>
  );
}

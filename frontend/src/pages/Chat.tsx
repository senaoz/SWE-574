import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Text } from "@radix-ui/themes";
import { ChatRoom } from "@/types";
import { ChatRoomsList } from "@/components/ui/ChatRoomsList";
import { ChatRoomComponent } from "@/components/ui/ChatRoom";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { chatApi } from "@/services/api";
import { useUser } from "@/App";

export function Chat() {
  const [searchParams] = useSearchParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { currentUserId } = useUser();

  const roomIdFromUrl = searchParams.get("room_id");

  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [roomIdFromUrl]);

  useEffect(() => {
    if (roomId !== selectedRoom?._id && roomId) {
      chatApi.getChatRoom(roomId).then((response) => {
        setSelectedRoom(response.data);
      });
    }
  }, [roomId, selectedRoom?._id, currentUserId]);

  const handleSelectRoom = (room: ChatRoom) => {
    setRoomId(room._id);
    setSelectedRoom(room);
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading...</Text>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Text size="6" weight="bold" className="block mb-2">
          Chat
        </Text>
        <Text color="gray">
          Communicate with other users about your service exchanges
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 h-[75vh]">
        {/* Chat Rooms List */}
        <ChatRoomsList
          onSelectRoom={handleSelectRoom}
          selectedRoomId={selectedRoom?._id}
        />

        {/* Chat Room */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {selectedRoom ? (
              <ChatRoomComponent
                room={selectedRoom}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ChatBubbleIcon className="w-16 h-16 mx-auto mb-4" />
                  <Text size="4" weight="bold" className="block mb-2">
                    Select a Chat Room
                  </Text>
                  <Text color="gray">
                    Choose a chat room from the list to start messaging
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

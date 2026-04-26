import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Text } from "@radix-ui/themes";
import { ChatRoom } from "@/types";
import { ChatRoomsList } from "@/components/ui/ChatRoomsList";
import { ChatRoomComponent } from "@/components/ui/ChatRoom";
import { chatApi } from "@/services/api";
import { useUser } from "@/App";
// @ts-ignore
import messageIcon from "../assets/message.webp";

/** Klavye açıldığında visualViewport küçülür, biz de container yüksekliğini buna göre ayarlarız. */
function useVisualViewportHeight() {
  const [height, setHeight] = useState<number>(
    () => window.visualViewport?.height ?? window.innerHeight
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

export function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { currentUserId } = useUser();
  const roomIdFromUrl = searchParams.get("room_id");
  const vpHeight = useVisualViewportHeight();
  // Header yüksekliği sabit ~64px; bu değeri çıkararak net chat alanı hesapla
  const HEADER_HEIGHT = 64;
  const chatHeight = Math.max(vpHeight - HEADER_HEIGHT, 200);

  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("room_id");
        return next;
      }, { replace: true });
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
      <div
        className="grid grid-cols-1 lg:grid-cols-3"
        style={{ height: `${chatHeight}px` }}
      >
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
                  <img src={messageIcon} className={"w-32 mx-auto mb-4"} />
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
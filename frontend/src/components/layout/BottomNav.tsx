import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import {
  MapPinIcon,
  MessageCircleIcon,
  PlusIcon,
  UsersIcon,
  UserIcon,
} from "lucide-react";
import {
  Dialog,
  Box,
  Heading,
  Text,
} from "@radix-ui/themes";
import { SunIcon, HandIcon } from "@radix-ui/react-icons";
import { OfferNeedForm } from "@/components/forms/OfferNeedForm";

export function BottomNav() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<"offer" | "need">("need");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const pathname = location.pathname;
  const search = location.search;

  const isMap = pathname === "/dashboard";
  const isChat = pathname === "/profile" && search.includes("tab=chat");
  const isCommon = pathname === "/forum" || pathname.startsWith("/forum/");
  const isProfile = pathname === "/profile" && !search.includes("tab=chat");

  const activeClass = "text-lime-500";
  const inactiveClass = "text-gray-400 dark:text-gray-500";

  return (
    <>
      {/* Floating + FAB */}
      <button
        onClick={() => {
          setSelectedServiceType("need");
          setErrorMessage(null);
          setShowDialog(true);
        }}
        className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-50 bg-lime-500 hover:bg-lime-600 active:scale-95 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-all"
        aria-label="Create Offer or Need"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center px-2 bg-transparent"
      >
        {/* Map */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${isMap ? activeClass : inactiveClass} transition-colors`}
          aria-label="Map"
        >
          <MapPinIcon className="w-5 h-5" />
          <span className="text-xs">Map</span>
        </button>

        {/* Chat */}
        <button
          onClick={() => navigate("/profile?tab=chat")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${isChat ? activeClass : inactiveClass} transition-colors`}
          aria-label="Chat"
        >
          <MessageCircleIcon className="w-5 h-5" />
          <span className="text-xs">Chat</span>
        </button>

        {/* Center spacer — FAB alanını boş bırak */}
        <div className="flex-1" aria-hidden="true" />

        {/* Common */}
        <button
          onClick={() => navigate("/forum")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${isCommon ? activeClass : inactiveClass} transition-colors`}
          aria-label="Common"
        >
          <UsersIcon className="w-5 h-5" />
          <span className="text-xs">Common</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${isProfile ? activeClass : inactiveClass} transition-colors`}
          aria-label="Profile"
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </button>
      </nav>

      {/* Create Offer/Need Dialog */}
      <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
        <Dialog.Content
          align="center"
          size="4"
          className="overflow-y-auto p-4 md:p-12"
          aria-describedby={undefined}
          maxWidth="80vw"
          maxHeight="80vh"
        >
          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
            {errorMessage && (
              <Text size="2" color="red" className="col-span-2 text-center">
                {errorMessage}
              </Text>
            )}
            <Box
              className={`border-2 rounded-lg hover-card px-8 py-4 text-center ${
                selectedServiceType === "offer" ? "hover-card-selected offer" : ""
              }`}
              onClick={() => setSelectedServiceType("offer")}
            >
              <Heading size="5" className="mb-1 flex items-center justify-center">
                <SunIcon className="mr-2 h-6 w-6 text-orange-500" />
                Offer a Service
              </Heading>
              <Text size="2">
                Share your skills and services with the community, let others know
                what you're offering.
              </Text>
            </Box>
            <Box
              className={`border-2 rounded-lg hover-card px-10 py-4 text-center ${
                selectedServiceType === "need" ? "hover-card-selected need" : ""
              }`}
              onClick={() => setSelectedServiceType("need")}
            >
              <Heading size="5" className="mb-1 flex items-center justify-center">
                <HandIcon className="mr-2 h-6 w-6 text-blue-500" />
                Need a Service
              </Heading>
              <Text size="2">
                Request a service from the community, let others know what you're
                looking for.
              </Text>
            </Box>
          </div>
          <OfferNeedForm
            serviceType={selectedServiceType}
            onSuccess={() => setShowDialog(false)}
            onClose={() => setShowDialog(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

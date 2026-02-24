import { useQuery } from "@tanstack/react-query";
import { Button, Box, Dialog, IconButton, Flex, Avatar } from "@radix-ui/themes";
import { usersApi } from "@/services/api";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { SearchBar } from "@/components/ui/SearchBar";
import { CityFilter } from "@/components/ui/CityFilter";
import { useTheme } from "@/App";
import { useFilters } from "@/contexts/FilterContext";
import { LoginForm } from "../auth/LoginForm";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HandIcon } from "@radix-ui/react-icons";
import {
  ChatBubbleIcon,
  GearIcon,
  HomeIcon,
  AvatarIcon,
} from "@radix-ui/react-icons";

export const useScroll = (threshold: number) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, scrolled]);
  return scrolled;
};

export function Header() {
  const navigate = useNavigate();
  const { appearance, toggleAppearance } = useTheme();
  const { selectedCity, setSelectedCity, setSearchQuery } = useFilters();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const { data: timebankData } = useQuery({
    queryKey: ["timebank"],
    queryFn: () => usersApi.getTimeBank().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersApi.getProfile().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });

  const scrolled = useScroll(25);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("login") === "true") {
      setLoginDialogOpen(true);

      // remove the login=true from the url
      searchParams.delete("login");
      window.history.replaceState(
        {},
        "",
        window.location.pathname + searchParams.toString()
      );
    }
  }, [window.location.search]);

  return (
    <Box
      className={`px-10 py-4 sticky top-0 w-full ${
        scrolled ? "backdrop-blur-xl border-b border-gray-200/10" : "bg-white/0"
      } z-30 transition-all`}
    >
      <div>
        <div className="grid grid-cols-[1fr_3fr_1fr] gap-2 items-center">
          <h1
            className="text-3xl font-semibold text-lime-500 cursor-pointer"
            onClick={() => navigate("/")}
          >
            HIVE
          </h1>

          {/* Search and Filter - Only show for logged in users */}
          {localStorage.getItem("access_token") ? (
            <Flex gap="2" className="w-full max-w-xl mx-auto">
              <SearchBar onSearchChange={setSearchQuery} />
              <CityFilter
                className="w-48"
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
              />
            </Flex>
          ) : (
            <div className="w-full" />
          )}

          <div className="flex items-center justify-end">
            <ThemeSwitcher
              appearance={appearance}
              onToggle={toggleAppearance}
            />
            {localStorage.getItem("access_token") && timebankData ? (
              <Flex gap="2" align="center">
                {timebankData.requires_need_creation ? (
                  <Button
                    variant="soft"
                    color="amber"
                    onClick={() => navigate("/dashboard")}
                  >
                    <HandIcon className="w-4 h-4 mr-1" />
                    Create Need required
                  </Button>
                ) : null}
                <Button variant="outline">
                  {`${Math.round(timebankData.balance)} Hours Left`}
                </Button>
              </Flex>
            ) : null}
            {!localStorage.getItem("access_token") ? (
              <LoginDialog
                open={loginDialogOpen}
                onOpenChange={setLoginDialogOpen}
                setLoginDialogOpen={setLoginDialogOpen}
              />
            ) : (
              <div className="flex items-center space-x-2 ml-2">
                <IconButton onClick={() => navigate("/profile")} style={{ borderRadius: "var(--radius-full)" }}>
                  {currentUser?.profile_picture ? (
                    <Avatar
                      src={currentUser.profile_picture}
                      fallback={currentUser.full_name?.[0] || currentUser.username[0]}
                      size="1"
                      radius="full"
                    />
                  ) : (
                    <AvatarIcon className="w-4 h-4" />
                  )}
                </IconButton>
                <IconButton onClick={() => navigate("/dashboard")}>
                  <HomeIcon className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={() => navigate("/chat")}>
                  <ChatBubbleIcon className="w-4 h-4" />
                </IconButton>
                {currentUser?.role === "admin" && (
                  <IconButton
                    onClick={() => navigate("/admin")}
                    variant="outline"
                  >
                    <GearIcon className="w-4 h-4" />
                  </IconButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
}

function LoginDialog({
  open,
  onOpenChange,
  setLoginDialogOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setLoginDialogOpen: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger>
        <Button>Login</Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Title className="text-2xl font-bold">Welcome Back</Dialog.Title>
        <Dialog.Description className="mb-4">
          Log in to your account to continue
        </Dialog.Description>
        <LoginForm setLoginDialogOpen={setLoginDialogOpen} />
      </Dialog.Content>
    </Dialog.Root>
  );
}


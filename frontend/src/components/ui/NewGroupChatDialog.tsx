import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Badge,
  IconButton,
  Avatar,
} from "@radix-ui/themes";
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { usersApi, chatApi, getImageUrl } from "@/services/api";
import { User, ChatRoom } from "@/types";
import { useUser } from "@/App";
import { useNavigate } from "react-router-dom";

interface NewGroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (room: ChatRoom) => void;
}

export function NewGroupChatDialog({
  open,
  onOpenChange,
  onCreated,
}: NewGroupChatDialogProps) {
  const { currentUserId } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      clearTimeout(searchTimerRef.current);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      searchTimerRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await usersApi.searchUsers(query, 10);
          const filtered = res.data.filter(
            (u) =>
              !selectedUsers.some((s) => s._id === u._id) &&
              u._id !== currentUserId,
          );
          setSearchResults(filtered);
        } catch {
          setSearchResults([]);
          setError("Search failed. Please try again.");
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [selectedUsers, currentUserId],
  );

  const addUser = (user: User) => {
    if (selectedUsers.length >= 9) return; // max 10 including current user
    setSelectedUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      setError("Add at least one participant");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const participantIds = [
        currentUserId!,
        ...selectedUsers.map((u) => u._id),
      ];
      const res = await chatApi.createChatRoom({
        name: groupName.trim() || undefined,
        participant_ids: participantIds,
      });
      onCreated(res.data);
      resetForm();
      onOpenChange(false);
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail || "Failed to create chat room");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName("");
    setError("");
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>New Group Chat</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          Add participants and start a group conversation.
        </Dialog.Description>

        <Flex direction="column" gap="3" className="mt-4">
          {/* Group name */}
          <div>
            <Text size="2" weight="medium" className="block mb-1">
              Group Name (optional)
            </Text>
            <TextField.Root
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Weekend Cooking Club"
              maxLength={100}
            />
          </div>

          {/* Selected participants */}
          {selectedUsers.length > 0 && (
            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Participants ({selectedUsers.length + 1}/10)
              </Text>
              <Flex wrap="wrap" gap="2">
                {selectedUsers.map((user) => (
                  <Badge key={user._id} color="blue" size="2" variant="soft">
                    <Avatar
                      src={getImageUrl(user.profile_picture) ?? undefined}
                      fallback={user.full_name?.[0] || user.username[0]}
                      size="1"
                      radius="full"
                    />
                    {user.full_name || user.username}
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      onClick={() => removeUser(user._id)}
                      style={{ marginLeft: 2 }}
                    >
                      <Cross2Icon width={10} height={10} />
                    </IconButton>
                  </Badge>
                ))}
              </Flex>
            </div>
          )}

          {/* User search */}
          <div>
            <Text size="2" weight="medium" className="block mb-1">
              Search Users
            </Text>
            <TextField.Root
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type a name or username..."
            >
              <TextField.Slot>
                <MagnifyingGlassIcon />
              </TextField.Slot>
            </TextField.Root>
          </div>

          {/* Search results */}
          {searching && (
            <Text size="2" color="gray">
              Searching...
            </Text>
          )}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="px-3 py-2 hover:opacity-60 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <Avatar
                    src={getImageUrl(user.profile_picture) ?? undefined}
                    fallback={user.full_name?.[0] || user.username[0]}
                    size="2"
                    radius="full"
                    className="cursor-pointer flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChange(false);
                      navigate(`/user/${user._id}`);
                    }}
                  />
                  <button
                    onClick={() => addUser(user)}
                    className="flex-1 text-left flex items-center justify-between"
                  >
                    <div>
                      <Text size="2" weight="medium">
                        {user.full_name || user.username}
                      </Text>
                      {user.full_name && (
                        <Text size="1" color="gray" className="ml-2">
                          @{user.username}
                        </Text>
                      )}
                    </div>
                    <Text size="1" color="blue">
                      + Add
                    </Text>
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 &&
            !searching &&
            searchResults.length === 0 && (
              <Text size="2" color="gray">
                No users found
              </Text>
            )}

          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleCreate}
            disabled={creating || selectedUsers.length === 0}
          >
            {creating
              ? "Creating..."
              : selectedUsers.length > 1
                ? "Create Group Chat"
                : "Create Chat"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

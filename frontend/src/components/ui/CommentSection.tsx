import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Button,
  TextArea,
  Badge,
} from "@radix-ui/themes";
import { Comment, Service } from "@/types";
import {
  ChatBubbleIcon,
  PaperPlaneIcon,
  Pencil1Icon,
  TrashIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { commentsApi, servicesApi } from "@/services/api";
import { useUser } from "@/App";

interface CommentSectionProps {
  serviceId: string;
}

export function CommentSection({ serviceId }: CommentSectionProps) {
  const { currentUserId } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch comments and service on component mount
  useEffect(() => {
    fetchComments();
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const response = await servicesApi.getService(serviceId);
      setService(response.data);
    } catch (error) {
      console.error("Error fetching service:", error);
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await commentsApi.getServiceComments(serviceId);
      setComments(response.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEditSave = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const response = await commentsApi.updateComment(commentId, {
        content: editContent.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? response.data : c))
      );
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await commentsApi.createComment({
        content: newComment.trim(),
        service_id: serviceId,
      });

      // Add the new comment to the list
      setComments((prev) => [response.data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    // Parse the UTC timestamp correctly
    const commentDate = new Date(dateString);

    // Calculate the difference in milliseconds
    const diffInMs = now.getTime() - commentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else {
      // For older comments, show the actual date
      return commentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Card className="p-4">
      <Flex align="center" gap="2" className="mb-4">
        <ChatBubbleIcon className="w-5 h-5" />
        <Text size="4" weight="bold">
          Comments & Ideas ({comments.length})
        </Text>
      </Flex>

      {/* Add comment form */}
      <div className="mb-4">
        <TextArea
          placeholder="Add a comment, idea, or share your experience..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-3"
          rows={3}
        />
        <Flex justify="end">
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            size="2"
          >
            <PaperPlaneIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </Flex>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          <Text size="2" color="gray" className="text-center py-8">
            Loading comments...
          </Text>
        ) : (
          comments.map((comment) => {
            const user = comment.user;
            const isParticipant =
              service &&
              (service.user_id === comment.user_id ||
                service.matched_user_ids?.includes(comment.user_id));
            const isOwner = currentUserId === comment.user_id;
            const isEditing = editingId === comment._id;
            return (
              <div key={comment._id} className="flex gap-3">
                <Avatar
                  fallback={user?.full_name?.[0] || user?.username?.[0] || "?"}
                  size="3"
                />
                <div className="flex-1">
                  <Flex align="center" gap="2" className="mb-1">
                    <Text size="2" weight="bold">
                      {user?.full_name || user?.username || "Unknown User"}
                    </Text>
                    {isParticipant && (
                      <Badge color="blue" size="1">
                        Participant
                      </Badge>
                    )}
                    <Text size="1" color="gray">
                      {formatDate(comment.created_at)}
                    </Text>
                    {isOwner && !isEditing && (
                      <Flex gap="1" className="ml-auto">
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={() => handleEditStart(comment)}
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDelete(comment._id)}
                        >
                          <TrashIcon />
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                  {isEditing ? (
                    <div>
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="mb-2"
                      />
                      <Flex gap="2">
                        <Button
                          size="1"
                          onClick={() => handleEditSave(comment._id)}
                          disabled={!editContent.trim()}
                        >
                          <CheckIcon /> Save
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={handleEditCancel}
                        >
                          <Cross2Icon /> Cancel
                        </Button>
                      </Flex>
                    </div>
                  ) : (
                    <Text size="2" className="leading-relaxed">
                      {comment.content}
                    </Text>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && comments.length === 0 && (
        <Text size="2" color="gray" className="text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </Text>
      )}
    </Card>
  );
}

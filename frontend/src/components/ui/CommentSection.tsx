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
import { ChatBubbleIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { commentsApi, servicesApi } from "@/services/api";

interface CommentSectionProps {
  serviceId: string;
}

export function CommentSection({ serviceId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);

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
      <Flex align="center" gap="2" className="mb-6">
        <ChatBubbleIcon className="w-5 h-5" />
        <Text size="4" weight="bold">
          Comments & Ideas ({comments.length})
        </Text>
      </Flex>

      {/* Add comment form */}
      <div className="mb-6">
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
                  </Flex>
                  <Text size="2" className="leading-relaxed">
                    {comment.content}
                  </Text>
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

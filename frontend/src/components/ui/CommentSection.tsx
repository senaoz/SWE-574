import { useState, useEffect, useRef } from "react";
import {
  Text,
  Flex,
  Avatar,
  Button,
  TextArea,
  Badge,
} from "@radix-ui/themes";
import { Comment, Service } from "@/types";
import { PaperPlaneIcon, Cross2Icon } from "@radix-ui/react-icons";
import { commentsApi, getImageUrl, servicesApi, uploadApi } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { MessageCircleIcon, ImageIcon } from "lucide-react";
import { formatRelativeTime } from "@/utils/utils";

const MAX_IMAGES = 3;

interface CommentSectionProps {
  serviceId: string;
}

export function CommentSection({ serviceId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - selectedFiles.length;
    const toAdd = files.slice(0, remaining);
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviewUrls((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    setUploadError(null);
    // Reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setUploadError(null);
    try {
      let image_urls: string[] | undefined;
      if (selectedFiles.length > 0) {
        const uploads = await Promise.all(
          selectedFiles.map((file) => uploadApi.uploadCommentImage(file))
        );
        image_urls = uploads.map((r) => r.data.url);
      }

      const response = await commentsApi.createComment({
        content: newComment.trim(),
        service_id: serviceId,
        ...(image_urls ? { image_urls } : {}),
      });

      setComments((prev) => [response.data, ...prev]);
      setNewComment("");
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error("Error creating comment:", error);
      setUploadError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <Flex align="center" gap="2" className="mb-4">
        <MessageCircleIcon className="w-5 h-5" />
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
          className="mb-2"
          rows={3}
          variant="soft"
        />

        {/* Image previews */}
        {previewUrls.length > 0 && (
          <Flex gap="2" wrap="wrap" className="mb-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative inline-block">
                <img
                  src={url}
                  alt={`preview ${i + 1}`}
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                />
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
                  aria-label="Remove image"
                >
                  <Cross2Icon width={8} height={8} />
                </button>
              </div>
            ))}
          </Flex>
        )}

        {uploadError && (
          <Text size="1" color="red" className="mb-2">
            {uploadError}
          </Text>
        )}

        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="ghost"
              size="1"
              color="gray"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length >= MAX_IMAGES}
              title={selectedFiles.length >= MAX_IMAGES ? `Max ${MAX_IMAGES} images` : "Attach images"}
            >
              <ImageIcon className="w-4 h-4" />
              {selectedFiles.length > 0 && (
                <Text size="1" color="gray">{selectedFiles.length}/{MAX_IMAGES}</Text>
              )}
            </Button>
          </Flex>
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
            const commentUserId = String(comment.user_id ?? "");
            const isOwner =
              service && String(service.user_id ?? "") === commentUserId;
            const isParticipant =
              service &&
              !isOwner &&
              service.matched_user_ids?.some(
                (id) => String(id ?? "") === commentUserId,
              );
            return (
              <div key={comment._id} className="flex gap-3">
                <Avatar
                  src={getImageUrl(user?.profile_picture)}
                  fallback={user?.full_name?.[0] || user?.username?.[0] || "?"}
                  size="3"
                  onClick={() => navigate(`/profile/${comment.user_id}`)}
                  className="cursor-pointer"
                />
                <div className="flex-1">
                  <Flex align="center" gap="2" className="mb-1">
                    <Text
                      size="2"
                      weight="bold"
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${comment.user_id}`)}
                    >
                      {user?.full_name || user?.username || "Unknown User"}
                    </Text>
                    {isOwner && (
                      <Badge color="amber" size="1">
                        Owner
                      </Badge>
                    )}
                    {isParticipant && (
                      <Badge color="blue" size="1">
                        Participant
                      </Badge>
                    )}
                    <Text size="1" color="gray">
                      {formatRelativeTime(comment.created_at)}
                    </Text>
                  </Flex>
                  <Text size="2" className="leading-relaxed">
                    {comment.content}
                  </Text>
                  {comment.image_urls && comment.image_urls.length > 0 && (
                    <Flex gap="2" wrap="wrap" className="mt-2">
                      {comment.image_urls.map((url, i) => (
                        <a key={i} href={getImageUrl(url)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getImageUrl(url)}
                            alt={`comment image ${i + 1}`}
                            className="w-24 h-24 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </Flex>
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
    </div>
  );
}

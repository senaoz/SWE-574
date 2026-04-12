import { useState, useEffect, useRef } from "react";
import { Text, Flex, Avatar, Button, TextArea } from "@radix-ui/themes";
import { PaperPlaneIcon, Cross2Icon } from "@radix-ui/react-icons";
import { getImageUrl, uploadApi } from "@/services/api";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { useNavigate } from "react-router-dom";
import { MessageCircleIcon, ImageIcon } from "lucide-react";
import { formatRelativeTime } from "@/utils/utils";

const MAX_IMAGES = 3;

export interface CommentItem {
  _id: string;
  user_id: string;
  content: string;
  image_urls?: string[];
  created_at: string;
  user?: {
    profile_picture?: string;
    full_name?: string;
    username?: string;
  };
  // Forum-specific optional fields
  upvote_count?: number;
  user_upvoted?: boolean;
}

interface CommentSectionProps {
  fetchComments: () => Promise<CommentItem[]>;
  postComment: (content: string, imageUrls?: string[]) => Promise<CommentItem>;
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
  /** Rendered after the username + timestamp row (e.g. owner/participant badges) */
  renderCommentMeta?: (comment: CommentItem) => React.ReactNode;
  /** Overrides default plain-text rendering of comment.content */
  renderCommentContent?: (comment: CommentItem) => React.ReactNode;
  /** Rendered to the right of the comment body (e.g. upvote button) */
  renderCommentActions?: (comment: CommentItem) => React.ReactNode;
}

export function CommentSection({
  fetchComments,
  postComment,
  title = "Comments",
  placeholder = "Write a comment...",
  emptyMessage = "No comments yet. Be the first to share your thoughts!",
  renderCommentMeta,
  renderCommentContent,
  renderCommentActions,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchComments()
      .then((items) => {
        if (!cancelled) setComments(items);
      })
      .catch((e) => console.error("Error fetching comments:", e))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchComments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, MAX_IMAGES - selectedFiles.length);
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviewUrls((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    setUploadError(null);
    try {
      let imageUrls: string[] | undefined;
      if (selectedFiles.length > 0) {
        const uploads = await Promise.all(
          selectedFiles.map((file) => uploadApi.uploadCommentImage(file)),
        );
        imageUrls = uploads.map((r) => r.data.url);
      }
      const created = await postComment(newComment.trim(), imageUrls);
      setComments((prev) => [created, ...prev]);
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
          {title} ({comments.length})
        </Text>
      </Flex>

      {/* Comment form */}
      <div className="mb-4 relative">
        <TextArea
          placeholder={placeholder}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
          rows={3}
          variant="soft"
        />

        <Flex align="center" gap="2" className="comment-images-input">
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
            title={
              selectedFiles.length >= MAX_IMAGES
                ? `Max ${MAX_IMAGES} images`
                : "Attach images"
            }
          >
            <ImageIcon className="w-4 h-4" />
            {selectedFiles.length > 0 && (
              <Text size="1" color="gray">
                {selectedFiles.length}/{MAX_IMAGES}
              </Text>
            )}
          </Button>
        </Flex>

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

        <Flex justify="end" align="center">
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="2"
          >
            <PaperPlaneIcon className="w-4 h-4 mr-2" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </Flex>
      </div>

      {/* Comment list */}
      <div className="space-y-4">
        {isLoading ? (
          <Text size="2" color="gray" className="text-center py-8">
            Loading comments...
          </Text>
        ) : (
          comments.map((comment) => {
            const user = comment.user;
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
                    {renderCommentMeta?.(comment)}
                    <Text size="1" color="gray">
                      {formatRelativeTime(comment.created_at)}
                    </Text>
                  </Flex>
                  {renderCommentContent ? (
                    renderCommentContent(comment)
                  ) : (
                    <Text size="2" className="leading-relaxed">
                      {comment.content}
                    </Text>
                  )}
                  {comment.image_urls && comment.image_urls.length > 0 && (
                    <ImageGallery
                      urls={comment.image_urls}
                      alt="Comment photo"
                      layout="thumbnails"
                      className="mt-2"
                    />
                  )}
                </div>
                {renderCommentActions && (
                  <div className="mt-1">{renderCommentActions(comment)}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!isLoading && comments.length === 0 && (
        <Text size="2" color="gray" className="text-center py-8">
          {emptyMessage}
        </Text>
      )}
    </div>
  );
}

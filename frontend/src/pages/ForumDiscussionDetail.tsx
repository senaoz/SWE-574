import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Button,
  Badge,
  Heading,
  Dialog,
  TextField,
  Box,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import { ArrowLeftIcon, Pencil1Icon, TrashIcon, PlusIcon } from "@radix-ui/react-icons";
import { PinIcon } from "lucide-react";
import { forumApi, getImageUrl, uploadApi, communityApi } from "@/services/api";
import { useUser } from "@/App";
import { ForumDiscussion, TagEntity, Community } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";
import { UpvoteButton } from "@/components/ui/UpvoteButton";
import { MarkdownEditor } from "@/components/forms/MarkdownEditor";
import { TagAutocomplete } from "@/components/forms/TagAutocomplete";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CommentSection } from "@/components/ui/CommentSection";
import ReactMarkdown from "react-markdown";

function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ForumDiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUserId, user: currentUser } = useUser();
  const [discussion, setDiscussion] = useState<ForumDiscussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isOwner = !!currentUserId && discussion?.user_id === currentUserId;
  const canPinPlatform =
    currentUser?.role === "admin" || currentUser?.role === "moderator";

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const dRes = await forumApi.getDiscussion(id);
        setDiscussion(dRes.data);
      } catch {
        setDiscussion(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await forumApi.deleteDiscussion(id);
    navigate("/forum?tab=discussions");
  };

  const handlePin = async () => {
    if (!id || !discussion) return;
    const res = await forumApi.pinDiscussion(id, !discussion.is_pinned);
    setDiscussion(res.data);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Text color="gray">Loading...</Text>
      </Card>
    );
  }

  if (!discussion) {
    return (
      <div>
        <Text color="red">Discussion not found.</Text>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/forum?tab=discussions")}
      >
        <ArrowLeftIcon /> Back to Forum
      </Button>

      {/* Discussion content */}
      <Card className="p-6 mb-6">
        <Flex gap="3" align="start">
          <Avatar
            size="4"
            src={getImageUrl(discussion.user?.profile_picture)}
            fallback={
              discussion.user?.full_name?.[0] ||
              discussion.user?.username?.[0] ||
              "?"
            }
          />
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                {discussion.is_pinned && (
                  <Badge size="1" variant="soft" color="violet" className="mb-2">
                    <PinIcon className="w-3 h-3 mr-1" /> Pinned by moderator
                  </Badge>
                )}
                <Heading size="5">{discussion.title}</Heading>
              </div>
              <Flex gap="2" align="center">
                {canPinPlatform && (
                  <Button
                    variant="soft"
                    color={discussion.is_pinned ? "gray" : "violet"}
                    size="1"
                    onClick={handlePin}
                  >
                    <PinIcon className="w-3 h-3" />
                    {discussion.is_pinned ? "Unpin" : "Pin"}
                  </Button>
                )}
                {(isOwner || canPinPlatform) && (
                  <>
                    <Button
                      variant="soft"
                      color="gray"
                      size="1"
                      onClick={() => setShowEdit(true)}
                    >
                      <Pencil1Icon /> Edit
                    </Button>
                    <Button
                      variant="soft"
                      color="red"
                      size="1"
                      onClick={() => setShowDelete(true)}
                    >
                      <TrashIcon /> Delete
                    </Button>
                  </>
                )}
                <UpvoteButton
                  count={discussion.upvote_count ?? 0}
                  upvoted={discussion.user_upvoted}
                  onUpvote={
                    currentUserId
                      ? () => forumApi.upvoteDiscussion(id!).then((r) => r.data)
                      : undefined
                  }
                  disabled={!currentUserId}
                  showLoginHint={!currentUserId}
                />
              </Flex>
            </div>
            <Flex gap="2" align="center" className="mt-1 mb-4">
              <Text size="2" color="gray">
                by{" "}
                {discussion.user?.full_name ||
                  discussion.user?.username ||
                  "Unknown"}
              </Text>
              <Text size="1" color="gray">
                {timeAgo(discussion.created_at)}
              </Text>
            </Flex>
            <div className="prose-content">
              <ReactMarkdown
                components={{
                  a: ({ node: _node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {discussion.body}
              </ReactMarkdown>
            </div>
            {discussion.image_urls && discussion.image_urls.length > 0 && (
              <Flex gap="2" mt="2" wrap="wrap">
                {discussion.image_urls.map((url, i) => (
                  <img
                    key={i}
                    src={getImageUrl(url) ?? url}
                    alt=""
                    style={{
                      maxHeight: 300,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ))}
              </Flex>
            )}
            {discussion.tags && discussion.tags.length > 0 && (
              <Flex gap="2" className="mt-4" wrap="wrap">
                {discussion.tags.map((tag, i) => (
                  <ClickableTag key={i} tag={tag} size="1" />
                ))}
              </Flex>
            )}
            {discussion.community_id && (
              <RelatedCommunityBlock communityId={discussion.community_id} />
            )}
          </div>
        </Flex>
      </Card>

      <CommentSection
        fetchComments={() =>
          forumApi.getComments("discussion", id!).then((r) => r.data.comments)
        }
        postComment={(content, imageUrls) =>
          forumApi
            .createComment({
              target_type: "discussion",
              target_id: id!,
              content,
              ...(imageUrls ? { image_urls: imageUrls } : {}),
            })
            .then((r) => r.data)
        }
        placeholder="Write a comment..."
        emptyMessage="No comments yet. Be the first!"
        renderCommentContent={(comment) => (
          <div className="prose-content">
            <ReactMarkdown
              components={{
                a: ({ node: _node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
              }}
            >
              {comment.content}
            </ReactMarkdown>
          </div>
        )}
        renderCommentActions={(comment) => (
          <UpvoteButton
            count={comment.upvote_count ?? 0}
            upvoted={comment.user_upvoted}
            onUpvote={
              currentUserId
                ? () => forumApi.upvoteComment(comment._id).then((r) => r.data)
                : undefined
            }
            disabled={!currentUserId}
          />
        )}
      />

      <EditDiscussionDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        discussion={discussion}
        onUpdated={(updated) => setDiscussion(updated)}
      />
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Discussion"
        description="Are you sure you want to delete this discussion? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function RelatedCommunityBlock({ communityId }: { communityId: string }) {
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);

  useEffect(() => {
    communityApi
      .getCommunity(communityId)
      .then((r) => setCommunity(r.data))
      .catch(() => {});
  }, [communityId]);

  if (!community) return null;

  return (
    <Card
      mt="4"
      className="hover-card cursor-pointer"
      onClick={() => navigate(`/forum/communities/${community._id}`)}
    >
      <Flex gap="3" align="center">
        <Avatar
          src={
            community.avatar_url
              ? (getImageUrl(community.avatar_url) ?? undefined)
              : undefined
          }
          fallback={community.name[0]}
          size="3"
          radius="full"
        />
        <Box flexGrow="1">
          <div className="flex flex-col mb-2">
            <Text size="1" color="gray">
              Related Community
            </Text>
            <Text weight="bold" size="3">
              {community.name}
            </Text>
          </div>
          {community.description && (
            <Text
              size="1"
              color="gray"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {community.description}
            </Text>
          )}
        </Box>
      </Flex>
    </Card>
  );
}

function EditDiscussionDialog({
  open,
  onOpenChange,
  discussion,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  discussion: ForumDiscussion;
  onUpdated: (updated: ForumDiscussion) => void;
}) {
  const [title, setTitle] = useState(discussion.title);
  const [body, setBody] = useState(discussion.body);
  const [tags, setTags] = useState<TagEntity[]>(discussion.tags ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(discussion.image_urls ?? []);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(discussion.title);
      setBody(discussion.body);
      setTags(discussion.tags ?? []);
      setImageUrls(discussion.image_urls ?? []);
      setError("");
    }
  }, [open, discussion]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await forumApi.updateDiscussion(discussion._id, {
        title,
        body,
        tags,
        image_urls: imageUrls.length > 0 ? imageUrls : [],
      });
      onUpdated(res.data);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update discussion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-4xl" aria-describedby={undefined}>
        <Dialog.Title>Edit Discussion</Dialog.Title>
        <Form.Root
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-4 mt-4"
        >
          <Form.Field name="title" className="space-y-2">
            <Form.Label className="text-sm font-medium">Title *</Form.Label>
            <Form.Control asChild>
              <TextField.Root
                placeholder="Discussion title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field name="body" className="space-y-2">
            <Form.Label className="text-sm font-medium">Body *</Form.Label>
            <MarkdownEditor
              placeholder="Write your discussion..."
              value={body}
              onChange={(value) => setBody(value)}
              rows={8}
            />
          </Form.Field>
          <Form.Field name="tags" className="space-y-1">
            <Form.Label className="text-sm font-medium">Tags</Form.Label>
            <TagAutocomplete
              tags={tags}
              onTagAdd={(t) => setTags([...tags, t])}
              onTagRemove={(t) =>
                setTags(tags.filter((x) => x.label !== t.label))
              }
            />
          </Form.Field>
          <Box className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Discussion image (optional)
            </Text>
            {imageUrls.length === 0 && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={imageUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageUploading(true);
                    try {
                      const res = await uploadApi.uploadDiscussionImage(file);
                      setImageUrls([res.data.url]);
                    } catch {
                      // ignore upload errors
                    } finally {
                      setImageUploading(false);
                    }
                  }}
                />
                <span className="flex items-center justify-center gap-2 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm w-full">
                  <PlusIcon className="w-4 h-4" />
                  {imageUploading ? "Uploading..." : "Add image"}
                </span>
              </label>
            )}
            {imageUrls.length > 0 && (
              <Flex gap="2" wrap="wrap" className="border rounded-lg p-2">
                <Box className="relative">
                  <img
                    src={getImageUrl(imageUrls[0]) ?? imageUrls[0]}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    onClick={() => setImageUrls([])}
                  >
                    x
                  </button>
                </Box>
              </Flex>
            )}
          </Box>
          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}
          <Flex justify="end" gap="3">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={submitting || imageUploading}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

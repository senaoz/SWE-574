import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Text, Flex, Avatar, Button, Heading, Badge, Dialog, TextField,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import { ArrowLeftIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { PinIcon } from "lucide-react";
import { communityApi, forumApi, getImageUrl } from "@/services/api";
import { useUser } from "@/App";
import { CommunityPost, Community, TagEntity } from "@/types";
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
  return new Date(dateStr).toLocaleDateString("en-GB");
}

export function CommunityPostDetail() {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const { currentUserId, user } = useUser();

  const [community, setCommunity] = useState<Community | null>(null);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isMember = !!community?.user_membership;
  const isMod = community?.user_membership === "founder" || community?.user_membership === "moderator";
  const isOwner = !!currentUserId && post?.user_id === currentUserId;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!communityId || !postId) return;
    (async () => {
      setLoading(true);
      try {
        const [commRes, postRes] = await Promise.all([
          communityApi.getCommunity(communityId),
          communityApi.getPost(communityId, postId),
        ]);
        setCommunity(commRes.data);
        setPost(postRes.data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [communityId, postId]);

  const handleDelete = async () => {
    await communityApi.deletePost(communityId!, postId!);
    navigate(`/forum/communities/${communityId}`);
  };

  const handlePin = async () => {
    if (!post) return;
    const res = await communityApi.pinPost(communityId!, postId!, !post.is_pinned);
    setPost(res.data);
  };

  if (loading) {
    return <Card className="p-8 text-center"><Text color="gray">Loading...</Text></Card>;
  }

  if (!post) {
    return <div><Text color="red">Post not found.</Text></div>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(`/forum/communities/${communityId}`)}
      >
        <ArrowLeftIcon /> Back to {community?.name || "Community"}
      </Button>

      {/* Post content */}
      <Card className="p-6 mb-6">
        <Flex gap="3" align="start">
          <Avatar
            size="4"
            src={getImageUrl(post.user?.profile_picture)}
            fallback={post.user?.full_name?.[0] || post.user?.username?.[0] || "?"}
          />
          <div className="flex-1">
            <Flex justify="between" align="start" gap="2" wrap="wrap">
              <div>
                <Flex gap="2" align="center" wrap="wrap">
                  {post.is_pinned && (
                    <Badge size="1" variant="soft" color="violet">
                      <PinIcon className="w-3 h-3 mr-1" /> Pinned
                    </Badge>
                  )}
                  {post.post_type === "announcement" && (
                    <Badge size="1" variant="soft" color="orange">📢 Announcement</Badge>
                  )}
                </Flex>
                <Heading size="5" className="mt-1">{post.title}</Heading>
              </div>
              <Flex gap="2" align="center">
                {isMod && (
                  <Button variant="soft" color={post.is_pinned ? "gray" : "violet"} size="1" onClick={handlePin}>
                    <PinIcon className="w-3 h-3" /> {post.is_pinned ? "Unpin" : "Pin"}
                  </Button>
                )}
                {(isOwner || isAdmin) && (
                  <Button variant="soft" color="gray" size="1" onClick={() => setShowEdit(true)}>
                    <Pencil1Icon /> Edit
                  </Button>
                )}
                {(isOwner || isMod || isAdmin) && (
                  <Button variant="soft" color="red" size="1" onClick={() => setShowDelete(true)}>
                    <TrashIcon /> Delete
                  </Button>
                )}
                <UpvoteButton
                  count={post.upvote_count ?? 0}
                  upvoted={post.user_upvoted}
                  onUpvote={
                    currentUserId
                      ? () => communityApi.upvotePost(communityId!, postId!).then((r) => r.data)
                      : undefined
                  }
                  disabled={!currentUserId}
                  showLoginHint={!currentUserId}
                />
              </Flex>
            </Flex>

            <Flex gap="2" align="center" className="mt-1 mb-4">
              <Text size="2" color="gray">
                by {post.user?.full_name || post.user?.username || "Unknown"}
              </Text>
              <Text size="1" color="gray">{timeAgo(post.created_at)}</Text>
            </Flex>

            <div className="prose-content">
              <ReactMarkdown
                components={{
                  a: ({ node: _node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {post.body}
              </ReactMarkdown>
            </div>

            {post.tags && post.tags.length > 0 && (
              <Flex gap="2" className="mt-4" wrap="wrap">
                {post.tags.map((tag, i) => (
                  <ClickableTag key={i} tag={tag} size="1" />
                ))}
              </Flex>
            )}
          </div>
        </Flex>
      </Card>

      {/* Comment section — reusing existing component */}
      {/* Non-members can read comments but not post */}
      <CommentSection
        fetchComments={() =>
          forumApi.getComments("community_post", postId!).then((r) => r.data.comments)
        }
        postComment={
          isMember
            ? (content, imageUrls) =>
                forumApi
                  .createComment({
                    target_type: "community_post",
                    target_id: postId!,
                    content,
                    ...(imageUrls ? { image_urls: imageUrls } : {}),
                  })
                  .then((r) => r.data)
            : undefined
        }
        placeholder={
          !currentUserId
            ? "Sign in to comment"
            : !isMember
            ? "Join the community to comment"
            : "Write a comment..."
        }
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

      <EditPostDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        communityId={communityId!}
        post={post}
        isMod={isMod}
        onUpdated={(updated) => setPost(updated)}
      />
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Edit Post Dialog ───────────────────────────────────────────

function EditPostDialog({
  open, onOpenChange, communityId, post, isMod, onUpdated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  communityId: string;
  post: CommunityPost;
  isMod: boolean;
  onUpdated: (p: CommunityPost) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState<TagEntity[]>(post.tags ?? []);
  const [postType, setPostType] = useState<"post" | "announcement">(post.post_type);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(post.title);
      setBody(post.body);
      setTags(post.tags ?? []);
      setPostType(post.post_type);
      setError("");
    }
  }, [open, post]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and body are required"); return; }
    setSubmitting(true);
    try {
      const res = await communityApi.updatePost(communityId, post._id, { title, body, tags, post_type: postType });
      onUpdated(res.data);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
        <Dialog.Title>Edit Post</Dialog.Title>
        <Form.Root onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4 mt-4">
          <Form.Field name="title" className="space-y-2">
            <Form.Label className="text-sm font-medium">Title *</Form.Label>
            <Form.Control asChild>
              <TextField.Root value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Control>
          </Form.Field>
          <Form.Field name="body" className="space-y-2">
            <Form.Label className="text-sm font-medium">Body *</Form.Label>
            <MarkdownEditor value={body} onChange={(v) => setBody(v)} rows={8} />
          </Form.Field>
          <Form.Field name="tags" className="space-y-1">
            <Form.Label className="text-sm font-medium">Tags</Form.Label>
            <TagAutocomplete tags={tags} onTagAdd={(t) => setTags([...tags, t])} onTagRemove={(t) => setTags(tags.filter((x) => x.label !== t.label))} />
          </Form.Field>
          {isMod && (
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">Post type:</Text>
              <Button type="button" size="1" variant={postType === "post" ? "solid" : "soft"} onClick={() => setPostType("post")}>Post</Button>
              <Button type="button" size="1" variant={postType === "announcement" ? "solid" : "soft"} color="orange" onClick={() => setPostType("announcement")}>
                📢 Announcement
              </Button>
            </Flex>
          )}
          {error && <Text size="2" color="red">{error}</Text>}
          <Flex justify="end" gap="3">
            <Button type="button" variant="soft" color="gray" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

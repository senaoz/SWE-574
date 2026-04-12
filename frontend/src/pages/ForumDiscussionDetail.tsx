import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Button,
  TextArea,
  Heading,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import {
  ArrowLeftIcon,
  PaperPlaneIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { MessageCircleIcon } from "lucide-react";
import { forumApi, getImageUrl } from "@/services/api";
import { useUser } from "@/App";
import { ForumDiscussion, ForumComment, TagEntity } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";
import { UpvoteButton } from "@/components/ui/UpvoteButton";
import { MarkdownEditor } from "@/components/forms/MarkdownEditor";
import { TagAutocomplete } from "@/components/forms/TagAutocomplete";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  const { currentUserId } = useUser();
  const [discussion, setDiscussion] = useState<ForumDiscussion | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isOwner = !!currentUserId && discussion?.user_id === currentUserId;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [dRes, cRes] = await Promise.all([
          forumApi.getDiscussion(id),
          forumApi.getComments("discussion", id),
        ]);
        setDiscussion(dRes.data);
        setComments(cRes.data.comments);
      } catch {
        setDiscussion(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !id) return;
    setSubmitting(true);
    try {
      const res = await forumApi.createComment({
        target_type: "discussion",
        target_id: id,
        content: newComment.trim(),
      });
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await forumApi.deleteDiscussion(id);
    navigate("/forum?tab=discussions");
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
              <Heading size="5">{discussion.title}</Heading>
              <Flex gap="2" align="center">
                {isOwner && (
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
                      ? () =>
                          forumApi
                            .upvoteDiscussion(id!)
                            .then((r) => r.data)
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
            {discussion.tags && discussion.tags.length > 0 && (
              <Flex gap="2" className="mt-4" wrap="wrap">
                {discussion.tags.map((tag, i) => (
                  <ClickableTag key={i} tag={tag} size="1" />
                ))}
              </Flex>
            )}
          </div>
        </Flex>
      </Card>

      {/* Comments section */}
      <Flex align="center" gap="2" className="mb-4">
        <MessageCircleIcon className="w-5 h-5" />
        <Text size="4" weight="bold">
          Comments ({comments.length})
        </Text>
      </Flex>

      {/* New comment */}
      <div>
        <TextArea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="mb-2 p-3 rounded-lg"
          variant="soft"
          size="2"
        />
        <Flex justify="end">
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || submitting}
            size="2"
          >
            <PaperPlaneIcon className="w-4 h-4 mr-1" />
            {submitting ? "Posting..." : "Post"}
          </Button>
        </Flex>
      </div>

      {/* Comment list */}
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c._id} className="flex gap-3 pt-2">
            <Avatar
              size="2"
              src={getImageUrl(c.user?.profile_picture)}
              fallback={c.user?.full_name?.[0] || c.user?.username?.[0] || "?"}
            />
            <div className="flex-1">
              <Flex gap="2" align="center" className="mb-1">
                <Text size="2" weight="bold">
                  {c.user?.full_name || c.user?.username || "Unknown"}
                </Text>
                <Text size="1" color="gray">
                  {timeAgo(c.created_at)}
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
                  {c.content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-1">
              <UpvoteButton
                count={c.upvote_count ?? 0}
                upvoted={c.user_upvoted}
                onUpvote={
                  currentUserId
                    ? () => forumApi.upvoteComment(c._id).then((r) => r.data)
                    : undefined
                }
                disabled={!currentUserId}
              />
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <Text size="2" color="gray" className="text-center py-4">
            No comments yet. Be the first!
          </Text>
        )}
      </div>

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(discussion.title);
      setBody(discussion.body);
      setTags(discussion.tags ?? []);
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
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
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
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

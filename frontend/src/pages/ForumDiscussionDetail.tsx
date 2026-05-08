import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Badge,
  Button,
  TextArea,
  Heading,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  PaperPlaneIcon,
  Pencil1Icon,
  TrashIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { forumApi } from "@/services/api";
import { ForumDiscussion, ForumComment } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";
import ReactMarkdown from "react-markdown";
import { useUser } from "@/App";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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

  const handleEditStart = (c: ForumComment) => {
    setEditingId(c._id);
    setEditContent(c.content);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEditSave = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await forumApi.updateComment(commentId, {
        content: editContent.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data : c))
      );
      setEditingId(null);
      setEditContent("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await forumApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (e) {
      console.error(e);
    }
  };

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
            src={discussion.user?.profile_picture}
            fallback={
              discussion.user?.full_name?.[0] ||
              discussion.user?.username?.[0] ||
              "?"
            }
          />
          <div className="flex-1">
            <Heading size="5">{discussion.title}</Heading>
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
            <div className="prose prose-sm max-w-none leading-relaxed">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7c3aed" }}
                    />
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
      <Card className="p-4">
        <Flex align="center" gap="2" className="mb-4">
          <ChatBubbleIcon className="w-5 h-5" />
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
            className="mb-2"
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
        <div className="space-y-4">
          {comments.map((c) => {
            const isOwner = currentUserId === c.user_id;
            const isEditing = editingId === c._id;
            return (
              <div key={c._id} className="flex gap-3">
                <Avatar
                  size="2"
                  src={c.user?.profile_picture}
                  fallback={
                    c.user?.full_name?.[0] || c.user?.username?.[0] || "?"
                  }
                />
                <div className="flex-1">
                  <Flex gap="2" align="center" className="mb-1">
                    <Text size="2" weight="bold">
                      {c.user?.full_name || c.user?.username || "Unknown"}
                    </Text>
                    <Text size="1" color="gray">
                      {timeAgo(c.created_at)}
                    </Text>
                    {isOwner && !isEditing && (
                      <Flex gap="1" className="ml-auto">
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={() => handleEditStart(c)}
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDelete(c._id)}
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
                          onClick={() => handleEditSave(c._id)}
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
                    <div className="prose prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#7c3aed" }}
                            />
                          ),
                        }}
                      >
                        {c.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <Text size="2" color="gray" className="text-center py-4">
              No comments yet. Be the first!
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}

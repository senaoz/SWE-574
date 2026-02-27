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
} from "@radix-ui/react-icons";
import { forumApi } from "@/services/api";
import { ForumDiscussion, ForumComment } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";
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
  const [discussion, setDiscussion] = useState<ForumDiscussion | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
          {comments.map((c) => (
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
                    {c.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
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

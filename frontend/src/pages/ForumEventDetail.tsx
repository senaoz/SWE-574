import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  CalendarIcon,
  GlobeIcon,
  PaperPlaneIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import { forumApi } from "@/services/api";
import { ForumEvent, ForumComment } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";

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

export function ForumEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ForumEvent | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [eRes, cRes] = await Promise.all([
          forumApi.getEvent(id),
          forumApi.getComments("event", id),
        ]);
        setEvent(eRes.data);
        setComments(cRes.data.comments);
      } catch {
        setEvent(null);
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
        target_type: "event",
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

  if (!event) {
    return (
      <div>
        <Text color="red">Event not found.</Text>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/forum?tab=events")}
      >
        <ArrowLeftIcon /> Back to Forum
      </Button>

      {/* Event content */}
      <Card className="p-6 mb-6">
        <Flex gap="3" align="start">
          <Avatar
            size="4"
            src={event.user?.profile_picture}
            fallback={
              event.user?.full_name?.[0] || event.user?.username?.[0] || "?"
            }
          />
          <div className="flex-1">
            <Heading size="5">{event.title}</Heading>
            <Flex gap="2" align="center" className="mt-1 mb-4" wrap="wrap">
              <Text size="2" color="gray">
                by {event.user?.full_name || event.user?.username || "Unknown"}
              </Text>
              <Text size="1" color="gray">
                {timeAgo(event.created_at)}
              </Text>
            </Flex>

            {/* Event meta */}
            <Flex gap="3" className="mb-4" wrap="wrap">
              <Badge size="2" variant="soft" color="purple">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {new Date(event.event_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
              {event.is_remote ? (
                <Badge size="2" variant="soft" color="blue">
                  <GlobeIcon className="w-3 h-3 mr-1" /> Remote / Online
                </Badge>
              ) : event.location ? (
                <Badge size="2" variant="soft" color="gray">
                  {event.location}
                </Badge>
              ) : null}
            </Flex>

            <Text size="3" className="whitespace-pre-wrap leading-relaxed mb-4">
              {event.description}
            </Text>

            {/* Linked service */}
            {event.service && (
              <Card className="p-3 mb-4">
                <Flex align="center" gap="2">
                  <Link2Icon />
                  <Text size="2" weight="medium">
                    Linked {event.service.service_type}:
                  </Text>
                  <Link
                    to={`/service/${event.service.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    <Text size="2">{event.service.title}</Text>
                  </Link>
                </Flex>
              </Card>
            )}

            {event.tags && event.tags.length > 0 && (
              <Flex gap="2" wrap="wrap">
                {event.tags.map((tag, i) => (
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
        <div className="mb-6">
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
                <Text size="2" className="leading-relaxed">
                  {c.content}
                </Text>
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

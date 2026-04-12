import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  Flex,
  Heading,
  Tabs,
  Text,
  TextField,
  Badge,
  Avatar,
  Dialog,
  Box,
  Grid,
  Switch,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  GlobeIcon,
  Cross2Icon,
  PersonIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { UpvoteButton } from "@/components/ui/UpvoteButton";
import { MessageCircleIcon, CalendarClockIcon } from "lucide-react";
import { forumApi, getImageUrl } from "@/services/api";
import { ForumDiscussion, ForumEvent, TagEntity } from "@/types";
import { TagAutocomplete } from "@/components/forms/TagAutocomplete";
import { ClickableTag } from "@/components/ui/ClickableTag";
import { MarkdownEditor } from "@/components/forms/MarkdownEditor";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
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
export function Forum() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "discussions";
  const [tab, setTab] = useState(initialTab);
  const [searchQ, setSearchQ] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [discussions, setDiscussions] = useState<ForumDiscussion[]>([]);
  const [discussionsTotal, setDiscussionsTotal] = useState(0);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [discussionSort, setDiscussionSort] = useState<"created_at" | "upvote_count">("created_at");
  const [eventSort, setEventSort] = useState<"event_at" | "upvote_count" | "created_at">("event_at");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  useEffect(() => {
    setSearchParams((p) => {
      p.set("tab", tab);
      return p;
    });
  }, [tab]);
  useEffect(() => {
    (async () => {
      setDiscussionsLoading(true);
      try {
        const res = await forumApi.getDiscussions({
          q: searchQ || undefined,
          tag: tagFilter || undefined,
          sort_by: discussionSort,
        });
        setDiscussions(res.data.discussions);
        setDiscussionsTotal(res.data.total);
      } catch {
        setDiscussions([]);
      } finally {
        setDiscussionsLoading(false);
      }
    })();
  }, [searchQ, tagFilter, discussionSort]);
  useEffect(() => {
    (async () => {
      setEventsLoading(true);
      try {
        const res = await forumApi.getEvents({
          q: searchQ || undefined,
          tag: tagFilter || undefined,
          sort_by: eventSort,
        });
        setEvents(res.data.events);
        setEventsTotal(res.data.total);
      } catch {
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [searchQ, tagFilter, eventSort]);
  const refresh = () => {
    setSearchQ((q) => q);
    setTagFilter((t) => t);
    forumApi
      .getDiscussions({ q: searchQ || undefined, tag: tagFilter || undefined })
      .then((r) => {
        setDiscussions(r.data.discussions);
        setDiscussionsTotal(r.data.total);
      });
    forumApi
      .getEvents({ q: searchQ || undefined, tag: tagFilter || undefined, sort_by: eventSort })
      .then((r) => {
        setEvents(r.data.events);
        setEventsTotal(r.data.total);
      });
  };
  return (
    <div>
      <Flex justify="between" align="center" className="mb-6">
        <div>
          <Heading size="7">Community Forum</Heading>
          <Text size="3" color="gray">
            Share ideas, discuss topics, and discover community events
          </Text>
        </div>
      </Flex>
      <Flex gap="3" className="mb-6" wrap="wrap">
        <TextField.Root
          placeholder="Search discussions & events..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="flex-1 min-w-[200px]"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon />
          </TextField.Slot>
        </TextField.Root>
        {tagFilter && (
          <Badge
            size="2"
            variant="soft"
            className="cursor-pointer"
            onClick={() => setTagFilter("")}
          >
            Tag: {tagFilter} <Cross2Icon className="ml-1 w-3 h-3" />
          </Badge>
        )}
      </Flex>
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="discussions">
            <MessageCircleIcon className="mr-1 w-4 h-4" /> Discussions (
            {discussionsTotal})
          </Tabs.Trigger>
          <Tabs.Trigger value="events">
            <CalendarClockIcon className="mr-1 w-4 h-4" /> Events ({eventsTotal})
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="discussions" className="pt-4">
          <Flex justify="between" align="center" className="mb-4">
            <Flex gap="2" align="center">
              <Text size="2" color="gray">Sort:</Text>
              <Button
                size="1"
                variant={discussionSort === "created_at" ? "solid" : "soft"}
                onClick={() => setDiscussionSort("created_at")}
              >
                Latest
              </Button>
              <Button
                size="1"
                variant={discussionSort === "upvote_count" ? "solid" : "soft"}
                onClick={() => setDiscussionSort("upvote_count")}
              >
                <ChevronUpIcon /> Most Upvoted
              </Button>
            </Flex>
            <Button onClick={() => setShowNewDiscussion(true)}>
              <PlusIcon /> New Discussion
            </Button>
          </Flex>
          {discussionsLoading ? (
            <Card className="p-8 text-center">
              <Text color="gray">Loading...</Text>
            </Card>
          ) : discussions.length === 0 ? (
            <Card className="p-8 text-center">
              <Text color="gray">No discussions yet. Start one!</Text>
            </Card>
          ) : (
            <div className="space-y-3">
              {discussions.map((d) => (
                <Card
                  key={d._id}
                  className="hover-card"
                  size="3"
                  onClick={() => navigate(`/forum/discussions/${d._id}`)}
                >
                  <Flex gap="3" align="start">
                    <Avatar
                      size="3"
                      src={getImageUrl(d.user?.profile_picture)}
                      fallback={
                        d.user?.full_name?.[0] || d.user?.username?.[0] || "?"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <Flex justify="between" align="start">
                        <Text size="3" weight="bold" className="line-clamp-1">
                          {d.title}
                        </Text>
                        <Text
                          size="1"
                          color="gray"
                          className="whitespace-nowrap ml-2"
                        >
                          {timeAgo(d.created_at)}
                        </Text>
                      </Flex>
                      <div className="mt-1 prose-content card-description">
	                        <ReactMarkdown
	                          components={{
	                            a: ({ node: _node, ...props }) => (
	                              <a
	                                {...props}
	                                target="_blank"
	                                rel="noopener noreferrer"
	                              >
	                                {props.children}
	                              </a>
	                            ),
	                          }}
	                        >
	                          {d.body}
	                        </ReactMarkdown>
                      </div>
                      <Flex gap="2" align="center" className="mt-2" wrap="wrap">
                        <Text size="1" color="gray">
                          by{" "}
                          {d.user?.full_name || d.user?.username || "Unknown"}
                        </Text>
                        <Badge size="1" variant="soft" color="gray">
                          <MessageCircleIcon className="w-3 h-3 mr-1" />
                          {d.comment_count}
                        </Badge>
                        <UpvoteButton count={d.upvote_count ?? 0} upvoted={d.user_upvoted} />
                        {(d.tags || []).slice(0, 3).map((tag, i) => (
                          <ClickableTag
                            key={i}
                            tag={tag}
                            size="1"
                            stopPropagation
                          />
                        ))}
                      </Flex>
                    </div>
                  </Flex>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Content>
        <Tabs.Content value="events" className="pt-4">
          <Flex justify="between" align="center" className="mb-4">
            <Flex gap="2" align="center">
              <Text size="2" color="gray">Sort:</Text>
              <Button
                size="1"
                variant={eventSort === "event_at" ? "solid" : "soft"}
                onClick={() => setEventSort("event_at")}
              >
                <CalendarClockIcon className="w-3 h-3" /> Event Date
              </Button>
              <Button
                size="1"
                variant={eventSort === "upvote_count" ? "solid" : "soft"}
                onClick={() => setEventSort("upvote_count")}
              >
                <ChevronUpIcon /> Most Upvoted
              </Button>
              <Button
                size="1"
                variant={eventSort === "created_at" ? "solid" : "soft"}
                onClick={() => setEventSort("created_at")}
              >
                Latest
              </Button>
            </Flex>
            <Button onClick={() => setShowNewEvent(true)}>
              <PlusIcon /> New Event
            </Button>
          </Flex>
          {eventsLoading ? (
            <Card className="p-8 text-center">
              <Text color="gray">Loading...</Text>
            </Card>
          ) : events.length === 0 ? (
            <Card className="p-8 text-center">
              <Text color="gray">No events yet. Create one!</Text>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <Card
                  key={ev._id}
                  className="hover-card"
                  size="3"
                  onClick={() => navigate(`/forum/events/${ev._id}`)}
                >
                  <Flex justify="between" align="start" wrap="wrap">
                    <Text size="3" weight="bold" className="line-clamp-1">
                      {ev.title}
                    </Text>
                    <Flex gap="2" align="center">
                      <Badge size="1" variant="soft" color="purple">
                        <CalendarClockIcon className="w-3 h-3" />
                        {new Date(ev.event_at).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </Flex>
                  </Flex>
                  <div className="prose-content card-description">
	                    <ReactMarkdown
	                      components={{
	                        a: ({ node: _node, ...props }) => (
	                          <a
	                            {...props}
	                            target="_blank"
	                            rel="noopener noreferrer"
	                          >
	                            {props.children}
	                          </a>
	                        ),
	                      }}
	                    >
	                      {ev.description}
                    </ReactMarkdown>
                  </div>
                  <Flex gap="2" align="center" className="mt-2" wrap="wrap">
                    <Text size="1" color="gray">
                      by {ev.user?.full_name || ev.user?.username || "Unknown"}
                    </Text>
                    {ev.is_remote ? (
                      <Badge size="1" variant="soft" color="blue">
                        <GlobeIcon className="w-3 h-3" /> Remote
                      </Badge>
                    ) : ev.location ? (
                      <Badge size="1" variant="soft" color="gray">
                        {ev.location}
                      </Badge>
                    ) : null}
                    {ev.service && (
                      <Badge size="1" variant="soft" color="green">
                        Linked: {ev.service.title}
                      </Badge>
                    )}
                    {ev.attendee_count > 0 && (
                      <Badge size="1" variant="soft" color="purple">
                        <PersonIcon className="w-3 h-3 mr-1" />
                        {ev.attendee_count} attending
                      </Badge>
                    )}
                    <Badge size="1" variant="soft" color="gray">
                      <MessageCircleIcon className="w-3 h-3 mr-1" />
                      {ev.comment_count}
                    </Badge>
                    <UpvoteButton count={ev.upvote_count ?? 0} upvoted={ev.user_upvoted} />
                    {(ev.tags || []).slice(0, 3).map((tag, i) => (
                      <ClickableTag
                        key={i}
                        tag={tag}
                        size="1"
                        stopPropagation
                      />
                    ))}
                  </Flex>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
      <NewDiscussionDialog
        open={showNewDiscussion}
        onOpenChange={setShowNewDiscussion}
        onCreated={refresh}
      />
      <NewEventDialog
        open={showNewEvent}
        onOpenChange={setShowNewEvent}
        onCreated={refresh}
      />
    </div>
  );
}
function NewDiscussionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const reset = () => {
    setTitle("");
    setBody("");
    setTags([]);
    setError("");
  };
  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSubmitting(true);
    try {
      await forumApi.createDiscussion({ title, body, tags });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create discussion");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
        <Dialog.Title>New Discussion</Dialog.Title>
        <Form.Root
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
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
                className={error ? "border-red-500" : ""}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field name="body" className="space-y-2">
            <Form.Label className="text-sm font-medium">Body *</Form.Label>
            <MarkdownEditor
              placeholder="Write your discussion... You can use **bold** and *italic*."
              value={body}
              onChange={(value) => setBody(value)}
              error={!!error}
              rows={6}
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
                {submitting ? "Creating..." : "Create Discussion"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
function NewEventDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [locationValue, setLocationValue] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  }>({
    latitude: 0,
    longitude: 0,
    address: "",
  });
  const [isRemote, setIsRemote] = useState(false);
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [serviceId, setServiceId] = useState("__none__");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const reset = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocationValue({ latitude: 0, longitude: 0, address: "" });
    setIsRemote(false);
    setTags([]);
    setServiceId("__none__");
    setError("");
  };
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !eventDate || !eventTime) {
      setError("Title, description, date, and time are required");
      return;
    }
    const eventAt = new Date(`${eventDate}T${eventTime}`).toISOString();
    setSubmitting(true);
    try {
      await forumApi.createEvent({
        title,
        description,
        event_at: eventAt,
        location: isRemote ? undefined : locationValue.address || undefined,
        latitude:
          isRemote || locationValue.latitude === 0
            ? undefined
            : locationValue.latitude,
        longitude:
          isRemote || locationValue.longitude === 0
            ? undefined
            : locationValue.longitude,
        is_remote: isRemote,
        tags,
        service_id:
          serviceId && serviceId !== "__none__" ? serviceId : undefined,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
        <Dialog.Title>New Event</Dialog.Title>
        <Form.Root
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 mt-4"
        >
          <Form.Field name="title" className="space-y-2">
            <Form.Label className="text-sm font-medium">
              Event title *
            </Form.Label>
            <Form.Control asChild>
              <TextField.Root
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={error ? "border-red-500" : ""}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field name="description" className="space-y-2">
            <Form.Label className="text-sm font-medium">
              Description *
            </Form.Label>
            <MarkdownEditor
              placeholder="Describe the event... You can use **bold** and *italic*."
              value={description}
              onChange={(value) => setDescription(value)}
              error={!!error}
              rows={6}
            />
          </Form.Field>
          <Box>
            <Text size="2" weight="medium" className="mb-2 block">
              Date & Time *
            </Text>
            <Grid columns="2" gap="3">
              <Form.Field name="event_date" className="space-y-2">
                <Form.Control asChild>
                  <TextField.Root
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                </Form.Control>
              </Form.Field>
              <Form.Field name="event_time" className="space-y-2">
                <Form.Control asChild>
                  <TextField.Root
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                </Form.Control>
              </Form.Field>
            </Grid>
          </Box>
          <Box>
            <Flex gap="2" align="center">
              <Switch checked={isRemote} onCheckedChange={setIsRemote} />
              <Text size="2" className="font-medium">
                Remote / Online event
              </Text>
            </Flex>
          </Box>
          {!isRemote && (
            <Box className="mb-4">
              <Text size="2" weight="medium" className="mb-2 block">
                Location
              </Text>
              <MapLocationPicker
                value={locationValue}
                onChange={setLocationValue}
                markerColor="#7c3aed"
                height={200}
              />
            </Box>
          )}
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
                {submitting ? "Creating..." : "Create Event"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

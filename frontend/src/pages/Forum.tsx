import { useCallback, useState, useEffect, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  Flex,
  Heading,
  Inset,
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
import { MessageCircleIcon, CalendarClockIcon, PinIcon } from "lucide-react";
import { forumApi, getImageUrl, uploadApi, communityApi } from "@/services/api";
import { ForumDiscussion, ForumEvent, TagEntity, Community } from "@/types";
import { useUser } from "@/App";
import { UsersIcon } from "lucide-react";
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
  const [discussionSort, setDiscussionSort] = useState<
    "created_at" | "upvote_count"
  >("created_at");
  const [eventSort, setEventSort] = useState<
    "event_at" | "upvote_count" | "created_at"
  >("event_at");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesTotal, setCommunitiesTotal] = useState(0);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitySort, setCommunitySort] = useState<
    "member_count" | "created_at" | "post_count"
  >("member_count");
  const [communityMyOnly, setCommunityMyOnly] = useState(false);
  const { currentUserId, user: currentUser } = useUser();
  const canPinPlatform =
    currentUser?.role === "admin" || currentUser?.role === "moderator";

  const loadDiscussions = useCallback(async () => {
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
  }, [searchQ, tagFilter, discussionSort]);

  const loadEvents = useCallback(async () => {
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
  }, [searchQ, tagFilter, eventSort]);

  const loadCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    try {
      const res = await communityApi.getCommunities({
        q: searchQ || undefined,
        tag: tagFilter || undefined,
        sort_by: communitySort,
        my_only: communityMyOnly || undefined,
      });
      setCommunities(res.data.communities);
      setCommunitiesTotal(res.data.total);
    } catch {
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  }, [searchQ, tagFilter, communitySort, communityMyOnly]);

  useEffect(() => {
    setSearchParams((p) => {
      p.set("tab", tab);
      return p;
    });
  }, [tab]);
  useEffect(() => {
    void loadDiscussions();
  }, [loadDiscussions]);
  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);
  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const refresh = () => {
    void loadDiscussions();
    void loadEvents();
    void loadCommunities();
  };

  const handlePinDiscussion = async (
    e: MouseEvent,
    discussion: ForumDiscussion,
  ) => {
    e.stopPropagation();
    await forumApi.pinDiscussion(discussion._id, !discussion.is_pinned);
    await loadDiscussions();
  };

  const handlePinEvent = async (e: MouseEvent, event: ForumEvent) => {
    e.stopPropagation();
    await forumApi.pinEvent(event._id, !event.is_pinned);
    await loadEvents();
  };

  const handlePinCommunity = async (e: MouseEvent, community: Community) => {
    e.stopPropagation();
    await communityApi.pinCommunity(community._id, !community.is_pinned);
    await loadCommunities();
  };
  return (
    <div>
      <Flex direction="column" justify="between" align="center" className="m-12">
        <Heading size="8" className={"max-w-lg"} align="center">
          The 🤾‍♂️ people platform.<br />
          Where 🏈 interests<br />
          become 🎻 friendships.
        </Heading>
        <Text size="3" color="gray" className={"max-w-3xl mt-6 mb-3"} align="center">
          Whatever your interest, from hiking and reading to networking and skill sharing, there are thousands of people who share it on Hive. Events are happening every day—sign up to join the fun.
        </Text>
        <Button onClick={() => setTab('communities')}>
          See Communities
        </Button>
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
          <Tabs.Trigger value="communities">
            <UsersIcon className="mr-1 w-4 h-4" /> Communities (
            {communitiesTotal})
          </Tabs.Trigger>
          <Tabs.Trigger value="discussions">
            <MessageCircleIcon className="mr-1 w-4 h-4" /> Discussions (
            {discussionsTotal})
          </Tabs.Trigger>
          <Tabs.Trigger value="events">
            <CalendarClockIcon className="mr-1 w-4 h-4" /> Events ({eventsTotal}
            )
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="discussions" className="pt-4">
          <Flex justify="between" align="center" className="mb-4">
            <Flex gap="2" align="center">
              <Text size="2" color="gray">
                Sort:
              </Text>
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
            <div className="grid gap-4">
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
                      <Flex justify="between" align="start" gap="2">
                        <Flex gap="2" align="center" className="min-w-0" wrap="wrap">
                          {d.is_pinned && (
                            <Badge size="1" variant="soft" color="violet">
                              <PinIcon className="w-3 h-3 mr-1" /> Pinned by moderator
                            </Badge>
                          )}
                          <Text size="3" weight="bold" className="line-clamp-1">
                            {d.title}
                          </Text>
                        </Flex>
                        <Flex gap="2" align="center" className="shrink-0">
                          {canPinPlatform && (
                            <Button
                              size="1"
                              variant="soft"
                              color={d.is_pinned ? "gray" : "violet"}
                              onClick={(e) => void handlePinDiscussion(e, d)}
                            >
                              <PinIcon className="w-3 h-3" />
                              {d.is_pinned ? "Unpin" : "Pin"}
                            </Button>
                          )}
                          <Text size="1" color="gray" className="whitespace-nowrap">
                            {timeAgo(d.created_at)}
                          </Text>
                        </Flex>
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
                        <UpvoteButton
                          count={d.upvote_count ?? 0}
                          upvoted={d.user_upvoted}
                        />
                        {(d.tags || []).slice(0, 3).map((tag, i) => (
                          <ClickableTag
                            key={i}
                            tag={tag}
                            size="1"
                            stopPropagation
                          />
                        ))}
                        {d.community_id &&
                          communities.find((c) => c._id === d.community_id) && (
                            <Badge
                              color="violet"
                              variant="soft"
                              size="1"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/forum/communities/${d.community_id}`,
                                );
                              }}
                            >
                              {
                                communities.find(
                                  (c) => c._id === d.community_id,
                                )?.name
                              }
                            </Badge>
                          )}
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
              <Text size="2" color="gray">
                Sort:
              </Text>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <Card
                  key={ev._id}
                  className="hover-card"
                  size="3"
                  onClick={() => navigate(`/forum/events/${ev._id}`)}
                >
                  {(ev.banner_image_url || (ev.image_urls && ev.image_urls.length > 0)) && (
                    <Inset clip="padding-box" side="top" pb="current">
                      <img
                        src={
                          ev.banner_image_url
                            ? (getImageUrl(ev.banner_image_url) ?? ev.banner_image_url)
                            : (getImageUrl(ev.image_urls![0]) ?? ev.image_urls![0])
                        }
                        alt={ev.title}
                        loading="lazy"
                        style={{
                          display: "block",
                          objectFit: "cover",
                          width: "100%",
                          height: 160,
                          backgroundColor: "var(--gray-5)",
                        }}
                      />
                    </Inset>
                  )}
                  <Flex justify="between" align="start" wrap="wrap" gap="2">
                    <Flex gap="2" align="center" className="min-w-0" wrap="wrap">
                      {ev.is_pinned && (
                        <Badge size="1" variant="soft" color="violet">
                          <PinIcon className="w-3 h-3 mr-1" /> Pinned by moderator
                        </Badge>
                      )}
                      <Text size="3" weight="bold" className="line-clamp-1">
                        {ev.title}
                      </Text>
                    </Flex>
                    <Flex gap="2" align="center">
                      {canPinPlatform && (
                        <Button
                          size="1"
                          variant="soft"
                          color={ev.is_pinned ? "gray" : "violet"}
                          onClick={(e) => void handlePinEvent(e, ev)}
                        >
                          <PinIcon className="w-3 h-3" />
                          {ev.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                      )}
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
                    <UpvoteButton
                      count={ev.upvote_count ?? 0}
                      upvoted={ev.user_upvoted}
                    />
                    {(ev.tags || []).slice(0, 3).map((tag, i) => (
                      <ClickableTag
                        key={i}
                        tag={tag}
                        size="1"
                        stopPropagation
                      />
                    ))}
                    {ev.community_id &&
                      communities.find((c) => c._id === ev.community_id) && (
                        <Badge
                          color="violet"
                          variant="soft"
                          size="1"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/forum/communities/${ev.community_id}`);
                          }}
                        >
                          {
                            communities.find((c) => c._id === ev.community_id)
                              ?.name
                          }
                        </Badge>
                      )}
                  </Flex>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Content>
        <Tabs.Content value="communities" className="pt-4">
          <Flex justify="between" align="center" className="mb-4">
            <Flex gap="2" align="center" wrap="wrap">
              <Text size="2" color="gray">
                Sort:
              </Text>
              <Button
                size="1"
                variant={communitySort === "member_count" ? "solid" : "soft"}
                onClick={() => setCommunitySort("member_count")}
              >
                <UsersIcon className="w-3 h-3" /> Members
              </Button>
              <Button
                size="1"
                variant={communitySort === "post_count" ? "solid" : "soft"}
                onClick={() => setCommunitySort("post_count")}
              >
                Posts
              </Button>
              <Button
                size="1"
                variant={communitySort === "created_at" ? "solid" : "soft"}
                onClick={() => setCommunitySort("created_at")}
              >
                Latest
              </Button>
              {currentUserId && (
                <Button
                  size="1"
                  variant={communityMyOnly ? "solid" : "soft"}
                  color="violet"
                  onClick={() => setCommunityMyOnly(!communityMyOnly)}
                >
                  My Communities
                </Button>
              )}
            </Flex>
            {currentUserId && (
              <Button onClick={() => setShowNewCommunity(true)}>
                <PlusIcon /> New Community
              </Button>
            )}
          </Flex>
          {communitiesLoading ? (
            <Card className="p-8 text-center">
              <Text color="gray">Loading...</Text>
            </Card>
          ) : communities.length === 0 ? (
            <Card className="p-8 text-center">
              <Text color="gray">
                No communities yet. Create the first one!
              </Text>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {communities.map((c) => (
                <Card
                  key={c._id}
                  className="hover-card cursor-pointer"
                  size="3"
                  onClick={() => navigate(`/forum/communities/${c._id}`)}
                >
                  {c.cover_image_url && (
                    <Inset clip="padding-box" side="top" pb="current">
                      <img
                        src={getImageUrl(c.cover_image_url) ?? c.cover_image_url}
                        alt={c.name}
                        loading="lazy"
                        style={{
                          display: "block",
                          objectFit: "cover",
                          width: "100%",
                          height: 140,
                          backgroundColor: "var(--gray-5)",
                        }}
                      />
                    </Inset>
                  )}
                  <div>
                    <Flex justify="between" align="start" wrap="wrap" gap="2">
                      <div>
                        <Flex gap="2" align="center" wrap="wrap">
                          {c.is_pinned && (
                            <Badge size="1" variant="soft" color="violet">
                              <PinIcon className="w-3 h-3 mr-1" /> Pinned by moderator
                            </Badge>
                          )}
                          <Text size="3" weight="bold">
                            {c.name}
                          </Text>
                        </Flex>
                        {c.user_membership && (
                          <Badge
                            size="1"
                            variant="soft"
                            color="violet"
                            className="ml-2"
                          >
                            {c.user_membership === "founder"
                              ? "Founder"
                              : c.user_membership === "moderator"
                                ? "Mod"
                                : "Member"}
                          </Badge>
                        )}
                      </div>
                      <Flex gap="2" align="center">
                        {canPinPlatform && (
                          <Button
                            size="1"
                            variant="soft"
                            color={c.is_pinned ? "gray" : "violet"}
                            onClick={(e) => void handlePinCommunity(e, c)}
                          >
                            <PinIcon className="w-3 h-3" />
                            {c.is_pinned ? "Unpin" : "Pin"}
                          </Button>
                        )}
                        <Badge size="1" variant="soft" color="gray">
                          <UsersIcon className="w-3 h-3 mr-1" />
                          {c.member_count} members
                        </Badge>
                        <Badge size="1" variant="soft" color="gray">
                          <MessageCircleIcon className="w-3 h-3 mr-1" />
                          {c.post_count} posts
                        </Badge>
                      </Flex>
                    </Flex>
                    <Text size="2" color="gray" className="mt-1 line-clamp-2">
                      {c.description}
                    </Text>
                    <Flex gap="2" align="center" className="mt-2" wrap="wrap">
                      <Text size="1" color="gray">
                        by{" "}
                        {c.founder?.full_name ||
                          c.founder?.username ||
                          "Unknown"}
                      </Text>
                      <Text size="1" color="gray">
                        · {timeAgo(c.created_at)}
                      </Text>
                      {(c.tags || []).slice(0, 3).map((tag, i) => (
                        <ClickableTag
                          key={i}
                          tag={tag}
                          size="1"
                          stopPropagation
                        />
                      ))}
                    </Flex>
                  </div>
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
        communities={communities}
      />
      <NewEventDialog
        open={showNewEvent}
        onOpenChange={setShowNewEvent}
        onCreated={refresh}
        communities={communities}
      />
      <NewCommunityDialog
        open={showNewCommunity}
        onOpenChange={setShowNewCommunity}
        onCreated={(c) => {
          navigate(`/forum/communities/${c._id}`);
        }}
      />
    </div>
  );
}
function NewDiscussionDialog({
  open,
  onOpenChange,
  onCreated,
  communities,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  communities: Community[];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [discussionCommunityId, setDiscussionCommunityId] =
    useState<string>("");
  const [discussionImageUrls, setDiscussionImageUrls] = useState<string[]>([]);
  const [discussionImageUploading, setDiscussionImageUploading] =
    useState(false);
  const reset = () => {
    setTitle("");
    setBody("");
    setTags([]);
    setError("");
    setDiscussionCommunityId("");
    setDiscussionImageUrls([]);
    setDiscussionImageUploading(false);
  };
  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    setSubmitting(true);
    try {
      await forumApi.createDiscussion({
        title,
        body,
        tags,
        community_id: discussionCommunityId || undefined,
        image_urls:
          discussionImageUrls.length > 0 ? discussionImageUrls : undefined,
      });
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
      <Dialog.Content className="max-w-4xl" aria-describedby={undefined}>
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
          <Box className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Discussion image (optional)
            </Text>
            {discussionImageUrls.length === 0 && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={discussionImageUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setDiscussionImageUploading(true);
                    try {
                      const res = await uploadApi.uploadDiscussionImage(file);
                      setDiscussionImageUrls([res.data.url]);
                    } catch {
                      // ignore upload errors
                    } finally {
                      setDiscussionImageUploading(false);
                    }
                  }}
                />
                <span className="flex items-center justify-center gap-2 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm w-full">
                  <PlusIcon className="w-4 h-4" />
                  {discussionImageUploading ? "Uploading..." : "Add image"}
                </span>
              </label>
            )}
            {discussionImageUrls.length > 0 && (
              <Flex gap="2" wrap="wrap" className="border rounded-lg p-2">
                <Box className="relative">
                  <img
                    src={
                      getImageUrl(discussionImageUrls[0]) ??
                      discussionImageUrls[0]
                    }
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    onClick={() => setDiscussionImageUrls([])}
                  >
                    x
                  </button>
                </Box>
              </Flex>
            )}
          </Box>
          {communities.length > 0 && (
            <Form.Field name="discussion-community" className="space-y-1">
              <Form.Label className="text-sm font-medium">
                Related Community (optional)
              </Form.Label>
              <Box mt="1">
                <select
                  value={discussionCommunityId}
                  onChange={(e) => setDiscussionCommunityId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--gray-6)",
                    fontSize: 13,
                  }}
                >
                  <option value="">No Community</option>
                  {communities.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Box>
            </Form.Field>
          )}
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
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Form.Submit asChild>
              <Button
                type="submit"
                disabled={submitting || discussionImageUploading}
              >
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
  communities,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  communities: Community[];
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("");
  const [eventCommunityId, setEventCommunityId] = useState<string>("");
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
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviewUrls([]);
    if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
    setBannerFile(null);
    setBannerPreviewUrl("");
    setEventCommunityId("");
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageFiles.length >= 3) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setError("");
    setImageFiles((prev) => [...prev, file]);
    setImagePreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    e.target.value = "";
  };
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !eventDate || !eventTime) {
      setError("Title, description, date, and time are required");
      return;
    }
    if (!bannerFile) {
      setError("Please upload a banner image for the event");
      return;
    }
    const eventAt = new Date(`${eventDate}T${eventTime}`).toISOString();
    setSubmitting(true);
    // Upload banner
    let uploadedBannerUrl: string | undefined;
    try {
      setImageUploading(true);
      const bannerRes = await uploadApi.uploadForumEventImage(bannerFile);
      uploadedBannerUrl = bannerRes.data.url;
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Banner upload failed");
      setImageUploading(false);
      setSubmitting(false);
      return;
    }
    // Upload gallery images
    const uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          const res = await uploadApi.uploadForumEventImage(file);
          uploadedUrls.push(res.data.url);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Image upload failed");
        setImageUploading(false);
        setSubmitting(false);
        return;
      }
    }
    setImageUploading(false);
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
        banner_image_url: uploadedBannerUrl,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        community_id: eventCommunityId || undefined,
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
      <Dialog.Content className="max-w-4xl" aria-describedby={undefined}>
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
          {/* Banner image upload */}
          <Box className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Banner image *
            </Text>
            {!bannerFile ? (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setError("Banner must be under 5 MB");
                      return;
                    }
                    setError("");
                    if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
                    setBannerFile(file);
                    setBannerPreviewUrl(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />
                <span className="flex items-center justify-center gap-2 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm w-full">
                  <PlusIcon className="w-4 h-4" />
                  Add banner image
                </span>
              </label>
            ) : (
              <Box className="relative">
                <img
                  src={bannerPreviewUrl}
                  alt="Banner preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  onClick={() => {
                    URL.revokeObjectURL(bannerPreviewUrl);
                    setBannerFile(null);
                    setBannerPreviewUrl("");
                  }}
                >
                  x
                </button>
              </Box>
            )}
          </Box>
          {/* Gallery images upload */}
          <Box className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Gallery images (optional, max 3)
            </Text>
            {imageFiles.length < 3 && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={imageUploading}
                  onChange={handleImageChange}
                />
                <span className="flex items-center justify-center gap-2 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm w-full">
                  <PlusIcon className="w-4 h-4" />
                  Add image (max 3)
                </span>
              </label>
            )}
            {imagePreviewUrls.length > 0 && (
              <Flex gap="2" wrap="wrap" className="border rounded-lg p-2">
                {imagePreviewUrls.map((url, i) => (
                  <Box key={i} className="relative">
                    <img
                      src={url}
                      alt={"Preview " + String(i + 1)}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      onClick={() => {
                        URL.revokeObjectURL(url);
                        setImageFiles((prev) => prev.filter((_, j) => j !== i));
                        setImagePreviewUrls((prev) =>
                          prev.filter((_, j) => j !== i),
                        );
                      }}
                    >
                      x
                    </button>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
          {communities.length > 0 && (
            <Form.Field name="event-community" className="space-y-1">
              <Form.Label className="text-sm font-medium">
                Related Community (optional)
              </Form.Label>
              <Box mt="1">
                <select
                  value={eventCommunityId}
                  onChange={(e) => setEventCommunityId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--gray-6)",
                    fontSize: 13,
                  }}
                >
                  <option value="">No Community</option>
                  {communities.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Box>
            </Form.Field>
          )}
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
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={submitting || imageUploading}>
                {imageUploading
                  ? "Uploading..."
                  : submitting
                    ? "Creating..."
                    : "Create Event"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
function NewCommunityDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (community: import("@/types").Community) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setRules([]);
    setNewRule("");
    setTags([]);
    setError("");
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreviewUrl(null);
    setCoverPreviewUrl(null);
  };

  const handleAddRule = () => {
    const r = newRule.trim();
    if (r && rules.length < 10) {
      setRules([...rules, r]);
      setNewRule("");
    }
  };

  const handleCommunityImageChange = (
    file: File | undefined,
    type: "avatar" | "cover",
  ) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setError("");
    if (type === "avatar") {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarFile(file);
      setAvatarPreviewUrl(previewUrl);
    } else {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
      setCoverFile(file);
      setCoverPreviewUrl(previewUrl);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }
    if (!avatarFile || !coverFile) {
      setError("Community photo and banner image are required");
      return;
    }
    setSubmitting(true);
    try {
      const [avatarRes, coverRes] = await Promise.all([
        uploadApi.uploadCommunityImage(avatarFile),
        uploadApi.uploadCommunityImage(coverFile),
      ]);
      const res = await communityApi.createCommunity({
        name,
        description,
        rules,
        tags,
        avatar_url: avatarRes.data.url,
        cover_image_url: coverRes.data.url,
      });
      reset();
      onOpenChange(false);
      onCreated(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create community");
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
      <Dialog.Content className="max-w-4xl" aria-describedby={undefined}>
        <Dialog.Title>Create New Community</Dialog.Title>
        <Form.Root
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-4 mt-4"
        >
          <Form.Field name="name" className="space-y-2">
            <Form.Label className="text-sm font-medium">
              Community Name *
            </Form.Label>
            <Form.Control asChild>
              <TextField.Root
                placeholder="e.g. Sustainable Living"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Control>
          </Form.Field>
          <Form.Field name="description" className="space-y-2">
            <Form.Label className="text-sm font-medium">
              Description *
            </Form.Label>
            <MarkdownEditor
              placeholder="What is this community about?"
              value={description}
              onChange={(v) => setDescription(v)}
              rows={5}
            />
          </Form.Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Box className="space-y-2">
              <Text size="2" weight="medium" className="block">
                Community photo *
              </Text>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={submitting}
                  onChange={(e) => {
                    handleCommunityImageChange(e.target.files?.[0], "avatar");
                    e.target.value = "";
                  }}
                />
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Community photo preview"
                    className="h-32 w-32 rounded-full object-cover ring-1 ring-[var(--gray-6)]"
                  />
                ) : (
                  <span className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-[var(--gray-7)] text-sm font-medium text-[var(--gray-11)]">
                    Choose photo
                  </span>
                )}
              </label>
            </Box>
            <Box className="space-y-2">
              <Text size="2" weight="medium" className="block">
                Banner image *
              </Text>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={submitting}
                  onChange={(e) => {
                    handleCommunityImageChange(e.target.files?.[0], "cover");
                    e.target.value = "";
                  }}
                />
                {coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Community banner preview"
                    className="h-32 w-full rounded-lg object-cover ring-1 ring-[var(--gray-6)]"
                  />
                ) : (
                  <span className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-[var(--gray-7)] text-sm font-medium text-[var(--gray-11)]">
                    Choose banner
                  </span>
                )}
              </label>
            </Box>
          </div>
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
          <div className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Community Rules
            </Text>
            {rules.map((rule, i) => (
              <Flex key={i} gap="2" align="center">
                <Text size="2" className="flex-1">
                  {i + 1}. {rule}
                </Text>
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => setRules(rules.filter((_, j) => j !== i))}
                >
                  <Cross2Icon />
                </Button>
              </Flex>
            ))}
            {rules.length < 10 && (
              <Flex gap="2">
                <TextField.Root
                  placeholder="Add a rule..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="2"
                  variant="soft"
                  onClick={handleAddRule}
                >
                  Add
                </Button>
              </Flex>
            )}
          </div>
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
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Community"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

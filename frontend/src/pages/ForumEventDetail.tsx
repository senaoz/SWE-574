import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Badge,
  Button,
  Heading,
  Tooltip,
  Dialog,
  Box,
  Grid,
  Switch,
  TextField,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import {
  ArrowLeftIcon,
  CalendarIcon,
  GlobeIcon,
  Link2Icon,
  PersonIcon,
  CheckCircledIcon,
  Pencil1Icon,
  TrashIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { forumApi, getImageUrl, uploadApi, communityApi } from "@/services/api";
import { ForumEvent, TagEntity, Community } from "@/types";
import { ClickableTag } from "@/components/ui/ClickableTag";
import { UpvoteButton } from "@/components/ui/UpvoteButton";
import { useUser } from "@/App";
import ReactMarkdown from "react-markdown";
import { MarkdownEditor } from "@/components/forms/MarkdownEditor";
import { TagAutocomplete } from "@/components/forms/TagAutocomplete";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CommentSection } from "@/components/ui/CommentSection";

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

type Attendee = {
  _id: string;
  username: string;
  full_name?: string;
  profile_picture?: string;
};

export function ForumEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUserId } = useUser();
  const [event, setEvent] = useState<ForumEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendToggling, setAttendToggling] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isAttending =
    event?.attendee_ids?.includes(currentUserId || "") ?? false;
  const isOwner = !!currentUserId && event?.user_id === currentUserId;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [eRes, aRes] = await Promise.all([
          forumApi.getEvent(id),
          forumApi.getEventAttendees(id),
        ]);
        setEvent(eRes.data);
        setAttendees(aRes.data);
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleToggleAttend = async () => {
    if (!id || attendToggling) return;
    setAttendToggling(true);
    try {
      if (isAttending) {
        const res = await forumApi.unattendEvent(id);
        setEvent(res.data);
      } else {
        const res = await forumApi.attendEvent(id);
        setEvent(res.data);
      }
      const aRes = await forumApi.getEventAttendees(id);
      setAttendees(aRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAttendToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await forumApi.deleteEvent(id);
    navigate("/forum?tab=events");
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
        <div className="flex justify-between">
          <Heading size="5">{event.title}</Heading>
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
              count={event.upvote_count ?? 0}
              upvoted={event.user_upvoted}
              onUpvote={
                currentUserId
                  ? () => forumApi.upvoteEvent(id!).then((r) => r.data)
                  : undefined
              }
              disabled={!currentUserId}
              showLoginHint={!currentUserId}
            />
          </Flex>
        </div>
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

        {event.image_urls && event.image_urls.length > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {event.image_urls.map((url, i) => (
              <img
                key={i}
                src={getImageUrl(url) ?? url}
                alt={`Event image ${i + 1}`}
                className="rounded-lg object-cover h-48 w-auto max-w-full"
              />
            ))}
          </div>
        )}

        <div className="prose-content mb-4">
          <ReactMarkdown
            components={{
              a: ({ node: _node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {event.description}
          </ReactMarkdown>
        </div>

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

        {event.community_id && (
          <RelatedCommunityBlock communityId={event.community_id} />
        )}

        {/* Attending section */}
        <div className="mt-8 border-t pt-4">
          <Flex justify="between" align="center" className="mb-3">
            <Flex align="center" gap="2">
              <PersonIcon className="w-5 h-5" />
              <Text size="3" weight="bold">
                Attendees ({event.attendee_count})
              </Text>
            </Flex>
            {currentUserId && (
              <Tooltip content={isAttending ? "Leave event" : "Join event"}>
                <Button
                  variant={isAttending ? "soft" : "solid"}
                  color={isAttending ? "green" : "purple"}
                  onClick={handleToggleAttend}
                  disabled={attendToggling}
                  size="2"
                >
                  {isAttending ? (
                    <>
                      <CheckCircledIcon className="w-4 h-4 mr-1" />
                      {attendToggling ? "Leaving..." : "Attending"}
                    </>
                  ) : (
                    <>
                      <PersonIcon className="w-4 h-4 mr-1" />
                      {attendToggling ? "Joining..." : "Attend"}
                    </>
                  )}
                </Button>
              </Tooltip>
            )}
          </Flex>

          {attendees.length > 0 ? (
            <Flex align="center" gap="2" wrap="wrap">
              {attendees.slice(0, 10).map((a) => (
                <Tooltip key={a._id} content={a.full_name || a.username}>
                  <Avatar
                    fallback={a.full_name?.[0] || a.username[0]}
                    src={getImageUrl(a.profile_picture)}
                    size="3"
                    className="cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                    onClick={() => navigate(`/user/${a._id}`)}
                  />
                </Tooltip>
              ))}
              {attendees.length > 10 && (
                <Tooltip content={`${attendees.length - 10} more attendees`}>
                  <Avatar
                    size="3"
                    fallback={`+${attendees.length - 10}`}
                    className="cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all bg-gray-100"
                  />
                </Tooltip>
              )}
            </Flex>
          ) : (
            <Text size="2" color="gray">
              No one is attending yet. Be the first!
            </Text>
          )}
        </div>
      </Card>

      <CommentSection
        fetchComments={() =>
          forumApi.getComments("event", id!).then((r) => r.data.comments)
        }
        postComment={(content, imageUrls) =>
          forumApi
            .createComment({
              target_type: "event",
              target_id: id!,
              content,
              ...(imageUrls ? { image_urls: imageUrls } : {}),
            })
            .then((r) => r.data)
        }
        placeholder="Write a comment..."
        emptyMessage="No comments yet. Be the first!"
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

      {event && (
        <>
          <EditEventDialog
            open={showEdit}
            onOpenChange={setShowEdit}
            event={event}
            onUpdated={(updated) => setEvent(updated)}
          />
          <ConfirmDialog
            open={showDelete}
            onOpenChange={setShowDelete}
            title="Delete Event"
            description="Are you sure you want to delete this event? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={handleDelete}
          />
        </>
      )}
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
      onClick={() => navigate(`/forum/communities/${community._id}`)}
      className="hover-card cursor-pointer"
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

function EditEventDialog({
  open,
  onOpenChange,
  event,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event: ForumEvent;
  onUpdated: (updated: ForumEvent) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [eventDate, setEventDate] = useState(
    event.event_at ? event.event_at.slice(0, 10) : "",
  );
  const [eventTime, setEventTime] = useState(
    event.event_at ? event.event_at.slice(11, 16) : "",
  );
  const [locationValue, setLocationValue] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  }>({
    latitude: event.latitude ?? 0,
    longitude: event.longitude ?? 0,
    address: event.location ?? "",
  });
  const [isRemote, setIsRemote] = useState(event.is_remote);
  const [tags, setTags] = useState<TagEntity[]>(event.tags ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    event.image_urls ?? [],
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (existingImageUrls.length + imageFiles.length >= 3) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setError("");
    setImageFiles((prev) => [...prev, file]);
    setImagePreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    e.target.value = "";
  };
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset when event changes or dialog reopens
  useEffect(() => {
    if (open) {
      setTitle(event.title);
      setDescription(event.description);
      setEventDate(event.event_at ? event.event_at.slice(0, 10) : "");
      setEventTime(event.event_at ? event.event_at.slice(11, 16) : "");
      setLocationValue({
        latitude: event.latitude ?? 0,
        longitude: event.longitude ?? 0,
        address: event.location ?? "",
      });
      setIsRemote(event.is_remote);
      setTags(event.tags ?? []);
      setExistingImageUrls(event.image_urls ?? []);
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviewUrls([]);
      setError("");
    }
  }, [open, event]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !eventDate || !eventTime) {
      setError("Title, description, date, and time are required");
      return;
    }
    const eventAt = new Date(`${eventDate}T${eventTime}`).toISOString();
    setSubmitting(true);
    const uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      setImageUploading(true);
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
      setImageUploading(false);
    }
    try {
      const res = await forumApi.updateEvent(event._id, {
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
        image_urls: [...existingImageUrls, ...uploadedUrls],
      });
      onUpdated(res.data);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-4xl" aria-describedby={undefined}>
        <Dialog.Title>Edit Event</Dialog.Title>
        <Form.Root
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
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
              />
            </Form.Control>
          </Form.Field>
          <Form.Field name="description" className="space-y-2">
            <Form.Label className="text-sm font-medium">
              Description *
            </Form.Label>
            <MarkdownEditor
              placeholder="Describe the event..."
              value={description}
              onChange={(value) => setDescription(value)}
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
                  />
                </Form.Control>
              </Form.Field>
              <Form.Field name="event_time" className="space-y-2">
                <Form.Control asChild>
                  <TextField.Root
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
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
          <Box className="space-y-2">
            <Text size="2" weight="medium" className="block">
              Event images
            </Text>
            {existingImageUrls.length + imageFiles.length < 3 && (
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
            {existingImageUrls.length > 0 && (
              <Flex gap="2" wrap="wrap" className="border rounded-lg p-2">
                {existingImageUrls.map((url, i) => (
                  <Box key={i} className="relative">
                    <img
                      src={getImageUrl(url) ?? url}
                      alt={`Image ${i + 1}`}
                      className="rounded-lg object-cover h-24 w-24"
                    />
                    <Button
                      type="button"
                      size="1"
                      variant="solid"
                      color="red"
                      className="!absolute top-1 right-1 !p-1 w-5 h-5 cursor-pointer"
                      onClick={() =>
                        setExistingImageUrls((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                    >
                      ×
                    </Button>
                  </Box>
                ))}
              </Flex>
            )}
            {imagePreviewUrls.length > 0 && (
              <Flex gap="2" wrap="wrap" className="border rounded-lg p-2">
                {imagePreviewUrls.map((url, i) => (
                  <Box key={i} className="relative">
                    <img
                      src={url}
                      alt={`New image ${i + 1}`}
                      className="rounded-lg object-cover h-24 w-24"
                    />
                    <Button
                      type="button"
                      size="1"
                      variant="solid"
                      color="red"
                      className="!absolute top-1 right-1 !p-1 w-5 h-5 cursor-pointer"
                      onClick={() => removeNewImage(i)}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
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
                {imageUploading
                  ? "Uploading..."
                  : submitting
                    ? "Saving..."
                    : "Save Changes"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

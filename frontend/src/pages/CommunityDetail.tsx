import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Text, Flex, Avatar, Button, Heading,
  Badge, Dialog, TextField, Box,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import {
  ArrowLeftIcon, PlusIcon, Pencil1Icon,
  TrashIcon, ChevronUpIcon,
} from "@radix-ui/react-icons";
import { MessageCircleIcon, UsersIcon, PinIcon } from "lucide-react";
import { communityApi, getImageUrl, uploadApi } from "@/services/api";
import { useUser } from "@/App";
import { Community, CommunityMember, CommunityPost, TagEntity, ForumEvent, ForumDiscussion } from "@/types";
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
  return new Date(dateStr).toLocaleDateString("en-GB");
}

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUserId } = useUser();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [, setPostsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postSort, setPostSort] = useState<"created_at" | "upvote_count">("created_at");
  const [showNewPost, setShowNewPost] = useState(false);
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const [showDeleteCommunity, setShowDeleteCommunity] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [communityEvents, setCommunityEvents] = useState<ForumEvent[]>([]);
  const [communityDiscussions, setCommunityDiscussions] = useState<ForumDiscussion[]>([]);

  const isMember = !!community?.user_membership;
  const isMod = community?.user_membership === "founder" || community?.user_membership === "moderator";
  const isFounder = community?.user_membership === "founder";

  useEffect(() => {
    if (!id) return;
    loadCommunity();
    communityApi.getEventsByCommunity(id).then(r => setCommunityEvents(r.data.events)).catch(() => {});
    communityApi.getDiscussionsByCommunity(id).then(r => setCommunityDiscussions(r.data.discussions)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadPosts();
  }, [id, postSort]);

  const loadCommunity = async () => {
    setLoading(true);
    try {
      const res = await communityApi.getCommunity(id!);
      setCommunity(res.data);
    } catch {
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await communityApi.getPosts(id!, { sort_by: postSort });
      setPosts(res.data.posts);
      setPostsTotal(res.data.total);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUserId) return;
    setMembershipLoading(true);
    try {
      const res = await communityApi.joinCommunity(id!);
      setCommunity(res.data);
    } catch (e: any) {
      console.error(e?.response?.data?.detail);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserId) return;
    setMembershipLoading(true);
    try {
      const res = await communityApi.leaveCommunity(id!);
      setCommunity(res.data);
    } catch (e: any) {
      console.error(e?.response?.data?.detail);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    await communityApi.deleteCommunity(id!);
    navigate("/forum?tab=communities");
  };

  const loadMembers = async () => {
    if (!id) return;
    setMembersLoading(true);
    setMembersError("");
    try {
      const res = await communityApi.getMembers(id);
      setMembers(res.data.members);
    } catch (e: any) {
      setMembers([]);
      setMembersError(e?.response?.data?.detail || "Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  };

  const openMembersDialog = () => {
    setShowMembers(true);
    void loadMembers();
  };

  if (loading) {
    return <Card className="p-8 text-center"><Text color="gray">Loading...</Text></Card>;
  }

  if (!community) {
    return <div><Text color="red">Community not found.</Text></div>;
  }

  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/forum?tab=communities")}>
        <ArrowLeftIcon /> Back to Communities
      </Button>

      {/* Community header */}
      <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-[var(--grass-3)]">
        {community.cover_image_url ? (
          <img
            src={getImageUrl(community.cover_image_url) ?? community.cover_image_url}
            alt={`${community.name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UsersIcon className="h-12 w-12 text-[var(--grass-9)]" />
          </div>
        )}
      </div>

      <Card className="p-6 mb-6">
        <Flex gap="4" align="start">
          <Avatar
            size="6"
            src={getImageUrl(community.avatar_url) ?? undefined}
            fallback={community.name[0]}
            radius="full"
          />
          <div className="flex-1">
            <Flex justify="between" align="start" wrap="wrap" gap="2">
              <div>
                <Heading size="6">{community.name}</Heading>
                <Flex gap="2" align="center" className="mt-1">
                  <Text size="2" color="gray">
                    Founded by {community.founder?.full_name || community.founder?.username || "Unknown"}
                  </Text>
                  <Text size="2" color="gray">· {timeAgo(community.created_at)}</Text>
                </Flex>
              </div>
              <Flex gap="2" align="center">
                <Button size="2" variant="soft" color="gray" onClick={openMembersDialog}>
                  <UsersIcon className="w-3 h-3 mr-1" /> {community.member_count} members
                </Button>
                <Badge size="2" variant="soft" color="gray">
                  <MessageCircleIcon className="w-3 h-3 mr-1" /> {community.post_count} posts
                </Badge>
                {/* Join/Leave */}
                {currentUserId && !isMember && (
                  <Button size="2" onClick={handleJoin} disabled={membershipLoading}>
                    {membershipLoading ? "Joining..." : "Join"}
                  </Button>
                )}
                {currentUserId && isMember && !isFounder && (
                  <Button size="2" variant="soft" color="gray" onClick={handleLeave} disabled={membershipLoading}>
                    {membershipLoading ? "Leaving..." : "Leave"}
                  </Button>
                )}
                {/* Founder controls */}
                {isFounder && (
                  <>
                    <Button size="2" variant="soft" color="gray" onClick={() => setShowEditCommunity(true)}>
                      <Pencil1Icon /> Edit
                    </Button>
                    <Button size="2" variant="soft" color="red" onClick={() => setShowDeleteCommunity(true)}>
                      <TrashIcon /> Delete
                    </Button>
                  </>
                )}
              </Flex>
            </Flex>

            <Text size="2" className="mt-3 block">{community.description}</Text>

            {community.tags && community.tags.length > 0 && (
              <Flex gap="2" className="mt-3" wrap="wrap">
                {community.tags.map((tag, i) => (
                  <ClickableTag key={i} tag={tag} size="1" />
                ))}
              </Flex>
            )}

            {community.rules && community.rules.length > 0 && (
              <div className="mt-4 p-3 bg-[var(--gray-2)] rounded-lg">
                <Text size="2" weight="bold" className="block mb-2">Community Rules</Text>
                {community.rules.map((rule, i) => (
                  <Text key={i} size="2" color="gray" className="block">
                    {i + 1}. {rule}
                  </Text>
                ))}
              </div>
            )}
          </div>
        </Flex>
      </Card>

      {/* Posts section */}
      <Flex justify="between" align="center" className="mb-4">
        <Flex gap="2" align="center">
          <Text size="2" color="gray">Sort:</Text>
          <Button size="1" variant={postSort === "created_at" ? "solid" : "soft"} onClick={() => setPostSort("created_at")}>
            Latest
          </Button>
          <Button size="1" variant={postSort === "upvote_count" ? "solid" : "soft"} onClick={() => setPostSort("upvote_count")}>
            <ChevronUpIcon /> Most Upvoted
          </Button>
        </Flex>
        {isMember && (
          <Button onClick={() => setShowNewPost(true)}>
            <PlusIcon /> New Post
          </Button>
        )}
      </Flex>

      {!isMember && currentUserId && (
        <Card className="p-4 mb-4 border-dashed">
          <Text size="2" color="gray" align="center" className="block">
            Join this community to create posts and leave comments.
          </Text>
        </Card>
      )}

      {postsLoading ? (
        <Card className="p-8 text-center"><Text color="gray">Loading posts...</Text></Card>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center"><Text color="gray">No posts yet. Be the first!</Text></Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card
              key={post._id}
              className="hover-card cursor-pointer"
              size="3"
              onClick={() => navigate(`/forum/communities/${id}/posts/${post._id}`)}
            >
              <Flex gap="3" align="start">
                <Avatar
                  size="3"
                  src={getImageUrl(post.user?.profile_picture)}
                  fallback={post.user?.full_name?.[0] || post.user?.username?.[0] || "?"}
                />
                <div className="flex-1 min-w-0">
                  <Flex justify="between" align="start" gap="2">
                    <Flex gap="2" align="center">
                      {post.is_pinned && (
                        <Badge size="1" variant="soft" color="violet">
                          <PinIcon className="w-3 h-3 mr-1" /> Pinned
                        </Badge>
                      )}
                      {post.post_type === "announcement" && (
                        <Badge size="1" variant="soft" color="orange">📢 Announcement</Badge>
                      )}
                      <Text size="3" weight="bold" className="line-clamp-1">{post.title}</Text>
                    </Flex>
                    <Text size="1" color="gray" className="whitespace-nowrap">{timeAgo(post.created_at)}</Text>
                  </Flex>
                  <div className="mt-1 prose-content card-description">
                    <ReactMarkdown>{post.body}</ReactMarkdown>
                  </div>
                  <Flex gap="2" align="center" className="mt-2" wrap="wrap">
                    <Text size="1" color="gray">
                      by {post.user?.full_name || post.user?.username || "Unknown"}
                    </Text>
                    <Badge size="1" variant="soft" color="gray">
                      <MessageCircleIcon className="w-3 h-3 mr-1" />{post.comment_count}
                    </Badge>
                    <UpvoteButton count={post.upvote_count ?? 0} upvoted={post.user_upvoted} />
                    {(post.tags || []).slice(0, 3).map((tag, i) => (
                      <ClickableTag key={i} tag={tag} size="1" stopPropagation />
                    ))}
                  </Flex>
                </div>
              </Flex>
            </Card>
          ))}
        </div>
      )}

      {/* Related Events */}
      {communityEvents.length > 0 && (
        <Box mt="5">
          <Heading size="3" mb="3">Related Events</Heading>
          <Flex direction="column" gap="2">
            {communityEvents.map(ev => (
              <Card key={ev._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum/events/${ev._id}`)}>
                <Flex justify="between" align="start">
                  <Box>
                    <Text weight="bold" size="2">{ev.title}</Text>
                    <Text size="1" color="gray" ml="2">{new Date(ev.event_at).toLocaleDateString('en-GB')}</Text>
                  </Box>
                  <Badge color="blue" variant="soft" size="1">{ev.attendee_count} attending</Badge>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Box>
      )}

      {/* Related Discussions */}
      {communityDiscussions.length > 0 && (
        <Box mt="5">
          <Heading size="3" mb="3">Related Discussions</Heading>
          <Flex direction="column" gap="2">
            {communityDiscussions.map(d => (
              <Card key={d._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum/discussions/${d._id}`)}>
                <Text weight="bold" size="2">{d.title}</Text>
                <Flex gap="2" mt="1">
                  <Text size="1" color="gray">{d.comment_count} comments</Text>
                  <Text size="1" color="gray">{d.upvote_count} upvotes</Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Box>
      )}

      {/* Dialogs */}
      <CommunityMembersDialog
        open={showMembers}
        onOpenChange={setShowMembers}
        members={members}
        loading={membersLoading}
        error={membersError}
        currentUserId={currentUserId}
        onOpenUser={(userId) => {
          setShowMembers(false);
          navigate(`/user/${userId}`);
        }}
      />
      <NewPostDialog
        open={showNewPost}
        onOpenChange={setShowNewPost}
        communityId={id!}
        isMod={isMod}
        onCreated={() => loadPosts()}
      />
      <EditCommunityDialog
        open={showEditCommunity}
        onOpenChange={setShowEditCommunity}
        community={community}
        onUpdated={(c) => setCommunity(c)}
      />
      <ConfirmDialog
        open={showDeleteCommunity}
        onOpenChange={setShowDeleteCommunity}
        title="Delete Community"
        description="Are you sure you want to delete this community? All posts and comments will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteCommunity}
      />
    </div>
  );
}

// ─── Members Dialog ───────────────────────────────────────────

function CommunityMembersDialog({
  open,
  onOpenChange,
  members,
  loading,
  error,
  currentUserId,
  onOpenUser,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  members: CommunityMember[];
  loading: boolean;
  error: string;
  currentUserId: string | null;
  onOpenUser: (userId: string) => void;
}) {
  const mutualText = (member: CommunityMember) => {
    const isCurrentUser = member.user_id === currentUserId || member.user?.id === currentUserId;
    if (isCurrentUser) return "You";
    const count = member.mutual_community_count ?? 0;
    return `${count} common ${count === 1 ? "community" : "communities"}`;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-lg" aria-describedby={undefined}>
        <Dialog.Title>Community Members</Dialog.Title>
        <div className="mt-4 space-y-3">
          {loading ? (
            <Card className="p-6 text-center">
              <Text color="gray">Loading members...</Text>
            </Card>
          ) : error ? (
            <Card className="p-6 text-center">
              <Text color="red">{error}</Text>
            </Card>
          ) : members.length === 0 ? (
            <Card className="p-6 text-center">
              <Text color="gray">No members found.</Text>
            </Card>
          ) : (
            members.map((member) => {
              const userId = member.user?.id || member.user_id;
              const displayName =
                member.user?.full_name || member.user?.username || "Unknown member";
              return (
                <Card
                  key={member._id}
                  className={userId ? "hover-card cursor-pointer" : ""}
                  onClick={() => userId && onOpenUser(userId)}
                >
                  <Flex gap="3" align="center" justify="between">
                    <Flex gap="3" align="center" className="min-w-0">
                      <Avatar
                        size="3"
                        src={getImageUrl(member.user?.profile_picture)}
                        fallback={displayName[0] || "?"}
                        radius="full"
                      />
                      <div className="min-w-0">
                        <Text size="2" weight="bold" className="block truncate">
                          {displayName}
                        </Text>
                        <Flex gap="2" align="center" wrap="wrap">
                          {member.user?.username && (
                            <Text size="1" color="gray">
                              @{member.user.username}
                            </Text>
                          )}
                          <Text size="1" color="gray">
                            {mutualText(member)}
                          </Text>
                        </Flex>
                      </div>
                    </Flex>
                    <Badge size="1" variant="soft" color={member.role === "founder" ? "violet" : "gray"}>
                      {member.role === "founder"
                        ? "Founder"
                        : member.role === "moderator"
                          ? "Mod"
                          : "Member"}
                    </Badge>
                  </Flex>
                </Card>
              );
            })
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

// ─── New Post Dialog ───────────────────────────────────────────

function NewPostDialog({
  open, onOpenChange, communityId, isMod, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  communityId: string;
  isMod: boolean;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [postType, setPostType] = useState<"post" | "announcement">("post");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setTitle(""); setBody(""); setTags([]); setPostType("post"); setError(""); };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and body are required"); return; }
    setSubmitting(true);
    try {
      await communityApi.createPost(communityId, { title, body, tags, post_type: postType });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
        <Dialog.Title>New Post</Dialog.Title>
        <Form.Root onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4 mt-4">
          <Form.Field name="title" className="space-y-2">
            <Form.Label className="text-sm font-medium">Title *</Form.Label>
            <Form.Control asChild>
              <TextField.Root placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Control>
          </Form.Field>
          <Form.Field name="body" className="space-y-2">
            <Form.Label className="text-sm font-medium">Body *</Form.Label>
            <MarkdownEditor placeholder="Write your post..." value={body} onChange={(v) => setBody(v)} rows={6} />
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
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Post"}</Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

// ─── Edit Community Dialog ───────────────────────────────────────────

function EditCommunityDialog({
  open, onOpenChange, community, onUpdated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  community: Community;
  onUpdated: (c: Community) => void;
}) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [rules, setRules] = useState<string[]>(community.rules ?? []);
  const [newRule, setNewRule] = useState("");
  const [tags, setTags] = useState<TagEntity[]>(community.tags ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(community.name);
      setDescription(community.description);
      setRules(community.rules ?? []);
      setTags(community.tags ?? []);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreviewUrl(null);
      setCoverPreviewUrl(null);
      setError("");
    }
  }, [open, community]);

  const resetImageSelections = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreviewUrl(null);
    setCoverPreviewUrl(null);
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
    if (!name.trim() || !description.trim()) { setError("Name and description are required"); return; }
    setSubmitting(true);
    try {
      const avatarUrl = avatarFile
        ? (await uploadApi.uploadCommunityImage(avatarFile)).data.url
        : community.avatar_url;
      const coverUrl = coverFile
        ? (await uploadApi.uploadCommunityImage(coverFile)).data.url
        : community.cover_image_url;
      const res = await communityApi.updateCommunity(community._id, {
        name,
        description,
        rules,
        tags,
        avatar_url: avatarUrl,
        cover_image_url: coverUrl,
      });
      resetImageSelections();
      onUpdated(res.data);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to update community");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) resetImageSelections(); onOpenChange(o); }}>
      <Dialog.Content className="max-w-2xl" aria-describedby={undefined}>
        <Dialog.Title>Edit Community</Dialog.Title>
        <Form.Root onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4 mt-4">
          <Form.Field name="name" className="space-y-2">
            <Form.Label className="text-sm font-medium">Name *</Form.Label>
            <Form.Control asChild>
              <TextField.Root value={name} onChange={(e) => setName(e.target.value)} />
            </Form.Control>
          </Form.Field>
          <Form.Field name="description" className="space-y-2">
            <Form.Label className="text-sm font-medium">Description *</Form.Label>
            <MarkdownEditor value={description} onChange={(v) => setDescription(v)} rows={5} />
          </Form.Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Box className="space-y-2">
              <Text size="2" weight="medium" className="block">Community photo</Text>
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
                <Avatar
                  size="6"
                  src={avatarPreviewUrl || getImageUrl(community.avatar_url)}
                  fallback={name[0] || community.name[0]}
                  radius="full"
                  className="ring-1 ring-[var(--gray-6)]"
                />
              </label>
            </Box>
            <Box className="space-y-2">
              <Text size="2" weight="medium" className="block">Banner image</Text>
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
                {coverPreviewUrl || community.cover_image_url ? (
                  <img
                    src={coverPreviewUrl || getImageUrl(community.cover_image_url) || community.cover_image_url}
                    alt="Community banner preview"
                    className="h-28 w-full rounded-lg object-cover ring-1 ring-[var(--gray-6)]"
                  />
                ) : (
                  <span className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-[var(--gray-7)] text-sm font-medium text-[var(--gray-11)]">
                    Choose banner
                  </span>
                )}
              </label>
            </Box>
          </div>
          <Form.Field name="tags" className="space-y-1">
            <Form.Label className="text-sm font-medium">Tags</Form.Label>
            <TagAutocomplete tags={tags} onTagAdd={(t) => setTags([...tags, t])} onTagRemove={(t) => setTags(tags.filter((x) => x.label !== t.label))} />
          </Form.Field>
          <div className="space-y-2">
            <Text size="2" weight="medium" className="block">Rules</Text>
            {rules.map((rule, i) => (
              <Flex key={i} gap="2" align="center">
                <Text size="2" className="flex-1">{i + 1}. {rule}</Text>
                <Button type="button" size="1" variant="ghost" color="red" onClick={() => setRules(rules.filter((_, j) => j !== i))}>✕</Button>
              </Flex>
            ))}
            {rules.length < 10 && (
              <Flex gap="2">
                <TextField.Root placeholder="New rule..." value={newRule} onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const r = newRule.trim(); if (r) { setRules([...rules, r]); setNewRule(""); } } }}
                  className="flex-1" />
                <Button type="button" size="2" variant="soft" onClick={() => { const r = newRule.trim(); if (r) { setRules([...rules, r]); setNewRule(""); } }}>Add</Button>
              </Flex>
            )}
          </div>
          {error && <Text size="2" color="red">{error}</Text>}
          <Flex justify="end" gap="3">
            <Button type="button" variant="soft" color="gray" onClick={() => { resetImageSelections(); onOpenChange(false); }}>Cancel</Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Badge,
  Button,
  Heading,
  Box,
  TextField,
  TextArea,
  Grid,
  Tabs,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  Crosshair1Icon,
  Pencil1Icon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import {
  SocialLinks,
  RatingDetailed,
  TimeBankResponse,
} from "@/types";
import { usersApi, ratingsApi, uploadApi, getImageUrl, servicesApi, joinRequestsApi, transactionsApi } from "@/services/api";
import { ActivitySummarySection } from "@/components/ui/ActivitySummarySection";
import { useUser } from "@/contexts/UserContext";
import { MyServices } from "./MyServices";
import { BadgeDisplay } from "@/components/ui/BadgeDisplay";
import { RatingStars } from "@/components/ui/RatingStars";
import { InterestSelector } from "@/components/ui/InterestSelector";
import { InterestChip } from "@/components/ui/InterestChip";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { PROFILE_PICTURE_PRESETS } from "@/constants/profilePicturePresets";
import {
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Globe,
  Briefcase,
  BookmarkIcon,
  ClockIcon,
  LucideList,
  UserIcon,
  LucideBriefcase,
  LucideMessageCircle,
  ActivityIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Chat } from "./Chat";

export function Profile() {
  const navigate = useNavigate();
  const { user, isLoading, refetchUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    location: { latitude: 0, longitude: 0, address: "" },
    email: "",
    profile_picture: "",
    social_links: {
      linkedin: "",
      github: "",
      twitter: "",
      instagram: "",
      website: "",
      portfolio: "",
    } as SocialLinks,
    interests: [] as string[],
  });
  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(
    null,
  );
  const [myservicesCounts, setMyservicesCounts] = useState({
    services: 0,
    applications: 0,
    timebank: 0,
    requests: 0,
    transactions: 0,
    saved: 0,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const profileTabFromUrl = searchParams.get("tab") || "profile";
  const profileStatusFromUrl = searchParams.get("status") || undefined;
  const highlightServiceId = searchParams.get("highlight") || undefined;
  const selectInterests = searchParams.get("interests") || undefined;

  const allowedTabs = [
    "profile",
    "services",
    "applications",
    "timebank",
    "saved",
    "chat",
    "activity",
  ] as const;
  const profileTab = allowedTabs.includes(profileTabFromUrl as any)
    ? profileTabFromUrl
    : "profile";

  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([profileTab]),
  );

  const setProfileTab = (tab: string) => {
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", tab);
      if (tab !== "services") p.delete("status");
      return p;
    });
  };

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(profileTab)) return prev;
      const next = new Set(prev);
      next.add(profileTab);
      return next;
    });
  }, [profileTab]);

  useEffect(() => {
    if (selectInterests && selectInterests === "true") {
      setShowInterestSelector(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("interests");
        return next;
      });
    }
  }, [selectInterests, setSearchParams]);

  // Sync edit form and settings when context user loads or updates
  useEffect(() => {
    if (!user) return;
    setEditForm({
      full_name: user.full_name || "",
      bio: user.bio || "",
      location: {
        latitude: (user.location as any)?.latitude || 0,
        longitude: (user.location as any)?.longitude || 0,
        address:
          typeof user.location === "string"
            ? user.location
            : (user.location as any)?.address || "",
      },
      email: user.email || "",
      profile_picture: user.profile_picture || "",
      social_links: {
        linkedin: user.social_links?.linkedin || "",
        github: user.social_links?.github || "",
        twitter: user.social_links?.twitter || "",
        instagram: user.social_links?.instagram || "",
        website: user.social_links?.website || "",
        portfolio: user.social_links?.portfolio || "",
      },
      interests: user.interests || [],
    });
  }, [user]);

  const { data: ratingsData } = useQuery({
    queryKey: ["user-ratings", user?._id],
    queryFn: () => ratingsApi.getUserRatings(user!._id, 1, 1),
    enabled: !!user?._id,
  });
  const averageRating = ratingsData?.data?.average_score ?? null;
  const ratingCount = ratingsData?.data?.total ?? 0;

  const { data: detailedRatingsData, isLoading: detailedRatingsLoading } =
    useQuery({
      queryKey: ["user-ratings-detailed", user?._id],
      queryFn: () => ratingsApi.getUserRatingsDetailed(user!._id, 1, 10),
      enabled: !!user?._id,
    });
  const detailedRatings: RatingDetailed[] =
    detailedRatingsData?.data?.ratings ?? [];

  const { data: userCommunitiesData, isLoading: userCommunitiesLoading } =
    useQuery({
      queryKey: ["my-communities-profile", user?._id],
      queryFn: () => usersApi.getUserCommunities(user!._id),
      enabled: !!user?._id,
      staleTime: 2 * 60 * 1000,
    });
  const userCommunities = userCommunitiesData?.data?.communities ?? [];

  const { data: eagerTimebankData } = useQuery({
    queryKey: ["my-timebank"],
    queryFn: () => usersApi.getTimeBank().then((r) => r.data as TimeBankResponse),
    enabled: !!user?._id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: eagerStatsData } = useQuery({
    queryKey: ["profile-header-stats", user?._id],
    queryFn: async () => {
      const [servicesRes, requestsRes] = await Promise.all([
        servicesApi.getServices({ user_id: user!._id, page: 1, limit: 1 }),
        joinRequestsApi.getMyRequests(1, 1),
      ]);
      return {
        services: servicesRes.data.total ?? 0,
        requests: requestsRes.data.total ?? 0,
      };
    },
    enabled: !!user?._id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: myTransactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["my-transactions-activity", user?._id],
    queryFn: () => transactionsApi.getMyTransactions(1, 100).then((r) => r.data),
    enabled: !!user?._id,
    staleTime: 2 * 60 * 1000,
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const socialLinks: SocialLinks = {};
      for (const [key, val] of Object.entries(editForm.social_links)) {
        if (val && val.trim()) {
          (socialLinks as any)[key] = val.trim();
        }
      }

      const payload: any = {
        full_name: editForm.full_name,
        bio: editForm.bio,
        location: editForm.location.address || undefined,
        profile_picture: editForm.profile_picture || undefined,
        social_links:
          Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        interests:
          editForm.interests.length > 0 ? editForm.interests : undefined,
      };

      await usersApi.updateProfile(payload);
      refetchUser();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: {
          latitude: (user.location as any)?.latitude || 0,
          longitude: (user.location as any)?.longitude || 0,
          address:
            typeof user.location === "string"
              ? user.location
              : (user.location as any)?.address || "",
        },
        email: user.email || "",
        profile_picture: user.profile_picture || "",
        social_links: {
          linkedin: user.social_links?.linkedin || "",
          github: user.social_links?.github || "",
          twitter: user.social_links?.twitter || "",
          instagram: user.social_links?.instagram || "",
          website: user.social_links?.website || "",
          portfolio: user.social_links?.portfolio || "",
        },
        interests: user.interests || [],
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (field: keyof SocialLinks, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [field]: value },
    }));
  };

  const handleInterestsSave = async (selected: string[]) => {
    setEditForm((prev) => ({ ...prev, interests: selected }));
    try {
      await usersApi.updateProfile({
        interests: selected,
      } as any);
      refetchUser();
    } catch (error) {
      console.error("Error saving interests:", error);
    }
    setShowInterestSelector(false);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("interests");
      return p;
    });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading...</Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>User not found</Text>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <Tabs.Root value={profileTab} onValueChange={(v) => setProfileTab(v)}>
        <Tabs.List size="2">
          <Tabs.Trigger value="profile">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </Tabs.Trigger>
          <Tabs.Trigger value="activity">
            <ActivityIcon className="w-4 h-4 mr-2" />
            Activity
          </Tabs.Trigger>
          <Tabs.Trigger value="services">
            <LucideBriefcase className="w-4 h-4 mr-2" />
            My Services
          </Tabs.Trigger>
          <Tabs.Trigger value="applications">
            <LucideList className="w-4 h-4 mr-2" />
            My Applications
          </Tabs.Trigger>
          <Tabs.Trigger value="timebank">
            <ClockIcon className="w-4 h-4 mr-2" />
            Timebank Logs
          </Tabs.Trigger>
          <Tabs.Trigger value="saved">
            <BookmarkIcon className="w-4 h-4 mr-2" />
            Saved Items
          </Tabs.Trigger>
          <Tabs.Trigger value="chat">
            <LucideMessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Tabs.Trigger>
        </Tabs.List>

        {/* Stats strip — visible on every tab, populated from eager queries */}
        <Flex
          gap="4"
          align="center"
          wrap="wrap"
          py="3"
          px="1"
          style={{ borderBottom: "1px solid var(--gray-4)" }}
        >
          <Flex align="center" gap="2">
            <ClockIcon className="w-4 h-4 stroke-2" style={{ color: "var(--accent-11)" }} />
            <Text size="2" color="gray">Balance</Text>
            <Text size="3" weight="bold" style={{ color: "var(--accent-11)" }}>
              {user.timebank_balance.toFixed(1)} hrs
            </Text>
          </Flex>
          {(eagerStatsData?.services ?? myservicesCounts.services) > 0 && (
            <Flex align="center" gap="2">
              <Text size="2" color="gray">·</Text>
              <Text size="2" color="gray">Services</Text>
              <Text size="2" weight="bold">
                {eagerStatsData?.services ?? myservicesCounts.services}
              </Text>
            </Flex>
          )}
          {(eagerStatsData?.requests ?? myservicesCounts.requests) > 0 && (
            <Flex align="center" gap="2">
              <Text size="2" color="gray">·</Text>
              <Text size="2" color="gray">Applications</Text>
              <Text size="2" weight="bold">
                {eagerStatsData?.requests ?? myservicesCounts.requests}
              </Text>
            </Flex>
          )}
          {(eagerTimebankData?.transactions.length ?? myservicesCounts.timebank) > 0 && (
            <Flex align="center" gap="2">
              <Text size="2" color="gray">·</Text>
              <Text size="2" color="gray">Transactions</Text>
              <Text size="2" weight="bold">
                {eagerTimebankData?.transactions.length ?? myservicesCounts.timebank}
              </Text>
            </Flex>
          )}
        </Flex>

        <Box pt="5">
          {/* ── Profile Tab ── */}
          <Tabs.Content value="profile">
            <div className="grid gap-6">
              {/* Profile Information */}
              <Box>
                <Card size="4" className="p-6">
                  <Flex
                      align="center"
                      justify="between"
                      className="col-span-2 mb-4"
                  >
                    <Heading size="5">Profile Information</Heading>
                    {!isEditing ? (
                        <Button onClick={handleEdit} size="2">
                          <Pencil1Icon className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                    ) : (
                        <Flex gap="2">
                          <Button
                              onClick={handleCancel}
                              variant="soft"
                              size="2"
                          >
                            <Cross2Icon className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleSave} size="2">
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </Flex>
                    )}
                  </Flex>

                  {/* Avatar and Basic Info */}
                  <Flex align="center" gap="4">
                    <Avatar
                        src={
                          isEditing
                              ? getImageUrl(editForm.profile_picture) ||
                              undefined
                              : getImageUrl(user.profile_picture) || undefined
                        }
                        fallback={user.full_name?.[0] || user.username[0]}
                        size="6"
                    />
                    <div className="flex-1">
                      <Flex align="center" gap="2" mb="1">
                        <Heading size="4">
                          {isEditing ? (
                              <TextField.Root
                                  value={editForm.full_name}
                                  onChange={(e) =>
                                      handleInputChange(
                                          "full_name",
                                          e.target.value,
                                      )
                                  }
                                  placeholder="Full Name"
                                  size="2"
                              />
                          ) : (
                              user.full_name || user.username
                          )}
                        </Heading>
                        {user.is_verified && (
                            <CheckCircledIcon className="w-4 h-4 text-green-600" />
                        )}
                      </Flex>
                      <Text size="3" color="gray">
                        @{user.username}
                      </Text>
                      {user.is_verified && (
                          <Badge
                              color="green"
                              variant="soft"
                              size="1"
                              className="ml-2"
                          >
                            Verified User
                          </Badge>
                      )}
                    </div>
                  </Flex>




                  {/* Profile Picture: presets, upload, or URL */}
                  {isEditing && (
                      <div className="space-y-2">
                        <Text size="2" weight="bold" className="block">
                          Profile Picture
                        </Text>

                        {/* Preset avatars */}
                        <div>
                          <Text size="1" color="gray" className="block mb-2">
                            Choose a preset avatar
                          </Text>
                          <Grid columns="6" gap="2" className="max-w-md">
                            {PROFILE_PICTURE_PRESETS.map((preset) => {
                              const isSelected =
                                  editForm.profile_picture === preset.url;
                              return (
                                  <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => {
                                        handleInputChange(
                                            "profile_picture",
                                            preset.url,
                                        );
                                        setProfilePictureError(null);
                                      }}
                                      className={`rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-9 ${
                                          isSelected
                                              ? "ring-2 ring-cyan-9 ring-offset-2 ring-offset-gray-1 dark:ring-offset-gray-2"
                                              : "hover:opacity-90"
                                      }`}
                                      title={preset.name}
                                  >
                                    <Avatar
                                        src={preset.url}
                                        fallback={preset.name[0]}
                                        size="3"
                                        radius="full"
                                        className="w-full aspect-square"
                                    />
                                  </button>
                              );
                            })}
                          </Grid>
                        </div>

                        <Text size="1" color="gray" className="block mt-6">
                          Or upload your own:
                        </Text>
                        <Flex gap="2" align="center" wrap="wrap">
                          <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={profilePictureUploading}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const maxMb = 5;
                                  if (file.size > maxMb * 1024 * 1024) {
                                    setProfilePictureError(
                                        `File must be under ${maxMb} MB`,
                                    );
                                    return;
                                  }
                                  setProfilePictureError(null);
                                  setProfilePictureUploading(true);
                                  try {
                                    const res =
                                        await uploadApi.uploadProfilePicture(
                                            file,
                                        );
                                    handleInputChange(
                                        "profile_picture",
                                        res.data.url,
                                    );
                                  } catch (err: any) {
                                    setProfilePictureError(
                                        err.response?.data?.detail ||
                                        "Upload failed",
                                    );
                                  } finally {
                                    setProfilePictureUploading(false);
                                    e.target.value = "";
                                  }
                                }}
                            />
                            <Button
                                type="button"
                                size="2"
                                variant="soft"
                                asChild
                            >
                                <span>
                                  {profilePictureUploading
                                      ? "Uploading..."
                                      : "Upload photo"}
                                </span>
                            </Button>
                          </label>
                          <Text size="2" color="gray">
                            or paste URL:
                          </Text>
                        </Flex>
                        <TextField.Root
                            value={editForm.profile_picture}
                            onChange={(e) => {
                              handleInputChange(
                                  "profile_picture",
                                  e.target.value,
                              );
                              setProfilePictureError(null);
                            }}
                            placeholder="https://example.com/photo.jpg or /uploads/..."
                            size="2"
                        />
                        {profilePictureError && (
                            <Text size="2" color="red">
                              {profilePictureError}
                            </Text>
                        )}
                      </div>
                  )}


                  <div className="grid grid-cols-2 gap-3">
                    {/* Email */}
                    <div>
                      <Text size="2" weight="bold" mr="2">
                        Email
                      </Text>
                      {isEditing ? (
                          <TextField.Root
                              value={editForm.email}
                              onChange={(e) =>
                                  handleInputChange("email", e.target.value)
                              }
                              placeholder="Email"
                              size="2"
                          />
                      ) : (
                          <Text size="2">{user.email}</Text>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <Text size="2" weight="bold" mr="2">
                        Bio
                      </Text>
                      {isEditing ? (
                          <TextArea
                              value={editForm.bio}
                              onChange={(e) =>
                                  handleInputChange("bio", e.target.value)
                              }
                              placeholder="Tell us about yourself..."
                              size="2"
                              rows={3}
                          />
                      ) : (
                          <Text size="2">{user.bio || "No bio provided"}</Text>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <Text size="2" weight="bold" mr="2">
                        Location
                      </Text>
                      {isEditing ? (
                          <MapLocationPicker
                              value={editForm.location}
                              onChange={(loc) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    location: {
                                      latitude: loc.latitude,
                                      longitude: loc.longitude,
                                      address: loc.address || "",
                                    },
                                  }))
                              }
                              height={180}
                              markerColor="#2563eb"
                          />
                      ) : (
                          <Flex align="center" gap="2">
                            <Crosshair1Icon className="w-4 h-4" />
                            <Text size="2">
                              {typeof user.location === "string"
                                  ? user.location || "No location provided"
                                  : (user.location as any)?.address ||
                                  "No location provided"}
                            </Text>
                          </Flex>
                      )}
                    </div>

                    {/* Average Rating */}
                    <div>
                      <Text size="2" weight="bold" className="block mb-1">
                        Average Rating
                      </Text>
                      {ratingCount > 0 && averageRating != null ? (
                          <Flex align="center" gap="2">
                            <RatingStars
                                value={Math.round(averageRating * 10) / 10}
                                readonly
                                size={18}
                            />
                            <Text size="2" color="gray">
                              {averageRating.toFixed(1)} ({ratingCount} rating
                              {ratingCount !== 1 ? "s" : ""})
                            </Text>
                          </Flex>
                      ) : (
                          <Text size="2" color="gray">
                            No ratings yet
                          </Text>
                      )}
                    </div>
                    {/* Social Links */}
                    <div>
                      <Text size="2" weight="bold" className="block mb-2">
                        Social Links
                      </Text>
                      {isEditing ? (
                          <div className="space-y-2">
                            {(
                                [
                                  [
                                    "linkedin",
                                    "LinkedIn",
                                    "https://linkedin.com/in/...",
                                  ],
                                  ["github", "GitHub", "https://github.com/..."],
                                  [
                                    "twitter",
                                    "Twitter / X",
                                    "https://twitter.com/...",
                                  ],
                                  [
                                    "instagram",
                                    "Instagram",
                                    "https://instagram.com/...",
                                  ],
                                  ["website", "Website", "https://yoursite.com"],
                                  [
                                    "portfolio",
                                    "Portfolio",
                                    "https://portfolio.com",
                                  ],
                                ] as const
                            ).map(([key, label, placeholder]) => (
                                <div key={key}>
                                  <Text
                                      size="1"
                                      color="gray"
                                      className="block mb-0.5"
                                  >
                                    {label}
                                  </Text>
                                  <TextField.Root
                                      value={
                                          (editForm.social_links as any)[key] || ""
                                      }
                                      onChange={(e) =>
                                          handleSocialLinkChange(
                                              key as keyof SocialLinks,
                                              e.target.value,
                                          )
                                      }
                                      placeholder={placeholder}
                                      size="1"
                                  />
                                </div>
                            ))}
                          </div>
                      ) : (
                          <Flex gap="3" wrap="wrap">
                            {user.social_links?.linkedin && (
                                <a
                                    href={user.social_links.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="LinkedIn"
                                >
                                  <Linkedin
                                      size={20}
                                      className="text-gray-600 hover:text-blue-600 transition-colors"
                                  />
                                </a>
                            )}
                            {user.social_links?.github && (
                                <a
                                    href={user.social_links.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="GitHub"
                                >
                                  <Github
                                      size={20}
                                      className="text-gray-600 hover:text-gray-900 transition-colors"
                                  />
                                </a>
                            )}
                            {user.social_links?.twitter && (
                                <a
                                    href={user.social_links.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Twitter / X"
                                >
                                  <Twitter
                                      size={20}
                                      className="text-gray-600 hover:text-sky-500 transition-colors"
                                  />
                                </a>
                            )}
                            {user.social_links?.instagram && (
                                <a
                                    href={user.social_links.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Instagram"
                                >
                                  <Instagram
                                      size={20}
                                      className="text-gray-600 hover:text-pink-500 transition-colors"
                                  />
                                </a>
                            )}
                            {user.social_links?.website && (
                                <a
                                    href={user.social_links.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Website"
                                >
                                  <Globe
                                      size={20}
                                      className="text-gray-600 hover:text-green-600 transition-colors"
                                  />
                                </a>
                            )}
                            {user.social_links?.portfolio && (
                                <a
                                    href={user.social_links.portfolio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Portfolio"
                                >
                                  <Briefcase
                                      size={20}
                                      className="text-gray-600 hover:text-amber-600 transition-colors"
                                  />
                                </a>
                            )}
                            {!user.social_links?.linkedin &&
                                !user.social_links?.github &&
                                !user.social_links?.twitter &&
                                !user.social_links?.instagram &&
                                !user.social_links?.website &&
                                !user.social_links?.portfolio && (
                                    <Text size="2" color="gray">
                                      No social links added
                                    </Text>
                                )}
                          </Flex>
                      )}
                    </div>

                    

                    {/* Interests */}
                    <div>
                      <Flex justify="between" align="center" mb="3">
                        <Text size="2" weight="bold">
                          Interests
                        </Text>
                        <Button
                            size="1"
                            variant="soft"
                            color="lime"
                            className="rounded-full"
                            onClick={() => setShowInterestSelector(true)}
                        >
                          {(user.interests?.length || 0) > 0
                              ? "Update Interests"
                              : "Add Interests"}
                        </Button>
                      </Flex>
                      {(user.interests?.length || 0) > 0 ? (
                          <Flex gap="2" wrap="wrap">
                            {user.interests!.map((interest) => (
                                <InterestChip
                                    key={interest}
                                    name={interest}
                                    size="sm"
                                    showIcon
                                />
                            ))}
                          </Flex>
                      ) : (
                          <button
                              type="button"
                              onClick={() => setShowInterestSelector(true)}
                              className="rounded-xl border-2 border-dashed px-4 py-3 text-left text-sm transition-colors"
                              style={{
                                borderColor: "var(--gray-6)",
                                backgroundColor: "var(--gray-1)",
                                color: "var(--gray-10)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor =
                                    "var(--lime-6)";
                                e.currentTarget.style.backgroundColor =
                                    "var(--lime-2)";
                                e.currentTarget.style.color = "var(--lime-11)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor =
                                    "var(--gray-6)";
                                e.currentTarget.style.backgroundColor =
                                    "var(--gray-1)";
                                e.currentTarget.style.color = "var(--gray-10)";
                              }}
                          >
                            Add interests to help others discover you
                          </button>
                      )}
                    </div>

                    

                    {/* Communities */}
                    {(userCommunitiesLoading || userCommunities.length > 0) && (
                        <div>
                          <Flex align="center" gap="2" className="mb-2">
                            <Text size="2" weight="bold">
                              Communities
                            </Text>
                            {!userCommunitiesLoading && (
                                <Text size="1" color="gray">
                                  {userCommunities.length}
                                </Text>
                            )}
                          </Flex>
                          {userCommunitiesLoading ? (
                              <Text size="1" color="gray">
                                Loading communities...
                              </Text>
                          ) : (
                              <Flex gap="2" wrap="wrap">
                                {userCommunities.slice(0, 12).map((community) => (
                                    <button
                                        key={community._id}
                                        type="button"
                                        title={community.name}
                                        aria-label={`Open ${community.name}`}
                                        onClick={() =>
                                            navigate(`/forum/communities/${community._id}`)
                                        }
                                        className="rounded-full ring-1 ring-[var(--gray-6)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--grass-8)]"
                                    >
                                      <Avatar
                                          size="3"
                                          src={getImageUrl(community.avatar_url)}
                                          fallback={community.name[0]}
                                          radius="full"
                                      />
                                    </button>
                                ))}
                                {userCommunities.length > 12 && (
                                    <span
                                        title={`${userCommunities.length - 12} more communities`}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gray-3)] text-sm font-medium text-[var(--gray-11)] ring-1 ring-[var(--gray-6)]"
                                    >
                                  +{userCommunities.length - 12}
                                </span>
                                )}
                              </Flex>
                          )}
                        </div>
                    )}

                    

                    {/* Stats */}
                    <div className="space-y-2">
                      <Flex justify="between" align="center">
                        <Text size="2">TimeBank Balance</Text>
                        <Text size="2" weight="bold">
                          {user.timebank_balance} hours
                        </Text>
                      </Flex>
                      <Flex justify="between" align="center">
                        <Text size="2">Member Since</Text>
                        <Text size="2">
                          {new Date(user.created_at).toLocaleDateString()}
                        </Text>
                      </Flex>
                      <Flex justify="between" align="center">
                        <Text size="2">Status</Text>
                        <Badge
                            color={user.is_active ? "green" : "red"}
                            variant="soft"
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Flex>
                    </div>
                  </div>
                </Card>
              </Box>

              <BadgeDisplay />
            </div>
          </Tabs.Content>

          {/* ── My Services Tab ── */}
          <Tabs.Content value="services">
            {visitedTabs.has("services") && (
              <MyServices
                activeTab="services"
                onDataLoad={setMyservicesCounts}
                statusFilter={
                  profileTab === "services" ? profileStatusFromUrl : undefined
                }
                highlightServiceId={
                  profileTab === "services" ? highlightServiceId : undefined
                }
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="applications">
            {visitedTabs.has("applications") && (
              <MyServices
                activeTab="applications"
                onDataLoad={setMyservicesCounts}
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="timebank">
            {visitedTabs.has("timebank") && (
              <MyServices activeTab="timebank" onDataLoad={setMyservicesCounts} />
            )}
          </Tabs.Content>

          <Tabs.Content value="saved">
            {visitedTabs.has("saved") && (
              <MyServices activeTab="saved" onDataLoad={setMyservicesCounts} />
            )}
          </Tabs.Content>

          <Tabs.Content value="chat">
            {visitedTabs.has("chat") && <Chat />}
          </Tabs.Content>

          <Tabs.Content value="activity">
            {visitedTabs.has("activity") && (
              <ActivitySummarySection
                transactions={myTransactionsData?.transactions ?? []}
                ratings={detailedRatings}
                currentUserId={user._id}
                isLoading={detailedRatingsLoading || transactionsLoading}
              />
            )}
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      <InterestSelector
        open={showInterestSelector}
        onOpenChange={setShowInterestSelector}
        initialSelected={user.interests || []}
        onSave={handleInterestsSave}
      />

      {/* Rejected Requests Dialog

       <Dialog.Root
        open={showRejectedRequestsDialog}
        onOpenChange={setShowRejectedRequestsDialog}
      >
        <Dialog.Content className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <Dialog.Title>Rejected Join Requests</Dialog.Title>
          <Dialog.Description className="mb-4">
            Your join requests that have been rejected by service owners
          </Dialog.Description>

          {rejectedRequests.length === 0 ? (
            <Text color="gray">No rejected requests found.</Text>
          ) : (
            <div className="space-y-3">
              {rejectedRequests.map((request: JoinRequest) => (
                <Card key={request._id} className="p-4">
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      <div className="flex-1">
                        <Text size="3" weight="bold" className="block">
                          {request.service?.title || "Unknown Service"}
                        </Text>
                        <Text size="2" color="gray" className="block mt-1">
                          Category: {request.service?.category || "N/A"}
                        </Text>
                        {request.message && (
                          <Text size="2" className="block mt-2">
                            Your message: "{request.message}"
                          </Text>
                        )}
                      </div>
                      <Badge color="red" variant="soft">
                        Rejected
                      </Badge>
                    </Flex>
                    {request.admin_message && (
                      <Card
                        className="p-3"
                        style={{ backgroundColor: "var(--red-2)" }}
                      >
                        <Text size="2" weight="bold" className="block mb-1">
                          Reason:
                        </Text>
                        <Text size="2">{request.admin_message}</Text>
                      </Card>
                    )}
                    <Text size="1" color="gray">
                      Rejected on:{" "}
                      {new Date(request.updated_at).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </div>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              onClick={() => {
                setShowRejectedRequestsDialog(false);
              }}
            >
              Close
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
      
      
      */}
    </div>
  );
}

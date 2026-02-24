import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Badge,
  Button,
  Heading,
  Separator,
  Grid,
  Box,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  Crosshair1Icon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { User, Service } from "@/types";
import { servicesApi, usersApi } from "@/services/api";
import { OfferListingCard } from "@/components/ui/OfferListingCard";
import { BadgeDisplay } from "@/components/ui/BadgeDisplay";
import { InterestChip } from "@/components/ui/InterestChip";
import {
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Globe,
  Briefcase,
} from "lucide-react";

export function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  console.log("userId", userId);
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userResponse = await usersApi.getUserById(userId);
        setUser(userResponse.data);
        const servicesResponse = await servicesApi.getServices({
          user_id: userId,
          page: 1,
          limit: 50,
        });
        console.log("servicesResponse", servicesResponse);
        setServices(servicesResponse.data.services);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
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

  const servicesProvided = services.filter((s) => s.service_type === "offer");
  const servicesReceived = services.filter((s) => s.service_type === "need");
  const completedServices = services.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button variant="ghost" size="2" onClick={() => navigate(-1)}>
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </Button>

      <Heading size="8">User Profile</Heading>

      <Grid gap="6">
        {/* User Info Card */}
        <Box>
          <Card size="4" className="p-6">
            <Flex direction="column" gap="4">
              {/* User Avatar and Basic Info */}
              <Flex align="center" gap="4">
                <Avatar
                  src={user.profile_picture || undefined}
                  fallback={user.full_name?.[0] || user.username[0]}
                  size="6"
                />
                <div className="flex-1">
                  <Flex align="center" gap="2" mb="1">
                    <Heading size="5">
                      {user.full_name || user.username}
                    </Heading>
                    <Text size="3" color="gray">
                      @{user.username}
                    </Text>
                    {user.is_verified && (
                      <CheckCircledIcon className="w-4 h-4 text-green-600" />
                    )}
                  </Flex>
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
                  {/* Social Links */}
                  {(user.social_links?.linkedin ||
                    user.social_links?.github ||
                    user.social_links?.twitter ||
                    user.social_links?.instagram ||
                    user.social_links?.website ||
                    user.social_links?.portfolio) && (
                    <Flex
                      gap="3"
                      wrap="wrap"
                      id="social-links"
                      className="mt-2"
                    >
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
                    </Flex>
                  )}
                </div>
              </Flex>
              {/* Bio */}
              {user.bio && (
                <div>
                  <Text size="2" weight="bold" mr="2">
                    About
                  </Text>
                  <Text size="2" className="leading-relaxed">
                    {user.bio}
                  </Text>
                </div>
              )}

              {/* Location */}
              {user.location && (
                <Flex align="center" gap="2">
                  <Crosshair1Icon className="w-4 h-4" />
                  <Text size="2">{user.location}</Text>
                </Flex>
              )}

              {/* Interests */}
              {(user.interests?.length || 0) > 0 && (
                <div>
                  <Text size="2" weight="bold" className="block mb-3">
                    Interests
                  </Text>
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
                  <Text size="2">Services Provided</Text>
                  <Text size="2" weight="bold">
                    {servicesProvided.length}
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2">Services Received</Text>
                  <Text size="2" weight="bold">
                    {servicesReceived.length}
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2">Completed</Text>
                  <Text size="2" weight="bold">
                    {completedServices.length}
                  </Text>
                </Flex>
              </div>

              <Separator />

              {/* Member Since */}
              <Text size="1" color="gray">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </Flex>
          </Card>
        </Box>

        {userId && <BadgeDisplay userId={userId} />}

        {/* Services Section */}
        <div className="space-y-6">
          {/* Services Provided */}
          <div>
            <Heading size="5" mb="4">
              Services Provided
            </Heading>
            {servicesProvided.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {servicesProvided.map((service) => (
                  <OfferListingCard key={service._id} service={service} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Text color="gray">No services provided yet</Text>
              </Card>
            )}
          </div>

          {/* Services Received */}
          <div>
            <Heading size="5" mb="4">
              Services Received
            </Heading>
            {servicesReceived.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {servicesReceived.map((service) => (
                  <OfferListingCard key={service._id} service={service} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Text color="gray">No services received yet</Text>
              </Card>
            )}
          </div>
        </div>
      </Grid>
    </div>
  );
}

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
                  fallback={user.full_name?.[0] || user.username[0]}
                  size="6"
                />
                <div className="flex-1">
                  <Flex align="center" gap="2" mb="1">
                    <Heading size="5">
                      {user.full_name || user.username}
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

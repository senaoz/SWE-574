import { servicesApi } from "@/services/api";
import { Section, Button, Card, Text, Heading, Badge } from "@radix-ui/themes";
import { ClockIcon, ChatBubbleIcon, GlobeIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import { ServiceMap } from "@/components/map/ServiceMap";
import { useState, useEffect } from "react";
import { Service } from "@/types";

export function Home() {
  const navigate = useNavigate();
  const [recentOffers, setRecentOffers] = useState<Service[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const [offersResponse, needsResponse] = await Promise.all([
          servicesApi.getServices({
            service_type: "offer",
            status: "active",
            limit: 4,
          }),
          servicesApi.getServices({
            service_type: "need",
            status: "active",
            limit: 4,
          }),
        ]);

        setRecentOffers(offersResponse.data.services || []);
        setRecentNeeds(needsResponse.data.services || []);
      } catch (error) {
        console.error("Error fetching services:", error);
        setRecentOffers([]);
        setRecentNeeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <Section className="mx-auto max-w-4xl grid text-center">
        <Heading size="8" className="mb-6 ">
          A Virtual Public Space for Services
        </Heading>
        <Text size="5" className=" mb-8 max-w-2xl mx-auto">
          Exchange services, share skills, and build connections. One hour of
          your time is worth one hour of your neighbor's.
        </Text>
        <Button
          variant="solid"
          size="3"
          className="w-fit mx-auto"
          onClick={() =>
            !localStorage.getItem("access_token")
              ? navigate("/register")
              : navigate("/dashboard")
          }
        >
          Explore the Community
        </Button>
      </Section>

      {/* Community Values Section */}
      <Section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <Heading size="5" className="mb-4">
                Community-First
              </Heading>
              <Text size="4">
                Built on mutual support and shared values, not profit. Every
                contribution matters.
              </Text>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚖️</span>
              </div>
              <Heading size="5" className="mb-4">
                Equal Value
              </Heading>
              <Text size="4">
                Teaching code, sharing recipes, reading stories—all
                contributions are valued equally.
              </Text>
            </Card>
          </div>
        </div>
      </Section>

      {/* What Can You Share Section */}
      <Section>
        <div className="text-center mb-12">
          <Heading size="6" className="mb-4">
            What Can You Share?
          </Heading>
          <Text size="4" className="max-w-2xl mx-auto">
            From the practical to the profound, all offerings are welcome
          </Text>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">💻</div>
            <Text className="font-medium">Teach Programming</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🥘</div>
            <Text className="font-medium">Share Recipes</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🛒</div>
            <Text className="font-medium">Run Errands</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">📖</div>
            <Text className="font-medium">Read Stories</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🌟</div>
            <Text className="font-medium">Share Memories</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🌱</div>
            <Text className="font-medium">Garden Together</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🔧</div>
            <Text className="font-medium">Fix Things</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🐕</div>
            <Text className="font-medium">Pet Sitting</Text>
          </Card>
        </div>
      </Section>

      {/* Ready to Join Section */}
      <Section className="py-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading size="6" className="mb-4">
            Ready to Join the Community?
          </Heading>
          <Text size="4">
            Start by exploring what others are offering, or share your own
            unique skills and services
          </Text>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="solid"
              size="3"
              onClick={() =>
                !localStorage.getItem("access_token")
                  ? navigate("/register")
                  : navigate("/dashboard")
              }
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="3"
              onClick={() => navigate("/dashboard")}
            >
              Browse Services
            </Button>
          </div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Offer & Request
            </Heading>
            <Text className="">
              Post a service you can offer or a need you have. Share your skills
              and let others know what you're looking for.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Exchange Time
            </Heading>
            <Text className="">
              Connect with a member and complete the exchange. One hour = one
              TimeBank credit. Simple and fair.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GlobeIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Build Community
            </Heading>
            <Text className="">
              Use your credits to receive services and participate in our
              forums. Grow stronger together.
            </Text>
          </Card>
        </div>
      </Section>

      {/* Live Service Map Preview */}
      <Section>
        <div className="flex items-center justify-between mb-8">
          <Heading size="6" className="">
            Live Community Activity
          </Heading>
          <Badge color="green" variant="soft">
            Real-time updates
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <Heading size="4" className="mb-4">
              Recent Offers
            </Heading>
            <div className="space-y-3">
              {loading || !recentOffers ? (
                <Text>Loading recent offers...</Text>
              ) : (
                recentOffers.map((service) => (
                  <div
                    onClick={() => navigate(`/service/${service._id}`)}
                    key={service._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:cursor-pointer hover:border transition-all duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      <Text className="font-medium">{service.title}</Text>
                      <Text
                        size="2"
                        className="line-clamp-2 text-ellipsis overflow-hidden"
                      >
                        {service.description}
                      </Text>
                    </div>
                    <Badge color="green" variant="soft">
                      Offer
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <Heading size="4" className="mb-4">
              Recent Needs
            </Heading>
            <div className="space-y-3">
              {!loading && !recentNeeds ? (
                <Text>Loading recent needs...</Text>
              ) : (
                recentNeeds.map((service) => (
                  <div
                    onClick={() => navigate(`/service/${service._id}`)}
                    key={service._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:cursor-pointer hover:border transition-all duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      <Text className="font-medium ">{service.title}</Text>
                      <Text
                        size="2"
                        className="line-clamp-2 text-ellipsis overflow-hidden"
                      >
                        {service.description}
                      </Text>
                    </div>
                    <Badge color="blue" variant="soft">
                      Need
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Section>

      <ServiceMap
        services={recentOffers.concat(recentNeeds)}
        height="300px"
        sticky={false}
      />

      {/* Values/Philosophy Section */}
      <Section>
        <Heading size="6" className="mb-8 ">
          Our Values
        </Heading>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <Heading size="4" className="mb-3 ">
              Fairness
            </Heading>
            <Text className="">
              All hours are equal. Whether you're teaching, fixing, or
              listening, your time has the same value.
            </Text>
          </div>

          <div>
            <Heading size="4" className="mb-3 ">
              Inclusivity
            </Heading>
            <Text className="">
              All skills are valuable. From professional expertise to everyday
              kindness, everyone has something to offer.
            </Text>
          </div>

          <div>
            <Heading size="4" className="mb-3 ">
              Mutual Support
            </Heading>
            <Text className="">
              We are all both givers and receivers. The strongest communities
              are built on reciprocal care.
            </Text>
          </div>
        </div>
      </Section>

      {/* Community Forums Spotlight */}
      <Section className="mb-16">
        <div className="flex items-center mb-8">
          <ChatBubbleIcon className="w-6 h-6 mr-3" />
          <Heading size="6" className="">
            Community Conversations
          </Heading>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <Heading size="3" className="">
                New Member Welcome
              </Heading>
              <Badge color="blue" variant="soft">
                Active
              </Badge>
            </div>
            <Text className=" mb-4">
              "Just joined and already feeling the warmth of this community.
              Can't wait to contribute!"
            </Text>
            <div className="flex items-center text-sm">
              <Text>Sarah M. • 2 hours ago • 12 replies</Text>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <Heading size="3" className="">
                Skill Sharing Success
              </Heading>
              <Badge color="green" variant="soft">
                Popular
              </Badge>
            </div>
            <Text className=" mb-4">
              "Just completed my first exchange! Maria helped me with gardening,
              and I taught her basic coding. This system works!"
            </Text>
            <div className="flex items-center text-sm">
              <Text>Alex K. • 5 hours ago • 8 replies</Text>
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="3">
            Join the Conversation
          </Button>
        </div>
      </Section>
    </div>
  );
}
